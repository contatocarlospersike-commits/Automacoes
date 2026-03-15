import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyAsaasWebhook, processAsaasWebhook } from '@/lib/asaas/webhooks'
import type { AsaasWebhookPayload } from '@/lib/asaas/webhooks'
import type { Json } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook token
    const accessToken = request.headers.get('asaas-access-token') ?? ''
    if (!verifyAsaasWebhook(accessToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    const body = await request.text()
    let payload: AsaasWebhookPayload
    try {
      payload = JSON.parse(body) as AsaasWebhookPayload
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!payload.event || !payload.payment?.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // 3. Idempotency check — insert event, skip if already processed
    const supabase = await createServiceRoleClient()
    const eventId = `${payload.event}_${payload.payment.id}_${Date.now()}`

    const { error: insertError } = await supabase
      .from('payment_events')
      .insert({
        asaas_event_id: eventId,
        event_type: payload.event,
        asaas_payment_id: payload.payment.id,
        asaas_subscription_id: payload.payment.subscription ?? null,
        payload: JSON.parse(JSON.stringify(payload)) as Json,
        processed: false,
      })

    if (insertError) {
      // Duplicate event — already processed
      if (insertError.code === '23505') {
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.error('Failed to insert payment event:', insertError)
    }

    // 4. Process the webhook event
    try {
      await processAsaasWebhook(payload)

      // Mark as processed
      await supabase
        .from('payment_events')
        .update({ processed: true })
        .eq('asaas_event_id', eventId)
    } catch (processError) {
      // Log error but still return 200 to prevent Asaas retries
      const errorMessage = processError instanceof Error ? processError.message : 'Unknown error'
      await supabase
        .from('payment_events')
        .update({ processing_error: errorMessage })
        .eq('asaas_event_id', eventId)

      console.error('Webhook processing error:', processError)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Asaas webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
