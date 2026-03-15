'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { startCampaign, cancelCampaign } from '@/features/campaigns/actions'
import {
  CheckCircle,
  Eye,
  Loader2,
  Play,
  Send,
  Square,
  XCircle,
} from 'lucide-react'
import type { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row'] & {
  message_templates: { name: string; category: string } | null
}

interface CampaignsListProps {
  campaigns: Campaign[]
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  processing: 'Enviando...',
  completed: 'Concluida',
  completed_with_errors: 'Com erros',
  cancelled: 'Cancelada',
}

const statusColors: Record<string, string> = {
  draft: 'bg-[#334155] text-[#A3A3A3]',
  scheduled: 'bg-[#0EA5E9]/15 text-[#0EA5E9]',
  processing: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  completed: 'bg-[#10B981]/15 text-[#10B981]',
  completed_with_errors: 'bg-[#F43F5E]/15 text-[#F43F5E]',
  cancelled: 'bg-[#334155] text-[#737373]',
}

export function CampaignsList({ campaigns }: CampaignsListProps) {
  const [isPending, startTransition] = useTransition()

  const handleStart = (campaignId: string) => {
    startTransition(async () => {
      toast.info('Iniciando envio...')
      const result = await startCampaign(campaignId)
      if (result.success) {
        toast.success('Campanha enviada!')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleCancel = (campaignId: string) => {
    startTransition(async () => {
      const result = await cancelCampaign(campaignId)
      if (result.success) {
        toast.success('Campanha cancelada')
      } else {
        toast.error(result.error)
      }
    })
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] p-12 text-center">
        <Send className="mx-auto mb-4 h-10 w-10 text-[#525252]" />
        <h3 className="font-semibold text-[#FAFAFA]">Nenhuma campanha</h3>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Crie sua primeira campanha de disparo clicando em &quot;Nova Campanha&quot;
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="brekva-card border-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#FAFAFA]">
                {campaign.name}
              </CardTitle>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusColors[campaign.status] ?? 'bg-[#334155] text-[#A3A3A3]'
                }`}
              >
                {statusLabels[campaign.status] ?? campaign.status}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                {/* Template name */}
                <span className="text-[#A3A3A3]">
                  {campaign.message_templates?.name ?? '---'}
                </span>

                {/* Message count */}
                <div className="flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-[#7C3AED]" />
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#D4D4D4]">
                    {campaign.total_messages}
                  </span>
                </div>

                {/* Date */}
                <span className="text-xs text-[#525252]">
                  {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex gap-2">
                {campaign.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handleStart(campaign.id)}
                    disabled={isPending}
                    className="brekva-gradient-cta text-white text-xs hover:opacity-90"
                  >
                    {isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="mr-1 h-3 w-3" />
                    )}
                    Enviar
                  </Button>
                )}
                {campaign.status === 'processing' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancel(campaign.id)}
                    disabled={isPending}
                  >
                    <Square className="mr-1 h-3 w-3" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
