'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface WabaConfigInput {
  phoneNumberId: string
  wabaId: string
  accessToken: string
  appSecret?: string
}

interface WabaConfigResult {
  success: boolean
  error?: string
}

export async function saveWabaConfig(input: WabaConfigInput): Promise<WabaConfigResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Get user's org_id
    const { data: member } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!member || member.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem configurar a conta WhatsApp' }
    }

    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      return { success: false, error: 'Chave de criptografia não configurada no servidor' }
    }

    // Use service role to call encrypt functions (bypasses RLS for function calls)
    const serviceClient = await createServiceRoleClient()

    // Encrypt the access token
    const { data: encryptedToken } = await serviceClient.rpc('encrypt_text', {
      plain_text: input.accessToken,
      encryption_key: encryptionKey,
    })

    // Encrypt the app secret if provided
    let encryptedAppSecret = null
    if (input.appSecret) {
      const { data } = await serviceClient.rpc('encrypt_text', {
        plain_text: input.appSecret,
        encryption_key: encryptionKey,
      })
      encryptedAppSecret = data
    }

    // Upsert WABA config
    const { error } = await supabase
      .from('waba_configs')
      .upsert({
        org_id: member.org_id,
        phone_number_id: input.phoneNumberId,
        waba_id: input.wabaId,
        encrypted_access_token: encryptedToken,
        encrypted_app_secret: encryptedAppSecret,
        is_connected: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id',
      })

    if (error) {
      return { success: false, error: `Erro ao salvar configuração: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Erro inesperado: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}

export async function testWabaConnection(): Promise<WabaConfigResult & { phoneName?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return { success: false, error: 'Organização não encontrada' }
    }

    // Get WABA config
    const { data: config } = await supabase
      .from('waba_configs')
      .select('phone_number_id, encrypted_access_token')
      .eq('org_id', member.org_id)
      .single()

    if (!config) {
      return { success: false, error: 'Configuração WABA não encontrada' }
    }

    if (!config.encrypted_access_token) {
      return { success: false, error: 'Token de acesso não configurado' }
    }

    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      return { success: false, error: 'Chave de criptografia não configurada' }
    }

    // Decrypt token server-side
    const serviceClient = await createServiceRoleClient()
    const { data: decryptedToken } = await serviceClient.rpc('decrypt_text', {
      encrypted_data: config.encrypted_access_token,
      encryption_key: encryptionKey,
    })

    if (!decryptedToken) {
      return { success: false, error: 'Não foi possível decriptar o token' }
    }

    // Test connection with Meta API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phone_number_id}`,
      {
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: `Meta API erro: ${errorData?.error?.message || response.statusText}`,
      }
    }

    const phoneData = await response.json()

    // Update connection status
    await supabase
      .from('waba_configs')
      .update({ is_connected: true, updated_at: new Date().toISOString() })
      .eq('org_id', member.org_id)

    return {
      success: true,
      phoneName: phoneData.verified_name || phoneData.display_phone_number || 'Conectado',
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}

export async function getWabaConfig() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return null

  const { data: config } = await supabase
    .from('waba_configs')
    .select('phone_number_id, waba_id, is_connected, updated_at')
    .eq('org_id', member.org_id)
    .single()

  return config
}
