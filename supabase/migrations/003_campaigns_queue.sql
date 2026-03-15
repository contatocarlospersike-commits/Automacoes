-- ============================================================
-- WAMM Campaigns, Message Queue & Webhook Logs
-- Plan: docs/approved-plans/migration-003_campaigns_queue.md
-- ============================================================

-- ============================================================
-- 1. CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES public.message_templates(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'processing', 'completed', 'completed_with_errors', 'cancelled')
  ),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_messages INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org campaigns"
  ON public.campaigns
  FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can create campaigns"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Members can update campaigns"
  ON public.campaigns
  FOR UPDATE
  USING (org_id = public.get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON public.campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(org_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON public.campaigns(status, scheduled_at)
  WHERE status = 'scheduled';

-- ============================================================
-- 2. MESSAGE_QUEUE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  phone TEXT NOT NULL,
  template_name TEXT NOT NULL,
  variables JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed')
  ),
  meta_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- RLS via campaign → org relationship
CREATE POLICY "Members can view org messages"
  ON public.message_queue
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.org_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Members can create messages"
  ON public.message_queue
  FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.org_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Members can update messages"
  ON public.message_queue
  FOR UPDATE
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.org_id = public.get_user_org_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_queue_campaign_status ON public.message_queue(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_meta_msg_id ON public.message_queue(meta_message_id)
  WHERE meta_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_queue_pending ON public.message_queue(status, created_at)
  WHERE status = 'pending';

-- ============================================================
-- 3. WEBHOOK_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  payload JSONB NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org webhooks"
  ON public.webhook_logs
  FOR SELECT
  USING (org_id = public.get_user_org_id());

-- Service role inserts (from webhook API route — no RLS needed for INSERT)
CREATE POLICY "Service can insert webhooks"
  ON public.webhook_logs
  FOR INSERT
  WITH CHECK (true); -- Webhook handler uses service_role key

CREATE INDEX IF NOT EXISTS idx_webhooks_org_id ON public.webhook_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON public.webhook_logs(processed)
  WHERE processed = false;

-- ============================================================
-- 4. REALTIME SUBSCRIPTIONS
-- Enable realtime for message_queue status updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
