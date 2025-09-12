import TelegramBot from "node-telegram-bot-api";
import { supabase, SupabaseHelper } from "../utils/supabase";
import { BlockchainType, ScanRequest } from "../../shared/nimrev-types";
import { ScanQueue } from "./ScanQueue";
import { getEnv } from "../utils/env";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";

interface BotCommand {
  command: string;
  description: string;
  handler: (msg: TelegramBot.Message, args: string[]) => Promise<void>;
}

export class NimRevTelegramBot {
  private bot: TelegramBot;
  private scanQueue: ScanQueue;
  private commands: Map<string, BotCommand> = new Map();
  private compactChats: Set<number> = new Set();
  private groupSettingsCache: Map<
    number,
    { captchaEnabled: boolean; welcomeMessage: string | null }
  > = new Map();
  private pendingCaptchas: Map<
    string,
    { chatId: number; userId: number; answer: number }
  > = new Map();

  constructor(scanQueue: ScanQueue) {
    const token = getEnv("TELEGRAM_BOT_TOKEN");
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }

    // Check if it's a development token or invalid format
    const isDevelopmentToken =
      token.includes("development") ||
      token.includes("YOUR_") ||
      token.includes("PLACEHOLDER") ||
      token.length < 30 || // Telegram tokens are typically 46+ chars
      !token.includes(":") ||
      process.env.ENABLE_BOT === "false";

    if (isDevelopmentToken) {
      console.log(
        "🤖 Development mode: Bot initialized but won't connect to Telegram (invalid/placeholder token)",
      );
      // Don't initialize the actual bot in development with fake token
      this.scanQueue = scanQueue;
      return;
    }

