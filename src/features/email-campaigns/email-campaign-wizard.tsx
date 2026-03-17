'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, FileText, Loader2, Mail, Send, Users } from 'lucide-react'
import { createEmailCampaign, sendEmailCampaign } from '@/features/email-campaigns/actions'
import type { Database } from '@/types/database'

type EmailTemplate = Database['public']['Tables']['email_templates']['Row']
type ContactGroup = Database['public']['Tables']['contact_groups']['Row']
type ContactTag = Database['public']['Tables']['contact_tags']['Row']

interface EmailCampaignWizardProps {
  templates: EmailTemplate[]
  groups: ContactGroup[]
  tags: ContactTag[]
  totalContacts: number
}

const steps = [
  { number: 1, label: 'Detalhes', icon: Mail },
  { number: 2, label: 'Template', icon: FileText },
  { number: 3, label: 'Audiencia', icon: Users },
  { number: 4, label: 'Enviar', icon: Send },
]

export function EmailCampaignWizard({ templates, groups, tags, totalContacts }: EmailCampaignWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)

  const [name, setName] = useState('')
  const [fromName, setFromName] = useState('BREKVA')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [targetType, setTargetType] = useState<'all' | 'group' | 'tag'>('all')
  const [targetGroupId, setTargetGroupId] = useState('')
  const [targetTagId, setTargetTagId] = useState('')

  const recipientCount =
    targetType === 'all'
      ? totalContacts
      : targetType === 'group'
      ? groups.find((g) => g.id === targetGroupId)
        ? '(membros do grupo)'
        : 0
      : '(contatos com a tag)'

  const canProceed = () => {
    if (step === 1) return name.trim() && fromName.trim() && fromEmail.trim()
    if (step === 2) return selectedTemplate !== null
    if (step === 3) {
      if (targetType === 'group') return !!targetGroupId
      if (targetType === 'tag') return !!targetTagId
      return true
    }
    return true
  }

  const handleSendCampaign = () => {
    startTransition(async () => {
      // Create campaign first
      const createResult = await createEmailCampaign({
        name,
        email_template_id: selectedTemplate!.id,
        from_name: fromName,
        from_email: fromEmail,
        reply_to: replyTo || undefined,
        target_type: targetType,
        target_group_id: targetGroupId || undefined,
        target_tag_id: targetTagId || undefined,
      })

      if (!createResult.success || !createResult.id) {
        toast.error(createResult.error ?? 'Erro ao criar campanha')
        return
      }

      // Send it
      const sendResult = await sendEmailCampaign(createResult.id)

      if (!sendResult.success) {
        toast.error(sendResult.error ?? 'Erro ao disparar')
        return
      }

      if (sendResult.simulated) {
        toast.success('Campanha simulada! Configure RESEND_API_KEY para envio real.')
      } else {
        toast.success('Campanha enviada! Os emails estao sendo processados em segundo plano.')
      }

      router.push('/email')
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Steps */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-2 flex-1 ${i < steps.length - 1 ? '' : ''}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold transition-all ${
                  step > s.number
                    ? 'bg-[#10B981] text-white'
                    : step === s.number
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-[#1E293B] text-[#737373]'
                }`}
              >
                {step > s.number ? <Check className="h-4 w-4" /> : s.number}
              </div>
              <span className={`text-xs hidden sm:block ${step === s.number ? 'text-[#FAFAFA]' : 'text-[#737373]'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mx-2 ${step > s.number ? 'bg-[#10B981]' : 'bg-[#334155]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="bg-[#1E293B] rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="font-semibold text-[#FAFAFA]">Detalhes da campanha</h2>
          <div className="space-y-1.5">
            <Label className="text-[#D4D4D4]">Nome da campanha</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Newsletter Marco 2026"
              className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[#D4D4D4]">Nome do remetente</Label>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)}
                placeholder="BREKVA"
                className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#D4D4D4]">Email de envio</Label>
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@seudominio.com" type="email"
                className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#D4D4D4]">Reply-to (opcional)</Label>
            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)}
              placeholder="contato@seudominio.com" type="email"
              className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]" />
          </div>
        </div>
      )}

      {/* Step 2: Template */}
      {step === 2 && (
        <div className="bg-[#1E293B] rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="font-semibold text-[#FAFAFA]">Selecionar template</h2>
          {templates.length === 0 ? (
            <p className="text-[#737373] text-sm">Nenhum template criado. Crie um na aba Templates.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTemplate?.id === t.id
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-white/5 bg-[#0F172A] hover:border-white/10'
                  }`}
                >
                  <p className="font-medium text-[#FAFAFA] text-sm">{t.name}</p>
                  <p className="text-xs text-[#737373] mt-0.5">Assunto: {t.subject}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Audience */}
      {step === 3 && (
        <div className="bg-[#1E293B] rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="font-semibold text-[#FAFAFA]">Audiencia</h2>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'Todos os contatos', desc: `${totalContacts} contatos com email` },
              { value: 'group', label: 'Por grupo', desc: 'Envia para membros de um grupo' },
              { value: 'tag', label: 'Por tag', desc: 'Envia para contatos com uma tag' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTargetType(opt.value as any)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  targetType === opt.value
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                    : 'border-white/5 bg-[#0F172A] hover:border-white/10'
                }`}
              >
                <p className="font-medium text-[#FAFAFA] text-sm">{opt.label}</p>
                <p className="text-xs text-[#737373] mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {targetType === 'group' && groups.length > 0 && (
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#FAFAFA]"
            >
              <option value="">Selecionar grupo...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}

          {targetType === 'tag' && tags.length > 0 && (
            <select
              value={targetTagId}
              onChange={(e) => setTargetTagId(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#FAFAFA]"
            >
              <option value="">Selecionar tag...</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Step 4: Confirm & Send */}
      {step === 4 && (
        <div className="bg-[#1E293B] rounded-xl border border-white/5 p-6 space-y-5">
          <h2 className="font-semibold text-[#FAFAFA]">Revisar e enviar</h2>
          {[
            { label: 'Campanha', value: name },
            { label: 'De', value: `${fromName} <${fromEmail}>` },
            { label: 'Template', value: selectedTemplate?.name ?? '' },
            { label: 'Assunto', value: selectedTemplate?.subject ?? '' },
            { label: 'Audiencia', value: targetType === 'all' ? `Todos (${totalContacts} contatos)` : targetType === 'group' ? `Grupo: ${groups.find(g => g.id === targetGroupId)?.name}` : `Tag: ${tags.find(t => t.id === targetTagId)?.name}` },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4 text-sm">
              <span className="text-[#737373] w-24 flex-shrink-0">{row.label}</span>
              <span className="text-[#FAFAFA] font-medium">{row.value}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-[#737373]">
              {!process.env.RESEND_API_KEY
                ? 'RESEND_API_KEY nao configurada — envio sera simulado.'
                : 'Pronto para envio real via Resend.'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : router.push('/email')}
          className="text-[#A3A3A3] hover:text-[#FAFAFA]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
          >
            Continuar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSendCampaign}
            disabled={isPending}
            className="bg-[#10B981] hover:bg-[#059669] text-white"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Send className="h-4 w-4 mr-2" />
            Disparar Campanha
          </Button>
        )}
      </div>
    </div>
  )
}
