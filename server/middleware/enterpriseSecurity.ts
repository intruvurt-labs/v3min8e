// enterprise-security.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet, { HelmetOptions } from "helmet";
import cors, { CorsOptions } from "cors";
import crypto from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";
import { z, ZodSchema } from "zod";

/** Augment Express Request */
declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    sessionID?: string; // set by session middleware if used
    auth?: {
      userId?: string;
      method: "jwt" | "api-key" | "none";
      scopes: string[];
      tokenPreview?: string; // masked
      apiKeyId?: string;
      tier?: string;
    };
  }
}

/* =========================
   Config & Types
========================= */

export const SecurityConfigSchema = z.object({
  jwt: z.object({
    issuer: z.string().optional(),
    audience: z.string().optional(),
    jwksUrl: z.string().url().optional(),
    hs256Secret: z.string().optional(),
    requiredScopes: z.array(z.string()).default([]),
    toleranceSec: z.number().int().min(0).default(60),
  }).default({}),
  encryption: z.object({
    algorithm: z.literal("aes-256-gcm").default("aes-256-gcm"),
    // human-provided secret (utf8/hex/base64); we derive a 32B key via HKDF
    secret: z.string().min(16),
    aad: z.string().default("nimrev-security"),
  }),
  rateLimiting: z.object({
    windowMs: z.number().int().positive().default(15 * 60 * 1000),
    maxRequests: z.number().int().positive().default(100),
    skipSuccessfulRequests: z.boolean().default(false), // safer default
  }),
  cors: z.object({
    origins: z.array(z.string()).default(["http://localhost:3000"]),
    credentials: z.boolean().default(true),
  }),
  auditLogging: z.boolean().default(process.env.NODE_ENV === "production"),
  dataRetention: z.object({
    auditLogsDays: z.number().int().positive().default(365),
    scanResultsDays: z.number().int().positive().default(90),
    userSessionsDays: z.number().int().positive().default(30),
  }),
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

/* =========================
   Helpers
========================= */

const toBuf = (s: string) => Buffer.from(s, "utf8");
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const timingSafeEqual = (a: string, b: string) => {
  const A = Buffer.from(a); const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

// HKDF to derive a 32B key from arbitrary secret
async function hkdf32(secret: string, salt = "nimrev-salt", info = "enc"): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    crypto.hkdf("sha256", toBuf(secret), toBuf(salt), toBuf(info), 32, (err, key) => {
      if (err) reject(err); else resolve(key);
    });
  });
}

async function deriveKey(secret: string): Promise<Buffer> {
  // Accept secrets provided as hex/base64/utf8; HKDF normalizes to 32B.
  return hkdf32(secret);
}

// CORS matcher with wildcard and regex support
function originMatcher(allow: string[]) {
  const regexes = allow
    .filter((x) => x.startsWith("regex:"))
    .map((x) => new RegExp(x.slice(6)));
  const plain = allow.filter((x) => !x.startsWith("regex:"));
  const wildcard = plain.includes("*");
  return (origin?: string | null) => {
    if (!origin) return true; // mobile, curl, server-to-server
    if (wildcard) return true;
    if (plain.includes(origin)) return true;
    return regexes.some((r) => r.test(origin));
  };
}

/* =========================
   Middleware Class
========================= */

