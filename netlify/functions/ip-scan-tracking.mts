import type { Context } from "@netlify/functions";
import crypto from "crypto";

// Creator wallet gets unlimited scans
const CREATOR_WALLET = "4XygsJdgpKRqvAuyyyXczDQRDxuSeumns7RA3Ak1RZpf";

// Simple in-memory store for demo purposes
// In production, use a proper database
const ipScans = new Map<string, { count: number; lastScan: number }>();

// Clean up old entries every hour
setInterval(
  () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [ip, data] of ipScans.entries()) {
      if (data.lastScan < oneDayAgo) {
        ipScans.delete(ip);
      }
    }
  },
  60 * 60 * 1000,
);

interface ScanTrackingRequest {
  action: "checkLimit" | "recordScan";
  address?: string;
  network?: string;
  wallet?: string;
}

const hashIP = (ip: string): string => {
  return crypto
    .createHash("sha256")
    .update(ip + "nimrev-salt")
    .digest("hex");
};

const getClientIP = (headers: Record<string, string | undefined>): string => {
  // Try multiple headers to get the real IP
  const forwarded = headers["x-forwarded-for"];
  const realIP = headers["x-real-ip"];
  const clientIP = headers["x-client-ip"];

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  return realIP || clientIP || "unknown";
};

export default async function handler(request: Request, context: Context) {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: ScanTrackingRequest = await request.json();
    const clientIP = getClientIP(Object.fromEntries(request.headers.entries()));
    const hashedIP = hashIP(clientIP);

    if (body.action === "checkLimit") {
      // Creator wallet has unlimited scans
      if (body.wallet === CREATOR_WALLET) {
        return new Response(
          JSON.stringify({
            success: true,
            canScan: true,
            hasUsedFreeScan: false,
            hasConsentCookie: true,
            remainingScans: 999999,
            isCreator: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Check if IP has used their free scan
      const scanData = ipScans.get(hashedIP);
      const hasUsedFreeScan = scanData && scanData.count > 0;

      // Check cookie consent
      const cookieConsent = request.headers.get("cookie") || "";
      const hasConsentCookie = cookieConsent.includes(
        "nimrev-cookie-consent=accepted",
      );

      return new Response(
        JSON.stringify({
          success: true,
          canScan: !hasUsedFreeScan || hasConsentCookie,
          hasUsedFreeScan,
          hasConsentCookie,
          remainingScans: hasUsedFreeScan ? 0 : 1,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.action === "recordScan") {
      // Record a scan for this IP
      const currentData = ipScans.get(hashedIP) || { count: 0, lastScan: 0 };

      ipScans.set(hashedIP, {
        count: currentData.count + 1,
        lastScan: Date.now(),
      });

      // Log the scan (no personal info)
      console.log(
        `Scan recorded for IP hash: ${hashedIP.slice(0, 8)}... | Network: ${body.network || "unknown"} | Total scans: ${currentData.count + 1}`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          totalScans: currentData.count + 1,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("IP scan tracking error:", error);

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
