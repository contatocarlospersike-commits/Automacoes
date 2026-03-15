'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isResendConfigured } from '@/lib/resend/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

interface CreateCampaignInput {
  name: string
  email_template_id: string
  from_name: string
  from_email: string
  reply_to?: string
  target_type: 'all' | 'group' | 'tag'
  target_group_id?: string
  target_tag_id?: string
}

export async function getEmailCampaigns() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*, email_templates(name, subject)')
    .order('created_at', { ascending: false })

  if (error) return { campaigns: [], error: error.message }
  return { campaigns: data ?? [] }
}

export async function createEmailCampaign(input: CreateCampaignInput): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nao autenticado' }

  const { data: member } = await supabase
    .from('org_members').select('org_id').eq('user_id', user.id).single()
  if (!member) return { success: false, error: 'Organizacao nao encontrada' }

  const { data, error } = await supabase.from('email_campaigns').insert({
    org_id: member.org_id,
    name: input.name.trim(),
    email_template_id: input.email_template_id,
    from_name: input.from_name.trim(),
    from_email: input.from_email.trim(),
    reply_to: input.reply_to?.trim() || null,
    target_type: input.target_type,
    target_group_id: input.target_group_id || null,
    target_tag_id: input.target_tag_id || null,
    status: 'draft',
  }).select('id').single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/email')
  return { success: true, id: data.id }
}

export async function sendEmailCampaign(campaignId: string): Promise<ActionResult & { sent?: number; failed?: number; simulated?: boolean }> {
  const supabase = await createServerSupabaseClient()

  // Fetch campaign + template
  const { data: campaign, error: campaignErr } = await supabase
    .from('email_campaigns')
    .select('*, email_templates(subject, html_body, from_name)')
    .eq('id', campaignId)
    .single()

  if (campaignErr || !campaign) return { success: false, error: 'Campanha nao encontrada' }
  if (campaign.status !== 'draft') return { success: false, error: 'Campanha ja foi enviada' }

  const template = campaign.email_templates as { subject: string; html_body: string; from_name: string } | null
  if (!template) return { success: false, error: 'Template nao encontrado' }

  // Resolve recipients
  let contacts: Array<{ id: string; name: string; email: string | null }> = []

  if (campaign.target_type === 'all') {
    const { data } = await supabase
      .from('contacts')
      .select('id, name, email')
      .not('email', 'is', null)
      .is('deleted_at', null)
      .is('opted_out_at', null)
    contacts = (data ?? []).filter((c) => c.email) as Array<{ id: string; name: string; email: string | null }>
  } else if (campaign.target_type === 'group' && campaign.target_group_id) {
    const { data } = await supabase
      .from('contact_group_members')
      .select('contacts(id, name, email)')
      .eq('group_id', campaign.target_group_id)
    contacts = (data ?? [])
      .map((m: Record<string, unknown>) => m.contacts as { id: string; name: string; email: string | null })
      .filter((c) => c?.email)
  } else if (campaign.target_type === 'tag' && campaign.target_tag_id) {
    const { data } = await supabase
      .from('contact_tag_assignments')
      .select('contacts(id, name, email)')
      .eq('tag_id', campaign.target_tag_id)
    contacts = (data ?? [])
      .map((m: Record<string, unknown>) => m.contacts as { id: string; name: string; email: string | null })
      .filter((c) => c?.email)
  }

  if (contacts.length === 0) {
    return { success: false, error: 'Nenhum contato com email valido encontrado' }
  }

  // Mark as sending
  await supabase.from('email_campaigns').update({
    status: 'sending',
    started_at: new Date().toISOString(),
    total_recipients: contacts.length,
  }).eq('id', campaignId)

  // Insert queue rows
  const queueRows = contacts.map((c) => ({
    email_campaign_id: campaignId,
    contact_id: c.id,
    email: c.email!,
    contact_name: c.name,
    variables: { name: c.name, email: c.email },
    status: 'pending' as const,
  }))

  await supabase.from('email_queue').insert(queueRows)

  // Fire-and-forget: delegate to background job route
  const jobSecret = process.env.JOB_SECRET || process.env.ENCRYPTION_KEY
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  fetch(`${baseUrl}/api/jobs/send-email-campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-job-secret': jobSecret ?? '',
    },
    body: JSON.stringify({ campaignId }),
  }).catch((err) => {
    console.error('[sendEmailCampaign] Failed to dispatch job:', err)
  })

  revalidatePath('/email')
  return { success: true, simulated: !isResendConfigured() }
}

export async function deleteEmailCampaign(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('email_campaigns').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/email')
  return { success: true }
}
