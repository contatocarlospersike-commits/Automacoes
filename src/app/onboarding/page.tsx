'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createOrganization } from '@/features/onboarding/actions'
import { Building, Loader2, Zap } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      toast.error('Digite o nome da sua organização')
      return
    }

    setIsCreating(true)
    const result = await createOrganization({ name: orgName.trim() })
    setIsCreating(false)

    if (result.success) {
      toast.success('Organização criada com sucesso!')
      router.push('/settings')
    } else {
      toast.error(result.error ?? 'Erro ao criar organização')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
      <Card className="w-full max-w-lg border-[rgba(255,255,255,0.1)] bg-[#1E293B]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#7C3AED]">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-[#FAFAFA]">Bem-vindo ao BREKVA</CardTitle>
          <CardDescription className="text-[#A3A3A3]">
            Configure sua conta em 2 passos. Sem complicacao.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              1
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="org-name" className="font-medium">Nome da sua organização</Label>
              </div>
              <Input
                id="org-name"
                placeholder="Ex: Minha Empresa, Nome do Negócio"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-dashed p-4 opacity-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground text-muted-foreground font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Configurar WhatsApp Business API</p>
              <p className="text-sm text-muted-foreground">Disponível após criar a organização</p>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCreateOrg}
            disabled={isCreating || !orgName.trim()}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Organização e Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
