import { RequestHandler } from "express";
import { NimRevOrchestrator } from "../services/NimRevOrchestrator";
import { supabase, SupabaseHelper } from "../utils/supabase";
import { z } from "zod";

// Initialize the orchestrator (singleton)
let orchestrator: NimRevOrchestrator | null = null;

const getOrchestrator = () => {
  if (!orchestrator) {
    orchestrator = new NimRevOrchestrator();
    orchestrator.start().catch(console.error);
  }
  return orchestrator;
};

// Validation schemas
const scanRequestSchema = z.object({
  address: z.string().min(1),
  blockchain: z.enum([
    "solana",
    "ethereum",
    "base",
    "blast",
    "polygon",
    "avalanche",
    "arbitrum",
    "optimism",
  ]),
});

const watchAddressSchema = z.object({
  address: z.string().min(1),
  blockchain: z.enum([
    "solana",
    "ethereum",
    "base",
    "blast",
    "polygon",
    "avalanche",
    "arbitrum",
    "optimism",
  ]),
  watch_type: z
    .enum(["full", "liquidity_only", "transfers_only"])
    .optional()
    .default("full"),
  alert_threshold: z.number().optional(),
});

// GET /api/nimrev/status - System status and health
export const getSystemStatus: RequestHandler = async (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    const status = await orchestrator.getSystemStatus();
    const healthCheck = await orchestrator.performHealthCheck();

    res.json({
      ...status,
      health: healthCheck,
    });
  } catch (error) {
    console.error("Failed to get system status:", error);
    res.status(500).json({ error: "Failed to get system status" });
  }
};

// GET /api/nimrev/stats - Dashboard statistics
export const getStats: RequestHandler = async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || "24h";
    const timeframeDays = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 1;
    const startDate = new Date(
      Date.now() - timeframeDays * 24 * 60 * 60 * 1000,
    );

    // Get scan statistics
    const { data: scanStats, error: scanError } = await supabase
      .from("scan_results")
      .select("id, risk_score, created_at, threat_categories")
      .gte("created_at", startDate.toISOString())
      .eq("scan_status", "completed");

    if (scanError) throw scanError;

    // Get active watches count
    const { count: activeWatches, error: watchError } = await supabase
      .from("watched_addresses")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (watchError) throw watchError;

    const totalScans = scanStats?.length || 0;
    const highRiskDetected =
      scanStats?.filter((scan) => scan.risk_score <= 30).length || 0;
    const threatsBlocked =
      scanStats?.filter((scan) => scan.threat_categories?.length > 0).length ||
      0;

    res.json({
      totalScans,
      highRiskDetected,
      activeWatches: activeWatches || 0,
      threatsBlocked,
      lastUpdateTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
};

// POST /api/nimrev/scan - Manual scan request
export const requestScan: RequestHandler = async (req, res) => {
  try {
    const { address, blockchain } = scanRequestSchema.parse(req.body);

    // Check rate limiting (basic implementation)
    const userIp = req.ip;
    // In production, implement proper rate limiting with Redis

    const orchestrator = getOrchestrator();
    const scanId = await orchestrator.performManualScan(address, blockchain);

    res.json({
      scanId,
      message: "Scan queued successfully",
      estimatedCompletion: new Date(Date.now() + 60000).toISOString(), // ~1 minute
    });
  } catch (error) {
    console.error("Failed to request scan:", error);
    res.status(400).json({ error: "Invalid scan request" });
  }
};

// POST /api/nimrev/quick-scan - Quick scan with immediate response
export const quickScan: RequestHandler = async (req, res) => {
  try {
    const { address, blockchain } = scanRequestSchema.parse(req.body);

    // Check if we have a recent scan result
    const { data: recentScan } = await supabase
      .from("scan_results")
      .select("*")
      .eq("token_address", address)
      .eq("blockchain", blockchain)
      .eq("scan_status", "completed")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recentScan) {
      // Return cached result
      res.json({
        address,
        blockchain,
        riskScore: recentScan.risk_score,
        threatCategories: recentScan.threat_categories || [],
        scanTime: recentScan.scan_duration_ms || 0,
        cached: true,
        timestamp: recentScan.created_at,
      });
      return;
    }

    // For quick scan, return a simplified response
    // In a real implementation, this would perform a lightweight scan
    const mockResult = {
      address,
      blockchain,
      riskScore: Math.floor(Math.random() * 100),
      threatCategories: Math.random() > 0.7 ? ["high_fees"] : [],
      scanTime: Math.floor(Math.random() * 2000) + 500,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    res.json(mockResult);
  } catch (error) {
    console.error("Failed to perform quick scan:", error);
    res.status(400).json({ error: "Invalid quick scan request" });
  }
};

// GET /api/nimrev/scan/:id - Get scan result
export const getScanResult: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: scanResult, error } = await supabase
      .from("scan_results")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !scanResult) {
      return res.status(404).json({ error: "Scan result not found" });
    }

    res.json(scanResult);
  } catch (error) {
    console.error("Failed to get scan result:", error);
    res.status(500).json({ error: "Failed to get scan result" });
  }
};

