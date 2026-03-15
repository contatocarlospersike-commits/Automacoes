import Link from 'next/link'
import { getEmailTemplates } from '@/features/email-templates/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Edit, FileText, Plus, Trash2 } from 'lucide-react'
import { DeleteEmailTemplateButton } from '@/features/email-templates/delete-template-button'

export default async function EmailTemplatesPage() {
  const { templates } = await getEmailTemplates()

  return (
    <div className="space-y-8">
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4 text-white/60 hover:text-white">
          <Link href="/email">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Email Marketing
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Templates de Email</h1>
            <p className="mt-1 text-sm font-medium text-white/70">
              Crie templates HTML reutilizaveis com variaveis dinamicas.
            </p>
          </div>
          <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/20">
            <Link href="/email/templates/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Link>
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-[#7C3AED]" />
          </div>
          <p className="text-[#FAFAFA] font-semibold">Nenhum template criado</p>
          <p className="text-[#737373] text-sm mt-1">Crie seu primeiro template HTML de email.</p>
          <Button asChild className="mt-4 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white">
            <Link href="/email/templates/new">
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="bg-[#1E293B] border-white/5 hover:border-white/10 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-[#7C3AED]" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-[#737373] hover:text-[#FAFAFA]">
                      <Link href={`/email/templates/${t.id}/edit`}>
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <DeleteEmailTemplateButton id={t.id} />
                  </div>
                </div>
                <p className="font-semibold text-[#FAFAFA] text-sm truncate">{t.name}</p>
                <p className="text-xs text-[#737373] mt-1 truncate">Assunto: {t.subject}</p>
                <p className="text-xs text-[#525252] mt-0.5">Por: {t.from_name}</p>
                {Array.isArray(t.variables) && (t.variables as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(t.variables as string[]).slice(0, 3).map((v) => (
                      <span key={v} className="text-[10px] bg-[#7C3AED]/15 text-[#A78BFA] rounded-full px-2 py-0.5">
                        {'{{'}{v}{'}}'}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
