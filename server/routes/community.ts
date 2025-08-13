import { RequestHandler } from "express";

interface FlaggedAddress {
  id: string;
  address: string;
  network: string;
  reason: string;
  submittedBy: string;
  timestamp: number;
  status: "pending" | "verified" | "rejected";
  bounty: number;
  voters: number;
  votes: { wallet: string; vote: "verify" | "reject"; timestamp: number }[];
}

interface LeaderboardUser {
  id: string;
  wallet: string;
  displayName?: string;
  totalFlags: number;
  verifiedFlags: number;
  accuracy: number;
  totalRewards: number;
  level: number;
  referrals: number;
  rank: number;
  trending: "up" | "down" | "same";
  lastActivity: number;
}

// In-memory storage (in production, use database)
const flaggedAddresses = new Map<string, FlaggedAddress>();
const leaderboard = new Map<string, LeaderboardUser>();
const referralCodes = new Map<string, string>(); // referralCode -> wallet

// Initialize some mock data
const initializeMockData = () => {
  // Mock leaderboard entries
  const mockUsers = [
    {
      id: "1",
      wallet: "4XygsJdgpKRqvAuyyyXczDQRDxuSeumns7RA3Ak1RZpf",
      displayName: "CryptoRat",
      totalFlags: 247,
      verifiedFlags: 231,
      accuracy: 93.5,
      totalRewards: 15420,
      level: 42,
      referrals: 18,
      rank: 1,
      trending: "up" as const,
      lastActivity: Date.now(),
    },
    {
      id: "2",
      wallet: "7NtgNM8KxwQJYyE2jTbQwz9QzFH5uNpV2xR8sK3mW1pA",
      displayName: "ScamHunter",
      totalFlags: 189,
      verifiedFlags: 174,
      accuracy: 92.1,
      totalRewards: 12850,
      level: 38,
      referrals: 12,
      rank: 2,
      trending: "same" as const,
      lastActivity: Date.now() - 3600000,
    },
  ];

  mockUsers.forEach((user) => {
    leaderboard.set(user.wallet, user);
  });
};

initializeMockData();

