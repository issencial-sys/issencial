import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: subscriber } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, status")
      .eq("token", token)
      .maybeSingle();

    if (!subscriber) {
      return new Response(
        `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Cancelar subscrição — Issencial</title>
<style>body{margin:0;padding:40px 20px;font-family:system-ui,sans-serif;background:#f1f1f1;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:16px;padding:40px;max-width:440px;text-align:center;border:1px solid #e5e7eb}
h1{font-size:20px;color:#151e28;margin:0 0 8px}
p{color:#6b7280;font-size:14px;line-height:1.6;margin:0}</style>
</head>
<body>
<div class="card">
<h1>Link inválido</h1>
<p>Este link de cancelamento não é válido ou já foi utilizado.</p>
</div>
</body>
</html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    if (subscriber.status === "unsubscribed") {
      return new Response(
        `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Cancelar subscrição — Issencial</title>
<style>body{margin:0;padding:40px 20px;font-family:system-ui,sans-serif;background:#f1f1f1;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:16px;padding:40px;max-width:440px;text-align:center;border:1px solid #e5e7eb}
h1{font-size:20px;color:#151e28;margin:0 0 8px}
p{color:#6b7280;font-size:14px;line-height:1.6;margin:0}</style>
</head>
<body>
<div class="card">
<h1>Já não está subscrito</h1>
<p>A sua subscrição já tinha sido cancelada anteriormente.</p>
</div>
</body>
</html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // Unsubscribe
    await supabase
      .from("newsletter_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id);

    return new Response(
      `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Cancelar subscrição — Issencial</title>
<style>body{margin:0;padding:40px 20px;font-family:system-ui,sans-serif;background:#f1f1f1;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:16px;padding:40px;max-width:440px;text-align:center;border:1px solid #e5e7eb}
.icon{width:48px;height:48px;border-radius:50%;background:#d7de6a;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:22px;color:#002e35;font-weight:bold}
h1{font-size:20px;color:#151e28;margin:0 0 8px}
p{color:#6b7280;font-size:14px;line-height:1.6;margin:0}</style>
</head>
<body>
<div class="card">
<div class="icon">✓</div>
<h1>Subscrição cancelada</h1>
<p>A sua subscrição da newsletter Issencial foi cancelada com sucesso. Deixará de receber os nossos emails.</p>
<p style="margin-top:12px;font-size:12px;color:#9ca3af;">Se foi um engano, pode <a href="/" style="color:#002e35;text-decoration:underline;">voltar a subscrever</a> no nosso site.</p>
</div>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (err) {
    console.error("Erro em newsletter/unsubscribe:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
