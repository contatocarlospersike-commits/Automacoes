import { ArrowLeft, Building2, Calendar, Contact, FileText, Mail, MessageSquare, Send, Shield, User, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrganizationDetails } from '@/features/admin/actions'
import { ToggleOrgButton } from '@/features/admin/toggle-org-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrganizationDetailsPage({ params }: PageProps) {
  const { id } = await params
  const org = await getOrganizationDetails(id)

  if (!org) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <Link
          href="/admin/organizations"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
            <p className="mt-1 text-white/70">
              Criada em {new Date(org.created_at).toLocaleDateString('pt-BR')} &middot; {org.timezone}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {org.is_active ? (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[rgba(16,185,129,0.2)] text-[#10B981]">
                Ativo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[rgba(244,63,94,0.2)] text-[#F43F5E]">
                Inativo
              </span>
            )}
            <ToggleOrgButton orgId={org.id} isActive={org.is_active} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contatos" value={org.stats.totalContacts} sub={`${org.stats.totalOptedOut} opt-out`} icon={<Contact className="h-5 w-5" />} />
        <StatCard label="Templates" value={org.stats.totalTemplates} sub={`${org.stats.approvedTemplates} aprovados`} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Campanhas" value={org.stats.totalCampaigns} sub={`${org.stats.campaignsThisMonth} este mes`} icon={<Send className="h-5 w-5" />} />
        <StatCard label="Msgs (mes)" value={org.stats.messagesThisMonth} sub={`${org.stats.deliveryRate}% entrega`} icon={<MessageSquare className="h-5 w-5" />} />
      </div>

      {/* Members + WABA Config */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Members */}
        <div className="brekva-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#A3A3A3] mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            Membros ({org.members.length})
          </h3>
          {org.members.length === 0 ? (
            <p className="text-sm text-[#525252]">Nenhum membro</p>
          ) : (
            <div className="space-y-2">
              {org.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg p-3 bg-[rgba(255,255,255,0.02)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(124,58,237,0.12)]">
                      <User className="h-4 w-4 text-[#A78BFA]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#FAFAFA] flex items-center gap-1.5">
                        {member.email ?? 'Email desconhecido'}
                      </p>
                      <p className="text-xs text-[#737373]">
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="brekva-badge text-[10px]">{member.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WABA Config */}
        <div className="brekva-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#A3A3A3] mb-4 flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Configuracao WABA
          </h3>
          {org.wabaConfig ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg p-4 bg-[rgba(255,255,255,0.02)]">
                {org.wabaConfig.isConnected ? (
                  <Wifi className="h-6 w-6 text-[#10B981]" />
                ) : (
                  <WifiOff className="h-6 w-6 text-[#F43F5E]" />
                )}
                <div>
                  <p className="text-sm font-medium text-[#FAFAFA]">
                    {org.wabaConfig.isConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                  <p className="text-xs text-[#737373]">
                    WABA ID: {org.wabaConfig.wabaId}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3 bg-[rgba(255,255,255,0.02)]">
                  <p className="text-xs text-[#737373]">Phone Number ID</p>
                  <p className="text-sm text-[#FAFAFA] font-mono mt-0.5 break-all">
                    {org.wabaConfig.phoneNumberId}
                  </p>
                </div>
                <div className="rounded-lg p-3 bg-[rgba(255,255,255,0.02)]">
                  <p className="text-xs text-[#737373]">WABA ID</p>
                  <p className="text-sm text-[#FAFAFA] font-mono mt-0.5 break-all">
                    {org.wabaConfig.wabaId}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <WifiOff className="h-10 w-10 text-[#334155] mb-3" />
              <p className="text-sm text-[#525252]">WABA nao configurado</p>
            </div>
          )}
        </div>
      </div>

      {/* Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="brekva-card rounded-xl p-6">
          <span className="text-sm text-[#A3A3A3]">Taxa de Entrega</span>
          <div className="mt-2 flex items-end gap-2">
            <span className="brekva-metric text-3xl">{org.stats.deliveryRate}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.05)]">
            <div
              className="h-1.5 rounded-full bg-[#10B981] transition-all"
              style={{ width: `${Math.min(org.stats.deliveryRate, 100)}%` }}
            />
          </div>
        </div>
        <div className="brekva-card rounded-xl p-6">
          <span className="text-sm text-[#A3A3A3]">Taxa de Leitura</span>
          <div className="mt-2 flex items-end gap-2">
            <span className="brekva-metric text-3xl">{org.stats.readRate}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.05)]">
            <div
              className="h-1.5 rounded-full bg-[#0EA5E9] transition-all"
              style={{ width: `${Math.min(org.stats.readRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="brekva-card rounded-xl p-6">
        <h3 className="text-sm font-medium text-[#A3A3A3] mb-4 flex items-center gap-2">
          <Send className="h-4 w-4" />
          Campanhas Recentes
        </h3>
        {org.recentCampaigns.length === 0 ? (
          <p className="text-sm text-[#525252]">Nenhuma campanha</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[#737373]">Nome</th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[#737373]">Status</th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-[#737373]">Msgs</th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[#737373]">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                {org.recentCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-3 text-sm text-[#FAFAFA]">{campaign.name}</td>
                    <td className="py-3">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="py-3 text-center">
                      <span className="brekva-metric text-sm">{campaign.total_messages}</span>
                    </td>
                    <td className="py-3 text-right text-xs text-[#737373]">
                      {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: number
  sub: string
  icon: React.ReactNode
}) {
  return (
    <div className="brekva-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#A3A3A3]">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(124,58,237,0.12)] text-[#A78BFA]">
          {icon}
        </div>
      </div>
      <span className="brekva-metric text-3xl">{value.toLocaleString('pt-BR')}</span>
      <p className="mt-1 text-xs text-[#737373]">{sub}</p>
    </div>
  )
}

function CampaignStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'rgba(163,163,163,0.12)', text: '#A3A3A3' },
    scheduled: { bg: 'rgba(14,165,233,0.12)', text: '#0EA5E9' },
    sending: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
    completed: { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
    failed: { bg: 'rgba(244,63,94,0.12)', text: '#F43F5E' },
    cancelled: { bg: 'rgba(163,163,163,0.12)', text: '#737373' },
  }

  const c = colorMap[status] ?? colorMap.draft

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{ background: c.bg, color: c.text }}
    >
      {status}
    </span>
  )
}
