'use server'

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createAsaasClient, isAsaasConfigured } from '@/lib/asaas/client'
import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '@/lib/auth/super-admin'
import type { BillingOverview, ActionResult, SubscribeInput, SubscribeResult, InvoiceSummary, UsageRecord } from '@/features/billing/types'

// --- Helpers ---

async function getAuthOrgId(): Promise<{ orgId: string; userId: string } | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return null
  return { orgId: member.org_id, userId: user.id }
}

async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdmin(user.email)) {
    throw new Error('Unauthorized: Super admin only')
  }
  return user
}

// --- Read Operations ---

export async function getBillingOverview(): Promise<BillingOverview> {
  const auth = await getAuthOrgId()
  if (!auth) {
    return { plan: null, subscription: null, usage: { messageCount: 0, totalCostCents: 0, daysInMonth: 30, daysElapsed: 0, projectedMessages: 0, projectedCostCents: 0 }, recentInvoices: [] }
  }

  const supabase = await createServerSupabaseClient()

  // Parallel queries
  const [subResult, usageResult, invoicesResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('org_id', auth.orgId)
      .in('status', ['active', 'trial', 'pending', 'overdue'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('usage_records')
      .select('*')
      .eq('org_id', auth.orgId)
      .eq('period_start', new Date().toISOString().slice(0, 7) + '-01')
      .single(),

    supabase
      .from('invoices')
      .select('*')
      .eq('org_id', auth.orgId)
      .order('period_start', { ascending: false })
      .limit(6),
  ])

  const sub = subResult.data
  const plan = sub?.plans as Record<string, unknown> | null
  const usage = usageResult.data

  // Calculate projections
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate()
  const messageCount = usage?.message_count ?? 0
  const dailyRate = daysElapsed > 0 ? messageCount / daysElapsed : 0
  const projectedMessages = Math.round(dailyRate * daysInMonth)
  const unitPrice = (plan?.message_unit_price_cents as number) ?? 46
  const projectedCostCents = projectedMessages * unitPrice

  return {
    plan: plan ? {
      slug: plan.slug as string,
      name: plan.name as string,
      monthlyPrice: (plan.monthly_price_cents as number) / 100,
      messageUnitPrice: (plan.message_unit_price_cents as number) / 100,
      maxContacts: plan.max_contacts as number | null,
      maxCampaignsPerMonth: plan.max_campaigns_per_month as number | null,
    } : null,

    subscription: sub ? {
      id: sub.id,
      status: sub.status,
      billingType: sub.billing_type,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      isGifted: !!sub.gifted_by,
    } : null,

    usage: {
      messageCount,
      totalCostCents: usage?.total_cost_cents ?? 0,
      daysInMonth,
      daysElapsed,
      projectedMessages,
      projectedCostCents,
    },

    recentInvoices: (invoicesResult.data ?? []).map((inv): InvoiceSummary => ({
      id: inv.id,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      subscriptionAmountCents: inv.subscription_amount_cents,
      usageAmountCents: inv.usage_amount_cents,
      totalAmountCents: inv.total_amount_cents,
      status: inv.status,
      paidAt: inv.paid_at,
      asaasInvoiceUrl: inv.asaas_invoice_url,
    })),
  }
}

export async function getUsageHistory(months: number = 6): Promise<UsageRecord[]> {
  const auth = await getAuthOrgId()
  if (!auth) return []

  const supabase = await createServerSupabaseClient()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data } = await supabase
    .from('usage_records')
    .select('*')
    .eq('org_id', auth.orgId)
    .gte('period_start', startDate.toISOString().split('T')[0])
    .order('period_start', { ascending: false })

  return (data ?? []).map((r): UsageRecord => ({
    id: r.id,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    messageCount: r.message_count,
    unitPriceCents: r.unit_price_cents,
    totalCostCents: r.total_cost_cents,
  }))
}

