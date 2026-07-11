/**
 * stage_completed — notification sent to client when a process stage is completed.
 * Editorial style: accent spine, progress bar, stage highlight block,
 * inverted accent CTA.
 */
import { shellVariant, ctaVariant, esc } from "./shared";

const ACCENT = "#d7de6a";

export function stageCompletedTemplate(input: {
  client_name?: string;
  process_name: string;
  stage_title: string;
  progress_percent?: number;
  message: string;
  cta_url?: string;
}): string {
  const pct = Math.max(0, Math.min(100, Math.round(input.progress_percent ?? 0)));
  const preview = `O seu processo avançou. A etapa "${input.stage_title}" foi concluída.`;

  const progressBar = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">
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
    <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Atualização do seu processo</p>
    <h2 style="color:#151e28;font-size:24px;margin:0 0 14px;font-weight:700;line-height:1.2;">${esc(input.process_name)}</h2>
    ${input.client_name ? `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">Olá <strong>${esc(input.client_name)}</strong>,</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:4px solid #d7de6a;border-radius:4px;margin-bottom:20px;">
      <tr><td style="padding:18px 20px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px;">Etapa concluída</p>
        <p style="color:#151e28;font-size:18px;font-weight:700;margin:0;">${esc(input.stage_title)}</p>
      </td></tr>
    </table>
    ${input.progress_percent != null ? progressBar : ""}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:20px 0 0;">${esc(input.message)}</p>
    ${input.cta_url ? ctaVariant("Acompanhar processo", input.cta_url, "editorial") : ""}
  `;

  return shellVariant({
    preheader: preview,
    content,
    accentLabel: "Processo",
    variant: "editorial",
    footerLines: {
      main: "Este é um email automático do portal Issencial. Por favor, não responda a este email.",
      brand: `© ${new Date().getFullYear()} Issencial — Serviços Integrados Globais`,
    },
  });
}
