/**
 * 5. status_change — a record changed status.
 * Editorial style: accent transition pills (2px radius), "para" instead of →,
 * larger airy type, inverted accent CTA.
 */
import { shellVariant, ctaVariant, pillVariant, esc } from "./shared";

export function statusChangeTemplate(input: {
  entity_label: string;
  entity_name: string;
  old_status: string;
  new_status: string;
  message?: string;
  cta_url?: string;
}): string {
  const content = `
    <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Alteração de estado</p>
    <h2 style="color:#151e28;font-size:24px;margin:0 0 6px;font-weight:700;line-height:1.2;">${esc(input.entity_label)}</h2>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">${esc(input.entity_name)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="padding:8px 0;">${pillVariant(input.old_status, "neutral", "editorial")}</td>
        <td style="padding:8px 14px;color:#6b7280;font-size:12px;font-weight:600;letter-spacing:0.04em;">para</td>
        <td style="padding:8px 0;">${pillVariant(input.new_status, "accent", "editorial")}</td>
      </tr>
    </table>
    ${input.message ? `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 4px;">${esc(input.message)}</p>` : ""}
    ${input.cta_url ? ctaVariant("Ver detalhes", input.cta_url, "editorial") : ""}
  `;
  return shellVariant({ preheader: `${input.entity_name}: ${input.old_status} para ${input.new_status}`, content, accentLabel: "Estado", variant: "editorial" });
}
