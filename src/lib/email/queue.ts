import { createClient } from "@/lib/supabase/server";
import { notificationTemplate } from "./notification";
import { type EmailTemplateType } from "./shared";

/**
 * Add an email to the `email_queue` table.
 * Call this from server actions or API routes. The type must match the
 * `email_queue.type` CHECK constraint:
 * 'notification' | 'process_update' | 'new_message' | 'new_invoice' | 'status_change'.
 *
 * Newsletter emails are queued as `notification` for now.
 */
export async function queueEmail({
  to_email,
  to_name,
  subject,
  html_body,
  type,
  reference_id,
  reference_type,
}: {
  to_email: string;
  to_name?: string;
  subject: string;
  html_body: string;
  type: EmailTemplateType;
  reference_id?: string;
  reference_type?: string;
}): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("email_queue").insert({
    to_email,
    to_name: to_name || "",
    subject,
    html_body,
    type,
    reference_id: reference_id || "",
    reference_type: reference_type || "",
  });

  if (error) {
    console.error("Erro ao adicionar email à fila:", error);
  }
}

/**
 * Backward-compatible generic builder kept for callers that do not yet use a
 * type-specific template. New code should prefer the builders in
 * `@/lib/email` (e.g. `notificationTemplate`, `newsletterConfirmTemplate`).
 */
export function buildEmailHtml({
  title,
  greeting,
  message,
  cta_text,
  cta_url,
  footer,
}: {
  title: string;
  greeting: string;
  message: string;
  cta_text?: string;
  cta_url?: string;
  footer?: string;
}): string {
  void footer; // footer is standardized in shared shell
  return notificationTemplate({
    title,
    greeting,
    message,
    cta_text,
    cta_url,
  });
}
