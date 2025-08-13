import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Comprehensive Security Headers Middleware
 * Implements OWASP security header recommendations
 */
export const enhancedSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Generate nonce for inline scripts (if needed)
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;

  // Content Security Policy with strict settings
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: ws:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "child-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "manifest-src 'self'",
  ].join("; ");

  // Set comprehensive security headers
  const securityHeaders = {
    // Content Security Policy
    "Content-Security-Policy": cspDirectives,

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // XSS Protection (legacy but still useful)
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy (formerly Feature Policy)
    "Permissions-Policy": [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=()",
      "usb=()",
      "accelerometer=()",
      "gyroscope=()",
      "magnetometer=()",
      "fullscreen=(self)",
      "autoplay=(self)",
    ].join(", "),

    // HTTP Strict Transport Security
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Cross-Origin Policies
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin",

    // Prevent DNS prefetching
    "X-DNS-Prefetch-Control": "off",

    // Cache Control for sensitive endpoints
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",

    // Remove server identification
    Server: undefined,
  };

  // Apply headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    if (value !== undefined) {
      res.setHeader(header, value);
    } else {
      res.removeHeader(header);
    }
  });

  // Remove potentially revealing headers
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
  res.removeHeader("Via");

  next();
};

/**
 * Secure headers for API endpoints
 */
export const apiSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // JSON API specific headers
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store");

  // CORS headers for API - secure hardcoded origins
  const allowedOrigins = [
    "https://nimrev.xyz",
    "https://www.nimrev.xyz",
    "https://app.nimrev.xyz",
    "http://localhost:3000", // Development only
    "http://localhost:5173", // Vite dev server
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV === "development") {
    // Allow localhost origins in development
    if (origin && /^https?:\/\/localhost:\d+$/.test(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  next();
};

/**
 * Security headers for file uploads
 */
export const uploadSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Strict headers for file upload endpoints
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("Cache-Control", "no-store");

  next();
};

export default {
  enhancedSecurityHeaders,
  apiSecurityHeaders,
  uploadSecurityHeaders,
};
