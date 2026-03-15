'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { createGroup } from '@/features/groups/actions'

const COLOR_OPTIONS = [
  '#7C3AED',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#6B7280',
]

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])

  const handleSubmit = () => {
    if (!name.trim()) return

    startTransition(async () => {
      const result = await createGroup(name, color, description)
      if (result.success) {
        toast.success('Grupo criado com sucesso')
        setOpen(false)
        setName('')
        setDescription('')
        setColor(COLOR_OPTIONS[0])
      } else {
        toast.error(result.error ?? 'Erro ao criar grupo')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1E293B] border-white/10 text-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle>Criar Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-[#D4D4D4]">Nome do grupo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clientes VIP"
              className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#D4D4D4]">Descricao (opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Clientes com ticket acima de R$500"
              className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#D4D4D4]">Cor</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full ring-offset-2 ring-offset-[#1E293B] transition-all"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-[#A3A3A3] hover:text-[#FAFAFA]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isPending}
              className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Grupo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
