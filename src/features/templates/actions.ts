'use server'

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface TemplateInput {
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  body: string
  buttons?: Array<{ type: string; text: string; url?: string }>
  variables?: string[]
}

interface MetaTemplateComponent {
  type: 'BODY' | 'HEADER' | 'FOOTER' | 'BUTTONS'
  text?: string
  buttons?: Array<{ type: string; text: string; url?: string }>
}

async function getWabaCredentials(orgId: string) {
  const supabase = await createServerSupabaseClient()
  const serviceClient = await createServiceRoleClient()

  const { data: config } = await supabase
    .from('waba_configs')
    .select('waba_id, phone_number_id, encrypted_access_token, is_connected')
    .eq('org_id', orgId)
    .single()

  if (!config || !config.encrypted_access_token) return null

  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) return null

  const { data: decryptedToken } = await serviceClient.rpc('decrypt_text', {
    encrypted_data: config.encrypted_access_token,
    encryption_key: encryptionKey,
  })

  if (!decryptedToken) return null

  return {
    wabaId: config.waba_id,
    phoneNumberId: config.phone_number_id,
    accessToken: decryptedToken as string,
    isConnected: config.is_connected,
  }
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function getTemplates() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { templates: [], error: error.message }
  return { templates: data ?? [] }
}

export async function createTemplate(input: TemplateInput): Promise<ActionResult & { id?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Organização não encontrada' }

  // Extract variable placeholders from body
  const variableMatches = input.body.match(/\{\{\d+\}\}/g) ?? []
  const variables = variableMatches.map((v) => v.replace(/[{}]/g, ''))

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      org_id: member.org_id,
      name: input.name.trim(),
      category: input.category,
      body: input.body,
      buttons: input.buttons?.length ? input.buttons : null,
      variables: variables.length ? variables : null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/templates')
  return { success: true, id: data.id }
}

export async function updateTemplate(id: string, input: Partial<TemplateInput>): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const updates: Record<string, unknown> = {}
  if (input.name) updates.name = input.name.trim()
  if (input.category) updates.category = input.category
  if (input.body !== undefined) {
    updates.body = input.body
    const variableMatches = input.body.match(/\{\{\d+\}\}/g) ?? []
    updates.variables = variableMatches.map((v) => v.replace(/[{}]/g, ''))
  }
  if (input.buttons !== undefined) updates.buttons = input.buttons?.length ? input.buttons : null
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('message_templates')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/templates')
  return { success: true }
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/templates')
  return { success: true }
}

export async function submitTemplateToMeta(templateId: string): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nao autenticado' }

    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return { success: false, error: 'Organizacao nao encontrada' }

    // Get template
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .eq('org_id', member.org_id)
      .single()

    if (!template) return { success: false, error: 'Template nao encontrado' }
    if (template.status !== 'draft' && template.status !== 'rejected') {
      return { success: false, error: 'Apenas templates em rascunho ou rejeitados podem ser enviados' }
    }

    // Get WABA credentials
    const creds = await getWabaCredentials(member.org_id)
    if (!creds) return { success: false, error: 'Configure sua conta WhatsApp em Configuracoes antes de enviar templates' }

    // Build Meta API components
    const components: MetaTemplateComponent[] = [
      { type: 'BODY', text: template.body },
    ]

    if (template.buttons && Array.isArray(template.buttons) && (template.buttons as Array<Record<string, string>>).length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: template.buttons as Array<{ type: string; text: string; url?: string }>,
      })
    }

    // Submit to Meta Graph API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${creds.wabaId}/message_templates`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name.toLowerCase().replace(/\s+/g, '_'),
          language: 'pt_BR',
          category: template.category.toUpperCase(),
          components,
        }),
      }
    )

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json()
      const metaError = errorData?.error?.message || metaResponse.statusText
      return { success: false, error: `Meta API: ${metaError}` }
    }

    const metaData = await metaResponse.json()

    // Update template with Meta ID and pending status
    const serviceClient = await createServiceRoleClient()
    await serviceClient
      .from('message_templates')
      .update({
        meta_template_id: metaData.id,
        meta_template_name: template.name.toLowerCase().replace(/\s+/g, '_'),
        status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)

    revalidatePath('/templates')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao enviar template: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}

export async function syncTemplateStatus(templateId: string): Promise<ActionResult & { status?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nao autenticado' }

    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return { success: false, error: 'Organizacao nao encontrada' }

    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .eq('org_id', member.org_id)
      .single()

    if (!template) return { success: false, error: 'Template nao encontrado' }
    if (!template.meta_template_name) return { success: false, error: 'Template nao foi enviado a Meta ainda' }

    const creds = await getWabaCredentials(member.org_id)
    if (!creds) return { success: false, error: 'Configuracao WABA nao encontrada' }

    // Query Meta API for template status
    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${creds.wabaId}/message_templates?name=${template.meta_template_name}`,
      {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
      }
    )

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json()
      return { success: false, error: `Meta API: ${errorData?.error?.message || metaResponse.statusText}` }
    }

    const metaData = await metaResponse.json()
    const metaTemplate = metaData.data?.[0]

    if (!metaTemplate) return { success: false, error: 'Template nao encontrado na Meta' }

    // Map Meta status to local status
    const metaStatus = metaTemplate.status?.toUpperCase()
    let localStatus: string = template.status
    let rejectionReason: string | null = null

    if (metaStatus === 'APPROVED') {
      localStatus = 'approved'
    } else if (metaStatus === 'REJECTED') {
      localStatus = 'rejected'
      rejectionReason = metaTemplate.quality_score?.reasons?.join(', ') || 'Rejeitado pela Meta'
    } else if (metaStatus === 'PENDING' || metaStatus === 'IN_APPEAL') {
      localStatus = 'pending'
    }

    // Update local DB
    const serviceClient = await createServiceRoleClient()
    await serviceClient
      .from('message_templates')
      .update({
        status: localStatus,
        rejection_reason: rejectionReason,
        meta_template_id: metaTemplate.id || template.meta_template_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)

    revalidatePath('/templates')
    return { success: true, status: localStatus }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao sincronizar: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}

export async function syncAllTemplates(): Promise<ActionResult & { synced?: number }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nao autenticado' }

    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return { success: false, error: 'Organizacao nao encontrada' }

    // Get all pending templates
    const { data: pendingTemplates } = await supabase
      .from('message_templates')
      .select('id')
      .eq('org_id', member.org_id)
      .eq('status', 'pending')

    if (!pendingTemplates || pendingTemplates.length === 0) {
      return { success: true, synced: 0 }
    }

    let synced = 0
    for (const t of pendingTemplates) {
      const result = await syncTemplateStatus(t.id)
      if (result.success) synced++
    }

    revalidatePath('/templates')
    return { success: true, synced }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao sincronizar: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}
