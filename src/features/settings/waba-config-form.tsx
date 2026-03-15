'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { saveWabaConfig, testWabaConnection } from '@/features/settings/actions'
import { CheckCircle, Loader2, Wifi, XCircle } from 'lucide-react'

interface WabaConfigFormProps {
  existingConfig: {
    phone_number_id: string
    waba_id: string
    is_connected: boolean
    updated_at: string
  } | null
}

export function WabaConfigForm({ existingConfig }: WabaConfigFormProps) {
  const [phoneNumberId, setPhoneNumberId] = useState(existingConfig?.phone_number_id ?? '')
  const [wabaId, setWabaId] = useState(existingConfig?.waba_id ?? '')
  const [accessToken, setAccessToken] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isConnected, setIsConnected] = useState(existingConfig?.is_connected ?? false)

  const handleSave = async () => {
    if (!phoneNumberId || !wabaId || !accessToken) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsSaving(true)
    const result = await saveWabaConfig({
      phoneNumberId,
      wabaId,
      accessToken,
      appSecret: appSecret || undefined,
    })
    setIsSaving(false)

    if (result.success) {
      toast.success('Configuração salva com sucesso!')
      setAccessToken('') // Clear sensitive field
      setAppSecret('')
      setIsConnected(false) // Needs re-test after save
    } else {
      toast.error(result.error ?? 'Erro ao salvar')
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    const result = await testWabaConnection()
    setIsTesting(false)

    if (result.success) {
      toast.success(`Conexão OK! ${result.phoneName ?? ''}`)
      setIsConnected(true)
    } else {
      toast.error(result.error ?? 'Falha na conexão')
      setIsConnected(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>WhatsApp Business API</CardTitle>
            <CardDescription>
              Configure as credenciais da sua conta Meta WhatsApp Business
            </CardDescription>
          </div>
          {existingConfig && (
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? (
                <><CheckCircle className="mr-1 h-3 w-3" /> Conectado</>
              ) : (
                <><XCircle className="mr-1 h-3 w-3" /> Desconectado</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-number-id">Phone Number ID *</Label>
          <Input
            id="phone-number-id"
            placeholder="Ex: 123456789012345"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Encontre em Meta Business Suite → WhatsApp → Configuração da API
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="waba-id">WhatsApp Business Account ID *</Label>
          <Input
            id="waba-id"
            placeholder="Ex: 987654321098765"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="access-token">Access Token (System User) *</Label>
          <Input
            id="access-token"
            type="password"
            placeholder={existingConfig ? '••••••••• (salvo e criptografado)' : 'Cole aqui o token'}
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Token armazenado criptografado. Nunca é exposto no frontend.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="app-secret">App Secret (opcional — para validar webhooks)</Label>
          <Input
            id="app-secret"
            type="password"
            placeholder={existingConfig ? '••••••••• (salvo)' : 'Cole aqui o app secret'}
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configuração
          </Button>
          {existingConfig && (
            <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="mr-2 h-4 w-4" />
              )}
              Testar Conexão
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
