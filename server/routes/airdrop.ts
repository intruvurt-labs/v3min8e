import { Request, Response, Router } from "express";
import { rateLimit } from "express-rate-limit";
import { body, validationResult } from "express-validator";

const router = Router();

// Rate limiting for airdrop endpoints
const airdropLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: "Too many verification attempts, please try again later." },
});

const botTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit bot token verification attempts
  message: {
    error: "Too many bot token verification attempts, please try again later.",
  },
});

const statsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Allow 30 requests per minute (one every 2 seconds)
  message: { error: "Too many stats requests, please try again later." },
});

const readOnlyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Allow 50 requests per 5 minutes for read-only endpoints
  message: { error: "Too many requests, please try again later." },
});

// Interface for bot token verification
interface BotTokenVerification {
  token: string;
  userId: string;
  walletAddress?: string;
}

// Interface for task verification
interface TaskVerification {
  taskId: string;
  userId: string;
  walletAddress?: string;
  proof?: any;
}

// Validate Telegram Bot Token format
const isValidBotToken = (token: string): boolean => {
  // Telegram bot tokens follow the format: {bot_id}:{auth_token}
  // bot_id is a number, auth_token is 35 characters of alphanumeric and special chars
  const botTokenRegex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
  return botTokenRegex.test(token);
};

// Verify bot token with Telegram API
const verifyTelegramBot = async (
  token: string,
): Promise<{ valid: boolean; botInfo?: any }> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.ok && data.result) {
      return {
        valid: true,
        botInfo: {
          id: data.result.id,
          username: data.result.username,
          firstName: data.result.first_name,
          canJoinGroups: data.result.can_join_groups,
          canReadAllGroupMessages: data.result.can_read_all_group_messages,
          supportsInlineQueries: data.result.supports_inline_queries,
        },
      };
    } else {
      return { valid: false };
    }
  } catch (error) {
    console.error("Telegram bot verification error:", error);
    return { valid: false };
  }
};

// POST /api/airdrop/verify-bot-token
router.post(
  "/verify-bot-token",
  botTokenLimiter,
  [
    body("token")
      .isString()
      .isLength({ min: 35, max: 50 })
      .withMessage("Invalid bot token format"),
    body("userId")
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage("User ID is required"),
    body("walletAddress")
      .optional()
      .isString()
      .isLength({ min: 32, max: 44 })
      .withMessage("Invalid wallet address format"),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { token, userId, walletAddress } = req.body as BotTokenVerification;

      // Validate token format
      if (!isValidBotToken(token)) {
        return res.status(400).json({
          success: false,
          error: "Invalid bot token format",
          message:
            "Bot token must follow Telegram format: {bot_id}:{auth_token}",
        });
      }

      // Verify with Telegram API
      const verification = await verifyTelegramBot(token);

      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          error: "Bot token verification failed",
          message:
            "The provided bot token is invalid or the bot is not accessible",
        });
      }

      // Check if bot has required permissions
      const botInfo = verification.botInfo;
      if (!botInfo.canJoinGroups) {
        return res.status(400).json({
          success: false,
          error: "Insufficient bot permissions",
          message: "Bot must be able to join groups for verification",
        });
      }

      // Store verification result (in production, this would go to a database)
      const verificationRecord = {
        userId,
        walletAddress,
        botToken: token.substring(0, 10) + "..." + token.slice(-4), // Store only partial token for security
        botInfo: {
          id: botInfo.id,
          username: botInfo.username,
          firstName: botInfo.firstName,
        },
        verifiedAt: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      };

      // Log successful verification
      console.log("Bot token verified successfully:", {
        userId,
        botUsername: botInfo.username,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "Bot token verified successfully",
        data: {
          botInfo: {
            username: botInfo.username,
            firstName: botInfo.firstName,
            canJoinGroups: botInfo.canJoinGroups,
            canReadAllGroupMessages: botInfo.canReadAllGroupMessages,
            supportsInlineQueries: botInfo.supportsInlineQueries,
          },
          verifiedAt: verificationRecord.verifiedAt,
          reward: 200, // VERM tokens
          multiplier: 2,
        },
      });
    } catch (error) {
      console.error("Bot token verification error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An error occurred during bot token verification",
      });
    }
  },
);

