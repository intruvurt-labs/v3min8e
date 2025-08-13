import type { Context, Config } from "@netlify/functions";

interface PatternEntry {
  id: string;
  name: string;
  category:
    | "honeypot"
    | "rugpull"
    | "bot_farm"
    | "scam_setup"
    | "viral_outbreak"
    | "alpha_signal";
  pattern: string;
  confidence: number;
  detectedCount: number;
  lastDetected: string;
  createdAt: string;
  updatedAt: string;
  author: "nimrev_ai" | "community" | "manual";
  version: string;
}

interface PatternDatabase {
  version: string;
  lastUpdate: string;
  totalPatterns: number;
  patterns: PatternEntry[];
  stats: {
    honeypotPatterns: number;
    rugpullPatterns: number;
    botFarmPatterns: number;
    scamSetupPatterns: number;
    viralOutbreakPatterns: number;
    alphaSignalPatterns: number;
  };
}

// In-memory pattern database - in production use Redis/Database
let patternDatabase: PatternDatabase = {
  version: "2.1.0",
  lastUpdate: new Date().toISOString(),
  totalPatterns: 247,
  patterns: [],
  stats: {
    honeypotPatterns: 45,
    rugpullPatterns: 38,
    botFarmPatterns: 52,
    scamSetupPatterns: 41,
    viralOutbreakPatterns: 35,
    alphaSignalPatterns: 36,
  },
};

// Initialize with sample patterns
if (patternDatabase.patterns.length === 0) {
  initializeDefaultPatterns();
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "get";

  switch (req.method) {
    case "GET":
      return await handleGet(action);
    case "POST":
      return await handlePost(req, action);
    default:
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
  }
};

