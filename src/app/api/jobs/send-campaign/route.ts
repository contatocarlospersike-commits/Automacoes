import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Internal API route for async WhatsApp campaign processing.
// Called by startCampaign() server action via fire-and-forget fetch.
// Processes messages in batches to avoid request timeouts.

const BATCH_SIZE = 50
const RATE_LIMIT_MS = 35 // ~28 msgs/sec, under Meta's 30/sec limit
const JOB_SECRET = process.env.JOB_SECRET || process.env.ENCRYPTION_KEY

export async function POST(request: NextRequest) {
  // Validate internal call
  const authHeader = request.headers.get('x-job-secret')
  if (!JOB_SECRET || authHeader !== JOB_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { campaignId, orgId, phoneNumberId, accessToken } = await request.json()

  if (!campaignId || !orgId || !phoneNumberId || !accessToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createServiceRoleClient()

  // Process all pending messages in batches
  let totalSent = 0
  let totalFailed = 0
  let hasMore = true

  while (hasMore) {
    const { data: messages } = await supabase
      .from('message_queue')
      .select('id, phone, template_name, variables')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at')
      .limit(BATCH_SIZE)

    if (!messages || messages.length === 0) {
      hasMore = false
      break
    }

    for (const msg of messages) {
      try {
        await supabase
          .from('message_queue')
          .update({ status: 'sending', attempts: 1 })
          .eq('id', msg.id)

        const response = await fetch(
          `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: msg.phone.replace('+', ''),
              type: 'template',
              template: {
                name: msg.template_name,
                language: { code: 'pt_BR' },
                components: msg.variables
                  ? [
                      {
                        type: 'body',
                        parameters: (msg.variables as string[]).map((v: string) => ({
                          type: 'text',
                          text: v,
                        })),
                      },
                    ]
                  : undefined,
              },
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          await supabase
            .from('message_queue')
            .update({
              status: 'sent',
              meta_message_id: data?.messages?.[0]?.id ?? null,
              sent_at: new Date().toISOString(),
            })
            .eq('id', msg.id)
          totalSent++
        } else {
          const errorData = await response.json()
          await supabase
            .from('message_queue')
            .update({
              status: 'failed',
              error: errorData?.error?.message || `HTTP ${response.status}`,
            })
            .eq('id', msg.id)
          totalFailed++
        }

        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS))
      } catch (error) {
        await supabase
          .from('message_queue')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', msg.id)
        totalFailed++
      }
    }

    // If we got fewer than BATCH_SIZE, we're done
    if (messages.length < BATCH_SIZE) {
      hasMore = false
    }
  }

  // Track billing usage
  if (totalSent > 0) {
    try {
      await supabase.rpc('increment_usage', {
        p_org_id: orgId,
        p_count: totalSent,
      })
    } catch (usageError) {
      console.error('[job:send-campaign] Failed to track usage:', usageError)
    }
  }

  // Update campaign final status
  const finalStatus =
    totalFailed > 0 && totalSent > 0
      ? 'completed_with_errors'
      : totalFailed > 0 && totalSent === 0
        ? 'completed_with_errors'
        : 'completed'

  await supabase
    .from('campaigns')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return NextResponse.json({
    status: 'done',
    sent: totalSent,
    failed: totalFailed,
  })
}
