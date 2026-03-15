-- ============================================================
-- WAMM Contacts & Templates Migration
-- Creates: contacts (LGPD compliant), message_templates
-- Plan: docs/approved-plans/migration-002_contacts_templates.md
-- ============================================================

-- ============================================================
-- 1. CONTACTS (LGPD Compliant)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  consent_given_at TIMESTAMPTZ,
  consent_source TEXT, -- 'import_csv', 'import_xlsx', 'manual', 'api'
  opted_out_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ, -- Soft-delete for LGPD compliance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, phone)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS: members can view contacts of their org (exclude soft-deleted)
CREATE POLICY "Members can view org contacts"
  ON public.contacts
  FOR SELECT
  USING (
    org_id = public.get_user_org_id()
    AND deleted_at IS NULL
  );

-- RLS: members can insert contacts
CREATE POLICY "Members can create contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id()
  );

-- RLS: members can update contacts
CREATE POLICY "Members can update contacts"
  ON public.contacts
  FOR UPDATE
  USING (
    org_id = public.get_user_org_id()
    AND deleted_at IS NULL
  );

-- RLS: members can soft-delete contacts (update deleted_at, NOT real delete)
-- Real DELETE is blocked — LGPD requires audit trail
CREATE POLICY "Members can delete contacts"
  ON public.contacts
  FOR DELETE
  USING (false); -- Block all hard deletes. Use soft-delete (UPDATE deleted_at) instead.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON public.contacts(org_id, phone);
CREATE INDEX IF NOT EXISTS idx_contacts_org_name ON public.contacts(org_id, name);
CREATE INDEX IF NOT EXISTS idx_contacts_org_active ON public.contacts(org_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. MESSAGE_TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
  body TEXT NOT NULL,
  buttons JSONB,
  variables JSONB,
  meta_template_id TEXT,
  meta_template_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS: members can view templates of their org
CREATE POLICY "Members can view org templates"
  ON public.message_templates
  FOR SELECT
  USING (
    org_id = public.get_user_org_id()
  );

-- RLS: members can create templates
CREATE POLICY "Members can create templates"
  ON public.message_templates
  FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id()
  );

-- RLS: members can update templates
CREATE POLICY "Members can update templates"
  ON public.message_templates
  FOR UPDATE
  USING (
    org_id = public.get_user_org_id()
  );

-- RLS: members can delete draft templates
CREATE POLICY "Members can delete draft templates"
  ON public.message_templates
  FOR DELETE
  USING (
    org_id = public.get_user_org_id()
    AND status = 'draft'
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_org_id ON public.message_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.message_templates(org_id, status);
