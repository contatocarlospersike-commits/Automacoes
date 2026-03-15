export interface PlanFeature {
  text: string
  included: boolean
  highlight?: boolean
}

export interface PlanTier {
  slug: 'start' | 'pro' | 'pro_max'
  name: string
  description: string
  monthlyPrice: number
  messagePrice: number
  maxContacts: string
  maxCampaigns: string
  features: PlanFeature[]
  popular?: boolean
  cta: string
}

export const PLAN_TIERS: PlanTier[] = [
  {
    slug: 'start',
    name: 'Start',
    description: 'Para comecar suas operacoes de WhatsApp em massa',
    monthlyPrice: 97,
    messagePrice: 0.46,
    maxContacts: '5.000',
    maxCampaigns: '15/mes',
    features: [
      { text: 'Ate 5.000 contatos', included: true },
      { text: '15 campanhas por mes', included: true },
      { text: 'Relatorios completos', included: true },
      { text: 'Suporte por email', included: true },
      { text: 'Agendamento basico', included: true },
      { text: 'API de integracao', included: false },
      { text: 'Agendamento avancado', included: false },
      { text: 'Multi-usuario', included: false },
      { text: 'Automacoes de fluxo', included: false },
    ],
    cta: 'Comecar agora',
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Para operacoes em crescimento que precisam de mais',
    monthlyPrice: 197,
    messagePrice: 0.46,
    maxContacts: '25.000',
    maxCampaigns: '100/mes',
    popular: true,
    features: [
      { text: 'Ate 25.000 contatos', included: true },
      { text: '100 campanhas por mes', included: true },
      { text: 'Relatorios completos', included: true },
      { text: 'Suporte prioritario', included: true },
      { text: 'Agendamento avancado', included: true },
      { text: 'API de integracao', included: true },
      { text: 'Tudo do Start incluso', included: true },
      { text: 'Multi-usuario', included: false },
      { text: 'Automacoes de fluxo', included: false },
    ],
    cta: 'Assinar Pro',
  },
  {
    slug: 'pro_max',
    name: 'Pro Max',
    description: 'Operacao profissional sem limites',
    monthlyPrice: 397,
    messagePrice: 0.46,
    maxContacts: 'Ilimitado',
    maxCampaigns: 'Ilimitado',
    features: [
      { text: 'Contatos ilimitados', included: true, highlight: true },
      { text: 'Campanhas ilimitadas', included: true, highlight: true },
      { text: 'Relatorios completos', included: true },
      { text: 'Suporte dedicado', included: true, highlight: true },
      { text: 'Agendamento avancado', included: true },
      { text: 'API de integracao', included: true },
      { text: 'Multi-usuario', included: true, highlight: true },
      { text: 'Automacoes de fluxo (em breve)', included: true, highlight: true },
      { text: 'Tudo do Pro incluso', included: true },
    ],
    cta: 'Assinar Pro Max',
  },
] as const
