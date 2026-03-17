'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Save, Eye, EyeOff, Loader2, Bold, Italic, Strikethrough,
  Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Link, Type, Variable, Heading1, Heading2, Minus, Undo, Redo
} from 'lucide-react'
import { createEmailTemplate, updateEmailTemplate } from '@/features/email-templates/actions'
import { extractVariables } from '@/lib/resend/client'
import type { Database } from '@/types/database'

type EmailTemplate = Database['public']['Tables']['email_templates']['Row']

interface EmailTemplateEditorProps {
  template?: EmailTemplate
}

const VARIABLES = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
]

function wrapInEmailLayout(bodyHtml: string): string {
  return `<!DOCTYPE html>
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
    h2 { font-size: 20px; font-weight: 600; color: #FAFAFA; margin: 0 0 12px; }
    p { font-size: 16px; line-height: 1.6; color: #A3A3A3; margin: 0 0 16px; }
    a { color: #7C3AED; }
    ul, ol { color: #A3A3A3; font-size: 16px; line-height: 1.6; padding-left: 24px; margin: 0 0 16px; }
    hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #8B5CF6); color: #FAFAFA; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .footer { margin-top: 32px; font-size: 12px; color: #525252; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">BREKVA</div>
      ${bodyHtml}
    </div>
    <div class="footer">
      Voce esta recebendo este email porque se cadastrou em nossa lista.<br>
      <a href="#" style="color: #7C3AED;">Cancelar inscricao</a>
    </div>
  </div>
</body>
</html>`
}

const DEFAULT_BODY = `<h1>Ola, {{name}}!</h1>
<p>Aqui vai o conteudo principal do seu email. Escreva sua mensagem aqui.</p>
<p>Use as variaveis para personalizar a mensagem para cada contato.</p>
<a href="#" class="btn">Chamar para Acao</a>`

function extractBodyFromHtml(fullHtml: string): string {
  // Extract content between logo div and footer div
  const logoEnd = fullHtml.indexOf('</div>', fullHtml.indexOf('class="logo"'))
  const footerStart = fullHtml.indexOf('<div class="footer">')
  const cardEnd = fullHtml.lastIndexOf('</div>', footerStart)

  if (logoEnd > 0 && cardEnd > logoEnd) {
    const body = fullHtml.substring(logoEnd + 6, cardEnd).trim()
    return body || DEFAULT_BODY
  }
  return DEFAULT_BODY
}

