import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

/**
 * POST /api/admin/set-role
 * Sets or removes the admin role for a user.
 * Only accessible by existing admin users.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify admin auth (validated against admin_users, not the JWT claim)
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { user_id, email, role } = await request.json();

    if (!user_id || !email) {
      return NextResponse.json(
        { error: "user_id and email are required" },
        { status: 400 },
      );
    }

    if (role === "admin") {
      // Set admin role via auth admin API (requires service role key)
      const { error } = await adminSupabase.auth.admin.updateUserById(user_id, {
        app_metadata: { role: "admin" },
      });

      if (error) {
        console.error("Erro ao definir role admin:", error);
        return NextResponse.json({ error: "Erro ao atualizar permissões." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Admin role set" });
    } else {
      // Remove admin role (requires service role key)
      const { error } = await adminSupabase.auth.admin.updateUserById(user_id, {
        app_metadata: { role: "" },
      });

      if (error) {
        console.error("Erro ao remover role admin:", error);
        return NextResponse.json({ error: "Erro ao atualizar permissões." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Admin role removed" });
    }
  } catch {
    console.error("Erro inesperado em set-role:");
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
