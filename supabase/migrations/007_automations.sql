-- ============================================================
-- BREKVA: Automations Engine
-- Migration 007
-- ============================================================

-- ============================================================
-- 1. AUTOMATIONS
-- Stores the full flow as flow_json (React Flow state)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (
    trigger_type IN ('manual', 'contact_created', 'tag_added', 'group_added', 'form_submit', 'date')
  ),
  trigger_config JSONB DEFAULT '{}'::JSONB,
  -- Stores full React Flow state: { nodes: [...], edges: [...] }
  flow_json JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT false,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view automations"
  ON public.automations FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can create automations"
  ON public.automations FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Members can update automations"
  ON public.automations FOR UPDATE
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can delete automations"
  ON public.automations FOR DELETE
  USING (org_id = public.get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_automations_org ON public.automations(org_id);
CREATE INDEX IF NOT EXISTS idx_automations_active ON public.automations(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automations(trigger_type) WHERE is_active = true;

-- ============================================================
-- 2. AUTOMATION_ENROLLMENTS
-- Tracks contacts enrolled in an automation + current step
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_node_id TEXT,        -- React Flow node ID (string)
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'cancelled', 'failed')
  ),
  next_step_at TIMESTAMPTZ,    -- For wait nodes: when to proceed
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(automation_id, contact_id)
);

ALTER TABLE public.automation_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view enrollments"
  ON public.automation_enrollments FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM public.automations WHERE org_id = public.get_user_org_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_enrollments_automation ON public.automation_enrollments(automation_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_contact ON public.automation_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.automation_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_next_step ON public.automation_enrollments(next_step_at)
  WHERE status = 'active' AND next_step_at IS NOT NULL;

-- ============================================================
-- 3. AUTOMATION_STEP_LOG
-- Audit log of each step executed
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_step_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.automation_enrollments(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE public.automation_step_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view step log"
  ON public.automation_step_log FOR SELECT
  USING (
    enrollment_id IN (
      SELECT ae.id FROM public.automation_enrollments ae
      JOIN public.automations a ON a.id = ae.automation_id
      WHERE a.org_id = public.get_user_org_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_step_log_enrollment ON public.automation_step_log(enrollment_id);

-- Updated_at trigger
CREATE TRIGGER automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
