import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * Returns a list of users with their emails.
 * Only accessible by admin users.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Use admin API to get user emails
    const { data: users, error } = await supabase.auth.admin.listUsers();

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
