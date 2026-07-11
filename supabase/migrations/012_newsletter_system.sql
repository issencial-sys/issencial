-- ============================================
-- Issencial — Migration 012: Newsletter System
-- ============================================
-- Tabela de subscritores da newsletter, tabela
-- de campanhas enviadas, e atualização da CHECK
-- constraint da email_queue para aceitar os
-- novos tipos de email.
-- ============================================

-- ============================================
-- 1. Newsletter subscribers
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  metadata JSONB DEFAULT '{}'::jsonb,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Admins can manage all subscribers
CREATE POLICY "Admins can manage newsletter subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Anyone can insert (for the subscription form)
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token ON public.newsletter_subscribers(token);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed ON public.newsletter_subscribers(subscribed_at DESC);

-- ============================================
-- 2. Newsletter campaigns (sent history)
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  article_slug TEXT NOT NULL,
  article_title TEXT NOT NULL,
  issue INTEGER DEFAULT NULL,
  intro TEXT DEFAULT '',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('all', 'random', 'manual')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ DEFAULT NULL,
  sent_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can manage all campaigns
CREATE POLICY "Admins can manage newsletter campaigns"
  ON public.newsletter_campaigns FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON public.newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled ON public.newsletter_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created ON public.newsletter_campaigns(created_at DESC);

-- ============================================
-- 3. Newsletter queue (per-recipient status)
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  to_name TEXT DEFAULT '',
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ DEFAULT NULL,
  error TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_queue ENABLE ROW LEVEL SECURITY;

-- Admins can manage newsletter queue
CREATE POLICY "Admins can manage newsletter queue"
  ON public.newsletter_queue FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_campaign ON public.newsletter_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_status ON public.newsletter_queue(status);

-- ============================================
-- 4. Update email_queue CHECK constraint
-- ============================================
-- Add 'newsletter' to the allowed types
ALTER TABLE public.email_queue
  DROP CONSTRAINT IF EXISTS email_queue_type_check,
  ADD CONSTRAINT email_queue_type_check
    CHECK (type IN (
      'notification',
      'process_update',
      'new_message',
      'new_invoice',
      'status_change',
      'contact_confirmation',
      'quote_confirmation',
      'stage_completed',
      'new_client_message',
      'payment_received',
      'newsletter'
    ));
