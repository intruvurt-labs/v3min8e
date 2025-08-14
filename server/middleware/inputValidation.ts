import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { z } from 'zod';

/**
 * Comprehensive Input Validation Middleware
 * Protects against injection attacks and malformed data
 */

// Common validation schemas
export const commonSchemas = {
  // Solana wallet address validation
  solanaAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address'),
  
  // Ethereum address validation
  ethereumAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  
  // Token amount validation
  tokenAmount: z.number().positive().max(1000000000, 'Amount too large'),
  
  // Transaction hash validation
  txHash: z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  
  // Safe text input (prevents XSS)
  safeText: z.string().max(1000).regex(/^[a-zA-Z0-9\s\-_.!?@#$%&*()\[\]{}+=|\\:";'<>,./~`]*$/, 'Contains unsafe characters'),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Project name validation
  projectName: z.string().min(2).max(50).regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid project name'),
  
  // Token symbol validation
  tokenSymbol: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Invalid token symbol')
};

/**
 * Advanced input sanitization
 */
export class InputSanitizer {
  // Remove dangerous SQL patterns
  static sanitizeSQL(input: string): string {
    return input
      .replace(/['"`;\\]/g, '')
      .replace(/(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi, '')
      .replace(/(--|\/\*|\*\/|;)/g, '')
      .replace(/(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi, '');
  }

  // Remove XSS vectors
  static sanitizeXSS(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:text\/html/gi, '');
  }

  // Remove NoSQL injection patterns
  static sanitizeNoSQL(input: any): any {
    if (typeof input === 'string') {
      return input.replace(/[${}]/g, '');
    }
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeNoSQL(item));
    }
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const cleanKey = key.replace(/[${}]/g, '');
        sanitized[cleanKey] = this.sanitizeNoSQL(value);
      }
      return sanitized;
    }
    return input;
  }

  // Comprehensive input cleaning
  static sanitizeInput(input: string): string {
    let cleaned = input;
    cleaned = this.sanitizeSQL(cleaned);
    cleaned = this.sanitizeXSS(cleaned);
    cleaned = validator.escape(cleaned);
    return cleaned.trim();
  }
}

/**
 * Validation middleware factory
 */
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(400).json({ 
        error: 'Invalid input format' 
      });
    }
  };
};

/**
 * General input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = InputSanitizer.sanitizeNoSQL(req.body);
      
      // Sanitize string values
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          req.body[key] = InputSanitizer.sanitizeInput(value);
        }
      }
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = InputSanitizer.sanitizeInput(value);
        }
      }
    }
    
    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = InputSanitizer.sanitizeInput(value);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    return res.status(400).json({ 
      error: 'Input sanitization failed' 
    });
  }
};

/**
 * Crypto-specific validation schemas
 */
export const cryptoSchemas = {
  // Audit request validation
  auditRequest: z.object({
    packageType: z.enum(['basic', 'comprehensive', 'enterprise']),
    description: z.string().min(10).max(2000),
    walletAddress: commonSchemas.solanaAddress,
    files: z.array(z.object({
      name: z.string().max(255),
      size: z.number().max(50 * 1024 * 1024), // 50MB
      type: z.string().regex(/^(text\/|application\/(json|javascript))/),
    })).max(20)
  }),
  
  // Transaction validation
  transaction: z.object({
    hash: commonSchemas.txHash,
    amount: commonSchemas.tokenAmount,
    fromAddress: z.union([commonSchemas.solanaAddress, commonSchemas.ethereumAddress]),
    toAddress: z.union([commonSchemas.solanaAddress, commonSchemas.ethereumAddress])
  }),
  
  // Bot setup validation
  botSetup: z.object({
    projectName: commonSchemas.projectName,
    tokenSymbol: commonSchemas.tokenSymbol.optional(),
    tokenContract: commonSchemas.solanaAddress.optional(),
    premiumAmount: z.number().min(1).max(1000000),
    welcomeMessage: z.string().min(10).max(500)
  })
};

/**
 * File upload validation
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0))) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Handle both single file and multiple files
  const files = [];
  if (req.file) {
    files.push(req.file);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      // Handle object of arrays (field-specific files)
      Object.values(req.files).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          files.push(...fileArray);
        } else {
          files.push(fileArray);
        }
      });
    }
  }

  for (const file of files) {
    // Type checking for Express.Multer.File
    if (!file || typeof file !== 'object' || !('originalname' in file) || !('size' in file)) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    // Additional file validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (typeof file.size === 'number' && file.size > maxSize) {
      return res.status(413).json({ error: 'File too large' });
    }

    // Check filename for dangerous patterns
    const dangerousPatterns = [/\.\./, /[<>:"|?*]/, /^(CON|PRN|AUX|NUL)$/i];
    if (typeof file.originalname === 'string' && dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
      return res.status(400).json({ error: 'Dangerous filename detected' });
    }
  }

  next();
};

export default {
  InputSanitizer,
  validateSchema,
  sanitizeInput,
  validateFileUpload,
  commonSchemas,
  cryptoSchemas
};