export async function getInvoices(): Promise<InvoiceSummary[]> {
  const auth = await getAuthOrgId()
  if (!auth) return []

  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('org_id', auth.orgId)
    .order('period_start', { ascending: false })

  return (data ?? []).map((inv): InvoiceSummary => ({
    id: inv.id,
    periodStart: inv.period_start,
    periodEnd: inv.period_end,
    subscriptionAmountCents: inv.subscription_amount_cents,
    usageAmountCents: inv.usage_amount_cents,
    totalAmountCents: inv.total_amount_cents,
    status: inv.status,
    paidAt: inv.paid_at,
    asaasInvoiceUrl: inv.asaas_invoice_url,
  }))
}

export async function getPlans() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return data ?? []
}

// --- Config Check ---

export async function checkBillingConfig(): Promise<{ asaasConfigured: boolean }> {
  return { asaasConfigured: isAsaasConfigured() }
}

// --- Write Operations ---

export async function subscribeToPlan(input: SubscribeInput): Promise<SubscribeResult> {
  const auth = await getAuthOrgId()
  if (!auth) return { success: false, error: 'Nao autenticado' }

  if (!isAsaasConfigured()) {
    return {
      success: false,
      error: 'Gateway de pagamento nao configurado. Configure a chave ASAAS_API_KEY no painel de administracao para habilitar assinaturas.',
    }
  }

  const serviceClient = await createServiceRoleClient()

  // Check no existing active subscription
  const { data: existingSub } = await serviceClient
    .from('subscriptions')
    .select('id')
    .eq('org_id', auth.orgId)
    .in('status', ['active', 'trial', 'pending'])
    .limit(1)
    .single()

  if (existingSub) {
    return { success: false, error: 'Ja existe uma assinatura ativa. Use trocar plano.' }
  }

  // Get plan
  const { data: plan } = await serviceClient
    .from('plans')
    .select('*')
    .eq('slug', input.planSlug)
    .eq('is_active', true)
    .single()

  if (!plan) return { success: false, error: 'Plano nao encontrado' }

  try {
    const asaas = createAsaasClient()

    // Find or create customer
    let customerId: string
    const existingCustomer = await asaas.findCustomerByEmail(input.customerData.email)

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const customer = await asaas.createCustomer({
        name: input.customerData.name,
        email: input.customerData.email,
        cpfCnpj: input.customerData.cpfCnpj,
        mobilePhone: input.customerData.mobilePhone,
      })
      customerId = customer.id
    }

    // Create subscription on Asaas
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 1) // First charge tomorrow

    const asaasSub = await asaas.createSubscription({
      customer: customerId,
      billingType: input.billingType,
      value: plan.monthly_price_cents / 100,
      cycle: 'MONTHLY',
      nextDueDate: nextMonth.toISOString().split('T')[0],
      description: `BREKVA - Plano ${plan.name}`,
    })

    // Create subscription in our DB
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const { data: subscription, error: subError } = await serviceClient
      .from('subscriptions')
      .insert({
        org_id: auth.orgId,
        plan_id: plan.id,
        asaas_customer_id: customerId,
        asaas_subscription_id: asaasSub.id,
        status: 'pending',
        billing_type: input.billingType,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select('id')
      .single()

    if (subError) return { success: false, error: subError.message }

    // Update organization with subscription
    await serviceClient
      .from('organizations')
      .update({ subscription_id: subscription.id })
      .eq('id', auth.orgId)

    revalidatePath('/billing')
    return { success: true, subscriptionId: subscription.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao criar assinatura' }
  }
}

export async function changePlan(newPlanSlug: string): Promise<ActionResult> {
  const auth = await getAuthOrgId()
  if (!auth) return { success: false, error: 'Nao autenticado' }

  const serviceClient = await createServiceRoleClient()

  // Get current subscription
  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('id, asaas_subscription_id')
    .eq('org_id', auth.orgId)
    .in('status', ['active', 'trial'])
    .single()

  if (!sub) return { success: false, error: 'Nenhuma assinatura ativa encontrada' }

  // Get new plan
  const { data: newPlan } = await serviceClient
    .from('plans')
    .select('*')
    .eq('slug', newPlanSlug)
    .eq('is_active', true)
    .single()

  if (!newPlan) return { success: false, error: 'Plano nao encontrado' }

  try {
    // Update on Asaas
    if (sub.asaas_subscription_id) {
      const asaas = createAsaasClient()
      await asaas.updateSubscription(sub.asaas_subscription_id, {
        value: newPlan.monthly_price_cents / 100,
        updatePendingPayments: false,
      })
    }

    // Update in our DB
    await serviceClient
      .from('subscriptions')
      .update({ plan_id: newPlan.id, updated_at: new Date().toISOString() })
      .eq('id', sub.id)

    revalidatePath('/billing')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao trocar plano' }
  }
}

export async function cancelSubscription(): Promise<ActionResult> {
  const auth = await getAuthOrgId()
  if (!auth) return { success: false, error: 'Nao autenticado' }

  const serviceClient = await createServiceRoleClient()

  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('id, asaas_subscription_id')
    .eq('org_id', auth.orgId)
    .in('status', ['active', 'trial', 'pending', 'overdue'])
    .single()

  if (!sub) return { success: false, error: 'Nenhuma assinatura ativa encontrada' }

  try {
    if (sub.asaas_subscription_id) {
      const asaas = createAsaasClient()
      await asaas.cancelSubscription(sub.asaas_subscription_id)
    }

    await serviceClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id)

    revalidatePath('/billing')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao cancelar' }
  }
}

