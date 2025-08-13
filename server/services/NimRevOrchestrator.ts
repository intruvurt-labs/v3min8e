import { EventEmitter } from "events";
import { BlockchainListener } from "./BlockchainListener";
import { ScanQueue } from "./ScanQueue";
import { NimRevTelegramBot } from "./TelegramBot";
import { AddressMonitor } from "./AddressMonitor";
import { AlertSystem } from "./AlertSystem";
import { TransparencyLedger } from "./TransparencyLedger";
import { unifiedThreatMonitor } from "./UnifiedThreatMonitor";
import { supabase } from "../utils/supabase";

export class NimRevOrchestrator extends EventEmitter {
  private blockchainListener: BlockchainListener;
  private scanQueue: ScanQueue;
  private telegramBot?: NimRevTelegramBot;
  private addressMonitor: AddressMonitor;
  private alertSystem: AlertSystem;
  private transparencyLedger: TransparencyLedger;
  private isRunning = false;

  constructor() {
    super();

    // Initialize scan queue first
    this.scanQueue = new ScanQueue();

    // Initialize blockchain listener with scan queue
    this.blockchainListener = new BlockchainListener();

    // Initialize transparency ledger
    this.transparencyLedger = new TransparencyLedger();

    // Initialize Telegram bot if token is available
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.telegramBot = new NimRevTelegramBot(this.scanQueue);
    }

    // Initialize alert system with Telegram bot
    this.alertSystem = new AlertSystem(this.telegramBot);

    // Initialize address monitor with Telegram bot
    this.addressMonitor = new AddressMonitor(this.telegramBot);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle new scans from blockchain listener
    this.blockchainListener.on("newScanQueued", async (scanRequest) => {
      console.log(
        `📋 New scan queued: ${scanRequest.blockchain}:${scanRequest.token_address}`,
      );
    });

    // Handle completed scans
    this.scanQueue.on("scanCompleted", async ({ scanId, result }) => {
      console.log(`✅ Scan completed: ${scanId} (Risk: ${result.risk_score})`);

      // Emit for unified threat monitor
      this.emit("scanCompleted", { scanId, result });

      // Store in transparency ledger
      try {
        await this.transparencyLedger.storeImmutableScanResult(result);
      } catch (error) {
        console.error("Failed to store in transparency ledger:", error);
      }

      // Send alerts for high-risk tokens
      if (result.risk_score <= 30) {
        await this.alertSystem.sendAlert({
          type: this.determineAlertType(result),
          targetAddress: result.token_address,
          blockchain: result.blockchain,
          riskScore: result.risk_score,
          tokenSymbol: result.token_symbol,
          additionalData: {
            threatCategories: result.threat_categories,
            scanId: result.id,
          },
        });
      }
    });

    // Handle scan failures
    this.scanQueue.on("scanFailed", async ({ scanId, error }) => {
      console.error(`❌ Scan failed: ${scanId}`, error);

      // Log failure for monitoring
      await this.logSystemEvent("scan_failure", {
        scanId,
        error: error.message,
      });
    });

    // Handle high-risk detections
    this.scanQueue.on("highRiskDetected", async ({ scanId, result }) => {
      console.warn(
        `🚨 High risk detected: ${scanId} (Risk: ${result.risk_score})`,
      );

      // Emit for unified threat monitor
      this.emit("highRiskDetected", { scanId, result });

      // Immediate alert for critical threats
      if (result.risk_score <= 15) {
        await this.alertSystem.broadcastEmergencyAlert({
          title: "CRITICAL THREAT DETECTED",
          message: `Extremely high-risk token detected: ${result.token_symbol || "Unknown"}\nRisk Score: ${result.risk_score}/100\nAddress: ${result.token_address}`,
          urgency: "critical",
        });
      }
    });

