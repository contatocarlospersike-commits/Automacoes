'use client'

import { useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { deleteEmailCampaign } from '@/features/email-campaigns/actions'
import { Mail, Trash2, Loader2, CheckCircle, Clock, Send, XCircle, type LucideIcon } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: string
  from_email: string
  total_recipients: number
  total_sent: number
  total_opened: number
  total_clicked: number
  total_failed: number
  created_at: string
  email_templates: { name: string; subject: string } | null
}

const statusConfig: Record<string, { label: string; icon: LucideIcon; class: string }> = {
  draft: { label: 'Rascunho', icon: Clock, class: 'bg-[#334155] text-[#A3A3A3]' },
  sending: { label: 'Enviando', icon: Send, class: 'bg-[#F59E0B]/20 text-[#F59E0B]' },
  completed: { label: 'Concluida', icon: CheckCircle, class: 'bg-[#10B981]/20 text-[#10B981]' },
  cancelled: { label: 'Cancelada', icon: XCircle, class: 'bg-[#F43F5E]/20 text-[#F43F5E]' },
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const [isPending, startTransition] = useTransition()
  const config = statusConfig[campaign.status] ?? statusConfig.draft
  const StatusIcon = config.icon
  const openRate = campaign.total_sent > 0
    ? Math.round((campaign.total_opened / campaign.total_sent) * 100)
    : 0

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteEmailCampaign(campaign.id)
      if (result.success) toast.success('Campanha removida')
      else toast.error(result.error ?? 'Erro ao remover')
    })
  }

  return (
    <Card className="bg-[#1E293B] border-white/5 hover:border-white/10 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="font-semibold text-[#FAFAFA] truncate">{campaign.name}</p>
            <p className="text-xs text-[#737373] mt-0.5 truncate">
              {campaign.email_templates?.subject ?? '—'}
            </p>
            <p className="text-xs text-[#525252] mt-0.5">{campaign.from_email}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${config.class} border-0 text-xs flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            <Button
              variant="ghost" size="icon"
              onClick={handleDelete}
              disabled={isPending}
              className="h-7 w-7 text-[#737373] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {campaign.status === 'completed' && (
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/5">
            {[
              { label: 'Enviados', value: campaign.total_sent },
              { label: 'Abertos', value: `${openRate}%` },
              { label: 'Cliques', value: campaign.total_clicked },
              { label: 'Falhas', value: campaign.total_failed },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-sm font-bold text-[#FAFAFA]">{m.value}</p>
                <p className="text-[10px] text-[#737373]">{m.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface EmailCampaignsListProps {
  campaigns: Campaign[]
}

export function EmailCampaignsList({ campaigns }: EmailCampaignsListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
          <Mail className="h-7 w-7 text-[#0EA5E9]" />
        </div>
        <p className="text-[#FAFAFA] font-semibold">Nenhuma campanha de email</p>
        <p className="text-[#737373] text-sm mt-1">Crie sua primeira campanha e dispare agora.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {campaigns.map((c) => <CampaignCard key={c.id} campaign={c} />)}
    </div>
  )
}
