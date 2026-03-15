-- ============================================================
-- BREKVA: Contact Groups & Tags
-- Migration 005
-- ============================================================

-- ============================================================
-- 1. CONTACT_GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org groups"
  ON public.contact_groups FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can create groups"
  ON public.contact_groups FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Members can update groups"
  ON public.contact_groups FOR UPDATE
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can delete groups"
  ON public.contact_groups FOR DELETE
  USING (org_id = public.get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_contact_groups_org ON public.contact_groups(org_id);

-- ============================================================
-- 2. CONTACT_GROUP_MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_group_members (
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, contact_id)
);

ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON public.contact_group_members FOR SELECT
  USING (
    group_id IN (
      SELECT id FROM public.contact_groups WHERE org_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Members can add to groups"
  ON public.contact_group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.contact_groups WHERE org_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Members can remove from groups"
  ON public.contact_group_members FOR DELETE
  USING (
    group_id IN (
      SELECT id FROM public.contact_groups WHERE org_id = public.get_user_org_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_contact ON public.contact_group_members(contact_id);

-- ============================================================
-- 3. CONTACT_TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org tags"
  ON public.contact_tags FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can create tags"
  ON public.contact_tags FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Members can update tags"
  ON public.contact_tags FOR UPDATE
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Members can delete tags"
  ON public.contact_tags FOR DELETE
  USING (org_id = public.get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_contact_tags_org ON public.contact_tags(org_id);

-- ============================================================
-- 4. CONTACT_TAG_ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_tag_assignments (
  tag_id UUID NOT NULL REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tag_id, contact_id)
);

ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tag assignments"
  ON public.contact_tag_assignments FOR SELECT
  USING (
    tag_id IN (
      SELECT id FROM public.contact_tags WHERE org_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Members can assign tags"
  ON public.contact_tag_assignments FOR INSERT
  WITH CHECK (
    tag_id IN (
      SELECT id FROM public.contact_tags WHERE org_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Members can remove tag assignments"
  ON public.contact_tag_assignments FOR DELETE
  USING (
    tag_id IN (
      SELECT id FROM public.contact_tags WHERE org_id = public.get_user_org_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON public.contact_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_contact ON public.contact_tag_assignments(contact_id);
