'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAutomations() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return { automations: [], error: error.message }
  return { automations: data ?? [] }
}

export async function getAutomation(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return { automation: null, error: error.message }
  return { automation: data }
}

export async function createAutomation(input: {
  name: string
  description?: string
  trigger_type?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()
  if (!member) return { success: false, error: 'Organização não encontrada' }

  const { data, error } = await supabase
    .from('automations')
    .insert({
      org_id: member.org_id,
      name: input.name,
      description: input.description ?? null,
      trigger_type: input.trigger_type ?? 'manual',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/automations')
  return { success: true, automation: data }
}

export async function updateAutomationFlow(id: string, flowJson: { nodes: unknown[]; edges: unknown[] }) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('automations')
    .update({ flow_json: flowJson as any })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateAutomationMeta(id: string, input: {
  name?: string
  description?: string
  trigger_type?: string
  trigger_config?: Record<string, unknown>
  is_active?: boolean
}) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('automations')
    .update(input as any)
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/automations')
  return { success: true }
}

export async function deleteAutomation(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('automations').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/automations')
  return { success: true }
}
