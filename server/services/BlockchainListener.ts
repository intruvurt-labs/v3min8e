import { EventEmitter } from "events";
import {
  BlockchainType,
  ScanRequest,
  BlockchainMonitorState,
} from "../../shared/nimrev-types";
import { Connection, PublicKey, AccountChangeCallback } from "@solana/web3.js";
import { ethers } from "ethers";
import { supabase } from "../utils/supabase";
import { ScanQueue } from "./ScanQueue";

interface ChainConfig {
  rpcEndpoints: string[];
  currentEndpointIndex: number;
  provider?: any;
  connection?: Connection;
  lastBlock: number;
  errorCount: number;
  isHealthy: boolean;
}

export class BlockchainListener extends EventEmitter {
  private chains: Map<BlockchainType, ChainConfig> = new Map();
  private scanQueue: ScanQueue;
  private isRunning = false;
  private monitorIntervals: Map<BlockchainType, NodeJS.Timeout> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  // SUBVERSION SWEEP - Enhanced threat correlation system
  private maliciousAddressFingerprints: Map<string, any> = new Map();
  private suspiciousPatterns: Map<string, any> = new Map();
  private developerWalletLinks: Map<string, any> = new Map();
  private threatCorrelationActive = true;
  private recentThreats: any[] = [];
  private subversionSweepStartTime = Date.now();

  constructor() {
    super();
    this.scanQueue = new ScanQueue();
    this.initializeChains();
  }

  private async initializeChains() {
    try {
      const { data: monitorStates } = await supabase
        .from("blockchain_monitor_state")
        .select("*");

      if (monitorStates) {
        for (const state of monitorStates) {
          await this.setupChain(state.blockchain, state.rpc_endpoints);
        }
      }
    } catch (error) {
      console.error("Failed to initialize chains:", error);
    }
  }

  private async setupChain(blockchain: BlockchainType, rpcEndpoints: string[]) {
    const config: ChainConfig = {
      rpcEndpoints,
      currentEndpointIndex: 0,
      lastBlock: 0,
      errorCount: 0,
      isHealthy: true,
    };

    try {
      if (blockchain === "solana") {
        config.connection = new Connection(rpcEndpoints[0], "confirmed");
      } else {
        // EVM chains
        config.provider = new ethers.JsonRpcProvider(rpcEndpoints[0]);
      }

      this.chains.set(blockchain, config);
      const status = blockchain === "solana" ? "🟢 [DEFAULT]" : "✅";
      console.log(`${status} Initialized ${blockchain} chain monitoring`);
    } catch (error) {
      console.error(`❌ Failed to setup ${blockchain}:`, error);
      config.isHealthy = false;
      this.chains.set(blockchain, config);
    }
  }

  private async rotateRpcEndpoint(blockchain: BlockchainType) {
    const config = this.chains.get(blockchain);
    if (!config) return;

    config.currentEndpointIndex =
      (config.currentEndpointIndex + 1) % config.rpcEndpoints.length;
    const newEndpoint = config.rpcEndpoints[config.currentEndpointIndex];

    try {
      if (blockchain === "solana") {
        config.connection = new Connection(newEndpoint, "confirmed");
      } else {
        config.provider = new ethers.JsonRpcProvider(newEndpoint);
      }

      config.errorCount = 0;
      config.isHealthy = true;
      console.log(`🔄 Rotated ${blockchain} to endpoint: ${newEndpoint}`);
    } catch (error) {
      console.error(`Failed to rotate ${blockchain} endpoint:`, error);
      config.errorCount++;
    }
  }

  public async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🚀 Starting NimRev Blockchain Listener (SUBVERSION SWEEP)");
    console.log("🟢 Default Blockchain: SOLANA");

    // Start Solana monitoring first (default blockchain)
    const solanaConfig = this.chains.get("solana");
    if (solanaConfig?.isHealthy) {
      console.log("��� Starting SOLANA monitoring [DEFAULT]");
      this.startChainMonitoring("solana");
    }

    // Start monitoring other blockchains
    for (const [blockchain, config] of this.chains) {
      if (blockchain !== "solana" && config.isHealthy) {
        this.startChainMonitoring(blockchain);
      }
    }

    // Start health check
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds

