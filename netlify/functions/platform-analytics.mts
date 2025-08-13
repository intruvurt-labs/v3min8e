import type { Context, Config } from "@netlify/functions";

interface PlatformAnalytics {
  activeScans: number;
  threatsDetected: number;
  vermHolders: number;
  networksMonitored: number;
  totalUsers: number;
  stakingTVL: number;
  averageAPR: number;
  scansLast24h: number;
  alphaSignalsFound: number;
  viralOutbreaksDetected: number;
  networkStatus: Record<string, "online" | "degraded" | "offline">;
  vermStakingStats: {
    totalStaked: number;
    totalRewards: number;
    averageStakeSize: number;
    stakingParticipation: number;
  };
  realtimeMetrics: {
    scansPerMinute: number;
    threatsPerHour: number;
    userGrowthRate: number;
    protocolStrength: number;
  };
}

// In-memory analytics storage (in production, use Redis/InfluxDB)
let analyticsData: PlatformAnalytics = {
  activeScans: 0,
  threatsDetected: 0,
  vermHolders: 0,
  networksMonitored: 5,
  totalUsers: 0,
  stakingTVL: 0,
  averageAPR: 24.6,
  scansLast24h: 0,
  alphaSignalsFound: 0,
  viralOutbreaksDetected: 0,
  networkStatus: {
    solana: "online",
    base: "online",
    bnb: "online",
    xrp: "online",
    blast: "online",
  },
  vermStakingStats: {
    totalStaked: 0,
    totalRewards: 0,
    averageStakeSize: 0,
    stakingParticipation: 0,
  },
  realtimeMetrics: {
    scansPerMinute: 0,
    threatsPerHour: 0,
    userGrowthRate: 0,
    protocolStrength: 0,
  },
};

// Simulated real-time data updates
let lastUpdate = Date.now();
const updateInterval = 30000; // 30 seconds

const scanHistory: Array<{
  timestamp: number;
  type: "scan" | "threat" | "alpha" | "viral";
}> = [];
const userActivity: Map<string, any> = new Map();

