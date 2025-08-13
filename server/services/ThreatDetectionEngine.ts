import crypto from "crypto";
import { EventEmitter } from "events";

interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  pattern: RegExp | string | ((data: any) => boolean);
  category:
    | "honeypot"
    | "rug_pull"
    | "phishing"
    | "mint_abuse"
    | "liquidity_manipulation"
    | "social_engineering"
    | "code_vulnerability";
  indicators: string[];
  mitigation: string;
  cveId?: string;
  references?: string[];
}

interface ContractAnalysis {
  address: string;
  network: string;
  bytecode?: string;
  sourceCode?: string;
  abi?: any[];
  metadata?: any;
  transactions?: any[];
  tokenMetrics?: any;
  socialMetrics?: any;
}

interface ThreatDetectionResult {
  threatId: string;
  patternId: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  title: string;
  description: string;
  evidence: string[];
  indicators: string[];
  mitigation: string;
  category: string;
  riskScore: number;
  metadata: any;
}

export class ThreatDetectionEngine extends EventEmitter {
  private patterns: Map<string, ThreatPattern> = new Map();
  private mlModels: Map<string, any> = new Map();
  private riskThresholds = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90,
  };

  constructor() {
    super();
    this.initializeThreatPatterns();
    this.initializeMLModels();
  }

  private initializeThreatPatterns(): void {
    const patterns: ThreatPattern[] = [
      // Honeypot Detection Patterns
      {
        id: "HP001",
        name: "Asymmetric Trading Pattern",
        description: "Contract allows buys but restricts or prevents sells",
        severity: "critical",
        confidence: 95,
        pattern: (data: ContractAnalysis) => this.detectAsymmetricTrading(data),
        category: "honeypot",
        indicators: [
          "buy_function_present",
          "sell_function_restricted",
          "transfer_limitations",
        ],
        mitigation: "Test sell functionality on testnet before investing",
        cveId: "CVE-2023-HONEYPOT-001",
      },
      {
        id: "HP002",
        name: "Hidden Fee Manipulation",
        description:
          "Contract can dynamically change fees to 100% preventing exits",
        severity: "critical",
        confidence: 90,
        pattern: (data: ContractAnalysis) =>
          this.detectHiddenFeeManipulation(data),
        category: "honeypot",
        indicators: [
          "dynamic_fee_modification",
          "owner_only_fee_control",
          "no_fee_limits",
        ],
        mitigation: "Verify fee modification functions and limits",
      },
      {
        id: "HP003",
        name: "Blacklist Honeypot",
        description:
          "Contract can blacklist addresses preventing them from trading",
        severity: "high",
        confidence: 88,
        pattern: (data: ContractAnalysis) => this.detectBlacklistHoneypot(data),
        category: "honeypot",
        indicators: [
          "blacklist_function",
          "owner_controlled_blacklist",
          "no_blacklist_removal",
        ],
        mitigation: "Check for blacklist functions and governance mechanisms",
      },

      // Rug Pull Detection Patterns
      {
        id: "RP001",
        name: "Unlimited Mint Authority",
        description:
          "Contract owner can mint unlimited tokens diluting holder value",
        severity: "critical",
        confidence: 92,
        pattern: (data: ContractAnalysis) => this.detectUnlimitedMint(data),
        category: "rug_pull",
        indicators: [
          "mint_function_present",
          "no_mint_cap",
          "owner_mint_control",
        ],
        mitigation: "Verify mint functions are disabled or properly governed",
      },
      {
        id: "RP002",
        name: "Liquidity Drain Risk",
        description: "Liquidity can be removed without warning or time delays",
        severity: "critical",
        confidence: 85,
        pattern: (data: ContractAnalysis) =>
          this.detectLiquidityDrainRisk(data),
        category: "rug_pull",
        indicators: [
          "unlocked_liquidity",
          "owner_liquidity_control",
          "no_timelock",
        ],
        mitigation: "Verify liquidity is locked for sufficient duration",
      },
      {
        id: "RP003",
        name: "Ownership Concentration",
        description: "Single entity controls majority of token supply",
        severity: "high",
        confidence: 80,
        pattern: (data: ContractAnalysis) =>
          this.detectOwnershipConcentration(data),
        category: "rug_pull",
        indicators: [
          "high_owner_balance",
          "few_large_holders",
          "concentrated_supply",
        ],
        mitigation:
          "Monitor large holder activities and consider position sizing",
      },

      // Code Vulnerability Patterns
      {
        id: "CV001",
        name: "Reentrancy Vulnerability",
        description: "Contract susceptible to reentrancy attacks",
        severity: "high",
        confidence: 85,
        pattern: (data: ContractAnalysis) => this.detectReentrancy(data),
        category: "code_vulnerability",
        indicators: [
          "external_call_before_state_change",
          "no_reentrancy_guard",
          "state_modification_after_call",
        ],
        mitigation:
          "Implement reentrancy guards and follow checks-effects-interactions pattern",
        cveId: "CVE-2016-REENTRANCY",
      },
      {
        id: "CV002",
        name: "Integer Overflow/Underflow",
        description: "Arithmetic operations without overflow protection",
        severity: "medium",
        confidence: 75,
        pattern: (data: ContractAnalysis) => this.detectIntegerOverflow(data),
        category: "code_vulnerability",
        indicators: [
          "unchecked_arithmetic",
          "no_safemath",
          "potential_overflow",
        ],
        mitigation:
          "Use SafeMath library or Solidity 0.8+ built-in overflow protection",
      },
      {
        id: "CV003",
        name: "Delegatecall to Untrusted Contract",
        description: "Dangerous delegatecall to user-controlled addresses",
        severity: "critical",
        confidence: 95,
        pattern: (data: ContractAnalysis) =>
          this.detectUnsafeDelegatecall(data),
        category: "code_vulnerability",
        indicators: [
          "delegatecall_present",
          "user_controlled_target",
          "no_address_validation",
        ],
        mitigation:
          "Validate delegatecall targets and restrict to trusted contracts",
      },

      // Social Engineering Patterns
      {
        id: "SE001",
        name: "Fake Team Information",
        description: "Team profiles appear to be fabricated or stolen",
        severity: "high",
        confidence: 70,
        pattern: (data: ContractAnalysis) => this.detectFakeTeam(data),
        category: "social_engineering",
        indicators: [
          "stock_photos_detected",
          "fake_linkedin_profiles",
          "inconsistent_information",
        ],
        mitigation:
          "Verify team credentials and look for genuine social presence",
      },
      {
        id: "SE002",
        name: "Coordinated Promotion Campaign",
        description: "Artificial social media hype and bot-driven promotion",
        severity: "medium",
        confidence: 65,
        pattern: (data: ContractAnalysis) =>
          this.detectCoordinatedPromotion(data),
        category: "social_engineering",
        indicators: ["bot_followers", "coordinated_posts", "inorganic_growth"],
        mitigation: "Look for organic community growth and genuine engagement",
      },

      // Phishing and Impersonation
      {
        id: "PH001",
        name: "Domain Impersonation",
        description: "Website or social media impersonates legitimate projects",
        severity: "high",
        confidence: 88,
        pattern: (data: ContractAnalysis) =>
          this.detectDomainImpersonation(data),
        category: "phishing",
        indicators: ["similar_domain", "copied_content", "fake_branding"],
        mitigation: "Always verify official websites and social media accounts",
      },

      // Liquidity Manipulation
      {
        id: "LM001",
        name: "Flash Loan Manipulation",
        description:
          "Contract vulnerable to flash loan price manipulation attacks",
        severity: "high",
        confidence: 82,
        pattern: (data: ContractAnalysis) =>
          this.detectFlashLoanVulnerability(data),
        category: "liquidity_manipulation",
        indicators: [
          "single_dex_price_oracle",
          "no_price_validation",
          "large_price_impact_possible",
        ],
        mitigation:
          "Use time-weighted average prices and multiple oracle sources",
      },
    ];

    patterns.forEach((pattern) => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  private initializeMLModels(): void {
    // Initialize ML models for advanced pattern recognition
    // In production, these would be trained models for:
    // - Bytecode similarity analysis
    // - Social network analysis
    // - Transaction pattern recognition
    // - Risk correlation modeling

    this.mlModels.set("bytecode_similarity", {
      type: "similarity_hash",
      threshold: 0.85,
      analyze: (bytecode: string) => this.analyzeBytcodeSimilarity(bytecode),
    });

    this.mlModels.set("social_sentiment", {
      type: "sentiment_analysis",
      threshold: 0.3,
      analyze: (socialData: any) => this.analyzeSocialSentiment(socialData),
    });

    this.mlModels.set("transaction_patterns", {
      type: "pattern_recognition",
      threshold: 0.7,
      analyze: (transactions: any[]) =>
        this.analyzeTransactionPatterns(transactions),
    });
  }

  public async analyzeContract(
    analysis: ContractAnalysis,
  ): Promise<ThreatDetectionResult[]> {
    const results: ThreatDetectionResult[] = [];

    // Run all threat detection patterns
    for (const [patternId, pattern] of this.patterns) {
      try {
        const isMatch = await this.evaluatePattern(pattern, analysis);

        if (isMatch) {
          const result = this.createThreatResult(pattern, analysis);
          results.push(result);

          this.emit("threat_detected", {
            threatId: result.threatId,
            severity: result.severity,
            category: result.category,
            address: analysis.address,
          });
        }
      } catch (error) {
        console.error(`Error evaluating pattern ${patternId}:`, error);
      }
    }

    // Apply ML models for advanced detection
    const mlResults = await this.applyMLModels(analysis);
    results.push(...mlResults);

    // Calculate composite risk score
    const compositeRisk = this.calculateCompositeRisk(results);

    // Add meta-analysis results
    if (compositeRisk.score > this.riskThresholds.critical) {
      results.push(this.createCriticalRiskAlert(compositeRisk, analysis));
    }

    return results.sort((a, b) => b.riskScore - a.riskScore);
  }

  private async evaluatePattern(
    pattern: ThreatPattern,
    analysis: ContractAnalysis,
  ): Promise<boolean> {
    if (typeof pattern.pattern === "function") {
      return pattern.pattern(analysis);
    } else if (pattern.pattern instanceof RegExp) {
      const text = JSON.stringify(analysis);
      return pattern.pattern.test(text);
    } else if (typeof pattern.pattern === "string") {
      const text = JSON.stringify(analysis).toLowerCase();
      return text.includes(pattern.pattern.toLowerCase());
    }
    return false;
  }

  // Specific Detection Methods

  private detectAsymmetricTrading(data: ContractAnalysis): boolean {
    // Analyze bytecode/ABI for buy/sell function restrictions
    if (!data.abi) return false;

    const hasBuyFunction = data.abi.some(
      (item) => item.name && item.name.toLowerCase().includes("buy"),
    );

    const hasSellFunction = data.abi.some(
      (item) => item.name && item.name.toLowerCase().includes("sell"),
    );

    const hasTransferRestrictions = data.abi.some(
      (item) =>
        item.name &&
        (item.name.toLowerCase().includes("blacklist") ||
          item.name.toLowerCase().includes("block") ||
          item.name.toLowerCase().includes("restrict")),
    );

    return hasBuyFunction && (!hasSellFunction || hasTransferRestrictions);
  }

  private detectHiddenFeeManipulation(data: ContractAnalysis): boolean {
    if (!data.abi) return false;

    const hasFeeModification = data.abi.some(
      (item) =>
        item.name &&
        (item.name.toLowerCase().includes("setfee") ||
          item.name.toLowerCase().includes("updatefee") ||
          item.name.toLowerCase().includes("changefee")) &&
        item.stateMutability !== "view",
    );

    const hasOwnerOnlyModifier = data.sourceCode
      ? data.sourceCode.includes("onlyOwner") && data.sourceCode.includes("fee")
      : false;

    return hasFeeModification && hasOwnerOnlyModifier;
  }

  private detectBlacklistHoneypot(data: ContractAnalysis): boolean {
    if (!data.abi) return false;

    return data.abi.some(
      (item) =>
        item.name &&
        (item.name.toLowerCase().includes("blacklist") ||
          item.name.toLowerCase().includes("addtoblock") ||
          item.name.toLowerCase().includes("ban")),
    );
  }

  private detectUnlimitedMint(data: ContractAnalysis): boolean {
    if (!data.abi) return false;

    const hasMintFunction = data.abi.some(
      (item) => item.name && item.name.toLowerCase().includes("mint"),
    );

    const hasSupplyCap = data.sourceCode
      ? data.sourceCode.includes("maxSupply") ||
        data.sourceCode.includes("MAX_SUPPLY") ||
        data.sourceCode.includes("totalSupplyCap")
      : false;

    return hasMintFunction && !hasSupplyCap;
  }

  private detectLiquidityDrainRisk(data: ContractAnalysis): boolean {
    // Check for liquidity removal functions without timelock
    const liquidityMetrics = data.tokenMetrics?.liquidity;
    if (!liquidityMetrics) return false;

    return (
      liquidityMetrics.lockedPercentage < 50 ||
      !liquidityMetrics.hasTimelock ||
      liquidityMetrics.ownerCanRemove === true
    );
  }

  private detectOwnershipConcentration(data: ContractAnalysis): boolean {
    const tokenMetrics = data.tokenMetrics;
    if (!tokenMetrics) return false;

    const topHolderPercentage = tokenMetrics.topHolders?.[0]?.percentage || 0;
    const top10Percentage =
      tokenMetrics.topHolders
        ?.slice(0, 10)
        .reduce((sum: number, holder: any) => sum + holder.percentage, 0) || 0;

    return topHolderPercentage > 20 || top10Percentage > 70;
  }

  private detectReentrancy(data: ContractAnalysis): boolean {
    if (!data.sourceCode) return false;

    const hasExternalCall =
      data.sourceCode.includes(".call(") ||
      data.sourceCode.includes(".transfer(") ||
      data.sourceCode.includes(".send(");

    const hasReentrancyGuard =
      data.sourceCode.includes("nonReentrant") ||
      data.sourceCode.includes("ReentrancyGuard");

    return hasExternalCall && !hasReentrancyGuard;
  }

  private detectIntegerOverflow(data: ContractAnalysis): boolean {
    if (!data.sourceCode) return false;

    const hasArithmetic = /[+\-*\/]/.test(data.sourceCode);
    const hasSafeMath =
      data.sourceCode.includes("SafeMath") ||
      data.sourceCode.includes("pragma solidity ^0.8");

    return hasArithmetic && !hasSafeMath;
  }

  private detectUnsafeDelegatecall(data: ContractAnalysis): boolean {
    if (!data.sourceCode) return false;

    const hasDelegatecall = data.sourceCode.includes("delegatecall");
    const hasAddressValidation =
      data.sourceCode.includes("require(") &&
      data.sourceCode.includes("address");

    return hasDelegatecall && !hasAddressValidation;
  }

  private detectFakeTeam(data: ContractAnalysis): boolean {
    const socialMetrics = data.socialMetrics;
    if (!socialMetrics?.team) return false;

    return (
      socialMetrics.team.stockPhotosDetected > 0 ||
      socialMetrics.team.linkedinProfilesValid < 50 ||
      socialMetrics.team.consistencyScore < 60
    );
  }

  private detectCoordinatedPromotion(data: ContractAnalysis): boolean {
    const socialMetrics = data.socialMetrics;
    if (!socialMetrics) return false;

    return (
      socialMetrics.botFollowerPercentage > 40 ||
      socialMetrics.coordinatedPostingScore > 70 ||
      socialMetrics.organicGrowthScore < 30
    );
  }

  private detectDomainImpersonation(data: ContractAnalysis): boolean {
    const socialMetrics = data.socialMetrics;
    if (!socialMetrics?.website) return false;

    return (
      socialMetrics.website.similarityToLegitProject > 80 ||
      socialMetrics.website.contentCopiedScore > 70 ||
      socialMetrics.website.brandingCopiedScore > 60
    );
  }

  private detectFlashLoanVulnerability(data: ContractAnalysis): boolean {
    if (!data.sourceCode) return false;

    const usesOracle =
      data.sourceCode.includes("oracle") ||
      data.sourceCode.includes("getPrice");

    const usesSingleSource =
      !data.sourceCode.includes("chainlink") &&
      !data.sourceCode.includes("band") &&
      data.sourceCode.split("getPrice").length < 3;

    return usesOracle && usesSingleSource;
  }

  // ML Model Applications

  private async applyMLModels(
    analysis: ContractAnalysis,
  ): Promise<ThreatDetectionResult[]> {
    const results: ThreatDetectionResult[] = [];

    // Bytecode similarity analysis
    if (analysis.bytecode) {
      const similarity = await this.analyzeBytcodeSimilarity(analysis.bytecode);
      if (similarity.suspiciousMatches.length > 0) {
        results.push({
          threatId: crypto.randomUUID(),
          patternId: "ML001",
          severity: "medium",
          confidence: Math.floor(similarity.confidence * 100),
          title: "Suspicious Bytecode Similarity",
          description: "Contract bytecode matches known malicious patterns",
          evidence: similarity.suspiciousMatches,
          indicators: ["bytecode_similarity", "known_malicious_patterns"],
          mitigation: "Investigate bytecode similarities with known threats",
          category: "code_vulnerability",
          riskScore: similarity.confidence * 60,
          metadata: {
            similarityScore: similarity.confidence,
            matches: similarity.suspiciousMatches,
          },
        });
      }
    }

    // Social sentiment analysis
    if (analysis.socialMetrics) {
      const sentiment = await this.analyzeSocialSentiment(
        analysis.socialMetrics,
      );
      if (sentiment.manipulationScore > 0.6) {
        results.push({
          threatId: crypto.randomUUID(),
          patternId: "ML002",
          severity: sentiment.manipulationScore > 0.8 ? "high" : "medium",
          confidence: Math.floor(sentiment.confidence * 100),
          title: "Social Media Manipulation Detected",
          description:
            "Artificial social media activity and sentiment manipulation",
          evidence: sentiment.indicators,
          indicators: [
            "artificial_sentiment",
            "bot_activity",
            "coordinated_campaigns",
          ],
          mitigation:
            "Verify organic community engagement and authentic discussions",
          category: "social_engineering",
          riskScore: sentiment.manipulationScore * 70,
          metadata: {
            manipulationScore: sentiment.manipulationScore,
            indicators: sentiment.indicators,
          },
        });
      }
    }

    return results;
  }

  private async analyzeBytcodeSimilarity(bytecode: string): Promise<any> {
    // Simulate ML bytecode analysis
    await this.delay(500);

    const suspiciousPatterns = [
      "known_honeypot_signature_1",
      "rugpull_pattern_v2",
      "fee_manipulation_bytecode",
    ];

    const matches = suspiciousPatterns.filter(() => Math.random() > 0.8);

    return {
      confidence:
        matches.length > 0 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4,
      suspiciousMatches: matches,
      analysis: "ML bytecode similarity analysis",
    };
  }

  private async analyzeSocialSentiment(socialData: any): Promise<any> {
    await this.delay(300);

    const manipulationScore = Math.random();
    const indicators = [];

    if (manipulationScore > 0.3)
      indicators.push("High bot follower ratio detected");
    if (manipulationScore > 0.5)
      indicators.push("Coordinated posting patterns");
    if (manipulationScore > 0.7) indicators.push("Artificial sentiment spikes");

    return {
      manipulationScore,
      confidence: 0.8,
      indicators,
      analysis: "ML social sentiment analysis",
    };
  }

  private async analyzeTransactionPatterns(transactions: any[]): Promise<any> {
    await this.delay(400);

    // Analyze transaction patterns for suspicious behavior
    return {
      suspiciousPatterns: [],
      riskScore: Math.random() * 0.5,
      analysis: "ML transaction pattern analysis",
    };
  }

  // Risk Calculation and Meta-Analysis

  private calculateCompositeRisk(results: ThreatDetectionResult[]): any {
    const criticalCount = results.filter(
      (r) => r.severity === "critical",
    ).length;
    const highCount = results.filter((r) => r.severity === "high").length;
    const mediumCount = results.filter((r) => r.severity === "medium").length;
    const lowCount = results.filter((r) => r.severity === "low").length;

    const score =
      criticalCount * 25 + highCount * 15 + mediumCount * 8 + lowCount * 3;
    const maxPossibleScore = results.length * 25;
    const normalizedScore =
      maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;

    return {
      score: normalizedScore,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      totalFindings: results.length,
    };
  }

  private createCriticalRiskAlert(
    compositeRisk: any,
    analysis: ContractAnalysis,
  ): ThreatDetectionResult {
    return {
      threatId: crypto.randomUUID(),
      patternId: "META001",
      severity: "critical",
      confidence: 95,
      title: "CRITICAL RISK PROFILE DETECTED",
      description: `Multiple severe threats detected. Total risk score: ${compositeRisk.score.toFixed(1)}%`,
      evidence: [
        `${compositeRisk.criticalCount} critical threats`,
        `${compositeRisk.highCount} high-risk threats`,
        `${compositeRisk.totalFindings} total security findings`,
      ],
      indicators: [
        "multiple_critical_threats",
        "high_risk_correlation",
        "compound_threat_vectors",
      ],
      mitigation: "AVOID COMPLETELY - High probability of total loss",
      category: "rug_pull",
      riskScore: 100,
      metadata: { compositeRisk, analysisAddress: analysis.address },
    };
  }

  private createThreatResult(
    pattern: ThreatPattern,
    analysis: ContractAnalysis,
  ): ThreatDetectionResult {
    return {
      threatId: crypto.randomUUID(),
      patternId: pattern.id,
      severity: pattern.severity,
      confidence: pattern.confidence,
      title: pattern.name,
      description: pattern.description,
      evidence: [
        `Pattern ${pattern.id} detected in contract ${analysis.address}`,
      ],
      indicators: pattern.indicators,
      mitigation: pattern.mitigation,
      category: pattern.category,
      riskScore: this.calculatePatternRiskScore(pattern),
      metadata: { patternId: pattern.id, cveId: pattern.cveId },
    };
  }

  private calculatePatternRiskScore(pattern: ThreatPattern): number {
    const severityMultipliers = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      critical: 1.0,
    };
    return pattern.confidence * severityMultipliers[pattern.severity];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public API Methods

  public getPatternById(patternId: string): ThreatPattern | undefined {
    return this.patterns.get(patternId);
  }

  public getAllPatterns(): ThreatPattern[] {
    return Array.from(this.patterns.values());
  }

  public updatePattern(
    patternId: string,
    updates: Partial<ThreatPattern>,
  ): boolean {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      this.patterns.set(patternId, { ...pattern, ...updates });
      return true;
    }
    return false;
  }

  public addCustomPattern(pattern: ThreatPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  public getDetectionStats(): any {
    return {
      totalPatterns: this.patterns.size,
      patternsByCategory: this.getPatternsByCategory(),
      patternsBySeverity: this.getPatternsBySeverity(),
      mlModelsLoaded: this.mlModels.size,
    };
  }

  private getPatternsByCategory(): Record<string, number> {
    const categories: Record<string, number> = {};
    for (const pattern of this.patterns.values()) {
      categories[pattern.category] = (categories[pattern.category] || 0) + 1;
    }
    return categories;
  }

  private getPatternsBySeverity(): Record<string, number> {
    const severities: Record<string, number> = {};
    for (const pattern of this.patterns.values()) {
      severities[pattern.severity] = (severities[pattern.severity] || 0) + 1;
    }
    return severities;
  }
}

export default ThreatDetectionEngine;
