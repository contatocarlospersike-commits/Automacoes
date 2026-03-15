import { createServiceRoleClient } from '@/lib/supabase/server'

// --- Asaas Webhook Event Types ---

export type AsaasWebhookEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_REFUND_IN_PROGRESS'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'

export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent
  payment: {
    id: string
    customer: string
    subscription?: string
    billingType: string
    value: number
    status: string
    dueDate: string
    confirmedDate?: string
    paymentDate?: string
    invoiceUrl?: string
    bankSlipUrl?: string
    externalReference?: string
  }
}

// --- Webhook Verification ---

export function verifyAsaasWebhook(accessToken: string): boolean {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
  if (!expectedToken) return false
  return accessToken === expectedToken
}

// --- Webhook Processing ---

export async function processAsaasWebhook(payload: AsaasWebhookPayload): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { event, payment } = payload

  // Find subscription by Asaas subscription ID
  if (!payment.subscription) return

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, org_id, status')
    .eq('asaas_subscription_id', payment.subscription)
    .single()

  if (!subscription) return

  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      // Activate subscription
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      // Update invoice if exists
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          asaas_invoice_url: payment.invoiceUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_payment_id', payment.id)

      break
    }

    case 'PAYMENT_OVERDUE': {
      await supabase
        .from('subscriptions')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      await supabase
        .from('invoices')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_payment_id', payment.id)

      break
    }

    case 'PAYMENT_DELETED':
    case 'PAYMENT_REFUNDED': {
      await supabase
        .from('invoices')
        .update({
          status: event === 'PAYMENT_REFUNDED' ? 'refunded' : 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_payment_id', payment.id)

      break
    }

    case 'PAYMENT_CREATED': {
      // Create invoice record for new subscription payment
      const periodStart = new Date()
      const periodEnd = new Date(periodStart)
      periodEnd.setMonth(periodEnd.getMonth() + 1)
      periodEnd.setDate(periodEnd.getDate() - 1)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id, plans(monthly_price_cents)')
        .eq('id', subscription.id)
        .single()

      const planPrice = (sub?.plans as Record<string, unknown>)?.monthly_price_cents as number ?? 0

      await supabase
        .from('invoices')
        .insert({
          org_id: subscription.org_id,
          subscription_id: subscription.id,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          subscription_amount_cents: planPrice,
          total_amount_cents: planPrice,
          status: 'pending',
          asaas_payment_id: payment.id,
          due_date: payment.dueDate,
        })

      break
    }

    default:
      // Log unhandled events but don't fail
      break
  }
}
