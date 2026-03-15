import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAutomation } from '@/features/automations/actions'
import { AutomationCanvas } from '@/features/automations/automation-canvas'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AutomationEditorPage({ params }: Props) {
  const { id } = await params
  const { automation } = await getAutomation(id)
  if (!automation) notFound()

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col -mx-6 -mb-6">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] bg-white px-6 py-2">
        <Button variant="ghost" size="sm" asChild className="h-7 gap-1 text-xs text-[#737373] hover:text-[#1E1B4B]">
          <Link href="/automations">
            <ArrowLeft className="h-3.5 w-3.5" />
            Automações
          </Link>
        </Button>
        <span className="text-[#E5E5E5]">/</span>
        <span className="text-xs font-medium text-[#1E1B4B]">{automation.name}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <AutomationCanvas automation={automation as any} />
      </div>
    </div>
  )
}
