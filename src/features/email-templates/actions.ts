'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { extractVariables } from '@/lib/resend/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

interface EmailTemplateInput {
  name: string
  subject: string
  from_name: string
  html_body: string
  preview_text?: string
}

export async function getEmailTemplates() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { templates: [], error: error.message }
  return { templates: data ?? [] }
}

export async function getEmailTemplate(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { template: null }
  return { template: data }
}

export async function createEmailTemplate(input: EmailTemplateInput): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nao autenticado' }

  const { data: member } = await supabase
    .from('org_members').select('org_id').eq('user_id', user.id).single()
  if (!member) return { success: false, error: 'Organizacao nao encontrada' }

  const variables = extractVariables(input.html_body)

  const { data, error } = await supabase.from('email_templates').insert({
    org_id: member.org_id,
    name: input.name.trim(),
    subject: input.subject.trim(),
    from_name: input.from_name.trim(),
    html_body: input.html_body,
    preview_text: input.preview_text?.trim() || null,
    variables,
  }).select('id').single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/email')
  return { success: true, id: data.id }
}

export async function updateEmailTemplate(
  id: string,
  input: EmailTemplateInput
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const variables = extractVariables(input.html_body)

  const { error } = await supabase.from('email_templates').update({
    name: input.name.trim(),
    subject: input.subject.trim(),
    from_name: input.from_name.trim(),
    html_body: input.html_body,
    preview_text: input.preview_text?.trim() || null,
    variables,
  }).eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/email')
  return { success: true }
}

export async function deleteEmailTemplate(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('email_templates').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/email')
  return { success: true }
}