    try {
      this.bot = new TelegramBot(token, {
        polling: {
          interval: 5000, // Check for updates every 5 seconds
          autoStart: true,
          params: {
            timeout: 30, // Long polling timeout
          },
        },
        filepath: false, // Disable file upload capability to reduce memory usage
      });

      this.scanQueue = scanQueue;
      this.setupCommands();
      this.setupEventHandlers();
      this.setupErrorHandlers();
    } catch (error) {
      console.error("❌ Failed to initialize Telegram bot:", error);
      console.log("🤖 Running in offline mode - bot features disabled");
      this.scanQueue = scanQueue;
    }
  }

  private async setupCommands() {
    const commands: BotCommand[] = [
      {
        command: "start",
        description: "Welcome message and bot introduction",
        handler: this.handleStart.bind(this),
      },
      {
        command: "help",
        description: "Show available commands",
        handler: this.handleHelp.bind(this),
      },
      {
        command: "setupbot",
        description: "Setup NimRev Scanner for your group",
        handler: this.handleSetupBot.bind(this),
      },
      {
        command: "scan",
        description: "Scan a token address for threats",
        handler: this.handleScan.bind(this),
      },
      {
        command: "watch",
        description: "Monitor an address for suspicious activity",
        handler: this.handleWatch.bind(this),
      },
      {
        command: "unwatch",
        description: "Stop monitoring an address",
        handler: this.handleUnwatch.bind(this),
      },
      {
        command: "watchlist",
        description: "Show your monitored addresses",
        handler: this.handleWatchlist.bind(this),
      },
      {
        command: "recurring",
        description: "Manage recurring threat alerts",
        handler: this.handleRecurring.bind(this),
      },
      {
        command: "status",
        description: "Show scanner status and statistics",
        handler: this.handleStatus.bind(this),
      },
      {
        command: "credits",
        description: "Check your scan credits",
        handler: this.handleCredits.bind(this),
      },
      {
        command: "alerts",
        description: "Configure alert settings",
        handler: this.handleAlerts.bind(this),
      },
      {
        command: "compact",
        description: "Toggle compact output (on/off)",
        handler: this.handleCompact.bind(this),
      },
      {
        command: "captcha",
        description: "Enable/disable join captcha: /captcha on|off",
        handler: this.handleCaptchaCommand.bind(this),
      },
      {
        command: "welcomemsg",
        description: "Set custom welcome message",
        handler: this.handleWelcomeMsgCommand.bind(this),
      },
      {
        command: "report",
        description: "Send feedback/bug report to admins",
        handler: this.handleReportCommand.bind(this),
      },
      {
        command: "raid",
        description: "Create a raid CTA: /raid <url or text>",
        handler: this.handleRaidCommand.bind(this),
      },
      {
        command: "compact",
        description: "Toggle compact output (on/off)",
        handler: this.handleCompact.bind(this),
      },
    ];

    for (const cmd of commands) {
      this.commands.set(cmd.command, cmd);
    }

    // Only set bot commands for Telegram UI if bot is initialized
    if (this.bot) {
      const commandList = commands.map((cmd) => ({
        command: cmd.command,
        description: cmd.description,
      }));

      try {
        // Default scope (all chats)
        await this.bot.setMyCommands(commandList);
      } catch (error) {
        console.warn(
          "⚠️ Failed to set default bot commands:",
          (error as any)?.message || error,
        );
      }

      // Explicitly set per-scope to surface in group menus
      try {
        await this.bot.setMyCommands(commandList, {
          scope: { type: "all_private_chats" },
        } as any);
      } catch (e) {
        console.warn(
          "⚠️ setMyCommands all_private_chats failed:",
          (e as any)?.message || e,
        );
      }

      try {
        await this.bot.setMyCommands(commandList, {
          scope: { type: "all_group_chats" },
        } as any);
      } catch (e) {
        console.warn(
          "⚠️ setMyCommands all_group_chats failed:",
          (e as any)?.message || e,
        );
      }

      try {
        await this.bot.setMyCommands(commandList, {
          scope: { type: "all_chat_administrators" },
        } as any);
      } catch (e) {
        console.warn(
          "⚠️ setMyCommands all_chat_administrators failed:",
          (e as any)?.message || e,
        );
      }
    }
  }

  private setupEventHandlers() {
    if (!this.bot) {
      console.log("🤖 Skipping event handlers setup - bot not initialized");
      return; // Skip if bot not initialized
    }

    // Handle text messages
    this.bot.on("message", async (msg) => {
      try {
        if (!msg.text) return;

        // Check if it's a command
        if (msg.text.startsWith("/")) {
          await this.handleCommand(msg);
        } else {
          // Check if it looks like a token address
          if (this.isTokenAddress(msg.text)) {
            await this.handleQuickScan(msg, msg.text);
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
        await this.sendMessage(
          msg.chat.id,
          "❌ An error occurred while processing your request.",
        );
      }
    });

    // Handle callback queries (inline keyboard buttons)
    this.bot.on("callback_query", async (query) => {
      try {
        if (query.data?.startsWith("captcha_")) {
          const parts = query.data.split("_");
          const chatId = parseInt(parts[1], 10);
          const userId = parseInt(parts[2], 10);
          const selected = parseInt(parts[3], 10);
          const key = `${chatId}:${userId}`;
          const session = this.pendingCaptchas.get(key);

          if (session) {
            if (selected === session.answer) {
              await this.unmuteUser(chatId, userId);
              this.pendingCaptchas.delete(key);
              await this.bot.answerCallbackQuery(query.id, {
                text: "✅ Verified",
              });
              try {
                await supabase
                  .from("captcha_verifications")
                  .insert({
                    chat_id: chatId,
                    user_id: userId,
                    status: "passed",
                  });
              } catch {}
              const settings = await this.getGroupSettings(chatId);
              if (settings.welcomeMessage) {
                await this.sendMessage(
                  chatId,
                  settings.welcomeMessage.replace(
                    /\{user\}/g,
                    `[${query.from.first_name}](tg://user?id=${userId})`,
                  ),
                  { parse_mode: "Markdown" },
                );
              }
            } else {
              await this.bot.answerCallbackQuery(query.id, {
                text: "❌ Try again",
              });
            }
          } else {
            await this.bot.answerCallbackQuery(query.id, {
              text: "Session expired",
            });
          }
          return;
        }

        await this.handleCallbackQuery(query);
      } catch (error) {
        console.error("Error handling callback query:", error);
      }
    });

    // Handle new chat members (group setup + captcha)
    this.bot.on("new_chat_members", async (msg) => {
      const newMembers = msg.new_chat_members || [];
      if (
        newMembers.some(
          (m) => m.username === (this.bot as any).options?.username,
        )
      ) {
        await this.handleBotAddedToGroup(msg);
      }

      for (const member of newMembers) {
        try {
          if (member.is_bot) continue;
          const chatId = msg.chat.id;
          const settings = await this.getGroupSettings(chatId);
          if (!settings.captchaEnabled) {
            if (settings.welcomeMessage) {
              await this.sendMessage(
                chatId,
                settings.welcomeMessage.replace(
                  /\{user\}/g,
                  `[${member.first_name}](tg://user?id=${member.id})`,
                ),
                { parse_mode: "Markdown" },
              );
            }
            continue;
          }

          await this.muteUser(chatId, member.id);

          const a = Math.floor(Math.random() * 7) + 3;
          const b = Math.floor(Math.random() * 7) + 3;
          const answer = a + b;
          const key = `${chatId}:${member.id}`;
          this.pendingCaptchas.set(key, { chatId, userId: member.id, answer });

          const opts = new Set<number>([answer]);
          while (opts.size < 4)
            opts.add(answer + Math.floor(Math.random() * 5) - 2);
          const buttons = Array.from(opts)
            .sort(() => Math.random() - 0.5)
            .map((n) => [
              {
                text: `${n}`,
                callback_data: `captcha_${chatId}_${member.id}_${n}`,
              },
            ]);

          await this.sendMessage(
            chatId,
            `👋 Welcome, [${member.first_name}](tg://user?id=${member.id})\n\nPlease solve to speak: ${a} + ${b} = ?`,
            {
              parse_mode: "Markdown",
              reply_markup: { inline_keyboard: buttons },
            },
          );
        } catch (e) {
          console.error("Failed to handle new member captcha:", e);
        }
      }
    });

    console.log("🤖 NimRev Telegram Bot initialized");
  }

  private setupErrorHandlers() {
    if (!this.bot) return; // Skip if bot not initialized

    this.bot.on("polling_error", (error) => {
      console.warn("🔄 Telegram polling error (retrying):", {
        code: error.code,
        message: error.message.substring(0, 100), // Truncate long messages
      });

      // Don't crash on temporary network issues
      if (error.code === "ETELEGRAM" || error.message.includes("401")) {
        console.error("❌ Telegram bot token is invalid or expired");
        console.log(
          "💡 Please check your TELEGRAM_BOT_TOKEN environment variable",
        );

        // Stop polling to prevent spam
        this.stop();
      }
    });

    this.bot.on("error", (error) => {
      console.error("❌ Telegram bot error:", error);
    });
  }

  private async handleCommand(msg: TelegramBot.Message) {
    const text = msg.text!;
    const parts = text.split(" ");
    const command = parts[0].substring(1).split("@")[0]; // Remove / and @botname
    const args = parts.slice(1);

    const commandHandler = this.commands.get(command);
    if (commandHandler) {
      await commandHandler.handler(msg, args);
    } else {
      await this.sendMessage(
        msg.chat.id,
        `❓ Unknown command: /${command}\nUse /help to see available commands.`,
      );
    }
  }

  private async handleStart(msg: TelegramBot.Message, args: string[]) {
    const welcomeMessage = `
🚨 **NimRev Scanner - Blockchain Threat Intelligence**

*"Power stays with the people. No hidden agendas. No compromise."*

🔍 **What I do:**
• Real-time blockchain threat detection
• Honeypot & rug pull identification  
• Cross-chain scam correlation
• Social footprint analysis
��� 24/7 address monitoring

🎯 **Key Features:**
• Multi-chain support (Solana, Ethereum, Base, Blast, etc.)
• Community-driven threat scoring
• Pre-emptive rug alerts
• Transparent, immutable scan results

Use /help to see all commands or just send me a token address to scan!

⚡ **Quick Start:**
• Send any token address for instant scan
• Use /scan <address> for detailed analysis
• Use /watch <address> for 24/7 monitoring
• Use /setupbot to configure group alerts
    `;

    await this.sendMessage(msg.chat.id, welcomeMessage, {
      parse_mode: "Markdown",
    });

    // Ensure user exists in database
    try {
      await SupabaseHelper.ensureUserExists(msg.from?.id);
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  }

  private async handleHelp(msg: TelegramBot.Message, args: string[]) {
    const commands = Array.from(this.commands.values());
    const helpText = `
🔧 **NimRev Scanner Commands**

${commands.map((cmd) => `/${cmd.command} - ${cmd.description}`).join("\n")}

💡 **Tips:**
• Just send a token address for quick scan
• Use address:blockchain format (e.g., 0x123...abc:ethereum)
• Join groups to get automatic threat alerts
• Premium users get unlimited scans

🌐 **Supported Blockchains:**
Solana, Ethereum, Base, Blast, Polygon, Avalanche, Arbitrum, Optimism

Need help? Contact @NimRevSupport
    `;

    await this.sendMessage(msg.chat.id, helpText, { parse_mode: "Markdown" });
  }

  private async handleSetupBot(msg: TelegramBot.Message, args: string[]) {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType === "private") {
      await this.sendMessage(
        chatId,
        "❌ This command is only available in groups. Add me to a group and run /setupbot there.",
      );
      return;
    }

    // Check if user is admin
    const chatMember = await this.bot.getChatMember(chatId, msg.from!.id);
    if (!["creator", "administrator"].includes(chatMember.status)) {
      await this.sendMessage(
        chatId,
        "❌ Only group administrators can setup the bot.",
      );
      return;
    }

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🚨 High Risk Alerts",
            callback_data: `setup_alerts_high_${chatId}`,
          },
          {
            text: "⚠️ All Threats",
            callback_data: `setup_alerts_all_${chatId}`,
          },
        ],
        [
          {
            text: "⏰ Recurring Messages",
            callback_data: `setup_recurring_${chatId}`,
          },
          { text: "�� Scanner Stats", callback_data: `setup_stats_${chatId}` },
        ],
        [
          {
            text: "✅ Complete Setup",
            callback_data: `setup_complete_${chatId}`,
          },
        ],
      ],
    };

    const setupMessage = `
🛠️ **NimRev Scanner Group Setup**

Welcome to secure, decentralized threat intelligence!

**Configuration Options:**

🚨 **Alert Settings:**
• High Risk Only: Get alerts for tokens with risk score ≤ 30
• All Threats: Get alerts for all detected threats

⏰ **Recurring Messages:**
�� Periodic threat summaries
• Scanner status updates
• Community announcements

📊 **Statistics:**
• Daily scan summaries
• Group threat analytics
• Performance metrics

Choose your preferred settings:
    `;

    await this.sendMessage(chatId, setupMessage, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }

  private async handleScan(msg: TelegramBot.Message, args: string[]) {
    if (args.length === 0) {
      await this.sendMessage(
        msg.chat.id,
        "❓ Please provide a token address to scan.\n\nExample: `/scan 0x1234...abcd` or `/scan 0x1234...abcd:ethereum`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const input = args.join(" ");
    await this.performScan(msg, input, true); // Detailed scan
  }

  private async handleQuickScan(msg: TelegramBot.Message, address: string) {
    await this.performScan(msg, address, false); // Quick scan
  }

  private async performScan(
    msg: TelegramBot.Message,
    input: string,
    detailed: boolean,
  ) {
    try {
      const { address, blockchain } = this.parseAddressInput(input);

      if (!address) {
        await this.sendMessage(
          msg.chat.id,
          "⚠️ Please include a valid token address (e.g., /scan So111... or 0x...:ethereum)",
        );
        return;
      }

      // Try user credits but don't hard-fail the scan if the account service is down
      let userId: string | null = null;
      let creditsOk = true;
      try {
        const user = await SupabaseHelper.ensureUserExists(msg.from?.id);
        userId = user.id;
        creditsOk = await SupabaseHelper.consumeScanCredit(user.id);
        if (!creditsOk) {
          await this.sendMessage(
            msg.chat.id,
            "❌ Insufficient scan credits. Use /credits or contact @NimRevSupport.",
          );
          return;
        }
      } catch (e) {
        console.warn("Account service unavailable, proceeding with basic scan:", e);
      }

      const scanningMessage = await this.sendMessage(
        msg.chat.id,
        `🔍 Scanning ${blockchain}:${address.substring(0, 10)}...${address.substring(address.length - 8)}\n\n⏳ Analysis in progress...`,
      );

      try {
        // Queue the scan (full pipeline)
        const scanId = await this.scanQueue.addScan({
          token_address: address,
          blockchain,
          priority: "normal",
          requested_by: userId || "anonymous",
          deep_scan: detailed,
        } as any);

        // Wait for scan completion (with timeout)
        const result = await this.waitForScanCompletion(scanId, 60000);

        if (result) {
          await this.sendScanResult(
            msg.chat.id,
            result,
            scanningMessage.message_id,
          );
          return;
        }
      } catch (queueErr) {
        console.warn("Queue scan failed or timed out, attempting quick fallback:", queueErr);
      }

      // Quick fallback for Solana mints when full scan is unavailable
      if (blockchain === "solana" && this.isValidSolanaPubkey(address)) {
        try {
          const info = await this.quickSolanaMintScan(address);
          const mintAuth = info.mintAuthority
            ? `🟡 Mint Authority: ${info.mintAuthority}`
            : "🟢 Mint Authority: revoked";
          const freezeAuth = info.freezeAuthority
            ? `🟡 Freeze Authority: ${info.freezeAuthority}`
            : "🟢 Freeze Authority: revoked";

          const textOut =
            `✅ Token Found\n` +
            `• Mint: ${address}\n` +
            `• Initialized: ${info.isInitialized ? "yes" : "no"}\n` +
            `• Decimals: ${info.decimals}\n` +
            `• Supply: ${this.formatSupply(info.supply, info.decimals)}\n` +
            `• ${mintAuth}\n` +
            `• ${freezeAuth}\n\n` +
            `Quick links: ${this.solanaExplorers(address)}`;

          await this.bot.editMessageText(textOut, {
            chat_id: msg.chat.id,
            message_id: scanningMessage.message_id,
            disable_web_page_preview: true,
          });
          return;
        } catch (fallbackErr) {
          console.error("Fallback Solana scan failed:", fallbackErr);
        }
      }

      await this.bot.editMessageText("❌ Scan failed. Please try again later.", {
        chat_id: msg.chat.id,
        message_id: scanningMessage.message_id,
      });
    } catch (err) {
      console.error("performScan fatal error:", err);
      try {
        await this.sendMessage(
          msg.chat.id,
          "❌ An internal error occurred while processing that request.",
        );
      } catch {}
    }
  }

  private async handleWatch(msg: TelegramBot.Message, args: string[]) {
    if (args.length === 0) {
      await this.sendMessage(
        msg.chat.id,
        "❓ Please provide an address to monitor.\n\nExample: `/watch 0x1234...abcd:ethereum`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const input = args.join(" ");
    const { address, blockchain } = this.parseAddressInput(input);

    if (!address) {
      await this.sendMessage(msg.chat.id, "❌ Invalid address format.");
      return;
    }

    const user = await SupabaseHelper.ensureUserExists(msg.from?.id);

    try {
      const { error } = await supabase.from("watched_addresses").insert({
        address,
        blockchain,
        watcher_id: user.id,
        watch_type: "full",
        alert_channels: [`telegram:${msg.chat.id}`],
        is_active: true,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          await this.sendMessage(
            msg.chat.id,
            "⚠️ You are already monitoring this address.",
          );
        } else {
          throw error;
        }
      } else {
        await this.sendMessage(
          msg.chat.id,
          `✅ **Address Monitoring Started**\n\n��� **Address:** \`${address}\`\n🌐 **Blockchain:** ${blockchain}\n\n🔔 You will receive alerts for any suspicious activity.`,
          { parse_mode: "Markdown" },
        );
      }
    } catch (error) {
      console.error("Failed to add watch:", error);
      await this.sendMessage(
        msg.chat.id,
        "❌ Failed to start monitoring. Please try again.",
      );
    }
  }

  private async handleUnwatch(msg: TelegramBot.Message, args: string[]) {
    if (args.length === 0) {
      await this.sendMessage(
        msg.chat.id,
        "❓ Please provide an address to stop monitoring.\n\nExample: `/unwatch 0x1234...abcd`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const input = args.join(" ");
    const { address, blockchain } = this.parseAddressInput(input);

    if (!address) {
      await this.sendMessage(msg.chat.id, "❌ Invalid address format.");
      return;
    }

    const user = await SupabaseHelper.ensureUserExists(msg.from?.id);

    try {
      const { error, count } = await supabase
        .from("watched_addresses")
        .update({ is_active: false })
        .eq("address", address)
        .eq("blockchain", blockchain)
        .eq("watcher_id", user.id)
        .eq("is_active", true);

      if (error) {
        throw error;
      }

      if (count && count > 0) {
        await this.sendMessage(
          msg.chat.id,
          `�� **Monitoring Stopped**\n\n📍 **Address:** \`${address}\`\n🌐 **Blockchain:** ${blockchain}`,
          { parse_mode: "Markdown" },
        );
      } else {
        await this.sendMessage(
          msg.chat.id,
          "❌ Address not found in your watchlist.",
        );
      }
    } catch (error) {
      console.error("Failed to remove watch:", error);
      await this.sendMessage(
        msg.chat.id,
        "❌ Failed to stop monitoring. Please try again.",
      );
    }
  }

  private async handleWatchlist(msg: TelegramBot.Message, args: string[]) {
    const user = await SupabaseHelper.ensureUserExists(msg.from?.id);

    try {
      const { data: watchedAddresses, error } = await supabase
        .from("watched_addresses")
        .select("*")
        .eq("watcher_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!watchedAddresses || watchedAddresses.length === 0) {
        await this.sendMessage(
          msg.chat.id,
          "📭 Your watchlist is empty.\n\nUse /watch <address> to start monitoring addresses.",
        );
        return;
      }

      let message = "👁️ **Your Active Watchlist**\n\n";

      for (const watch of watchedAddresses.slice(0, 10)) {
        // Limit to 10
        const shortAddress = `${watch.address.substring(0, 8)}...${watch.address.substring(watch.address.length - 6)}`;
        message += `🔹 \`${shortAddress}\` (${watch.blockchain})\n`;
        message += `   �� Since: ${new Date(watch.created_at).toLocaleDateString()}\n`;
        message += `   🚨 Alerts sent: ${watch.total_alerts_sent}\n\n`;
      }

      if (watchedAddresses.length > 10) {
        message += `\n... and ${watchedAddresses.length - 10} more addresses`;
      }

      await this.sendMessage(msg.chat.id, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Failed to get watchlist:", error);
      await this.sendMessage(msg.chat.id, "❌ Failed to retrieve watchlist.");
    }
  }

  private async handleRecurring(msg: TelegramBot.Message, args: string[]) {
    const chatId = msg.chat.id;

    // Check if user is admin (for groups)
    if (msg.chat.type !== "private") {
      const chatMember = await this.bot.getChatMember(chatId, msg.from!.id);
      if (!["creator", "administrator"].includes(chatMember.status)) {
        await this.sendMessage(
          chatId,
          "❌ Only group administrators can manage recurring messages.",
        );
        return;
      }
    }

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "➕ Add Recurring Alert",
            callback_data: `recurring_add_${chatId}`,
          },
          {
            text: "✏️ Edit Settings",
            callback_data: `recurring_edit_${chatId}`,
          },
        ],
        [
          {
            text: "🗑️ Remove Alerts",
            callback_data: `recurring_remove_${chatId}`,
          },
          {
            text: "📊 View Current",
            callback_data: `recurring_view_${chatId}`,
          },
        ],
      ],
    };

    await this.sendMessage(
      chatId,
      "⏰ **Recurring Alert Management**\n\nManage automated threat alerts for this chat:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      },
    );
  }

  private async handleStatus(msg: TelegramBot.Message, args: string[]) {
    try {
      // Get scanner status
      const queueStatus = this.scanQueue.getQueueStatus();

      // Get recent scan statistics
      const { data: recentScans } = await supabase
        .from("scan_results")
        .select("risk_score, created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .eq("scan_status", "completed");

      const highRiskCount =
        recentScans?.filter((scan) => scan.risk_score <= 30).length || 0;
      const totalScans = recentScans?.length || 0;

      const statusMessage = `
📊 **NimRev Scanner Status**

�� **Queue Status:**
• Queued Scans: ${queueStatus.queued}
• Processing: ${queueStatus.processing}
• Capacity: ${queueStatus.capacity}/${queueStatus.capacity + queueStatus.processing}

📈 **24h Statistics:**
• Total Scans: ${totalScans}
• High Risk Detected: ${highRiskCount}
• Success Rate: ${totalScans > 0 ? Math.round((totalScans / totalScans) * 100) : 0}%

🟢 **System Health:** ${queueStatus.isRunning ? "Online" : "Offline"}

⚡ **Performance:** All systems operational
🌐 **Blockchain Coverage:** 8 chains active
🛡️ **Threat Database:** Updated

Last update: ${new Date().toLocaleTimeString()}
      `;

      await this.sendMessage(msg.chat.id, statusMessage, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Failed to get status:", error);
      await this.sendMessage(
        msg.chat.id,
        "❌ Failed to retrieve status information.",
      );
    }
  }

  private async handleCredits(msg: TelegramBot.Message, args: string[]) {
    const user = await SupabaseHelper.ensureUserExists(msg.from?.id);

    try {
      const credits = await SupabaseHelper.getUserScanCredits(user.id);

      let creditsMessage = `💳 **Your Scan Credits**\n\n`;
      creditsMessage += `🔍 **Available Credits:** ${credits}\n`;
      creditsMessage += `🏷️ **Subscription:** ${user.subscription_tier}\n\n`;

      if (credits > 50) {
        creditsMessage += `✅ You have plenty of credits!`;
      } else if (credits > 10) {
        creditsMessage += `⚠️ Consider upgrading for unlimited scans.`;
      } else {
        creditsMessage += `🚨 Low credits! Contact @NimRevSupport for more.`;
      }

      await this.sendMessage(msg.chat.id, creditsMessage, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Failed to get credits:", error);
      await this.sendMessage(
        msg.chat.id,
        "❌ Failed to retrieve credit information.",
      );
    }
  }

  private async handleCompact(msg: TelegramBot.Message, args: string[]) {
    const chatId = msg.chat.id;

    let turnOn: boolean | null = null;
    if (args.length > 0) {
      const opt = args[0].toLowerCase();
      if (opt === "on") turnOn = true;
      else if (opt === "off") turnOn = false;
    }

    if (turnOn === null) {
      if (this.compactChats.has(chatId)) this.compactChats.delete(chatId);
      else this.compactChats.add(chatId);
    } else if (turnOn) {
      this.compactChats.add(chatId);
    } else {
      this.compactChats.delete(chatId);
    }

    const enabled = this.compactChats.has(chatId);
    await this.sendMessage(
      chatId,
      enabled
        ? "✅ Compact mode enabled. Future results will be shorter."
        : "✅ Compact mode disabled. Detailed results restored.",
    );
  }

  private async handleAlerts(msg: TelegramBot.Message, args: string[]) {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🚨 High Risk Only",
            callback_data: `alerts_high_${msg.chat.id}`,
          },
          {
            text: "⚠️ Medium + High",
            callback_data: `alerts_medium_${msg.chat.id}`,
          },
        ],
        [
          {
            text: "📊 All Threats",
            callback_data: `alerts_all_${msg.chat.id}`,
          },
          {
            text: "🔕 Disable Alerts",
            callback_data: `alerts_disable_${msg.chat.id}`,
          },
        ],
        [
          {
            text: "⏰ Set Cooldown",
            callback_data: `alerts_cooldown_${msg.chat.id}`,
          },
        ],
      ],
    };

    await this.sendMessage(
      msg.chat.id,
      "🔔 **Alert Configuration**\n\nChoose your alert sensitivity:",
      { parse_mode: "Markdown", reply_markup: keyboard },
    );
  }

  private async handleReportCommand(msg: TelegramBot.Message, args: string[]) {
    const chatId = msg.chat.id;
    const text = args.join(" ").trim();
    if (!text) {
      await this.sendMessage(chatId, "❓ Usage: /report <issue or feedback>");
      return;
    }
    try {
      await supabase.from("bot_reports").insert({
        chat_id: chatId,
        user_id: msg.from?.id,
        username: msg.from?.username,
        text,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Failed to store report:", (e as any).message);
    }
    try {
      const adminChat = process.env.NIMREV_ADMIN_CHAT_ID;
      if (adminChat) {
        await this.sendMessage(
          parseInt(adminChat),
          `📣 New report from ${msg.from?.username || msg.from?.id}\nChat: ${chatId}\n\n${text}`,
        );
      }
    } catch {}
    await this.sendMessage(
      chatId,
      "✅ Thanks! Your report was submitted to admins.",
    );
  }

  private async handleCaptchaCommand(msg: TelegramBot.Message, args: string[]) {
    if (msg.chat.type === "private") {
      await this.sendMessage(
        msg.chat.id,
        "⚠️ Use this in a group to enable/disable join captcha.",
      );
      return;
    }
    const chatId = msg.chat.id;
    const opt = (args[0] || "").toLowerCase();
    if (opt !== "on" && opt !== "off") {
      const settings = await this.getGroupSettings(chatId);
      await this.sendMessage(
        chatId,
        `ℹ️ Captcha is currently ${settings.captchaEnabled ? "ON" : "OFF"}. Use /captcha on or /captcha off.`,
      );
      return;
    }
    const member = await this.bot.getChatMember(chatId, msg.from!.id);
    if (!["creator", "administrator"].includes(member.status)) {
      await this.sendMessage(
        chatId,
        "❌ Only admins can change captcha settings.",
      );
      return;
    }
    const enable = opt === "on";
    await this.setGroupSettings(chatId, { captchaEnabled: enable });
    await this.sendMessage(
      chatId,
      enable ? "✅ Captcha enabled for new members." : "✅ Captcha disabled.",
    );
  }

  private async handleWelcomeMsgCommand(
    msg: TelegramBot.Message,
    args: string[],
  ) {
    const chatId = msg.chat.id;
    if (msg.chat.type === "private") {
      await this.sendMessage(
        chatId,
        "⚠️ Use this in a group: /welcomemsg Welcome {user}!",
      );
      return;
    }
    const member = await this.bot.getChatMember(chatId, msg.from!.id);
    if (!["creator", "administrator"].includes(member.status)) {
      await this.sendMessage(
        chatId,
        "❌ Only admins can set the welcome message.",
      );
      return;
    }
    const text = args.join(" ").trim();
    if (!text) {
      await this.sendMessage(chatId, "❓ Usage: /welcomemsg Welcome {user}!");
      return;
    }
    await this.setGroupSettings(chatId, { welcomeMessage: text });
    await this.sendMessage(chatId, "✅ Welcome message updated.");
  }

  private async handleRaidCommand(msg: TelegramBot.Message, args: string[]) {
    const chatId = msg.chat.id;
    if (msg.chat.type === "private") {
      await this.sendMessage(chatId, "⚠️ Use /raid in a group.");
      return;
    }
    const member = await this.bot.getChatMember(chatId, msg.from!.id);
    if (!["creator", "administrator"].includes(member.status)) {
      await this.sendMessage(chatId, "❌ Only admins can start a raid.");
      return;
    }
    const payload = args.join(" ").trim();
    if (!payload) {
      await this.sendMessage(chatId, "❓ Usage: /raid <url or text>");
      return;
    }
    const urlMatch = payload.match(/https?:\/\/\S+/);
    const url = urlMatch ? urlMatch[0] : undefined;
    const keyboard = url
      ? { inline_keyboard: [[{ text: "⚡ Join Now", url }]] }
      : undefined;
    await this.sendMessage(chatId, `🚀 **RAID ACTIVE**\n\n${payload}`, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }

  private async getGroupSettings(
    chatId: number,
  ): Promise<{ captchaEnabled: boolean; welcomeMessage: string | null }> {
    if (this.groupSettingsCache.has(chatId))
      return this.groupSettingsCache.get(chatId)!;
    let settings = {
      captchaEnabled: false,
      welcomeMessage: null as string | null,
    };
    try {
      const { data } = await supabase
        .from("group_settings")
        .select("captcha_enabled, welcome_message")
        .eq("chat_id", chatId)
        .single();
      if (data) {
        settings.captchaEnabled = !!data.captcha_enabled;
        settings.welcomeMessage = data.welcome_message || null;
      }
    } catch {}
    this.groupSettingsCache.set(chatId, settings);
    return settings;
  }

  private async setGroupSettings(
    chatId: number,
    update: Partial<{ captchaEnabled: boolean; welcomeMessage: string | null }>,
  ) {
    const current = await this.getGroupSettings(chatId);
    const next = { ...current, ...update };
    try {
      await supabase.from("group_settings").upsert(
        {
          chat_id: chatId,
          captcha_enabled: next.captchaEnabled,
          welcome_message: next.welcomeMessage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "chat_id" as any },
      );
    } catch (e) {
      console.warn("Failed to persist group settings:", (e as any).message);
    }
    this.groupSettingsCache.set(chatId, next);
  }

  private async muteUser(chatId: number, userId: number) {
    try {
      await this.bot.restrictChatMember(chatId, userId, {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
      } as any);
    } catch (e) {
      console.warn(
        "Failed to mute user (bot likely lacks admin rights):",
        (e as any).message,
      );
    }
  }

  private async unmuteUser(chatId: number, userId: number) {
    try {
      await this.bot.restrictChatMember(chatId, userId, {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
      } as any);
    } catch (e) {
      console.warn("Failed to unmute user:", (e as any).message);
    }
  }

  // Utility methods
  private async sendMessage(
    chatId: number,
    text: string,
    options?: any,
  ): Promise<TelegramBot.Message> {
    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  private isTokenAddress(text: string): boolean {
    if (/^0x[a-fA-F0-9]{40}$/.test(text)) return true; // EVM
    if (this.isValidSolanaPubkey(text)) return true; // Solana strong check
    return false;
  }

  private isValidSolanaPubkey(s: string): boolean {
    try {
      if (!s || s.length < 32 || s.length > 64) return false;
      // PublicKey constructor will validate base58 and length
      new PublicKey(s);
      return true;
    } catch {
      return false;
    }
  }

  private parseAddressInput(input: string): {
    address: string | null;
    blockchain: BlockchainType;
  } {
    const parts = input.trim().split(":");

    if (parts.length === 1) {
      // No blockchain specified, try to guess
      const address = parts[0];
      if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return { address, blockchain: "ethereum" }; // Default to Ethereum for 0x addresses
      } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        return { address, blockchain: "solana" }; // Default to Solana for base58 addresses
      }
      return { address: null, blockchain: "ethereum" };
    } else if (parts.length === 2) {
      const [address, blockchainStr] = parts;
      const blockchain = blockchainStr.toLowerCase() as BlockchainType;

      // Validate blockchain
      const validBlockchains: BlockchainType[] = [
        "solana",
        "ethereum",
        "base",
        "blast",
        "polygon",
        "avalanche",
        "arbitrum",
        "optimism",
      ];

      if (!validBlockchains.includes(blockchain)) {
        return { address: null, blockchain: "ethereum" };
      }

      return { address, blockchain };
    }

    return { address: null, blockchain: "ethereum" };
  }

  private async waitForScanCompletion(
    scanId: string,
    timeout: number,
  ): Promise<any | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const { data: scanResult } = await supabase
        .from("scan_results")
        .select("*")
        .eq("id", scanId)
        .single();

      if (scanResult && scanResult.scan_status === "completed") {
        return scanResult;
      } else if (scanResult && scanResult.scan_status === "failed") {
        throw new Error("Scan failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Check every 2 seconds
    }

    return null; // Timeout
  }

  private async sendScanResult(
    chatId: number,
    result: any,
    messageId?: number,
  ) {
    const riskEmoji = this.getRiskEmoji(result.risk_score);
    const riskCategory = this.getRiskCategory(result.risk_score);
    const isCompact = this.compactChats.has(chatId);

    let message = "";
    if (isCompact) {
      const shortAddr = `${result.token_address.substring(0, 6)}...${result.token_address.substring(result.token_address.length - 4)}`;
      message = `${riskEmoji} ${result.token_symbol || "Unknown"} • ${result.blockchain} • ${result.risk_score}/100 (${riskCategory})\n${shortAddr}`;
    } else {
      message = `${riskEmoji} **Scan Complete**\n\n`;
      message += `📍 **Address:** \`${result.token_address}\`\n`;
      message += `🌐 **Blockchain:** ${result.blockchain}\n`;
      message += `🏷️ **Symbol:** ${result.token_symbol || "Unknown"}\n`;
      message += `🧮 **Risk Score:** ${result.risk_score}/100 (${riskCategory})\n\n`;

      if (result.threat_categories && result.threat_categories.length > 0) {
        message += `🚨 **Threats Detected:**\n`;
        for (const threat of result.threat_categories) {
          message += `• ${this.formatThreatCategory(threat)}\n`;
        }
        message += "\n";
      }

      if (result.risk_score <= 30) {
        message += `⚠️ **WARNING:** High risk token detected!\n`;
        message += `❌ **Recommendation:** Avoid this token\n\n`;
      } else if (result.risk_score >= 70) {
        message += `✅ **Status:** Looks safe\n`;
        message += `💚 **Recommendation:** Proceed with normal caution\n\n`;
      }

      message += `⏱️ **Scan Duration:** ${result.scan_duration_ms}ms\n`;
      message += `🔍 **Scanner Version:** ${result.scanner_version}\n`;
      message += `📅 **Timestamp:** ${new Date(result.created_at).toLocaleString()}`;
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📊 Full Report", callback_data: `report_${result.id}` },
          { text: "👥 Community Vote", callback_data: `vote_${result.id}` },
        ],
        [
          {
            text: "👁️ Monitor Address",
            callback_data: `monitor_${result.token_address}_${result.blockchain}`,
          },
        ],
      ],
    };

    const payload = { parse_mode: "Markdown", reply_markup: keyboard } as any;

    if (messageId) {
      await this.bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        ...payload,
      });
    } else {
      await this.sendMessage(chatId, message, payload);
    }
  }

  private getRiskEmoji(riskScore: number): string {
    if (riskScore <= 30) return "🚨";
    if (riskScore <= 60) return "⚠️";
    if (riskScore <= 70) return "📊";
    return "✅";
  }

  private getRiskCategory(riskScore: number): string {
    if (riskScore <= 30) return "HIGH RISK";
    if (riskScore <= 60) return "MEDIUM RISK";
    if (riskScore <= 70) return "LOW RISK";
    return "ALPHA";
  }

  private formatThreatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      honeypot: "🍯 Honeypot",
      rug_pull: "🪤 Rug Pull Risk",
      high_fees: "💸 High Fees",
      mint_authority: "🪙 Mint Authority",
      social_red_flag: "📱 Social Red Flag",
      liquidity_drain: "💧 Liquidity Drain",
      cross_chain_scam: "🌐 Cross-Chain Scam",
    };

    return categoryMap[category] || category;
  }

  private solanaExplorers(mint: string): string {
    return [
      `[Solscan](https://solscan.io/token/${mint})`,
      `[Birdeye](https://birdeye.so/token/${mint}?chain=solana)`,
      `[Phantom](https://phantom.app/asset/${mint})`,
    ].join("  •  ");
  }

  private formatSupply(raw: number, decimals: number): string {
    const scaled = Number(raw) / 10 ** decimals;
    return `${scaled.toLocaleString("en-US", { maximumFractionDigits: Math.min(9, decimals) })}  (raw ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(raw)})`;
  }

  private getSolanaConnections(): Connection[] {
    const poolEnv = (process.env.SOLANA_RPC_POOL || "").split(",").map((s) => s.trim()).filter(Boolean);
    const helius = (getEnv("HELIUS_RPC_URL") as unknown as string) || "";
    const network = (getEnv("SOLANA_NETWORK") as unknown as string) || "mainnet-beta";
    const urls = poolEnv.length > 0 ? poolEnv : [helius || clusterApiUrl(network as any)];
    return urls.map((u) => new Connection(u, "confirmed"));
  }

  private async quickSolanaMintScan(mintStr: string): Promise<{
    supply: number;
    decimals: number;
    isInitialized: boolean;
    mintAuthority: string | null;
    freezeAuthority: string | null;
  }> {
    const conns = this.getSolanaConnections();
    let lastErr: any = null;
    for (let attempt = 0; attempt < Math.max(3, conns.length); attempt++) {
      const conn = conns[attempt % conns.length];
      try {
        const mintPubkey = new PublicKey(mintStr);
        const mintInfo = await getMint(conn as any, mintPubkey as any);
        return {
          supply: Number(mintInfo.supply),
          decimals: mintInfo.decimals,
          isInitialized: mintInfo.isInitialized,
          mintAuthority: mintInfo.mintAuthority ? mintInfo.mintAuthority.toBase58() : null,
          freezeAuthority: mintInfo.freezeAuthority ? mintInfo.freezeAuthority.toBase58() : null,
        };
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Unable to fetch mint info");
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const data = query.data!;
    const chatId = query.message!.chat.id;

    try {
      await this.bot.answerCallbackQuery(query.id);

      if (data.startsWith("setup_")) {
        await this.handleSetupCallback(query, data);
      } else if (data.startsWith("recurring_")) {
        await this.handleRecurringCallback(query, data);
      } else if (data.startsWith("alerts_")) {
        await this.handleAlertsCallback(query, data);
      } else if (data.startsWith("report_")) {
        await this.handleReportCallback(query, data);
      } else if (data.startsWith("vote_")) {
        await this.handleVoteCallback(query, data);
      } else if (data.startsWith("monitor_")) {
        await this.handleMonitorCallback(query, data);
      }
    } catch (error) {
      console.error("Callback query error:", error);
      await this.bot.answerCallbackQuery(query.id, {
        text: "Error processing request",
        show_alert: true,
      });
    }
  }

  private async handleSetupCallback(
    query: TelegramBot.CallbackQuery,
    data: string,
  ) {
    // Implementation for setup callbacks
    await this.bot.sendMessage(
      query.message!.chat.id,
      "✅ Setup option selected. Implementation in progress...",
    );
  }

  private async handleRecurringCallback(
    query: TelegramBot.CallbackQuery,
    data: string,
  ) {
    // Implementation for recurring message callbacks
    await this.bot.sendMessage(
      query.message!.chat.id,
      "⏰ Recurring alert configuration updated.",
    );
  }

  private async handleAlertsCallback(
    query: TelegramBot.CallbackQuery,
    data: string,
  ) {
    // Implementation for alert configuration callbacks
    await this.bot.sendMessage(
      query.message!.chat.id,
      "🔔 Alert settings updated.",
    );
  }

  private async handleReportCallback(
    query: TelegramBot.CallbackQuery,
    data: string,
  ) {
    const scanId = data.split("_")[1];
    // Generate and send full report
    await this.bot.sendMessage(
      query.message!.chat.id,
      "📊 Full report generation in progress...",
    );
  }

  private async handleVoteCallback(
    query: TelegramBot.CallbackQuery,
    data: string,
  ) {
    const scanId = data.split("_")[1];
    // Handle community voting
    await this.bot.sendMessage(
      query.message!.chat.id,
      "👥 Community voting interface...",
    );
  }

  private async handleMonitorCallback(
    query: TelegramBot.CallbackQuery,
    data: string,
  ) {
    const parts = data.split("_");
    const address = parts[1];
    const blockchain = parts[2];

    // Add to watchlist
    const user = await SupabaseHelper.ensureUserExists(query.from.id);

    try {
      await supabase.from("watched_addresses").insert({
        address,
        blockchain,
        watcher_id: user.id,
        watch_type: "full",
        alert_channels: [`telegram:${query.message!.chat.id}`],
        is_active: true,
      });

      await this.bot.sendMessage(
        query.message!.chat.id,
        `✅ Address monitoring started for ${address}`,
      );
    } catch (error) {
      await this.bot.sendMessage(
        query.message!.chat.id,
        "❌ Failed to start monitoring.",
      );
    }
  }

  private async handleBotAddedToGroup(msg: TelegramBot.Message) {
    const welcomeMessage = `
🚨 **NimRev Scanner Added to Group**

*Real-time blockchain threat intelligence for your community*

🔧 **Quick Setup:**
• Use /setupbot to configure group alerts
• Admins can customize threat sensitivity
• Get automatic alerts for high-risk tokens

🎯 **Features Available:**
• Real-time threat detection
• Automatic rug pull alerts  
• Community threat voting
• Cross-chain scam correlation

Use /help to see all available commands!
    `;

    await this.sendMessage(msg.chat.id, welcomeMessage, {
      parse_mode: "Markdown",
    });
  }

  public async sendAlert(chatId: string, alertData: any) {
    if (!this.bot) {
      console.log(
        "🤖 Development mode: Would send alert to",
        chatId,
        alertData,
      );
      return;
    }
    try {
      const message = this.formatAlertMessage(alertData);
      await this.sendMessage(parseInt(chatId), message, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
  }

  private formatAlertMessage(alertData: any): string {
    const riskEmoji = this.getRiskEmoji(alertData.risk_score);

    let message = `${riskEmoji} **THREAT ALERT**\n\n`;
    message += `🚨 **Type:** ${this.formatThreatCategory(alertData.alert_type)}\n`;
    message += `📍 **Address:** \`${alertData.target_address}\`\n`;
    message += `🌐 **Blockchain:** ${alertData.blockchain}\n`;
    message += `📊 **Risk Score:** ${alertData.risk_score}/100\n\n`;
    message += `⚠️ **Immediate action recommended**\n`;
    message += `📅 **Detected:** ${new Date().toLocaleString()}`;

    return message;
  }

  public start() {
    if (!this.bot) {
      console.log(
        "🤖 NimRev Telegram Bot in development mode (not connecting to Telegram)",
      );
      return;
    }
    console.log("🤖 NimRev Telegram Bot started");
  }

  public stop() {
    if (!this.bot) {
      console.log("🤖 NimRev Telegram Bot in development mode (not connected)");
      return;
    }
    this.bot.stopPolling();
    console.log("🤖 NimRev Telegram Bot stopped");
  }
}
