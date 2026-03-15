'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { subscribeToPlan, changePlan, checkBillingConfig } from '@/features/billing/actions'
import { PLAN_TIERS } from '@/features/billing/plans'
import type { PlanTier } from '@/features/billing/plans'
import { Check, X, Loader2, Crown, Star, Zap, AlertTriangle } from 'lucide-react'

interface PlanComparisonProps {
  currentPlanSlug: string | null
}

const planIcons: Record<string, React.ReactNode> = {
  start: <Zap className="h-6 w-6" />,
  pro: <Star className="h-6 w-6" />,
  pro_max: <Crown className="h-6 w-6" />,
}

export function PlanComparison({ currentPlanSlug }: PlanComparisonProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null)
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState('')
  const [asaasConfigured, setAsaasConfigured] = useState(true)

  useEffect(() => {
    checkBillingConfig().then((config) => setAsaasConfigured(config.asaasConfigured))
  }, [])

  const handleSelectPlan = (plan: PlanTier) => {
    if (plan.slug === currentPlanSlug) return
    if (!asaasConfigured) {
      toast.error('Gateway de pagamento nao configurado. Configure ASAAS_API_KEY para habilitar assinaturas.')
      return
    }
    setSelectedPlan(plan)
  }

  const handleSubscribe = () => {
    if (!selectedPlan) return

    if (currentPlanSlug) {
      // Change plan
      startTransition(async () => {
        const result = await changePlan(selectedPlan.slug)
        if (result.success) {
          toast.success(`Plano alterado para ${selectedPlan.name}!`)
          setSelectedPlan(null)
        } else {
          toast.error(result.error)
        }
      })
    } else {
      // New subscription
      if (!customerName.trim() || !customerEmail.trim() || !customerCpfCnpj.trim()) {
        toast.error('Preencha todos os campos obrigatorios')
        return
      }

      startTransition(async () => {
        const result = await subscribeToPlan({
          planSlug: selectedPlan.slug,
          billingType,
          customerData: {
            name: customerName,
            email: customerEmail,
            cpfCnpj: customerCpfCnpj.replace(/\D/g, ''),
          },
        })
        if (result.success) {
          toast.success(`Assinatura do plano ${selectedPlan.name} criada!`)
          setSelectedPlan(null)
        } else {
          toast.error(result.error)
        }
      })
    }
  }

  return (
    <>
      {/* Warning banner when Asaas is not configured */}
      {!asaasConfigured && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]" />
          <div>
            <p className="text-sm font-semibold text-[#F59E0B]">Gateway de pagamento nao configurado</p>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              Configure a variavel <code className="rounded bg-[#0F172A] px-1.5 py-0.5 text-[#A78BFA]">ASAAS_API_KEY</code> no
              arquivo <code className="rounded bg-[#0F172A] px-1.5 py-0.5 text-[#A78BFA]">.env.local</code> para habilitar
              assinaturas. Crie sua conta em{' '}
              <span className="font-medium text-[#0EA5E9]">sandbox.asaas.com</span> para testes.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_TIERS.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug
          const isPopular = plan.popular

          return (
            <Card
              key={plan.slug}
              className={`relative overflow-hidden transition-all duration-300 ${
                isCurrent
                  ? 'brekva-card border-[#7C3AED]/50 ring-2 ring-[#7C3AED]/30'
                  : isPopular
                    ? 'brekva-card border-[#0EA5E9]/30 hover:border-[#0EA5E9]/60'
                    : 'brekva-card border-transparent hover:border-[rgba(255,255,255,0.1)]'
              }`}
            >
              {/* Popular badge */}
              {isPopular && !isCurrent && (
                <div className="absolute right-4 top-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0EA5E9]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#0EA5E9]">
                    <Star className="h-3 w-3" />
                    Popular
                  </span>
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div className="absolute right-4 top-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#A78BFA]">
                    <Check className="h-3 w-3" />
                    Seu plano
                  </span>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    plan.slug === 'pro_max' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                    plan.slug === 'pro' ? 'bg-[#0EA5E9]/15 text-[#0EA5E9]' :
                    'bg-[#7C3AED]/15 text-[#A78BFA]'
                  }`}>
                    {planIcons[plan.slug]}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#FAFAFA]">{plan.name}</CardTitle>
                    <p className="text-xs text-[#737373]">{plan.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#FAFAFA]">
                      R${plan.monthlyPrice}
                    </span>
                    <span className="text-sm text-[#737373]">/mes</span>
                  </div>
                  <p className="mt-1 text-xs text-[#A3A3A3]">
                    + R${plan.messagePrice.toFixed(2).replace('.', ',')} por mensagem
                  </p>
                </div>

                {/* Limits */}
                <div className="rounded-lg bg-[#0F172A] p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A3A3A3]">Contatos</span>
                    <span className="font-bold text-[#FAFAFA]">{plan.maxContacts}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A3A3A3]">Campanhas</span>
                    <span className="font-bold text-[#FAFAFA]">{plan.maxCampaigns}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2 text-xs">
                      {feature.included ? (
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          feature.highlight ? 'text-[#F59E0B]' : 'text-[#10B981]'
                        }`} />
                      ) : (
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#525252]" />
                      )}
                      <span className={`${
                        feature.included
                          ? feature.highlight ? 'font-semibold text-[#F59E0B]' : 'text-[#D4D4D4]'
                          : 'text-[#525252]'
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full ${
                    isCurrent
                      ? 'bg-[#374151] text-[#9CA3AF] cursor-default'
                      : plan.slug === 'pro_max'
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white hover:opacity-90'
                        : 'brekva-gradient-cta text-white hover:opacity-90'
                  }`}
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrent ? 'Plano atual' : plan.cta}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Subscribe/Change Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => { if (!open) setSelectedPlan(null) }}>
        <DialogContent className="sm:max-w-md bg-[#1A1B2E] border-[rgba(255,255,255,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">
              {currentPlanSlug ? 'Trocar de Plano' : 'Assinar Plano'}
            </DialogTitle>
            <DialogDescription className="text-[#A3A3A3]">
              {selectedPlan && (
                <>
                  {selectedPlan.name} — R${selectedPlan.monthlyPrice}/mes + R${selectedPlan.messagePrice.toFixed(2).replace('.', ',')}/msg
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Billing type */}
            <div className="space-y-2">
              <Label className="text-[#D4D4D4]">Forma de pagamento *</Label>
              <Tabs value={billingType} onValueChange={(v) => setBillingType(v as typeof billingType)}>
                <TabsList className="w-full bg-[#0F172A] border border-[rgba(255,255,255,0.05)]">
                  <TabsTrigger value="PIX" className="flex-1 data-[state=active]:bg-[#7C3AED]/20 data-[state=active]:text-[#A78BFA]">PIX</TabsTrigger>
                  <TabsTrigger value="BOLETO" className="flex-1 data-[state=active]:bg-[#7C3AED]/20 data-[state=active]:text-[#A78BFA]">Boleto</TabsTrigger>
                  <TabsTrigger value="CREDIT_CARD" className="flex-1 data-[state=active]:bg-[#7C3AED]/20 data-[state=active]:text-[#A78BFA]">Cartao</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Customer data (only for new subscriptions) */}
            {!currentPlanSlug && (
              <>
                <div className="space-y-2">
                  <Label className="text-[#D4D4D4]">Nome completo *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome ou razao social"
                    className="bg-[#0F172A] border-[rgba(255,255,255,0.1)] text-[#FAFAFA] placeholder:text-[#525252]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#D4D4D4]">Email *</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-[#0F172A] border-[rgba(255,255,255,0.1)] text-[#FAFAFA] placeholder:text-[#525252]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#D4D4D4]">CPF ou CNPJ *</Label>
                  <Input
                    value={customerCpfCnpj}
                    onChange={(e) => setCustomerCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    className="bg-[#0F172A] border-[rgba(255,255,255,0.1)] text-[#FAFAFA] placeholder:text-[#525252]"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedPlan(null)}
              className="bg-transparent border-[rgba(255,255,255,0.1)] text-[#A3A3A3] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={isPending}
              className="brekva-gradient-cta text-white hover:opacity-90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentPlanSlug ? 'Confirmar troca' : 'Assinar agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
