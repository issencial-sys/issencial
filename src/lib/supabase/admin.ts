import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase admin client using the SERVICE_ROLE_KEY.
 *
 * This client **bypasses RLS** and should ONLY be used in:
 *   - API routes that need auth.admin.* methods (e.g., set-role)
 *   - Server-side operations that require elevated privileges
 *
 * ⚠️ Never expose this client to the browser or include it in client bundles.
 * The SERVICE_ROLE_KEY must NEVER be prefixed with NEXT_PUBLIC_.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
