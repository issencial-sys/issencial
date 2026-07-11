/**
 * 2. process_update — progress on a client process.
 * Editorial style: accent spine, accent progress bar (2px radius),
 * inverted accent CTA, larger airy type.
 */
import { shellVariant, ctaVariant, esc } from "./shared";

const ACCENT = "#d7de6a";

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
        <td style="background:#e5e7eb;border-radius:2px;height:8px;width:100%;">
          <div style="background:${ACCENT};height:8px;border-radius:2px;width:${pct}%;"></div>
        </td>
      </tr>
      <tr>
        <td align="right" style="padding-top:6px;">
          <span style="color:#6b7280;font-size:12px;">${pct}% concluído</span>
        </td>
      </tr>
    </table>`;

  const content = `
    <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Atualização de processo</p>
    <h2 style="color:#151e28;font-size:24px;margin:0 0 18px;font-weight:700;line-height:1.2;">${esc(input.process_name)}</h2>
    ${
      input.client_name
        ? `<p style="color:#374151;font-size:14px;margin:0 0 8px;">Olá ${esc(input.client_name)},</p>`
        : ""
    }
    ${
      input.stage
        ? `<p style="margin:0 0 4px;font-size:14px;color:#6b7280;line-height:1.6;">Fase atual: <strong style="color:#151e28;">${esc(input.stage)}</strong></p>`
        : ""
    }
    ${input.progress_percent != null ? progressBar : ""}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:18px 0 0;">${esc(input.message)}</p>
    ${input.cta_url ? ctaVariant("Ver processo no portal", input.cta_url, "editorial") : ""}
  `;
  return shellVariant({ preheader: `Processo: ${input.process_name}`, content, accentLabel: "Processo", variant: "editorial" });
}
