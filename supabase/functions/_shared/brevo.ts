/**
 * Brevo (formerly Sendinblue) transactional email helper.
 *
 * Uses the Brevo REST API to send transactional emails.
 * API docs: https://developers.brevo.com/reference/send-transac-email
 *
 * Environment variables required:
 *   BREVO_API_KEY      — Brevo API v3 key
 *   BREVO_SENDER_EMAIL — verified sender email address
 *   BREVO_SENDER_NAME  — sender display name (default: "Issencial")
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export function getBrevoConfig(): { apiKey: string; senderEmail: string; senderName: string } {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || "Issencial";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY environment variable is not set.");
  }
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL environment variable is not set.");
  }

  return { apiKey, senderEmail, senderName };
}

export interface BrevoSendParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
  replyTo?: { email: string; name?: string };
  scheduledAt?: string;
}

export interface BrevoSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a transactional email via Brevo API.
 *
 * @param params - Email parameters
 * @returns Result with messageId on success, or error details on failure
 */
export async function sendTransactionalEmail(params: BrevoSendParams): Promise<BrevoSendResult> {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();

  const body: Record<string, unknown> = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: params.to.map((r) => ({
      email: r.email,
      name: r.name || r.email.split("@")[0],
    })),
    subject: params.subject,
    htmlContent: params.htmlContent,
    tags: params.tags ?? ["issencial", "transactional"],
  };

  if (params.textContent) {
    body.textContent = params.textContent;
  }

  if (params.replyTo) {
    body.replyTo = params.replyTo;
  }

  if (params.scheduledAt) {
    body.scheduledAt = params.scheduledAt;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageId: data.messageId || "",
      };
    }

    console.error("Brevo API error:", response.status, JSON.stringify(data));
    return {
      success: false,
      error: data.message || data.code || `HTTP ${response.status}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Brevo request failed:", message);
    return {
      success: false,
      error: message,
    };
  }
}
