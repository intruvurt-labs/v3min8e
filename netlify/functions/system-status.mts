import type { Context, Config } from "@netlify/functions";

interface SystemStatus {
  timestamp: string;
  uptime: string;
  services: {
    scannerEngine: {
      status: "online" | "degraded" | "offline";
      responseTime: number;
      activeScans: number;
      queueLength: number;
    };
    patternDatabase: {
      status: "online" | "syncing" | "offline";
      version: string;
      lastUpdate: string;
      totalPatterns: number;
    };
    crossChainSync: {
      status: "synchronized" | "syncing" | "offline";
      networks: Record<string, "online" | "degraded" | "offline">;
      lastSync: string;
    };
    ratDeployment: {
      total: number;
      active: number;
      busy: number;
      idle: number;
    };
    aiEngine: {
      status: "operational" | "learning" | "offline";
      confidence: number;
      modelsLoaded: number;
      processingQueue: number;
    };
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
    scanThroughput: number;
  };
  statistics: {
    totalScansToday: number;
    threatsDetected: number;
    alphaSignalsFound: number;
    upTimePercentage: number;
  };
}

// Simulated system metrics - in production, get from actual monitoring
let systemMetrics = {
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  totalScans: 15247,
  totalThreats: 892,
  totalAlphaSignals: 156,
  rats: generateInitialRats(),
};

export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const status = await generateSystemStatus();

    return new Response(
      JSON.stringify({
        success: true,
        status,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, max-age=10", // Cache for 10 seconds
        },
      },
    );
  } catch (error) {
    console.error("System status error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get system status",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function generateSystemStatus(): Promise<SystemStatus> {
  const now = new Date();
  const uptime = calculateUptime();

  // Get pattern database status
  const patternDbStatus = await getPatternDatabaseStatus();

  // Simulate real-time metrics with realistic variation
  const activeScans = Math.floor(Math.random() * 15) + 5;
  const scannerResponseTime = 150 + Math.floor(Math.random() * 100);
  const aiConfidence = 94.2 + (Math.random() - 0.5) * 2;

  // Update daily stats
  updateDailyStats();

  return {
    timestamp: now.toISOString(),
    uptime: uptime,
    services: {
      scannerEngine: {
        status: "online",
        responseTime: scannerResponseTime,
        activeScans: activeScans,
        queueLength: Math.floor(Math.random() * 5),
      },
      patternDatabase: {
        status: "online",
        version: patternDbStatus.version || "2.1.0",
        lastUpdate: patternDbStatus.lastUpdate || now.toISOString(),
        totalPatterns: patternDbStatus.totalPatterns || 247,
      },
      crossChainSync: {
        status: "synchronized",
        networks: {
          solana: "online",
          base: Math.random() > 0.05 ? "online" : "degraded",
          bnb: "online",
          xrp: Math.random() > 0.02 ? "online" : "degraded",
          blast: "online",
        },
        lastSync: new Date(
          now.getTime() - Math.random() * 300000,
        ).toISOString(),
      },
      ratDeployment: updateRatStatus(),
      aiEngine: {
        status: "operational",
        confidence: parseFloat(aiConfidence.toFixed(1)),
        modelsLoaded: 6,
        processingQueue: Math.floor(Math.random() * 3),
      },
    },
    performance: {
      cpuUsage: 15 + Math.random() * 10,
      memoryUsage: 45 + Math.random() * 15,
      networkLatency: 25 + Math.random() * 15,
      scanThroughput: 120 + Math.random() * 30,
    },
    statistics: {
      totalScansToday:
        systemMetrics.totalScans + Math.floor(Math.random() * 50),
      threatsDetected:
        systemMetrics.totalThreats + Math.floor(Math.random() * 5),
      alphaSignalsFound:
        systemMetrics.totalAlphaSignals + Math.floor(Math.random() * 2),
      upTimePercentage: 99.7 + Math.random() * 0.2,
    },
  };
}

function calculateUptime(): string {
  const uptimeMs = Date.now() - systemMetrics.startTime;
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}d ${hours}h ${minutes}m`;
}

function generateInitialRats() {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    busy: Math.random() > 0.3,
    lastActivity: Date.now() - Math.random() * 600000, // Last 10 minutes
  }));
}

function updateRatStatus() {
  // Update RAT positions and activity
  systemMetrics.rats = systemMetrics.rats.map((rat) => ({
    ...rat,
    x: Math.max(5, Math.min(95, rat.x + (Math.random() - 0.5) * 5)),
    y: Math.max(5, Math.min(95, rat.y + (Math.random() - 0.5) * 5)),
    busy: Math.random() > 0.4,
    lastActivity: rat.busy ? Date.now() : rat.lastActivity,
  }));

  const busyRats = systemMetrics.rats.filter((rat) => rat.busy).length;
  const idleRats = systemMetrics.rats.length - busyRats;

  return {
    total: systemMetrics.rats.length,
    active: systemMetrics.rats.length, // All rats are always active
    busy: busyRats,
    idle: idleRats,
  };
}

function updateDailyStats() {
  // Increment stats throughout the day
  const hoursSinceStart =
    (Date.now() - systemMetrics.startTime) / (1000 * 60 * 60);
  const expectedScansPerHour = 20;
  const expectedScans = Math.floor(hoursSinceStart * expectedScansPerHour);

  if (systemMetrics.totalScans < expectedScans) {
    systemMetrics.totalScans = expectedScans + Math.floor(Math.random() * 10);
  }

  // Occasionally add threats and alpha signals
  if (Math.random() < 0.1) {
    // 10% chance
    systemMetrics.totalThreats += Math.floor(Math.random() * 2) + 1;
  }

  if (Math.random() < 0.05) {
    // 5% chance
    systemMetrics.totalAlphaSignals += 1;
  }
}

async function getPatternDatabaseStatus() {
  try {
    const response = await fetch(
      `${new URL(context.url || "").origin}/api/pattern-database?action=status`,
    );
    if (response.ok) {
      const data = await response.json();
      return data.status || {};
    }
  } catch (error) {
    console.warn("Could not fetch pattern database status:", error);
  }

  return {
    version: "2.1.0",
    lastUpdate: new Date().toISOString(),
    totalPatterns: 247,
  };
}

export const config: Config = {
  path: "/api/system/status",
};
