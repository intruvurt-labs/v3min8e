// secure-headers.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "node:crypto";

type OriginRule = string | RegExp;

export interface SecurityOptions {
  /** Production toggles stricter defaults */
  production?: boolean;
  /** Allow dev-friendly inline eval; ignored in prod */
  allowEvalInDev?: boolean;
  /** Additional script/style/img/connect/font/frame sources */
  sources?: Partial<{
    script: (string | RegExp)[];
    style: (string | RegExp)[];
    img: (string | RegExp)[];
    connect: (string | RegExp)[];
    font: (string | RegExp)[];
    frame: (string | RegExp)[];
    worker: (string | RegExp)[];
  }>;
  /** Enable COEP (only if you control third-party resources to send CORP/CORP headers) */
  enableCOEP?: boolean;
  /** Allowed CORS origins (wildcard '*', exact strings, or RegExp) */
  cors?: {
    origins: OriginRule[];
    credentials?: boolean;
    exposeHeaders?: string[];
    allowHeaders?: string[];
    allowMethods?: string[];
    maxAgeSeconds?: number;
  };
  /** Add a report endpoint for CSP (Report-To / report-to header left to infra) */
  cspReportUri?: string;
}

/* ---------------------------
   Helpers
--------------------------- */

const isHttps = (req: Request) =>
  (req.secure === true) ||
  (req.headers["x-forwarded-proto"] === "https");

const matchOrigin = (origin: string, rules: OriginRule[]) =>
  rules.some((r) => (typeof r === "string" ? r === origin || r === "*" : r.test(origin)));

function asSrcList(values: (string | RegExp | "'self'" | "'none'" | "'unsafe-inline'" | "'unsafe-eval'" | "'strict-dynamic'" | `'nonce-...'` )[]) {
  // Only string literals can be serialized, regex must be handled by pre-validation (we won't put regex into CSP)
  return values.filter((v) => typeof v === "string") as string[];
}

/* ---------------------------
   CSP Builder (nonce-aware)
--------------------------- */

function buildCSP(req: Request, opts: SecurityOptions, nonce: string) {
  const prod = !!opts.production;
  const devAllowsEval = !prod && !!opts.allowEvalInDev;

  const baseScript = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'", // trust scripts loaded by a nonce'd script
    ...(devAllowsEval ? ["'unsafe-eval'"] : []),
    // any extra hosts:
    ...asSrcList((opts.sources?.script ?? []) as any),
  ];

  const scriptSrc = [...new Set(baseScript)];

  const styleSrc = [
    "'self'",
    // inline styles are often necessary for frameworks; if you can avoid, drop it in prod:
    "'unsafe-inline'",
    ...asSrcList((opts.sources?.style ?? []) as any),
  ];

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https:",
    ...asSrcList((opts.sources?.img ?? []) as any),
  ];

  const connectSrc = [
    "'self'",
    "https:",
    "wss:",
    "ws:",
    ...asSrcList((opts.sources?.connect ?? []) as any),
  ];

  const fontSrc = [
    "'self'",
    "https:",
    "data:",
    ...asSrcList((opts.sources?.font ?? []) as any),
  ];

  const frameSrc = [
    "'none'",
    ...asSrcList((opts.sources?.frame ?? []) as any),
  ];

  const workerSrc = [
    "'self'",
    "blob:",
    ...asSrcList((opts.sources?.worker ?? []) as any),
  ];

  const directives: string[] = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `img-src ${imgSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    `font-src ${fontSrc.join(" ")}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `worker-src ${workerSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    `manifest-src 'self'`,
  ];

  if (opts.cspReportUri) {
    directives.push(`report-uri ${opts.cspReportUri}`);
  }

  // In prod, you can enable upgrade-insecure-requests if all backends are HTTPS:
  if (prod) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}

/* ---------------------------
   Public Middlewares
--------------------------- */

/** Full security headers (nonce CSP + sane defaults) */
export const enhancedSecurityHeaders =
  (options: SecurityOptions = {}): RequestHandler =>
  (req, res, next) => {
    const prod = !!options.production;
    const nonce = crypto.randomBytes(16).toString("base64");
    (res.locals as any).cspNonce = nonce;

    // Content Security Policy (nonce-based, strict-dynamic)
    const csp = buildCSP(req, options, nonce);
    res.setHeader("Content-Security-Policy", csp);

    // Transport security
    if (prod && isHttps(req)) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    // Cross-origin isolation (enable only if your app is ready)
    if (options.enableCOEP) {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      // Consider: Cross-Origin-Resource-Policy: same-site (more permissive than same-origin for CDNs)
      res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    } else {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    }

    // MIME sniffing & framing
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");

    // Referrer & Permissions Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      [
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
      ].join(", ")
    );

    // Clean up identifying headers
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
    res.removeHeader("Via");

    next();
  };

/** JSON API headers + CORS (with proper Vary and preflight helper) */
export const apiSecurityHeaders =
  (options: SecurityOptions["cors"] = {
    origins: ["https://nimrev.xyz", "https://www.nimrev.xyz", "https://app.nimrev.xyz", /^https?:\/\/localhost:\d+$/],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token", "X-API-Key"],
    exposeHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAgeSeconds: 86400,
  }): RequestHandler =>
  (req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");

    const origin = req.headers.origin as string | undefined;
    if (origin && matchOrigin(origin, options.origins)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      if (options.credentials) res.setHeader("Access-Control-Allow-Credentials", "true");
      // inform caches origin varies
      res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Methods", (options.allowMethods ?? ["GET", "POST"]).join(", "));
    res.setHeader("Access-Control-Allow-Headers", (options.allowHeaders ?? ["Content-Type"]).join(", "));
    if (options.exposeHeaders?.length) {
      res.setHeader("Access-Control-Expose-Headers", options.exposeHeaders.join(", "));
    }
    res.setHeader("Access-Control-Max-Age", String(options.maxAgeSeconds ?? 86400));

    // Preflight short-circuit
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  };

/** Extra-strict uploads (no execution context) */
export const uploadSecurityHeaders = (): RequestHandler => (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  // Absolutely no active content allowed on upload endpoints
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("Cache-Control", "no-store");
  next();
};

/* ---------------------------
   Usage examples
--------------------------- */
/*
import express from "express";
import { enhancedSecurityHeaders, apiSecurityHeaders, uploadSecurityHeaders } from "./secure-headers";

const app = express();
app.set("trust proxy", 1);

// Global security with nonce CSP
app.use(enhancedSecurityHeaders({
  production: process.env.NODE_ENV === "production",
  allowEvalInDev: true,
  enableCOEP: false, // turn on only if your assets set CORP/COEP properly
  sources: {
    script: ["https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
    style: ["https://fonts.googleapis.com"],
    font: ["https://fonts.gstatic.com"],
    img: ["https://cdn.nimrev.xyz"],
    connect: ["https://api.nimrev.xyz", "wss://stream.nimrev.xyz"],
  },
}));

// APIs
app.use("/api", apiSecurityHeaders());

// Upload endpoints
app.post("/api/upload", uploadSecurityHeaders(), uploadHandler);

// Example of using the CSP nonce in a server-rendered page:
// <script nonce="${res.locals.cspNonce}">/* inline bootstrap * /</script>
*/

export default {
  enhancedSecurityHeaders,
  apiSecurityHeaders,
  uploadSecurityHeaders,
};
