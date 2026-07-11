/**
 * Issencial — Shared email building blocks.
 *
 * Brand tokens, asset/base URL helpers, escaping and the shared `shell()`
 * layout (preheader + logo header + content + footer). All type-specific
 * templates in this folder compose these so every email stays on one visual
 * system.
 *
 * Email-safe constraints:
 *  - inline styles only (no <style> / external CSS)
 *  - table-based layout
 *  - brand tokens: primary #002e35, accent #d7de6a
 *  - logo served from /logo/principal_branco.png (white version on dark header)
 *
 * Variants (per the design directive: give 3+ options, not a single answer):
 *  - `classic`  — the original, balanced design (default)
 *  - `compact`  — denser, mobile-first, full-width button, no accent band
 *  - `editorial`— high-craft: sharp card + accent spine, inverted accent CTA,
 *                 larger airy type, accent hairlines
 */

export const PRIMARY = "#002e35";
export const PRIMARY_LIGHT = "#004a54";
export const ACCENT = "#d7de6a";
export const INK = "#151e28";
export const BODY_TEXT = "#374151";
export const MUTED = "#6b7280";
export const FAINT = "#9ca3af";
export const BORDER = "#e5e7eb";
export const FOOTER_BG = "#f9fafb";
export const CANVAS = "#f1f1f1";
export const NEUTRAL_PILL_BG = "#eef2f3";

/** The three offered email layouts. */
export type EmailVariant = "classic" | "compact" | "editorial";
export const EMAIL_VARIANTS: EmailVariant[] = ["classic", "compact", "editorial"];

/** Absolute base URL for links + assets (set NEXT_PUBLIC_SITE_URL in prod). */
export function siteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return raw.replace(/\/+$/, "");
}

export function logoSrc(): string {
  const base = siteBase();
  return base ? `${base}/logo/principal_branco.png` : "/logo/principal_branco.png";
}

/** Escape text inserted into HTML to avoid layout breaks / injection. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function year(): number {
  return new Date().getFullYear();
}

/** Per-variant typography for headings + body copy. */
const TYPE_FACES: Record<EmailVariant, { h2: string; body: string }> = {
  classic: {
    h2: "font-size:20px;line-height:1.25;font-weight:700;margin:0 0 16px;",
    body: "font-size:15px;line-height:1.7;",
  },
  compact: {
    h2: "font-size:18px;line-height:1.3;font-weight:700;margin:0 0 14px;",
    body: "font-size:14px;line-height:1.65;",
  },
  editorial: {
    h2: "font-size:24px;line-height:1.2;font-weight:700;margin:0 0 18px;",
    body: "font-size:15px;line-height:1.8;",
  },
};

/** Primary title element, variant-aware. `text` is expected pre-escaped. */
export function heading(text: string, variant: EmailVariant = "classic"): string {
  return `<h2 style="color:${INK};${TYPE_FACES[variant].h2}">${text}</h2>`;
}

/** Body paragraph, variant-aware. `html` is expected pre-escaped. */
export function lede(html: string, variant: EmailVariant = "classic", margin = "0 0 4px"): string {
  return `<p style="color:${BODY_TEXT};${TYPE_FACES[variant].body}margin:${margin};">${html}</p>`;
}

export interface ShellOpts {
  preheader: string;
  content: string;
  accentLabel?: string;
  variant?: EmailVariant;
  /** Two footer lines; defaults to the transactional notice. */
  footerLines?: { main: string; brand: string };
}

/**
 * Shared shell: preheader + header (logo) + optional accent label + content +
 * footer. The `variant` selects the visual system; defaults to `classic`
 * so existing callers keep rendering exactly as before.
 */
