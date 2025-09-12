import { EventEmitter } from "events";
import { supabase, SupabaseHelper } from "../utils/supabase";
import { NimRevTelegramBot } from "./TelegramBot";
import {
  AlertType,
  BlockchainType,
  RecurringMessage,
} from "../../shared/nimrev-types";
import axios from "axios";

interface AlertConfig {
  id: string;
  platform: "telegram" | "discord" | "webhook" | "email";
  destination: string;
  riskThreshold: number;
  isActive: boolean;
  alertTypes: AlertType[];
  cooldownMinutes: number;
  lastSent?: Date;
}

interface GroupAlert {
  groupId: string;
  platform: "telegram" | "discord";
  message: string;
  alertType: AlertType;
  riskScore: number;
  targetAddress: string;
  blockchain: BlockchainType;
  timestamp: Date;
}

interface AlertTemplate {
  type: AlertType;
  templates: string[];
  urgencyLevel: "low" | "medium" | "high" | "critical";
  defaultCooldown: number;
}

export class AlertSystem extends EventEmitter {
  private telegramBot?: NimRevTelegramBot;
  private discordBot?: any; // Discord bot would be implemented similarly
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private recurringMessages: Map<string, RecurringMessage> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private isRunning = false;

  // Pre-defined alert templates
  private alertTemplates: Map<AlertType, AlertTemplate> = new Map([
    [
      "rug_pull",
      {
        type: "rug_pull",
        templates: [
          "🚨 RUG PULL ALERT\n\n🪤 Token: {symbol}\n📍 Address: `{address}`\n🌐 Blockchain: {blockchain}\n📊 Risk Score: {riskScore}/100\n\n⚠️ **IMMEDIATE ACTION REQUIRED** - This token shows critical rug pull indicators!",
          "🚨 URGENT: Potential rug pull detected!\n\n🎯 Target: {symbol} ({blockchain})\n📊 Risk: {riskScore}/100\n📍 Address: `{address}`\n\n❌ **DO NOT TRADE** - High probability of liquidity exit.",
          "🛑 RUG PULL WARNING\n\n💀 {symbol} on {blockchain}\n📉 Risk Score: {riskScore}/100\n🔗 `{address}`\n\n🚨 **DANGER** - Avoid this token immediately!",
        ],
        urgencyLevel: "critical",
        defaultCooldown: 5,
      },
    ],
    [
      "honeypot",
      {
        type: "honeypot",
        templates: [
          "🍯 HONEYPOT DETECTED\n\n🎯 Token: {symbol}\n📍 Address: `{address}`\n🌐 Blockchain: {blockchain}\n📊 Risk Score: {riskScore}/100\n\n⚠️ **WARNING** - This token cannot be sold!",
          "🍯 HONEYPOT ALERT!\n\n🪤 {symbol} ({blockchain})\n📊 Risk: {riskScore}/100\n📍 `{address}`\n\n❌ **CANNOT SELL** - Buying trap detected!",
          "🚫 HONEYPOT WARNING\n\n🍯 {symbol} on {blockchain}\n📈 Buy allowed, ❌ Sell blocked\n🔗 `{address}`",
        ],
        urgencyLevel: "high",
        defaultCooldown: 10,
      },
    ],
    [
      "high_fees",
      {
        type: "high_fees",
        templates: [
          "💸 HIGH FEES DETECTED\n\n🎯 Token: {symbol}\n📍 Address: `{address}`\n🌐 Blockchain: {blockchain}\n💰 Fee: {feePercentage}%\n\n⚠️ **CAUTION** - Excessive transaction fees detected!",
          "💸 FEE WARNING\n\n🏷️ {symbol} ({blockchain})\n💰 Transaction fee: {feePercentage}%\n📍 `{address}`\n\n⚠️ High fees may impact profitability",
        ],
        urgencyLevel: "medium",
        defaultCooldown: 15,
      },
    ],
    [
      "liquidity_drain",
      {
        type: "liquidity_drain",
        templates: [
          "💧 LIQUIDITY DRAIN ALERT\n\n🎯 Token: {symbol}\n📍 Address: `{address}`\n🌐 Blockchain: {blockchain}\n📊 Liquidity removed: {percentage}%\n\n🚨 **URGENT** - Major liquidity removal detected!",
          "💧 LIQUIDITY WARNING\n\n⚠️ {symbol} ({blockchain})\n📉 {percentage}% liquidity removed\n📍 `{address}`\n\n🚨 Potential rug pull in progress!",
        ],
        urgencyLevel: "critical",
        defaultCooldown: 3,
      },
    ],
    [
      "mint_authority",
      {
        type: "mint_authority",
        templates: [
          "🪙 MINT AUTHORITY RISK\n\n🎯 Token: {symbol}\n📍 Address: `{address}`\n🌐 Blockchain: {blockchain}\n📊 Risk Score: {riskScore}/100\n\n⚠️ **WARNING** - Unlimited minting capability detected!",
          "🪙 MINT RISK ALERT\n\n⚠️ {symbol} ({blockchain})\n🏭 Unrestricted minting detected\n📍 `{address}`\n\n🚨 Supply can be inflated at will!",
        ],
        urgencyLevel: "medium",
        defaultCooldown: 20,
      },
    ],
    [
      "social_red_flag",
      {
        type: "social_red_flag",
        templates: [
          "📱 SOCIAL RED FLAGS\n\n🎯 Token: {symbol}\n📍 Address: `{address}`\n🌐 Blockchain: {blockchain}\n🚩 Red flags: {flagCount}\n\n⚠️ **CAUTION** - Suspicious social media activity!",
          "📱 SOCIAL WARNING\n\n🚩 {symbol} ({blockchain})\n📊 {flagCount} red flags detected\n📍 `{address}`\n\n⚠️ Be cautious of social engineering",
        ],
        urgencyLevel: "low",
        defaultCooldown: 30,
      },
    ],
    [
      "cross_chain_scam",
      {
        type: "cross_chain_scam",
        templates: [
          "🌐 CROSS-CHAIN SCAM ALERT\n\n🎯 Token: {symbol}\n📍 Address: `{address}`\n🌐 Blockchain: {blockchain}\n🔗 Related scams: {relatedCount}\n\n🚨 **DANGER** - Part of multi-chain scam operation!",
          "🌐 MULTI-CHAIN THREAT\n\n⚠️ {symbol} ({blockchain})\n🔗 {relatedCount} related scams\n📍 `{address}`\n\n🚨 Same actors across chains!",
        ],
        urgencyLevel: "high",
        defaultCooldown: 10,
      },
    ],
  ]);

