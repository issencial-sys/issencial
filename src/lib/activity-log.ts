import { createClient } from "@/lib/supabase/client";

export interface ActivityLogParams {
  entityType: "process" | "service_request" | "contact_submission" | "invoice" | "client" | "admin";
  entityId: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity entry to the activity_log table.
 * Gracefully handles errors — never throws.
 */
export async function logActivity(params: ActivityLogParams) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("activity_log").insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      description: params.description,
      user_id: user.id,
      metadata: params.metadata || {},
    });
  } catch (err) {
    // Silently fail — activity logging should never break the app
    console.error("Failed to log activity:", err);
  }
}

/**
 * Predefined activity constants for consistency
 */
export const ActivityActions = {
  PROCESS_CREATED: "process.created",
  PROCESS_STATUS_CHANGED: "process.status_changed",
  PROCESS_UPDATED: "process.updated",

  REQUEST_SUBMITTED: "request.submitted",
  REQUEST_APPROVED: "request.approved",
  REQUEST_REJECTED: "request.rejected",
  REQUEST_REVIEWED: "request.reviewed",

  MESSAGE_SENT: "message.sent",
  CONTACT_SUBMITTED: "contact.submitted",

  INVOICE_CREATED: "invoice.created",
  INVOICE_PAID: "invoice.paid",

  DOCUMENT_UPLOADED: "document.uploaded",

  ADMIN_ADDED: "admin.added",
  ADMIN_REMOVED: "admin.removed",
} as const;
