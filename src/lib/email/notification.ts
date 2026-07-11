/**
 * 1. notification — generic system notification.
 * Editorial style: accent spine, inverted accent CTA, sharp 2px radius,
 * larger airy type (24px h2, 15px/1.8 body).
 */
import { shellVariant, ctaVariant, esc } from "./shared";

export function notificationTemplate(input: {
  title: string;
  greeting?: string;
  message: string;
  cta_text?: string;
  cta_url?: string;
}): string {
  const content = `
    <h2 style="color:#151e28;font-size:24px;font-weight:700;line-height:1.2;margin:0 0 18px;">${esc(input.title)}</h2>
    ${input.greeting ? `<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 18px;">${esc(input.greeting)}</p>` : ""}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0;">${esc(input.message)}</p>
    ${input.cta_text && input.cta_url ? ctaVariant(input.cta_text, input.cta_url, "editorial") : ""}
  `;
  return shellVariant({ preheader: input.title, content, accentLabel: "Notificação", variant: "editorial" });
}
