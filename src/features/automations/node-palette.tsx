'use client'

import { MessageSquare, Mail, Clock, GitBranch, CheckCircle2, Tag, Users, Webhook } from 'lucide-react'

interface PaletteItem {
  type: string
  label: string
  icon: React.ReactNode
  color: string
  defaultData: Record<string, unknown>
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'action',
    label: 'Enviar WhatsApp',
    icon: <MessageSquare className="h-4 w-4" />,
    color: '#0EA5E9',
    defaultData: { action_type: 'send_whatsapp', label: 'WhatsApp' },
  },
  {
    type: 'action',
    label: 'Enviar Email',
    icon: <Mail className="h-4 w-4" />,
    color: '#0EA5E9',
    defaultData: { action_type: 'send_email', label: 'Email' },
  },
  {
    type: 'action',
    label: 'Adicionar Tag',
    icon: <Tag className="h-4 w-4" />,
    color: '#0EA5E9',
    defaultData: { action_type: 'add_tag', label: 'Tag' },
  },
  {
    type: 'action',
    label: 'Adicionar ao Grupo',
    icon: <Users className="h-4 w-4" />,
    color: '#0EA5E9',
    defaultData: { action_type: 'add_to_group', label: 'Grupo' },
  },
  {
    type: 'action',
    label: 'Webhook',
    icon: <Webhook className="h-4 w-4" />,
    color: '#0EA5E9',
    defaultData: { action_type: 'webhook', label: 'Webhook' },
  },
  {
    type: 'wait',
    label: 'Aguardar',
    icon: <Clock className="h-4 w-4" />,
    color: '#F59E0B',
    defaultData: { duration: 1, unit: 'days', label: '1 dia' },
  },
  {
    type: 'condition',
    label: 'Condição',
    icon: <GitBranch className="h-4 w-4" />,
    color: '#10B981',
    defaultData: { label: 'Se / Então' },
  },
  {
    type: 'end',
    label: 'Fim',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: '#737373',
    defaultData: { label: 'Automação concluída' },
  },
]

interface NodePaletteProps {
  onAddNode: (type: string, data: Record<string, unknown>) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="flex h-full w-52 flex-col border-r border-[#E5E5E5] bg-white">
      <div className="border-b border-[#E5E5E5] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Blocos</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {PALETTE_ITEMS.map((item, i) => (
          <button
            key={i}
            onClick={() => onAddNode(item.type, item.defaultData)}
            className="flex w-full items-center gap-3 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-left transition-all hover:border-[#7C3AED]/30 hover:bg-[#7C3AED]/5 hover:shadow-sm"
          >
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: item.color }}
            >
              {item.icon}
            </div>
            <span className="text-sm font-medium text-[#1E1B4B]">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
