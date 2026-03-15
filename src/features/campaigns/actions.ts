'use server'

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/database'

interface ActionResult {
  success: boolean
  error?: string
}

// --- Billing Helpers ---

interface BillingCheck {
  allowed: boolean
  error?: string
  orgId: string
  subscriptionStatus?: string
}

async function checkBillingForOrg(orgId: string): Promise<BillingCheck> {
  const serviceClient = await createServiceRoleClient()

  // Get active subscription
  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('id, status, plan_id, plans(max_contacts, max_campaigns_per_month)')
    .eq('org_id', orgId)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) {
    return {
      allowed: false,
      error: 'Voce precisa de um plano ativo para enviar campanhas. Acesse Cobranca para escolher seu plano.',
      orgId,
    }
  }

  return {
    allowed: true,
    orgId,
    subscriptionStatus: sub.status,
  }
}

async function checkCampaignLimit(orgId: string): Promise<{ allowed: boolean; error?: string }> {
  const serviceClient = await createServiceRoleClient()

  // Get subscription with plan limits
  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('plans(max_campaigns_per_month)')
    .eq('org_id', orgId)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) return { allowed: false, error: 'Sem plano ativo' }

  const plan = sub.plans as Record<string, unknown> | null
  const maxCampaigns = plan?.max_campaigns_per_month as number | null

  // null means unlimited
  if (maxCampaigns === null) return { allowed: true }

  // Count campaigns this month
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { count } = await serviceClient
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', monthStart)

  if ((count ?? 0) >= maxCampaigns) {
    return {
      allowed: false,
      error: `Limite de ${maxCampaigns} campanhas/mes atingido. Faca upgrade do seu plano para criar mais campanhas.`,
    }
  }

  return { allowed: true }
}

async function checkContactLimit(orgId: string, contactCount: number): Promise<{ allowed: boolean; error?: string }> {
  const serviceClient = await createServiceRoleClient()

  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('plans(max_contacts)')
    .eq('org_id', orgId)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) return { allowed: false, error: 'Sem plano ativo' }

  const plan = sub.plans as Record<string, unknown> | null
  const maxContacts = plan?.max_contacts as number | null

  // null means unlimited
  if (maxContacts === null) return { allowed: true }

  // Count total contacts in org
  const { count } = await serviceClient
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .is('deleted_at', null)

  const totalAfterAdd = (count ?? 0)
  if (totalAfterAdd > maxContacts) {
    return {
      allowed: false,
      error: `Seu plano permite ate ${maxContacts.toLocaleString('pt-BR')} contatos. Voce tem ${totalAfterAdd.toLocaleString('pt-BR')}. Faca upgrade para continuar.`,
    }
  }

  return { allowed: true }
}

export async function getCampaigns() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*, message_templates(name, category)')
    .order('created_at', { ascending: false })

  if (error) return { campaigns: [], error: error.message }
  return { campaigns: data ?? [] }
}

export async function getCampaignDetail(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, message_templates(name, category, body)')
    .eq('id', id)
    .single()

  if (!campaign) return null

  const { data: messages } = await supabase
    .from('message_queue')
    .select('*, contacts(name)')
    .eq('campaign_id', id)
    .order('created_at', { ascending: true })

  // Compute stats
  const stats = {
    total: messages?.length ?? 0,
    pending: messages?.filter((m) => m.status === 'pending').length ?? 0,
    sending: messages?.filter((m) => m.status === 'sending').length ?? 0,
    sent: messages?.filter((m) => m.status === 'sent').length ?? 0,
    delivered: messages?.filter((m) => m.status === 'delivered').length ?? 0,
    read: messages?.filter((m) => m.status === 'read').length ?? 0,
    failed: messages?.filter((m) => m.status === 'failed').length ?? 0,
  }

  return { campaign, messages: messages ?? [], stats }
}

interface CreateCampaignInput {
  name: string
  templateId: string
  contactIds: string[]
  variables?: Record<string, Json>
}

