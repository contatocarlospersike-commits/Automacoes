import { Zap } from 'lucide-react'
import { getAutomations } from '@/features/automations/actions'
import { AutomationList } from '@/features/automations/automation-list'
import { CreateAutomationDialog } from '@/features/automations/create-automation-dialog'

export default async function AutomationsPage() {
  const { automations } = await getAutomations()

  const active = automations.filter((a) => a.is_active).length
  const totalEnrolled = automations.reduce((s, a) => s + a.enrolled_count, 0)

  return (
    <div className="space-y-8">
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-white/70" />
              <span className="text-sm font-medium text-white/70">Automações</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Canvas de Automação</h1>
            <p className="mt-1 text-sm font-medium text-white/70">
              Crie fluxos visuais para engajar seus contatos automaticamente.
            </p>
          </div>
          <CreateAutomationDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de automações', value: automations.length },
          { label: 'Ativas', value: active },
          { label: 'Contatos matriculados', value: totalEnrolled },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-[#737373]">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-[#1E1B4B]">{s.value}</p>
          </div>
        ))}
      </div>

      <AutomationList automations={automations as any} />
    </div>
  )
}
