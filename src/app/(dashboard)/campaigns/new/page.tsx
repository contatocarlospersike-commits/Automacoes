import { getTemplates } from '@/features/templates/actions'
import { getContacts } from '@/features/contacts/actions'
import { CampaignWizard } from '@/features/campaigns/campaign-wizard'

export default async function NewCampaignPage() {
  const [{ templates }, { contacts }] = await Promise.all([
    getTemplates(),
    getContacts(undefined, 1, 500),
  ])

  return <CampaignWizard templates={templates} contacts={contacts} />
}
