'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CheckCircle2 } from 'lucide-react'

type NodeData = Record<string, unknown>

export function EndNode({ data, selected }: NodeProps) {
  const d = data as NodeData
  const label = typeof d.label === 'string' ? d.label : 'Automação concluída'

  return (
    <div
      className={`
        min-w-[140px] rounded-xl border-2 bg-white shadow-sm
        ${selected ? 'border-[#737373]' : 'border-[#737373]/40'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!border-[#737373] !bg-white" />
      <div className="flex items-center gap-2 rounded-t-[10px] bg-[#737373] px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-white" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white">Fim</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-[#1E1B4B]">{label}</p>
      </div>
    </div>
  )
}