// POST /api/airdrop/verify-task
router.post(
  "/verify-task",
  airdropLimiter,
  [
    body("taskId")
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage("Task ID is required"),
    body("userId")
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage("User ID is required"),
    body("walletAddress")
      .optional()
      .isString()
      .isLength({ min: 32, max: 44 })
      .withMessage("Invalid wallet address format"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { taskId, userId, walletAddress, proof } =
        req.body as TaskVerification;

      // Simulate task verification based on task type
      let verificationResult = { success: false, reward: 0 };

      switch (taskId) {
        case "follow_twitter":
          // In production, this would check Twitter API
          verificationResult = { success: true, reward: 50 };
          break;

        case "join_telegram":
          // In production, this would check Telegram group membership
          verificationResult = { success: true, reward: 50 };
          break;

        case "first_scan":
          // In production, this would check scan history
          verificationResult = { success: true, reward: 100 };
          break;

        case "daily_scan_streak":
          // In production, this would check blockchain data
          verificationResult = { success: true, reward: 500 };
          break;

        case "stake_100_verm":
          // In production, this would check staking contract
          if (walletAddress) {
            verificationResult = { success: true, reward: 300 };
          }
          break;

        case "refer_5_users":
          // In production, this would check referral database
          verificationResult = { success: true, reward: 750 };
          break;

        case "premium_trade":
          // In production, this would check trading history
          verificationResult = { success: true, reward: 400 };
          break;

        case "legendary_hunter":
          // In production, this would check all requirements
          verificationResult = { success: true, reward: 2000 };
          break;

        default:
          return res.status(400).json({
            success: false,
            error: "Unknown task",
            message: "The specified task ID is not recognized",
          });
      }

      if (verificationResult.success) {
        // Log successful task completion
        console.log("Task completed successfully:", {
          taskId,
          userId,
          reward: verificationResult.reward,
          timestamp: new Date().toISOString(),
        });

        res.json({
          success: true,
          message: "Task verified successfully",
          data: {
            taskId,
            reward: verificationResult.reward,
            completedAt: new Date().toISOString(),
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Task verification failed",
          message: "Unable to verify task completion",
        });
      }
    } catch (error) {
      console.error("Task verification error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An error occurred during task verification",
      });
    }
  },
);

// GET /api/airdrop/leaderboard
router.get(
  "/leaderboard",
  airdropLimiter,
  async (req: Request, res: Response) => {
    try {
      // In production, this would fetch from database
      const mockLeaderboard = [
        {
          rank: 1,
          userId: "user_1",
          username: "VermExterminator",
          avatar: "🏆",
          totalEarned: 15420,
          tasksCompleted: 28,
          streak: 45,
          lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        },
        {
          rank: 2,
          userId: "user_2",
          username: "ScanMaster_Pro",
          avatar: "🥈",
          totalEarned: 12750,
          tasksCompleted: 24,
          streak: 32,
          lastActive: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        },
        {
          rank: 3,
          userId: "user_3",
          username: "CryptoHunter",
          avatar: "🥉",
          totalEarned: 11200,
          tasksCompleted: 22,
          streak: 28,
          lastActive: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        },
        {
          rank: 4,
          userId: "user_4",
          username: "DataGhost_01",
          avatar: "👻",
          totalEarned: 9840,
          tasksCompleted: 19,
          streak: 25,
          lastActive: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        },
        {
          rank: 5,
          userId: "user_5",
          username: "NimRev_Alpha",
          avatar: "⚡",
          totalEarned: 8650,
          tasksCompleted: 17,
          streak: 22,
          lastActive: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        },
      ];

      res.json({
        success: true,
        data: {
          leaderboard: mockLeaderboard,
          totalParticipants: 1247,
          totalRewardsDistributed: 2400000,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Leaderboard fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Unable to fetch leaderboard data",
      });
    }
  },
);

// GET /api/airdrop/stats
router.get("/stats", statsLimiter, async (req: Request, res: Response) => {
  try {
    // Get real-time stats (in production, these would come from database)
    const baseTime = Math.floor(Date.now() / 1000);
    const stats = {
      totalVermDetected: 2938402 + (baseTime % 10000), // Incremental real-time detection
      activeHunters: 1247 + (baseTime % 100), // Dynamic active users
      totalRewards: 2400000 + (baseTime % 50000), // Growing reward pool
      successRate: 72.4 + (Math.sin(baseTime / 1000) * 2), // Fluctuating success rate
      averageScanTime: 12 + (Math.cos(baseTime / 500) * 3), // Variable scan times
      threatsBlocked: 2847 + (baseTime % 200), // Increasing threats blocked
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Unable to fetch statistics",
    });
  }
});

// GET /api/airdrop/user-progress/:userId
router.get(
  "/user-progress/:userId",
  airdropLimiter,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      // In production, fetch from database
      const mockProgress = {
        userId,
        totalEarned: Math.floor(Math.random() * 5000),
        tasksCompleted: Math.floor(Math.random() * 10),
        currentStreak: Math.floor(Math.random() * 30),
        multiplierActive: Math.random() > 0.5,
        rank: "Vermin Hunter",
        nextMilestone: 1000,
        referralCount: Math.floor(Math.random() * 10),
        botTokenVerified: Math.random() > 0.7,
        completedTasks: ["follow_twitter", "join_telegram", "first_scan"],
        lastActive: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: mockProgress,
      });
    } catch (error) {
      console.error("User progress fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Unable to fetch user progress",
      });
    }
  },
);

export default router;
