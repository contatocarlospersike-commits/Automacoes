'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

export async function getTags() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('contact_tags')
    .select('*, contact_tag_assignments(count)')
    .order('name', { ascending: true })

  if (error) return { tags: [], error: error.message }
  return { tags: data ?? [] }
}

export async function getContactTags(contactId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('contact_tag_assignments')
    .select('tag_id, contact_tags(id, name, color)')
    .eq('contact_id', contactId)

  if (error) return { tags: [] }
  return { tags: data?.map((a) => a.contact_tags).filter(Boolean) ?? [] }
}

export async function createTag(name: string, color: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nao autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()
  if (!member) return { success: false, error: 'Organizacao nao encontrada' }

  const { error } = await supabase.from('contact_tags').insert({
    org_id: member.org_id,
    name: name.trim(),
    color,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/contacts')
  revalidatePath('/groups')
  return { success: true }
}

export async function deleteTag(tagId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('contact_tags').delete().eq('id', tagId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/contacts')
  return { success: true }
}

export async function assignTagToContact(
  tagId: string,
  contactId: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('contact_tag_assignments')
    .upsert({ tag_id: tagId, contact_id: contactId }, { ignoreDuplicates: true })

  if (error) return { success: false, error: error.message }

  revalidatePath('/contacts')
  return { success: true }
}

export async function removeTagFromContact(
  tagId: string,
  contactId: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('contact_tag_assignments')
    .delete()
    .eq('tag_id', tagId)
    .eq('contact_id', contactId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/contacts')
  return { success: true }
}
