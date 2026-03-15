import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EmailTemplateEditor } from '@/features/email-templates/email-template-editor'
import { getEmailTemplate } from '@/features/email-templates/actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditEmailTemplatePage({ params }: PageProps) {
  const { id } = await params
  const { template } = await getEmailTemplate(id)

  if (!template) notFound()

  return (
    <div className="space-y-8">
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4 text-white/60 hover:text-white">
          <Link href="/email/templates">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Templates
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Editar Template</h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          {template.name}
        </p>
      </div>
      <EmailTemplateEditor template={template} />
    </div>
  )
}
