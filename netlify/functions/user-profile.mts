import type { Context, Config } from "@netlify/functions";

// Shared in-memory storage - in production, use PostgreSQL/MongoDB
let userProfiles: Map<string, any>;
let userActivity: Map<string, any[]>;

// Initialize shared storage if not exists
if (typeof globalThis.userProfiles === "undefined") {
  globalThis.userProfiles = new Map<string, any>();
  globalThis.userActivity = new Map<string, any[]>();
}

userProfiles = globalThis.userProfiles;
userActivity = globalThis.userActivity;

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return new Response(
        JSON.stringify({ error: "Wallet address required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if profile exists
    let profile = userProfiles.get(wallet);

    if (!profile) {
      // Create default profile for new users
      profile = await createDefaultProfile(wallet);
      userProfiles.set(wallet, profile);
    }

    // Update VERM holdings and reputation
    await updateProfileMetrics(wallet, profile, req);

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        message: "Profile loaded successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error loading user profile:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to load profile",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function createDefaultProfile(wallet: string) {
  const generateRandomAvatar = (seed: string): string => {
    const colors = ["00ff00", "00ffff", "ff8800", "ff00ff", "ffff00"];
    const seedNum = seed
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = seedNum % colors.length;

    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${colors[colorIndex]}`;
  };

  return {
    wallet,
    name: `Vermin_${wallet.slice(0, 6)}`,
    bio: "New hunter in the NimRev network. Ready to expose threats and find alpha.",
    avatar: generateRandomAvatar(wallet),
    joinDate: new Date().toISOString(),
    totalScans: 0,
    successfulScans: 0,
    threatsDetected: 0,
    alphaSignalsFound: 0,
    lastAction: {
      type: "profile_update",
      timestamp: new Date().toISOString(),
    },
    preferences: {
      scanShutdownTimes: {
        enabled: false,
        startTime: "02:00",
        endTime: "06:00",
        timezone: "UTC",
      },
      notifications: {
        threats: true,
        alphaSignals: true,
        staking: true,
      },
      privacy: {
        showActivity: true,
        showStats: true,
      },
    },
    reputation: {
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      badges: ["rookie_hunter"],
    },
    vermHoldings: {
      total: 0,
      staked: 0,
      tier: "demo",
      qualified: false,
    },
  };
}

async function updateProfileMetrics(
  wallet: string,
  profile: any,
  request: Request,
) {
  try {
    // Fetch current VERM balance
    const origin = new URL(request.url).origin;
    const vermResponse = await fetch(`${origin}/api/check-verm-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        networks: ["solana", "base", "bnb", "xrp", "blast"],
      }),
    });

    if (vermResponse.ok) {
      const vermData = await vermResponse.json();

      if (vermData.success) {
        const totalVerm = vermData.balances.reduce(
          (sum: number, balance: any) => sum + balance.balance,
          0,
        );
        const totalUsdValue = vermData.totalUsdValue;

        // Update VERM holdings
        profile.vermHoldings = {
          total: totalVerm,
          staked: profile.vermHoldings.staked || 0, // Keep existing staked amount
          tier: calculateTier(totalUsdValue),
          qualified: totalUsdValue >= 25,
        };

        // Update XP based on holdings
        const xpBonus = Math.floor(totalVerm / 100); // 1 XP per 100 VERM
        profile.reputation.xp = Math.max(profile.reputation.xp, xpBonus);

        // Calculate level
        profile.reputation.level = Math.floor(profile.reputation.xp / 100) + 1;
        profile.reputation.nextLevelXp = profile.reputation.level * 100;

        // Update badges based on holdings
        updateBadges(profile, totalVerm, totalUsdValue);
      }
    }

    // Update activity metrics from scan history
    const activity = userActivity.get(wallet) || [];
    profile.totalScans = activity.filter((a) => a.type === "scan").length;
    profile.successfulScans = activity.filter(
      (a) => a.type === "scan" && a.success,
    ).length;
    profile.threatsDetected = activity.filter(
      (a) => a.type === "scan" && a.threatsFound > 0,
    ).length;
    profile.alphaSignalsFound = activity.filter(
      (a) => a.type === "scan" && a.alphaSignals > 0,
    ).length;
  } catch (error) {
    console.error("Error updating profile metrics:", error);
  }
}

function calculateTier(usdValue: number): string {
  if (usdValue >= 10000) return "legend";
  if (usdValue >= 1000) return "whale";
  if (usdValue >= 25) return "holder";
  return "demo";
}

function updateBadges(profile: any, vermAmount: number, usdValue: number) {
  const badges = new Set(profile.reputation.badges);

  // Remove rookie badge if user has VERM
  if (vermAmount > 0) {
    badges.delete("rookie_hunter");
    badges.add("verm_holder");
  }

  // Tier badges
  if (usdValue >= 25) badges.add("qualified_scanner");
  if (usdValue >= 100) badges.add("active_hunter");
  if (usdValue >= 1000) badges.add("whale_status");
  if (usdValue >= 10000) badges.add("legend_tier");

  // Activity badges
  if (profile.totalScans >= 10) badges.add("scan_veteran");
  if (profile.totalScans >= 100) badges.add("scan_master");
  if (profile.threatsDetected >= 5) badges.add("threat_hunter");
  if (profile.alphaSignalsFound >= 3) badges.add("alpha_detective");

  profile.reputation.badges = Array.from(badges);
}

export const config: Config = {
  path: "/api/user/profile",
};
