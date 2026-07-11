/**
 * process-newsletter — Supabase Edge Function
 *
 * Processes:
 *  1. Scheduled newsletter campaigns that are due
 *  2. Pending entries in newsletter_queue
 *
 * Sends emails via Brevo transactional email API.
 *
 * Designed to be called by Supabase pg_cron every minute.
 *
 * Environment variables required (set in Supabase Dashboard):
 *   SUPABASE_URL              — Project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key
 *   BREVO_API_KEY             — Brevo API v3 key
 *   BREVO_SENDER_EMAIL        — Verified sender email
 *   NEXT_PUBLIC_SITE_URL      — Site URL (article & unsubscribe links)
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
    tags: params.tags ?? ["issencial", "newsletter"],
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

interface NewsletterQueueItem {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  to_email: string;
  to_name: string;
  subject: string;
  html_body: string;
  status: string;
  created_at: string;
}

interface Campaign {
  id: string;
  subject: string;
  article_slug: string;
  article_title: string;
  issue: number | null;
  intro: string;
  recipient_count: number;
  recipient_type: string;
  status: string;
  scheduled_at: string | null;
}

// ─── HTML builder ──────────────────────────────────

function buildNewsletterHtml({
  subject,
  articleTitle,
  articleSlug,
  intro,
  issue,
  unsubscribeUrl,
}: {
  subject: string;
  articleTitle: string;
  articleSlug: string;
  intro?: string;
  issue?: number | null;
  unsubscribeUrl?: string;
}): string {
  const site = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "";
  const articleUrl = `${site}/blog/${articleSlug}`;
  const label = issue ? `Edição #${issue}` : "Newsletter";
  const dateStr = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const h = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Issencial</title></head>
<body style="margin:0;padding:0;background:#f1f1f1;font-family:'Inter',system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f1f1;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb;border-left:3px solid #d7de6a;">
<tr><td style="background:#002e35;padding:40px;text-align:center;">
<img src="${h(site)}/logo/principal_branco.png" alt="Issencial" width="132" style="display:block;margin:0 auto;">
<p style="color:#fff;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin:12px 0 0;opacity:.65;">Serviços Integrados Globais</p>
<div style="width:40px;height:2px;background:#d7de6a;margin:14px auto 0;"></div>
</td></tr>
<tr><td style="background:#d7de6a;padding:10px 44px;text-align:left;">
<span style="color:#002e35;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">${h(label)}</span>
</td></tr>
<tr><td style="padding:40px 44px;">
<p style="color:#6b7280;font-size:13px;margin:0 0 8px;line-height:1.6;">${h(label)} · ${h(dateStr)}</p>
<h2 style="color:#151e28;font-size:24px;margin:0 0 10px;font-weight:700;line-height:1.25;">${h(subject)}</h2>
${
  intro
    ? `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 28px;">${h(intro)}</p>`
    : ""
}
<a href="${h(articleUrl)}" style="display:block;text-decoration:none;background:#002e35;border-radius:4px;padding:28px 30px;margin-bottom:8px;">
<span style="color:#fff;font-size:21px;font-weight:700;line-height:1.3;display:block;">${h(articleTitle)}</span></a>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
<tr><td style="border-radius:2px;">
<a href="${h(articleUrl)}" style="display:inline-block;padding:10px 24px;color:#002e35;background:#d7de6a;font-size:13px;font-weight:700;text-decoration:none;border-radius:2px;">Ler artigo</a>
</td></tr></table>
${
  unsubscribeUrl
    ? `<p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;">Não quer receber mais emails? <a href="${h(unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline;">Cancelar subscrição</a>.</p>`
    : ""
}
</td></tr>
<tr><td style="padding:24px 44px;background:#f9fafb;border-top:2px solid #d7de6a;">
<p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">Recebeu este email porque subscreveu a newsletter da Issencial.</p>
<p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:8px 0 0;">&copy; ${new Date().getFullYear()} Issencial &mdash; Serviços Integrados Globais</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Handler ───────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsCheck = handleCors(req);
  if (corsCheck) return corsCheck;

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "Supabase credentials not configured." },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const results = { campaigns_activated: 0, emails_sent: 0, emails_failed: 0 };
    const now = new Date().toISOString();

    // ─── Step 1: Activate scheduled campaigns ───
    const { data: dueCampaigns } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_at", now)
      .limit(10);

    if (dueCampaigns && dueCampaigns.length > 0) {
      for (const campaign of dueCampaigns as Campaign[]) {
        const { data: subscribers } = await supabase
          .from("newsletter_subscribers")
          .select("id, email, name, token")
          .eq("status", "active");

        if (!subscribers || subscribers.length === 0) {
          await supabase
            .from("newsletter_campaigns")
            .update({ status: "sent", sent_at: now, recipient_count: 0 })
            .eq("id", campaign.id);
          continue;
        }

        const baseSite = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "";
        const queueData = subscribers.map((sub) => ({
          campaign_id: campaign.id,
          subscriber_id: sub.id,
          to_email: sub.email,
          to_name: sub.name || "",
          subject: campaign.subject,
          html_body: buildNewsletterHtml({
            subject: campaign.subject,
            articleTitle: campaign.article_title,
            articleSlug: campaign.article_slug,
            intro: campaign.intro,
            issue: campaign.issue,
            unsubscribeUrl: `${baseSite}/api/newsletter/unsubscribe?token=${sub.token}`,
          }),
          status: "pending",
        }));

        const { error: qErr } = await supabase
          .from("newsletter_queue")
          .insert(queueData);

        if (qErr) {
          console.error("Erro ao criar fila:", qErr);
          await supabase
            .from("newsletter_campaigns")
            .update({ status: "cancelled" })
            .eq("id", campaign.id);
          continue;
        }

        await supabase
          .from("newsletter_campaigns")
          .update({ status: "sending", recipient_count: queueData.length })
          .eq("id", campaign.id);

        results.campaigns_activated++;
      }
    }

    // ─── Step 2: Send pending newsletter_queue emails ───
    const { data: pending } = await supabase
      .from("newsletter_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (pending && pending.length > 0) {
      for (const email of pending as NewsletterQueueItem[]) {
        const r = await sendTransactionalEmail({
          to: [{ email: email.to_email, name: email.to_name || undefined }],
          subject: email.subject,
          htmlContent: email.html_body,
          tags: ["issencial", "newsletter"],
        });

        if (r.success) {
          await supabase
            .from("newsletter_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", email.id);
          results.emails_sent++;
        } else {
          await supabase
            .from("newsletter_queue")
            .update({ status: "failed", error: r.error || "Erro" })
            .eq("id", email.id);
          results.emails_failed++;
          console.error(`Falha newsletter ${email.id}: ${r.error}`);
        }
      }
    }

    // ─── Step 3: Mark campaigns as sent ───
    const { data: active } = await supabase
      .from("newsletter_campaigns")
      .select("id")
      .eq("status", "sending");

    if (active) {
      for (const c of active) {
        const { count } = await supabase
          .from("newsletter_queue")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", c.id)
          .in("status", ["pending", "sending"]);

        if (count === 0) {
          await supabase
            .from("newsletter_campaigns")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", c.id);
        }
      }
    }

    return jsonResponse({ processed: true, ...results });
  } catch (err) {
    console.error("process-newsletter error:", err);
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
