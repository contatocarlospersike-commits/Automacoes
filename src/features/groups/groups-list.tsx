'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { deleteGroup } from '@/features/groups/actions'
import { Loader2, Trash2, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['contact_groups']['Row'] & {
  contact_group_members: [{ count: number }]
}

interface GroupsListProps {
  groups: Group[]
}

function GroupCard({ group }: { group: Group }) {
  const [isPending, startTransition] = useTransition()
  const count = group.contact_group_members?.[0]?.count ?? 0

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGroup(group.id)
      if (result.success) {
        toast.success('Grupo removido')
      } else {
        toast.error(result.error ?? 'Erro ao remover grupo')
      }
    })
  }

  return (
    <Card className="bg-[#1E293B] border-white/5 hover:border-white/10 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: group.color + '22', border: `1px solid ${group.color}44` }}
            >
              <Users className="h-5 w-5" style={{ color: group.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#FAFAFA] truncate">{group.name}</p>
              {group.description && (
                <p className="text-xs text-[#737373] truncate mt-0.5">{group.description}</p>
              )}
              <p className="text-xs text-[#A3A3A3] mt-1">
                {count} {count === 1 ? 'contato' : 'contatos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isPending}
              className="h-8 w-8 text-[#737373] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 text-[#737373] hover:text-[#FAFAFA]"
            >
              <Link href={`/groups/${group.id}`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-[#0F172A] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: count > 0 ? `${Math.min(100, (count / 1000) * 100)}%` : '0%',
                backgroundColor: group.color,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GroupsList({ groups }: GroupsListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-[#7C3AED]" />
        </div>
        <p className="text-[#FAFAFA] font-semibold text-lg">Nenhum grupo criado</p>
        <p className="text-[#737373] text-sm mt-1">
          Organize seus contatos em grupos para disparos segmentados.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}
