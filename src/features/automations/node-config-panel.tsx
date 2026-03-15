'use client'

import { type Node } from '@xyflow/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface NodeConfigPanelProps {
  node: Node
  onUpdate: (id: string, data: Record<string, unknown>) => void
  onClose: () => void
}

export function NodeConfigPanel({ node, onUpdate, onClose }: NodeConfigPanelProps) {
  const data = node.data as Record<string, unknown>

  function set(key: string, value: unknown) {
    onUpdate(node.id, { ...data, [key]: value })
  }

  return (
    <div className="flex h-full w-64 flex-col border-l border-[#E5E5E5] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Configurar bloco</p>
        <button onClick={onClose} className="text-[#737373] hover:text-[#1E1B4B]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label (common to all) */}
        <div className="space-y-1.5">
          <Label className="text-xs">Nome do bloco</Label>
          <Input
            value={(data.label as string) ?? ''}
            onChange={(e) => set('label', e.target.value)}
            placeholder="Nome do bloco"
            className="h-8 text-sm"
          />
        </div>

        {/* TRIGGER */}
        {node.type === 'trigger' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de gatilho</Label>
            <Select value={(data.trigger_type as string) ?? 'manual'} onValueChange={(v) => set('trigger_type', v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="contact_created">Contato criado</SelectItem>
                <SelectItem value="tag_added">Tag adicionada</SelectItem>
                <SelectItem value="group_added">Grupo adicionado</SelectItem>
                <SelectItem value="form_submit">Formulário enviado</SelectItem>
                <SelectItem value="date">Data/Hora</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ACTION */}
        {node.type === 'action' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de ação</Label>
              <Select value={(data.action_type as string) ?? 'send_whatsapp'} onValueChange={(v) => set('action_type', v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_whatsapp">Enviar WhatsApp</SelectItem>
                  <SelectItem value="send_email">Enviar Email</SelectItem>
                  <SelectItem value="add_tag">Adicionar Tag</SelectItem>
                  <SelectItem value="remove_tag">Remover Tag</SelectItem>
                  <SelectItem value="add_to_group">Adicionar ao Grupo</SelectItem>
                  <SelectItem value="remove_from_group">Remover do Grupo</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(data.action_type === 'send_whatsapp' || data.action_type === 'send_email') && (
              <div className="space-y-1.5">
                <Label className="text-xs">Mensagem / Assunto</Label>
                <Textarea
                  value={(data.message as string) ?? ''}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder="Conteúdo da mensagem..."
                  rows={4}
                  className="text-sm resize-none"
                />
                <p className="text-xs text-[#737373]">Use {'{{nome}}'}, {'{{email}}'} para variáveis.</p>
              </div>
            )}

            {(data.action_type === 'add_tag' || data.action_type === 'remove_tag') && (
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da tag</Label>
                <Input
                  value={(data.tag_name as string) ?? ''}
                  onChange={(e) => set('tag_name', e.target.value)}
                  placeholder="ex: cliente-vip"
                  className="h-8 text-sm"
                />
              </div>
            )}

            {data.action_type === 'webhook' && (
              <div className="space-y-1.5">
                <Label className="text-xs">URL do Webhook</Label>
                <Input
                  value={(data.webhook_url as string) ?? ''}
                  onChange={(e) => set('webhook_url', e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-sm"
                />
              </div>
            )}
          </>
        )}

        {/* WAIT */}
        {node.type === 'wait' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Duração</Label>
              <Input
                type="number"
                min={1}
                value={(data.duration as number) ?? 1}
                onChange={(e) => set('duration', Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unidade</Label>
              <Select value={(data.unit as string) ?? 'days'} onValueChange={(v) => set('unit', v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                  <SelectItem value="weeks">Semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* CONDITION */}
        {node.type === 'condition' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Condição</Label>
            <Input
              value={(data.condition as string) ?? ''}
              onChange={(e) => set('condition', e.target.value)}
              placeholder="ex: tag = cliente-vip"
              className="h-8 text-sm"
            />
            <p className="text-xs text-[#737373]">
              Saída <strong>Sim</strong> (esq) ou <strong>Não</strong> (dir)
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E5E5] p-3">
        <Button
          variant="destructive"
          size="sm"
          className="w-full text-xs"
          onClick={() => onUpdate(node.id, { ...data, _delete: true })}
        >
          Remover bloco
        </Button>
      </div>
    </div>
  )
}
