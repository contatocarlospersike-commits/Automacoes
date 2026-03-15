-- ============================================================
-- WAMM Foundation Migration
-- Creates: organizations, org_members, waba_configs
-- Enables: pgcrypto, RLS on all tables
-- Plan: docs/approved-plans/migration-001_foundation.md
-- ============================================================

-- Enable pgcrypto for token encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS: members can see their own org
CREATE POLICY "Members can view own org"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS: admins can update own org
CREATE POLICY "Admins can update own org"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS: any authenticated user can create an org (for onboarding)
CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 2. ORG_MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- RLS: members can see other members of their org
CREATE POLICY "Members can view org members"
  ON public.org_members
  FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- RLS: allow self-insert during onboarding OR admin can add members
CREATE POLICY "Users can join or admins can add members"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    (user_id = auth.uid())
    OR
    (org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    ))
  );

-- RLS: admins can remove members
CREATE POLICY "Admins can remove members"
  ON public.org_members
  FOR DELETE
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- ============================================================
-- 3. WABA_CONFIGS (WhatsApp Business Account)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.waba_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  phone_number_id TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  encrypted_access_token BYTEA,
  encrypted_app_secret BYTEA,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.waba_configs ENABLE ROW LEVEL SECURITY;

-- RLS: admins can view their org's WABA config
CREATE POLICY "Admins can view own waba config"
  ON public.waba_configs
  FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- RLS: admins can insert waba config
CREATE POLICY "Admins can create waba config"
  ON public.waba_configs
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- RLS: admins can update waba config
CREATE POLICY "Admins can update waba config"
  ON public.waba_configs
  FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Function to get current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT org_id FROM public.org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Function to encrypt text with pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_text(plain_text TEXT, encryption_key TEXT)
RETURNS BYTEA
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
AS $$
  SELECT pgp_sym_encrypt(plain_text, encryption_key);
$$;

-- Function to decrypt text with pgcrypto
CREATE OR REPLACE FUNCTION public.decrypt_text(encrypted_data BYTEA, encryption_key TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
AS $$
  SELECT pgp_sym_decrypt(encrypted_data, encryption_key);
$$;

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_waba_configs_org_id ON public.waba_configs(org_id);