export const handleFlagSubmission: RequestHandler = async (req, res) => {
  try {
    const { address, network, reason, wallet } = req.body;

    if (!address || !network || !reason || !wallet) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: address, network, reason, wallet",
      });
    }

    // Check if address already flagged
    const existingFlag = Array.from(flaggedAddresses.values()).find(
      (flag) =>
        flag.address.toLowerCase() === address.toLowerCase() &&
        flag.network === network,
    );

    if (existingFlag) {
      return res.status(409).json({
        success: false,
        error: "Address already flagged",
      });
    }

    // Create new flag
    const flagId = `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFlag: FlaggedAddress = {
      id: flagId,
      address: address.toLowerCase(),
      network,
      reason,
      submittedBy: wallet,
      timestamp: Date.now(),
      status: "pending",
      bounty: calculateBounty(reason),
      voters: 0,
      votes: [],
    };

    flaggedAddresses.set(flagId, newFlag);

    // Update user stats
    updateUserStats(wallet, "flag_submitted");

    res.json({
      success: true,
      data: {
        flagId,
        bounty: newFlag.bounty,
        message:
          "Flag submitted successfully! Community voting will determine verification.",
      },
    });
  } catch (error) {
    console.error("Flag submission error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const handleVoteOnFlag: RequestHandler = async (req, res) => {
  try {
    const { flagId, vote, wallet } = req.body;

    if (!flagId || !vote || !wallet) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: flagId, vote, wallet",
      });
    }

    const flag = flaggedAddresses.get(flagId);
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: "Flag not found",
      });
    }

    if (flag.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Flag is no longer pending",
      });
    }

    // Check if user already voted
    const existingVote = flag.votes.find((v) => v.wallet === wallet);
    if (existingVote) {
      return res.status(409).json({
        success: false,
        error: "You have already voted on this flag",
      });
    }

    // Add vote
    flag.votes.push({
      wallet,
      vote: vote as "verify" | "reject",
      timestamp: Date.now(),
    });
    flag.voters++;

    // Check if enough votes to make decision (5 votes minimum)
    if (flag.votes.length >= 5) {
      const verifyVotes = flag.votes.filter((v) => v.vote === "verify").length;
      const rejectVotes = flag.votes.filter((v) => v.vote === "reject").length;

      if (verifyVotes > rejectVotes) {
        flag.status = "verified";
        // Award bounty to submitter
        updateUserStats(flag.submittedBy, "flag_verified", flag.bounty);
        // Award voting rewards
        flag.votes.forEach((vote) => {
          if (vote.vote === "verify") {
            updateUserStats(vote.wallet, "correct_vote", 10);
          }
        });
      } else {
        flag.status = "rejected";
        // Penalize submitter
        updateUserStats(flag.submittedBy, "flag_rejected");
        // Award voting rewards to correct voters
        flag.votes.forEach((vote) => {
          if (vote.vote === "reject") {
            updateUserStats(vote.wallet, "correct_vote", 10);
          }
        });
      }
    }

    flaggedAddresses.set(flagId, flag);

    res.json({
      success: true,
      data: {
        flag,
        message: "Vote recorded successfully",
      },
    });
  } catch (error) {
    console.error("Vote submission error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const handleGetLeaderboard: RequestHandler = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const sortedUsers = Array.from(leaderboard.values())
      .sort((a, b) => b.totalRewards - a.totalRewards)
      .map((user, index) => ({ ...user, rank: index + 1 }))
      .slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: {
        leaderboard: sortedUsers,
        total: leaderboard.size,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const handleGetPendingFlags: RequestHandler = async (req, res) => {
  try {
    const { wallet } = req.query;

    const pendingFlags = Array.from(flaggedAddresses.values())
      .filter((flag) => flag.status === "pending")
      .filter((flag) =>
        wallet ? !flag.votes.some((v) => v.wallet === wallet) : true,
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        flags: pendingFlags,
      },
    });
  } catch (error) {
    console.error("Pending flags error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const handleReferralRegistration: RequestHandler = async (req, res) => {
  try {
    const { wallet, referralCode } = req.body;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        error: "Wallet address required",
      });
    }

    // Generate referral code for user
    const userReferralCode = wallet.slice(0, 8).toUpperCase();
    referralCodes.set(userReferralCode, wallet);

    let referredBy = null;
    if (referralCode && referralCodes.has(referralCode)) {
      referredBy = referralCodes.get(referralCode);
      // Award referral bonus
      if (referredBy !== wallet) {
        updateUserStats(referredBy, "referral_bonus", 2000);
      }
    }

    // Initialize user if not exists
    if (!leaderboard.has(wallet)) {
      const newUser: LeaderboardUser = {
        id: wallet,
        wallet,
        totalFlags: 0,
        verifiedFlags: 0,
        accuracy: 0,
        totalRewards: 0,
        level: 1,
        referrals: 0,
        rank: leaderboard.size + 1,
        trending: "same",
        lastActivity: Date.now(),
      };
      leaderboard.set(wallet, newUser);
    }

    res.json({
      success: true,
      data: {
        userReferralCode,
        referredBy,
        message: referredBy
          ? "Welcome! Referral bonus awarded to your referrer."
          : "Welcome to the community!",
      },
    });
  } catch (error) {
    console.error("Referral registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Helper functions
function calculateBounty(reason: string): number {
  const bounties = {
    honeypot: 200,
    rug_pull: 150,
    fake_token: 100,
    phishing: 175,
    exploit: 250,
    pump_dump: 125,
    other: 75,
  };
  return bounties[reason as keyof typeof bounties] || 50;
}

function updateUserStats(wallet: string, action: string, reward: number = 0) {
  let user = leaderboard.get(wallet);

  if (!user) {
    user = {
      id: wallet,
      wallet,
      totalFlags: 0,
      verifiedFlags: 0,
      accuracy: 0,
      totalRewards: 0,
      level: 1,
      referrals: 0,
      rank: leaderboard.size + 1,
      trending: "same",
      lastActivity: Date.now(),
    };
  }

  switch (action) {
    case "flag_submitted":
      user.totalFlags++;
      break;
    case "flag_verified":
      user.verifiedFlags++;
      user.totalRewards += reward;
      break;
    case "flag_rejected":
      // Small penalty for false flags
      user.totalRewards = Math.max(0, user.totalRewards - 10);
      break;
    case "correct_vote":
      user.totalRewards += reward;
      break;
    case "referral_bonus":
      user.referrals++;
      user.totalRewards += reward;
      break;
  }

  // Update accuracy
  if (user.totalFlags > 0) {
    user.accuracy = (user.verifiedFlags / user.totalFlags) * 100;
  }

  // Update level (every 1000 VERM earned = 1 level)
  user.level = Math.floor(user.totalRewards / 1000) + 1;
  user.lastActivity = Date.now();

  leaderboard.set(wallet, user);
}
