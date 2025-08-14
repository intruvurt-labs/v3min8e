import { Request, Response, NextFunction } from "express";

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  // Simple audit logging - in production would send to proper logging service
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};
