import { getGroupWithMembers } from '@/features/groups/actions'
import { getContacts } from '@/features/contacts/actions'
import { AddContactsDialog } from '@/features/groups/add-contacts-dialog'
import { GroupMembersList } from '@/features/groups/group-members-list'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GroupPageProps {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const [{ group, members }, { contacts }] = await Promise.all([
    getGroupWithMembers(id),
    getContacts('', 1, 1000),
  ])

  if (!group) notFound()

  const existingIds = new Set(members.map((m: Record<string, unknown>) => m.contact_id as string))

  return (
    <div className="space-y-8">
      <div
        className="-mx-6 -mt-6 px-8 py-10 rounded-b-2xl"
        style={{
          background: `linear-gradient(135deg, ${group.color}33 0%, ${group.color}11 100%)`,
          borderBottom: `1px solid ${group.color}33`,
        }}
      >
        <Button variant="ghost" size="sm" asChild className="mb-4 text-white/60 hover:text-white">
          <Link href="/groups">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Grupos
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: group.color + '33' }}
              >
                <Users className="h-5 w-5" style={{ color: group.color }} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{group.name}</h1>
            </div>
            {group.description && (
              <p className="mt-2 text-sm text-white/60">{group.description}</p>
            )}
            <p className="mt-1 text-sm text-white/40">
              {members.length} {members.length === 1 ? 'contato' : 'contatos'}
            </p>
          </div>
          <AddContactsDialog
            groupId={group.id}
            allContacts={contacts}
            existingContactIds={existingIds}
          />
        </div>
      </div>

      <GroupMembersList groupId={group.id} members={members as any} />
    </div>
  )
}
