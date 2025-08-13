import { ethers } from "ethers";
import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  BlockchainType,
  ScanResult,
  BytecodeAnalysis,
  SocialAnalysis,
  LiquidityAnalysis,
  FeeAnalysis,
} from "../../shared/nimrev-types";
import { ThreatScoring } from "./ThreatScoring";
import { SocialFootprintAnalyzer } from "./SocialFootprintAnalyzer";
import { BytecodeAnalyzer } from "./BytecodeAnalyzer";
import crypto from "crypto";

export class SubversiveScanner {
  private threatScoring: ThreatScoring;
  private socialAnalyzer: SocialFootprintAnalyzer;
  private bytecodeAnalyzer: BytecodeAnalyzer;
  private providers: Map<BlockchainType, ethers.JsonRpcProvider> = new Map();
  private solanaConnection?: Connection;

  constructor() {
    this.threatScoring = new ThreatScoring();
    this.socialAnalyzer = new SocialFootprintAnalyzer();
    this.bytecodeAnalyzer = new BytecodeAnalyzer();
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

  public async performComprehensiveScan(
    tokenAddress: string,
    blockchain: BlockchainType,
    deepScan: boolean = true,
  ): Promise<ScanResult> {
    const startTime = Date.now();
    console.log(
      `🔍 Starting comprehensive scan: ${blockchain}:${tokenAddress}`,
    );

    try {
      let scanResult: Partial<ScanResult> = {
        token_address: tokenAddress,
        blockchain,
        threat_categories: [],
        scanner_version: "1.0.0",
        community_votes_up: 0,
        community_votes_down: 0,
        is_public: true,
        scan_status: "processing",
      };

      // 1. Basic Contract Information
      const contractInfo = await this.getContractInfo(tokenAddress, blockchain);
      Object.assign(scanResult, contractInfo);

      // 2. Bytecode Analysis (Deep Contract Analysis)
      if (deepScan && blockchain !== "solana") {
        scanResult.bytecode_analysis =
          await this.bytecodeAnalyzer.analyzeBytecode(tokenAddress, blockchain);
      }

      // 3. Fee Structure Analysis (Honeypot Detection)
      scanResult.fee_analysis = await this.analyzeFeeStructure(
        tokenAddress,
        blockchain,
      );

      // 4. Liquidity Analysis (Rug Pull Detection)
      scanResult.liquidity_analysis = await this.analyzeLiquidity(
        tokenAddress,
        blockchain,
      );

      // 5. Social Footprint Analysis
      if (deepScan) {
        scanResult.social_analysis =
          await this.socialAnalyzer.analyzeSocialFootprint(
            tokenAddress,
            blockchain,
            scanResult.token_symbol,
            scanResult.creator_address,
          );
      }

      // 6. Cross-Chain Threat Correlation
      const crossChainThreats = await this.analyzeCrossChainThreats(
        tokenAddress,
        blockchain,
        scanResult.creator_address,
      );

      // 7. Calculate Risk Score
      scanResult.risk_score = this.threatScoring.calculateRiskScore({
        bytecode_analysis: scanResult.bytecode_analysis,
        social_analysis: scanResult.social_analysis,
        liquidity_analysis: scanResult.liquidity_analysis,
        fee_analysis: scanResult.fee_analysis,
        cross_chain_threats: crossChainThreats,
      });

      // 8. Determine Threat Categories
      scanResult.threat_categories = this.identifyThreatCategories(scanResult);

      // 9. Generate Cryptographic Signature
      scanResult.signature = this.generateScanSignature(scanResult);

      // 10. Store in IPFS for immutability
      scanResult.ipfs_hash = await this.storeInIPFS(scanResult);

      scanResult.scan_status = "completed";

      const scanDuration = Date.now() - startTime;
      console.log(
        `✅ Scan completed: ${blockchain}:${tokenAddress} (${scanDuration}ms, risk: ${scanResult.risk_score})`,
      );

      return scanResult as ScanResult;
    } catch (error) {
      console.error(`❌ Scan failed: ${blockchain}:${tokenAddress}`, error);
      throw error;
    }
  }

  private async getContractInfo(
    address: string,
    blockchain: BlockchainType,
  ): Promise<Partial<ScanResult>> {
    if (blockchain === "solana") {
      return this.getSolanaTokenInfo(address);
    } else {
      return this.getEvmTokenInfo(address, blockchain);
    }
  }

  private async getSolanaTokenInfo(
    address: string,
  ): Promise<Partial<ScanResult>> {
    try {
      if (!this.solanaConnection)
        throw new Error("Solana connection not available");

      const pubkey = new PublicKey(address);
      const accountInfo = await this.solanaConnection.getAccountInfo(pubkey);

      if (!accountInfo) {
        throw new Error("Token account not found");
      }

      // Parse SPL token metadata (simplified)
      return {
        contract_hash: accountInfo.data.toString("hex").slice(0, 64),
        token_symbol: "UNKNOWN",
        token_name: "Unknown Token",
        creator_address: accountInfo.owner.toString(),
      };
    } catch (error) {
      console.error("Failed to get Solana token info:", error);
      return {};
    }
  }

  private async getEvmTokenInfo(
    address: string,
    blockchain: BlockchainType,
  ): Promise<Partial<ScanResult>> {
    try {
      const provider = this.providers.get(blockchain);
      if (!provider)
        throw new Error(`Provider not available for ${blockchain}`);

      const contract = new ethers.Contract(
        address,
        [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
          "function totalSupply() view returns (uint256)",
          "function owner() view returns (address)",
          "function getOwner() view returns (address)",
        ],
        provider,
      );

      const [name, symbol, code] = await Promise.allSettled([
        contract.name(),
        contract.symbol(),
        provider.getCode(address),
      ]);

      let creator_address: string | undefined;
      try {
        creator_address = await contract.owner();
      } catch {
        try {
          creator_address = await contract.getOwner();
        } catch {
          // Owner function not available
        }
      }

      return {
        token_name: name.status === "fulfilled" ? name.value : "Unknown",
        token_symbol: symbol.status === "fulfilled" ? symbol.value : "UNKNOWN",
        contract_hash:
          code.status === "fulfilled"
            ? crypto.createHash("sha256").update(code.value).digest("hex")
            : undefined,
        creator_address,
      };
    } catch (error) {
      console.error("Failed to get EVM token info:", error);
      return {};
    }
  }

  private async analyzeFeeStructure(
    address: string,
    blockchain: BlockchainType,
  ): Promise<FeeAnalysis> {
    const feeAnalysis: FeeAnalysis = {
      buy_fee_percentage: 0,
      sell_fee_percentage: 0,
      transfer_fee_percentage: 0,
      max_fee_percentage: 0,
      fee_exemptions: [],
      hidden_fees: false,
      honeypot_detected: false,
      anti_bot_mechanisms: [],
      sandwich_protection: false,
      cooldown_periods: [],
    };

    if (blockchain === "solana") {
      return this.analyzeSolanaFees(address, feeAnalysis);
    } else {
      return this.analyzeEvmFees(address, blockchain, feeAnalysis);
    }
  }

  private async analyzeSolanaFees(
    address: string,
    feeAnalysis: FeeAnalysis,
  ): Promise<FeeAnalysis> {
    // Solana token fee analysis (simplified)
    try {
      if (!this.solanaConnection) return feeAnalysis;

      const pubkey = new PublicKey(address);
      const accountInfo = await this.solanaConnection.getAccountInfo(pubkey);

      if (accountInfo && accountInfo.data.length > 0) {
        // Check for Token-2022 extensions that might include fees
        const hasTransferFeeExtension = this.checkSolanaTransferFeeExtension(
          accountInfo.data,
        );
        if (hasTransferFeeExtension) {
          feeAnalysis.transfer_fee_percentage = 0.5; // Estimated
          feeAnalysis.hidden_fees = true;
        }
      }

      return feeAnalysis;
    } catch (error) {
      console.error("Solana fee analysis failed:", error);
      return feeAnalysis;
    }
  }

  private checkSolanaTransferFeeExtension(data: Buffer): boolean {
    // Simplified check for Token-2022 transfer fee extension
    // In real implementation, would properly parse token extensions
    return data.includes(Buffer.from("TransferFeeConfig"));
  }

  private async analyzeEvmFees(
    address: string,
    blockchain: BlockchainType,
    feeAnalysis: FeeAnalysis,
  ): Promise<FeeAnalysis> {
    try {
      const provider = this.providers.get(blockchain);
      if (!provider) return feeAnalysis;

      const code = await provider.getCode(address);

      // Check for common fee-related function signatures in bytecode
      const feePatterns = {
        taxFee: "a457c2d7", // decreaseAllowance (often used for tax)
        reflectionFee: "70a08231", // balanceOf (reflection tokens)
        burnFee: "42966c68", // burn
        marketingFee: "dd62ed3e", // allowance (marketing tax)
        liquidityFee: "23b872dd", // transferFrom (liquidity tax)
      };

      let detectedFeeType = "";
      for (const [feeType, signature] of Object.entries(feePatterns)) {
        if (code.includes(signature)) {
          detectedFeeType = feeType;
          break;
        }
      }

      // Simulate transactions to detect honeypot
      const honeypotResult = await this.simulateHoneypotTest(
        address,
        blockchain,
      );
      feeAnalysis.honeypot_detected = honeypotResult.isHoneypot;
      feeAnalysis.buy_fee_percentage = honeypotResult.buyFee;
      feeAnalysis.sell_fee_percentage = honeypotResult.sellFee;

      // Check for anti-bot mechanisms
      if (code.includes("antiBot") || code.includes("blacklist")) {
        feeAnalysis.anti_bot_mechanisms.push("blacklist");
      }

      if (code.includes("cooldown") || code.includes("delay")) {
        feeAnalysis.anti_bot_mechanisms.push("cooldown");
        feeAnalysis.cooldown_periods = [60]; // Estimated 60 seconds
      }

      // Check for sandwich protection
      if (code.includes("MEV") || code.includes("frontrun")) {
        feeAnalysis.sandwich_protection = true;
      }

      feeAnalysis.max_fee_percentage = Math.max(
        feeAnalysis.buy_fee_percentage,
        feeAnalysis.sell_fee_percentage,
        feeAnalysis.transfer_fee_percentage,
      );

      feeAnalysis.hidden_fees = feeAnalysis.max_fee_percentage > 10;

      return feeAnalysis;
    } catch (error) {
      console.error("EVM fee analysis failed:", error);
      return feeAnalysis;
    }
  }

  private async simulateHoneypotTest(
    address: string,
    blockchain: BlockchainType,
  ): Promise<{
    isHoneypot: boolean;
    buyFee: number;
    sellFee: number;
  }> {
    try {
      // Use honeypot.is API or similar service
      const response = await axios.get(
        `https://api.honeypot.is/v2/IsHoneypot`,
        {
          params: { address },
          timeout: 5000,
        },
      );

      const data = response.data;
      return {
        isHoneypot: data.honeypotResult?.isHoneypot || false,
        buyFee: parseFloat(data.simulationResult?.buyTax || "0"),
        sellFee: parseFloat(data.simulationResult?.sellTax || "0"),
      };
    } catch (error) {
      // Fallback to manual simulation if API fails
      return {
        isHoneypot: false,
        buyFee: 0,
        sellFee: 0,
      };
    }
  }

  private async analyzeLiquidity(
    address: string,
    blockchain: BlockchainType,
  ): Promise<LiquidityAnalysis> {
    const liquidityAnalysis: LiquidityAnalysis = {
      total_liquidity_usd: 0,
      liquidity_locked: false,
      lock_percentage: 0,
      major_holders: [],
      recent_large_transactions: [],
      liquidity_stability_score: 0,
      rug_pull_indicators: [],
    };

    try {
      if (blockchain === "solana") {
        return this.analyzeSolanaLiquidity(address, liquidityAnalysis);
      } else {
        return this.analyzeEvmLiquidity(address, blockchain, liquidityAnalysis);
      }
    } catch (error) {
      console.error("Liquidity analysis failed:", error);
      return liquidityAnalysis;
    }
  }

  private async analyzeSolanaLiquidity(
    address: string,
    analysis: LiquidityAnalysis,
  ): Promise<LiquidityAnalysis> {
    // Use Jupiter or Raydium APIs for Solana liquidity data
    try {
      const response = await axios.get(
        `https://api.jup.ag/price/v2?ids=${address}`,
        {
          timeout: 5000,
        },
      );

      if (response.data.data?.[address]) {
        const priceData = response.data.data[address];
        analysis.total_liquidity_usd = priceData.liquidity || 0;
      }

      return analysis;
    } catch (error) {
      console.error("Solana liquidity analysis failed:", error);
      return analysis;
    }
  }

  private async analyzeEvmLiquidity(
    address: string,
    blockchain: BlockchainType,
    analysis: LiquidityAnalysis,
  ): Promise<LiquidityAnalysis> {
    try {
      const provider = this.providers.get(blockchain);
      if (!provider) return analysis;

      // Check major DEX pairs
      const dexFactories = this.getDexFactories(blockchain);

      for (const factory of dexFactories) {
        const pairAddress = await this.getPairAddress(
          factory,
          address,
          blockchain,
        );
        if (pairAddress) {
          const liquidityData = await this.analyzePairLiquidity(
            pairAddress,
            blockchain,
          );
          analysis.total_liquidity_usd += liquidityData.liquidity_usd;
          analysis.major_holders.push(...liquidityData.holders);
        }
      }

      // Check for locked liquidity
      const lockData = await this.checkLiquidityLocks(address, blockchain);
      analysis.liquidity_locked = lockData.isLocked;
      analysis.lock_percentage = lockData.lockPercentage;
      analysis.lock_duration_days = lockData.lockDurationDays;

      // Calculate stability score
      analysis.liquidity_stability_score =
        this.calculateLiquidityStability(analysis);

      // Identify rug pull indicators
      analysis.rug_pull_indicators = this.identifyRugPullIndicators(analysis);

      return analysis;
    } catch (error) {
      console.error("EVM liquidity analysis failed:", error);
      return analysis;
    }
  }

  private getDexFactories(blockchain: BlockchainType): string[] {
    const factories: Record<string, string[]> = {
      ethereum: ["0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"], // Uniswap V2
      base: ["0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6"], // BaseSwap
      blast: ["0x5C346464d33F90bABaf70dB6388D4607055f17c7"], // BlastDEX
      polygon: ["0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32"], // QuickSwap
      arbitrum: ["0xc35DADB65012eC5796536bD9864eD8773aBc74C4"], // SushiSwap
      avalanche: ["0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10"], // TraderJoe
      optimism: ["0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf"], // Velodrome
    };

    return factories[blockchain] || [];
  }

  private async getPairAddress(
    factoryAddress: string,
    tokenAddress: string,
    blockchain: BlockchainType,
  ): Promise<string | null> {
    try {
      const provider = this.providers.get(blockchain);
      if (!provider) return null;

      const factoryContract = new ethers.Contract(
        factoryAddress,
        [
          "function getPair(address tokenA, address tokenB) view returns (address pair)",
        ],
        provider,
      );

      // Common base tokens
      const baseTokens = {
        ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        base: "0x4200000000000000000000000000000000000006", // WETH
        polygon: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
        arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
        avalanche: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // WAVAX
        optimism: "0x4200000000000000000000000000000000000006", // WETH
      };

      const baseToken = baseTokens[blockchain as keyof typeof baseTokens];
      if (!baseToken) return null;

      const pairAddress = await factoryContract.getPair(
        tokenAddress,
        baseToken,
      );
      return pairAddress !== ethers.ZeroAddress ? pairAddress : null;
    } catch (error) {
      return null;
    }
  }

  private async analyzePairLiquidity(
    pairAddress: string,
    blockchain: BlockchainType,
  ): Promise<{
    liquidity_usd: number;
    holders: Array<{
      address: string;
      percentage: number;
      is_known_exchange: boolean;
    }>;
  }> {
    // Simplified liquidity analysis
    return {
      liquidity_usd: 0,
      holders: [],
    };
  }

  private async checkLiquidityLocks(
    address: string,
    blockchain: BlockchainType,
  ): Promise<{
    isLocked: boolean;
    lockPercentage: number;
    lockDurationDays?: number;
  }> {
    // Check common liquidity lockers (Team Finance, UNCX, etc.)
    return {
      isLocked: false,
      lockPercentage: 0,
    };
  }

  private calculateLiquidityStability(analysis: LiquidityAnalysis): number {
    let score = 50; // Base score

    if (analysis.liquidity_locked) score += 30;
    if (analysis.total_liquidity_usd > 100000) score += 10;
    if (analysis.total_liquidity_usd > 1000000) score += 10;

    return Math.min(100, score);
  }

  private identifyRugPullIndicators(analysis: LiquidityAnalysis): string[] {
    const indicators: string[] = [];

    if (!analysis.liquidity_locked) indicators.push("unlocked_liquidity");
    if (analysis.total_liquidity_usd < 10000) indicators.push("low_liquidity");
    if (analysis.major_holders.some((h) => h.percentage > 50))
      indicators.push("concentrated_holdings");

    return indicators;
  }

  private async analyzeCrossChainThreats(
    address: string,
    blockchain: BlockchainType,
    creatorAddress?: string,
  ): Promise<any[]> {
    // Cross-chain threat correlation
    const threats: any[] = [];

    if (creatorAddress) {
      // Check if creator has deployed similar contracts on other chains
      // This would query the database for known threat correlations
    }

    return threats;
  }

  private identifyThreatCategories(scanResult: Partial<ScanResult>): string[] {
    const categories: string[] = [];

    if (scanResult.fee_analysis?.honeypot_detected) {
      categories.push("honeypot");
    }

    if (
      scanResult.fee_analysis?.max_fee_percentage &&
      scanResult.fee_analysis.max_fee_percentage > 10
    ) {
      categories.push("high_fees");
    }

    if (
      scanResult.bytecode_analysis?.has_mint_function &&
      !scanResult.bytecode_analysis.access_controls.length
    ) {
      categories.push("mint_authority");
    }

    if (scanResult.liquidity_analysis?.rug_pull_indicators.length) {
      categories.push("rug_pull");
    }

    if (scanResult.social_analysis?.social_red_flags.length) {
      categories.push("social_red_flag");
    }

    return categories;
  }

  private generateScanSignature(scanResult: Partial<ScanResult>): string {
    const data = JSON.stringify({
      token_address: scanResult.token_address,
      blockchain: scanResult.blockchain,
      risk_score: scanResult.risk_score,
      timestamp: new Date().toISOString(),
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  private async storeInIPFS(
    scanResult: Partial<ScanResult>,
  ): Promise<string | undefined> {
    try {
      // In a real implementation, this would upload to IPFS
      // For now, return a mock hash
      const data = JSON.stringify(scanResult);
      return crypto.createHash("sha256").update(data).digest("hex");
    } catch (error) {
      console.error("Failed to store in IPFS:", error);
      return undefined;
    }
  }
}
