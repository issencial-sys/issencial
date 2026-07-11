/**
 * new_client_message — notification sent to admin when a client sends a message.
 * Editorial style: accent spine, client avatar, message quote block,
 * inverted accent CTA to admin panel.
 */
import { shellVariant, ctaVariant, esc } from "./shared";

export function newClientMessageTemplate(input: {
  client_name: string;
  client_email?: string;
  process_name?: string;
  preview: string;
  cta_url?: string;
}): string {
  const initial = (input.client_name.trim()[0] || "C").toUpperCase();
  const preview = `${input.client_name} enviou uma nova mensagem${input.process_name ? ` sobre ${input.process_name}` : ""}.`;

  const content = `
    <h2 style="color:#151e28;font-size:24px;font-weight:700;line-height:1.2;margin:0 0 14px;">Tem uma nova mensagem de cliente</h2>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">O cliente enviou uma mensagem${input.process_name ? ` sobre o processo <strong>${esc(input.process_name)}</strong>` : ""}.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="width:44px;vertical-align:top;">
          <span style="display:inline-block;width:44px;height:44px;border-radius:50%;background:#002e35;color:#d7de6a;font-size:18px;font-weight:700;line-height:44px;text-align:center;">${esc(initial)}</span>
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <span style="color:#151e28;font-size:16px;font-weight:600;">${esc(input.client_name)}</span>
          <span style="color:#9ca3af;font-size:13px;display:block;">${input.process_name ? `Cliente · ${esc(input.process_name)}` : "Cliente"}</span>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:4px solid #d7de6a;border-radius:4px;">
      <tr><td style="padding:18px 20px;">
        <p style="color:#374151;font-size:15px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(input.preview)}</p>
      </td></tr>
    </table>
    ${input.cta_url ? ctaVariant("Responder à mensagem", input.cta_url, "editorial") : ""}
  `;

  return shellVariant({
    preheader: preview,
    content,
    accentLabel: "Nova Mensagem de Cliente",
    variant: "editorial",
    footerLines: {
      main: "Este é um email automático do portal Issencial.",
      brand: `© ${new Date().getFullYear()} Issencial — Serviços Integrados Globais`,
    },
  });
}
