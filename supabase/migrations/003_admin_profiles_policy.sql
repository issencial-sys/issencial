-- ============================================
-- Issencial — Migration 003: Admin Profiles Policy
-- ============================================
-- Corrige o problema de admins não conseguirem ver
-- os nomes dos clientes na lista de conversas e
-- na lista de processos.
--
-- A tabela profiles só permitia SELECT do próprio
-- perfil (auth.uid() = id). Esta migration adiciona
-- uma policy para admins verem todos os perfis.
-- ============================================

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
