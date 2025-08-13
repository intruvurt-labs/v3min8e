import type { Context, Config } from "@netlify/functions";

interface ScanRecord {
  wallet: string;
  address: string;
  network: string;
  timestamp: number;
  ipAddress?: string;
}

// In-memory storage for demo - in production, use a database
const scanHistory = new Map<string, ScanRecord[]>();
const RATE_LIMITS = {
  demo: 3, // 3 scans in demo mode
  verm: 100, // 100 scans per hour for VERM holders
  premium: 500, // 500 scans per hour for high-tier VERM holders
};

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { wallet, address, network } = await req.json();

    if (!wallet || !address || !network) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";

    // Get or create scan history for this wallet
    let walletScans = scanHistory.get(wallet) || [];

    // Remove scans older than 1 hour
    walletScans = walletScans.filter((scan) => now - scan.timestamp < oneHour);

    // Check VERM balance to determine rate limit
    const vermResponse = await fetch(
      `${new URL(req.url).origin}/api/check-verm-balance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          networks: ["solana", "base", "bnb", "xrp", "blast"],
        }),
      },
    );

    const vermData = await vermResponse.json();
    let rateLimit = RATE_LIMITS.demo;
    let tier = "demo";

    if (vermData.success && vermData.qualified) {
      if (vermData.totalUsdValue >= 1000) {
        rateLimit = RATE_LIMITS.premium;
        tier = "premium";
      } else {
        rateLimit = RATE_LIMITS.verm;
        tier = "verm";
      }
    }

    // Check if rate limit exceeded
    if (walletScans.length >= rateLimit) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          success: false,
          rateLimit,
          currentUsage: walletScans.length,
          tier,
          resetTime: Math.min(...walletScans.map((s) => s.timestamp)) + oneHour,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Record the scan
    const scanRecord: ScanRecord = {
      wallet,
      address,
      network,
      timestamp: now,
      ipAddress: clientIP,
    };

    walletScans.push(scanRecord);
    scanHistory.set(wallet, walletScans);

    // Log scan for analytics
    console.log(
      `Scan tracked: ${wallet.slice(0, 8)}...${wallet.slice(-4)} -> ${address.slice(0, 8)}...${address.slice(-4)} on ${network}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        rateLimit,
        currentUsage: walletScans.length,
        remainingScans: rateLimit - walletScans.length,
        tier,
        resetTime: now + oneHour,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error tracking scan:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to track scan",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const config: Config = {
  path: "/api/track-scan",
};
