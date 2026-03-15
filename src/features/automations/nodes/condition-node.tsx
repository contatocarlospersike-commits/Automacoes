'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

type NodeData = Record<string, unknown>

export function ConditionNode({ data, selected }: NodeProps) {
  const d = data as NodeData
  const label = typeof d.label === 'string' ? d.label : 'Se / Então'
  const condition = typeof d.condition === 'string' ? d.condition : null

  return (
    <div
      className={`
        min-w-[180px] rounded-xl border-2 bg-white shadow-sm
        ${selected ? 'border-[#10B981]' : 'border-[#10B981]/40'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!border-[#10B981] !bg-white" />
      <div className="flex items-center gap-2 rounded-t-[10px] bg-[#10B981] px-3 py-2">
        <GitBranch className="h-4 w-4 text-white" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white">Condição</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-[#1E1B4B]">{label}</p>
        {condition && <p className="mt-0.5 text-xs text-[#737373]">{condition}</p>}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '30%' }}
        className="!border-[#10B981] !bg-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '70%' }}
        className="!border-[#F43F5E] !bg-white"
      />
      <div className="flex justify-between px-4 pb-1 text-[10px] text-[#737373]">
        <span>Sim</span>
        <span>Não</span>
      </div>
    </div>
  )
}
