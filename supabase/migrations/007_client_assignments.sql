-- ============================================
-- Issencial — Migration 007: Client Assignments
-- ============================================

-- Each client is assigned to exactly one admin who manages ALL their
-- processes and general chat messages. Other admins can view but not reply.
CREATE TABLE IF NOT EXISTS public.client_assignments (
  client_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments"
  ON public.client_assignments FOR SELECT
  USING (public.is_admin());

-- Admins can insert/update/delete assignments
CREATE POLICY "Admins can manage assignments"
  ON public.client_assignments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Clients can see who their assigned admin is
CREATE POLICY "Clients can view own assignment"
  ON public.client_assignments FOR SELECT
  USING (client_id = auth.uid());

-- Index on admin_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_client_assignments_admin
  ON public.client_assignments(admin_id);

-- Also add assigned_to on profiles for quick reference
-- (mirrors the client_assignments table)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
