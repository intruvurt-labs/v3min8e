import { Request, Response, NextFunction } from "express";

export const validateScanRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { address, network } = req.body;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: "Address is required",
    });
  }

  if (!network) {
    return res.status(400).json({
      success: false,
      error: "Network is required",
    });
  }

  next();
};
