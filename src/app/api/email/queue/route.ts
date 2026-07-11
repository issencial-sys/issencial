import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type EmailTemplateType } from "@/lib/email/shared";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { to_email, to_name, subject, html_body, type, reference_id, reference_type } = await request.json();

    if (!to_email || !subject || !html_body || !type) {
      return NextResponse.json({ error: "Campos obrigatórios em falta." }, { status: 400 });
    }

    const { error } = await supabase.from("email_queue").insert({
      to_email,
      to_name: to_name || "",
      subject,
      html_body,
      type,
      reference_id: reference_id || "",
      reference_type: reference_type || "",
    });

    if (error) {
      console.error("Erro ao enfileirar email:", error);
      return NextResponse.json({ error: "Erro ao enfileirar email." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro inesperado em email/queue:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
