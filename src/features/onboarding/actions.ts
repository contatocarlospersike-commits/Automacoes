'use server'

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

interface CreateOrgInput {
  name: string
  timezone?: string
}

interface CreateOrgResult {
  success: boolean
  orgId?: string
  error?: string
}

export async function createOrganization(input: CreateOrgInput): Promise<CreateOrgResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Use service role to bypass RLS for onboarding (user has no org yet)
    const adminClient = await createServiceRoleClient()

    // Check if user already has an org
    const { data: existingMember } = await adminClient
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return { success: false, error: 'Você já pertence a uma organização' }
    }

    // Create organization
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: input.name,
        timezone: input.timezone || 'America/Sao_Paulo',
      })
      .select('id')
      .single()

    if (orgError || !org) {
      return { success: false, error: `Erro ao criar organização: ${orgError?.message}` }
    }

    // Add user as admin member
    const { error: memberError } = await adminClient
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'admin',
      })

    if (memberError) {
      return { success: false, error: `Erro ao associar usuário: ${memberError.message}` }
    }

    return { success: true, orgId: org.id }
  } catch (error) {
    return {
      success: false,
      error: `Erro inesperado: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}

export async function getUserOrg() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Use service role to check membership (user might not have org yet)
  const adminClient = await createServiceRoleClient()

  const { data: member } = await adminClient
    .from('org_members')
    .select('org_id, role, organizations(name, timezone)')
    .eq('user_id', user.id)
    .single()

  return member
}
