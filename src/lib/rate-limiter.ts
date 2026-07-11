/**
 * Rate Limiter — suporta Upstash Ratelimit (Vercel KV) com fallback in-memory.
 *
 * Em produção (Vercel + KV):
 *   - Usa @upstash/ratelimit com sliding window distribuída
 *   - Funciona across múltiplas instâncias
 *
 * Em desenvolvimento / sem KV:
 *   - Fallback para sliding window in-memory (instância única)
 *
 * Interface unificada: `check(ip) => Promise<{ allowed, remaining, resetMs }>`
 */

import type { Ratelimit } from "@upstash/ratelimit";

interface RateLimiterConfig {
  /** Máximo de requests permitidos na janela */
  maxRequests: number;
  /** Duração da janela em segundos (ex: 60 = 1 minuto) */
  windowSeconds: number;
}

interface RateLimiterResult {
  allowed: boolean;
  remaining: number;
  resetMs: number; // ms até ao reset
}

// ─── In-Memory implementation ──────────────

function createInMemoryLimiter({ maxRequests, windowSeconds }: RateLimiterConfig) {
  const hits = new Map<string, number[]>();
  const windowMs = windowSeconds * 1000;
  const CLEANUP_INTERVAL = 60_000;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    const cutoff = now - windowMs;
    for (const [ip, timestamps] of hits) {
      const valid = timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) hits.delete(ip);
      else hits.set(ip, valid);
    }
  }

  return {
    async check(ip: string): Promise<RateLimiterResult> {
      cleanup();
      const now = Date.now();
      const cutoff = now - windowMs;

      const timestamps = (hits.get(ip) || []).filter((t) => t > cutoff);

      if (timestamps.length >= maxRequests) {
        const oldest = timestamps[0] ?? now;
        return {
          allowed: false,
          remaining: 0,
          resetMs: Math.max(oldest + windowMs - now, 1000),
        };
      }

      timestamps.push(now);
      hits.set(ip, timestamps);

      return {
        allowed: true,
        remaining: maxRequests - timestamps.length,
        resetMs: windowMs,
      };
    },
  };
}

// ─── Upstash Ratelimit implementation ──────

async function createUpstashLimiter({ maxRequests, windowSeconds }: RateLimiterConfig) {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  // Suporta tanto env vars da Upstash (UPSTASH_REDIS_*) como da Vercel KV (KV_REST_API_*)
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!;

  const redis = new Redis({ url: redisUrl, token: redisToken });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
    // analytics: true, // Opcional — requer plano Pro no Upstash
    prefix: "issencial:ratelimit",
  });

  return {
    async check(ip: string): Promise<RateLimiterResult> {
      const { success, remaining, reset } = await ratelimit.limit(ip);
      return {
        allowed: success,
        remaining,
        resetMs: Math.max(reset - Date.now(), 1000),
      };
    },
  };
}

// ─── Factory ───────────────────────────────

function hasUpstashEnv(): boolean {
  return !!(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  );
}

export async function createRateLimiter(config: RateLimiterConfig) {
  if (hasUpstashEnv()) {
    return createUpstashLimiter(config);
  }
  return createInMemoryLimiter(config);
}

/**
 * Extrai IP real do request, respeitando proxies (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// ─── Predefinições ─────────────────────────
// NOTA: Como o rate limiter é agora async, as API routes usam:
//   const limiter = await formRateLimiter;
//   const result = await limiter.check(ip);

export const formRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowSeconds: 60,
});

export const authRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowSeconds: 60,
});

export const mfaRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowSeconds: 60,
});
