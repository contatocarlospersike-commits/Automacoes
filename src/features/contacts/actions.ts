'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ContactInput {
  name: string
  phone: string
  email?: string
  consentSource?: string
}

interface ActionResult {
  success: boolean
  error?: string
}

// Validate E.164 phone format
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone)
}

// Normalize phone to E.164
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')
  // If starts with 55 and has 12-13 digits, add +
  if (/^55\d{10,11}$/.test(cleaned)) {
    cleaned = '+' + cleaned
  }
  // If no country code, assume Brazil
  if (/^\d{10,11}$/.test(cleaned)) {
    cleaned = '+55' + cleaned
  }
  return cleaned
}

export async function getContacts(search?: string, page = 1, pageSize = 25) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return { contacts: [], total: 0, error: error.message }
  }

  return { contacts: data ?? [], total: count ?? 0 }
}

export async function createContact(input: ContactInput): Promise<ActionResult & { id?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Organização não encontrada' }

  const phone = normalizePhone(input.phone)
  if (!isValidE164(phone)) {
    return { success: false, error: `Telefone inválido: ${input.phone}. Use formato E.164 (ex: +5511999999999)` }
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      org_id: member.org_id,
      name: input.name.trim(),
      phone,
      email: input.email?.trim() || null,
      consent_given_at: new Date().toISOString(),
      consent_source: input.consentSource || 'manual',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um contato com este telefone' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/contacts')
  return { success: true, id: data.id }
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const updates: Record<string, unknown> = {}
  if (input.name) updates.name = input.name.trim()
  if (input.email !== undefined) updates.email = input.email?.trim() || null
  if (input.phone) {
    const phone = normalizePhone(input.phone)
    if (!isValidE164(phone)) {
      return { success: false, error: `Telefone inválido: ${input.phone}` }
    }
    updates.phone = phone
  }

  const { error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um contato com este telefone' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function softDeleteContact(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  // Soft delete — LGPD compliance
  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function softDeleteContacts(ids: string[]): Promise<ActionResult & { deleted: number }> {
  if (ids.length === 0) return { success: false, error: 'Nenhum contato selecionado', deleted: 0 }

  const supabase = await createServerSupabaseClient()

  const { error, count } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    return { success: false, error: error.message, deleted: 0 }
  }

  revalidatePath('/contacts')
  return { success: true, deleted: count ?? ids.length }
}

interface ImportResult {
  imported: number
  duplicates: number
  errors: number
  errorDetails: string[]
}

export async function importContacts(
  contacts: ContactInput[]
): Promise<ActionResult & ImportResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, imported: 0, duplicates: 0, errors: 0, errorDetails: [], error: 'Não autenticado' }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, imported: 0, duplicates: 0, errors: 0, errorDetails: [], error: 'Org não encontrada' }

  let imported = 0
  let duplicates = 0
  let errors = 0
  const errorDetails: string[] = []

  // Process in batches of 100
  const batchSize = 100
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize)

    const rows = batch.map((c) => ({
      org_id: member.org_id,
      name: c.name.trim(),
      phone: normalizePhone(c.phone),
      email: c.email?.trim() || null,
      consent_given_at: new Date().toISOString(),
      consent_source: c.consentSource || 'import_csv',
    }))

    // Validate phones
    const validRows = rows.filter((r) => {
      if (!isValidE164(r.phone)) {
        errors++
        errorDetails.push(`Telefone inválido: ${r.phone} (${r.name})`)
        return false
      }
      return true
    })

    if (validRows.length === 0) continue

    const { data, error } = await supabase
      .from('contacts')
      .upsert(validRows, {
        onConflict: 'org_id,phone',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      errors += validRows.length
      errorDetails.push(`Batch error: ${error.message}`)
    } else {
      const insertedCount = data?.length ?? 0
      imported += insertedCount
      duplicates += validRows.length - insertedCount
    }
  }

  revalidatePath('/contacts')
  return {
    success: true,
    imported,
    duplicates,
    errors,
    errorDetails: errorDetails.slice(0, 20), // Max 20 error details
  }
}
