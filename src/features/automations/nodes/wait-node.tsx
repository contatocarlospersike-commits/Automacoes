'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Clock } from 'lucide-react'

const UNIT_LABEL: Record<string, string> = { minutes: 'min', hours: 'h', days: 'dias', weeks: 'semanas' }

type NodeData = Record<string, unknown>

export function WaitNode({ data, selected }: NodeProps) {
  const d = data as NodeData
  const duration = typeof d.duration === 'number' ? d.duration : 1
  const unit = typeof d.unit === 'string' ? d.unit : 'days'
  const sublabel = typeof d.label === 'string' ? d.label : null

  return (
    <div
      className={`
        min-w-[160px] rounded-xl border-2 bg-white shadow-sm
        ${selected ? 'border-[#F59E0B]' : 'border-[#F59E0B]/40'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!border-[#F59E0B] !bg-white" />
      <div className="flex items-center gap-2 rounded-t-[10px] bg-[#F59E0B] px-3 py-2">
        <Clock className="h-4 w-4 text-white" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white">Aguardar</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-[#1E1B4B]">
          {duration} {UNIT_LABEL[unit] ?? unit}
        </p>
        {sublabel && <p className="mt-0.5 text-xs text-[#737373]">{sublabel}</p>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!border-[#F59E0B] !bg-white" />
    </div>
  )
}