export async function createCampaign(input: CreateCampaignInput): Promise<ActionResult & { id?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Organização não encontrada' }

  // Billing checks: subscription active + campaign limit + contact limit
  const billingCheck = await checkBillingForOrg(member.org_id)
  if (!billingCheck.allowed) return { success: false, error: billingCheck.error }

  const campaignLimit = await checkCampaignLimit(member.org_id)
  if (!campaignLimit.allowed) return { success: false, error: campaignLimit.error }

  const contactLimit = await checkContactLimit(member.org_id, input.contactIds.length)
  if (!contactLimit.allowed) return { success: false, error: contactLimit.error }

  // Get template info and validate approval status
  const { data: template } = await supabase
    .from('message_templates')
    .select('meta_template_name, name, status')
    .eq('id', input.templateId)
    .single()

  if (!template) return { success: false, error: 'Template nao encontrado' }

  if (template.status !== 'approved') {
    const statusMsg = template.status === 'pending'
      ? 'aguardando aprovacao da Meta'
      : template.status === 'rejected'
        ? 'rejeitado pela Meta'
        : 'em rascunho (envie para aprovacao da Meta primeiro)'
    return { success: false, error: `Template "${template.name}" esta ${statusMsg}. Apenas templates aprovados podem ser usados em campanhas.` }
  }

  // Get contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, phone, name')
    .in('id', input.contactIds)

  if (!contacts || contacts.length === 0) {
    return { success: false, error: 'Nenhum contato selecionado' }
  }

  // Create campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      org_id: member.org_id,
      name: input.name,
      template_id: input.templateId,
      status: 'draft',
      total_messages: contacts.length,
    })
    .select('id')
    .single()

  if (campaignError) return { success: false, error: campaignError.message }

  // Create message queue entries
  const queueEntries = contacts.map((contact) => ({
    campaign_id: campaign.id,
    contact_id: contact.id,
    phone: contact.phone,
    template_name: template.meta_template_name || template.name,
    variables: input.variables?.[contact.id] ?? null,
    status: 'pending' as const,
  }))

  const { error: queueError } = await supabase
    .from('message_queue')
    .insert(queueEntries)

  if (queueError) return { success: false, error: queueError.message }

  revalidatePath('/campaigns')
  return { success: true, id: campaign.id }
}

