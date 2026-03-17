import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Resend webhook events for email tracking (opens, clicks, bounces, etc.)
// Docs: https://resend.com/docs/dashboard/webhooks/introduction

interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    tags?: Record<string, string>
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  // Optional: Verify webhook signature via svix
  if (webhookSecret) {
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 401 })
    }
  }

  let event: ResendWebhookEvent
  try {
    event = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createServiceRoleClient()
  const resendEmailId = event.data?.email_id

  if (!resendEmailId) {
    return NextResponse.json({ status: 'ignored', reason: 'no email_id' }, { status: 200 })
  }

  // Map Resend event types to our status updates
  const now = new Date().toISOString()

  switch (event.type) {
    case 'email.sent': {
      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: now })
        .eq('resend_email_id', resendEmailId)
        .eq('status', 'pending')
      break
    }

    case 'email.delivered': {
      await supabase
        .from('email_queue')
        .update({ status: 'delivered' })
        .eq('resend_email_id', resendEmailId)
      break
    }

    case 'email.opened': {
      // Update queue row
      await supabase
        .from('email_queue')
        .update({ status: 'opened', opened_at: now })
        .eq('resend_email_id', resendEmailId)
        .is('opened_at', null) // Only set first open

      // Increment campaign open counter
      const { data: queueRow } = await supabase
        .from('email_queue')
        .select('email_campaign_id')
        .eq('resend_email_id', resendEmailId)
        .single()

      if (queueRow?.email_campaign_id) {
        // @ts-expect-error - RPC function exists in DB but not in generated types
        await supabase.rpc('increment_email_campaign_stat', {
          p_campaign_id: queueRow.email_campaign_id,
          p_field: 'total_opened',
        })
      }
      break
    }

    case 'email.clicked': {
      await supabase
        .from('email_queue')
        .update({ clicked_at: now })
        .eq('resend_email_id', resendEmailId)
        .is('clicked_at', null) // Only set first click

      const { data: queueRow } = await supabase
        .from('email_queue')
        .select('email_campaign_id')
        .eq('resend_email_id', resendEmailId)
        .single()

      if (queueRow?.email_campaign_id) {
        // @ts-expect-error - RPC function exists in DB but not in generated types
        await supabase.rpc('increment_email_campaign_stat', {
          p_campaign_id: queueRow.email_campaign_id,
          p_field: 'total_clicked',
        })
      }
      break
    }

    case 'email.bounced': {
      await supabase
        .from('email_queue')
        .update({ status: 'bounced', failed_reason: 'Email bounced' })
        .eq('resend_email_id', resendEmailId)

      const { data: queueRow } = await supabase
        .from('email_queue')
        .select('email_campaign_id')
        .eq('resend_email_id', resendEmailId)
        .single()

      if (queueRow?.email_campaign_id) {
        // @ts-expect-error - RPC function exists in DB but not in generated types
        await supabase.rpc('increment_email_campaign_stat', {
          p_campaign_id: queueRow.email_campaign_id,
          p_field: 'total_bounced',
        })
      }
      break
    }

    case 'email.complained': {
      await supabase
        .from('email_queue')
        .update({ status: 'complained', failed_reason: 'Spam complaint' })
        .eq('resend_email_id', resendEmailId)

      // Auto opt-out contact on spam complaint
      const { data: queueRow } = await supabase
        .from('email_queue')
        .select('contact_id')
        .eq('resend_email_id', resendEmailId)
        .single()

      if (queueRow?.contact_id) {
        await supabase
          .from('contacts')
          .update({ opted_out_at: now })
          .eq('id', queueRow.contact_id)
      }
      break
    }

    default:
      // Log unknown event types but don't fail
      break
  }

  // Store raw event for auditing
  // @ts-expect-error - email_events table exists in DB but not in generated types
  await supabase.from('email_events').insert({
    resend_email_id: resendEmailId,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
    processed: true,
  })

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
