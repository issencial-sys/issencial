-- ============================================
-- Issencial — Migration 004: Process Documents,
-- Storage & Email Queue
-- ============================================

-- ============================================
-- 1. Process Documents (Documentos do Processo)
-- ============================================
CREATE TABLE public.process_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  storage_path TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.process_documents ENABLE ROW LEVEL SECURITY;

-- Clients can view documents of their own processes
CREATE POLICY "Clients can view own process documents"
  ON public.process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.processes
      WHERE processes.id = process_documents.process_id
        AND processes.client_id = auth.uid()
    )
  );

-- Clients can insert documents into their own processes
CREATE POLICY "Clients can insert documents into own processes"
  ON public.process_documents FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM public.processes
      WHERE processes.id = process_documents.process_id
        AND processes.client_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all process documents"
  ON public.process_documents FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 2. Add attachments column to messages
-- ============================================
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;


-- ============================================
-- 3. Email Notification Queue
-- ============================================
CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT DEFAULT '',
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'notification'
    CHECK (type IN ('notification', 'process_update', 'new_message', 'new_invoice', 'status_change')),
  reference_id TEXT DEFAULT '',
  reference_type TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT DEFAULT '',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can view the email queue
CREATE POLICY "Only admins can view email queue"
  ON public.email_queue FOR SELECT
  USING (public.is_admin());

-- Any authenticated service can insert
CREATE POLICY "Service can insert into email queue"
  ON public.email_queue FOR INSERT
  WITH CHECK (true);

-- Only admins can update email queue
CREATE POLICY "Admins can update email queue"
  ON public.email_queue FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 4. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_process_documents_process_id ON public.process_documents(process_id);
CREATE INDEX IF NOT EXISTS idx_process_documents_client_id ON public.process_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_type ON public.email_queue(type);


-- ============================================
-- 5. Storage Bucket Setup
-- ============================================
-- Create bucket for process documents
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'process-documents',
  'process-documents',
  false,
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Authenticated users can upload
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'process-documents'
    AND auth.role() = 'authenticated'
  );

-- Storage RLS: Users can view their own files
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'process-documents'
    AND (
      -- Check if the file path contains the user's auth ID
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Storage RLS: Admins can manage all files
CREATE POLICY "Admins can manage all storage objects"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'process-documents'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'process-documents'
    AND public.is_admin()
  );

-- Storage RLS: Allow deletes by owner or admin
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'process-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );
