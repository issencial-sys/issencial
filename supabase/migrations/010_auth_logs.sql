-- ============================================
-- Issencial — Migration 010: Auth Logs
-- ============================================
-- Regista tentativas de autenticação (login,
-- registo, logout) para deteção de brute force
-- e auditoria de segurança.
-- ============================================

CREATE TABLE public.auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN (
    'login_success',
    'login_failed',
    'signup_success',
    'signup_failed',
    'logout',
    'session_refresh'
  )),
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view auth logs
CREATE POLICY "Admins can view auth logs"
  ON public.auth_logs FOR SELECT
  USING (public.is_admin());

-- API routes insert using the service role key, so we allow all inserts
-- from authenticated server-side calls
CREATE POLICY "Allow insert from server"
  ON public.auth_logs FOR INSERT
  WITH CHECK (true);

-- Indexes for querying logs
CREATE INDEX idx_auth_logs_email ON public.auth_logs(email);
CREATE INDEX idx_auth_logs_event ON public.auth_logs(event);
CREATE INDEX idx_auth_logs_created_at ON public.auth_logs(created_at);
CREATE INDEX idx_auth_logs_email_event ON public.auth_logs(email, event);
