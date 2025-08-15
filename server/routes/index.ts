import { Express } from "express";
import { handlePing } from "./demo";
import { handleDemo } from "./demo";
import { handleContactSubmission } from "./contact";
import { handleScanRequest, handleBatchScan } from "./scan";
import { handleVermPrice } from "./verm-price";
import {
  handleFlagSubmission,
  handleVoteOnFlag,
  handleGetLeaderboard,
  handleGetPendingFlags,
  handleReferralRegistration,
} from "./community";

// Import bot routes
import botRoutes from "./bot";

// Import payment routes
import paymentRoutes from "./payment";

// Import security audit routes
import securityAuditRoutes from "./security-audit";

// Import airdrop routes
import airdropRoutes from "./airdrop";

// Import NimRev routes
import {
  getSystemStatus,
  getStats,
  requestScan,
  quickScan,
  getScanResult,
  getLiveThreats,
  getPublicScans,
  getTransparencyReport,
  addWatchedAddress,
  getWatchedAddresses,
  removeWatchedAddress,
  getRiskData,
  emergencyStop,
  healthCheck,
} from "./nimrev";

export function setupRoutes(app: Express) {
  // Basic routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);
  app.post("/api/contact", handleContactSubmission);
  app.get("/api/verm-price", handleVermPrice);

  // Original scanning routes
  app.post("/api/scan", handleScanRequest);
  app.post("/api/scan/batch", handleBatchScan);

  // Community and flagging routes
  app.post("/api/community/flag", handleFlagSubmission);
  app.post("/api/community/vote", handleVoteOnFlag);
  app.get("/api/community/leaderboard", handleGetLeaderboard);
  app.get("/api/community/pending-flags", handleGetPendingFlags);
  app.post("/api/community/referral", handleReferralRegistration);

  // NimRev Scanner API routes
  app.get("/api/nimrev/status", getSystemStatus);
  app.get("/api/nimrev/stats", getStats);
  app.post("/api/nimrev/scan", requestScan);
  app.post("/api/nimrev/quick-scan", quickScan);
  app.get("/api/nimrev/scan/:id", getScanResult);
  app.get("/api/nimrev/live-threats", getLiveThreats);
  app.get("/api/nimrev/public-scans", getPublicScans);
  app.get("/api/nimrev/transparency/:scanId", getTransparencyReport);
  app.post("/api/nimrev/watched-addresses", addWatchedAddress);
  app.get("/api/nimrev/watched-addresses", getWatchedAddresses);
  app.delete("/api/nimrev/watched-addresses/:id", removeWatchedAddress);
  app.get("/api/nimrev/risk-data", getRiskData);
  app.post("/api/nimrev/emergency-stop", emergencyStop);
  app.get("/api/nimrev/health", healthCheck);

  // Bot platform routes
  app.use("/api/bot", botRoutes);

  // Payment routes
  app.use("/api", paymentRoutes);

  // Security audit routes
  app.use("/api/security-audit", securityAuditRoutes);

  // Airdrop routes
  app.use("/api/airdrop", airdropRoutes);
}
