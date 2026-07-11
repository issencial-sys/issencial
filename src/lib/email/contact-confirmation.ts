/**
 * contact_confirmation — confirmation sent to user after contact form submission.
 * Editorial style: accent spine, quote block with message preview,
 * inverted accent CTA.
 */
import { shellVariant, ctaVariant, esc } from "./shared";

export function contactConfirmationTemplate(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const preview = "Recebemos a sua mensagem. Vamos responder em breve.";

  const content = `
    <h2 style="color:#151e28;font-size:24px;font-weight:700;line-height:1.2;margin:0 0 14px;">Recebemos a sua mensagem</h2>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">Olá <strong>${esc(input.name)}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">Recebemos a sua mensagem e vamos analisá-la com a maior atenção. A nossa equipa responder-lhe-á num prazo máximo de 24 horas úteis.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:4px solid #d7de6a;border-radius:4px;">
      <tr><td style="padding:18px 20px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px;">Assunto</p>
        <p style="color:#151e28;font-size:15px;font-weight:600;margin:0 0 10px;">${esc(input.subject)}</p>
        <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px;">Mensagem enviada</p>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;">${esc(input.message)}</p>
      </td></tr>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:20px 0 0;">Entraremos em contacto para o email <strong>${esc(input.email)}</strong> ou pelo telefone fornecido.</p>
    ${ctaVariant("Visitar o site", "/", "editorial")}
  `;

  return shellVariant({
    preheader: preview,
    content,
    accentLabel: "Confirmação de Contacto",
    variant: "editorial",
    footerLines: {
      main: "Este é um email automático do portal Issencial. Por favor, não responda a este email.",
      brand: `© ${new Date().getFullYear()} Issencial — Serviços Integrados Globais`,
    },
  });
}
