/**
 * Issencial — Email templates barrel.
 *
 * Per-type template builders live in their own files under this folder and
 * are re-exported here so callers import from a single place:
 *
 *   import { newsletterConfirmTemplate } from "@/lib/email";
 *
 * Transactional builders map 1:1 to the `email_queue.type` CHECK values;
 * newsletter builders are queued as `notification` until the schema adds a
 * dedicated `newsletter` type.
 *
 * All templates now use the Editorial visual system (accent spine, inverted
 * accent CTA, sharp 2px radius, 24px h2, 15px/1.8 body, accent hairline).
 */

// Shared building blocks (brand tokens, helpers, EMAIL_TEMPLATE_TYPES)
export * from "./shared";

// Transactional templates (Editorial style)
export { notificationTemplate } from "./notification";
export { processUpdateTemplate } from "./process-update";
export { newMessageTemplate } from "./new-message";
export { newInvoiceTemplate } from "./new-invoice";
export { statusChangeTemplate } from "./status-change";

// New transactional templates (Editorial style)
export { contactConfirmationTemplate } from "./contact-confirmation";
export { quoteConfirmationTemplate } from "./quote-confirmation";
export { stageCompletedTemplate } from "./stage-completed";
export { newClientMessageTemplate } from "./new-client-message";
export { paymentReceivedTemplate } from "./payment-received";

// Newsletter templates (Editorial style)
export {
  newsletterConfirmTemplate,
  newsletterEditionTemplate,
  type NewsletterArticle,
} from "./newsletter";
