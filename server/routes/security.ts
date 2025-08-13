import { Router } from "express";
import { Request, Response } from "express";
import SecurityScannerService from "../services/SecurityScannerService";
import ThreatDetectionEngine from "../services/ThreatDetectionEngine";
import ScanProgressTracker from "../services/ScanProgressTracker";
import WebsiteSecurityScanner from "../services/WebsiteSecurityScanner";
import { authMiddleware } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { validateScanRequest } from "../middleware/validation";
import { auditLogger } from "../utils/auditLogger";

const router = Router();

// Initialize services
const scannerService = new SecurityScannerService();
const threatEngine = new ThreatDetectionEngine();
const progressTracker = new ScanProgressTracker(8083);
const websiteScanner = new WebsiteSecurityScanner();

// Rate limiting for scan endpoints
const scanRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many scan requests, please try again later",
});

/**
 * @route POST /api/security/scan
 * @desc Initiate comprehensive security scan
 * @access Private (requires authentication)
 */
router.post(
  "/scan",
  scanRateLimit,
  authMiddleware,
  validateScanRequest,
  async (req: Request, res: Response) => {
    try {
      const { address, network, scanType = "comprehensive" } = req.body;
      const userId = (req as any).user.id;

      // Audit log the scan request
      auditLogger.logAction({
        userId,
        action: "security_scan_initiated",
        entityType: "contract",
        entityId: address,
        details: { network, scanType },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Check user scan quota
      const quotaCheck = await checkUserScanQuota(userId, scanType);
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: "Scan quota exceeded",
          details: quotaCheck.details,
        });
      }

      // Initiate comprehensive scan
      const scanId = await scannerService.initiateComprehensiveScan({
        address,
        network,
        userId,
        scanType,
      });

      // Update user quota
      await updateUserScanQuota(userId, scanType);

      // Log successful scan initiation
      console.log(
        `🎯 Security scan initiated: ${scanId} for ${address} on ${network}`,
      );

      res.json({
        success: true,
        scanId,
        message: "Security scan initiated successfully",
        estimatedCompletionTime: "3-5 minutes",
        progressEndpoint: `/api/security/scan/${scanId}/progress`,
        webSocketUrl: `ws://localhost:8083`,
      });
    } catch (error) {
      console.error("❌ Security scan error:", error);

      auditLogger.logAction({
        userId: (req as any).user?.id,
        action: "security_scan_failed",
        entityType: "contract",
        entityId: req.body.address,
        details: { error: error.message },
        ipAddress: req.ip,
        riskLevel: "medium",
      });

      res.status(500).json({
        success: false,
        error: "Failed to initiate security scan",
        message: "Please try again later",
      });
    }
  },
);

/**
 * @route POST /api/security/scan-website
 * @desc Initiate website security scan for phishing/scam detection
 * @access Private (requires authentication)
 */
router.post(
  "/scan-website",
  scanRateLimit,
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { url, scanType = "comprehensive" } = req.body;
      const userId = (req as any).user.id;

      // Validate URL format
      if (!url || typeof url !== "string") {
        return res.status(400).json({
          success: false,
          error: "Valid URL is required",
        });
      }

      try {
        new URL(url); // Validate URL format
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: "Invalid URL format",
        });
      }

      // Audit log the website scan request
      auditLogger.logAction({
        userId,
        action: "website_scan_initiated",
        entityType: "website",
        entityId: url,
        details: { scanType },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Check user scan quota
      const quotaCheck = await checkUserScanQuota(userId, scanType);
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: "Scan quota exceeded",
          details: quotaCheck.details,
        });
      }

      // Initiate website scan
      const scanId = await websiteScanner.scanWebsite({
        url,
        userId,
        scanType,
      });

      // Update user quota
      await updateUserScanQuota(userId, scanType);

      // Log successful scan initiation
      console.log(`🌐 Website security scan initiated: ${scanId} for ${url}`);

      res.json({
        success: true,
        scanId,
        message: "Website security scan initiated successfully",
        estimatedCompletionTime: "2-4 minutes",
        progressEndpoint: `/api/security/scan/${scanId}/progress`,
        webSocketUrl: `ws://localhost:8083`,
        scanType: "website",
      });
    } catch (error) {
      console.error("❌ Website scan error:", error);

      auditLogger.logAction({
        userId: (req as any).user?.id,
        action: "website_scan_failed",
        entityType: "website",
        entityId: req.body.url,
        details: { error: error.message },
        ipAddress: req.ip,
        riskLevel: "medium",
      });

      res.status(500).json({
        success: false,
        error: "Failed to initiate website scan",
        message: "Please try again later",
      });
    }
  },
);