// --- Usage Tracking ---

export async function incrementUsage(orgId: string, count: number): Promise<void> {
  const serviceClient = await createServiceRoleClient()
  await serviceClient.rpc('increment_usage', { p_org_id: orgId, p_count: count })
}

// --- Monthly Invoice Generation ---

export async function generateMonthlyInvoice(orgId: string): Promise<ActionResult & { invoiceId?: string }> {
  const serviceClient = await createServiceRoleClient()

  // Get active subscription with plan
  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('org_id', orgId)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) return { success: false, error: 'Sem assinatura ativa' }

  const plan = sub.plans as Record<string, unknown> | null
  if (!plan) return { success: false, error: 'Plano nao encontrado' }

  // Calculate period (previous month)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const periodStartStr = periodStart.toISOString().split('T')[0]
  const periodEndStr = periodEnd.toISOString().split('T')[0]

  // Check if invoice already exists for this period (idempotent)
  const { data: existingInvoice } = await serviceClient
    .from('invoices')
    .select('id')
    .eq('org_id', orgId)
    .eq('period_start', periodStartStr)
    .limit(1)
    .single()

  if (existingInvoice) return { success: true, invoiceId: existingInvoice.id }

  // Get usage for the period
  const { data: usage } = await serviceClient
    .from('usage_records')
    .select('message_count, total_cost_cents')
    .eq('org_id', orgId)
    .eq('period_start', periodStartStr)
    .single()

  const subscriptionAmountCents = (plan.monthly_price_cents as number) ?? 0
  const usageAmountCents = usage?.total_cost_cents ?? 0
  const totalAmountCents = subscriptionAmountCents + usageAmountCents

  // Create invoice record
  const { data: invoice, error: invoiceError } = await serviceClient
    .from('invoices')
    .insert({
      org_id: orgId,
      subscription_id: sub.id,
      period_start: periodStartStr,
      period_end: periodEndStr,
      subscription_amount_cents: subscriptionAmountCents,
      usage_amount_cents: usageAmountCents,
      total_amount_cents: totalAmountCents,
      message_count: usage?.message_count ?? 0,
      status: 'pending',
    })
    .select('id')
    .single()

  if (invoiceError) return { success: false, error: invoiceError.message }

  // Create one-off Asaas payment for usage portion
  // (subscription is auto-billed by Asaas recurring)
  if (usageAmountCents > 0 && sub.asaas_customer_id) {
    try {
      const asaas = createAsaasClient()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 5)

      const payment = await asaas.createPayment({
        customer: sub.asaas_customer_id,
        billingType: (sub.billing_type as 'PIX' | 'BOLETO' | 'CREDIT_CARD') ?? 'PIX',
        value: usageAmountCents / 100,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `BREKVA - Mensagens ${periodStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} (${usage?.message_count ?? 0} msgs)`,
        externalReference: invoice.id,
      })

      await serviceClient
        .from('invoices')
        .update({
          asaas_payment_id: payment.id,
          asaas_invoice_url: payment.invoiceUrl ?? null,
        })
        .eq('id', invoice.id)
    } catch (error) {
      console.error('Failed to create Asaas usage payment:', error)
    }
  }

  return { success: true, invoiceId: invoice.id }
}

