-- ============================================
-- Issencial — Migration 005: Portal Enhancements
-- ============================================

-- ============================================
-- 1. Add rejection_reason to service_requests
-- ============================================
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';

-- ============================================
-- 2. Add assigned_to + estimated_date to processes
-- ============================================
ALTER TABLE public.processes
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_date DATE;

-- ============================================
-- 3. Add avatar_url to profiles
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- ============================================
-- 4. Create activity_log table
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON public.activity_log FOR SELECT
  USING (public.is_admin());

-- Clients can view activity related to their processes
CREATE POLICY "Clients can view own process activity"
  ON public.activity_log FOR SELECT
  USING (
    entity_type = 'process' AND EXISTS (
      SELECT 1 FROM public.processes
      WHERE processes.id = activity_log.entity_id
        AND processes.client_id = auth.uid()
    )
  );

-- Any authenticated user can insert activity
CREATE POLICY "Authenticated users can insert activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 5. Admin management table
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can view admin list
CREATE POLICY "Admins can view admin users"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

-- Admins can manage admin users
CREATE POLICY "Admins can manage admin users"
  ON public.admin_users FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 6. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_processes_assigned_to ON public.processes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_processes_estimated_date ON public.processes(estimated_date);
CREATE INDEX IF NOT EXISTS idx_profiles_avatar ON public.profiles(avatar_url);
