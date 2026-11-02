import { db } from "~/server/db";

/**
 * The actions that cost money or database work and therefore need a per-user limit. These are
 * frequency limits, not conversation limits: a chat can be as long as the user wants, it just
 * cannot be used as a free, unbounded backend.
 */
export type RateLimitAction = "chat" | "image" | "transcribe";

interface RateLimitRule {
  /** Length of the window in milliseconds. */
  windowMs: number;
  /** Requests allowed inside one window. */
  max: number;
}

const RULES: Record<RateLimitAction, RateLimitRule[]> = {
  chat: [
    { windowMs: 5 * 60 * 1000, max: 30 },
    { windowMs: 24 * 60 * 60 * 1000, max: 300 },
  ],
  image: [{ windowMs: 24 * 60 * 60 * 1000, max: 20 }],
  transcribe: [{ windowMs: 24 * 60 * 60 * 1000, max: 60 }],
};

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the exhausted window resets. Zero when the request is allowed. */
  retryAfterSeconds: number;
}

/**
 * Counts one request against every rule for the action. The first exhausted rule wins.
 *
 * The counter lives in Postgres rather than in memory because serverless instances do not share
 * memory. If the counter itself fails, the request is allowed: the limiter must never be the
 * reason a legitimate user cannot chat, and the same database is needed for the rest of the
 * request anyway.
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  const now = Date.now();

  try {
    for (const rule of RULES[action]) {
      const windowStart = new Date(
        Math.floor(now / rule.windowMs) * rule.windowMs,
      );

      const record = await db.rateLimit.upsert({
        where: {
          userId_action_windowStart: { userId, action, windowStart },
        },
        create: { userId, action, windowStart, count: 1 },
        update: { count: { increment: 1 } },
      });

      if (record.count > rule.max) {
        const resetAt = windowStart.getTime() + rule.windowMs;

        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
        };
      }
    }

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    console.error("Rate limit check failed", error);

    return { allowed: true, retryAfterSeconds: 0 };
  }
}
