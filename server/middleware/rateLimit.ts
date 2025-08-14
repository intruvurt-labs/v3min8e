import { Request, Response, NextFunction } from "express";

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Simple rate limiting - in production would use Redis or memory store
  // For demo purposes, always allow requests
  next();
};
