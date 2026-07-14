import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/users
 * Returns a list of users with their emails.
 * Only accessible by admin users.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin authentication. Trust the JWT `role` claim when present,
    // but it is intermittently absent from the post-MFA access token on
    // Vercel — fall back to the database (admin_users) as the source of
    // truth so the endpoint does not 401/403 every other request.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!adminUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Use the admin API to get user emails. The user-scoped client cannot
    // call listUsers() reliably because the post-MFA JWT may lack the admin
    // flag on Vercel, so use a service-role client (server-side only).
    const service = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: users, error } = await service.auth.admin.listUsers();

    if (error) {
      console.error("Erro ao listar users:", error);
      return NextResponse.json({ error: "Erro ao carregar utilizadores." }, { status: 500 });
    }

    // Return only id and email for each user
    const result =
      users?.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      })) || [];

    return NextResponse.json({ users: result });
  } catch {
    console.error("Erro inesperado em list-users:");
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