  constructor(telegramBot?: NimRevTelegramBot) {
    super();
    this.telegramBot = telegramBot;
  }

  public async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("📢 Starting Alert System");

    // Load alert configurations
    await this.loadAlertConfigs();
    await this.loadRecurringMessages();

    // Start recurring message scheduler
    this.startRecurringMessageScheduler();

    console.log("✅ Alert System started");
  }

  public async stop() {
    this.isRunning = false;
    console.log("🛑 Alert System stopped");
  }

  private async loadAlertConfigs() {
    try {
      // Load alert configurations from database
      // This would be stored in a separate alerts_config table
      console.log("📋 Loaded alert configurations");
    } catch (error) {
      console.error("Failed to load alert configs:", error);
    }
  }

  private async loadRecurringMessages() {
    try {
      const { data: messages, error } = await supabase
        .from("recurring_messages")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      this.recurringMessages.clear();
      for (const message of messages || []) {
        this.recurringMessages.set(message.id, message);
      }

      console.log(
        `📋 Loaded ${messages?.length || 0} recurring message configs`,
      );
    } catch (error) {
      console.error("Failed to load recurring messages:", error);
    }
  }

  public async sendAlert(alertData: {
    type: AlertType;
    targetAddress: string;
    blockchain: BlockchainType;
    riskScore: number;
    tokenSymbol?: string;
    additionalData?: any;
    recipients?: string[];
  }) {
    try {
      const template = this.alertTemplates.get(alertData.type);
      if (!template) {
        console.warn(`No template found for alert type: ${alertData.type}`);
        return;
      }

      // Select random template to avoid repetition
      const messageTemplate =
        template.templates[
          Math.floor(Math.random() * template.templates.length)
        ];

      // Format message with data
      const message = this.formatAlertMessage(messageTemplate, alertData);

      // Determine recipients
      const recipients =
        alertData.recipients ||
        (await this.getRecipientsForAlert(alertData.type, alertData.riskScore));

      // Send to each recipient
      for (const recipient of recipients) {
        const canSend = this.checkCooldown(
          recipient,
          alertData.type,
          template.defaultCooldown,
        );

        if (canSend) {
          await this.sendToRecipient(recipient, message, alertData);
          this.updateCooldown(recipient, alertData.type);
        }
      }

      // Log alert
      await SupabaseHelper.logAlert({
        alert_type: alertData.type,
        target_address: alertData.targetAddress,
        blockchain: alertData.blockchain,
        risk_score: alertData.riskScore,
        alert_data: alertData.additionalData || {},
        recipients,
      });

      this.emit("alertSent", { ...alertData, recipients, message });
      console.log(
        `📢 Alert sent: ${alertData.type} to ${recipients.length} recipients`,
      );
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
  }

  private formatAlertMessage(template: string, data: any): string {
    let message = template;

    // Replace placeholders
    message = message.replace("{symbol}", data.tokenSymbol || "Unknown");
    message = message.replace("{address}", data.targetAddress);
    message = message.replace("{blockchain}", data.blockchain.toUpperCase());
    message = message.replace("{riskScore}", data.riskScore.toString());

    // Additional data replacements
    if (data.additionalData) {
      message = message.replace(
        "{feePercentage}",
        data.additionalData.feePercentage || "0",
      );
      message = message.replace(
        "{percentage}",
        data.additionalData.percentage || "0",
      );
      message = message.replace(
        "{flagCount}",
        data.additionalData.flagCount || "0",
      );
      message = message.replace(
        "{relatedCount}",
        data.additionalData.relatedCount || "0",
      );
    }

    // Add timestamp
    message += `\n\n⏰ Detected: ${new Date().toLocaleString()} UTC`;

    return message;
  }

  private async getRecipientsForAlert(
    alertType: AlertType,
    riskScore: number,
  ): Promise<string[]> {
    try {
      // Get groups that want this type of alert based on their risk threshold
      const { data: groups, error } = await supabase
        .from("recurring_messages")
        .select("group_id, platform, risk_threshold")
        .eq("is_active", true)
        .lte("risk_threshold", riskScore);

      if (error) throw error;

      return (groups || []).map(
        (group) => `${group.platform}:${group.group_id}`,
      );
    } catch (error) {
      console.error("Failed to get recipients:", error);
      return [];
    }
  }

  private checkCooldown(
    recipient: string,
    alertType: AlertType,
    cooldownMinutes: number,
  ): boolean {
    const key = `${recipient}:${alertType}`;
    const lastSent = this.alertCooldowns.get(key);

    if (!lastSent) return true;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceLastSent = Date.now() - lastSent.getTime();

    return timeSinceLastSent >= cooldownMs;
  }

  private updateCooldown(recipient: string, alertType: AlertType) {
    const key = `${recipient}:${alertType}`;
    this.alertCooldowns.set(key, new Date());
  }

  private async sendToRecipient(
    recipient: string,
    message: string,
    alertData: any,
  ) {
    const [platform, identifier] = recipient.split(":");

    try {
      switch (platform) {
        case "telegram":
          if (this.telegramBot) {
            await this.telegramBot.sendAlert(identifier, {
              alert_type: alertData.type,
              target_address: alertData.targetAddress,
              blockchain: alertData.blockchain,
              risk_score: alertData.riskScore,
              alert_data: alertData.additionalData || {},
            });
          }
          break;

        case "discord":
          await this.sendDiscordAlert(identifier, message, alertData);
          break;

        case "webhook":
          await this.sendWebhookAlert(identifier, message, alertData);
          break;

        case "email":
          await this.sendEmailAlert(identifier, message, alertData);
          break;

        default:
          console.warn(`Unknown alert platform: ${platform}`);
      }

      // Update delivery status
      await SupabaseHelper.updateAlertDeliveryStatus(
        alertData.alertId || "unknown",
        recipient,
        "sent",
      );
    } catch (error) {
      console.error(`Failed to send ${platform} alert:`, error);

      await SupabaseHelper.updateAlertDeliveryStatus(
        alertData.alertId || "unknown",
        recipient,
        "failed",
        error.message,
      );
    }
  }

  private async sendDiscordAlert(
    channelId: string,
    message: string,
    alertData: any,
  ) {
    // Discord webhook implementation
    try {
      // This would use Discord webhook or bot API
      console.log(`Discord alert to ${channelId}: ${alertData.type}`);
    } catch (error) {
      console.error("Discord alert failed:", error);
      throw error;
    }
  }

  private async sendWebhookAlert(
    webhookUrl: string,
    message: string,
    alertData: any,
  ) {
    try {
      const payload = {
        type: alertData.type,
        message,
        data: alertData,
        timestamp: new Date().toISOString(),
      };

      await axios.post(webhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NimRev-Scanner/1.0",
        },
        timeout: 10000,
      });
    } catch (error) {
      console.error("Webhook alert failed:", error);
      throw error;
    }
  }

  private async sendEmailAlert(email: string, message: string, alertData: any) {
    try {
      // Email implementation would go here
      // Could use services like SendGrid, AWS SES, etc.
      console.log(`Email alert to ${email}: ${alertData.type}`);
    } catch (error) {
      console.error("Email alert failed:", error);
      throw error;
    }
  }

  private startRecurringMessageScheduler() {
    setInterval(async () => {
      await this.processRecurringMessages();
    }, 60000); // Check every minute
  }

  private async processRecurringMessages() {
    if (!this.isRunning) return;

    try {
      const now = new Date();

      for (const [id, recurringMessage] of this.recurringMessages) {
        if (!recurringMessage.is_active) continue;

        const shouldSend = this.shouldSendRecurringMessage(
          recurringMessage,
          now,
        );

        if (shouldSend) {
          await this.sendRecurringMessage(recurringMessage);
        }
      }
    } catch (error) {
      console.error("Failed to process recurring messages:", error);
    }
  }

  private shouldSendRecurringMessage(
    message: RecurringMessage,
    now: Date,
  ): boolean {
    if (!message.last_sent) return true;

    const lastSent = new Date(message.last_sent);
    const intervalMs = message.interval_minutes * 60 * 1000;
    const timeSinceLastSent = now.getTime() - lastSent.getTime();

    return timeSinceLastSent >= intervalMs;
  }

  private async sendRecurringMessage(recurringMessage: RecurringMessage) {
    try {
      // Select random template
      const template =
        recurringMessage.message_templates[
          Math.floor(Math.random() * recurringMessage.message_templates.length)
        ];

      // Get recent threat summary for the message
      const threatSummary = await this.getThreatSummary(
        recurringMessage.risk_threshold,
      );

      // Format message with current data
      const message = this.formatRecurringMessage(template, threatSummary);

      // Send to group
      const recipient = `${recurringMessage.platform}:${recurringMessage.group_id}`;
      await this.sendToRecipient(recipient, message, {
        type: "recurring_update",
        alertId: recurringMessage.id,
      });

      // Update last sent time
      await supabase
        .from("recurring_messages")
        .update({
          last_sent: new Date().toISOString(),
          total_sent: recurringMessage.total_sent + 1,
        })
        .eq("id", recurringMessage.id);

      console.log(
        `📅 Sent recurring message to ${recurringMessage.platform}:${recurringMessage.group_id}`,
      );
    } catch (error) {
      console.error("Failed to send recurring message:", error);
    }
  }

  private async getThreatSummary(riskThreshold: number) {
    try {
      const { data: recentThreats } = await supabase
        .from("scan_results")
        .select("risk_score, threat_categories, blockchain")
        .lte("risk_score", riskThreshold)
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .eq("scan_status", "completed");

      return {
        totalThreats: recentThreats?.length || 0,
        highRiskCount:
          recentThreats?.filter((t) => t.risk_score <= 30).length || 0,
        topBlockchain: this.getTopBlockchain(recentThreats || []),
        topThreatType: this.getTopThreatType(recentThreats || []),
      };
    } catch (error) {
      console.error("Failed to get threat summary:", error);
      return {
        totalThreats: 0,
        highRiskCount: 0,
        topBlockchain: "unknown",
        topThreatType: "unknown",
      };
    }
  }

  private getTopBlockchain(threats: any[]): string {
    const blockchainCounts = threats.reduce((acc, threat) => {
      acc[threat.blockchain] = (acc[threat.blockchain] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(blockchainCounts).reduce(
      (a, b) => (blockchainCounts[a] > blockchainCounts[b] ? a : b),
      "unknown",
    );
  }

  private getTopThreatType(threats: any[]): string {
    const threatCounts = threats.reduce((acc, threat) => {
      for (const category of threat.threat_categories || []) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.keys(threatCounts).reduce(
      (a, b) => (threatCounts[a] > threatCounts[b] ? a : b),
      "unknown",
    );
  }

  private formatRecurringMessage(template: string, summary: any): string {
    let message = template;

    message = message.replace(
      "{totalThreats}",
      summary.totalThreats.toString(),
    );
    message = message.replace(
      "{highRiskCount}",
      summary.highRiskCount.toString(),
    );
    message = message.replace("{topBlockchain}", summary.topBlockchain);
    message = message.replace("{topThreatType}", summary.topThreatType);
    message = message.replace("{timestamp}", new Date().toLocaleString());

    return message;
  }

  public async configureGroupAlerts(
    groupId: string,
    platform: "telegram" | "discord",
    config: {
      riskThreshold: number;
      alertTypes: AlertType[];
      recurringInterval?: number;
      messageTemplates?: string[];
    },
  ) {
    try {
      const { data, error } = await supabase
        .from("recurring_messages")
        .upsert({
          group_id: groupId,
          platform,
          risk_threshold: config.riskThreshold,
          interval_minutes: config.recurringInterval || 60,
          message_templates: config.messageTemplates || [
            "📊 **NimRev Threat Summary**\n\n🚨 Threats detected: {totalThreats}\n🔴 High risk: {highRiskCount}\n🌐 Top blockchain: {topBlockchain}\n⚠️ Top threat: {topThreatType}\n\n⏰ {timestamp}",
          ],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      this.recurringMessages.set(data.id, data);

      console.log(`⚙️ Configured alerts for ${platform}:${groupId}`);
      return data;
    } catch (error) {
      console.error("Failed to configure group alerts:", error);
      throw error;
    }
  }

  public async broadcastEmergencyAlert(alertData: {
    title: string;
    message: string;
    urgency: "high" | "critical";
    targetGroups?: string[];
  }) {
    try {
      const recipients =
        alertData.targetGroups ||
        Array.from(this.recurringMessages.values())
          .filter((msg) => msg.is_active)
          .map((msg) => `${msg.platform}:${msg.group_id}`);

      const emergencyMessage = `
🚨 **EMERGENCY ALERT** 🚨

${alertData.title}

${alertData.message}

⚠️ **Urgency Level: ${alertData.urgency.toUpperCase()}**

📅 Issued: ${new Date().toLocaleString()} UTC
🤖 NimRev Scanner Alert System
      `;

      for (const recipient of recipients) {
        await this.sendToRecipient(recipient, emergencyMessage, {
          type: "emergency",
          urgency: alertData.urgency,
        });
      }

      console.log(
        `🚨 Emergency alert broadcast to ${recipients.length} groups`,
      );
    } catch (error) {
      console.error("Failed to broadcast emergency alert:", error);
    }
  }

  public getAlertStats() {
    return {
      totalTemplates: this.alertTemplates.size,
      recurringMessages: this.recurringMessages.size,
      activeCooldowns: this.alertCooldowns.size,
      isRunning: this.isRunning,
    };
  }
}
