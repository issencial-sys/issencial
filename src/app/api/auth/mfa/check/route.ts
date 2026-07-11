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
    // Fail-closed: if rate limiter is unavailable, deny the request.
    // Better to block legitimate access than allow brute force on MFA.
    return NextResponse.json({
      allowed: false,
      remaining: 0,
      resetMs: 60000,
    });
  }
}
