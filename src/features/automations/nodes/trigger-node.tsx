'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap, Calendar, UserPlus, Tag, Users, FileText } from 'lucide-react'

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  manual: <Zap className="h-4 w-4" />,
  contact_created: <UserPlus className="h-4 w-4" />,
  tag_added: <Tag className="h-4 w-4" />,
  group_added: <Users className="h-4 w-4" />,
  form_submit: <FileText className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Disparo Manual',
  contact_created: 'Contato Criado',
  tag_added: 'Tag Adicionada',
  group_added: 'Grupo Adicionado',
  form_submit: 'Formulário Enviado',
  date: 'Data/Hora',
}

type NodeData = Record<string, unknown>

export function TriggerNode({ data, selected }: NodeProps) {
  const d = data as NodeData
  const triggerType = typeof d.trigger_type === 'string' ? d.trigger_type : 'manual'
  const sublabel = typeof d.label === 'string' ? d.label : null
  const label = TRIGGER_LABELS[triggerType] ?? 'Gatilho'

  return (
    <div
      className={`
        min-w-[180px] rounded-xl border-2 bg-white shadow-sm
        ${selected ? 'border-[#7C3AED]' : 'border-[#7C3AED]/40'}
      `}
    >
      <div className="flex items-center gap-2 rounded-t-[10px] bg-[#7C3AED] px-3 py-2">
        <div className="text-white">{TRIGGER_ICONS[triggerType]}</div>
        <span className="text-xs font-semibold uppercase tracking-wider text-white">Gatilho</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-[#1E1B4B]">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs text-[#737373]">{sublabel}</p>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!border-[#7C3AED] !bg-white" />
    </div>
  )
}
