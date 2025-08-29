import { Request, Response, Router } from "express";
import { rateLimit } from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { twitterAuthService } from '../services/TwitterAuthService';
import { telegramAuthService } from '../services/TelegramAuthService';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: { error: "Too many authentication attempts, please try again later." },
});

// Store for OAuth state management (in production, use Redis or database)
const oauthStates = new Map<string, { userId: string; timestamp: number; oauth_token_secret: string }>();

// Cleanup expired states
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes expiry
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

/**
 * Generate state parameter for OAuth
 */
function generateState(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
}

// POST /api/auth/twitter/initiate
router.post(
  "/twitter/initiate",
  authLimiter,
  [
    body("userId")
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage("User ID is required"),
    body("taskId")
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage("Invalid task ID"),
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

      const { userId, taskId } = req.body;

      // Generate OAuth authorization URL
      const authResult = await twitterAuthService.generateAuthUrl();
      
      // Store state for callback verification
      const state = generateState();
      oauthStates.set(state, {
        userId,
        timestamp: Date.now(),
        oauth_token_secret: authResult.oauth_token_secret
      });

      res.json({
        success: true,
        data: {
          authUrl: `${authResult.url}&state=${state}`,
          oauth_token: authResult.oauth_token,
          state,
          taskId
        }
      });

    } catch (error) {
      console.error("Twitter OAuth initiation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to initiate Twitter authentication",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// GET /api/auth/twitter/callback
router.get("/twitter/callback", async (req: Request, res: Response) => {
  try {
    const { oauth_token, oauth_verifier, denied, state } = req.query;

    // Handle user denial
    if (denied) {
      return res.redirect(`${process.env.CLIENT_URL}/airdrop?error=twitter_denied`);
    }

    // Validate required parameters
    if (!oauth_token || !oauth_verifier || !state) {
      return res.redirect(`${process.env.CLIENT_URL}/airdrop?error=missing_params`);
    }

    // Verify state and get stored data
    const stateData = oauthStates.get(state as string);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/airdrop?error=invalid_state`);
    }

    // Clean up used state
    oauthStates.delete(state as string);

    // Complete OAuth flow
    const authResult = await twitterAuthService.handleCallback(
      oauth_token as string,
      oauth_verifier as string,
      stateData.oauth_token_secret
    );

    // Verify Twitter follow status
    const followVerification = await twitterAuthService.verifyFollowing(
      authResult.accessToken,
      authResult.accessSecret,
      'nimrevxyz'
    );

    // Create session token or return verification data
    const verificationToken = Buffer.from(JSON.stringify({
      userId: stateData.userId,
      platform: 'twitter',
      accessToken: authResult.accessToken,
      accessSecret: authResult.accessSecret,
      userData: authResult.user,
      followVerification,
      timestamp: Date.now()
    })).toString('base64');

    // Redirect back to client with success
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/airdrop?twitter_auth=success&token=${verificationToken}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error("Twitter OAuth callback error:", error);
    res.redirect(`${process.env.CLIENT_URL}/airdrop?error=auth_failed`);
  }
});

// POST /api/auth/twitter/verify-follow
router.post(
  "/twitter/verify-follow",
  authLimiter,
  [
    body("accessToken").isString().withMessage("Access token is required"),
    body("accessSecret").isString().withMessage("Access secret is required"),
    body("userId").isString().withMessage("User ID is required"),
    body("targetUsername").optional().isString().withMessage("Invalid target username"),
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

      const { accessToken, accessSecret, userId, targetUsername = 'nimrevxyz' } = req.body;

      // Verify follow status
      const verification = await twitterAuthService.verifyFollowing(
        accessToken,
        accessSecret,
        targetUsername
      );

      res.json({
        success: true,
        data: {
          isFollowing: verification.isFollowing,
          userData: verification.userData,
          error: verification.error
        }
      });

    } catch (error) {
      console.error("Twitter follow verification error:", error);
      res.status(500).json({
        success: false,
        error: "Follow verification failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// POST /api/auth/telegram/verify-membership
router.post(
  "/telegram/verify-membership",
  authLimiter,
  [
    body("telegramUserId").isNumeric().withMessage("Telegram user ID must be numeric"),
    body("userId").isString().withMessage("User ID is required"),
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

      const { telegramUserId, userId } = req.body;

      // Verify group membership
      const verification = await telegramAuthService.verifyGroupMembership(
        parseInt(telegramUserId)
      );

      res.json({
        success: true,
        data: {
          isMember: verification.isMember,
          memberStatus: verification.memberStatus,
          userData: verification.userData,
          error: verification.error
        }
      });

    } catch (error) {
      console.error("Telegram membership verification error:", error);
      res.status(500).json({
        success: false,
        error: "Membership verification failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// POST /api/auth/telegram/verify-auth
router.post(
  "/telegram/verify-auth",
  authLimiter,
  [
    body("authData").isObject().withMessage("Telegram auth data is required"),
    body("botToken").isString().withMessage("Bot token is required"),
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

      const { authData, botToken } = req.body;

      // Verify Telegram auth data
      const isValid = telegramAuthService.verifyTelegramAuth(authData, botToken);

      if (isValid) {
        // Additional verification: check group membership
        const membershipVerification = await telegramAuthService.verifyGroupMembership(
          authData.id
        );

        res.json({
          success: true,
          data: {
            isValid: true,
            userData: authData,
            membershipVerification
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid Telegram authentication data"
        });
      }

    } catch (error) {
      console.error("Telegram auth verification error:", error);
      res.status(500).json({
        success: false,
        error: "Authentication verification failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// GET /api/auth/telegram/group-info
router.get("/telegram/group-info", async (req: Request, res: Response) => {
  try {
    const groupInfo = await telegramAuthService.getChatInfo('@nimrevxyz');
    const memberCount = await telegramAuthService.getChatMemberCount('@nimrevxyz');

    res.json({
      success: true,
      data: {
        groupInfo,
        memberCount,
        joinLink: telegramAuthService.generateGroupJoinLink()
      }
    });

  } catch (error) {
    console.error("Failed to get Telegram group info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get group information"
    });
  }
});

// POST /api/auth/validate-credentials
router.post("/validate-credentials", async (req: Request, res: Response) => {
  try {
    const twitterValid = await twitterAuthService.validateCredentials();
    const telegramValidation = await telegramAuthService.validateConfiguration();

    res.json({
      success: true,
      data: {
        twitter: { valid: twitterValid },
        telegram: telegramValidation
      }
    });

  } catch (error) {
    console.error("Credential validation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate credentials"
    });
  }
});

export default router;
