import type { Context } from "@netlify/functions";

interface ScanRecord {
  id: string;
  address: string;
  network: string;
  result: "safe" | "warning" | "danger";
  riskScore: number;
  timestamp: number;
  userWallet?: string;
}

// In-memory storage for scan history (in production, use a database)
let scanHistory: ScanRecord[] = [];

// Clean up old scans (keep only last 100)
const cleanupOldScans = () => {
  if (scanHistory.length > 100) {
    scanHistory = scanHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
  }
};

export default async function handler(request: Request, context: Context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (request.method === "GET") {
      // Return recent scan history
      cleanupOldScans();

      const recentScans = scanHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20); // Return last 20 scans

      return new Response(
        JSON.stringify({
          success: true,
          scans: recentScans,
          total: scanHistory.length,
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (request.method === "POST") {
      const body = await request.json();

      // Add new scan to history
      const scanRecord: ScanRecord = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        address: body.address,
        network: body.network || "solana",
        result: body.result || "safe",
        riskScore: body.riskScore || 0,
        timestamp: Date.now(),
        userWallet: body.userWallet,
      };

      scanHistory.push(scanRecord);
      cleanupOldScans();

      console.log(
        `New scan recorded: ${scanRecord.address} on ${scanRecord.network} - ${scanRecord.result}`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          scanId: scanRecord.id,
          message: "Scan recorded successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scan history error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
