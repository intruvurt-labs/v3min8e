import { RequestHandler } from "express";
import { z } from "zod";

// Newsletter subscription validation schema
const NewsletterSubscriptionSchema = z.object({
  email: z.string().email("Invalid email address"),
  frequency: z.enum(["weekly", "biweekly"], {
    errorMap: () => ({ message: "Frequency must be weekly or biweekly" })
  }),
});

export type NewsletterSubscriptionData = z.infer<typeof NewsletterSubscriptionSchema>;

export interface NewsletterResponse {
  success: boolean;
  message: string;
  subscriptionId?: string;
}

// Generate subscription confirmation message
const generateConfirmationMessage = (
  data: NewsletterSubscriptionData,
  subscriptionId: string,
): string => {
  const frequencyText = data.frequency === "weekly" ? "Weekly" : "Bi-weekly";
  
  return `
╔═══════════════════════════════════════════════════════════════╗
║                    NIMREV SECURITY INTELLIGENCE              ║
║                    Subscription Confirmed                    ║
╚═══════════════════════════════════════════════════════════════╝

Welcome to the NimRev Security Intelligence Network, Ghost.

Your subscription to our security intelligence updates has been confirmed.

┌─ SUBSCRIPTION DETAILS ────────────────────────────���─────────┐
│ Email:          ${data.email}
│ Frequency:      ${frequencyText} Updates
│ Subscription:   ${subscriptionId}
│ Activated:      ${new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })}
│ Status:         ACTIVE
└──────────────────────────────────────────────────────────────┘

┌─ WHAT TO EXPECT ─────────────────────────────────────────────┐
│
│ 🔍 Threat Intelligence: Latest blockchain security threats
│ 🚨 Alpha Signals: Early detection of high-risk projects
│ 🛡️ Protection Updates: New security patterns and defenses
│ 📊 Market Analysis: DeFi security trends and insights
│ 🐀 Vermin Reports: Exclusive intelligence from the underground
│
│ Next Update: ${data.frequency === "weekly" 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()
  }
│
└───��──────────────────────────────────────────────────────────┘

┌─ SECURITY REMINDER ──────────────────────────────────────────┐
│
│ • Never share your wallet private keys
│ • Always verify contract addresses independently
│ • Our intelligence is informational, not financial advice
│ • Stay vigilant - trust but verify everything
│
└──────────────────────────────────────────────────────────────┘

┌─ MANAGE SUBSCRIPTION ────────────────────────────────────────┐
│
│ Update Preferences: https://nimrev.xyz/newsletter/manage
│ Unsubscribe: https://nimrev.xyz/newsletter/unsubscribe?id=${subscriptionId}
│ Contact Support: verm@nimrev.xyz
│
└──────────────────────────────────────────────────────────────┘

In a world full of bots, be the Ghost.

---
NimRev Security Intelligence Network
Powered by the underground
`.trim();
};

export const handleNewsletterSubscription: RequestHandler = async (req, res) => {
  try {
    // Validate request body
    const validatedData = NewsletterSubscriptionSchema.parse(req.body);

    // Generate a unique subscription ID
    const crypto = require("crypto");
    const subscriptionId = `NR-SUB-${Date.now()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    // In production, this would:
    // 1. Store subscription in database
    // 2. Send to email service (Mailgun, SendGrid, etc.)
    // 3. Add to marketing automation
    
    // Log the subscription
    console.log("Newsletter Subscription:", {
      subscriptionId,
      email: validatedData.email,
      frequency: validatedData.frequency,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Generate confirmation email content
    const confirmationSubject = `[NimRev] Security Intelligence Subscription Confirmed`;
    const confirmationMessage = generateConfirmationMessage(validatedData, subscriptionId);

    // Log confirmation email (in production, this would send actual email)
    console.log("Newsletter Confirmation Email:", {
      to: validatedData.email,
      subject: confirmationSubject,
      message: confirmationMessage,
      timestamp: new Date().toISOString(),
    });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const response: NewsletterResponse = {
      success: true,
      message: `Welcome to the NimRev Security Intelligence Network! A confirmation email has been sent to ${validatedData.email}. You'll receive ${validatedData.frequency} security updates starting next week.`,
      subscriptionId,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(
      "Newsletter subscription error:",
      error instanceof Error ? error.message : error,
    );

    if (error instanceof z.ZodError) {
      const response: NewsletterResponse = {
        success: false,
        message: `Validation error: ${error.errors[0].message}`,
      };
      return res.status(400).json(response);
    }

    const response: NewsletterResponse = {
      success: false,
      message: "Failed to subscribe. Please try again later.",
    };

    res.status(500).json(response);
  }
};
