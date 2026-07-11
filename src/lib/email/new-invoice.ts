/**
 * 4. new_invoice — a new invoice is available.
 * Editorial style: accent-spine card, accent CTA, hairline rows (2px),
 * larger airy type, accent pills (2px radius).
 */
import { shellVariant, ctaVariant, pillVariant, esc } from "./shared";

export function newInvoiceTemplate(input: {
  client_name?: string;
  invoice_number: string;
  amount: string;
  currency?: string;
  due_date?: string;
  status?: string;
  cta_url?: string;
}): string {
  const rows = [
    ["Fatura", input.invoice_number],
    ["Montante", `${esc(input.amount)} ${esc(input.currency ?? "EUR")}`],
    ...(input.due_date ? [["Vencimento", input.due_date] as [string, string]] : []),
  ];

  const detailRows = rows
    .map(
      ([k, val]) => `
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:2px solid #f0f1ec;">${esc(k)}</td>
        <td align="right" style="padding:10px 0;color:#151e28;font-size:14px;font-weight:600;border-bottom:2px solid #f0f1ec;">${esc(val)}</td>
      </tr>`
    )
    .join("");

  const content = `
    <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Nova fatura disponível</p>
    <h2 style="color:#151e28;font-size:24px;margin:0 0 18px;font-weight:700;line-height:1.2;">Fatura ${esc(input.invoice_number)}</h2>
    ${input.client_name ? `<p style="color:#374151;font-size:14px;margin:0 0 16px;">Olá ${esc(input.client_name)},</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRows}
      ${
        input.status
          ? `<tr>
              <td style="padding:14px 0 0;">${pillVariant(input.status, "accent", "editorial")}</td>
              <td></td>
            </tr>`
          : ""
      }
    </table>
    ${
      input.due_date
        ? `<p style="color:#6b7280;font-size:13px;line-height:1.6;margin:16px 0 0;">Por favor, efetue o pagamento até à data de vencimento para evitar interrupções no serviço.</p>`
        : ""
    }
    ${input.cta_url ? ctaVariant("Ver e pagar fatura", input.cta_url, "editorial") : ""}
  `;
  return shellVariant({ preheader: `Fatura ${input.invoice_number}`, content, accentLabel: "Fatura", variant: "editorial" });
}
