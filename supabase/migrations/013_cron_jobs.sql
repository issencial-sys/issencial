-- ============================================
-- Issencial — Migration 013: Cron Jobs
-- ============================================
-- Configura o pg_cron para chamar as Edge
-- Functions de email automaticamente.
--
-- Jobs criados:
--   send-email          — a cada 1 minuto: processa email_queue
--   process-newsletter  — a cada 1 minuto: processa campanhas agendadas
--
-- Pré-requisitos:
--   1. Edge Functions deployadas:
--        supabase functions deploy send-email
--        supabase functions deploy process-newsletter
--   2. Variáveis de ambiente configuradas no Dashboard:
--        BREVO_API_KEY, BREVO_SENDER_EMAIL, NEXT_PUBLIC_SITE_URL, CRON_SECRET
--   3. CRON_SECRET definido como app setting (executar no SQL Editor):
--        SELECT set_config('app.settings.cron_secret', 'o-teu-secret-aqui', false);
--
--   4. (Opcional) Verificar os jobs criados:
--        SELECT * FROM public.list_cron_jobs();
--
--   5. (Opcional) Verificar execuções recentes:
--        SELECT * FROM public.recent_cron_runs(10);

-- ============================================
-- 1. Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- 2. Add message_id to email_queue
-- ============================================
ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS message_id TEXT DEFAULT '';

-- ============================================
-- 2. Helper function: Edge Function URL
-- ============================================
-- Centraliza o URL base para evitar repetição.
CREATE OR REPLACE FUNCTION public.edge_function_url(name TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT format(
    'https://lyqmsluktqdeytpouyvh.supabase.co/functions/v1/%s',
    name
  );
$$;

-- ============================================
-- 3. Remove old jobs (safe to re-run)
-- ============================================
SELECT cron.unschedule('send-email');
SELECT cron.unschedule('process-newsletter');

-- ============================================
-- 4. Schedule: send-email (every minute)
-- ============================================
-- Processa emails pendentes da email_queue.
-- Chama a Edge Function que envia via Brevo.
SELECT cron.schedule(
  'send-email',                    -- job name
  '* * * * *',                     -- every minute
  $$
    SELECT net.http_post(
      url := public.edge_function_url('send-email'),
      headers := jsonb_build_object(
        'Authorization', concat('Bearer ', current_setting('app.settings.cron_secret', true)),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================
-- 5. Schedule: process-newsletter (every minute)
-- ============================================
-- Ativa campanhas agendadas + envia emails
-- pendentes da newsletter_queue.
SELECT cron.schedule(
  'process-newsletter',            -- job name
  '* * * * *',                     -- every minute
  $$
    SELECT net.http_post(
      url := public.edge_function_url('process-newsletter'),
      headers := jsonb_build_object(
        'Authorization', concat('Bearer ', current_setting('app.settings.cron_secret', true)),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================
-- 6. Log helper (opcional — para debugging)
-- ============================================
CREATE OR REPLACE FUNCTION public.list_cron_jobs()
RETURNS TABLE (
  jobid   BIGINT,
  jobname TEXT,
  schedule TEXT,
  command TEXT,
  nodename TEXT,
  nodeport INTEGER,
  database TEXT,
  username TEXT,
  active  BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT jobid, jobname, schedule, command, nodename, nodeport, database, username, active
  FROM cron.job
  ORDER BY jobid;
$$;

-- ============================================
-- 7. View cron run logs
-- ============================================
CREATE OR REPLACE FUNCTION public.recent_cron_runs(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  jobname   TEXT,
  status    TEXT,
  started   TIMESTAMPTZ,
  duration  INTERVAL
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    j.jobname,
    CASE WHEN jd.status = 0 THEN 'success' ELSE 'failed' END,
    jd.start_time,
    jd.duration
  FROM cron.job_run_details jd
  JOIN cron.job j ON j.jobid = jd.jobid
  ORDER BY jd.start_time DESC
  LIMIT limit_count;
$$;
