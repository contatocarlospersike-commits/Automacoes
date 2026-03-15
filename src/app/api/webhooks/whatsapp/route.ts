import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import type { Json } from '@/types/database'

// GET: Webhook verification challenge from Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST: Receive message status updates from Meta
export async function POST(request: NextRequest) {
  const body = await request.text()

  // Validate X-Hub-Signature-256
  const signature = request.headers.get('x-hub-signature-256')
  const appSecret = process.env.META_APP_SECRET

  if (appSecret && signature) {
    const expectedSignature =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(body).digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const payload = JSON.parse(body)
  const supabase = await createServiceRoleClient()

  // Process each entry
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue

      const value = change.value

      // Message status updates (sent → delivered → read)
      for (const status of value.statuses ?? []) {
        const metaMessageId = status.id
        const newStatus = status.status // sent, delivered, read, failed

        if (!metaMessageId || !newStatus) continue

        // Update message_queue status
        await supabase
          .from('message_queue')
          .update({
            status: newStatus,
            ...(newStatus === 'delivered'
              ? { delivered_at: new Date().toISOString() }
              : {}),
            ...(newStatus === 'read'
              ? { read_at: new Date().toISOString() }
              : {}),
            ...(newStatus === 'failed'
              ? { error: status.errors?.[0]?.title ?? 'Unknown error' }
              : {}),
          })
          .eq('meta_message_id', metaMessageId)
      }

      // Log the webhook event — look up org from a message in this batch
      const firstMessageId = value.statuses?.[0]?.id
      if (firstMessageId) {
        const { data: msg } = await supabase
          .from('message_queue')
          .select('campaign_id, campaigns(org_id)')
          .eq('meta_message_id', firstMessageId)
          .single()

        const orgId = (msg?.campaigns as { org_id: string } | null)?.org_id
        if (orgId) {
          await supabase.from('webhook_logs').insert({
            org_id: orgId,
            event_type: 'message_status',
            payload: payload as unknown as Json,
            processed: true,
          })
        }
      }
    }
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