async function handleGet(action: string) {
  try {
    switch (action) {
      case "status":
        return new Response(
          JSON.stringify({
            success: true,
            status: {
              version: patternDatabase.version,
              lastUpdate: patternDatabase.lastUpdate,
              totalPatterns: patternDatabase.totalPatterns,
              stats: patternDatabase.stats,
              uptime: getSystemUptime(),
              health: "optimal",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );

      case "patterns":
        return new Response(
          JSON.stringify({
            success: true,
            database: patternDatabase,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );

      default:
        return new Response(
          JSON.stringify({
            success: true,
            database: {
              version: patternDatabase.version,
              lastUpdate: patternDatabase.lastUpdate,
              totalPatterns: patternDatabase.totalPatterns,
              stats: patternDatabase.stats,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    console.error("Pattern database GET error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to retrieve pattern database",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function handlePost(req: Request, action: string) {
  try {
    const data = await req.json();

    switch (action) {
      case "update":
        return await updatePatternDatabase(data);
      case "add_pattern":
        return await addPattern(data);
      case "sync":
        return await syncWithNimrev(data);
      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Pattern database POST error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update pattern database",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function updatePatternDatabase(data: any) {
  const { patterns, version, author = "nimrev_ai" } = data;

  if (!patterns || !version) {
    return new Response(
      JSON.stringify({ error: "Missing patterns or version" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Update database
  const now = new Date().toISOString();
  patternDatabase.version = version;
  patternDatabase.lastUpdate = now;

  // Add new patterns
  patterns.forEach((pattern: any) => {
    const newPattern: PatternEntry = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: pattern.name,
      category: pattern.category,
      pattern: pattern.pattern,
      confidence: pattern.confidence || 85,
      detectedCount: 0,
      lastDetected: "",
      createdAt: now,
      updatedAt: now,
      author,
      version,
    };

    patternDatabase.patterns.push(newPattern);
  });

  // Update stats
  recalculateStats();

  console.log(`Pattern database updated to v${version} by ${author} at ${now}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Pattern database updated to v${version}`,
      database: {
        version: patternDatabase.version,
        lastUpdate: patternDatabase.lastUpdate,
        totalPatterns: patternDatabase.totalPatterns,
        stats: patternDatabase.stats,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function addPattern(data: any) {
  const { name, category, pattern, confidence, author = "community" } = data;

  if (!name || !category || !pattern) {
    return new Response(
      JSON.stringify({ error: "Missing required pattern fields" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const now = new Date().toISOString();
  const newPattern: PatternEntry = {
    id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    category,
    pattern,
    confidence: confidence || 75,
    detectedCount: 0,
    lastDetected: "",
    createdAt: now,
    updatedAt: now,
    author,
    version: patternDatabase.version,
  };

  patternDatabase.patterns.push(newPattern);
  patternDatabase.lastUpdate = now;
  recalculateStats();

  return new Response(
    JSON.stringify({
      success: true,
      message: "Pattern added successfully",
      pattern: newPattern,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function syncWithNimrev(data: any) {
  // Simulate sync with NimRev central system
  const { apiKey, force = false } = data;

  if (!apiKey || apiKey !== process.env.NIMREV_MASTER_API_KEY) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Simulate fetching latest patterns from NimRev central
  const centralPatterns = await fetchCentralPatterns();

  if (centralPatterns.version > patternDatabase.version || force) {
    patternDatabase = {
      ...centralPatterns,
      lastUpdate: new Date().toISOString(),
    };

    console.log(`Synced with NimRev central - v${centralPatterns.version}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Sync completed",
      database: {
        version: patternDatabase.version,
        lastUpdate: patternDatabase.lastUpdate,
        totalPatterns: patternDatabase.totalPatterns,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function initializeDefaultPatterns() {
  const defaultPatterns: PatternEntry[] = [
    {
      id: "hp_001",
      name: "Classic Honeypot",
      category: "honeypot",
      pattern: "^.*111{4,}.*$",
      confidence: 92,
      detectedCount: 156,
      lastDetected: new Date(Date.now() - 3600000).toISOString(),
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: new Date().toISOString(),
      author: "nimrev_ai",
      version: "2.1.0",
    },
    {
      id: "rp_001",
      name: "Rug Pull Setup",
      category: "rugpull",
      pattern: "liquidity.*lock.*bypass",
      confidence: 89,
      detectedCount: 73,
      lastDetected: new Date(Date.now() - 7200000).toISOString(),
      createdAt: "2024-01-20T14:30:00Z",
      updatedAt: new Date().toISOString(),
      author: "nimrev_ai",
      version: "2.1.0",
    },
    {
      id: "bf_001",
      name: "Coordinated Bot Farm",
      category: "bot_farm",
      pattern: "sync.*wallet.*creation",
      confidence: 94,
      detectedCount: 241,
      lastDetected: new Date(Date.now() - 1800000).toISOString(),
      createdAt: "2024-02-01T09:15:00Z",
      updatedAt: new Date().toISOString(),
      author: "nimrev_ai",
      version: "2.1.0",
    },
  ];

  patternDatabase.patterns = defaultPatterns;
  recalculateStats();
}

function recalculateStats() {
  const stats = {
    honeypotPatterns: 0,
    rugpullPatterns: 0,
    botFarmPatterns: 0,
    scamSetupPatterns: 0,
    viralOutbreakPatterns: 0,
    alphaSignalPatterns: 0,
  };

  patternDatabase.patterns.forEach((pattern) => {
    switch (pattern.category) {
      case "honeypot":
        stats.honeypotPatterns++;
        break;
      case "rugpull":
        stats.rugpullPatterns++;
        break;
      case "bot_farm":
        stats.botFarmPatterns++;
        break;
      case "scam_setup":
        stats.scamSetupPatterns++;
        break;
      case "viral_outbreak":
        stats.viralOutbreakPatterns++;
        break;
      case "alpha_signal":
        stats.alphaSignalPatterns++;
        break;
    }
  });

  patternDatabase.stats = stats;
  patternDatabase.totalPatterns = patternDatabase.patterns.length;
}

async function fetchCentralPatterns(): Promise<PatternDatabase> {
  // Simulate fetching from NimRev central system
  return {
    version: "2.2.0",
    lastUpdate: new Date().toISOString(),
    totalPatterns: 312,
    patterns: [], // Would contain actual patterns from central
    stats: {
      honeypotPatterns: 58,
      rugpullPatterns: 47,
      botFarmPatterns: 64,
      scamSetupPatterns: 52,
      viralOutbreakPatterns: 45,
      alphaSignalPatterns: 46,
    },
  };
}

function getSystemUptime(): string {
  // Calculate uptime since deployment
  const startTime = new Date("2024-01-01T00:00:00Z").getTime();
  const currentTime = Date.now();
  const uptimeMs = currentTime - startTime;

  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}d ${hours}h ${minutes}m`;
}

export const config: Config = {
  path: "/api/pattern-database",
};
