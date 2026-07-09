-- ============================================
-- Issencial — Schema Portal + Admin
-- ============================================

-- ============================================
-- 1. Admin Role Function (via Custom Claims)
-- ============================================

-- Check if current user is admin (checks app_metadata from JWT)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(current_setting('request.jwt.claims', true)::json
      -> 'app_metadata'
      ->> 'role', '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to set a user as admin (callable by existing admins only)
CREATE OR REPLACE FUNCTION public.set_user_admin(target_user_id UUID, admin_status BOOLEAN DEFAULT true)
RETURNS VOID AS $$
BEGIN
  -- Verifica se quem está a chamar é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar permissoes de admin.';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = 
      raw_app_meta_data || 
      jsonb_build_object('role', CASE WHEN admin_status THEN 'admin' ELSE 'user' END)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-set admin claim on signup if using a specific email domain or first user
-- (we'll set manually via the function above for security)


-- ============================================
-- 2. Processes (Processos)
-- ============================================
CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  service_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  source_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- Clients can view their own processes
CREATE POLICY "Clients can view own processes"
  ON public.processes FOR SELECT
  USING (auth.uid() = client_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all processes"
  ON public.processes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 3. Process Stages (Etapas do Processo)
-- ============================================
CREATE TABLE public.process_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.process_stages ENABLE ROW LEVEL SECURITY;

-- Clients can view stages of their own processes
CREATE POLICY "Clients can view own process stages"
  ON public.process_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.processes
      WHERE processes.id = process_stages.process_id
        AND processes.client_id = auth.uid()
    )
  );

-- Admins can manage all stages
CREATE POLICY "Admins can manage all process stages"
  ON public.process_stages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 4. Messages (Mensagens)
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Clients can view messages in their own processes OR general messages to them
CREATE POLICY "Clients can view own messages"
  ON public.messages FOR SELECT
  USING (
    client_id = auth.uid()
  );

-- Clients can insert messages (as themselves)
CREATE POLICY "Clients can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() 
    AND client_id = auth.uid()
  );

-- Clients can mark own messages as read (for received messages)
CREATE POLICY "Clients can update own messages read status"
  ON public.messages FOR UPDATE
  USING (client_id = auth.uid() AND sender_id != auth.uid())
  WITH CHECK (client_id = auth.uid() AND sender_id != auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all messages"
  ON public.messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 5. Invoices (Faturas)
-- ============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Clients can view their own invoices
CREATE POLICY "Clients can view own invoices"
  ON public.invoices FOR SELECT
  USING (client_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 6. Indexes for performance
-- ============================================
CREATE INDEX idx_processes_client_id ON public.processes(client_id);
CREATE INDEX idx_processes_status ON public.processes(status);
CREATE INDEX idx_process_stages_process_id ON public.process_stages(process_id);
CREATE INDEX idx_process_stages_sort_order ON public.process_stages(process_id, sort_order);
CREATE INDEX idx_messages_process_id ON public.messages(process_id);
CREATE INDEX idx_messages_client_id ON public.messages(client_id);
CREATE INDEX idx_messages_read ON public.messages(client_id, read);
CREATE INDEX idx_invoices_process_id ON public.invoices(process_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- ============================================
-- 7. Function to generate invoice numbers
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '/', 2) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE SPLIT_PART(invoice_number, '/', 1) = year_prefix;
  
  RETURN year_prefix || '/' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql STABLE;
