-- ============================================
-- Issencial — Migration 017: Fix auth_logs RLS
-- ============================================
--
-- The previous policy (010_auth_logs.sql) allowed INSERT from any client
-- with WITH CHECK (true), making auth_logs vulnerable to log spoofing,
-- poisoning and flooding by unauthenticated users.
--
-- This migration:
--   1. Drops the overly permissive policy
--   2. Restricts INSERT to authenticated admins only (public.is_admin())
--
-- The service role key (used by createAdminClient() in API routes and
-- by Edge Functions) bypasses RLS entirely, so those operations continue
-- to work without being affected by this policy.
-- ============================================

DROP POLICY IF EXISTS "Allow insert from server" ON public.auth_logs;

CREATE POLICY "Only admins can insert auth logs"
  ON public.auth_logs FOR INSERT
  WITH CHECK (public.is_admin());
