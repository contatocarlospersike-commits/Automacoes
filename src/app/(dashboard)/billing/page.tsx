import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CreditCard,
  TrendingUp,
  MessageSquare,
  Receipt,
  ArrowRight,
  Gift,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { getBillingOverview } from '@/features/billing/actions'

const invoiceStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Rascunho', color: 'bg-[#374151] text-[#9CA3AF]', icon: <Clock className="h-3 w-3" /> },
  pending: { label: 'Pendente', color: 'bg-[#F59E0B]/15 text-[#F59E0B]', icon: <Clock className="h-3 w-3" /> },
  paid: { label: 'Pago', color: 'bg-[#10B981]/15 text-[#10B981]', icon: <CheckCircle className="h-3 w-3" /> },
  overdue: { label: 'Atrasado', color: 'bg-[#EF4444]/15 text-[#EF4444]', icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelado', color: 'bg-[#6B7280]/15 text-[#6B7280]', icon: <XCircle className="h-3 w-3" /> },
  refunded: { label: 'Reembolsado', color: 'bg-[#8B5CF6]/15 text-[#8B5CF6]', icon: <Receipt className="h-3 w-3" /> },
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function BillingPage() {
  const billing = await getBillingOverview()

  const subscriptionTotal = billing.plan ? billing.plan.monthlyPrice * 100 : 0
  const projectedTotal = subscriptionTotal + billing.usage.projectedCostCents
  const usagePercent = projectedTotal > 0 ? (billing.usage.projectedCostCents / projectedTotal) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Cobranca & Plano
        </h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          Gerencie sua assinatura, veja o consumo e projete seus custos
        </p>
      </div>

      {/* No Plan State */}
      {!billing.plan && (
        <Card className="brekva-card border-[#F59E0B]/30">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F59E0B]/15">
                <AlertTriangle className="h-6 w-6 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Sem plano ativo</h3>
                <p className="text-xs text-[#A3A3A3]">Escolha um plano para comecar a enviar campanhas</p>
              </div>
            </div>
            <Button asChild className="brekva-gradient-cta text-white hover:opacity-90">
              <Link href="/billing/plans">
                Escolher plano
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan + Usage Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Plan */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">Plano Atual</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/15">
              <CreditCard className="h-4 w-4 text-[#A78BFA]" />
            </div>
          </CardHeader>
          <CardContent>
            {billing.plan ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#FAFAFA]">{billing.plan.name}</span>
                  {billing.subscription?.isGifted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                      <Gift className="h-3 w-3" />
                      Cortesia
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#A78BFA]">
                    R${billing.plan.monthlyPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-[#737373]">/mes</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                  <span>R${billing.plan.messageUnitPrice.toFixed(2).replace('.', ',')} por mensagem</span>
                  <span className="text-[#525252]">|</span>
                  <span className={`font-semibold ${
                    billing.subscription?.status === 'active' ? 'text-[#10B981]' :
                    billing.subscription?.status === 'overdue' ? 'text-[#EF4444]' :
                    'text-[#F59E0B]'
                  }`}>
                    {billing.subscription?.status === 'active' ? 'Ativo' :
                     billing.subscription?.status === 'overdue' ? 'Atrasado' :
                     billing.subscription?.status === 'trial' ? 'Trial' :
                     billing.subscription?.status === 'pending' ? 'Pendente' :
                     billing.subscription?.status ?? 'Inativo'}
                  </span>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2 bg-transparent border-[rgba(255,255,255,0.1)] text-[#A3A3A3] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]">
                  <Link href="/billing/plans">
                    Gerenciar plano
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CreditCard className="mb-2 h-8 w-8 text-[#525252]" />
                <p className="text-sm text-[#737373]">Nenhum plano ativo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage This Month */}
        <Card className="brekva-card border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">Uso Este Mes</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0EA5E9]/15">
              <MessageSquare className="h-4 w-4 text-[#0EA5E9]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-3xl font-extrabold text-[#FAFAFA]">
                  {billing.usage.messageCount.toLocaleString('pt-BR')}
                </span>
                <span className="ml-2 text-sm text-[#737373]">mensagens enviadas</span>
              </div>
              <div className="text-xs text-[#A3A3A3]">
                Custo ate agora: <span className="font-bold text-[#FAFAFA]">{formatCents(billing.usage.totalCostCents)}</span>
              </div>
              <div className="rounded-lg bg-[#0F172A] p-3">
                <div className="flex items-center gap-2 text-xs">
                  <TrendingUp className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span className="text-[#A3A3A3]">Projecao mensal:</span>
                  <span className="font-bold text-[#F59E0B]">
                    ~{billing.usage.projectedMessages.toLocaleString('pt-BR')} msgs
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#A3A3A3]">
                  Custo projetado: <span className="font-bold text-[#F59E0B]">{formatCents(billing.usage.projectedCostCents)}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#525252]">
                  Baseado em {billing.usage.daysElapsed}/{billing.usage.daysInMonth} dias do mes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Projection Bar */}
      {billing.plan && (
        <Card className="brekva-card border-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#D4D4D4]">Projecao de Custo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#A3A3A3]">Total projetado</span>
                <span className="text-2xl font-extrabold text-[#FAFAFA]">{formatCents(projectedTotal)}</span>
              </div>

              {/* Stacked bar */}
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className="h-full bg-[#7C3AED] transition-all duration-700"
                  style={{ width: `${100 - usagePercent}%` }}
                  title={`Assinatura: ${formatCents(subscriptionTotal)}`}
                />
                <div
                  className="h-full bg-[#0EA5E9] transition-all duration-700"
                  style={{ width: `${usagePercent}%` }}
                  title={`Mensagens: ${formatCents(billing.usage.projectedCostCents)}`}
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#7C3AED]" />
                  <span className="text-[#A3A3A3]">Assinatura</span>
                  <span className="font-bold text-[#FAFAFA]">{formatCents(subscriptionTotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#0EA5E9]" />
                  <span className="text-[#A3A3A3]">Mensagens</span>
                  <span className="font-bold text-[#FAFAFA]">{formatCents(billing.usage.projectedCostCents)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      <Card className="brekva-card border-transparent">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#D4D4D4]">Faturas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {billing.recentInvoices.length === 0 ? (
            <div className="flex h-20 flex-col items-center justify-center text-center">
              <Receipt className="mb-2 h-5 w-5 text-[#525252]" />
              <p className="text-xs text-[#737373]">Nenhuma fatura gerada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Periodo</th>
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Status</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Assinatura</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Mensagens</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.recentInvoices.map((invoice) => {
                    const statusCfg = invoiceStatusConfig[invoice.status] ?? invoiceStatusConfig.draft
                    return (
                      <tr key={invoice.id} className="border-b border-[rgba(255,255,255,0.03)] transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-semibold text-[#FAFAFA]">
                            {new Date(invoice.periodStart).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCfg.color}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 text-right text-sm text-[#D4D4D4]">
                          {formatCents(invoice.subscriptionAmountCents)}
                        </td>
                        <td className="py-3 text-right text-sm text-[#D4D4D4]">
                          {formatCents(invoice.usageAmountCents)}
                        </td>
                        <td className="py-3 text-right text-sm font-bold text-[#FAFAFA]">
                          {formatCents(invoice.totalAmountCents)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
