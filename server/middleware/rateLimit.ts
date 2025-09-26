// rate-limit.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import Redis from "ioredis";

/**
 * Sliding-window limiter with optional token-bucket burst capacity.
 * - windowMs: time window
 * - max: max requests per window
 * - burst: extra tokens allowed instantly (token bucket)
 * - prefix: redis key prefix
 */
export type RateLimitOptions = {
  windowMs: number;           // e.g. 60_000
  max: number;                // e.g. 120
  burst?: number;             // optional burst headroom (token bucket)
  prefix?: string;            // redis key prefix
  headerPrefix?: string;      // customize headers prefix (default X-RateLimit-*)
  skipSuccessful?: boolean;   // if true, only count 4xx/5xx (usually false)
  keyGenerator?: (req: Request) => string; // derive identity
};

export class RateLimiter {
  private redis?: Redis;
  private fallbackMap = new Map<string, { ts: number[]; tokens: number; refillAt: number }>();
  private opts: Required<Omit<RateLimitOptions, "burst" | "keyGenerator" | "headerPrefix" | "skipSuccessful">> &
    Pick<RateLimitOptions, "burst" | "keyGenerator" | "headerPrefix" | "skipSuccessful">;

  constructor(
    options: RateLimitOptions,
    redis?: Redis
  ) {
    const {
      windowMs,
      max,
      burst,
      prefix = "rl",
      headerPrefix = "X-RateLimit",
      skipSuccessful = false,
      keyGenerator,
    } = options;

    this.opts = {
      windowMs,
      max,
      burst,
      prefix,
      headerPrefix,
      skipSuccessful,
      keyGenerator,
    };
    this.redis = redis;
  }

  /**
   * Express middleware creator
   */
  middleware(): RequestHandler {
    return async (req, res, next) => {
      const key = this.buildKey(req);
      const now = Date.now();

      // Optionally skip counting if request later succeeds
      let counted = false;
      const countThisRequest = () => {
        if (!this.opts.skipSuccessful || counted) return;
        // decrement for success if we skipped counting failures only mode
        // For simplicity, we'll COUNT immediately and optionally "refund" on success=false.
        // To truly skip successful, you'd hook on res 'finish' and only increment on >=400.
      };

      try {
        const { total, remaining, resetMs, limited } =
          this.redis
            ? await this.consumeRedis(key, now)
            : this.consumeMemory(key, now);

        // Set standard headers
        const HP = this.opts.headerPrefix || "X-RateLimit";
        res.setHeader(`${HP}-Limit`, String(this.opts.max + (this.opts.burst ?? 0)));
        res.setHeader(`${HP}-Remaining`, String(Math.max(remaining, 0)));
        res.setHeader(`${HP}-Reset`, String(Math.ceil((now + resetMs) / 1000))); // epoch seconds
        if (limited) {
          const retryAfter = Math.ceil(resetMs / 1000);
          res.setHeader("Retry-After", String(retryAfter));
          return res.status(429).json({
            success: false,
            error: "Too many requests",
            retryAfter,
          });
        }

        // Optional: refund if success and skipSuccessful=true
        if (this.opts.skipSuccessful) {
          counted = true;
          res.on("finish", async () => {
            if (res.statusCode < 400) {
              // refund one unit
              try {
                this.redis
                  ? await this.refundRedis(key)
                  : this.refundMemory(key);
              } catch {}
            }
          });
        }

        next();
      } catch (err) {
        // On limiter error, fail open
        next();
      }
    };
  }

  /* ---------------------------
     Keying strategy
  --------------------------- */
  private buildKey(req: Request) {
    const custom = this.opts.keyGenerator?.(req);
    if (custom) return `${this.opts.prefix}:${custom}`;

    const apiKey = (req.headers["x-api-key"] as string) || "";
    const auth = (req.headers.authorization as string) || "";
    const uid = (req as any).auth?.userId || "";
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";

    // Prefer strong identity first
    const id = uid || apiKey || auth || ip;
    return `${this.opts.prefix}:${id}`;
  }

