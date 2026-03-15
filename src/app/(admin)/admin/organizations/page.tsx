import { Building2, Contact, MessageSquare, Search, Send, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { getOrganizations } from '@/features/admin/actions'

export default async function AdminOrganizationsPage() {
  const organizations = await getOrganizations()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-bold text-white">Organizacoes</h1>
        <p className="mt-1 text-white/70">
          {organizations.length} organizacao{organizations.length !== 1 ? 'es' : ''} cadastrada{organizations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="brekva-card rounded-xl overflow-hidden">
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-[#334155] mb-4" />
            <p className="text-sm text-[#A3A3A3]">Nenhuma organizacao cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#737373]">
                    Organizacao
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#737373]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-[#737373]">
                    <Contact className="inline h-3.5 w-3.5 mr-1" />
                    Contatos
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-[#737373]">
                    <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
                    Msgs (mes)
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-[#737373]">
                    <Send className="inline h-3.5 w-3.5 mr-1" />
                    Campanhas
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-[#737373]">
                    WABA
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[#737373]">
                    Criada em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(124,58,237,0.1)]">
                          <Building2 className="h-4 w-4 text-[#A78BFA]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#FAFAFA] group-hover:text-[#A78BFA] transition-colors">
                            {org.name}
                          </p>
                          <p className="text-xs text-[#737373]">
                            {org.memberCount} membro{org.memberCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {org.is_active ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[rgba(16,185,129,0.12)] text-[#10B981]">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[rgba(244,63,94,0.12)] text-[#F43F5E]">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="brekva-metric text-sm">
                        {org.contactCount.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="brekva-metric text-sm">
                        {org.messagesThisMonth.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="brekva-metric text-sm">
                        {org.campaignsThisMonth}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {org.isConnected ? (
                        <Wifi className="inline h-4 w-4 text-[#10B981]" />
                      ) : (
                        <WifiOff className="inline h-4 w-4 text-[#525252]" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-[#737373]">
                      {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