export async function generateAllPendingInvoices(): Promise<ActionResult & { generated?: number }> {
  await requireSuperAdmin()
  const serviceClient = await createServiceRoleClient()

  const { data: subs } = await serviceClient
    .from('subscriptions')
    .select('org_id')
    .in('status', ['active', 'trial'])

  if (!subs || subs.length === 0) return { success: true, generated: 0 }

  let generated = 0
  for (const sub of subs) {
    const result = await generateMonthlyInvoice(sub.org_id)
    if (result.success && result.invoiceId) generated++
  }

  return { success: true, generated }
}

// --- Admin Operations ---

export async function adminGetOrgBilling(orgId: string) {
  await requireSuperAdmin()
  const serviceClient = await createServiceRoleClient()

  const [subResult, usageResult, invoicesResult] = await Promise.all([
    serviceClient
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    serviceClient
      .from('usage_records')
      .select('*')
      .eq('org_id', orgId)
      .order('period_start', { ascending: false })
      .limit(6),

    serviceClient
      .from('invoices')
      .select('*')
      .eq('org_id', orgId)
      .order('period_start', { ascending: false })
      .limit(12),
  ])

  return {
    subscription: subResult.data,
    usageHistory: usageResult.data ?? [],
    invoices: invoicesResult.data ?? [],
  }
}

export async function adminGiftPlan(
  orgId: string,
  planSlug: string,
  months: number,
): Promise<ActionResult> {
  const admin = await requireSuperAdmin()
  const serviceClient = await createServiceRoleClient()

  const { data: plan } = await serviceClient
    .from('plans')
    .select('id, name')
    .eq('slug', planSlug)
    .single()

  if (!plan) return { success: false, error: 'Plano nao encontrado' }

  // Cancel existing subscription if any
  await serviceClient
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('org_id', orgId)
    .in('status', ['active', 'trial', 'pending'])

  // Create gifted subscription
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + months)

  const { data: subscription, error } = await serviceClient
    .from('subscriptions')
    .insert({
      org_id: orgId,
      plan_id: plan.id,
      status: 'active',
      billing_type: 'PIX',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      gifted_by: admin.email,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  await serviceClient
    .from('organizations')
    .update({ subscription_id: subscription.id })
    .eq('id', orgId)

  revalidatePath('/admin')
  return { success: true }
}

export async function adminCancelSubscription(orgId: string): Promise<ActionResult> {
  await requireSuperAdmin()
  const serviceClient = await createServiceRoleClient()

  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('id, asaas_subscription_id')
    .eq('org_id', orgId)
    .in('status', ['active', 'trial', 'pending', 'overdue'])
    .single()

  if (!sub) return { success: false, error: 'Nenhuma assinatura ativa' }

  try {
    if (sub.asaas_subscription_id) {
      const asaas = createAsaasClient()
      await asaas.cancelSubscription(sub.asaas_subscription_id)
    }
  } catch {
    // Continue even if Asaas cancel fails
  }

  await serviceClient
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  revalidatePath('/admin')
  return { success: true }
}
