/**
 * Issencial — Email HTML templates (brand-consistent, type-specific).
 *
 * The `email_queue.type` column supports five notification types
 * (`notification`, `process_update`, `new_message`, `new_invoice`,
 * `status_change`). Previously every email was rendered through a single
 * generic `buildEmailHtml()`; these templates give each type its own layout
 * while sharing one visual system (colors, logo, footer).
 *
 * Email-safe constraints:
 *  - inline styles only (no <style> / external CSS)
 *  - table-based layout
 *  - brand tokens: primary #002e35, accent #d7de6a
 *  - logo served from /logo/principal_branco.png (white version on dark header)
 */

const PRIMARY = "#002e35";
const PRIMARY_LIGHT = "#004a54";
const ACCENT = "#d7de6a";
const INK = "#151e28";
const BODY_TEXT = "#374151";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const BORDER = "#e5e7eb";
const FOOTER_BG = "#f9fafb";
const CANVAS = "#f1f1f1";

/** Absolute base URL for links + assets (set NEXT_PUBLIC_SITE_URL in prod). */
function siteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return raw.replace(/\/+$/, "");
}

function logoSrc(): string {
  const base = siteBase();
  return base ? `${base}/logo/principal_branco.png` : "/logo/principal_branco.png";
}

/** Escape text inserted into HTML to avoid layout breaks / injection. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function year(): number {
  return new Date().getFullYear();
}

/** Shared shell: preheader + header (logo) + content + footer. */
function shell(opts: {
  preheader: string;
  content: string;
  accentLabel?: string;
}): string {
  const logo = logoSrc();
  const base = siteBase();
  const homeHref = base ? `${base}/` : "/";

  return `<!DOCTYPE html>
<html lang="pt" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Issencial</title>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};font-family:'Overused Grotesk','Inter',system-ui,-apple-system,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${CANVAS};">
    ${esc(opts.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CANVAS};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
          <!-- Header -->
          <tr>
            <td style="background:${PRIMARY};padding:28px 40px;text-align:center;">
              <a href="${homeHref}" style="text-decoration:none;display:inline-block;">
                <img src="${logo}" alt="Issencial" width="132" style="height:auto;display:block;margin:0 auto;" />
              </a>
              <p style="color:#ffffff;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin:12px 0 0;opacity:0.65;">
                Serviços Integrados Globais
              </p>
            </td>
          </tr>
          ${
            opts.accentLabel
              ? `<tr>
                  <td style="background:${ACCENT};padding:10px 40px;text-align:center;">
                    <span style="color:${PRIMARY};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">${esc(opts.accentLabel)}</span>
                  </td>
                </tr>`
              : ""
          }
          <!-- Content -->
          <tr>
            <td style="padding:36px 40px;">
              ${opts.content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:${FOOTER_BG};border-top:1px solid ${BORDER};">
              <p style="color:${FAINT};font-size:12px;line-height:1.6;margin:0;">
                Este é um email automático do portal Issencial. Por favor, não responda a este email.
              </p>
              <p style="color:${FAINT};font-size:12px;line-height:1.6;margin:8px 0 0;">
                © ${year()} Issencial — Serviços Integrados Globais
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

/** Reusable CTA button. */
function cta(text: string, href: string): string {
  const url = href.startsWith("http") ? href : siteBase() + href;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
    <tr>
      <td style="border-radius:12px;background:${PRIMARY};">
        <a href="${esc(url)}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;">
          ${esc(text)}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Reusable status pill (tinted by tone). */
function pill(label: string, tone: "neutral" | "accent" | "alert" = "neutral"): string {
  const map = {
    neutral: { bg: "#eef2f3", fg: PRIMARY_LIGHT },
    accent: { bg: ACCENT, fg: PRIMARY },
    alert: { bg: "#fdecec", fg: "#9b2c2c" },
  } as const;
  const c = map[tone];
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${c.bg};color:${c.fg};font-size:12px;font-weight:600;letter-spacing:0.02em;">${esc(label)}</span>`;
}

