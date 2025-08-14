import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Simple auth middleware - in production would validate JWT or API key
  const authHeader = req.headers.authorization;
  const apiKey = req.headers["x-api-key"];

  if (!authHeader && !apiKey) {
    return res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }

  // For demo purposes, allow any auth header or API key
  next();
};
