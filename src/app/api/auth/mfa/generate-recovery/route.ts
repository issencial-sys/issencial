import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashCode } from "@/lib/auth/recovery-hash";

const CODE_LENGTH = 10;
const NUM_CODES = 8;

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 to avoid confusion

function generateRecoveryCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    if ((i + 1) % 5 === 0 && i < CODE_LENGTH - 1) code += "-";
  }
  return code;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Delete old unused codes
    await supabase
      .from("mfa_recovery_codes")
      .delete()
      .eq("user_id", user.id)
      .is("used_at", null);

    // Generate new codes
    const codes: string[] = [];
    const records: { user_id: string; code_hashed: string }[] = [];

    for (let i = 0; i < NUM_CODES; i++) {
      const code = generateRecoveryCode();
      codes.push(code);
      records.push({
        user_id: user.id,
        code_hashed: await hashCode(code),
      });
    }

    const { error } = await supabase.from("mfa_recovery_codes").insert(records);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao guardar códigos de recuperação." },
        { status: 500 },
      );
    }

    return NextResponse.json({ codes });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
