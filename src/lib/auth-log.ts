/**
 * Log auth events server-side for audit trail.
 * Fire-and-forget — never throws, never blocks auth flow.
 */
export async function logAuthEvent(
  email: string,
  event: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await fetch("/api/auth/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, event, metadata }),
    });
  } catch {
    // Silently fail — logging never blocks auth
  }
}
