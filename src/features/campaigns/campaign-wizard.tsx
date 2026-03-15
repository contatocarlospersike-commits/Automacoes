'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createCampaign } from '@/features/campaigns/actions'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Search,
  Send,
  Users,
} from 'lucide-react'
import type { Database } from '@/types/database'

type Template = Database['public']['Tables']['message_templates']['Row']
type Contact = Database['public']['Tables']['contacts']['Row']

interface CampaignWizardProps {
  templates: Template[]
  contacts: Contact[]
}

const steps = [
  { number: 1, label: 'Detalhes', icon: FileText },
  { number: 2, label: 'Contatos', icon: Users },
  { number: 3, label: 'Confirmar', icon: Send },
]

const categoryLabels: Record<string, string> = {
  marketing: 'Marketing',
  utility: 'Utilidade',
  authentication: 'Autenticacao',
}

export function CampaignWizard({ templates, contacts }: CampaignWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)

  // Form state
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Derived state
  const approvedTemplates = templates.filter(
    (t) => t.status === 'approved' || t.status === 'draft'
  )
  const selectedTemplate = templates.find((t) => t.id === templateId)

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
    )
  }, [contacts, searchQuery])

  const toggleContact = (id: string) => {
    const next = new Set(selectedContactIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedContactIds(next)
  }

  const toggleAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      // If all filtered are selected, deselect filtered
      const next = new Set(selectedContactIds)
      for (const c of filteredContacts) {
        next.delete(c.id)
      }
      setSelectedContactIds(next)
    } else {
      // Select all filtered
      const next = new Set(selectedContactIds)
      for (const c of filteredContacts) {
        next.add(c.id)
      }
      setSelectedContactIds(next)
    }
  }

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0 && templateId.length > 0
      case 2:
        return selectedContactIds.size > 0
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canAdvance()) {
      if (currentStep === 1) {
        if (!name.trim()) toast.error('Informe o nome da campanha')
        else if (!templateId) toast.error('Selecione um template')
      } else if (currentStep === 2) {
        toast.error('Selecione ao menos um contato')
      }
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createCampaign({
        name: name.trim(),
        templateId,
        contactIds: Array.from(selectedContactIds),
      })

      if (result.success) {
        toast.success(`Campanha "${name}" criada com ${selectedContactIds.size} contatos!`)
        router.push('/campaigns')
      } else {
        toast.error(result.error ?? 'Erro ao criar campanha')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Nova Campanha
        </h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          Configure e dispare em 3 passos simples
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number
          const StepIcon = step.icon

          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'border-[#10B981] bg-[#10B981]/15 text-[#10B981]'
                      : isActive
                        ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#A78BFA]'
                        : 'border-[rgba(255,255,255,0.1)] bg-transparent text-[#525252]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive ? 'text-[#FAFAFA]' : 'text-[#A3A3A3]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-16 rounded-full ${
                    currentStep > step.number
                      ? 'bg-[#10B981]'
                      : 'bg-[rgba(255,255,255,0.1)]'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card className="brekva-card border-transparent">
        <CardContent className="p-6">
          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#D4D4D4]">Nome da campanha *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Promocao Black Friday 2026"
                  className="bg-[#0F172A] border-[rgba(255,255,255,0.1)] text-[#FAFAFA] placeholder:text-[#525252]"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[#D4D4D4]">Selecione o template *</Label>
                {approvedTemplates.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] p-8 text-center">
                    <FileText className="mx-auto mb-3 h-8 w-8 text-[#525252]" />
                    <p className="text-sm text-[#A3A3A3]">
                      Nenhum template disponivel. Crie um em Templates primeiro.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {approvedTemplates.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setTemplateId(t.id)}
                        className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-all ${
                          templateId === t.id
                            ? 'border-[#7C3AED] bg-[#7C3AED]/5'
                            : 'border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)]'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            templateId === t.id
                              ? 'border-[#7C3AED] bg-[#7C3AED]'
                              : 'border-[rgba(255,255,255,0.2)]'
                          }`}
                        >
                          {templateId === t.id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#FAFAFA]">
                              {t.name}
                            </span>
                            <span className="brekva-badge text-[10px]">
                              {categoryLabels[t.category] ?? t.category}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#A3A3A3] line-clamp-2">
                            {t.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div className="space-y-2">
                  <Label className="text-[#D4D4D4]">Preview do template</Label>
                  <div className="rounded-lg bg-[#0F172A] border border-[rgba(255,255,255,0.05)] p-4">
                    <div className="rounded-lg bg-[#1E293B] p-4 max-w-sm mx-auto">
                      <div className="rounded-lg bg-[#075e54]/30 p-3">
                        <p className="text-sm text-[#D4D4D4] whitespace-pre-wrap">
                          {selectedTemplate.body}
                        </p>
                      </div>
                      {selectedTemplate.buttons && Array.isArray(selectedTemplate.buttons) && (
                        <div className="mt-2 space-y-1">
                          {(selectedTemplate.buttons as Array<{ text: string }>).map(
                            (btn, i) => (
                              <div
                                key={i}
                                className="rounded bg-[rgba(255,255,255,0.05)] py-2 text-center text-xs font-medium text-[#0EA5E9]"
                              >
                                {btn.text}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contacts */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#D4D4D4]">Selecione os contatos *</Label>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">
                    {selectedContactIds.size} de {contacts.length} selecionados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                    className="bg-transparent border-[rgba(255,255,255,0.1)] text-[#A3A3A3] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]"
                  >
                    {selectedContactIds.size === filteredContacts.length && filteredContacts.length > 0
                      ? 'Limpar selecao'
                      : 'Selecionar todos'}
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome ou telefone..."
                  className="pl-10 bg-[#0F172A] border-[rgba(255,255,255,0.1)] text-[#FAFAFA] placeholder:text-[#525252]"
                />
              </div>

              {/* Selected count badge */}
              {selectedContactIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 items-center rounded-full bg-[#7C3AED]/15 px-3">
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs font-bold text-[#A78BFA]">
                      {selectedContactIds.size}
                    </span>
                    <span className="ml-1.5 text-xs text-[#A3A3A3]">
                      contatos selecionados
                    </span>
                  </div>
                </div>
              )}

              {/* Contact list */}
              {contacts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] p-8 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-[#525252]" />
                  <p className="text-sm text-[#A3A3A3]">
                    Nenhum contato encontrado. Importe ou crie em Contatos.
                  </p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.05)]">
                  {filteredContacts.map((c) => {
                    const isSelected = selectedContactIds.has(c.id)
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        className={`flex items-center gap-3 border-b border-[rgba(255,255,255,0.03)] px-4 py-3 cursor-pointer transition-colors last:border-b-0 ${
                          isSelected
                            ? 'bg-[#7C3AED]/5'
                            : 'hover:bg-[rgba(255,255,255,0.02)]'
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                            isSelected
                              ? 'border-[#7C3AED] bg-[#7C3AED]'
                              : 'border-[rgba(255,255,255,0.2)]'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-[#FAFAFA]">
                          {c.name}
                        </span>
                        <span className="ml-auto font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#A3A3A3]">
                          {c.phone}
                        </span>
                      </div>
                    )
                  })}
                  {filteredContacts.length === 0 && searchQuery && (
                    <div className="p-6 text-center text-sm text-[#A3A3A3]">
                      Nenhum contato encontrado para &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#7C3AED]/15">
                  <Send className="h-8 w-8 text-[#A78BFA]" />
                </div>
                <h2 className="text-xl font-bold text-[#FAFAFA]">Confirme sua campanha</h2>
                <p className="mt-1 text-sm text-[#A3A3A3]">
                  Revise os detalhes antes de criar
                </p>
              </div>

              <div className="grid gap-4 max-w-md mx-auto">
                {/* Campaign name */}
                <div className="flex items-center justify-between rounded-lg bg-[#0F172A] border border-[rgba(255,255,255,0.05)] p-4">
                  <div>
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
                      Campanha
                    </p>
                    <p className="text-sm font-semibold text-[#FAFAFA]">{name}</p>
                  </div>
                  <FileText className="h-5 w-5 text-[#A78BFA]" />
                </div>

                {/* Template */}
                <div className="flex items-center justify-between rounded-lg bg-[#0F172A] border border-[rgba(255,255,255,0.05)] p-4">
                  <div>
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
                      Template
                    </p>
                    <p className="text-sm font-semibold text-[#FAFAFA]">
                      {selectedTemplate?.name ?? '---'}
                    </p>
                    <p className="text-xs text-[#525252] mt-0.5">
                      {categoryLabels[selectedTemplate?.category ?? ''] ?? selectedTemplate?.category}
                    </p>
                  </div>
                  <span className="brekva-badge text-[10px]">
                    {selectedTemplate?.status}
                  </span>
                </div>

                {/* Contacts count */}
                <div className="flex items-center justify-between rounded-lg bg-[#0F172A] border border-[rgba(255,255,255,0.05)] p-4">
                  <div>
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
                      Contatos
                    </p>
                    <p className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[#A78BFA]">
                      {selectedContactIds.size}
                    </p>
                  </div>
                  <Users className="h-5 w-5 text-[#A78BFA]" />
                </div>

                {/* Total messages */}
                <div className="flex items-center justify-between rounded-lg bg-[#7C3AED]/5 border border-[#7C3AED]/20 p-4">
                  <div>
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
                      Mensagens a enviar
                    </p>
                    <p className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[#10B981]">
                      {selectedContactIds.size}
                    </p>
                  </div>
                  <Send className="h-5 w-5 text-[#10B981]" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? () => router.push('/campaigns') : handleBack}
          className="bg-transparent border-[rgba(255,255,255,0.1)] text-[#A3A3A3] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? 'Voltar' : 'Anterior'}
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="brekva-gradient-cta text-white hover:opacity-90"
          >
            Proximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="brekva-gradient-cta text-white hover:opacity-90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Criar Campanha
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
