import { getTemplates } from '@/features/templates/actions'
import { TemplatesList } from '@/features/templates/templates-list'

export default async function TemplatesPage() {
  const { templates } = await getTemplates()

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Templates
        </h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          Mensagens pre-aprovadas pela Meta. Crie, edite, dispare.
        </p>
      </div>

      <TemplatesList templates={templates} />
    </div>
  )
}
