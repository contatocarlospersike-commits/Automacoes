import { getCampaigns } from '@/features/campaigns/actions'
import { CampaignsList } from '@/features/campaigns/campaigns-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function CampaignsPage() {
  const { campaigns } = await getCampaigns()

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Campanhas
            </h1>
            <p className="mt-1 text-sm font-medium text-white/70">
              Disparo em massa com rastreamento completo. Cada mensagem monitorada.
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button className="brekva-gradient-cta text-white hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      <CampaignsList campaigns={campaigns} />
    </div>
  )
}
