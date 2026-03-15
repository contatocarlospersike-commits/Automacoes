'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toast } from 'sonner'
import { Save, Play, Pause, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NodePalette } from '@/features/automations/node-palette'
import { NodeConfigPanel } from '@/features/automations/node-config-panel'
import { TriggerNode } from '@/features/automations/nodes/trigger-node'
import { ActionNode } from '@/features/automations/nodes/action-node'
import { WaitNode } from '@/features/automations/nodes/wait-node'
import { ConditionNode } from '@/features/automations/nodes/condition-node'
import { EndNode } from '@/features/automations/nodes/end-node'
import { updateAutomationFlow, updateAutomationMeta } from '@/features/automations/actions'

const NODE_TYPES = {
  trigger: TriggerNode,
  action: ActionNode,
  wait: WaitNode,
  condition: ConditionNode,
  end: EndNode,
}

const DEFAULT_EDGE_OPTIONS = {
  markerEnd: { type: MarkerType.ArrowClosed, color: '#7C3AED' },
  style: { stroke: '#7C3AED', strokeWidth: 1.5 },
}

interface AutomationCanvasProps {
  automation: {
    id: string
    name: string
    is_active: boolean
    flow_json: { nodes: Node[]; edges: Edge[] }
  }
}

export function AutomationCanvas({ automation }: AutomationCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(automation.flow_json?.nodes ?? [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(automation.flow_json?.edges ?? [])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [saving, setSaving] = useState(false)
  const [isActive, setIsActive] = useState(automation.is_active)
  const nodeIdRef = useRef(Date.now())

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, ...DEFAULT_EDGE_OPTIONS }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleAddNode = useCallback(
    (type: string, data: Record<string, unknown>) => {
      const id = `node_${++nodeIdRef.current}`
      const newNode: Node = {
        id,
        type,
        position: { x: 250 + Math.random() * 80, y: 100 + nodes.length * 120 },
        data,
      }
      setNodes((nds) => [...nds, newNode])
      setSelectedNode(newNode)
    },
    [nodes.length, setNodes]
  )

  const handleUpdateNode = useCallback(
    (id: string, data: Record<string, unknown>) => {
      if (data._delete) {
        setNodes((nds) => nds.filter((n) => n.id !== id))
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
        setSelectedNode(null)
        return
      }
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data } : n))
      )
      setSelectedNode((prev) => (prev?.id === id ? { ...prev, data } : prev))
    },
    [setNodes, setEdges]
  )

  async function handleSave() {
    setSaving(true)
    const result = await updateAutomationFlow(automation.id, { nodes, edges })
    setSaving(false)
    if (result.success) toast.success('Automação salva')
    else toast.error(result.error ?? 'Erro ao salvar')
  }

  async function handleToggleActive() {
    const newActive = !isActive
    const result = await updateAutomationMeta(automation.id, { is_active: newActive })
    if (result.success) {
      setIsActive(newActive)
      toast.success(newActive ? 'Automação ativada' : 'Automação pausada')
    } else {
      toast.error(result.error ?? 'Erro ao atualizar status')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1E1B4B]">{automation.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isActive
                ? 'bg-[#10B981]/10 text-[#10B981]'
                : 'bg-[#737373]/10 text-[#737373]'
            }`}
          >
            {isActive ? 'Ativa' : 'Pausada'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            className="h-8 gap-1.5 text-xs"
          >
            {isActive ? (
              <><Pause className="h-3.5 w-3.5" /> Pausar</>
            ) : (
              <><Play className="h-3.5 w-3.5" /> Ativar</>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 gap-1.5 bg-[#7C3AED] text-xs hover:bg-[#6D28D9]"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette onAddNode={handleAddNode} />

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E5E5E5" />
            <Controls className="border border-[#E5E5E5] rounded-lg shadow-sm" />
            <MiniMap
              nodeColor={(n) => {
                const colors: Record<string, string> = {
                  trigger: '#7C3AED',
                  action: '#0EA5E9',
                  wait: '#F59E0B',
                  condition: '#10B981',
                  end: '#737373',
                }
                return colors[n.type ?? ''] ?? '#aaa'
              }}
              className="border border-[#E5E5E5] rounded-lg shadow-sm"
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  )
}
