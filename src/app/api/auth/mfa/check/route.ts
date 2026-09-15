import { NextResponse } from "next/server";
import { mfaRateLimiter, getClientIp } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const limiter = await mfaRateLimiter;
    const ip = getClientIp(request);
    const result = await limiter.check(`mfa:${ip}`);

    return NextResponse.json(result, {
      status: result.allowed ? 200 : 429,
    });
  } catch (err) {
    // Fail-OPEN here: this error means the rate limiter backend itself is
    // unavailable (e.g. paused/evicted Upstash database on Vercel), not that
    // the user exceeded the limit. A fail-closed catch here locked EVERYONE
    // out of MFA with a permanent 60s "Demasiadas tentativas" countdown
    // (seen in prod after the Supabase/Upstash pause). The 60s countdown
    // came from the hardcoded resetMs: 60000 below.
    //
    // Real brute-force protection is unaffected: Supabase Auth still
    // rate-limits mfa.verify() server-side, and genuine rate-limit denials
    // from the limiter itself still return 429 above (fail-closed).
    console.error(
      "[mfa/check] Rate limiter unavailable, failing open:",
      err instanceof Error ? err.message : err,
    );

    return NextResponse.json({
      allowed: true,
      remaining: 5,
      resetMs: 60000,
      degraded: true,
    });
  }
}
