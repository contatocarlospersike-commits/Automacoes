'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createAutomation } from '@/features/automations/actions'

export function CreateAutomationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState('manual')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      const r = await createAutomation({ name, description, trigger_type: triggerType })
      if (r.success && r.automation) {
        toast.success('Automação criada')
        setOpen(false)
        router.push(`/automations/${r.automation.id}`)
      } else {
        toast.error(r.error ?? 'Erro ao criar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="h-4 w-4" />
          Nova Automação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Automação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Boas-vindas para novos contatos"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Gatilho</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
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
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que essa automação faz?"
              rows={2}
              className="resize-none"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9]"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Criar e abrir editor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
