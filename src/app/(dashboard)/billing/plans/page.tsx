import { getBillingOverview } from '@/features/billing/actions'
import { PlanComparison } from '@/features/billing/plan-comparison'

export default async function PlansPage() {
  const billing = await getBillingOverview()

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Escolha seu Plano
        </h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          Todos os planos incluem R$0,46 por mensagem enviada
        </p>
      </div>

      <PlanComparison currentPlanSlug={billing.plan?.slug ?? null} />
    </div>
  )
}