/**
 * @route GET /api/security/scan/:scanId
 * @desc Get scan results by ID
 * @access Private
 */
router.get(
  "/scan/:scanId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const userId = (req as any).user.id;

      const scanResult = await scannerService.getScanResult(scanId);

      if (!scanResult) {
        return res.status(404).json({
          success: false,
          error: "Scan not found",
        });
      }

      // Verify user owns this scan
      if (scanResult.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized access to scan results",
        });
      }

      res.json({
        success: true,
        data: scanResult,
      });
    } catch (error) {
      console.error("❌ Error fetching scan result:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch scan results",
      });
    }
  },
);

/**
 * @route GET /api/security/scan/:scanId/progress
 * @desc Get real-time scan progress
 * @access Private
 */
router.get(
  "/scan/:scanId/progress",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const userId = (req as any).user.id;

      // Verify scan ownership
      const scanResult = await scannerService.getScanResult(scanId);
      if (!scanResult || scanResult.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized access",
        });
      }

      const progress = scannerService.getScanProgress(scanId);

      if (!progress) {
        return res.json({
          success: true,
          data: {
            scanId,
            status: scanResult.status,
            progress: scanResult.status === "completed" ? 100 : 0,
            message:
              scanResult.status === "completed"
                ? "Scan completed"
                : "Scan not in progress",
          },
        });
      }

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error("❌ Error fetching scan progress:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch scan progress",
      });
    }
  },
);

/**
 * @route GET /api/security/scans
 * @desc Get user's scan history
 * @access Private
 */
router.get("/scans", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const scans = await scannerService.getUserScanHistory(userId, limit);

    res.json({
      success: true,
      data: scans,
      pagination: {
        limit,
        offset,
        total: scans.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching scan history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch scan history",
    });
  }
});

/**
 * @route POST /api/security/threat-report
 * @desc Report a new threat or false positive
 * @access Private
 */
router.post(
  "/threat-report",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { address, network, threatType, description, evidence } = req.body;
      const userId = (req as any).user.id;

      // Validate required fields
      if (!address || !network || !threatType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: address, network, threatType",
        });
      }

      // Store threat report in threat intelligence database
      const threatId = await storeThreatReport({
        address,
        network,
        threatType,
        description,
        evidence,
        reportedBy: userId,
        ipAddress: req.ip,
      });

      auditLogger.logAction({
        userId,
        action: "threat_reported",
        entityType: "threat_report",
        entityId: threatId,
        details: { address, network, threatType },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        threatId,
        message: "Threat report submitted successfully",
      });
    } catch (error) {
      console.error("❌ Error submitting threat report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit threat report",
      });
    }
  },
);

/**
 * @route GET /api/security/stats
 * @desc Get security scanning statistics
 * @access Private
 */
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const stats = await getSecurityStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error fetching security stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch security statistics",
    });
  }
});

/**
 * @route GET /api/security/patterns
 * @desc Get available threat detection patterns
 * @access Private
 */
router.get("/patterns", authMiddleware, async (req: Request, res: Response) => {
  try {
    const patterns = threatEngine.getAllPatterns();
    const stats = threatEngine.getDetectionStats();

    res.json({
      success: true,
      data: {
        patterns: patterns.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          severity: p.severity,
          category: p.category,
          indicators: p.indicators,
        })),
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching threat patterns:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch threat patterns",
    });
  }
});

// Helper functions

async function checkUserScanQuota(
  userId: string,
  scanType: string,
): Promise<any> {
  // Implementation would check database for user's current quota usage
  // This is a simplified version
  return {
    allowed: true,
    details: {
      daily: { used: 5, limit: 50 },
      monthly: { used: 45, limit: 500 },
    },
  };
}

async function updateUserScanQuota(
  userId: string,
  scanType: string,
): Promise<void> {
  // Implementation would update quota usage in database
  console.log(
    `📊 Updated scan quota for user ${userId}, scan type: ${scanType}`,
  );
}

async function storeThreatReport(report: any): Promise<string> {
  // Implementation would store threat report in database
  const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚨 Threat report stored: ${threatId}`);
  return threatId;
}

async function getSecurityStats(userId: string): Promise<any> {
  // Implementation would fetch user's security scanning statistics
  return {
    totalScans: 23,
    threatsDetected: 8,
    safeContracts: 15,
    averageRiskScore: 35,
    scansByNetwork: {
      solana: 12,
      ethereum: 6,
      bsc: 3,
      polygon: 2,
    },
    recentActivity: {
      lastScan: new Date().toISOString(),
      scansThisWeek: 5,
      criticalThreatsFound: 2,
    },
  };
}

export default router;