  /* ---------------------------
     Redis (cluster-safe)
  --------------------------- */
  private async consumeRedis(key: string, now: number) {
    const { windowMs, max, burst = 0 } = this.opts;
    const ttlMs = windowMs;
    const bucketKey = `${key}:bucket`;
    const windowKey = `${key}:win:${Math.floor(now / windowMs)}`;

    // 1) Sliding window count across current + previous windows for smoothness
    // Strategy: maintain counts per windowKey; compute proportion of previous
    const prevKey = `${key}:win:${Math.floor((now - windowMs) / windowMs)}`;
    const [curCount, prevCount] = await this.redis!.mget(windowKey, prevKey);
    const cur = Number(curCount || 0);
    const prev = Number(prevCount || 0);
    const overlap = (now % windowMs) / windowMs; // 0..1
    const effective = cur + prev * (1 - overlap);

    // 2) Token bucket for burst (optional)
    let tokens = 0;
    if (burst > 0) {
      tokens = Number((await this.redis!.get(bucketKey)) || burst);
    }

    let limited = false;
    if (effective >= max) {
      // use a burst token if any left
      if (burst > 0 && tokens > 0) {
        await this.redis!.decr(bucketKey);
      } else {
        limited = true;
      }
    } else {
      // increment current window
      await this.redis!.multi()
        .incrby(windowKey, 1)
        .pexpire(windowKey, ttlMs + 1000) // keep a bit longer
        .exec();
      // initialize bucket TTL lazily
      if (burst > 0 && tokens === burst) {
        await this.redis!.pexpire(bucketKey, ttlMs);
      }
    }

    const total = Math.min(max + burst, Math.ceil(effective) + (burst > 0 ? tokens : 0));
    const remaining = Math.max(0, max + burst - Math.ceil(effective) - (burst > 0 ? (burst - tokens) : 0));
    const resetMs = windowMs - (now % windowMs);

    return { total, remaining, resetMs, limited };
  }

  private async refundRedis(key: string) {
    const windowKey = `${key}:win:${Math.floor(Date.now() / this.opts.windowMs)}`;
    // Decrement only if > 0
    const cur = Number((await this.redis!.get(windowKey)) || 0);
    if (cur > 0) await this.redis!.decr(windowKey);
  }

  /* ---------------------------
     In-memory fallback (dev)
  --------------------------- */
  private consumeMemory(key: string, now: number) {
    const { windowMs, max, burst = 0 } = this.opts;
    let state = this.fallbackMap.get(key);
    if (!state) {
      state = { ts: [], tokens: burst, refillAt: now + windowMs };
      this.fallbackMap.set(key, state);
    }

    // Refill tokens
    if (burst > 0 && now >= state.refillAt) {
      state.tokens = burst;
      state.refillAt = now + windowMs;
    }

    // purge timestamps outside window
    state.ts = state.ts.filter((t) => t > now - windowMs);

    let limited = false;
    if (state.ts.length >= max) {
      if (burst > 0 && state.tokens > 0) state.tokens -= 1;
      else limited = true;
    } else {
      state.ts.push(now);
    }

    const effective = state.ts.length;
    const total = Math.min(max + burst, effective + state.tokens);
    const remaining = Math.max(0, max + burst - effective - (burst - state.tokens));
    const resetMs = windowMs - (now - (state.ts[0] ?? now));

    return { total, remaining, resetMs, limited };
  }

  private refundMemory(key: string) {
    const s = this.fallbackMap.get(key);
    if (!s) return;
    // remove one most recent hit if any
    s.ts.pop();
  }
}

/* =========================
   Quick presets + usage
========================= */

export function makeGlobalLimiter(redis?: Redis) {
  return new RateLimiter(
    {
      windowMs: 60_000, // 1 minute
      max: 120,         // 120 req/min
      burst: 30,        // allow short bursts
      prefix: "rl:g",
      headerPrefix: "X-RateLimit",
      skipSuccessful: false,
      keyGenerator: (req) =>
        (req as any).auth?.userId ||
        (req.headers["x-api-key"] as string) ||
        req.ip,
    },
    redis
  ).middleware();
}

export function makeScanLimiter(redis?: Redis) {
  return new RateLimiter(
    {
      windowMs: 60_000,
      max: 30,         // stricter for expensive endpoints
      burst: 10,
      prefix: "rl:scan",
    },
    redis
  ).middleware();
}
