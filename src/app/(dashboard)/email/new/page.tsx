import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EmailCampaignWizard } from '@/features/email-campaigns/email-campaign-wizard'
import { getEmailTemplates } from '@/features/email-templates/actions'
import { getGroups } from '@/features/groups/actions'
import { getTags } from '@/features/tags/actions'
import { getContacts } from '@/features/contacts/actions'

export default async function NewEmailCampaignPage() {
  const [{ templates }, { groups }, { tags }, { total }] = await Promise.all([
    getEmailTemplates(),
    getGroups(),
    getTags(),
    getContacts('', 1, 1),
  ])

  return (
    <div className="space-y-8">
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4 text-white/60 hover:text-white">
          <Link href="/email">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Email Marketing
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Nova Campanha de Email</h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          Configure e dispare em 4 passos.
        </p>
      </div>

      <EmailCampaignWizard
        templates={templates}
        groups={groups as any}
        tags={tags as any}
        totalContacts={total}
      />
    </div>
  )
}
