'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Send,
  CheckCircle,
  Eye,
  AlertTriangle,
  Clock,
  Radio,
  ArrowUpRight,
  XCircle,
  Loader2,
} from 'lucide-react'
import { getReportsData } from '@/features/reports/actions'

type Period = '7d' | '30d' | '90d'

interface MessageStatusBreakdown {
  pending: number
  sending: number
  sent: number
  delivered: number
  read: number
  failed: number
}

interface CampaignWithStats {
  id: string
  name: string
  status: string
  total_messages: number
  created_at: string
  completed_at: string | null
  delivered: number
  read: number
  failed: number
}

interface ReportsData {
  totalSent: number
  totalDelivered: number
  totalRead: number
  totalFailed: number
  deliveryRate: number
  readRate: number
  totalCampaigns: number
  statusBreakdown: MessageStatusBreakdown
  recentCampaigns: CampaignWithStats[]
}

interface ReportsDashboardProps {
  initialData: ReportsData
  initialPeriod: Period
}

const periodLabels: Record<Period, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
}

const campaignStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  processing: 'Enviando',
  completed: 'Concluida',
  completed_with_errors: 'Com erros',
  cancelled: 'Cancelada',
}

const campaignStatusColors: Record<string, string> = {
  draft: 'bg-[#334155] text-[#A3A3A3]',
  scheduled: 'bg-[#0EA5E9]/15 text-[#0EA5E9]',
  processing: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  completed: 'bg-[#10B981]/15 text-[#10B981]',
  completed_with_errors: 'bg-[#F43F5E]/15 text-[#F43F5E]',
  cancelled: 'bg-[#334155] text-[#737373]',
}

export function ReportsDashboard({ initialData, initialPeriod }: ReportsDashboardProps) {
  const [data, setData] = useState<ReportsData>(initialData)
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod)
    startTransition(async () => {
      const newData = await getReportsData(newPeriod)
      setData(newData)
    })
  }

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Relatorios
            </h1>
            <p className="mt-1 text-sm font-medium text-white/70">
              Metricas reais da sua operacao WhatsApp Business
            </p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(p)}
                disabled={isPending}
                className={
                  period === p
                    ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                    : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10 hover:text-white'
                }
              >
                {isPending && period !== p ? null : null}
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 text-[#A3A3A3]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando dados...</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sent */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">
              Total Enviadas
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/15">
              <Send className="h-4 w-4 text-[#A78BFA]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="brekva-metric text-3xl">
              {data.totalSent.toLocaleString('pt-BR')}
            </div>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              Mensagens no periodo
            </p>
          </CardContent>
        </Card>

        {/* Delivery Rate */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">
              Taxa de Entrega
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981]/15">
              <CheckCircle className="h-4 w-4 text-[#10B981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-[#10B981] tracking-tight">
              {data.deliveryRate.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              {data.totalDelivered.toLocaleString('pt-BR')} entregues
            </p>
          </CardContent>
        </Card>

        {/* Read Rate */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">
              Taxa de Leitura
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0EA5E9]/15">
              <Eye className="h-4 w-4 text-[#0EA5E9]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-[#0EA5E9] tracking-tight">
              {data.readRate.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              {data.totalRead.toLocaleString('pt-BR')} lidas
            </p>
          </CardContent>
        </Card>

        {/* Failures */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">
              Falhas
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F43F5E]/15">
              <AlertTriangle className="h-4 w-4 text-[#F43F5E]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-[#F43F5E] tracking-tight">
              {data.totalFailed.toLocaleString('pt-BR')}
            </div>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              Mensagens com erro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-[#FAFAFA]">Breakdown por Status</h2>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatusCard
            label="Pendente"
            value={data.statusBreakdown.pending}
            icon={<Clock className="h-4 w-4" />}
            color="#F59E0B"
          />
          <StatusCard
            label="Enviando"
            value={data.statusBreakdown.sending}
            icon={<Radio className="h-4 w-4" />}
            color="#0EA5E9"
          />
          <StatusCard
            label="Enviada"
            value={data.statusBreakdown.sent}
            icon={<Send className="h-4 w-4" />}
            color="#7C3AED"
          />
          <StatusCard
            label="Entregue"
            value={data.statusBreakdown.delivered}
            icon={<CheckCircle className="h-4 w-4" />}
            color="#10B981"
          />
          <StatusCard
            label="Lida"
            value={data.statusBreakdown.read}
            icon={<Eye className="h-4 w-4" />}
            color="#0EA5E9"
          />
          <StatusCard
            label="Falhou"
            value={data.statusBreakdown.failed}
            icon={<XCircle className="h-4 w-4" />}
            color="#F43F5E"
          />
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-[#FAFAFA]">Campanhas Recentes</h2>
        <Card className="brekva-card border-transparent overflow-hidden">
          {data.recentCampaigns.length === 0 ? (
            <CardContent className="py-12 text-center">
              <Send className="mx-auto mb-3 h-8 w-8 text-[#525252]" />
              <p className="text-sm text-[#A3A3A3]">
                Nenhuma campanha no periodo selecionado
              </p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(255,255,255,0.05)] hover:bg-transparent">
                  <TableHead className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                    Campanha
                  </TableHead>
                  <TableHead className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-[#A3A3A3] text-xs uppercase tracking-wider text-right">
                    Total
                  </TableHead>
                  <TableHead className="text-[#A3A3A3] text-xs uppercase tracking-wider text-right">
                    Entrega
                  </TableHead>
                  <TableHead className="text-[#A3A3A3] text-xs uppercase tracking-wider text-right">
                    Leitura
                  </TableHead>
                  <TableHead className="text-[#A3A3A3] text-xs uppercase tracking-wider text-right">
                    Data
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentCampaigns.map((campaign) => {
                  const deliveryPct = campaign.total_messages > 0
                    ? ((campaign.delivered / campaign.total_messages) * 100).toFixed(0)
                    : '0'
                  const readPct = campaign.delivered > 0
                    ? ((campaign.read / campaign.delivered) * 100).toFixed(0)
                    : '0'

                  return (
                    <TableRow
                      key={campaign.id}
                      className="border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      <TableCell className="font-medium text-[#FAFAFA]">
                        {campaign.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            campaignStatusColors[campaign.status] ?? 'bg-[#334155] text-[#A3A3A3]'
                          }`}
                        >
                          {campaignStatusLabels[campaign.status] ?? campaign.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#D4D4D4]">
                          {campaign.total_messages}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#10B981]">
                          {deliveryPct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#0EA5E9]">
                          {readPct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-[#A3A3A3]">
                        {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}

interface StatusCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatusCard({ label, value, icon, color }: StatusCardProps) {
  return (
    <Card className="brekva-card border-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
          <span className="text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div
          className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold tracking-tight"
          style={{ color }}
        >
          {value.toLocaleString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  )
}