export function shellVariant(opts: ShellOpts): string {
  const v = opts.variant ?? "classic";
  const logo = logoSrc();
  const base = siteBase();
  const homeHref = base ? `${base}/` : "/";
  const footer = opts.footerLines ?? {
    main: "Este é um email automático do portal Issencial. Por favor, não responda a este email.",
    brand: `© ${year()} Issencial — Serviços Integrados Globais`,
  };

  const outerPad = v === "compact" ? "24px 16px" : "40px 16px";
  const headerPad = v === "compact" ? "20px 24px" : v === "editorial" ? "40px 40px" : "28px 40px";
  const logoW = v === "compact" ? 104 : 132;
  const headerRule =
    v === "editorial"
      ? `<div style="width:40px;height:2px;background:${ACCENT};margin:14px auto 0;"></div>`
      : "";

  let accentEl = "";
  if (opts.accentLabel) {
    if (v === "compact") {
      accentEl = `<p style="color:${PRIMARY_LIGHT};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 18px;">${esc(opts.accentLabel)}</p>`;
    } else {
      const padX = v === "editorial" ? "10px 44px" : "10px 40px";
      const align = v === "editorial" ? "left" : "center";
      accentEl = `<tr>
        <td style="background:${ACCENT};padding:${padX};text-align:${align};">
          <span style="color:${PRIMARY};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">${esc(opts.accentLabel)}</span>
        </td>
      </tr>`;
    }
  }

  const cardRadius = v === "compact" ? "12px" : v === "editorial" ? "4px" : "16px";
  const contentPad = v === "compact" ? "24px 24px" : v === "editorial" ? "40px 44px" : "36px 40px";
  const spine = v === "editorial" ? `border-left:3px solid ${ACCENT};` : "";
  const footerTop =
    v === "editorial" ? `border-top:2px solid ${ACCENT};` : "border-top:1px solid #e5e7eb;";
  const footerPad = v === "compact" ? "18px 24px" : v === "editorial" ? "24px 44px" : "24px 40px";

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
      <td align="center" style="padding:${outerPad};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:${cardRadius};overflow:hidden;border:1px solid ${BORDER};${spine}">
          <!-- Header -->
          <tr>
            <td style="background:${PRIMARY};padding:${headerPad};text-align:center;">
              <a href="${homeHref}" style="text-decoration:none;display:inline-block;">
                <img src="${logo}" alt="Issencial" width="${logoW}" style="height:auto;display:block;margin:0 auto;" />
              </a>
              <p style="color:#ffffff;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin:12px 0 0;opacity:0.65;">
                Serviços Integrados Globais
              </p>
              ${headerRule}
            </td>
          </tr>
          ${accentEl}
          <!-- Content -->
          <tr>
            <td style="padding:${contentPad};">
              ${opts.content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:${footerPad};background:${FOOTER_BG};${footerTop}">
              <p style="color:${FAINT};font-size:12px;line-height:1.6;margin:0;">${esc(footer.main)}</p>
              <p style="color:${FAINT};font-size:12px;line-height:1.6;margin:8px 0 0;">${esc(footer.brand)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Public shell entry point (defaults to `classic`). */
export function shell(opts: ShellOpts): string {
  return shellVariant(opts);
}

/** Reusable CTA button, variant-aware. */
export function ctaVariant(text: string, href: string, variant: EmailVariant = "classic"): string {
  const url = href.startsWith("http") ? href : siteBase() + href;
  const escUrl = esc(url);
  if (variant === "editorial") {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="border-radius:2px;background:${ACCENT};text-align:center;">
          <a href="${escUrl}" style="display:block;padding:15px 32px;color:${PRIMARY};font-size:14px;font-weight:700;text-decoration:none;border-radius:2px;">${esc(text)}</a>
        </td>
      </tr>
    </table>`;
  }
  if (variant === "compact") {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="border-radius:10px;background:${PRIMARY};text-align:center;">
          <a href="${escUrl}" style="display:block;padding:13px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">${esc(text)}</a>
        </td>
      </tr>
    </table>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
    <tr>
      <td style="border-radius:12px;background:${PRIMARY};">
        <a href="${escUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;">${esc(text)}</a>
      </td>
    </tr>
  </table>`;
}

/** Reusable CTA button (defaults to `classic`). */
export function cta(text: string, href: string, variant: EmailVariant = "classic"): string {
  return ctaVariant(text, href, variant);
}

/** Reusable status pill (tinted by tone), variant-aware. */
export function pillVariant(
  label: string,
  tone: "neutral" | "accent" | "alert" = "neutral",
  variant: EmailVariant = "classic"
): string {
  const map = {
    neutral: { bg: NEUTRAL_PILL_BG, fg: PRIMARY_LIGHT },
    accent: { bg: ACCENT, fg: PRIMARY },
    alert: { bg: "#fdecec", fg: "#9b2c2c" },
  } as const;
  const c = map[tone];
  const radius = variant === "editorial" ? "2px" : "999px";
  return `<span style="display:inline-block;padding:4px 12px;border-radius:${radius};background:${c.bg};color:${c.fg};font-size:12px;font-weight:600;letter-spacing:0.02em;">${esc(label)}</span>`;
}

/** Reusable status pill (defaults to `classic`). */
export function pill(
  label: string,
  tone: "neutral" | "accent" | "alert" = "neutral",
  variant: EmailVariant = "classic"
): string {
  return pillVariant(label, tone, variant);
}

/**
 * The `email_queue.type` CHECK constraint allows these values.
 * Transactional emails map to them directly; new templates for database
 * events (contact, quote, stage, client message, payment) are also listed.
 * Marketing/newsletter emails are queued as `notification` until the
 * schema adds a dedicated `newsletter` type.
 */
export const EMAIL_TEMPLATE_TYPES = [
  "notification",
  "process_update",
  "new_message",
  "new_invoice",
  "status_change",
  "contact_confirmation",
  "quote_confirmation",
  "stage_completed",
  "new_client_message",
  "payment_received",
] as const;
export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];
