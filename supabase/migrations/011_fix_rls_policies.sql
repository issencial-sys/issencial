-- Fix contact_submissions: remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;

-- Fix service_requests: restrict SELECT to own requests only
DROP POLICY IF EXISTS "Users can view own requests" ON public.service_requests;
CREATE POLICY "Users can view own requests"
  ON public.service_requests FOR SELECT
  USING (auth.uid() = client_id);
