import { getGroups } from '@/features/groups/actions'
import { GroupsList } from '@/features/groups/groups-list'
import { CreateGroupDialog } from '@/features/groups/create-group-dialog'
import { Users } from 'lucide-react'

export default async function GroupsPage() {
  const { groups } = await getGroups()

  return (
    <div className="space-y-8">
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Grupos</h1>
            <p className="mt-1 text-sm font-medium text-white/70">
              Segmente sua base. Dispare para o publico certo.
            </p>
          </div>
          <CreateGroupDialog />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-[#737373]">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}</span>
        </div>
      </div>

      <GroupsList groups={groups as any} />
    </div>
  )
}
