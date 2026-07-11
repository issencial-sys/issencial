/**
 * payment_received — confirmation sent to client when an invoice payment is received.
 * Editorial style: accent spine, invoice detail table, "Pago" status pill,
 * inverted accent CTA.
 */
import { shellVariant, ctaVariant, pillVariant, esc } from "./shared";

export function paymentReceivedTemplate(input: {
  client_name?: string;
  invoice_number: string;
  amount: string;
  currency?: string;
  service_name?: string;
  cta_url?: string;
}): string {
  const preview = `O pagamento da fatura ${input.invoice_number} foi recebido com sucesso.`;

  const content = `
    <h2 style="color:#151e28;font-size:24px;font-weight:700;line-height:1.2;margin:0 0 14px;">Pagamento recebido com sucesso</h2>
    ${input.client_name ? `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">Olá <strong>${esc(input.client_name)}</strong>,</p>` : ""}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">O pagamento da sua fatura foi processado e recebido com sucesso. Obrigado pela sua confiança.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">Fatura</td>
        <td align="right" style="padding:10px 0;color:#151e28;font-size:14px;font-weight:600;border-bottom:2px solid #f0f1ec;">${esc(input.invoice_number)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">Montante</td>
        <td align="right" style="padding:10px 0;color:#151e28;font-size:14px;font-weight:600;border-bottom:2px solid #f0f1ec;">${esc(input.amount)} ${esc(input.currency ?? "EUR")}</td>
      </tr>
      ${input.service_name ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">Serviço</td>
        <td align="right" style="padding:10px 0;color:#151e28;font-size:14px;font-weight:600;border-bottom:2px solid #f0f1ec;">${esc(input.service_name)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">Estado</td>
        <td align="right" style="padding:10px 0;border-bottom:2px solid #f0f1ec;">${pillVariant("Pago", "accent", "editorial")}</td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:16px 0 0;">O seu processo irá prosseguir para a próxima etapa. Pode acompanhar o progresso no portal.</p>
    ${input.cta_url ? ctaVariant("Ver fatura no portal", input.cta_url, "editorial") : ""}
  `;

  return shellVariant({
    preheader: preview,
    content,
    accentLabel: "Pagamento Confirmado",
    variant: "editorial",
    footerLines: {
      main: "Este é um email automático do portal Issencial. Por favor, não responda a este email.",
      brand: `© ${new Date().getFullYear()} Issencial — Serviços Integrados Globais`,
    },
  });
}
