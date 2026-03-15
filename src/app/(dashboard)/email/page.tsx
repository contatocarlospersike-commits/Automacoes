import Link from 'next/link'
import { Mail, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEmailTemplates } from '@/features/email-templates/actions'
import { getEmailCampaigns } from '@/features/email-campaigns/actions'
import { EmailCampaignsList } from '@/features/email-campaigns/email-campaigns-list'
import { isResendConfigured } from '@/lib/resend/client'

export default async function EmailMarketingPage() {
  const [{ templates }, { campaigns }] = await Promise.all([
    getEmailTemplates(),
    getEmailCampaigns(),
  ])
  const resendOk = isResendConfigured()

  return (
    <div className="space-y-8">
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Email Marketing</h1>
            <p className="mt-1 text-sm font-medium text-white/70">
              Campanhas de email profissionais. Canal complementar ao WhatsApp.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/email/templates">
                <FileText className="h-4 w-4 mr-2" />
                Templates ({templates.length})
              </Link>
            </Button>
            <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/20">
              <Link href="/email/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Resend status banner */}
      {!resendOk && (
        <div className="flex items-start gap-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl px-4 py-3">
          <Mail className="h-5 w-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#F59E0B]">Resend nao configurado</p>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Adicione <code className="bg-[#0F172A] px-1 rounded text-[#A78BFA]">RESEND_API_KEY=re_xxx</code> no seu{' '}
              <code className="bg-[#0F172A] px-1 rounded text-[#A78BFA]">.env.local</code> para ativar envio real.
              Por enquanto os disparos sao simulados e aparecem nos logs.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Templates', value: templates.length, color: '#7C3AED' },
          { label: 'Campanhas', value: campaigns.length, color: '#0EA5E9' },
          {
            label: 'Emails Enviados',
            value: campaigns.reduce((acc: number, c: Record<string, unknown>) => acc + ((c.total_sent as number) ?? 0), 0),
            color: '#10B981',
          },
          {
            label: 'Taxa de Abertura',
            value: (() => {
              const sent = campaigns.reduce((a: number, c: Record<string, unknown>) => a + (c.total_sent as number), 0)
              const opened = campaigns.reduce((a: number, c: Record<string, unknown>) => a + (c.total_opened as number), 0)
              return sent > 0 ? `${Math.round((opened / sent) * 100)}%` : '—'
            })(),
            color: '#F59E0B',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1E293B] rounded-xl border border-white/5 p-4 text-center"
          >
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-[#737373] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Campaigns list */}
      <div>
        <h2 className="text-sm font-semibold text-[#737373] uppercase tracking-wider mb-4">
          Campanhas Recentes
        </h2>
        <EmailCampaignsList campaigns={campaigns as Array<Record<string, unknown>>} />
      </div>
    </div>
  )
}
