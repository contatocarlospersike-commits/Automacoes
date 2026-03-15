import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Contact,
  Send,
  CheckCheck,
  Eye,
  FileText,
  Rocket,
  ArrowRight,
  Clock,
  XCircle,
  Loader2,
  CircleCheck,
  UserX,
} from 'lucide-react'
import Link from 'next/link'
import { getDashboardStats } from '@/features/dashboard/actions'

const statusColors: Record<string, string> = {
  draft: 'bg-[#6B7280] text-white',
  scheduled: 'bg-[#0EA5E9] text-white',
  sending: 'bg-[#F59E0B] text-white',
  completed: 'bg-[#10B981] text-white',
  failed: 'bg-[#EF4444] text-white',
  paused: 'bg-[#8B5CF6] text-white',
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  sending: 'Enviando',
  completed: 'Concluida',
  failed: 'Falhou',
  paused: 'Pausada',
}

function HealthGauge({ score, factors }: {
  score: number
  factors: { deliveryScore: number; readScore: number; failureScore: number }
}) {
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  const getColor = (s: number) => {
    if (s >= 80) return '#10B981'
    if (s >= 60) return '#F59E0B'
    return '#EF4444'
  }

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excelente'
    if (s >= 60) return 'Bom'
    if (s >= 40) return 'Regular'
    return 'Critico'
  }

  const color = getColor(score)

  return (
    <Card className="brekva-card border-transparent h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#D4D4D4]">
          Saude da Conta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Gauge SVG */}
          <div className="relative flex shrink-0 items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 70 70)"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold" style={{ color }}>{score}</span>
              <span className="text-[10px] font-semibold text-[#A3A3A3]">{getLabel(score)}</span>
            </div>
          </div>

          {/* Factors */}
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A3A3A3]">Entrega</span>
                <span className="font-semibold text-[#FAFAFA]">{factors.deliveryScore}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className="h-full rounded-full bg-[#10B981] transition-all duration-700"
                  style={{ width: `${Math.min(factors.deliveryScore, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A3A3A3]">Leitura</span>
                <span className="font-semibold text-[#FAFAFA]">{factors.readScore}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className="h-full rounded-full bg-[#0EA5E9] transition-all duration-700"
                  style={{ width: `${Math.min(factors.readScore, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A3A3A3]">Sem Falhas</span>
                <span className="font-semibold text-[#FAFAFA]">{factors.failureScore}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(factors.failureScore, 100)}%`,
                    backgroundColor: getColor(factors.failureScore),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBreakdownBar({ breakdown, total }: {
  breakdown: {
    pending: number
    sending: number
    sent: number
    delivered: number
    read: number
    failed: number
  }
  total: number
}) {
  if (total === 0) {
    return (
      <Card className="brekva-card border-transparent h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#D4D4D4]">
            Status das Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-20 flex-col items-center justify-center text-center">
            <Send className="mb-2 h-5 w-5 text-[#525252]" />
            <p className="text-xs text-[#737373]">Nenhuma mensagem enviada este mes</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const segments = [
    { key: 'read', label: 'Lidas', count: breakdown.read, color: '#10B981' },
    { key: 'delivered', label: 'Entregues', count: breakdown.delivered, color: '#0EA5E9' },
    { key: 'sent', label: 'Enviadas', count: breakdown.sent, color: '#8B5CF6' },
    { key: 'sending', label: 'Enviando', count: breakdown.sending, color: '#F59E0B' },
    { key: 'pending', label: 'Pendentes', count: breakdown.pending, color: '#6B7280' },
    { key: 'failed', label: 'Falhas', count: breakdown.failed, color: '#EF4444' },
  ].filter(s => s.count > 0)

  return (
    <Card className="brekva-card border-transparent h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#D4D4D4]">
          Status das Mensagens
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked bar */}
        <div className="flex h-6 w-full overflow-hidden rounded-full">
          {segments.map((seg) => {
            const pct = (seg.count / total) * 100
            return (
              <div
                key={seg.key}
                className="h-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: seg.color, minWidth: pct > 0 ? '4px' : 0 }}
                title={`${seg.label}: ${seg.count} (${Math.round(pct)}%)`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <div className="flex flex-col">
                <span className="text-[10px] text-[#737373]">{seg.label}</span>
                <span className="text-xs font-bold text-[#FAFAFA]">{seg.count.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      {/* Hero gradient header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          Visao geral da sua operacao WhatsApp Business
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Contatos */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">Contatos</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/15">
              <Contact className="h-4 w-4 text-[#A78BFA]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="brekva-metric text-3xl">
              {stats.totalContacts.toLocaleString('pt-BR')}
            </div>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              Total cadastrados
            </p>
          </CardContent>
        </Card>

        {/* Mensagens */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">Mensagens</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0EA5E9]/15">
              <Send className="h-4 w-4 text-[#0EA5E9]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="brekva-metric text-3xl">
              {stats.messagesThisMonth.toLocaleString('pt-BR')}
            </div>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              Este mes
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Entrega */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">Taxa de Entrega</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981]/15">
              <CheckCheck className="h-4 w-4 text-[#10B981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="brekva-metric text-3xl">
              {stats.deliveryRate}%
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-full bg-[#10B981] transition-all duration-700"
                style={{ width: `${Math.min(stats.deliveryRate, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Leitura */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">Taxa de Leitura</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F59E0B]/15">
              <Eye className="h-4 w-4 text-[#F59E0B]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="brekva-metric text-3xl">
              {stats.readRate}%
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-full bg-[#F59E0B] transition-all duration-700"
                style={{ width: `${Math.min(stats.readRate, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown + Health Score */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <StatusBreakdownBar breakdown={stats.statusBreakdown} total={stats.totalMessages} />
        </div>
        <div className="lg:col-span-2">
          <HealthGauge score={stats.healthScore} factors={stats.healthFactors} />
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <Card className="brekva-card border-transparent">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#D4D4D4]">
            Campanhas Recentes
          </CardTitle>
          <Link
            href="/campaigns"
            className="flex items-center gap-1 text-xs font-semibold text-[#A78BFA] transition-colors hover:text-[#C4B5FD]"
          >
            Ver todas
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentCampaigns.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center text-center">
              <Rocket className="mb-2 h-5 w-5 text-[#525252]" />
              <p className="text-xs text-[#737373]">Nenhuma campanha criada ainda</p>
              <Link
                href="/campaigns/new"
                className="mt-2 text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD]"
              >
                Criar primeira campanha
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                      Campanha
                    </th>
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                      Status
                    </th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                      Msgs
                    </th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                      Entrega
                    </th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                      Leitura
                    </th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                      Falhas
                    </th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCampaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-[rgba(255,255,255,0.03)] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      <td className="py-3 pr-4">
                        <span className="text-sm font-semibold text-[#FAFAFA]">
                          {campaign.name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            statusColors[campaign.status] ?? 'bg-[#374151] text-white'
                          }`}
                        >
                          {statusLabels[campaign.status] ?? campaign.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-[#D4D4D4]">
                        {campaign.total_messages.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-semibold text-[#10B981]">
                          {campaign.deliveryRate}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-semibold text-[#F59E0B]">
                          {campaign.readRate}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {campaign.failed > 0 ? (
                          <span className="text-sm font-semibold text-[#EF4444]">
                            {campaign.failed}
                          </span>
                        ) : (
                          <span className="text-sm text-[#737373]">0</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-xs text-[#A3A3A3]">
                        {new Date(campaign.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Overview - 3 cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Templates Ativos */}
        <Card className="brekva-card border-transparent">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/15">
              <FileText className="h-5 w-5 text-[#0EA5E9]" />
            </div>
            <div>
              <p className="text-xs text-[#A3A3A3]">Templates Aprovados</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-[#FAFAFA]">{stats.approvedTemplates}</span>
                <span className="text-xs text-[#737373]">/ {stats.totalTemplates} total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campanhas este mes */}
        <Card className="brekva-card border-transparent">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10B981]/15">
              <Rocket className="h-5 w-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs text-[#A3A3A3]">Campanhas este mes</p>
              <span className="text-xl font-extrabold text-[#FAFAFA]">{stats.campaignsThisMonth}</span>
            </div>
          </CardContent>
        </Card>

        {/* Opt-outs */}
        <Card className="brekva-card border-transparent">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              stats.totalOptedOut > 0 ? 'bg-[#EF4444]/15' : 'bg-[#10B981]/15'
            }`}>
              {stats.totalOptedOut > 0 ? (
                <UserX className="h-5 w-5 text-[#EF4444]" />
              ) : (
                <CircleCheck className="h-5 w-5 text-[#10B981]" />
              )}
            </div>
            <div>
              <p className="text-xs text-[#A3A3A3]">Opt-outs</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-extrabold ${
                  stats.totalOptedOut > 0 ? 'text-[#EF4444]' : 'text-[#FAFAFA]'
                }`}>
                  {stats.totalOptedOut}
                </span>
                {stats.totalContacts > 0 && stats.totalOptedOut > 0 && (
                  <span className="text-xs text-[#737373]">
                    ({((stats.totalOptedOut / stats.totalContacts) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
