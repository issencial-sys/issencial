/**
 * Client-side helper to queue an email notification.
 * Calls the /api/email/queue API route which uses the server client.
 * Safe to call from "use client" components.
 */
export async function notify(input: {
  to_email: string;
  to_name?: string;
  subject: string;
  html_body: string;
  type: string;
  reference_id?: string;
  reference_type?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/email/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch {
    return { success: false, error: "Erro de conexão." };
  }
}
