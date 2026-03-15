export interface BillingOverview {
  plan: {
    slug: string
    name: string
    monthlyPrice: number
    messageUnitPrice: number
    maxContacts: number | null
    maxCampaignsPerMonth: number | null
  } | null
  subscription: {
    id: string
    status: string
    billingType: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    isGifted: boolean
  } | null
  usage: {
    messageCount: number
    totalCostCents: number
    daysInMonth: number
    daysElapsed: number
    projectedMessages: number
    projectedCostCents: number
  }
  recentInvoices: InvoiceSummary[]
}

export interface InvoiceSummary {
  id: string
  periodStart: string
  periodEnd: string
  subscriptionAmountCents: number
  usageAmountCents: number
  totalAmountCents: number
  status: string
  paidAt: string | null
  asaasInvoiceUrl: string | null
}

export interface UsageRecord {
  id: string
  periodStart: string
  periodEnd: string
  messageCount: number
  unitPriceCents: number
  totalCostCents: number
}

export interface ActionResult {
  success: boolean
  error?: string
}

export interface SubscribeInput {
  planSlug: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  customerData: {
    name: string
    email: string
    cpfCnpj: string
    mobilePhone?: string
  }
}

export interface SubscribeResult extends ActionResult {
  paymentUrl?: string
  subscriptionId?: string
}
