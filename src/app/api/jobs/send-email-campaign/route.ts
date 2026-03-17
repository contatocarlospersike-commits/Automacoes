import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail, interpolateTemplate, isResendConfigured } from '@/lib/resend/client'

// Internal API route for async email campaign processing.
// Called by sendEmailCampaign() server action via fire-and-forget fetch.

const BATCH_SIZE = 50

export async function POST(request: NextRequest) {
  // Internal job - called by server action fire-and-forget
  const authHeader = request.headers.get('x-job-secret')
  const jobSecret = process.env.JOB_SECRET || process.env.ENCRYPTION_KEY
  if (jobSecret && authHeader !== jobSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { campaignId } = await request.json()
  if (!campaignId) {
    return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
  }

  const supabase = await createServiceRoleClient()

  // Fetch campaign + template
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*, email_templates(subject, html_body, from_name)')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const template = campaign.email_templates as { subject: string; html_body: string; from_name: string } | null
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Process pending emails in batches
  let totalSent = 0
  let totalFailed = 0
  let hasMore = true

  while (hasMore) {
    const { data: queueRows } = await supabase
      .from('email_queue')
      .select('id, contact_id, email, contact_name, variables')
      .eq('email_campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at')
      .limit(BATCH_SIZE)

    if (!queueRows || queueRows.length === 0) {
      hasMore = false
      break
    }

    for (const row of queueRows) {
      const vars = (row.variables as Record<string, string>) ?? {
        name: row.contact_name ?? '',
        email: row.email,
      }

      const html = interpolateTemplate(template.html_body, vars)

      const result = await sendEmail({
        from: `${campaign.from_name} <${campaign.from_email}>`,
        to: [row.email],
        subject: template.subject,
        html,
        reply_to: campaign.reply_to ?? undefined,
        tags: [{ name: 'campaign_id', value: campaignId }],
      })

      if (result.error) {
        totalFailed++
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            failed_reason: result.error,
            attempts: 1,
          })
          .eq('id', row.id)
      } else {
        totalSent++
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            resend_email_id: result.id ?? null,
            sent_at: new Date().toISOString(),
            attempts: 1,
          })
          .eq('id', row.id)
      }
    }

    if (queueRows.length < BATCH_SIZE) {
      hasMore = false
    }
  }

  // Update campaign
  await supabase
    .from('email_campaigns')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_sent: totalSent,
      total_failed: totalFailed,
    })
    .eq('id', campaignId)

  return NextResponse.json({
    status: 'done',
    sent: totalSent,
    failed: totalFailed,
    simulated: !isResendConfigured(),
  })
}
