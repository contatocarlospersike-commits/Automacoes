'use server'

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/super-admin'

// --- Guard: ensure caller is super admin ---
async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isSuperAdmin(user.email)) {
    throw new Error('Unauthorized: super admin access required')
  }

  return user
}

// --- Types ---

interface AdminDashboardStats {
  totalOrganizations: number
  totalContacts: number
  totalMessagesMonth: number
  totalCampaignsMonth: number
  globalDeliveryRate: number
  globalReadRate: number
  globalFailureRate: number
  topOrganizations: Array<{
    id: string
    name: string
    created_at: string
    totalMessages: number
    totalContacts: number
  }>
  recentOrganizations: Array<{
    id: string
    name: string
    created_at: string
    memberCount: number
    isConnected: boolean
  }>
}

interface OrganizationListItem {
  id: string
  name: string
  created_at: string
  timezone: string
  is_active: boolean
  memberCount: number
  contactCount: number
  messagesThisMonth: number
  campaignsThisMonth: number
  isConnected: boolean
  planName: string | null
  subscriptionStatus: string | null
}

interface OrganizationDetails {
  id: string
  name: string
  created_at: string
  timezone: string
  is_active: boolean
  members: Array<{
    id: string
    user_id: string
    role: string
    created_at: string
    email: string | null
  }>
  wabaConfig: {
    isConnected: boolean
    phoneNumberId: string | null
    wabaId: string | null
  } | null
  stats: {
    totalContacts: number
    totalOptedOut: number
    totalTemplates: number
    approvedTemplates: number
    totalCampaigns: number
    campaignsThisMonth: number
    messagesThisMonth: number
    deliveryRate: number
    readRate: number
  }
  recentCampaigns: Array<{
    id: string
    name: string
    status: string
    total_messages: number
    created_at: string
    completed_at: string | null
  }>
  billing: {
    planName: string | null
    planSlug: string | null
    subscriptionStatus: string | null
    subscriptionId: string | null
    billingType: string | null
    isGifted: boolean
    currentPeriodEnd: string | null
    usageThisMonth: number
    usageCostCents: number
  }
}

// --- Dashboard Stats ---

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await requireSuperAdmin()
  const db = await createServiceRoleClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthStart = startOfMonth.toISOString()

  const [
    orgsRes,
    contactsRes,
    messagesMonthRes,
    campaignsMonthRes,
  ] = await Promise.all([
    db.from('organizations').select('id, name, created_at').order('created_at', { ascending: false }),
    db.from('contacts').select('id, org_id', { count: 'exact', head: true }).is('deleted_at', null),
    db.from('message_queue').select('id, status, campaign_id').gte('created_at', monthStart),
    db.from('campaigns').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
  ])

  const allOrgs = orgsRes.data ?? []
  const allMessages = messagesMonthRes.data ?? []

  // Global rates
  let totalSent = 0
  let totalDelivered = 0
  let totalRead = 0
  let totalFailed = 0

  // Messages per org (via campaign_id → org mapping)
  const campaignOrgMap = new Map<string, string>()

  for (const msg of allMessages) {
    if (msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read') totalSent++
    if (msg.status === 'delivered' || msg.status === 'read') totalDelivered++
    if (msg.status === 'read') totalRead++
    if (msg.status === 'failed') totalFailed++
  }

  const globalDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const globalReadRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0
  const globalFailureRate = allMessages.length > 0 ? (totalFailed / allMessages.length) * 100 : 0

  // Top organizations by message volume - need campaigns for mapping
  const orgMessageCounts = new Map<string, number>()
  const orgContactCounts = new Map<string, number>()

  if (allMessages.length > 0) {
    const campaignIds = [...new Set(allMessages.map(m => m.campaign_id))]
    const { data: campaigns } = await db
      .from('campaigns')
      .select('id, org_id')
      .in('id', campaignIds)

    for (const c of campaigns ?? []) {
      campaignOrgMap.set(c.id, c.org_id)
    }

    for (const msg of allMessages) {
      const orgId = campaignOrgMap.get(msg.campaign_id)
      if (orgId) {
        orgMessageCounts.set(orgId, (orgMessageCounts.get(orgId) ?? 0) + 1)
      }
    }
  }

  // Get contact counts per org
  const { data: contactsByOrg } = await db
    .from('contacts')
    .select('org_id')
    .is('deleted_at', null)

  for (const c of contactsByOrg ?? []) {
    orgContactCounts.set(c.org_id, (orgContactCounts.get(c.org_id) ?? 0) + 1)
  }

  // Top 5 orgs by messages
  const topOrgs = allOrgs
    .map(org => ({
      id: org.id,
      name: org.name,
      created_at: org.created_at,
      totalMessages: orgMessageCounts.get(org.id) ?? 0,
      totalContacts: orgContactCounts.get(org.id) ?? 0,
    }))
    .sort((a, b) => b.totalMessages - a.totalMessages)
    .slice(0, 5)

  // Recent 5 organizations with member count and WABA status
  const recentOrgs = allOrgs.slice(0, 5)
  const recentOrgIds = recentOrgs.map(o => o.id)

  const [membersRes, wabaRes] = await Promise.all([
    db.from('org_members').select('org_id').in('org_id', recentOrgIds),
    db.from('waba_configs').select('org_id, is_connected').in('org_id', recentOrgIds),
  ])

  const memberCountMap = new Map<string, number>()
  for (const m of membersRes.data ?? []) {
    memberCountMap.set(m.org_id, (memberCountMap.get(m.org_id) ?? 0) + 1)
  }

  const wabaMap = new Map<string, boolean>()
  for (const w of wabaRes.data ?? []) {
    wabaMap.set(w.org_id, w.is_connected)
  }

  return {
    totalOrganizations: allOrgs.length,
    totalContacts: contactsRes.count ?? 0,
    totalMessagesMonth: allMessages.length,
    totalCampaignsMonth: campaignsMonthRes.count ?? 0,
    globalDeliveryRate: Math.round(globalDeliveryRate * 10) / 10,
    globalReadRate: Math.round(globalReadRate * 10) / 10,
    globalFailureRate: Math.round(globalFailureRate * 10) / 10,
    topOrganizations: topOrgs,
    recentOrganizations: recentOrgs.map(org => ({
      id: org.id,
      name: org.name,
      created_at: org.created_at,
      memberCount: memberCountMap.get(org.id) ?? 0,
      isConnected: wabaMap.get(org.id) ?? false,
    })),
  }
}

