'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { MessageSquare, Mail, Tag, Users, Webhook } from 'lucide-react'

const ACTION_ICONS: Record<string, React.ReactNode> = {
  send_whatsapp: <MessageSquare className="h-4 w-4" />,
  send_email: <Mail className="h-4 w-4" />,
  add_tag: <Tag className="h-4 w-4" />,
  remove_tag: <Tag className="h-4 w-4" />,
  add_to_group: <Users className="h-4 w-4" />,
  remove_from_group: <Users className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
}

const ACTION_LABELS: Record<string, string> = {
  send_whatsapp: 'Enviar WhatsApp',
  send_email: 'Enviar Email',
  add_tag: 'Adicionar Tag',
  remove_tag: 'Remover Tag',
  add_to_group: 'Adicionar ao Grupo',
  remove_from_group: 'Remover do Grupo',
  webhook: 'Webhook',
}

type NodeData = Record<string, unknown>

export function ActionNode({ data, selected }: NodeProps) {
  const d = data as NodeData
  const actionType = typeof d.action_type === 'string' ? d.action_type : 'send_whatsapp'
  const sublabel = typeof d.label === 'string' ? d.label : null
  const label = ACTION_LABELS[actionType] ?? 'Ação'

  return (
    <div
      className={`
        min-w-[180px] rounded-xl border-2 bg-white shadow-sm
        ${selected ? 'border-[#0EA5E9]' : 'border-[#0EA5E9]/40'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!border-[#0EA5E9] !bg-white" />
      <div className="flex items-center gap-2 rounded-t-[10px] bg-[#0EA5E9] px-3 py-2">
        <div className="text-white">{ACTION_ICONS[actionType]}</div>
        <span className="text-xs font-semibold uppercase tracking-wider text-white">Ação</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-[#1E1B4B]">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs text-[#737373]">{sublabel}</p>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!border-[#0EA5E9] !bg-white" />
    </div>
  )
}
