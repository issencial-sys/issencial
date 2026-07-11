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
  } catch {
    // If rate limiter fails, allow the request (fail open)
    return NextResponse.json({
      allowed: true,
      remaining: 1,
      resetMs: 60000,
    });
  }
}