    // Handle address activity from monitor
    this.addressMonitor.on("addressActivity", async (activity) => {
      console.log(
        `📊 Address activity: ${activity.activityType} - $${activity.amount.toLocaleString()}`,
      );

      // Log activity for analysis
      await this.logSystemEvent("address_activity", activity);
    });

    // Handle system errors
    process.on("uncaughtException", async (error) => {
      console.error("Uncaught Exception:", error);
      await this.logSystemEvent("uncaught_exception", {
        error: error.message,
        stack: error.stack,
      });

      // Attempt graceful shutdown
      await this.shutdown();
      process.exit(1);
    });

    process.on("unhandledRejection", async (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      await this.logSystemEvent("unhandled_rejection", {
        reason: reason,
        promise: promise,
      });
    });

    // Graceful shutdown handlers
    process.on("SIGTERM", async () => {
      console.log("📡 Received SIGTERM, shutting down gracefully...");
      await this.shutdown();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("📡 Received SIGINT, shutting down gracefully...");
      await this.shutdown();
      process.exit(0);
    });
  }

  private determineAlertType(scanResult: any): any {
    // Determine the most critical threat type
    const threatCategories = scanResult.threat_categories || [];

    if (threatCategories.includes("rug_pull")) return "rug_pull";
    if (threatCategories.includes("honeypot")) return "honeypot";
    if (threatCategories.includes("liquidity_drain")) return "liquidity_drain";
    if (threatCategories.includes("high_fees")) return "high_fees";
    if (threatCategories.includes("mint_authority")) return "mint_authority";
    if (threatCategories.includes("social_red_flag")) return "social_red_flag";
    if (threatCategories.includes("cross_chain_scam"))
      return "cross_chain_scam";

    return "rug_pull"; // Default for high-risk tokens
  }

  public async start() {
    if (this.isRunning) {
      console.log("⚠️ NimRev Orchestrator is already running");
      return;
    }

    console.log("🚀 Starting NimRev Scanner Orchestrator");

    try {
      // Start services in order
      console.log("📊 Starting Transparency Ledger...");
      // Transparency ledger is always ready

      console.log("🌐 Starting Unified Threat Monitor...");
      await unifiedThreatMonitor.start();
      unifiedThreatMonitor.setOrchestrator(this);

      console.log("📢 Starting Alert System...");
      await this.alertSystem.start();

      console.log("🔄 Starting Scan Queue...");
      await this.scanQueue.start();

      console.log("🔍 Starting Address Monitor...");
      await this.addressMonitor.start();

      console.log("📡 Starting Blockchain Listener...");
      await this.blockchainListener.start();

      if (this.telegramBot) {
        console.log("🤖 Starting Telegram Bot...");
        this.telegramBot.start();
      }

      this.isRunning = true;

      // Log system startup
      await this.logSystemEvent("system_startup", {
        version: process.env.SCANNER_VERSION || "1.0.0",
        timestamp: new Date().toISOString(),
      });

      console.log("✅ NimRev Scanner is now operational");
      console.log("🔍 Multi-chain threat detection active");
      console.log("📊 Real-time monitoring enabled");
      console.log("🛡️ Transparency ledger recording");
    } catch (error) {
      console.error("❌ Failed to start NimRev Orchestrator:", error);
      await this.shutdown();
      throw error;
    }
  }

  public async shutdown() {
    if (!this.isRunning) {
      console.log("⚠️ NimRev Orchestrator is not running");
      return;
    }

    console.log("🛑 Shutting down NimRev Scanner...");

    try {
      // Stop services in reverse order
      if (this.telegramBot) {
        console.log("🤖 Stopping Telegram Bot...");
        this.telegramBot.stop();
      }

      console.log("📡 Stopping Blockchain Listener...");
      await this.blockchainListener.stop();

      console.log("🔍 Stopping Address Monitor...");
      await this.addressMonitor.stop();

      console.log("🔄 Stopping Scan Queue...");
      await this.scanQueue.stop();

      console.log("📢 Stopping Alert System...");
      await this.alertSystem.stop();

      console.log("🌐 Stopping Unified Threat Monitor...");
      await unifiedThreatMonitor.stop();

      this.isRunning = false;

      // Log system shutdown
      await this.logSystemEvent("system_shutdown", {
        timestamp: new Date().toISOString(),
      });

      console.log("✅ NimRev Scanner shutdown complete");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }
  }

  public async getSystemStatus() {
    const queueStatus = this.scanQueue.getQueueStatus();
    const monitorStatus = this.addressMonitor.getMonitoringStats();
    const alertStatus = this.alertSystem.getAlertStats();
    const transparencyStatus = this.transparencyLedger.getSystemStatus();
    const blockchainStatus = this.blockchainListener.getChainStatus();

    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      services: {
        scanQueue: queueStatus,
        addressMonitor: monitorStatus,
        alertSystem: alertStatus,
        transparencyLedger: transparencyStatus,
        blockchainListener: blockchainStatus,
        telegramBot: this.telegramBot ? "active" : "disabled",
      },
      version: process.env.SCANNER_VERSION || "1.0.0",
    };
  }

  public async performHealthCheck() {
    try {
      // Check database connectivity
      const { error: dbError } = await supabase
        .from("scan_results")
        .select("count")
        .limit(1);

      if (dbError) {
        throw new Error(`Database health check failed: ${dbError.message}`);
      }

      // Check scan queue
      const queueStatus = this.scanQueue.getQueueStatus();
      if (!queueStatus.isRunning) {
        throw new Error("Scan queue is not running");
      }

      // Check blockchain listeners
      const blockchainStatus = this.blockchainListener.getChainStatus();
      const healthyChains = Object.values(blockchainStatus).filter(
        (status) => status.isHealthy,
      ).length;
      const totalChains = Object.keys(blockchainStatus).length;

      if (healthyChains < totalChains * 0.7) {
        // At least 70% of chains should be healthy
        throw new Error(
          `Only ${healthyChains}/${totalChains} blockchain connections are healthy`,
        );
      }

      // Check transparency ledger
      const transparencyStatus = this.transparencyLedger.getSystemStatus();
      if (transparencyStatus.status === "degraded") {
        console.warn("⚠️ Transparency ledger is in degraded state");
      }

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        details: {
          database: "healthy",
          scanQueue: queueStatus.isRunning ? "healthy" : "unhealthy",
          blockchainConnections: `${healthyChains}/${totalChains} healthy`,
          transparencyLedger: transparencyStatus.status,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async logSystemEvent(eventType: string, data: any) {
    try {
      // This would be logged to a system_events table
      console.log(`📝 System Event: ${eventType}`, data);

      // In a real implementation, you'd store this in a dedicated monitoring system
      // For now, we'll just log to console
    } catch (error) {
      console.error("Failed to log system event:", error);
    }
  }

  public async emergencyStop() {
    console.log("🚨 EMERGENCY STOP INITIATED");

    // Immediately stop processing new scans
    await this.scanQueue.pauseQueue();

    // Stop blockchain listeners
    await this.blockchainListener.stop();

    // Send emergency notification
    if (this.alertSystem) {
      await this.alertSystem.broadcastEmergencyAlert({
        title: "SYSTEM EMERGENCY STOP",
        message:
          "NimRev Scanner has been emergency stopped. All scanning operations halted.",
        urgency: "critical",
      });
    }

    console.log("🚨 Emergency stop complete - system is now in safe mode");
  }

  public async getTransparencyReport(scanId: string) {
    return await this.transparencyLedger.generateTransparencyReport(scanId);
  }

  public async performManualScan(
    tokenAddress: string,
    blockchain: any,
    userId?: string,
  ) {
    return await this.scanQueue.addScan({
      token_address: tokenAddress,
      blockchain,
      priority: "high",
      requested_by: userId,
      deep_scan: true,
    });
  }
}