// --- Organizations List ---

export async function getOrganizations(): Promise<OrganizationListItem[]> {
  await requireSuperAdmin()
  const db = await createServiceRoleClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthStart = startOfMonth.toISOString()

  const { data: orgs } = await db
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (!orgs || orgs.length === 0) return []

  const orgIds = orgs.map(o => o.id)

  const [membersRes, contactsRes, wabaRes, campaignsRes, campaignsMonthRes, subsRes] = await Promise.all([
    db.from('org_members').select('org_id').in('org_id', orgIds),
    db.from('contacts').select('org_id').is('deleted_at', null).in('org_id', orgIds),
    db.from('waba_configs').select('org_id, is_connected').in('org_id', orgIds),
    db.from('campaigns').select('id, org_id').in('org_id', orgIds),
    db.from('campaigns').select('id, org_id').in('org_id', orgIds).gte('created_at', monthStart),
    db.from('subscriptions').select('org_id, status, plans(name)').in('org_id', orgIds).in('status', ['active', 'trial', 'pending', 'overdue']),
  ])

  // Count maps
  const memberCountMap = new Map<string, number>()
  for (const m of membersRes.data ?? []) {
    memberCountMap.set(m.org_id, (memberCountMap.get(m.org_id) ?? 0) + 1)
  }

  const contactCountMap = new Map<string, number>()
  for (const c of contactsRes.data ?? []) {
    contactCountMap.set(c.org_id, (contactCountMap.get(c.org_id) ?? 0) + 1)
  }

  const wabaMap = new Map<string, boolean>()
  for (const w of wabaRes.data ?? []) {
    wabaMap.set(w.org_id, w.is_connected)
  }

  const campaignsMonthMap = new Map<string, number>()
  for (const c of campaignsMonthRes.data ?? []) {
    campaignsMonthMap.set(c.org_id, (campaignsMonthMap.get(c.org_id) ?? 0) + 1)
  }

  // Subscription map
  const subMap = new Map<string, { planName: string | null; status: string }>()
  for (const s of subsRes.data ?? []) {
    const plan = s.plans as Record<string, unknown> | null
    subMap.set(s.org_id, {
      planName: (plan?.name as string) ?? null,
      status: s.status,
    })
  }

  // Messages this month per org
  const allCampaignIds = (campaignsRes.data ?? []).map(c => c.id)
  const campaignOrgMap = new Map<string, string>()
  for (const c of campaignsRes.data ?? []) {
    campaignOrgMap.set(c.id, c.org_id)
  }

  const orgMessageCountMap = new Map<string, number>()
  if (allCampaignIds.length > 0) {
    const { data: messages } = await db
      .from('message_queue')
      .select('campaign_id')
      .in('campaign_id', allCampaignIds)
      .gte('created_at', monthStart)

    for (const msg of messages ?? []) {
      const orgId = campaignOrgMap.get(msg.campaign_id)
      if (orgId) {
        orgMessageCountMap.set(orgId, (orgMessageCountMap.get(orgId) ?? 0) + 1)
      }
    }
  }

  return orgs.map(org => ({
    id: org.id,
    name: org.name,
    created_at: org.created_at,
    timezone: org.timezone,
    is_active: (org as Record<string, unknown>).is_active !== false, // default true if column doesn't exist yet
    memberCount: memberCountMap.get(org.id) ?? 0,
    contactCount: contactCountMap.get(org.id) ?? 0,
    messagesThisMonth: orgMessageCountMap.get(org.id) ?? 0,
    campaignsThisMonth: campaignsMonthMap.get(org.id) ?? 0,
    isConnected: wabaMap.get(org.id) ?? false,
    planName: subMap.get(org.id)?.planName ?? null,
    subscriptionStatus: subMap.get(org.id)?.status ?? null,
  }))
}

