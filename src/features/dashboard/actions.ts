'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface MessageStatusBreakdown {
  pending: number
  sending: number
  sent: number
  delivered: number
  read: number
  failed: number
}

interface CampaignWithStats {
  id: string
  name: string
  status: string
  total_messages: number
  created_at: string
  completed_at: string | null
  delivered: number
  read: number
  failed: number
  sent: number
  deliveryRate: number
  readRate: number
}

interface DashboardData {
  // KPIs
  totalContacts: number
  totalOptedOut: number
  messagesThisMonth: number
  deliveryRate: number
  readRate: number

  // Status breakdown
  statusBreakdown: MessageStatusBreakdown
  totalMessages: number

  // Health score (0-100)
  healthScore: number
  healthFactors: {
    deliveryScore: number
    readScore: number
    failureScore: number
  }

  // Recent campaigns
  recentCampaigns: CampaignWithStats[]

  // Quick overview
  approvedTemplates: number
  totalTemplates: number
  campaignsThisMonth: number
}

export async function getDashboardStats(): Promise<DashboardData> {
  const supabase = await createServerSupabaseClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthStart = startOfMonth.toISOString()

  // Parallel fetch all data
  const [
    contactsRes,
    optedOutRes,
    approvedTemplatesRes,
    totalTemplatesRes,
    campaignsMonthRes,
    messagesData,
    recentCampaignsData,
  ] = await Promise.all([
    // Total contacts (not deleted)
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),

    // Opted out contacts
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .not('opted_out_at', 'is', null),

    // Approved templates
    supabase
      .from('message_templates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),

    // Total templates
    supabase
      .from('message_templates')
      .select('id', { count: 'exact', head: true }),

    // Campaigns this month
    supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart),

    // All messages this month (for breakdown)
    supabase
      .from('message_queue')
      .select('id, status, campaign_id')
      .gte('created_at', monthStart),

    // Recent 5 campaigns
    supabase
      .from('campaigns')
      .select('id, name, status, total_messages, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // --- Status breakdown ---
  const allMessages = messagesData.data ?? []
  const statusBreakdown: MessageStatusBreakdown = {
    pending: 0,
    sending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  }

  for (const msg of allMessages) {
    const status = msg.status as keyof MessageStatusBreakdown
    if (status in statusBreakdown) {
      statusBreakdown[status]++
    }
  }

  const totalMessages = allMessages.length
  const totalSent = statusBreakdown.sent + statusBreakdown.delivered + statusBreakdown.read
  const totalDelivered = statusBreakdown.delivered + statusBreakdown.read
  const totalRead = statusBreakdown.read
  const totalFailed = statusBreakdown.failed

  // Rates
  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0
  const failureRate = totalMessages > 0 ? (totalFailed / totalMessages) * 100 : 0

  // --- Health Score (0-100) ---
  // Delivery contributes 40%, Read 30%, Low failure 30%
  const deliveryScore = Math.min(deliveryRate, 100)
  const readScore = Math.min(readRate, 100)
  const failureScore = Math.max(100 - failureRate * 10, 0) // Penalize heavily for failures

  const healthScore = totalMessages > 0
    ? Math.round(deliveryScore * 0.4 + readScore * 0.3 + failureScore * 0.3)
    : 100 // No messages = healthy (nothing failed)

  // --- Recent campaigns with stats ---
  const recentCampaigns: CampaignWithStats[] = []
  const campaigns = recentCampaignsData.data ?? []

  if (campaigns.length > 0) {
    const campaignIds = campaigns.map((c) => c.id)

    const { data: campaignMessages } = await supabase
      .from('message_queue')
      .select('campaign_id, status')
      .in('campaign_id', campaignIds)

    const campaignMsgMap = new Map<
      string,
      { sent: number; delivered: number; read: number; failed: number; total: number }
    >()

    for (const msg of campaignMessages ?? []) {
      if (!campaignMsgMap.has(msg.campaign_id)) {
        campaignMsgMap.set(msg.campaign_id, { sent: 0, delivered: 0, read: 0, failed: 0, total: 0 })
      }
      const stats = campaignMsgMap.get(msg.campaign_id)!
      stats.total++
      if (msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read') stats.sent++
      if (msg.status === 'delivered' || msg.status === 'read') stats.delivered++
      if (msg.status === 'read') stats.read++
      if (msg.status === 'failed') stats.failed++
    }

    for (const campaign of campaigns) {
      const stats = campaignMsgMap.get(campaign.id) ?? {
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        total: 0,
      }
      const cDeliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0
      const cReadRate = stats.delivered > 0 ? (stats.read / stats.delivered) * 100 : 0

      recentCampaigns.push({
        ...campaign,
        sent: stats.sent,
        delivered: stats.delivered,
        read: stats.read,
        failed: stats.failed,
        deliveryRate: Math.round(cDeliveryRate * 10) / 10,
        readRate: Math.round(cReadRate * 10) / 10,
      })
    }
  }

  return {
    totalContacts: contactsRes.count ?? 0,
    totalOptedOut: optedOutRes.count ?? 0,
    messagesThisMonth: totalMessages,
    deliveryRate: Math.round(deliveryRate * 10) / 10,
    readRate: Math.round(readRate * 10) / 10,

    statusBreakdown,
    totalMessages,

    healthScore,
    healthFactors: {
      deliveryScore: Math.round(deliveryScore),
      readScore: Math.round(readScore),
      failureScore: Math.round(failureScore),
    },

    recentCampaigns,

    approvedTemplates: approvedTemplatesRes.count ?? 0,
    totalTemplates: totalTemplatesRes.count ?? 0,
    campaignsThisMonth: campaignsMonthRes.count ?? 0,
  }
}