    console.log("✅ All blockchain listeners active");
  }

  public async stop() {
    this.isRunning = false;

    // Clear all intervals
    for (const interval of this.monitorIntervals.values()) {
      clearInterval(interval);
    }
    this.monitorIntervals.clear();

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    console.log("🛑 Blockchain listener stopped");
  }

  private startChainMonitoring(blockchain: BlockchainType) {
    const config = this.chains.get(blockchain);
    if (!config) return;

    if (blockchain === "solana") {
      this.startSolanaMonitoring(blockchain, config);
    } else {
      this.startEvmMonitoring(blockchain, config);
    }
  }

  private startSolanaMonitoring(
    blockchain: BlockchainType,
    config: ChainConfig,
  ) {
    const interval = setInterval(async () => {
      try {
        if (!config.connection) return;

        const slot = await config.connection.getSlot();
        const block = await config.connection.getBlock(slot, {
          maxSupportedTransactionVersion: 0,
        });

        if (block && block.blockHeight > config.lastBlock) {
          config.lastBlock = block.blockHeight;
          await this.processSolanaBlock(block, blockchain);
        }

        await this.updateMonitorState(blockchain, config);
      } catch (error) {
        await this.handleChainError(blockchain, error);
      }
    }, 2000); // Poll every 2 seconds

    this.monitorIntervals.set(blockchain, interval);
  }

  private startEvmMonitoring(blockchain: BlockchainType, config: ChainConfig) {
    const interval = setInterval(async () => {
      try {
        if (!config.provider) return;

        const blockNumber = await config.provider.getBlockNumber();

        if (blockNumber > config.lastBlock) {
          const block = await config.provider.getBlock(blockNumber, true);
          config.lastBlock = blockNumber;
          await this.processEvmBlock(block, blockchain);
        }

        await this.updateMonitorState(blockchain, config);
      } catch (error) {
        await this.handleChainError(blockchain, error);
      }
    }, 1000); // Poll every 1 second for EVM chains

    this.monitorIntervals.set(blockchain, interval);
  }

  private async processSolanaBlock(block: any, blockchain: BlockchainType) {
    if (!block.transactions) return;

    for (const tx of block.transactions) {
      if (tx.meta?.err) continue; // Skip failed transactions

      try {
        const accounts = tx.transaction.message.accountKeys;

        // Look for token program interactions
        for (const account of accounts) {
          if (this.isSolanaTokenProgram(account.toString())) {
            // Check for new token creation
            const instructions = tx.transaction.message.instructions;
            for (const instruction of instructions) {
              await this.analyzeInstruction(instruction, tx, blockchain);
            }
          }
        }
      } catch (error) {
        console.error("Error processing Solana transaction:", error);
      }
    }
  }

  private async processEvmBlock(block: any, blockchain: BlockchainType) {
    if (!block.transactions) return;

    for (const tx of block.transactions) {
      try {
        // Look for contract creation
        if (!tx.to && tx.creates) {
          await this.queueContractScan({
            token_address: tx.creates,
            blockchain,
            priority: "high",
          });
        }

        // Look for token transfers and swaps
        if (tx.to && tx.input && tx.input.length > 10) {
          await this.analyzeEvmTransaction(tx, blockchain);
        }
      } catch (error) {
        console.error("Error processing EVM transaction:", error);
      }
    }
  }

  private isSolanaTokenProgram(programId: string): boolean {
    const tokenPrograms = [
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    ];
    return tokenPrograms.includes(programId);
  }

  private async analyzeInstruction(
    instruction: any,
    tx: any,
    blockchain: BlockchainType,
  ) {
    // Detect token mint initialization
    if (instruction.data && instruction.data.length > 0) {
      const instructionType = this.parseInstructionType(instruction.data);

      if (
        instructionType === "InitializeMint" ||
        instructionType === "CreateAccount"
      ) {
        // New token detected - queue for scanning
        const tokenAddress = instruction.accounts?.[0]?.toString();
        if (tokenAddress) {
          await this.queueContractScan({
            token_address: tokenAddress,
            blockchain,
            priority: "high",
          });
        }
      }
    }
  }

  private parseInstructionType(data: any): string {
    // Simplified instruction parsing - would need proper SPL token instruction decoder
    const dataBytes = Array.isArray(data) ? data : Buffer.from(data);
    if (dataBytes[0] === 0) return "InitializeMint";
    if (dataBytes[0] === 1) return "CreateAccount";
    return "Unknown";
  }

  private async analyzeEvmTransaction(tx: any, blockchain: BlockchainType) {
    const methodId = tx.input.slice(0, 10);

    // Common ERC-20 function signatures
    const knownMethods = {
      "0xa9059cbb": "transfer",
      "0x23b872dd": "transferFrom",
      "0x095ea7b3": "approve",
      "0x40c10f19": "mint",
      "0x42966c68": "burn",
      "0x313ce567": "decimals",
      "0x95d89b41": "symbol",
      "0x06fdde03": "name",
    };

    const method = knownMethods[methodId as keyof typeof knownMethods];

    if (method === "mint" || method === "transfer") {
      // Potential new token activity
      await this.queueContractScan({
        token_address: tx.to,
        blockchain,
        priority: "normal",
      });
    }

    // Check for liquidity pool creation (Uniswap V2/V3 style)
    if (this.isLiquidityPoolCreation(tx)) {
      const tokenAddresses = this.extractTokenAddresses(tx);
      for (const address of tokenAddresses) {
        await this.queueContractScan({
          token_address: address,
          blockchain,
          priority: "high",
        });
      }
    }
  }

  private isLiquidityPoolCreation(tx: any): boolean {
    // Uniswap V2 createPair signature: 0xc9c65396
    // Uniswap V3 createPool signature: 0x13af4035
    const liquidityMethods = ["0xc9c65396", "0x13af4035"];
    return liquidityMethods.includes(tx.input.slice(0, 10));
  }

  private extractTokenAddresses(tx: any): string[] {
    // Parse transaction input to extract token addresses
    // This is simplified - would need proper ABI decoding
    const addresses: string[] = [];
    const input = tx.input.slice(10); // Remove method signature

    // Extract 32-byte chunks that look like addresses
    for (let i = 0; i < input.length; i += 64) {
      const chunk = input.slice(i, i + 64);
      if (
        chunk.length === 64 &&
        chunk.slice(0, 24) === "000000000000000000000000"
      ) {
        const address = "0x" + chunk.slice(24);
        if (address.length === 42) {
          addresses.push(address);
        }
      }
    }

    return addresses;
  }

  private async queueContractScan(scanRequest: ScanRequest) {
    try {
      // Check if we've already scanned this recently
      const { data: recentScan } = await supabase
        .from("scan_results")
        .select("id")
        .eq("token_address", scanRequest.token_address)
        .eq("blockchain", scanRequest.blockchain)
        .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Last minute
        .limit(1);

      if (recentScan && recentScan.length > 0) {
        return; // Skip if recently scanned
      }

      await this.scanQueue.addScan(scanRequest);

      this.emit("newScanQueued", scanRequest);
      console.log(
        `🔍 Queued scan: ${scanRequest.blockchain}:${scanRequest.token_address}`,
      );
    } catch (error) {
      console.error("Failed to queue scan:", error);
    }
  }

  private async handleChainError(blockchain: BlockchainType, error: any) {
    const config = this.chains.get(blockchain);
    if (!config) return;

    config.errorCount++;
    console.error(
      `❌ ${blockchain} error (count: ${config.errorCount}):`,
      error.message,
    );

    if (config.errorCount >= 3) {
      config.isHealthy = false;
      await this.rotateRpcEndpoint(blockchain);
    }

    // Update error state in database
    await supabase
      .from("blockchain_monitor_state")
      .update({
        is_healthy: config.isHealthy,
        error_count: config.errorCount,
        last_error: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq("blockchain", blockchain);
  }

  private async updateMonitorState(
    blockchain: BlockchainType,
    config: ChainConfig,
  ) {
    try {
      await supabase
        .from("blockchain_monitor_state")
        .update({
          last_block_number: config.lastBlock,
          last_processed_at: new Date().toISOString(),
          is_healthy: config.isHealthy,
          error_count: config.errorCount,
        })
        .eq("blockchain", blockchain);
    } catch (error) {
      console.error("Failed to update monitor state:", error);
    }
  }

  private async performHealthCheck() {
    for (const [blockchain, config] of this.chains) {
      try {
        let isHealthy = true;

        if (blockchain === "solana" && config.connection) {
          await config.connection.getVersion();
        } else if (config.provider) {
          await config.provider.getBlockNumber();
        }

        if (config.errorCount > 0) {
          config.errorCount = Math.max(0, config.errorCount - 1);
        }

        config.isHealthy = isHealthy;
      } catch (error) {
        await this.handleChainError(blockchain, error);
      }
    }
  }

  public getChainStatus(): Record<BlockchainType, any> {
    const status: Record<string, any> = {};

    for (const [blockchain, config] of this.chains) {
      status[blockchain] = {
        isHealthy: config.isHealthy,
        lastBlock: config.lastBlock,
        errorCount: config.errorCount,
        currentEndpoint: config.rpcEndpoints[config.currentEndpointIndex],
      };
    }

    return status;
  }

  public async forceRescan(tokenAddress: string, blockchain: BlockchainType) {
    await this.queueContractScan({
      token_address: tokenAddress,
      blockchain,
      priority: "high",
    });
  }
}