// GET /api/nimrev/live-threats - Live threat feed
export const getLiveThreats: RequestHandler = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const { data: threats, error } = await supabase
      .from("live_threat_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json(threats || []);
  } catch (error) {
    console.error("Failed to get live threats:", error);
    res.status(500).json({ error: "Failed to get live threats" });
  }
};

// GET /api/nimrev/public-scans - Public scan results for transparency
export const getPublicScans: RequestHandler = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const timeframe = (req.query.timeframe as string) || "24h";

    let query = supabase
      .from("public_scan_results")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply timeframe filter
    if (timeframe !== "all") {
      const timeframeDays =
        timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 1;
      const startDate = new Date(
        Date.now() - timeframeDays * 24 * 60 * 60 * 1000,
      );
      query = query.gte("created_at", startDate.toISOString());
    }

    // Apply search filter with proper sanitization
    if (search) {
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').replace(/'/g, "''");
      query = query.or(
        `token_address.ilike.%${sanitizedSearch}%,token_symbol.ilike.%${sanitizedSearch}%,ipfs_hash.ilike.%${sanitizedSearch}%`,
      );
    }

    const { data: scans, error } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error) throw error;

    res.json(scans || []);
  } catch (error) {
    console.error("Failed to get public scans:", error);
    res.status(500).json({ error: "Failed to get public scans" });
  }
};

// GET /api/nimrev/transparency/:scanId - Get transparency report
export const getTransparencyReport: RequestHandler = async (req, res) => {
  try {
    const { scanId } = req.params;

    const orchestrator = getOrchestrator();
    const report = await orchestrator.getTransparencyReport(scanId);

    res.json(report);
  } catch (error) {
    console.error("Failed to get transparency report:", error);
    res.status(500).json({ error: "Failed to get transparency report" });
  }
};

// POST /api/nimrev/watch - Add address to watchlist
export const addWatchedAddress: RequestHandler = async (req, res) => {
  try {
    const { address, blockchain, watch_type, alert_threshold } =
      watchAddressSchema.parse(req.body);

    // For demo purposes, create a mock user
    // In production, get user from authentication
    const mockUser = await SupabaseHelper.ensureUserExists(
      undefined,
      undefined,
      "demo_user",
    );

    const { data: watchedAddress, error } = await supabase
      .from("watched_addresses")
      .insert({
        address,
        blockchain,
        watcher_id: mockUser.id,
        watch_type,
        alert_threshold,
        alert_channels: [`webhook:demo`],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return res
          .status(400)
          .json({ error: "Address is already being watched" });
      }
      throw error;
    }

    res.json({
      message: "Address added to watchlist",
      watchedAddress,
    });
  } catch (error) {
    console.error("Failed to add watched address:", error);
    res.status(400).json({ error: "Failed to add address to watchlist" });
  }
};

// GET /api/nimrev/watched-addresses - Get watched addresses
export const getWatchedAddresses: RequestHandler = async (req, res) => {
  try {
    const activeOnly = req.query.active === "true";

    let query = supabase
      .from("watched_addresses")
      .select("*")
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: addresses, error } = await query;

    if (error) throw error;

    res.json(addresses || []);
  } catch (error) {
    console.error("Failed to get watched addresses:", error);
    res.status(500).json({ error: "Failed to get watched addresses" });
  }
};

// DELETE /api/nimrev/watched-addresses/:id - Remove watched address
export const removeWatchedAddress: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("watched_addresses")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Address removed from watchlist" });
  } catch (error) {
    console.error("Failed to remove watched address:", error);
    res.status(500).json({ error: "Failed to remove watched address" });
  }
};

// GET /api/nimrev/risk-data - Risk analysis data for heatmap
export const getRiskData: RequestHandler = async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || "24h";
    const blockchain = (req.query.blockchain as string) || "all";

    // Mock data for demonstration
    const mockData = [
      {
        blockchain: "ethereum",
        riskLevel: "high",
        count: 45,
        percentage: 23,
        change24h: 12,
      },
      {
        blockchain: "solana",
        riskLevel: "medium",
        count: 78,
        percentage: 19,
        change24h: -5,
      },
      {
        blockchain: "base",
        riskLevel: "low",
        count: 132,
        percentage: 31,
        change24h: 8,
      },
      {
        blockchain: "blast",
        riskLevel: "medium",
        count: 89,
        percentage: 15,
        change24h: -3,
      },
      {
        blockchain: "polygon",
        riskLevel: "low",
        count: 67,
        percentage: 12,
        change24h: 15,
      },
    ];

    res.json(mockData);
  } catch (error) {
    console.error("Failed to get risk data:", error);
    res.status(500).json({ error: "Failed to get risk data" });
  }
};

// POST /api/nimrev/emergency-stop - Emergency system stop
export const emergencyStop: RequestHandler = async (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    await orchestrator.emergencyStop();

    res.json({ message: "Emergency stop initiated" });
  } catch (error) {
    console.error("Failed to emergency stop:", error);
    res.status(500).json({ error: "Failed to emergency stop system" });
  }
};

// GET /api/nimrev/health - Health check endpoint
export const healthCheck: RequestHandler = async (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    const health = await orchestrator.performHealthCheck();

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
};