export function EmailTemplateEditor({ template }: EmailTemplateEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPreview, setShowPreview] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState(template?.name ?? '')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [fromName, setFromName] = useState(template?.from_name ?? 'BREKVA')
  const [previewText, setPreviewText] = useState(template?.preview_text ?? '')

  const existingBody = template?.html_body ? extractBodyFromHtml(template.html_body) : DEFAULT_BODY
  const [bodyHtml, setBodyHtml] = useState(existingBody)

  const fullHtml = wrapInEmailLayout(bodyHtml)
  const detectedVars = extractVariables(fullHtml)

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    // Update state from editor content
    if (editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML)
    }
  }, [])

  const insertVariable = useCallback((varKey: string) => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const varSpan = document.createElement('span')
      varSpan.style.cssText = 'background: #7C3AED22; color: #A78BFA; padding: 2px 6px; border-radius: 4px; font-weight: 600;'
      varSpan.contentEditable = 'false'
      varSpan.textContent = `{{${varKey}}}`
      range.deleteContents()
      range.insertNode(varSpan)
      // Move cursor after the variable
      range.setStartAfter(varSpan)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    if (editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML)
    }
  }, [])

  const insertLink = useCallback(() => {
    const url = prompt('URL do link:')
    if (url) {
      execCommand('createLink', url)
    }
  }, [execCommand])

  const insertButton = useCallback(() => {
    const url = prompt('URL do botao:')
    const text = prompt('Texto do botao:', 'Clique Aqui')
    if (url && text) {
      const buttonHtml = `<a href="${url}" class="btn" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #8B5CF6); color: #FAFAFA; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">${text}</a>`
      execCommand('insertHTML', buttonHtml)
    }
  }, [execCommand])

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML)
    }
  }, [])

  const handleSave = () => {
    if (!name.trim() || !subject.trim()) {
      toast.error('Preencha nome e assunto')
      return
    }

    startTransition(async () => {
      const input = { name, subject, from_name: fromName, html_body: fullHtml, preview_text: previewText }
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

  const ToolbarButton = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-white/10 transition-colors ${active ? 'bg-white/10 text-[#A78BFA]' : 'text-[#A3A3A3]'}`}
    >
      {children}
    </button>
  )

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

      {/* Variables */}
      <div className="space-y-2">
        <Label className="text-[#D4D4D4] flex items-center gap-2">
          <Variable className="h-4 w-4" />
          Variaveis (clique para inserir no texto)
        </Label>
        <div className="flex items-center gap-2 flex-wrap">
          {VARIABLES.map((v) => (
            <Badge
              key={v.key}
              onClick={() => insertVariable(v.key)}
              className="bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/30 text-xs cursor-pointer hover:bg-[#7C3AED]/25 transition-colors"
            >
              {`{{${v.key}}}`} - {v.label}
            </Badge>
          ))}
          {detectedVars.filter(v => !VARIABLES.find(p => p.key === v)).map((v) => (
            <Badge
              key={v}
              className="bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30 text-xs"
            >
              {`{{${v}}}`}
            </Badge>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[#D4D4D4]">Conteudo do email</Label>
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
              srcDoc={fullHtml}
              className="w-full h-full"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-[#0F172A] border-b border-white/10 px-3 py-2 flex items-center gap-1 flex-wrap">
              {/* Text format */}
              <ToolbarButton onClick={() => execCommand('bold')} title="Negrito">
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('italic')} title="Italico">
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('underline')} title="Sublinhado">
                <Underline className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Tachado">
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Headings */}
              <ToolbarButton onClick={() => execCommand('formatBlock', 'h1')} title="Titulo">
                <Heading1 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} title="Subtitulo">
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('formatBlock', 'p')} title="Paragrafo">
                <Type className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Alignment */}
              <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Alinhar esquerda">
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Centralizar">
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('justifyRight')} title="Alinhar direita">
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Lists */}
              <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Lista">
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Lista numerada">
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Insert */}
              <ToolbarButton onClick={insertLink} title="Inserir link">
                <Link className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('insertHorizontalRule')} title="Linha divisoria">
                <Minus className="h-4 w-4" />
              </ToolbarButton>
              <button
                type="button"
                onClick={insertButton}
                title="Inserir botao CTA"
                className="px-2 py-1 rounded hover:bg-white/10 text-[#A3A3A3] text-xs font-medium transition-colors"
              >
                + Botao
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Undo/Redo */}
              <ToolbarButton onClick={() => execCommand('undo')} title="Desfazer">
                <Undo className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('redo')} title="Refazer">
                <Redo className="h-4 w-4" />
              </ToolbarButton>
            </div>

            {/* Content editable area */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
              className="min-h-[400px] p-6 bg-[#1E293B] text-[#FAFAFA] focus:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-[#A3A3A3] [&_a]:text-[#A78BFA] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_li]:text-[#A3A3A3] [&_hr]:border-white/10 [&_hr]:my-6 [&_.btn]:inline-block [&_.btn]:bg-gradient-to-r [&_.btn]:from-[#7C3AED] [&_.btn]:to-[#8B5CF6] [&_.btn]:text-white [&_.btn]:px-7 [&_.btn]:py-3.5 [&_.btn]:rounded-lg [&_.btn]:font-semibold [&_.btn]:no-underline [&_.btn]:my-4"
              suppressContentEditableWarning
            />
          </div>
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
