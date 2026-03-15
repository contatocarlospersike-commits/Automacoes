'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

type Period = '7d' | '30d' | '90d'

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
}

interface ReportsData {
  totalSent: number
  totalDelivered: number
  totalRead: number
  totalFailed: number
  deliveryRate: number
  readRate: number
  totalCampaigns: number
  statusBreakdown: MessageStatusBreakdown
  recentCampaigns: CampaignWithStats[]
}

function getPeriodStartDate(period: Period): Date {
  const now = new Date()
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  }
}

export async function getReportsData(period: Period = '30d'): Promise<ReportsData> {
  const supabase = await createServerSupabaseClient()
  const startDate = getPeriodStartDate(period).toISOString()

  // Fetch all messages in the period
  const { data: messages } = await supabase
    .from('message_queue')
    .select('id, campaign_id, status')
    .gte('created_at', startDate)

  const allMessages = messages ?? []

  // Status breakdown
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

  // Totals
  const totalSent = statusBreakdown.sent + statusBreakdown.delivered + statusBreakdown.read
  const totalDelivered = statusBreakdown.delivered + statusBreakdown.read
  const totalRead = statusBreakdown.read
  const totalFailed = statusBreakdown.failed

  // Rates (avoid division by zero)
  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0

  // Campaign count in period
  const { count: totalCampaigns } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate)

  // Recent campaigns with stats
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status, total_messages, created_at, completed_at')
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })
    .limit(10)

  const recentCampaigns: CampaignWithStats[] = []

  if (campaigns && campaigns.length > 0) {
    const campaignIds = campaigns.map((c) => c.id)

    // Get message stats per campaign
    const { data: campaignMessages } = await supabase
      .from('message_queue')
      .select('campaign_id, status')
      .in('campaign_id', campaignIds)

    const campaignMsgMap = new Map<string, { delivered: number; read: number; failed: number }>()

    for (const msg of campaignMessages ?? []) {
      if (!campaignMsgMap.has(msg.campaign_id)) {
        campaignMsgMap.set(msg.campaign_id, { delivered: 0, read: 0, failed: 0 })
      }
      const stats = campaignMsgMap.get(msg.campaign_id)!
      if (msg.status === 'delivered' || msg.status === 'read') stats.delivered++
      if (msg.status === 'read') stats.read++
      if (msg.status === 'failed') stats.failed++
    }

    for (const campaign of campaigns) {
      const stats = campaignMsgMap.get(campaign.id) ?? { delivered: 0, read: 0, failed: 0 }
      recentCampaigns.push({
        ...campaign,
        delivered: stats.delivered,
        read: stats.read,
        failed: stats.failed,
      })
    }
  }

  return {
    totalSent,
    totalDelivered,
    totalRead,
    totalFailed,
    deliveryRate,
    readRate,
    totalCampaigns: totalCampaigns ?? 0,
    statusBreakdown,
    recentCampaigns,
  }
}
