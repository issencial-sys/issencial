-- ============================================
-- Issencial — Migration 015: MFA Recovery Codes
-- ============================================

-- ============================================
-- 1. Recovery codes table
-- ============================================
CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hashed TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up unused codes by user
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user
  ON public.mfa_recovery_codes(user_id, used_at);

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own unused recovery codes
CREATE POLICY "Users can view own recovery codes"
  ON public.mfa_recovery_codes FOR SELECT
  USING (auth.uid() = user_id AND used_at IS NULL);

-- Users can insert their own recovery codes (during enrollment)
CREATE POLICY "Users can insert own recovery codes"
  ON public.mfa_recovery_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update (mark as used) their own codes
CREATE POLICY "Users can update own recovery codes"
  ON public.mfa_recovery_codes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recovery codes (regenerate)
CREATE POLICY "Users can delete own recovery codes"
  ON public.mfa_recovery_codes FOR DELETE
  USING (auth.uid() = user_id);