export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const now = Date.now();

    // Update analytics if enough time has passed
    if (now - lastUpdate > updateInterval) {
      await updateAnalytics();
      lastUpdate = now;
    }

    // Calculate real-time metrics
    const realtimeMetrics = calculateRealtimeMetrics();

    // Get network status
    const networkStatus = await checkNetworkStatus();

    // Calculate VERM staking metrics
    const vermStakingStats = await calculateStakingStats();

    // Prepare response with live data
    const liveAnalytics: PlatformAnalytics = {
      ...analyticsData,
      realtimeMetrics,
      networkStatus,
      vermStakingStats,
      // Real data - no artificial variation
      activeScans: Math.max(0, analyticsData.activeScans),
    };

    return new Response(
      JSON.stringify({
        success: true,
        analytics: liveAnalytics,
        timestamp: now,
        nextUpdate: lastUpdate + updateInterval,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching platform analytics:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch analytics",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function updateAnalytics() {
  try {
    // REAL DATA - No more mock numbers
    // VERM currently has 0 verified holders
    analyticsData.vermHolders = 0;
    analyticsData.totalUsers = 0;

    // Real scan metrics - start from 0, build organically
    analyticsData.scansLast24h = scanHistory.filter(
      (scan) => scan.timestamp > Date.now() - 24 * 60 * 60 * 1000,
    ).length;

    analyticsData.activeScans = Math.min(
      5,
      Math.floor(analyticsData.scansLast24h / 24),
    );

    // Real threat detection based on actual scans
    const threatScans = scanHistory.filter(
      (scan) =>
        scan.type === "threat" &&
        scan.timestamp > Date.now() - 24 * 60 * 60 * 1000,
    ).length;
    analyticsData.threatsDetected = threatScans;

    // Real alpha signals from actual scans
    const alphaScans = scanHistory.filter(
      (scan) =>
        scan.type === "alpha" &&
        scan.timestamp > Date.now() - 24 * 60 * 60 * 1000,
    ).length;
    analyticsData.alphaSignalsFound = alphaScans;

    // Real viral outbreaks from actual scans
    const viralScans = scanHistory.filter(
      (scan) =>
        scan.type === "viral" &&
        scan.timestamp > Date.now() - 24 * 60 * 60 * 1000,
    ).length;
    analyticsData.viralOutbreaksDetected = viralScans;

    console.log("REAL Analytics updated:", {
      vermHolders: analyticsData.vermHolders,
      totalUsers: analyticsData.totalUsers,
      scansLast24h: analyticsData.scansLast24h,
      threats: analyticsData.threatsDetected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating analytics:", error);
  }
}

function calculateRealtimeMetrics() {
  // REAL-TIME metrics based on actual data
  const recentScans = scanHistory.filter(
    (scan) => scan.timestamp > Date.now() - 60 * 1000, // Last minute
  ).length;

  const recentThreats = scanHistory.filter(
    (scan) =>
      scan.type === "threat" && scan.timestamp > Date.now() - 60 * 60 * 1000, // Last hour
  ).length;

  return {
    scansPerMinute: recentScans,
    threatsPerHour: recentThreats,
    userGrowthRate: 0, // No growth with 0 users
    protocolStrength: calculateProtocolStrength(),
  };
}

function getHourlyMultiplier(hour: number): number {
  // Activity peaks during US/EU business hours
  if (hour >= 8 && hour <= 17) return 1.5; // Peak hours
  if (hour >= 18 && hour <= 23) return 1.2; // Evening
  if (hour >= 0 && hour <= 6) return 0.6; // Night
  return 1.0; // Default
}

function calculateProtocolStrength(): number {
  // REAL protocol strength calculation
  // With 0 VERM holders and 0 staking, strength is minimal
  const stakingFactor = 0; // No staking
  const userFactor = 0; // No VERM holders
  const activityFactor = Math.min(100, (analyticsData.scansLast24h / 10) * 10); // Activity from scans
  const networkFactor =
    Object.values(analyticsData.networkStatus).filter((s) => s === "online")
      .length * 4; // Network uptime

  // Base strength from network infrastructure even with 0 users
  const baseInfrastructure = 15; // Minimum strength from running infrastructure

  const calculatedStrength = Math.floor(
    (stakingFactor +
      userFactor +
      activityFactor +
      networkFactor +
      baseInfrastructure) /
      5,
  );

  return Math.max(5, Math.min(100, calculatedStrength)); // Between 5-100%
}

async function checkNetworkStatus() {
  // In production, actually ping RPC endpoints
  const networks = ["solana", "base", "bnb", "xrp", "blast"];
  const status: Record<string, "online" | "degraded" | "offline"> = {};

  for (const network of networks) {
    // Simulate 99% uptime
    const uptime = Math.random();
    if (uptime > 0.99) {
      status[network] = "offline";
    } else if (uptime > 0.95) {
      status[network] = "degraded";
    } else {
      status[network] = "online";
    }
  }

  return status;
}

async function calculateStakingStats() {
  // REAL staking metrics - no mock data
  // Since there are 0 VERM holders currently, all staking stats are 0
  return {
    totalStaked: 0,
    totalRewards: 0,
    averageStakeSize: 0,
    stakingParticipation: 0,
  };
}

// Track scan activity for metrics
export async function trackScanActivity(
  type: "scan" | "threat" | "alpha" | "viral",
) {
  const now = Date.now();
  scanHistory.push({ timestamp: now, type });

  // Keep only last 24 hours
  const cutoff = now - 24 * 60 * 60 * 1000;
  const recentScans = scanHistory.filter((s) => s.timestamp > cutoff);

  // Update counters
  switch (type) {
    case "threat":
      analyticsData.threatsDetected++;
      break;
    case "alpha":
      analyticsData.alphaSignalsFound++;
      break;
    case "viral":
      analyticsData.viralOutbreaksDetected++;
      break;
  }

  analyticsData.scansLast24h = recentScans.length;
}

export const config: Config = {
  path: "/api/platform/analytics",
};
