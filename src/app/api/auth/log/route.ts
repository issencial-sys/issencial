import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { authRateLimiter, getClientIp } from "@/lib/rate-limiter";

const authLogSchema = z.object({
  email: z.string().email().max(255),
  event: z.enum([
    "login_success",
    "login_failed",
    "signup_success",
    "signup_failed",
    "logout",
    "session_refresh",
  ]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  try {
    // Rate limiting to prevent log flooding
    const limiter = await authRateLimiter;
    const rateCheck = await limiter.check(getClientIp(request));
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: true });
    }

    const body = await authLogSchema.parseAsync(await request.json());

    const supabase = createAdminClient();

    const { error } = await supabase.from("auth_logs").insert({
      email: body.email,
      event: body.event,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      user_agent: request.headers.get("user-agent") || "",
      metadata: body.metadata,
    });

    if (error) {
      console.error("Erro ao registar log de autenticação:", error);
      // Logging should never break the auth flow — return 200 anyway
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch {
    // Silently fail — auth logging is non-critical
    return NextResponse.json({ success: true });
  }
}
