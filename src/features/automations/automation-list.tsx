'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Zap, MoreVertical, Trash2, Edit, Play, Pause } from 'lucide-react'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  const months = Math.floor(days / 30)
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`
}
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { deleteAutomation, updateAutomationMeta } from '@/features/automations/actions'

interface Automation {
  id: string
  name: string
  description: string | null
  trigger_type: string
  is_active: boolean
  enrolled_count: number
  completed_count: number
  created_at: string
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manual',
  contact_created: 'Contato criado',
  tag_added: 'Tag adicionada',
  group_added: 'Grupo adicionado',
  form_submit: 'Formulário enviado',
  date: 'Data/Hora',
}

function AutomationCard({ automation }: { automation: Automation }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteAutomation(automation.id)
      if (r.success) toast.success('Automação removida')
      else toast.error(r.error ?? 'Erro ao remover')
    })
  }

  function handleToggle() {
    startTransition(async () => {
      const r = await updateAutomationMeta(automation.id, { is_active: !automation.is_active })
      if (r.success)
        toast.success(automation.is_active ? 'Automação pausada' : 'Automação ativada')
      else toast.error(r.error ?? 'Erro')
    })
  }

  return (
    <div className="group rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10">
            <Zap className="h-4 w-4 text-[#7C3AED]" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/automations/${automation.id}`}
              className="block truncate text-sm font-semibold text-[#1E1B4B] hover:text-[#7C3AED]"
            >
              {automation.name}
            </Link>
            {automation.description && (
              <p className="mt-0.5 truncate text-xs text-[#737373]">{automation.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-xs text-[#737373]">
                {TRIGGER_LABELS[automation.trigger_type] ?? automation.trigger_type}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  automation.is_active
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : 'bg-[#737373]/10 text-[#737373]'
                }`}
              >
                {automation.is_active ? 'Ativa' : 'Pausada'}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/automations/${automation.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggle} disabled={isPending}>
              {automation.is_active ? (
                <><Pause className="mr-2 h-4 w-4" /> Pausar</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Ativar</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isPending}
              className="text-[#F43F5E] focus:text-[#F43F5E]"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#F5F5F5] pt-4">
        <div>
          <p className="text-xs text-[#737373]">Matriculados</p>
          <p className="text-lg font-bold text-[#1E1B4B]">{automation.enrolled_count}</p>
        </div>
        <div>
          <p className="text-xs text-[#737373]">Concluídos</p>
          <p className="text-lg font-bold text-[#1E1B4B]">{automation.completed_count}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#737373]">
        Criada {timeAgo(automation.created_at)}
      </p>
    </div>
  )
}

export function AutomationList({ automations }: { automations: Automation[] }) {
  if (automations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E5E5] bg-white py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7C3AED]/10">
          <Zap className="h-6 w-6 text-[#7C3AED]" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-[#1E1B4B]">Nenhuma automação ainda</h3>
        <p className="mt-1 text-sm text-[#737373]">Crie sua primeira automação para começar.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {automations.map((a) => (
        <AutomationCard key={a.id} automation={a} />
      ))}
    </div>
  )
}
