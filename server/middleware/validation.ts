// validation.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import sanitizeHtml from "sanitize-html"; // npm i sanitize-html
import { utils as ethersUtils } from "ethers"; // npm i ethers
import { PublicKey } from "@solana/web3.js"; // npm i @solana/web3.js

/* ---------------------------
   Helpers
--------------------------- */
const trim = (s: unknown) => (typeof s === "string" ? s.trim() : s);

const safeNumber = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "string" ? Number(v) : v))
  .refine((n) => Number.isFinite(n), "Not a finite number");

const strict = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

const sanitizeRichText = (s: string) =>
  sanitizeHtml(s, {
    allowedTags: ["b", "i", "em", "strong", "a", "code", "pre", "ul", "ol", "li", "p", "br"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });

/* ---------------------------
   Address / Hash validators
--------------------------- */
// Ethereum checksum (normalizes to checksum on success)
export const ethereumAddress = z
  .string()
  .transform(trim)
  .refine((addr) => {
    try {
      ethersUtils.getAddress(addr);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Ethereum address")
  .transform((addr) => ethersUtils.getAddress(addr)); // normalized

// Solana base58 pubkey
export const solanaAddress = z
  .string()
  .transform(trim)
  .refine((addr) => {
    try {
      // throws if not a valid base58 32-byte public key
      new PublicKey(addr);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Solana address");

// EVM tx hash: 0x + 64 hex
export const evmTxHash = z
  .string()
  .transform(trim)
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

/* ---------------------------
   Common fields
--------------------------- */
export const commonSchemas = {
  solanaAddress,
  ethereumAddress,
  tokenAmount: safeNumber.positive().max(1_000_000_000, "Amount too large"),
  txHash: evmTxHash,
  // Safer "display text": allow unicode letters/numbers and common punctuation; sanitize when rendering
  safeText: z
    .string()
    .transform(trim)
    .max(1000)
    .regex(/^[\p{L}\p{N}\p{Zs}\-_.!?@#$%&*()[\]{}+=|\\:;"'<>,./~`]+$/u, "Contains unsafe characters"),
  email: z.string().transform(trim).email("Invalid email"),
  url: z.string().transform(trim).url("Invalid URL"),
  projectName: z.string().transform(trim).min(2).max(50).regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid project name"),
  tokenSymbol: z.string().transform(trim).min(1).max(10).regex(/^[A-Z0-9]+$/, "Invalid token symbol"),
};

/* ---------------------------
   Domain schemas (strict)
--------------------------- */
export const cryptoSchemas = {
  auditRequest: strict({
    packageType: z.enum(["basic", "comprehensive", "enterprise"]),
    description: z
      .string()
      .transform(trim)
      .min(10)
      .max(2000)
      // sanitize *display* copy, keep both raw+clean
      .transform((s) => ({ raw: s, clean: sanitizeRichText(s) })),
    walletAddress: solanaAddress,
    files: z
      .array(
        strict({
          name: z.string().max(255),
          size: safeNumber.max(50 * 1024 * 1024), // 50MB
          // simple allow-list for text-ish uploads
          type: z.string().regex(/^(text\/|application\/(json|javascript|octet-stream))/, "Unsupported MIME"),
        }),
      )
      .max(20),
  }),

  transaction: strict({
    hash: evmTxHash,
    amount: commonSchemas.tokenAmount,
    fromAddress: z.union([solanaAddress, ethereumAddress]),
    toAddress: z.union([solanaAddress, ethereumAddress]),
  }),

  botSetup: strict({
    projectName: commonSchemas.projectName,
    tokenSymbol: commonSchemas.tokenSymbol.optional(),
    tokenContract: solanaAddress.optional(),
    premiumAmount: safeNumber.min(1).max(1_000_000),
    welcomeMessage: z.string().transform(trim).min(10).max(500),
  }),
};

/* ---------------------------
   Middleware
--------------------------- */
export const validateSchema =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        field: e.path.join(".") || "(root)",
        message: e.message,
        code: e.code,
      }));
      return res.status(400).json({ error: "Validation failed", details });
    }
    req.body = parsed.data;
    next();
  };

/**
 * Targeted sanitization (optional)
 * Only touch fields known to be rendered as HTML.
 * Do NOT mutate IDs/addresses/tx hashes here.
 */
export const sanitizeRenderable =
  (fields: string[] = ["description", "content", "html"]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      for (const f of fields) {
        const val = (req.body as any)?.[f];
        if (typeof val === "string") {
          (req.body as any)[f] = sanitizeRichText(val);
        } else if (val && typeof val === "object" && "raw" in val && "clean" in val) {
          (req.body as any)[f] = { raw: val.raw, clean: sanitizeRichText(String(val.raw)) };
        }
      }
      next();
    } catch (e) {
      return next(e);
    }
  };

/**
 * File upload guard (works with Multer)
 * - validates presence, size
 * - basic name checks
 * - optional MIME allow-list (pass allowedMimes to tighten)
 */
export const validateFileUpload =
  (allowedMimes: RegExp = /^(text\/|application\/(json|javascript|octet-stream))/) =>
  (req: Request, res: Response, next: NextFunction) => {
    const files: any[] = [];
    if (req.file) files.push(req.file);
    if (req.files) {
      if (Array.isArray(req.files)) files.push(...req.files);
      else Object.values(req.files as any).forEach((v: any) => (Array.isArray(v) ? files.push(...v) : files.push(v)));
    }
    if (!files.length) return res.status(400).json({ error: "No files uploaded" });

    for (const f of files) {
      if (!f || typeof f !== "object" || !("originalname" in f) || !("size" in f))
        return res.status(400).json({ error: "Invalid file format" });

      if (typeof f.size === "number" && f.size > 50 * 1024 * 1024)
        return res.status(413).json({ error: "File too large" });

      if (!allowedMimes.test(String(f.mimetype || "")))
        return res.status(415).json({ error: "Unsupported media type" });

      const bad = [/\.\./, /[<>:"|?*]/, /^(con|prn|aux|nul)$/i];
      if (bad.some((re) => re.test(String(f.originalname))))
        return res.status(400).json({ error: "Dangerous filename detected" });
    }
    next();
  };

/* ---------------------------
   Quick usage examples
--------------------------- */
// app.post("/tx", validateSchema(cryptoSchemas.transaction), handler);
// app.post("/audit", validateSchema(cryptoSchemas.auditRequest), sanitizeRenderable(["description"]), handler);
