'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { UserPlus, Loader2, Search } from 'lucide-react'
import { addContactsToGroup } from '@/features/groups/actions'
import type { Database } from '@/types/database'

type Contact = Database['public']['Tables']['contacts']['Row']

interface AddContactsDialogProps {
  groupId: string
  allContacts: Contact[]
  existingContactIds: Set<string>
}

export function AddContactsDialog({
  groupId,
  allContacts,
  existingContactIds,
}: AddContactsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const available = useMemo(
    () =>
      allContacts.filter(
        (c) =>
          !existingContactIds.has(c.id) &&
          (c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search))
      ),
    [allContacts, existingContactIds, search]
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    if (selected.size === 0) return
    startTransition(async () => {
      const result = await addContactsToGroup(groupId, Array.from(selected))
      if (result.success) {
        toast.success(`${selected.size} contato(s) adicionado(s)`)
        setOpen(false)
        setSelected(new Set())
        setSearch('')
      } else {
        toast.error(result.error ?? 'Erro ao adicionar contatos')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Contatos
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1E293B] border-white/10 text-[#FAFAFA] max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar ao Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contatos..."
              className="pl-9 bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {available.length === 0 ? (
              <p className="text-center text-[#737373] py-8 text-sm">
                {search ? 'Nenhum contato encontrado' : 'Todos os contatos ja estao no grupo'}
              </p>
            ) : (
              available.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <Checkbox
                    checked={selected.has(contact.id)}
                    onCheckedChange={() => toggle(contact.id)}
                    className="border-white/20"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#FAFAFA] truncate">{contact.name}</p>
                    <p className="text-xs text-[#737373] truncate">{contact.phone}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          {selected.size > 0 && (
            <p className="text-xs text-[#A78BFA]">{selected.size} selecionado(s)</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-[#A3A3A3] hover:text-[#FAFAFA]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selected.size === 0 || isPending}
              className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
