'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Save, Eye, EyeOff, Loader2, Code } from 'lucide-react'
import { createEmailTemplate, updateEmailTemplate } from '@/features/email-templates/actions'
import { extractVariables } from '@/lib/resend/client'
import type { Database } from '@/types/database'

type EmailTemplate = Database['public']['Tables']['email_templates']['Row']

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #0F172A; font-family: 'Inter', system-ui, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #1E293B; border-radius: 12px; padding: 40px; border: 1px solid rgba(255,255,255,0.05); }
    .logo { font-size: 20px; font-weight: 800; color: #7C3AED; letter-spacing: -0.02em; margin-bottom: 32px; }
    h1 { font-size: 24px; font-weight: 700; color: #FAFAFA; margin: 0 0 16px; }
    p { font-size: 16px; line-height: 1.6; color: #A3A3A3; margin: 0 0 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #8B5CF6); color: #FAFAFA; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .footer { margin-top: 32px; font-size: 12px; color: #525252; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">BREKVA</div>
      <h1>Ola, {{name}}!</h1>
      <p>Aqui vai o conteudo principal do seu email. Use {{name}} e outras variaveis para personalizar.</p>
      <p>Adicione quantos paragrafos precisar. Mantenha a mensagem clara e direta.</p>
      <a href="#" class="btn">Chamar para Acao</a>
    </div>
    <div class="footer">
      Voce esta recebendo este email porque se cadastrou em nossa lista.<br>
      <a href="#" style="color: #7C3AED;">Cancelar inscricao</a>
    </div>
  </div>
</body>
</html>`

interface EmailTemplateEditorProps {
  template?: EmailTemplate
}

export function EmailTemplateEditor({ template }: EmailTemplateEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPreview, setShowPreview] = useState(false)

  const [name, setName] = useState(template?.name ?? '')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [fromName, setFromName] = useState(template?.from_name ?? 'BREKVA')
  const [previewText, setPreviewText] = useState(template?.preview_text ?? '')
  const [html, setHtml] = useState(template?.html_body ?? DEFAULT_HTML)

  const detectedVars = extractVariables(html)

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || !html.trim()) {
      toast.error('Preencha nome, assunto e conteudo HTML')
      return
    }

    startTransition(async () => {
      const input = { name, subject, from_name: fromName, html_body: html, preview_text: previewText }
      const result = template
        ? await updateEmailTemplate(template.id, input)
        : await createEmailTemplate(input)

      if (result.success) {
        toast.success(template ? 'Template atualizado' : 'Template criado')
        router.push('/email')
      } else {
        toast.error(result.error ?? 'Erro ao salvar')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[#D4D4D4]">Nome do template</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Boas-vindas"
            className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[#D4D4D4]">Nome do remetente</Label>
          <Input
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="BREKVA"
            className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-[#D4D4D4]">Assunto do email</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Bem-vindo, {{name}}!"
            className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-[#D4D4D4]">Texto de preview (opcional)</Label>
          <Input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Aparece no preview do inbox antes de abrir o email"
            className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
          />
        </div>
      </div>

      {/* Variables detected */}
      {detectedVars.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#737373]">Variaveis detectadas:</span>
          {detectedVars.map((v) => (
            <Badge
              key={v}
              className="bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/30 text-xs"
            >
              {'{{' + v + '}}'}
            </Badge>
          ))}
        </div>
      )}

      {/* HTML Editor + Preview toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[#D4D4D4] flex items-center gap-2">
            <Code className="h-4 w-4" />
            HTML do email
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-[#A3A3A3] hover:text-[#FAFAFA]"
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? 'Editar' : 'Preview'}
          </Button>
        </div>

        {showPreview ? (
          <div className="rounded-xl border border-white/10 overflow-hidden h-[500px] bg-white">
            <iframe
              srcDoc={html}
              className="w-full h-full"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full h-[500px] bg-[#0F172A] border border-white/10 rounded-xl text-[#FAFAFA] text-xs font-mono p-4 resize-none focus:outline-none focus:ring-1 focus:ring-[#7C3AED] placeholder:text-[#737373]"
            placeholder="Cole seu HTML aqui. Use {{name}}, {{email}} para personalizar."
            spellCheck={false}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push('/email')}
          className="text-[#A3A3A3] hover:text-[#FAFAFA]"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          {template ? 'Salvar Alteracoes' : 'Criar Template'}
        </Button>
      </div>
    </div>
  )
}
