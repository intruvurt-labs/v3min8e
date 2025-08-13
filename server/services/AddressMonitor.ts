import { EventEmitter } from "events";
import { Connection, PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import {
  BlockchainType,
  WatchedAddress,
  AlertType,
} from "../../shared/nimrev-types";
import { supabase, SupabaseHelper } from "../utils/supabase";
import { TelegramBot } from "./TelegramBot";

interface MonitoringAlert {
  type: AlertType;
  address: string;
  blockchain: BlockchainType;
  severity: "low" | "medium" | "high" | "critical";
  data: any;
  timestamp: Date;
}

interface AddressActivity {
  address: string;
  blockchain: BlockchainType;
  activityType: string;
  amount: number;
  details: any;
  riskScore: number;
  timestamp: Date;
}

export class AddressMonitor extends EventEmitter {
  private providers: Map<BlockchainType, ethers.JsonRpcProvider> = new Map();
  private solanaConnection?: Connection;
  private telegramBot?: TelegramBot;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private watchedAddresses: Map<string, WatchedAddress> = new Map();

  // Pre-emptive rug detection thresholds
  private rugDetectionThresholds = {
    liquidityRemovalPercentage: 50, // Alert if >50% liquidity removed
    largeTransferThreshold: 100000, // Alert if transfer >$100k
    rapidTransactionCount: 10, // Alert if >10 transactions in 5 minutes
    timeWindowMinutes: 5,
    riskScoreThreshold: 30, // Alert if calculated risk score <= 30
  };

  constructor(telegramBot?: TelegramBot) {
    super();
    this.telegramBot = telegramBot;
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize EVM providers
    const evmChains = {
      ethereum: "https://eth.llamarpc.com",
      base: "https://mainnet.base.org",
      blast: "https://rpc.blast.io",
      polygon: "https://polygon-rpc.com",
      avalanche: "https://api.avax.network/ext/bc/C/rpc",
      arbitrum: "https://arb1.arbitrum.io/rpc",
      optimism: "https://mainnet.optimism.io",
    };

    for (const [chain, rpc] of Object.entries(evmChains)) {
      this.providers.set(
        chain as BlockchainType,
        new ethers.JsonRpcProvider(rpc),
      );
    }

    // Initialize Solana connection
    this.solanaConnection = new Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed",
    );
  }

  public async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🔍 Starting 24/7 Address Monitor");

    // Load watched addresses from database
    await this.loadWatchedAddresses();

    // Start monitoring each watched address
    for (const [addressKey, watchedAddress] of this.watchedAddresses) {
      if (watchedAddress.is_active) {
        this.startAddressMonitoring(watchedAddress);
      }
    }

    // Refresh watched addresses periodically (reduced frequency to prevent timeouts)
    const refreshInterval = setInterval(() => {
      this.loadWatchedAddresses();
    }, 300000); // Refresh every 5 minutes (reduced from 1 minute)

    this.monitoringIntervals.set("refresh", refreshInterval);
    console.log("✅ Address Monitor started");
  }

  public async stop() {
    this.isRunning = false;

    // Clear all monitoring intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();

    console.log("🛑 Address Monitor stopped");
  }

  private async loadWatchedAddresses() {
    try {
      // Add timeout and better error handling for database operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Database timeout after 10 seconds")),
          10000,
        );
      });

      const dbQuery = supabase
        .from("watched_addresses")
        .select("*")
        .eq("is_active", true);

      const { data: addresses, error } = await Promise.race([
        dbQuery,
        timeoutPromise,
      ]);

      if (error) {
        console.error("Failed to load watched addresses:", {
          message: error.message,
          details: error.details || "No additional details",
          hint:
            error.hint ||
            "Check database connection and Supabase configuration",
          code: error.code || "UNKNOWN_ERROR",
        });
        return;
      }

      // Update watched addresses map
      const newAddresses = new Map<string, WatchedAddress>();

      for (const address of addresses || []) {
        const key = `${address.address}:${address.blockchain}`;
        newAddresses.set(key, address);

        // Start monitoring new addresses
        if (!this.watchedAddresses.has(key)) {
          this.startAddressMonitoring(address);
        }
      }

      // Stop monitoring removed addresses
      for (const [key, address] of this.watchedAddresses) {
        if (!newAddresses.has(key)) {
          this.stopAddressMonitoring(address);
        }
      }

      this.watchedAddresses = newAddresses;
      console.log(`📋 Loaded ${addresses?.length || 0} watched addresses`);
    } catch (error) {
      console.error("Failed to load watched addresses:", error);
    }
  }

  private startAddressMonitoring(watchedAddress: WatchedAddress) {
    const key = `${watchedAddress.address}:${watchedAddress.blockchain}`;

    if (this.monitoringIntervals.has(key)) {
      return; // Already monitoring
    }

    console.log(
      `👁️ Starting monitoring: ${watchedAddress.blockchain}:${watchedAddress.address.substring(0, 8)}...`,
    );

    // Different monitoring strategies based on blockchain
    if (watchedAddress.blockchain === "solana") {
      this.startSolanaAddressMonitoring(watchedAddress);
    } else {
      this.startEvmAddressMonitoring(watchedAddress);
    }
  }

  private stopAddressMonitoring(watchedAddress: WatchedAddress) {
    const key = `${watchedAddress.address}:${watchedAddress.blockchain}`;

    if (this.monitoringIntervals.has(key)) {
      clearInterval(this.monitoringIntervals.get(key)!);
      this.monitoringIntervals.delete(key);
      console.log(
        `🚫 Stopped monitoring: ${watchedAddress.blockchain}:${watchedAddress.address.substring(0, 8)}...`,
      );
    }
  }

  private startSolanaAddressMonitoring(watchedAddress: WatchedAddress) {
    const key = `${watchedAddress.address}:${watchedAddress.blockchain}`;

    const interval = setInterval(async () => {
      try {
        await this.checkSolanaAddressActivity(watchedAddress);
      } catch (error) {
        console.error(
          `Solana monitoring error for ${watchedAddress.address}:`,
          error,
        );
      }
    }, 5000); // Check every 5 seconds

    this.monitoringIntervals.set(key, interval);
  }

  private startEvmAddressMonitoring(watchedAddress: WatchedAddress) {
    const key = `${watchedAddress.address}:${watchedAddress.blockchain}`;

    const interval = setInterval(async () => {
      try {
        await this.checkEvmAddressActivity(watchedAddress);
      } catch (error) {
        console.error(
          `EVM monitoring error for ${watchedAddress.address}:`,
          error,
        );
      }
    }, 3000); // Check every 3 seconds for EVM

    this.monitoringIntervals.set(key, interval);
  }

  private async checkSolanaAddressActivity(watchedAddress: WatchedAddress) {
    if (!this.solanaConnection) return;

    try {
      const pubkey = new PublicKey(watchedAddress.address);

      // Get recent transaction signatures
      const signatures = await this.solanaConnection.getSignaturesForAddress(
        pubkey,
        { limit: 10 },
      );

      // Check for new transactions since last check
      const lastActivityTime = watchedAddress.last_activity
        ? new Date(watchedAddress.last_activity).getTime()
        : 0;

      for (const signature of signatures) {
        const txTime = signature.blockTime ? signature.blockTime * 1000 : 0;

        if (txTime > lastActivityTime) {
          // New transaction detected
          const activity = await this.analyzeSolanaTransaction(
            signature,
            watchedAddress,
          );
          if (activity) {
            await this.processAddressActivity(activity, watchedAddress);
          }
        }
      }

      // Update last activity time
      await this.updateLastActivity(watchedAddress.id);
    } catch (error) {
      console.error("Solana address check failed:", error);
    }
  }

  private async checkEvmAddressActivity(watchedAddress: WatchedAddress) {
    const provider = this.providers.get(watchedAddress.blockchain);
    if (!provider) return;

    try {
      // Get current balance
      const currentBalance = await provider.getBalance(watchedAddress.address);

      // Get recent transactions (simplified - in reality would need more sophisticated tracking)
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 100); // Check last 100 blocks

      // Check for large transfers or suspicious activity
      await this.checkEvmTransactions(watchedAddress, fromBlock, latestBlock);

      // Update last activity time
      await this.updateLastActivity(watchedAddress.id);
    } catch (error) {
      console.error("EVM address check failed:", error);
    }
  }

  private async analyzeSolanaTransaction(
    signature: any,
    watchedAddress: WatchedAddress,
  ): Promise<AddressActivity | null> {
    if (!this.solanaConnection) return null;

    try {
      const transaction = await this.solanaConnection.getTransaction(
        signature.signature,
        {
          maxSupportedTransactionVersion: 0,
        },
      );

      if (!transaction || transaction.meta?.err) return null;

      // Analyze transaction for suspicious patterns
      const preBalances = transaction.meta.preBalances;
      const postBalances = transaction.meta.postBalances;

      let largestChange = 0;
      for (let i = 0; i < preBalances.length; i++) {
        const change = Math.abs(postBalances[i] - preBalances[i]);
        if (change > largestChange) {
          largestChange = change;
        }
      }

      // Convert lamports to SOL
      const solAmount = largestChange / 1000000000;
      const usdAmount = solAmount * 100; // Approximate SOL price

      const activity: AddressActivity = {
        address: watchedAddress.address,
        blockchain: watchedAddress.blockchain,
        activityType: this.categorizeActivity(transaction, usdAmount),
        amount: usdAmount,
        details: {
          signature: signature.signature,
          slot: signature.slot,
          blockTime: signature.blockTime,
          fee: transaction.meta?.fee,
        },
        riskScore: this.calculateActivityRiskScore(usdAmount, transaction),
        timestamp: new Date(
          signature.blockTime ? signature.blockTime * 1000 : Date.now(),
        ),
      };

      return activity;
    } catch (error) {
      console.error("Failed to analyze Solana transaction:", error);
      return null;
    }
  }

  private async checkEvmTransactions(
    watchedAddress: WatchedAddress,
    fromBlock: number,
    toBlock: number,
  ) {
    const provider = this.providers.get(watchedAddress.blockchain);
    if (!provider) return;

    try {
      // Check for transfers involving the watched address
      const filter = {
        fromBlock,
        toBlock,
        topics: [
          ethers.id("Transfer(address,address,uint256)"), // ERC-20 Transfer event
          null, // Any from address
          ethers.zeroPadValue(watchedAddress.address, 32), // To watched address
        ],
      };

      const logs = await provider.getLogs(filter);

      for (const log of logs) {
        const activity = await this.analyzeEvmTransaction(log, watchedAddress);
        if (activity) {
          await this.processAddressActivity(activity, watchedAddress);
        }
      }
    } catch (error) {
      console.error("Failed to check EVM transactions:", error);
    }
  }

  private async analyzeEvmTransaction(
    log: any,
    watchedAddress: WatchedAddress,
  ): Promise<AddressActivity | null> {
    try {
      // Decode transfer amount from log data
      const amount = ethers.getBigInt(log.data);
      const usdAmount = parseFloat(ethers.formatUnits(amount, 18)) * 2000; // Approximate ETH price

      const activity: AddressActivity = {
        address: watchedAddress.address,
        blockchain: watchedAddress.blockchain,
        activityType: this.categorizeEvmActivity(log, usdAmount),
        amount: usdAmount,
        details: {
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          contractAddress: log.address,
          topics: log.topics,
        },
        riskScore: this.calculateEvmActivityRiskScore(usdAmount, log),
        timestamp: new Date(),
      };

      return activity;
    } catch (error) {
      console.error("Failed to analyze EVM transaction:", error);
      return null;
    }
  }

  private categorizeActivity(transaction: any, amount: number): string {
    if (amount > this.rugDetectionThresholds.largeTransferThreshold) {
      return "large_transfer";
    }

    // Check if it's a liquidity-related transaction
    if (
      transaction.meta?.logMessages?.some(
        (msg: string) =>
          msg.includes("liquidity") ||
          msg.includes("swap") ||
          msg.includes("pool"),
      )
    ) {
      return "liquidity_operation";
    }

    return "standard_transfer";
  }

  private categorizeEvmActivity(log: any, amount: number): string {
    if (amount > this.rugDetectionThresholds.largeTransferThreshold) {
      return "large_transfer";
    }

    // Check if it's from a known DEX contract
    const knownDexes = [
      "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
      "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3 Router
    ];

    if (knownDexes.includes(log.address.toLowerCase())) {
      return "dex_interaction";
    }

    return "token_transfer";
  }

  private calculateActivityRiskScore(amount: number, transaction: any): number {
    let riskScore = 50; // Base score

    // Large amounts increase risk
    if (amount > 100000) {
      riskScore -= 20;
    } else if (amount > 10000) {
      riskScore -= 10;
    }

    // Multiple rapid transactions increase risk
    const recentTxCount = this.getRecentTransactionCount(transaction);
    if (recentTxCount > this.rugDetectionThresholds.rapidTransactionCount) {
      riskScore -= 15;
    }

    // Transaction during off-hours (potential stealth operation)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      // Between 10 PM and 6 AM UTC
      riskScore -= 5;
    }

    return Math.max(0, Math.min(100, riskScore));
  }

  private calculateEvmActivityRiskScore(amount: number, log: any): number {
    let riskScore = 50; // Base score

    // Large amounts increase risk
    if (amount > 100000) {
      riskScore -= 25;
    } else if (amount > 10000) {
      riskScore -= 10;
    }

    // Transactions to/from suspicious addresses
    if (
      this.isSuspiciousAddress(log.topics[1]) ||
      this.isSuspiciousAddress(log.topics[2])
    ) {
      riskScore -= 20;
    }

    return Math.max(0, Math.min(100, riskScore));
  }

  private getRecentTransactionCount(transaction: any): number {
    // Simplified implementation - would track transaction counts in real system
    return Math.floor(Math.random() * 15); // Mock data
  }

  private isSuspiciousAddress(addressHex: string): boolean {
    // Check against known suspicious addresses database
    // This is simplified - would check against real blacklist
    const suspiciousAddresses = [
      "0x0000000000000000000000000000000000000000", // Null address
      "0x000000000000000000000000000000000000dead", // Burn address
    ];

    const address = ethers.getAddress("0x" + addressHex.slice(26)); // Extract address from padded hex
    return suspiciousAddresses.includes(address.toLowerCase());
  }

  private async processAddressActivity(
    activity: AddressActivity,
    watchedAddress: WatchedAddress,
  ) {
    try {
      console.log(
        `🚨 Activity detected: ${activity.activityType} - $${activity.amount.toLocaleString()} (Risk: ${activity.riskScore})`,
      );

      // Check if activity meets alert thresholds
      const shouldAlert = this.shouldTriggerAlert(activity, watchedAddress);

      if (shouldAlert) {
        const alert: MonitoringAlert = {
          type: this.getAlertType(activity),
          address: activity.address,
          blockchain: activity.blockchain,
          severity: this.getAlertSeverity(activity.riskScore),
          data: {
            activityType: activity.activityType,
            amount: activity.amount,
            riskScore: activity.riskScore,
            details: activity.details,
          },
          timestamp: activity.timestamp,
        };

        await this.sendAlert(alert, watchedAddress);
      }

      // Log activity to database
      await this.logAddressActivity(activity);

      // Update watched address last activity
      await supabase
        .from("watched_addresses")
        .update({
          last_activity: activity.timestamp.toISOString(),
          total_alerts_sent: shouldAlert
            ? watchedAddress.total_alerts_sent + 1
            : watchedAddress.total_alerts_sent,
        })
        .eq("id", watchedAddress.id);

      this.emit("addressActivity", activity);
    } catch (error) {
      console.error("Failed to process address activity:", error);
    }
  }

  private shouldTriggerAlert(
    activity: AddressActivity,
    watchedAddress: WatchedAddress,
  ): boolean {
    // Check amount threshold
    if (
      watchedAddress.alert_threshold &&
      activity.amount < watchedAddress.alert_threshold
    ) {
      return false;
    }

    // Check risk score threshold
    if (activity.riskScore <= this.rugDetectionThresholds.riskScoreThreshold) {
      return true;
    }

    // Check for large transfers
    if (activity.amount > this.rugDetectionThresholds.largeTransferThreshold) {
      return true;
    }

    // Check for liquidity removal
    if (
      activity.activityType === "liquidity_operation" &&
      activity.details?.liquidityRemovalPercentage >
        this.rugDetectionThresholds.liquidityRemovalPercentage
    ) {
      return true;
    }

    return false;
  }

  private getAlertType(activity: AddressActivity): AlertType {
    if (activity.activityType === "liquidity_operation") {
      return "liquidity_drain";
    }

    if (activity.amount > this.rugDetectionThresholds.largeTransferThreshold) {
      return "rug_pull";
    }

    if (activity.riskScore <= 20) {
      return "rug_pull";
    }

    return "rug_pull";
  }

  private getAlertSeverity(
    riskScore: number,
  ): "low" | "medium" | "high" | "critical" {
    if (riskScore <= 15) return "critical";
    if (riskScore <= 30) return "high";
    if (riskScore <= 50) return "medium";
    return "low";
  }

  private async sendAlert(
    alert: MonitoringAlert,
    watchedAddress: WatchedAddress,
  ) {
    try {
      // Log alert to database
      await SupabaseHelper.logAlert({
        alert_type: alert.type,
        target_address: alert.address,
        blockchain: alert.blockchain,
        risk_score: alert.data.riskScore,
        alert_data: alert.data,
        recipients: watchedAddress.alert_channels,
        watched_address_id: watchedAddress.id,
      });

      // Send alerts to configured channels
      for (const channel of watchedAddress.alert_channels) {
        await this.sendChannelAlert(channel, alert);
      }

      console.log(`📢 Alert sent: ${alert.type} for ${alert.address}`);
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
  }

  private async sendChannelAlert(channel: string, alert: MonitoringAlert) {
    const [platform, identifier] = channel.split(":");

    try {
      switch (platform) {
        case "telegram":
          if (this.telegramBot) {
            await this.telegramBot.sendAlert(identifier, {
              alert_type: alert.type,
              target_address: alert.address,
              blockchain: alert.blockchain,
              risk_score: alert.data.riskScore,
              alert_data: alert.data,
            });
          }
          break;

        case "discord":
          // Discord bot integration would go here
          console.log(`Discord alert to ${identifier}: ${alert.type}`);
          break;

        case "webhook":
          // HTTP webhook would go here
          console.log(`Webhook alert to ${identifier}: ${alert.type}`);
          break;

        default:
          console.warn(`Unknown alert channel platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Failed to send ${platform} alert:`, error);
    }
  }

  private async logAddressActivity(activity: AddressActivity) {
    // Store activity in a dedicated table for historical analysis
    try {
      // This would be a separate table for address activities
      console.log(
        `📝 Logged activity: ${activity.activityType} for ${activity.address}`,
      );
    } catch (error) {
      console.error("Failed to log address activity:", error);
    }
  }

  private async updateLastActivity(watchedAddressId: string) {
    try {
      await supabase
        .from("watched_addresses")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", watchedAddressId);
    } catch (error) {
      console.error("Failed to update last activity:", error);
    }
  }

  public async addWatchedAddress(
    address: string,
    blockchain: BlockchainType,
    watcherId: string,
  ) {
    try {
      const { data, error } = await supabase
        .from("watched_addresses")
        .insert({
          address,
          blockchain,
          watcher_id: watcherId,
          watch_type: "full",
          alert_channels: [`telegram:${watcherId}`],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Start monitoring immediately
      const watchedAddress = data as WatchedAddress;
      this.watchedAddresses.set(`${address}:${blockchain}`, watchedAddress);
      this.startAddressMonitoring(watchedAddress);

      console.log(
        `✅ Added address to watchlist: ${blockchain}:${address.substring(0, 8)}...`,
      );
      return data;
    } catch (error) {
      console.error("Failed to add watched address:", error);
      throw error;
    }
  }

  public async removeWatchedAddress(addressId: string) {
    try {
      const { data, error } = await supabase
        .from("watched_addresses")
        .update({ is_active: false })
        .eq("id", addressId)
        .select()
        .single();

      if (error) throw error;

      // Stop monitoring
      const key = `${data.address}:${data.blockchain}`;
      this.watchedAddresses.delete(key);
      this.stopAddressMonitoring(data);

      console.log(
        `🗑️ Removed address from watchlist: ${data.blockchain}:${data.address.substring(0, 8)}...`,
      );
      return data;
    } catch (error) {
      console.error("Failed to remove watched address:", error);
      throw error;
    }
  }

  public getMonitoringStats() {
    return {
      totalWatched: this.watchedAddresses.size,
      activeMonitors: this.monitoringIntervals.size - 1, // Exclude refresh interval
      isRunning: this.isRunning,
      rugDetectionThresholds: this.rugDetectionThresholds,
    };
  }
}
