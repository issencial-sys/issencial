import { createClient } from "@/lib/supabase/server";

/**
 * Authorize the current request as an admin.
 *
 * Validation is done against the `admin_users` table (source of truth),
 * NOT the `role` JWT custom claim. That claim is intermittently absent
 * from the post-MFA access token on Vercel, which caused every admin API
 * to 401/403 and the admin pages to redirect to /admin/login.
 *
 * Returns the authenticated user when they are an admin, or `null`.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return adminUser ? user : null;
}
