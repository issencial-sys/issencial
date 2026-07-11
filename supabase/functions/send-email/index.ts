/**
 * send-email — Supabase Edge Function
 *
 * Processes pending emails from the `email_queue` table and sends them
 * via the Brevo transactional email API.
 *
 * Designed to be called by:
 *  - Supabase pg_cron (every minute)
 *  - Manual trigger from admin panel
 *
 * Environment variables required (set in Supabase Dashboard):
 *   SUPABASE_URL              — Project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
 *   BREVO_API_KEY             — Brevo API v3 key
 *   BREVO_SENDER_EMAIL        — Verified sender email address
 *   BREVO_SENDER_NAME         — Sender display name (default: "Issencial")
 *   CRON_SECRET               — Secret to verify cron job calls
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";

// ─── CORS ──────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: CORS_HEADERS });
  }
  return null;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Brevo ─────────────────────────────────────────

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface BrevoSendParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  tags?: string[];
}

interface BrevoSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendTransactionalEmail(
  params: BrevoSendParams
): Promise<BrevoSendResult> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || "Issencial";

  if (!apiKey) return { success: false, error: "BREVO_API_KEY não definida." };
  if (!senderEmail)
    return { success: false, error: "BREVO_SENDER_EMAIL não definida." };

  const body = {
    sender: { name: senderName, email: senderEmail },
    to: params.to.map((r) => ({
      email: r.email,
      name: r.name || r.email.split("@")[0],
    })),
    subject: params.subject,
    htmlContent: params.htmlContent,
    tags: params.tags ?? ["issencial", "transactional"],
  };

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      return { success: true, messageId: data.messageId || "" };
    }

    console.error("Brevo error:", res.status, JSON.stringify(data));
    return {
      success: false,
      error: data.message || data.code || `HTTP ${res.status}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Brevo request failed:", msg);
    return { success: false, error: msg };
  }
}

// ─── Types ─────────────────────────────────────────

interface EmailQueueItem {
  id: string;
  to_email: string;
  to_name: string;
  subject: string;
  html_body: string;
  type: string;
  status: string;
}

// ─── Handler ───────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsCheck = handleCors(req);
  if (corsCheck) return corsCheck;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "Supabase credentials not configured." },
        500
      );
    }

    // Auth: cron secret or service role key
    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      authHeader === `Bearer ${serviceRoleKey}`;

    if (!authorized && req.method === "POST") {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // GET → status
    if (req.method === "GET") {
      const { count: pending } = await supabase
        .from("email_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: sent } = await supabase
        .from("email_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent");

      return jsonResponse({
        status: "healthy",
        queue: { pending: pending ?? 0, sent: sent ?? 0 },
      });
    }

    // POST → process
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      return jsonResponse(
        { error: "Erro ao consultar fila de emails." },
        500
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return jsonResponse({ processed: 0, message: "Sem emails pendentes." });
    }

    const results: Array<{
      id: string;
      status: string;
      messageId?: string;
      error?: string;
    }> = [];

    for (const email of pendingEmails as EmailQueueItem[]) {
      try {
        const result = await sendTransactionalEmail({
          to: [{ email: email.to_email, name: email.to_name || undefined }],
          subject: email.subject,
          htmlContent: email.html_body,
          tags: ["issencial", email.type],
        });

        if (result.success) {
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              message_id: result.messageId || "",
            })
            .eq("id", email.id);

          results.push({ id: email.id, status: "sent", messageId: result.messageId });
        } else {
          await supabase
            .from("email_queue")
            .update({
              status: "failed",
              error_message: result.error || "Erro desconhecido",
            })
            .eq("id", email.id);

          results.push({ id: email.id, status: "failed", error: result.error });
          console.error(
            `Falha ${email.id} (${email.to_email}): ${result.error}`
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro inesperado";
        await supabase
          .from("email_queue")
          .update({ status: "failed", error_message: msg })
          .eq("id", email.id);

        results.push({ id: email.id, status: "failed", error: msg });
      }
    }

    return jsonResponse({ processed: results.length, results });
  } catch (err) {
    console.error("send-email error:", err);
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
