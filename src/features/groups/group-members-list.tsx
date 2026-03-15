'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { removeContactFromGroup } from '@/features/groups/actions'
import { UserMinus, Loader2, Phone, Mail } from 'lucide-react'

interface Member {
  contact_id: string
  added_at: string
  contacts: {
    id: string
    name: string
    phone: string
    email: string | null
  } | null
}

interface GroupMembersListProps {
  groupId: string
  members: Member[]
}

function MemberRow({ groupId, member }: { groupId: string; member: Member }) {
  const [isPending, startTransition] = useTransition()
  const contact = member.contacts
  if (!contact) return null

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeContactFromGroup(groupId, member.contact_id)
      if (result.success) {
        toast.success('Contato removido do grupo')
      } else {
        toast.error(result.error ?? 'Erro ao remover')
      }
    })
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-[#312E81] flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-[#A78BFA]">
            {contact.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#FAFAFA] truncate">{contact.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-[#737373] flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {contact.phone}
            </span>
            {contact.email && (
              <span className="text-xs text-[#737373] flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {contact.email}
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        disabled={isPending}
        className="text-[#737373] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 flex-shrink-0"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserMinus className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

export function GroupMembersList({ groupId, members }: GroupMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[#FAFAFA] font-semibold">Grupo vazio</p>
        <p className="text-[#737373] text-sm mt-1">Adicione contatos usando o botao acima.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1E293B] rounded-xl border border-white/5">
      <div className="px-4 py-3 border-b border-white/5">
        <p className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
          Membros ({members.length})
        </p>
      </div>
      <div className="divide-y divide-white/5">
        {members.map((member) => (
          <MemberRow key={member.contact_id} groupId={groupId} member={member} />
        ))}
      </div>
    </div>
  )
}
