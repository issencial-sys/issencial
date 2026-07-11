-- ============================================
-- Issencial — Migration 016: Clients can read their assigned admin's display_name
-- ============================================
--
-- The admin config page lets an admin set a public "display_name" (e.g. "Gestor Lima")
-- that is supposed to be shown to clients in the portal (chat author, typing indicator
-- and "Consultor Responsável" card).
--
-- However, the SELECT policy on admin_users only allowed admins to read it
-- (policy "Admins can view admin users" → USING (public.is_admin())), so a portal
-- client (a non-admin) always got NULL back and only ever saw the fallback defaults
-- ("Issencial" / "Consultor Issencial").
--
-- This adds a SELECT policy that lets a client read ONLY the admin_users row of the
-- admin they are assigned to, via client_assignments. RLS selects are OR-combined,
-- so admins keep their existing access.
-- ============================================

DROP POLICY IF EXISTS "Clients can view own assigned admin" ON public.admin_users;

CREATE POLICY "Clients can view own assigned admin"
  ON public.admin_users FOR SELECT
  USING (
    user_id IN (
      SELECT admin_id
      FROM public.client_assignments
      WHERE client_id = auth.uid()
    )
  );
