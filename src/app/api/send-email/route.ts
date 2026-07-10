import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route: /api/send-email
 *
 * Processes pending emails from the email_queue table.
 * This is designed to be called by a cron job (e.g., Vercel Cron, Supabase pg_cron)
 * every minute, or triggered after specific actions.
 *
 * To enable actual email sending:
 * 1. Install Resend: npm install resend
 * 2. Add RESEND_API_KEY to your .env.local
 * 3. Uncomment the Resend integration code below
 */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify admin authentication (only admins can trigger email sends)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== "admin") {
      // Allow the endpoint to be called without auth for cron jobs
      // by checking for an API secret
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
    }

    // Fetch pending emails from the queue
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Erro ao buscar emails pendentes:", fetchError);
      return NextResponse.json({ error: "Erro ao processar fila de emails." }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ processed: 0, message: "Sem emails pendentes." });
    }

    // Process each email
    // NOTE: To enable actual sending, uncomment and configure Resend:
    //
    // import { Resend } from "resend";
    // const resend = new Resend(process.env.RESEND_API_KEY);
    //
    const results = [];

    for (const email of pendingEmails) {
      try {
        // Uncomment to actually send with Resend:
        //
        // await resend.emails.send({
        //   from: "Issencial <noreply@issencial.pt>",
        //   to: [email.to_email],
        //   subject: email.subject,
        //   html: email.html_body,
        // });

        // Mark as sent
        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        results.push({ id: email.id, status: "sent" });
      } catch (err: any) {
        // Mark as failed
        await supabase
          .from("email_queue")
          .update({
            status: "failed",
            error_message: err.message || "Erro desconhecido",
          })
          .eq("id", email.id);

        results.push({ id: email.id, status: "failed" });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
      note: "Para ativar o envio real, configura a Resend (ou outro serviço de email) e descomenta o código em /api/send-email/route.ts",
    });
  } catch {
    console.error("Erro inesperado em send-email:");
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

/**
 * Helper function to add an email to the queue.
 * Call this from server actions or API routes.
 */
export async function queueEmail({
  to_email,
  to_name,
  subject,
  html_body,
  type,
  reference_id,
  reference_type,
}: {
  to_email: string;
  to_name?: string;
  subject: string;
  html_body: string;
  type: "notification" | "process_update" | "new_message" | "new_invoice" | "status_change";
  reference_id?: string;
  reference_type?: string;
}) {
  const supabase = await createClient();

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
    console.error("Erro ao adicionar email à fila:", error);
  }
}

/**
 * HTML email template builder
 */
export function buildEmailHtml({
  title,
  greeting,
  message,
  cta_text,
  cta_url,
  footer,
}: {
  title: string;
  greeting: string;
  message: string;
  cta_text?: string;
  cta_url?: string;
  footer?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f1f1;font-family:'Inter',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#002e35;padding:32px 40px;text-align:center;">
              <h1 style="color:#d7de6a;font-size:24px;margin:0;font-weight:700;">
                Issencial
              </h1>
              <p style="color:#ffffff;font-size:13px;margin:8px 0 0;opacity:0.7;">
                Serviços Integrados Globais
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="color:#151e28;font-size:20px;margin:0 0 8px;">
                ${title}
              </h2>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
                ${greeting}
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                ${message}
              </p>
              ${
                cta_text && cta_url
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background:#002e35;">
                    <a href="${cta_url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;">
                      ${cta_text}
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5;">
                ${footer || "Este é um email automático do portal Issencial. Por favor, não responda a este email."}
              </p>
              <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">
                © ${new Date().getFullYear()} Issencial — Serviços Integrados Globais
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
