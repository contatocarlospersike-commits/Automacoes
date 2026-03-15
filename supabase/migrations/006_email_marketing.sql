-- ============================================================
-- BREKVA: Email Marketing
-- Migration 006: email_templates, email_campaigns, email_queue, email_events
-- ============================================================

-- ============================================================
-- 1. EMAIL_TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT 'BREKVA',
  html_body TEXT NOT NULL,
  preview_text TEXT,
  variables JSONB DEFAULT '[]'::JSONB, -- ["name", "email", "company"]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view email templates"
  ON public.email_templates FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can create email templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Members can update email templates"
  ON public.email_templates FOR UPDATE
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can delete email templates"
  ON public.email_templates FOR DELETE
  USING (org_id = public.get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_email_templates_org ON public.email_templates(org_id);

-- ============================================================
-- 2. EMAIL_CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email_template_id UUID NOT NULL REFERENCES public.email_templates(id),
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  -- Target: 'all' | 'group' | 'tag'
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'group', 'tag')),
  target_group_id UUID REFERENCES public.contact_groups(id) ON DELETE SET NULL,
  target_tag_id UUID REFERENCES public.contact_tags(id) ON DELETE SET NULL,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')
  ),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Metrics
  total_recipients INTEGER NOT NULL DEFAULT 0,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_clicked INTEGER NOT NULL DEFAULT 0,
  total_bounced INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view email campaigns"
  ON public.email_campaigns FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can create email campaigns"
  ON public.email_campaigns FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Members can update email campaigns"
  ON public.email_campaigns FOR UPDATE
  USING (org_id = public.get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_email_campaigns_org ON public.email_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(org_id, status);

-- ============================================================
-- 3. EMAIL_QUEUE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  contact_name TEXT,
  variables JSONB DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sending', 'sent', 'opened', 'clicked', 'bounced', 'failed')
  ),
  resend_email_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  failed_reason TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view email queue"
  ON public.email_queue FOR SELECT
  USING (
    email_campaign_id IN (
      SELECT id FROM public.email_campaigns WHERE org_id = public.get_user_org_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_email_queue_campaign ON public.email_queue(email_campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(email_campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_email_queue_resend_id ON public.email_queue(resend_email_id) WHERE resend_email_id IS NOT NULL;

-- ============================================================
-- 4. EMAIL_EVENTS (Resend webhooks)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'email.sent' | 'email.opened' | 'email.clicked' | 'email.bounced'
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON public.email_events(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_unprocessed ON public.email_events(processed) WHERE processed = false;

-- ============================================================
-- 5. UPDATE TRIGGER: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
