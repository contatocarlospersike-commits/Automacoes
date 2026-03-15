'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  createTemplate,
  deleteTemplate,
  submitTemplateToMeta,
  syncTemplateStatus,
  syncAllTemplates,
} from '@/features/templates/actions'
import {
  Check,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import type { Database } from '@/types/database'

type Template = Database['public']['Tables']['message_templates']['Row']

interface TemplatesListProps {
  templates: Template[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Rascunho',
    color: 'bg-[#334155] text-[#A3A3A3]',
    icon: <FileText className="h-3 w-3" />,
  },
  pending: {
    label: 'Pendente',
    color: 'bg-[#F59E0B]/15 text-[#F59E0B]',
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: 'Aprovado',
    color: 'bg-[#10B981]/15 text-[#10B981]',
    icon: <Check className="h-3 w-3" />,
  },
  rejected: {
    label: 'Rejeitado',
    color: 'bg-[#F43F5E]/15 text-[#F43F5E]',
    icon: <XCircle className="h-3 w-3" />,
  },
}

const categoryLabels: Record<string, string> = {
  marketing: 'Marketing',
  utility: 'Utilidade',
  authentication: 'Auth',
}

export function TemplatesList({ templates }: TemplatesListProps) {
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'marketing' | 'utility' | 'authentication'>('marketing')
  const [body, setBody] = useState('')

  const resetForm = () => {
    setName('')
    setCategory('marketing')
    setBody('')
  }

  const handleCreate = () => {
    if (!name.trim() || !body.trim()) {
      toast.error('Nome e corpo sao obrigatorios')
      return
    }
    startTransition(async () => {
      const result = await createTemplate({ name, category, body })
      if (result.success) {
        toast.success('Template criado com sucesso!')
        setIsCreateOpen(false)
        resetForm()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTemplate(id)
      if (result.success) {
        toast.success('Template removido')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleSubmitToMeta = (id: string) => {
    startTransition(async () => {
      const result = await submitTemplateToMeta(id)
      if (result.success) {
        toast.success('Template enviado para aprovacao da Meta!')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleSyncStatus = (id: string) => {
    startTransition(async () => {
      const result = await syncTemplateStatus(id)
      if (result.success) {
        toast.success(`Status atualizado: ${result.status}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleSyncAll = () => {
    startTransition(async () => {
      const result = await syncAllTemplates()
      if (result.success) {
        toast.success(`${result.synced} template(s) sincronizado(s)`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const renderPreview = (text: string) => {
    return text
      .replace(/\{\{1\}\}/g, '[Nome]')
      .replace(/\{\{2\}\}/g, '[Variavel 2]')
      .replace(/\{\{3\}\}/g, '[Variavel 3]')
      .replace(/\{\{\d+\}\}/g, '[...]')
  }

  // Count variables in body
  const variableCount = (body.match(/\{\{\d+\}\}/g) ?? []).length

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {templates.some((t) => t.status === 'pending') && (
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={isPending}
            className="bg-transparent border-[rgba(255,255,255,0.1)] text-[#A3A3A3] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar Pendentes
          </Button>
        )}
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="brekva-gradient-cta text-white hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-[#1A1B2E] border-[rgba(255,255,255,0.1)]">
            <DialogHeader>
              <DialogTitle className="text-[#FAFAFA]">Criar Template</DialogTitle>
              <DialogDescription className="text-[#A3A3A3]">
                Templates precisam ser aprovados pela Meta antes do envio
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Form side */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#D4D4D4]">Nome do template *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="boas_vindas_cliente"
                    className="bg-[#0F172A] border-[rgba(255,255,255,0.1)] text-[#FAFAFA] placeholder:text-[#525252]"
                  />
                  <p className="text-xs text-[#525252]">Apenas letras minusculas e underscores</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#D4D4D4]">Categoria *</Label>
                  <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                    <TabsList className="w-full bg-[#0F172A] border border-[rgba(255,255,255,0.05)]">
                      <TabsTrigger
                        value="marketing"
                        className="flex-1 data-[state=active]:bg-[#7C3AED]/20 data-[state=active]:text-[#A78BFA]"
                      >
                        Marketing
                      </TabsTrigger>
                      <TabsTrigger
                        value="utility"
                        className="flex-1 data-[state=active]:bg-[#7C3AED]/20 data-[state=active]:text-[#A78BFA]"
                      >
                        Utilidade
                      </TabsTrigger>
                      <TabsTrigger
                        value="authentication"
                        className="flex-1 data-[state=active]:bg-[#7C3AED]/20 data-[state=active]:text-[#A78BFA]"
                      >
                        Auth
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#D4D4D4]">Corpo da mensagem *</Label>
                  <textarea
                    className="flex min-h-[150px] w-full rounded-md border border-[rgba(255,255,255,0.1)] bg-[#0F172A] px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#525252] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={'Ola {{1}}, obrigado por se cadastrar! Seu codigo e {{2}}.'}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#525252]">
                      Use {'{{1}}'}, {'{{2}}'}, etc. para variaveis
                    </p>
                    {variableCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-[#7C3AED]/15 px-2 py-0.5 text-[10px] font-semibold text-[#A78BFA]">
                        {variableCount} {variableCount === 1 ? 'variavel' : 'variaveis'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* WhatsApp Preview */}
              <div className="space-y-2">
                <Label className="text-[#D4D4D4]">Preview WhatsApp</Label>
                <div className="rounded-lg bg-[#0B141A] p-4 min-h-[280px] flex items-start justify-center pt-6">
                  <div className="w-full max-w-[280px]">
                    {body ? (
                      <div className="rounded-lg bg-[#005C4B] p-3 shadow-md">
                        <p className="text-sm text-[#E9EDEF] whitespace-pre-wrap leading-relaxed">
                          {renderPreview(body)}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <span className="text-[10px] text-[#8696A0]">
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] p-6 text-center">
                        <MessageSquare className="mx-auto mb-2 h-6 w-6 text-[#525252]" />
                        <p className="text-xs text-[#525252]">
                          Digite o corpo da mensagem...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="bg-transparent border-[rgba(255,255,255,0.1)] text-[#A3A3A3] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isPending || !name.trim() || !body.trim()}
                className="brekva-gradient-cta text-white hover:opacity-90"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] p-12 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-[#525252]" />
          <h3 className="font-semibold text-[#FAFAFA]">Nenhum template criado</h3>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Crie seu primeiro template de mensagem WhatsApp
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const status = statusConfig[template.status] ?? statusConfig.draft

            return (
              <Card key={template.id} className="brekva-card border-transparent group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base text-[#FAFAFA]">
                      {template.name}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                  <span className="brekva-badge text-[10px] w-fit">
                    {categoryLabels[template.category] ?? template.category}
                  </span>
                </CardHeader>
                <CardContent>
                  {/* Mini WhatsApp preview */}
                  <div className="rounded-lg bg-[#0B141A] p-3 mb-3">
                    <div className="rounded bg-[#005C4B] p-2">
                      <p className="text-xs text-[#E9EDEF] line-clamp-3 whitespace-pre-wrap">
                        {template.body}
                      </p>
                    </div>
                  </div>

                  {template.rejection_reason && (
                    <div className="rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/20 p-2 mb-3">
                      <p className="text-xs text-[#F43F5E]">
                        Motivo: {template.rejection_reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-[#525252]">
                      {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(template.status === 'draft' || template.status === 'rejected') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSubmitToMeta(template.id)}
                          disabled={isPending}
                          className="text-[#A78BFA] hover:text-[#C4B5FD] hover:bg-[#7C3AED]/10"
                        >
                          <Send className="mr-1 h-3 w-3" />
                          {template.status === 'rejected' ? 'Reenviar' : 'Enviar'}
                        </Button>
                      )}
                      {template.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSyncStatus(template.id)}
                          disabled={isPending}
                          className="text-[#F59E0B] hover:text-[#FBBF24] hover:bg-[#F59E0B]/10"
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Verificar
                        </Button>
                      )}
                      {template.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          disabled={isPending}
                          className="text-[#A3A3A3] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