export class EnterpriseSecurityMiddleware {
  private cfg: SecurityConfig;
  private supabase: SupabaseClient;
  private encKey!: Buffer;
  private jwksRemote: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(partial: Partial<SecurityConfig> = {}) {
    // Build config from env defaults + overrides
    const merged = SecurityConfigSchema.parse({
      jwt: {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        jwksUrl: process.env.JWT_JWKS_URL,
        hs256Secret: process.env.JWT_HS256_SECRET,
      },
      encryption: {
        secret: process.env.ENCRYPTION_KEY || "default-very-insecure-change-me",
        aad: "nimrev-security",
      },
      cors: {
        origins: process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) || ["http://localhost:3000"],
        credentials: true,
      },
      auditLogging: process.env.NODE_ENV === "production",
      ...partial,
    });
    this.cfg = merged;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      // Don’t throw—allow unit tests; but warn
      console.warn("⚠️ Supabase credentials missing; DB features will no-op.");
    }
    this.supabase = createClient(SUPABASE_URL || "", SUPABASE_KEY || "");

    // derive 32B encryption key
    deriveKey(this.cfg.encryption.secret)
      .then((key) => (this.encKey = key))
      .catch((e) => {
        console.error("Encryption key derivation failed:", e);
        // Fallback to zeroed key to avoid crashes; still secure by design choice?
        this.encKey = crypto.randomBytes(32);
      });

    // pre-init JWKS if provided
    if (this.cfg.jwt.jwksUrl) {
      try {
        this.jwksRemote = createRemoteJWKSet(new URL(this.cfg.jwt.jwksUrl));
      } catch {
        console.warn("⚠️ Invalid JWT_JWKS_URL; falling back to HS256 if configured.");
      }
    }

    console.log("🔒 Enterprise Security Middleware ready");
  }

  /* ------------- Core wrappers ------------- */

  public securityHeaders(): RequestHandler {
    return (req, res, next) => {
      const reqId = crypto.randomUUID();
      req.requestId = reqId;

      // Core headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
      res.setHeader("X-Request-ID", reqId);
      res.setHeader("X-API-Version", "1.0");
      next();
    };
  }

  public helmet(): RequestHandler {
    const opts: HelmetOptions = {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'"].filter(Boolean) as string[],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "ws:", "wss:", "https:"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [] as any, // keep default on in prod
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    };
    return helmet(opts);
  }

  public cors(): RequestHandler {
    const allow = originMatcher(this.cfg.cors.origins);
    const opts: CorsOptions = {
      origin: (origin, cb) => (allow(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
      credentials: this.cfg.cors.credentials,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key"],
      maxAge: 86400,
    };
    return cors(opts);
  }

  /** Global rate limiter (consider app.set('trust proxy', 1) if behind proxy) */
  public rateLimiter(): RequestHandler {
    return rateLimit({
      windowMs: this.cfg.rateLimiting.windowMs,
      max: this.cfg.rateLimiting.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: this.cfg.rateLimiting.skipSuccessfulRequests,
      message: {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(this.cfg.rateLimiting.windowMs / 1000),
      },
      keyGenerator: (req) => (req.headers["x-api-key"] as string) || req.ip,
    });
  }

  /* ------------- Auth ------------- */

  private async verifyJwt(token: string): Promise<JWTPayload> {
    const { audience, issuer, toleranceSec, hs256Secret } = this.cfg.jwt;

    if (this.jwksRemote) {
      const { payload } = await jwtVerify(token, this.jwksRemote, {
        audience: audience ? [audience] : undefined,
        issuer,
        clockTolerance: toleranceSec,
      });
      return payload;
    }
    if (!hs256Secret) throw new Error("JWT not configured");
    const secret = new TextEncoder().encode(hs256Secret);
    const { payload } = await jwtVerify(token, secret, {
      audience: audience ? [audience] : undefined,
      issuer,
      clockTolerance: toleranceSec,
    });
    return payload;
  }

  /** Attach req.auth on success; 401/403 on failure */
  public authenticateJWT(requiredScopes: string[] = []): RequestHandler {
    const globalReq = this.cfg.jwt.requiredScopes;
    return async (req, res, next) => {
      try {
        const hdr = req.headers.authorization;
        const token = hdr?.startsWith("Bearer ") ? hdr.slice(7) : undefined;
        if (!token) return res.status(401).json({ success: false, error: "Authentication token required" });

        const payload = await this.verifyJwt(token);
        const userId = (payload.sub as string) || (payload["user_id"] as string);
        if (!userId) return res.status(401).json({ success: false, error: "Invalid token: missing subject" });

        const scopes: string[] =
          (Array.isArray(payload.scopes) && (payload.scopes as string[])) ||
          (typeof payload.scope === "string" ? (payload.scope as string).split(" ") : []) ||
          (Array.isArray(payload.permissions) ? (payload.permissions as string[]) : []);

        const need = [...globalReq, ...requiredScopes];
        const ok = need.every((s) => scopes.includes(s));
        if (!ok) return res.status(403).json({ success: false, error: "Insufficient scope", required: need, granted: scopes });

        // Verify active user
        if (this.supabase) {
          const { data: user, error } = await this.supabase
            .from("users")
            .select("id, email, is_active, tier")
            .eq("id", userId)
            .single();
          if (error || !user || !user.is_active) return res.status(401).json({ success: false, error: "Invalid or expired token" });
          req.auth = { userId: user.id, method: "jwt", scopes, tokenPreview: token.slice(0, 4) + "…" + token.slice(-4), tier: user.tier };
          await this.updateUserActivity(user.id, req.ip);
        } else {
          req.auth = { userId, method: "jwt", scopes, tokenPreview: token.slice(0, 4) + "…" + token.slice(-4) };
        }

        next();
      } catch (e: any) {
        const msg = e?.message || "Invalid authentication token";
        return res.status(401).json({ success: false, error: msg });
      }
    };
  }

  /** API key auth via SHA-256 hash lookup in users.api_key_hash */
  public authenticateAPIKey(requiredScopes: string[] = []): RequestHandler {
    return async (req, res, next) => {
      try {
        const presented = (req.headers["x-api-key"] as string | undefined)?.trim();
        if (!presented) return res.status(401).json({ success: false, error: "API key required" });

        const hash = sha256(presented);
        const { data: user, error } = await this.supabase
          .from("users")
          .select("id, email, is_active, tier, api_key_hash, api_key_last4, preferences")
          .eq("api_key_hash", hash)
          .single();

        if (error || !user || !user.is_active) {
          await this.logSecurityEvent({
            type: "invalid_api_key",
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
            details: { preview: presented.slice(0, 4) + "…" + presented.slice(-4) },
            severity: "high",
          });
          return res.status(401).json({ success: false, error: "Invalid API key" });
        }

        // (If multiple candidates, use timingSafeEqual across each hash)
        req.auth = {
          userId: user.id,
          apiKeyId: user.api_key_last4 || "key",
          method: "api-key",
          scopes: (user.preferences?.scopes as string[]) || ["scan:read", "scan:write"],
          tokenPreview: `••••${user.api_key_last4 ?? ""}`,
          tier: user.tier,
        };

        next();
      } catch (e) {
        return res.status(401).json({ success: false, error: "Authentication failed" });
      }
    };
  }

  /* ------------- Crypto ------------- */

  public encrypt(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", this.encKey, iv);
    cipher.setAAD(Buffer.from(this.cfg.encryption.aad, "utf8"));
    const enc = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { encrypted: enc.toString("hex"), iv: iv.toString("hex"), tag: tag.toString("hex") };
    }

  public decrypt(payload: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.encKey, Buffer.from(payload.iv, "hex"));
    decipher.setAAD(Buffer.from(this.cfg.encryption.aad, "utf8"));
    decipher.setAuthTag(Buffer.from(payload.tag, "hex"));
    const dec = Buffer.concat([decipher.update(Buffer.from(payload.encrypted, "hex")), decipher.final()]);
    return dec.toString("utf8");
  }

  /* ------------- Validation ------------- */

  public validate<T extends ZodSchema<any>>(schema: T): RequestHandler {
    return (req, res, next) => {
      const body = schema.safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ success: false, error: "Invalid input data", details: body.error.flatten() });
      }
      // Optionally attach parsed body
      req.body = body.data;
      next();
    };
  }

  /* ------------- Audit Log ------------- */

  public auditLogger(): RequestHandler {
    return (req, res, next) => {
      if (!this.cfg.auditLogging || !this.supabase) return next();

      const start = Date.now();
      const reqId = req.requestId || crypto.randomUUID();
      const actor = req.auth?.userId || null;

      res.on("finish", async () => {
        const duration = Date.now() - start;
        try {
          // Map to your audit_log columns (from your schema)
          await this.supabase.from("audit_log").insert({
            user_id: actor,
            actor_type: req.auth?.method === "api-key" ? "api" : "user",
            actor_identifier: req.auth?.apiKeyId || req.auth?.userId || null,
            action: `${req.method} ${req.path}`,
            entity_type: null,
            entity_id: null,
            details: {
              query: req.query,
              status_code: res.statusCode,
              response_time_ms: duration,
              request_id: reqId,
            },
            ip_address: req.ip,
            user_agent: req.get("User-Agent"),
            session_id: req.sessionID ?? null,
            risk_level: res.statusCode >= 500 ? "high" : "low",
            automated_action: false,
          });
        } catch (e) {
          // don’t crash user flow on logging error
          // console.error("Audit insert failed", e);
        }
      });

      next();
    };
  }

  /* ------------- Action rate limit ------------- */

  public actionRateLimit(action: string, windowMs: number, maxRequests: number): RequestHandler {
    return rateLimit({
      windowMs,
      max: maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `${action}:${(req.auth?.userId || req.ip)}`,
      message: { success: false, error: `Rate limit exceeded for ${action}`, retryAfter: Math.ceil(windowMs / 1000) },
    });
  }

  /* ------------- Retention / GDPR ------------- */

  public async cleanupExpiredData(): Promise<void> {
    if (!this.supabase) return;
    const now = new Date();
    const ago = (days: number) => new Date(now.getTime() - days * 86400_000).toISOString();

    try {
      await this.supabase.from("audit_log").delete().lt("created_at", ago(this.cfg.dataRetention.auditLogsDays));
      await this.supabase.from("security_scans").delete().lt("created_at", ago(this.cfg.dataRetention.scanResultsDays));
      await this.supabase.from("user_sessions").delete().lt("created_at", ago(this.cfg.dataRetention.userSessionsDays));
    } catch (e) {
      // log but don’t throw
      // console.error("Cleanup failed", e);
    }
  }

  public async exportUserData(userId: string) {
    if (!this.supabase) throw new Error("Supabase not configured");
    const [user, scans, audit] = await Promise.all([
      this.supabase.from("users").select("*").eq("id", userId).single(),
      this.supabase.from("security_scans").select("*").eq("user_id", userId),
      this.supabase.from("audit_log").select("*").eq("user_id", userId),
    ]);
    return {
      user: user.data,
      scans: scans.data,
      auditLog: audit.data,
      exportedAt: new Date().toISOString(),
    };
  }

  public async deleteUserData(userId: string) {
    if (!this.supabase) throw new Error("Supabase not configured");
    await this.supabase.from("audit_log").delete().eq("user_id", userId);
    await this.supabase.from("security_scans").delete().eq("user_id", userId);
    await this.supabase.from("user_scan_quotas").delete().eq("user_id", userId);
    await this.supabase.from("notifications").delete().eq("user_id", userId);
    await this.supabase.from("users").delete().eq("id", userId);
  }

  /* ------------- Internal utils ------------- */

  private async logSecurityEvent(evt: {
    type: string; ipAddress?: string; userAgent?: string; details?: any; severity?: "low"|"medium"|"high"|"critical";
  }) {
    try {
      await this.supabase.from("security_events").insert({
        type: evt.type,
        ip_address: evt.ipAddress,
        user_agent: evt.userAgent,
        details: evt.details,
        severity: evt.severity ?? "medium",
        timestamp: new Date().toISOString(),
      });
    } catch {}
  }

  private async updateUserActivity(userId: string, ipAddress: string) {
    try {
      await this.supabase.from("users").update({ last_login: new Date().toISOString(), last_ip: ipAddress }).eq("id", userId);
    } catch {}
  }
}

/* ========== Singleton & quick factory ========== */

export const enterpriseSecurity = new EnterpriseSecurityMiddleware();
export default enterpriseSecurity;

/** Mount example (keep order): 
 * 
 * app.set('trust proxy', 1); // if behind proxy/CDN
 * app.use(security.securityHeaders());
 * app.use(security.helmet());
 * app.use(security.cors());
 * app.use(express.json({ limit: '1mb' }));
 * app.use(security.rateLimiter());
 * app.use(security.auditLogger());
 * 
 * // per-route:
 * app.post('/scans', security.authenticateJWT(['scan:write']), handler);
 * app.get('/scans/:id', security.authenticateAPIKey(['scan:read']), handler);
 */