// ============================================================
// 1. notification — generic system notification
// ============================================================
export function notificationTemplate(input: {
  title: string;
  greeting?: string;
  message: string;
  cta_text?: string;
  cta_url?: string;
}): string {
  const content = `
    <h2 style="color:${INK};font-size:20px;margin:0 0 8px;font-weight:700;">${esc(input.title)}</h2>
    ${input.greeting ? `<p style="color:${MUTED};font-size:14px;line-height:1.6;margin:0 0 16px;">${esc(input.greeting)}</p>` : ""}
    <p style="color:${BODY_TEXT};font-size:15px;line-height:1.7;margin:0;">${esc(input.message)}</p>
    ${input.cta_text && input.cta_url ? cta(input.cta_text, input.cta_url) : ""}
  `;
  return shell({ preheader: input.title, content, accentLabel: "Notificação" });
}

// ============================================================
// 2. process_update — progress on a client process
// ============================================================
export function processUpdateTemplate(input: {
  client_name?: string;
  process_name: string;
  stage?: string;
  progress_percent?: number;
  message: string;
  cta_url?: string;
}): string {
  const pct = Math.max(0, Math.min(100, Math.round(input.progress_percent ?? 0)));
  const progressBar = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;">
      <tr>
        <td style="background:#eef2f3;border-radius:999px;height:8px;width:100%;">
          <div style="background:${ACCENT};height:8px;border-radius:999px;width:${pct}%;"></div>
        </td>
      </tr>
      <tr>
        <td align="right" style="padding-top:6px;">
          <span style="color:${MUTED};font-size:12px;">${pct}% concluído</span>
        </td>
      </tr>
    </table>`;

  const content = `
    <p style="color:${MUTED};font-size:13px;margin:0 0 4px;">Atualização de processo</p>
    <h2 style="color:${INK};font-size:20px;margin:0 0 16px;font-weight:700;">${esc(input.process_name)}</h2>
    ${
      input.client_name
        ? `<p style="color:${BODY_TEXT};font-size:14px;margin:0 0 8px;">Olá ${esc(input.client_name)},</p>`
        : ""
    }
    ${
      input.stage
        ? `<p style="margin:0 0 4px;font-size:14px;color:${MUTED};">Fase atual: <strong style="color:${INK};">${esc(input.stage)}</strong></p>`
        : ""
    }
    ${input.progress_percent != null ? progressBar : ""}
    <p style="color:${BODY_TEXT};font-size:15px;line-height:1.7;margin:16px 0 0;">${esc(input.message)}</p>
    ${input.cta_url ? cta("Ver processo no portal", input.cta_url) : ""}
  `;
  return shell({ preheader: `Processo: ${input.process_name}`, content, accentLabel: "Processo" });
}

// ============================================================
// 3. new_message — new message from admin in a thread
// ============================================================
export function newMessageTemplate(input: {
  client_name?: string;
  sender_name: string;
  preview: string;
  process_name?: string;
  cta_url?: string;
}): string {
  const initial = (input.sender_name.trim()[0] || "I").toUpperCase();
  const content = `
    <p style="color:${MUTED};font-size:13px;margin:0 0 12px;">Nova mensagem${input.process_name ? ` · ${esc(input.process_name)}` : ""}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="width:40px;vertical-align:top;">
          <span style="display:inline-block;width:40px;height:40px;border-radius:50%;background:${PRIMARY};color:${ACCENT};font-size:16px;font-weight:700;line-height:40px;text-align:center;">${esc(initial)}</span>
        </td>
        <td style="padding-left:12px;vertical-align:middle;">
          <span style="color:${INK};font-size:15px;font-weight:600;">${esc(input.sender_name)}</span>
          <span style="color:${FAINT};font-size:13px;display:block;">Equipa Issencial</span>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOOTER_BG};border-left:3px solid ${ACCENT};border-radius:8px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="color:${BODY_TEXT};font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${esc(input.preview)}</p>
        </td>
      </tr>
    </table>
    ${input.client_name ? `<p style="color:${BODY_TEXT};font-size:14px;margin:16px 0 0;">Olá ${esc(input.client_name)}, recebeu uma nova mensagem no seu portal.</p>` : ""}
    ${input.cta_url ? cta("Abrir conversa", input.cta_url) : ""}
  `;
  return shell({ preheader: `Nova mensagem de ${input.sender_name}`, content, accentLabel: "Mensagem" });
}

// ============================================================
// 4. new_invoice — a new invoice is available
// ============================================================
export function newInvoiceTemplate(input: {
  client_name?: string;
  invoice_number: string;
  amount: string;
  currency?: string;
  due_date?: string;
  status?: string;
  cta_url?: string;
}): string {
  const rows = [
    ["Fatura", input.invoice_number],
    ["Montante", `${esc(input.amount)} ${esc(input.currency ?? "EUR")}`],
    ...(input.due_date ? [["Vencimento", input.due_date] as [string, string]] : []),
  ];
  const detailRows = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:10px 0;color:${MUTED};font-size:14px;border-bottom:1px solid ${BORDER};">${esc(k)}</td>
        <td align="right" style="padding:10px 0;color:${INK};font-size:14px;font-weight:600;border-bottom:1px solid ${BORDER};">${esc(v)}</td>
      </tr>`
    )
    .join("");

  const content = `
    <p style="color:${MUTED};font-size:13px;margin:0 0 4px;">Nova fatura disponível</p>
    <h2 style="color:${INK};font-size:20px;margin:0 0 16px;font-weight:700;">Fatura ${esc(input.invoice_number)}</h2>
    ${input.client_name ? `<p style="color:${BODY_TEXT};font-size:14px;margin:0 0 16px;">Olá ${esc(input.client_name)},</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRows}
      ${
        input.status
          ? `<tr>
              <td style="padding:14px 0 0;">${pill(input.status, "accent")}</td>
              <td></td>
            </tr>`
          : ""
      }
    </table>
    ${
      input.due_date
        ? `<p style="color:${MUTED};font-size:13px;line-height:1.6;margin:16px 0 0;">Por favor, efetue o pagamento até à data de vencimento para evitar interrupções no serviço.</p>`
        : ""
    }
    ${input.cta_url ? cta("Ver e pagar fatura", input.cta_url) : ""}
  `;
  return shell({ preheader: `Fatura ${input.invoice_number}`, content, accentLabel: "Fatura" });
}

// ============================================================
// 5. status_change — a record changed status
// ============================================================
export function statusChangeTemplate(input: {
  entity_label: string;
  entity_name: string;
  old_status: string;
  new_status: string;
  message?: string;
  cta_url?: string;
}): string {
  const content = `
    <p style="color:${MUTED};font-size:13px;margin:0 0 4px;">Alteração de estado</p>
    <h2 style="color:${INK};font-size:20px;margin:0 0 6px;font-weight:700;">${esc(input.entity_label)}</h2>
    <p style="color:${BODY_TEXT};font-size:15px;margin:0 0 20px;">${esc(input.entity_name)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="padding:8px 0;">${pill(input.old_status)}</td>
        <td style="padding:8px 14px;color:${MUTED};font-size:18px;font-weight:700;">→</td>
        <td style="padding:8px 0;">${pill(input.new_status, "accent")}</td>
      </tr>
    </table>
    ${input.message ? `<p style="color:${BODY_TEXT};font-size:15px;line-height:1.7;margin:0 0 4px;">${esc(input.message)}</p>` : ""}
    ${input.cta_url ? cta("Ver detalhes", input.cta_url) : ""}
  `;
  return shell({ preheader: `${input.entity_name}: ${input.old_status} → ${input.new_status}`, content, accentLabel: "Estado" });
}

/** Map an `email_queue.type` value to its template builder name. */
export const EMAIL_TEMPLATE_TYPES = [
  "notification",
  "process_update",
  "new_message",
  "new_invoice",
  "status_change",
] as const;
export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];
