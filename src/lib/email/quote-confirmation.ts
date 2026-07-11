/**
 * quote_confirmation — confirmation sent to user after quote/service request.
 * Editorial style: accent spine, detail table, status pill, inverted accent CTA.
 */
import { shellVariant, ctaVariant, esc } from "./shared";

export function quoteConfirmationTemplate(input: {
  name: string;
  email: string;
  service_name: string;
  description: string;
  phone?: string;
}): string {
  const preview = "Recebemos o seu pedido de orçamento. Vamos analisá-lo.";

  const content = `
    <h2 style="color:#151e28;font-size:24px;font-weight:700;line-height:1.2;margin:0 0 14px;">Pedido de orçamento recebido</h2>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">Olá <strong>${esc(input.name)}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">Recebemos o seu pedido de orçamento para o serviço de <strong>${esc(input.service_name)}</strong>. A nossa equipa irá analisá-lo e enviar-lhe uma proposta personalizada num prazo máximo de 48 horas úteis.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">Serviço</td>
        <td align="right" style="padding:10px 0;color:#151e28;font-size:14px;font-weight:600;border-bottom:2px solid #f0f1ec;">${esc(input.service_name)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">Estado</td>
        <td align="right" style="padding:10px 0;border-bottom:2px solid #f0f1ec;">
          <span style="display:inline-block;padding:4px 12px;border-radius:2px;background:#eef2f3;color:#004a54;font-size:12px;font-weight:600;">Em análise</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">Prazo de resposta</td>
        <td align="right" style="padding:10px 0;color:#151e28;font-size:14px;font-weight:600;border-bottom:2px solid #f0f1ec;">Até 48 horas</td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Entraremos em contacto consigo através do email <strong>${esc(input.email)}</strong>${input.phone ? ` ou do telefone fornecido` : ""}.</p>
    ${ctaVariant("Ver os nossos serviços", "/servicos", "editorial")}
  `;

  return shellVariant({
    preheader: preview,
    content,
    accentLabel: "Confirmação de Pedido",
    variant: "editorial",
    footerLines: {
      main: "Este é um email automático do portal Issencial. Por favor, não responda a este email.",
      brand: `© ${new Date().getFullYear()} Issencial — Serviços Integrados Globais`,
    },
  });
}
