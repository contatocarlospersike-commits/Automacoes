import { Building2, Contact, MessageSquare, Send, TrendingDown, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { getAdminDashboardStats } from '@/features/admin/actions'

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats()

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
        <p className="mt-1 text-white/70">
          Visao geral de todas as organizacoes do BREKVA
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Organizacoes"
          value={stats.totalOrganizations}
          icon={<Building2 className="h-5 w-5" />}
          color="violet"
        />
        <KpiCard
          label="Contatos (global)"
          value={stats.totalContacts.toLocaleString('pt-BR')}
          icon={<Contact className="h-5 w-5" />}
          color="emerald"
        />
        <KpiCard
          label="Mensagens (mes)"
          value={stats.totalMessagesMonth.toLocaleString('pt-BR')}
          icon={<MessageSquare className="h-5 w-5" />}
          color="sky"
        />
        <KpiCard
          label="Campanhas (mes)"
          value={stats.totalCampaignsMonth}
          icon={<Send className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Global Rates */}
      <div className="grid gap-4 md:grid-cols-3">
        <RateCard
          label="Taxa de Entrega"
          value={stats.globalDeliveryRate}
          good={stats.globalDeliveryRate >= 90}
        />
        <RateCard
          label="Taxa de Leitura"
          value={stats.globalReadRate}
          good={stats.globalReadRate >= 50}
        />
        <RateCard
          label="Taxa de Falha"
          value={stats.globalFailureRate}
          good={stats.globalFailureRate < 5}
          invert
        />
      </div>

      {/* Top Orgs + Recent Orgs */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Organizations */}
        <div className="brekva-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#A3A3A3] mb-4">
            Top Organizacoes (por volume)
          </h3>
          {stats.topOrganizations.length === 0 ? (
            <p className="text-sm text-[#525252]">Nenhuma organizacao com mensagens</p>
          ) : (
            <div className="space-y-3">
              {stats.topOrganizations.map((org, i) => (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.id}`}
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(124,58,237,0.15)] text-xs font-bold text-[#A78BFA]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#FAFAFA]">{org.name}</p>
                      <p className="text-xs text-[#737373]">
                        {org.totalContacts.toLocaleString('pt-BR')} contatos
                      </p>
                    </div>
                  </div>
                  <span className="brekva-metric text-lg">
                    {org.totalMessages.toLocaleString('pt-BR')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Organizations */}
        <div className="brekva-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#A3A3A3]">
              Organizacoes Recentes
            </h3>
            <Link
              href="/admin/organizations"
              className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] transition-colors"
            >
              Ver todas
            </Link>
          </div>
          {stats.recentOrganizations.length === 0 ? (
            <p className="text-sm text-[#525252]">Nenhuma organizacao criada</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrganizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.id}`}
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(124,58,237,0.1)]">
                      <Building2 className="h-4 w-4 text-[#A78BFA]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#FAFAFA]">{org.name}</p>
                      <p className="text-xs text-[#737373]">
                        {org.memberCount} membro{org.memberCount !== 1 ? 's' : ''} &middot;{' '}
                        {new Date(org.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {org.isConnected ? (
                      <span className="flex items-center gap-1 text-xs text-[#10B981]">
                        <Wifi className="h-3 w-3" />
                        WABA
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[#525252]">
                        <WifiOff className="h-3 w-3" />
                        Sem WABA
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: 'violet' | 'emerald' | 'sky' | 'amber'
}) {
  const colorMap = {
    violet: { bg: 'rgba(124,58,237,0.12)', text: '#A78BFA' },
    emerald: { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
    sky: { bg: 'rgba(14,165,233,0.12)', text: '#0EA5E9' },
    amber: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
  }

  const c = colorMap[color]

  return (
    <div className="brekva-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#A3A3A3]">{label}</span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: c.bg, color: c.text }}
        >
          {icon}
        </div>
      </div>
      <span className="brekva-metric text-3xl">{value}</span>
    </div>
  )
}

function RateCard({
  label,
  value,
  good,
  invert = false,
}: {
  label: string
  value: number
  good: boolean
  invert?: boolean
}) {
  const isPositive = invert ? !good : good

  return (
    <div className="brekva-card rounded-xl p-6">
      <span className="text-sm text-[#A3A3A3]">{label}</span>
      <div className="mt-2 flex items-end gap-2">
        <span className="brekva-metric text-3xl">{value}%</span>
        {isPositive ? (
          <TrendingUp className="mb-1 h-5 w-5 text-[#10B981]" />
        ) : (
          <TrendingDown className="mb-1 h-5 w-5 text-[#F43F5E]" />
        )}
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.05)]">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${Math.min(value, 100)}%`,
            background: isPositive ? '#10B981' : '#F43F5E',
          }}
        />
      </div>
    </div>
  )
}
