import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashCode } from "@/lib/auth/recovery-hash";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Código de recuperação inválido." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Hash the provided code and query directly for a match
    const codeHashed = await hashCode(code.trim().toUpperCase());

    const { data: match, error: findError } = await supabase
      .from("mfa_recovery_codes")
      .select("id")
      .eq("user_id", user.id)
      .eq("code_hashed", codeHashed)
      .is("used_at", null)
      .maybeSingle();

    if (findError || !match) {
      return NextResponse.json(
        { error: "Código de recuperação inválido ou já utilizado." },
        { status: 400 },
      );
    }

    // Mark the code as used
    const { error: updateError } = await supabase
      .from("mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", match.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Erro ao validar código de recuperação." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
