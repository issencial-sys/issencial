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
  // Use getSession() (not getUser()) so an expired-but-not-yet-refreshed
  // access_token still resolves from the in-cookie session instead of
  // returning null and causing an intermittent 401. The server client has
  // autoRefreshToken:false, so this reads the cookie without refreshing.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return null;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return adminUser ? user : null;
}
