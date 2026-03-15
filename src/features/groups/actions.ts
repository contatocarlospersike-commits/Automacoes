'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

export async function getGroups() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('contact_groups')
    .select('*, contact_group_members(count)')
    .order('created_at', { ascending: false })

  if (error) return { groups: [], error: error.message }
  return { groups: data ?? [] }
}

export async function getGroupWithMembers(groupId: string) {
  const supabase = await createServerSupabaseClient()

  const [groupRes, membersRes] = await Promise.all([
    supabase.from('contact_groups').select('*').eq('id', groupId).single(),
    supabase
      .from('contact_group_members')
      .select('contact_id, added_at, contacts(id, name, phone, email)')
      .eq('group_id', groupId)
      .order('added_at', { ascending: false }),
  ])

  if (groupRes.error) return { group: null, members: [] }
  return { group: groupRes.data, members: membersRes.data ?? [] }
}

export async function createGroup(
  name: string,
  color: string,
  description?: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nao autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()
  if (!member) return { success: false, error: 'Organizacao nao encontrada' }

  const { error } = await supabase.from('contact_groups').insert({
    org_id: member.org_id,
    name: name.trim(),
    color,
    description: description?.trim() || null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/groups')
  return { success: true }
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('contact_groups')
    .delete()
    .eq('id', groupId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/groups')
  return { success: true }
}

export async function addContactsToGroup(
  groupId: string,
  contactIds: string[]
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const rows = contactIds.map((contact_id) => ({ group_id: groupId, contact_id }))
  const { error } = await supabase
    .from('contact_group_members')
    .upsert(rows, { onConflict: 'group_id,contact_id', ignoreDuplicates: true })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function removeContactFromGroup(
  groupId: string,
  contactId: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('contact_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('contact_id', contactId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}
