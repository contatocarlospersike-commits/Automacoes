import { getContacts } from '@/features/contacts/actions'
import { ContactsTable } from '@/features/contacts/contacts-table'
import { ImportDialog } from '@/features/contacts/import-dialog'

interface ContactsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams
  const search = params.q ?? ''
  const page = parseInt(params.page ?? '1', 10)

  const { contacts, total } = await getContacts(search, page)

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Contatos
            </h1>
            <p className="mt-1 text-sm font-medium text-white/70">
              Sua base de destinatarios. Importe, segmente, dispare.
            </p>
          </div>
          <ImportDialog />
        </div>
      </div>

      <ContactsTable
        initialContacts={contacts}
        initialTotal={total}
        searchQuery={search}
        currentPage={page}
      />
    </div>
  )
}