// --- Organization Details ---

export async function getOrganizationDetails(orgId: string): Promise<OrganizationDetails | null> {
  await requireSuperAdmin()
  const db = await createServiceRoleClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthStart = startOfMonth.toISOString()

  const { data: org } = await db
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (!org) return null

  const [
    membersRes,
    wabaRes,
    contactsRes,
    optedOutRes,
    templatesRes,
    approvedTemplatesRes,
    campaignsRes,
    campaignsMonthRes,
    recentCampaignsRes,
    billingSubRes,
    billingUsageRes,
  ] = await Promise.all([
    db.from('org_members').select('id, user_id, role, created_at').eq('org_id', orgId),
    db.from('waba_configs').select('is_connected, phone_number_id, waba_id').eq('org_id', orgId).maybeSingle(),
    db.from('contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId).is('deleted_at', null),
    db.from('contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId).is('deleted_at', null).not('opted_out_at', 'is', null),
    db.from('message_templates').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    db.from('message_templates').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'approved'),
    db.from('campaigns').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    db.from('campaigns').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', monthStart),
    db.from('campaigns').select('id, name, status, total_messages, created_at, completed_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
    db.from('subscriptions').select('id, status, billing_type, gifted_by, current_period_end, plans(name, slug)').eq('org_id', orgId).in('status', ['active', 'trial', 'pending', 'overdue']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('usage_records').select('message_count, total_cost_cents').eq('org_id', orgId).eq('period_start', new Date().toISOString().slice(0, 7) + '-01').maybeSingle(),
  ])

  // Get member emails from auth (via service role)
  const members = membersRes.data ?? []
  const memberUserIds = members.map(m => m.user_id)
  const emailMap = new Map<string, string>()

  for (const userId of memberUserIds) {
    const { data: { user } } = await db.auth.admin.getUserById(userId)
    if (user?.email) {
      emailMap.set(userId, user.email)
    }
  }

  // Messages this month + rates
  const orgCampaignIds = (recentCampaignsRes.data ?? []).map(c => c.id)
  let deliveryRate = 0
  let readRate = 0
  let totalMessagesMonth = 0

  // Get all campaign IDs for this org to count messages
  const { data: allOrgCampaigns } = await db
    .from('campaigns')
    .select('id')
    .eq('org_id', orgId)

  const allOrgCampaignIds = (allOrgCampaigns ?? []).map(c => c.id)

  if (allOrgCampaignIds.length > 0) {
    const { data: messages } = await db
      .from('message_queue')
      .select('status')
      .in('campaign_id', allOrgCampaignIds)
      .gte('created_at', monthStart)

    const msgs = messages ?? []
    totalMessagesMonth = msgs.length

    let sent = 0, delivered = 0, read = 0
    for (const m of msgs) {
      if (m.status === 'sent' || m.status === 'delivered' || m.status === 'read') sent++
      if (m.status === 'delivered' || m.status === 'read') delivered++
      if (m.status === 'read') read++
    }

    deliveryRate = sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0
    readRate = delivered > 0 ? Math.round((read / delivered) * 1000) / 10 : 0
  }

  return {
    id: org.id,
    name: org.name,
    created_at: org.created_at,
    timezone: org.timezone,
    is_active: (org as Record<string, unknown>).is_active !== false,
    members: members.map(m => ({
      ...m,
      email: emailMap.get(m.user_id) ?? null,
    })),
    wabaConfig: wabaRes.data ? {
      isConnected: wabaRes.data.is_connected,
      phoneNumberId: wabaRes.data.phone_number_id,
      wabaId: wabaRes.data.waba_id,
    } : null,
    stats: {
      totalContacts: contactsRes.count ?? 0,
      totalOptedOut: optedOutRes.count ?? 0,
      totalTemplates: templatesRes.count ?? 0,
      approvedTemplates: approvedTemplatesRes.count ?? 0,
      totalCampaigns: campaignsRes.count ?? 0,
      campaignsThisMonth: campaignsMonthRes.count ?? 0,
      messagesThisMonth: totalMessagesMonth,
      deliveryRate,
      readRate,
    },
    recentCampaigns: recentCampaignsRes.data ?? [],
    billing: (() => {
      const sub = billingSubRes.data
      const plan = sub?.plans as Record<string, unknown> | null
      const usage = billingUsageRes.data
      return {
        planName: (plan?.name as string) ?? null,
        planSlug: (plan?.slug as string) ?? null,
        subscriptionStatus: sub?.status ?? null,
        subscriptionId: sub?.id ?? null,
        billingType: sub?.billing_type ?? null,
        isGifted: !!sub?.gifted_by,
        currentPeriodEnd: sub?.current_period_end ?? null,
        usageThisMonth: usage?.message_count ?? 0,
        usageCostCents: usage?.total_cost_cents ?? 0,
      }
    })(),
  }
}

// --- Toggle Organization Status ---

export async function toggleOrganizationStatus(orgId: string): Promise<{ is_active: boolean }> {
  await requireSuperAdmin()
  const db = await createServiceRoleClient()

  // Get current status
  const { data: org } = await db
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (!org) throw new Error('Organization not found')

  const currentlyActive = (org as Record<string, unknown>).is_active !== false
  const newStatus = !currentlyActive

  const { error } = await db
    .from('organizations')
    .update({ is_active: newStatus } as Record<string, unknown>)
    .eq('id', orgId)

  if (error) throw new Error(`Failed to update organization: ${error.message}`)

  return { is_active: newStatus }
}

// --- Create Organization for Client ---

export async function createOrganizationForClient(data: {
  name: string
  adminEmail: string
  timezone?: string
}): Promise<{ orgId: string }> {
  await requireSuperAdmin()
  const db = await createServiceRoleClient()

  // Find user by email
  const { data: { users }, error: listError } = await db.auth.admin.listUsers()

  if (listError) throw new Error(`Failed to list users: ${listError.message}`)

  const targetUser = users.find(u => u.email?.toLowerCase() === data.adminEmail.toLowerCase())

  if (!targetUser) {
    throw new Error(`User with email ${data.adminEmail} not found. They need to sign in first.`)
  }

  // Check if user already has an org
  const { data: existingMember } = await db
    .from('org_members')
    .select('org_id')
    .eq('user_id', targetUser.id)
    .limit(1)
    .maybeSingle()

  if (existingMember) {
    throw new Error('This user already belongs to an organization')
  }

  // Create organization
  const { data: newOrg, error: orgError } = await db
    .from('organizations')
    .insert({
      name: data.name,
      timezone: data.timezone ?? 'America/Sao_Paulo',
    })
    .select('id')
    .single()

  if (orgError || !newOrg) throw new Error(`Failed to create organization: ${orgError?.message}`)

  // Add user as admin member
  const { error: memberError } = await db
    .from('org_members')
    .insert({
      org_id: newOrg.id,
      user_id: targetUser.id,
      role: 'admin',
    })

  if (memberError) throw new Error(`Failed to add member: ${memberError.message}`)

  return { orgId: newOrg.id }
}
