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
    // getUser() (not getSession()): server-side, the session comes straight
    // from the cookie storage and may not be authentic — getUser() validates
    // the JWT with the Supabase Auth server. This is the warning seen in the
    // Vercel logs: "Using the user object as returned from
    // supabase.auth.getSession() ... could be insecure".
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const authUser = userError ? null : user;

    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Hash the provided code and atomically mark it as used.
    // The UPDATE ... WHERE used_at IS NULL ensures that even if two concurrent
    // requests use the same code, only one succeeds (race-condition-safe).
    const codeHashed = await hashCode(code.trim().toUpperCase());

    const { data: match, error: updateError } = await supabase
      .from("mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", authUser.id)
      .eq("code_hashed", codeHashed)
      .is("used_at", null)
      .select("id")
      .maybeSingle();

    if (updateError || !match) {
      return NextResponse.json(
        { error: "Código de recuperação inválido ou já utilizado." },
        { status: 400 },
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
