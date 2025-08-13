import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// Enterprise-grade security configuration
export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
  auditLogging: boolean;
  dataRetention: {
    auditLogs: number; // days
    scanResults: number; // days
    userSessions: number; // days
  };
}

const defaultSecurityConfig: SecurityConfig = {
  jwtSecret:
    process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
  encryptionKey:
    process.env.ENCRYPTION_KEY || "default-32-char-encryption-key!!",
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: true,
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  },
  encryption: {
    algorithm: "aes-256-gcm",
    keyLength: 32,
  },
  auditLogging: process.env.NODE_ENV === "production",
  dataRetention: {
    auditLogs: 365, // 1 year
    scanResults: 90, // 3 months
    userSessions: 30, // 1 month
  },
};

export class EnterpriseSecurityMiddleware {
  private config: SecurityConfig;
  private supabase: any;
  private encryptionKey: Buffer;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config };
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );
    this.encryptionKey = Buffer.from(this.config.encryptionKey, "utf8");

    console.log("🔒 Enterprise Security Middleware initialized");
  }

  // Helmet security headers configuration
  public getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for development
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "ws:", "wss:", "https:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false, // Allow for iframe usage
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  // CORS configuration
  public getCorsConfig() {
    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        if (
          this.config.cors.origins.includes(origin) ||
          this.config.cors.origins.includes("*")
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: this.config.cors.credentials,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
      ],
      maxAge: 86400, // 24 hours
    });
  }

  // Rate limiting configuration
  public getRateLimitConfig() {
    return rateLimit({
      windowMs: this.config.rateLimiting.windowMs,
      max: this.config.rateLimiting.maxRequests,
      message: {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(this.config.rateLimiting.windowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: this.config.rateLimiting.skipSuccessfulRequests,
      keyGenerator: (req) => {
        // Use API key if available, otherwise IP
        return (req.headers["x-api-key"] as string) || req.ip;
      },
    });
  }

  // JWT Authentication middleware
  public authenticateJWT = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: "Authentication token required",
        });
      }

      const decoded = jwt.verify(token, this.config.jwtSecret) as any;

      // Verify user still exists and is active
      const { data: user, error } = await this.supabase
        .from("users")
        .select("id, email, is_active, tier, last_login")
        .eq("id", decoded.userId || decoded.sub)
        .single();

      if (error || !user || !user.is_active) {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired token",
        });
      }

      // Update last activity
      await this.updateUserActivity(user.id, req.ip);

      (req as any).user = user;
      next();
    } catch (error) {
      console.error("❌ JWT authentication error:", error);
      return res.status(401).json({
        success: false,
        error: "Invalid authentication token",
      });
    }
  };

  // API Key authentication middleware
  public authenticateAPIKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const apiKey = req.headers["x-api-key"] as string;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: "API key required",
        });
      }

      // Hash the API key for lookup
      const hashedKey = crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");

      const { data: user, error } = await this.supabase
        .from("users")
        .select("id, email, is_active, tier, api_key")
        .eq("api_key", hashedKey)
        .single();

      if (error || !user || !user.is_active) {
        await this.logSecurityEvent({
          type: "invalid_api_key",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          details: { apiKey: apiKey.substring(0, 8) + "..." },
        });

        return res.status(401).json({
          success: false,
          error: "Invalid API key",
        });
      }

      (req as any).user = user;
      next();
    } catch (error) {
      console.error("❌ API key authentication error:", error);
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
      });
    }
  };

  // Data encryption utilities
  public encryptSensitiveData(data: string): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(
      this.config.encryption.algorithm,
      this.encryptionKey,
    );
    cipher.setAAD(Buffer.from("nimrev-security", "utf8"));

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = (cipher as any).getAuthTag().toString("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag,
    };
  }

  public decryptSensitiveData(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const decipher = crypto.createDecipher(
      this.config.encryption.algorithm,
      this.encryptionKey,
    );
    decipher.setAAD(Buffer.from("nimrev-security", "utf8"));
    (decipher as any).setAuthTag(Buffer.from(encryptedData.tag, "hex"));

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  // Input validation and sanitization
  public validateInput = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Basic input sanitization
        this.sanitizeInput(req.body);
        this.sanitizeInput(req.query);
        this.sanitizeInput(req.params);

        // TODO: Implement proper schema validation (e.g., with Joi or Zod)
        next();
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: "Invalid input data",
          details: error.message,
        });
      }
    };
  };

  private sanitizeInput(obj: any): void {
    if (typeof obj !== "object" || obj === null) return;

    for (const key in obj) {
      if (typeof obj[key] === "string") {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .trim();
      } else if (typeof obj[key] === "object") {
        this.sanitizeInput(obj[key]);
      }
    }
  }

  // Security audit logging
  public auditLogger = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!this.config.auditLogging) return next();

    const startTime = Date.now();
    const userId = (req as any).user?.id;

    // Log request
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action: `${req.method} ${req.path}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      requestSize: req.get("Content-Length") || 0,
      path: req.path,
      method: req.method,
      query: JSON.stringify(req.query),
      sessionId: req.sessionID,
    };

    // Continue with request
    res.on("finish", async () => {
      const responseTime = Date.now() - startTime;

      try {
        await this.supabase.from("audit_log").insert({
          ...auditEntry,
          status_code: res.statusCode,
          response_time_ms: responseTime,
          response_size: res.get("Content-Length") || 0,
          success: res.statusCode < 400,
        });
      } catch (error) {
        console.error("❌ Failed to log audit entry:", error);
      }
    });

    next();
  };

  // Security event logging
  private async logSecurityEvent(event: any): Promise<void> {
    try {
      await this.supabase.from("security_events").insert({
        type: event.type,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        details: event.details,
        severity: event.severity || "medium",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Failed to log security event:", error);
    }
  }

  // Update user activity tracking
  private async updateUserActivity(
    userId: string,
    ipAddress: string,
  ): Promise<void> {
    try {
      await this.supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          last_ip: ipAddress,
        })
        .eq("id", userId);
    } catch (error) {
      console.error("❌ Failed to update user activity:", error);
    }
  }

  // Data retention cleanup (run periodically)
  public async cleanupExpiredData(): Promise<void> {
    const now = new Date();

    try {
      // Clean up audit logs
      const auditCutoff = new Date(
        now.getTime() -
          this.config.dataRetention.auditLogs * 24 * 60 * 60 * 1000,
      );
      await this.supabase
        .from("audit_log")
        .delete()
        .lt("created_at", auditCutoff.toISOString());

      // Clean up old scan results
      const scanCutoff = new Date(
        now.getTime() -
          this.config.dataRetention.scanResults * 24 * 60 * 60 * 1000,
      );
      await this.supabase
        .from("security_scans")
        .delete()
        .lt("created_at", scanCutoff.toISOString());

      // Clean up expired sessions
      const sessionCutoff = new Date(
        now.getTime() -
          this.config.dataRetention.userSessions * 24 * 60 * 60 * 1000,
      );
      await this.supabase
        .from("user_sessions")
        .delete()
        .lt("created_at", sessionCutoff.toISOString());

      console.log("🧹 Data retention cleanup completed");
    } catch (error) {
      console.error("❌ Data cleanup failed:", error);
    }
  }

  // Rate limiting for specific actions
  public createActionRateLimit(
    action: string,
    windowMs: number,
    maxRequests: number,
  ) {
    return rateLimit({
      windowMs,
      max: maxRequests,
      keyGenerator: (req) => {
        const userId = (req as any).user?.id || req.ip;
        return `${action}:${userId}`;
      },
      message: {
        success: false,
        error: `Rate limit exceeded for ${action}`,
        retryAfter: Math.ceil(windowMs / 1000),
      },
    });
  }

  // GDPR compliance helpers
  public async exportUserData(userId: string): Promise<any> {
    try {
      const userData = await this.supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      const scanData = await this.supabase
        .from("security_scans")
        .select("*")
        .eq("user_id", userId);

      const auditData = await this.supabase
        .from("audit_log")
        .select("*")
        .eq("user_id", userId);

      return {
        user: userData.data,
        scans: scanData.data,
        auditLog: auditData.data,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Failed to export user data:", error);
      throw error;
    }
  }

  public async deleteUserData(userId: string): Promise<void> {
    try {
      // Delete in proper order due to foreign key constraints
      await this.supabase.from("audit_log").delete().eq("user_id", userId);
      await this.supabase.from("security_scans").delete().eq("user_id", userId);
      await this.supabase
        .from("user_scan_quotas")
        .delete()
        .eq("user_id", userId);
      await this.supabase.from("notifications").delete().eq("user_id", userId);
      await this.supabase.from("users").delete().eq("id", userId);

      console.log(`🗑️ User data deleted for ${userId}`);
    } catch (error) {
      console.error("❌ Failed to delete user data:", error);
      throw error;
    }
  }

  // Security headers middleware
  public securityHeaders = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // Custom security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    );

    // API-specific headers
    res.setHeader("X-API-Version", "1.0");
    res.setHeader("X-Request-ID", crypto.randomUUID());

    next();
  };
}

// Export singleton instance
export const enterpriseSecurity = new EnterpriseSecurityMiddleware();
export default enterpriseSecurity;
