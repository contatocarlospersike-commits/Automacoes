'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { createContact, updateContact, softDeleteContact, softDeleteContacts } from '@/features/contacts/actions'
import { Edit, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import type { Database } from '@/types/database'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactsTableProps {
  initialContacts: Contact[]
  initialTotal: number
  searchQuery?: string
  currentPage: number
}

export function ContactsTable({
  initialContacts,
  initialTotal,
  searchQuery = '',
  currentPage,
}: ContactsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const totalPages = Math.ceil(initialTotal / 25)

  const allSelected = initialContacts.length > 0 && selectedIds.size === initialContacts.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < initialContacts.length

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(initialContacts.map((c) => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreate = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Nome e telefone são obrigatórios')
      return
    }
    startTransition(async () => {
      const result = await createContact({ name, phone, email })
      if (result.success) {
        toast.success('Contato criado!')
        setIsCreateOpen(false)
        resetForm()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleUpdate = async () => {
    if (!editingContact) return
    startTransition(async () => {
      const result = await updateContact(editingContact.id, { name, phone, email })
      if (result.success) {
        toast.success('Contato atualizado!')
        setEditingContact(null)
        resetForm()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await softDeleteContact(id)
      if (result.success) {
        toast.success('Contato removido')
        setDeleteConfirm(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    startTransition(async () => {
      const result = await softDeleteContacts(ids)
      if (result.success) {
        toast.success(`${result.deleted} contato${result.deleted !== 1 ? 's' : ''} removido${result.deleted !== 1 ? 's' : ''}`)
        setSelectedIds(new Set())
        setBulkDeleteConfirm(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const openEdit = (contact: Contact) => {
    setEditingContact(contact)
    setName(contact.name)
    setPhone(contact.phone)
    setEmail(contact.email ?? '')
  }

  return (
    <div className="space-y-4">
      {/* Search + Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <form className="flex-1 max-w-sm" action="/contacts" method="get">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar por nome, telefone ou email..."
              className="pl-9"
              defaultValue={searchQuery}
            />
          </div>
        </form>

        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          )}

          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Contato</DialogTitle>
                <DialogDescription>Adicione um contato manualmente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+5511999999999" />
                  <p className="text-xs text-muted-foreground">Formato: +55 11 99999-9999</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" type="email" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              initialContacts.map((contact) => (
                <TableRow key={contact.id} data-state={selectedIds.has(contact.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                      aria-label={`Selecionar ${contact.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                  <TableCell>{contact.email ?? '—'}</TableCell>
                  <TableCell>
                    {contact.opted_out_at ? (
                      <Badge variant="destructive">Opt-out</Badge>
                    ) : (
                      <Badge variant="secondary">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(contact.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {initialTotal} contato{initialTotal !== 1 ? 's' : ''} no total
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/contacts?page=${currentPage - 1}${searchQuery ? `&q=${searchQuery}` : ''}`}>
                  Anterior
                </a>
              </Button>
            )}
            <span className="flex items-center text-sm px-2">
              Página {currentPage} de {totalPages}
            </span>
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/contacts?page=${currentPage + 1}${searchQuery ? `&q=${searchQuery}` : ''}`}>
                  Próxima
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => { if (!open) { setEditingContact(null); resetForm() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContact(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              O contato será removido. Esta ação pode ser desfeita pelo administrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {selectedIds.size} contato{selectedIds.size !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              {selectedIds.size} contato{selectedIds.size !== 1 ? 's serão removidos' : ' será removido'}. Esta ação pode ser desfeita pelo administrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir {selectedIds.size} contato{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