export async function startCampaign(campaignId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Organização não encontrada' }

  // Billing check: subscription must be active to send messages
  const billingCheck = await checkBillingForOrg(member.org_id)
  if (!billingCheck.allowed) return { success: false, error: billingCheck.error }

  // Get WABA config
  const { data: wabaConfig } = await supabase
    .from('waba_configs')
    .select('phone_number_id, encrypted_access_token, is_connected')
    .eq('org_id', member.org_id)
    .single()

  if (!wabaConfig?.is_connected) {
    return { success: false, error: 'Configure e teste sua conta WhatsApp em Configurações primeiro' }
  }

  if (!wabaConfig.encrypted_access_token) {
    return { success: false, error: 'Token de acesso não configurado' }
  }

  // Decrypt token
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) return { success: false, error: 'Chave de criptografia não configurada' }

  const serviceClient = await createServiceRoleClient()
  const { data: decryptedToken } = await serviceClient.rpc('decrypt_text', {
    encrypted_data: wabaConfig.encrypted_access_token,
    encryption_key: encryptionKey,
  })

  if (!decryptedToken) return { success: false, error: 'Erro ao decriptar token' }

  // Verify there are pending messages
  const { count } = await supabase
    .from('message_queue')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  if (!count || count === 0) {
    return { success: false, error: 'Nenhuma mensagem pendente' }
  }

  // Update campaign status to processing
  await supabase
    .from('campaigns')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', campaignId)

  // Fire-and-forget: delegate to background job route
  const jobSecret = process.env.JOB_SECRET || process.env.ENCRYPTION_KEY
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  fetch(`${baseUrl}/api/jobs/send-campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-job-secret': jobSecret ?? '',
    },
    body: JSON.stringify({
      campaignId,
      orgId: member.org_id,
      phoneNumberId: wabaConfig.phone_number_id,
      accessToken: decryptedToken,
    }),
  }).catch((err) => {
    console.error('[startCampaign] Failed to dispatch job:', err)
  })

  revalidatePath('/campaigns')
  return { success: true }
}

const MAX_RETRY_ATTEMPTS = 3

export async function retryCampaignFailedMessages(campaignId: string): Promise<ActionResult & { retried?: number }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nao autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Organizacao nao encontrada' }

  // Billing check
  const billingCheck = await checkBillingForOrg(member.org_id)
  if (!billingCheck.allowed) return { success: false, error: billingCheck.error }

  // Get WABA config
  const { data: wabaConfig } = await supabase
    .from('waba_configs')
    .select('phone_number_id, encrypted_access_token, is_connected')
    .eq('org_id', member.org_id)
    .single()

  if (!wabaConfig?.is_connected || !wabaConfig.encrypted_access_token) {
    return { success: false, error: 'Configuracao WhatsApp nao encontrada' }
  }

  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) return { success: false, error: 'Chave de criptografia nao configurada' }

  const serviceClient = await createServiceRoleClient()
  const { data: decryptedToken } = await serviceClient.rpc('decrypt_text', {
    encrypted_data: wabaConfig.encrypted_access_token,
    encryption_key: encryptionKey,
  })

  if (!decryptedToken) return { success: false, error: 'Erro ao decriptar token' }

  // Get failed messages that haven't exceeded max retries
  const { data: failedMessages } = await supabase
    .from('message_queue')
    .select('id, phone, template_name, variables, attempts')
    .eq('campaign_id', campaignId)
    .eq('status', 'failed')
    .lt('attempts', MAX_RETRY_ATTEMPTS)
    .order('created_at')

  if (!failedMessages || failedMessages.length === 0) {
    return { success: true, retried: 0 }
  }

  // Update campaign status
  await supabase
    .from('campaigns')
    .update({ status: 'processing' })
    .eq('id', campaignId)

  let sentCount = 0
  let failedCount = 0

  for (const msg of failedMessages) {
    const attempt = (msg.attempts ?? 0) + 1
    // Exponential backoff: 1s, 4s, 9s
    const backoffMs = attempt * attempt * 1000
    await new Promise((resolve) => setTimeout(resolve, backoffMs))

    try {
      await supabase
        .from('message_queue')
        .update({ status: 'sending', attempts: attempt, error: null })
        .eq('id', msg.id)

      const response = await fetch(
        `https://graph.facebook.com/v21.0/${wabaConfig.phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: msg.phone.replace('+', ''),
            type: 'template',
            template: {
              name: msg.template_name,
              language: { code: 'pt_BR' },
              components: msg.variables
                ? [
                    {
                      type: 'body',
                      parameters: (msg.variables as string[]).map((v: string) => ({
                        type: 'text',
                        text: v,
                      })),
                    },
                  ]
                : undefined,
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        await supabase
          .from('message_queue')
          .update({
            status: 'sent',
            meta_message_id: data?.messages?.[0]?.id ?? null,
            sent_at: new Date().toISOString(),
          })
          .eq('id', msg.id)
        sentCount++
      } else {
        const errorData = await response.json()
        await supabase
          .from('message_queue')
          .update({
            status: 'failed',
            error: errorData?.error?.message || `HTTP ${response.status}`,
          })
          .eq('id', msg.id)
        failedCount++
      }
    } catch (error) {
      await supabase
        .from('message_queue')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', msg.id)
      failedCount++
    }
  }

  // Track usage for retried messages
  if (sentCount > 0) {
    try {
      await serviceClient.rpc('increment_usage', {
        p_org_id: member.org_id,
        p_count: sentCount,
      })
    } catch (usageError) {
      console.error('Failed to track retry usage:', usageError)
    }
  }

  // Update campaign final status
  const { data: remainingFailed } = await supabase
    .from('message_queue')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'failed')

  const finalStatus = (remainingFailed as unknown as { count: number })?.count > 0
    ? 'completed_with_errors'
    : 'completed'

  await supabase
    .from('campaigns')
    .update({ status: finalStatus })
    .eq('id', campaignId)

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${campaignId}`)

  return { success: true, retried: sentCount }
}

export async function cancelCampaign(campaignId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  // Cancel pending messages
  await supabase
    .from('message_queue')
    .update({ status: 'failed', error: 'Campanha cancelada' })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  // Update campaign
  await supabase
    .from('campaigns')
    .update({ status: 'cancelled', completed_at: new Date().toISOString() })
    .eq('id', campaignId)

  revalidatePath('/campaigns')
  return { success: true }
}
