/**
 * 3. new_message — new message from admin in a thread.
 * Editorial style: accent quote block (4px border), larger airy type,
 * inverted accent CTA, avatar circle.
 */
import { shellVariant, ctaVariant, esc } from "./shared";

export function newMessageTemplate(input: {
  client_name?: string;
  sender_name: string;
  preview: string;
  process_name?: string;
  cta_url?: string;
}): string {
  const initial = (input.sender_name.trim()[0] || "I").toUpperCase();

  const content = `
    <p style="color:#6b7280;font-size:13px;margin:0 0 12px;">Nova mensagem${input.process_name ? ` · ${esc(input.process_name)}` : ""}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="width:40px;vertical-align:top;">
          <span style="display:inline-block;width:40px;height:40px;border-radius:50%;background:#002e35;color:#d7de6a;font-size:16px;font-weight:700;line-height:40px;text-align:center;">${esc(initial)}</span>
        </td>
        <td style="padding-left:12px;vertical-align:middle;">
          <span style="color:#151e28;font-size:16px;font-weight:600;">${esc(input.sender_name)}</span>
          <span style="color:#9ca3af;font-size:13px;display:block;">Equipa Issencial</span>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:4px solid #d7de6a;border-radius:4px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(input.preview)}</p>
        </td>
      </tr>
    </table>
    ${input.client_name ? `<p style="color:#374151;font-size:14px;margin:16px 0 0;">Olá ${esc(input.client_name)}, recebeu uma nova mensagem no seu portal.</p>` : ""}
    ${input.cta_url ? ctaVariant("Abrir conversa", input.cta_url, "editorial") : ""}
  `;
  return shellVariant({ preheader: `Nova mensagem de ${input.sender_name}`, content, accentLabel: "Mensagem", variant: "editorial" });
}
