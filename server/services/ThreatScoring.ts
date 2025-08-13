import {
  BytecodeAnalysis,
  SocialAnalysis,
  LiquidityAnalysis,
  FeeAnalysis,
} from "../../shared/nimrev-types";

interface ThreatScoringInput {
  bytecode_analysis?: BytecodeAnalysis;
  social_analysis?: SocialAnalysis;
  liquidity_analysis?: LiquidityAnalysis;
  fee_analysis?: FeeAnalysis;
  cross_chain_threats?: any[];
}

interface ScoringWeights {
  bytecode: number;
  social: number;
  liquidity: number;
  fees: number;
  crossChain: number;
}

export class ThreatScoring {
  private weights: ScoringWeights = {
    bytecode: 0.25,
    social: 0.2,
    liquidity: 0.3,
    fees: 0.2,
    crossChain: 0.05,
  };

  public calculateRiskScore(input: ThreatScoringInput): number {
    let totalScore = 100; // Start with maximum safety score (100 = safest)
    let totalWeight = 0;

    // 1. Bytecode Analysis Score (0-100, lower = more risky)
    if (input.bytecode_analysis) {
      const bytecodeScore = this.scoreBytecodeAnalysis(input.bytecode_analysis);
      totalScore -= (100 - bytecodeScore) * this.weights.bytecode;
      totalWeight += this.weights.bytecode;
    }

    // 2. Social Analysis Score (0-100, lower = more risky)
    if (input.social_analysis) {
      const socialScore = this.scoreSocialAnalysis(input.social_analysis);
      totalScore -= (100 - socialScore) * this.weights.social;
      totalWeight += this.weights.social;
    }

    // 3. Liquidity Analysis Score (0-100, lower = more risky)
    if (input.liquidity_analysis) {
      const liquidityScore = this.scoreLiquidityAnalysis(
        input.liquidity_analysis,
      );
      totalScore -= (100 - liquidityScore) * this.weights.liquidity;
      totalWeight += this.weights.liquidity;
    }

    // 4. Fee Analysis Score (0-100, lower = more risky)
    if (input.fee_analysis) {
      const feeScore = this.scoreFeeAnalysis(input.fee_analysis);
      totalScore -= (100 - feeScore) * this.weights.fees;
      totalWeight += this.weights.fees;
    }

    // 5. Cross-Chain Threat Score
    if (input.cross_chain_threats) {
      const crossChainScore = this.scoreCrossChainThreats(
        input.cross_chain_threats,
      );
      totalScore -= (100 - crossChainScore) * this.weights.crossChain;
      totalWeight += this.weights.crossChain;
    }

    // Normalize score if not all components are available
    if (totalWeight > 0 && totalWeight < 1) {
      totalScore = totalScore / totalWeight;
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(totalScore)));
  }

  private scoreBytecodeAnalysis(analysis: BytecodeAnalysis): number {
    let score = 100; // Start with perfect score

    // High-risk patterns
    if (analysis.has_mint_function) {
      if (analysis.access_controls.length === 0) {
        score -= 40; // Unrestricted minting is very dangerous
      } else {
        score -= 10; // Controlled minting is still risky
      }
    }

    if (analysis.proxy_pattern) {
      score -= 15; // Proxy contracts can be upgraded maliciously
    }

    if (analysis.upgrade_pattern) {
      score -= 20; // Upgradeable contracts pose risks
    }

    if (analysis.hidden_functions.length > 0) {
      score -= 25; // Hidden functions are suspicious
    }

    if (analysis.external_calls.length > 5) {
      score -= 10; // Many external calls increase attack surface
    }

    // Time locks provide security (positive scoring)
    if (analysis.time_locks.length > 0) {
      score += 5; // Time locks add security
    }

    // Access controls add security
    if (analysis.access_controls.length > 0) {
      score += 5;
    }

    // Contract size analysis
    if (analysis.contract_size > 50000) {
      score -= 5; // Very large contracts might hide malicious code
    }

    // Function count analysis
    if (analysis.function_count > 100) {
      score -= 5; // Too many functions might indicate complexity/obfuscation
    }

    // Similarity to known exploits
    if (analysis.similarity_matches.length > 0) {
      const maxSimilarity = Math.max(
        ...analysis.similarity_matches.map((m) => m.similarity_score),
      );
      if (maxSimilarity > 0.8) {
        score -= 50; // Very similar to known exploit
      } else if (maxSimilarity > 0.5) {
        score -= 25; // Moderately similar to known exploit
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreSocialAnalysis(analysis: SocialAnalysis): number {
    let score = 50; // Start with neutral score

    // Twitter analysis
    if (analysis.twitter_handle) {
      if (analysis.twitter_verified) {
        score += 15;
      }

      if (analysis.twitter_followers > 10000) {
        score += 10;
      } else if (analysis.twitter_followers > 1000) {
        score += 5;
      }

      const accountAgeMonths =
        (Date.now() - new Date(analysis.twitter_created).getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      if (accountAgeMonths > 12) {
        score += 10;
      } else if (accountAgeMonths < 1) {
        score -= 15; // Very new account is suspicious
      }
    } else {
      score -= 10; // No social presence is suspicious
    }

    // GitHub analysis
    if (analysis.github_repo) {
      if (analysis.github_commits > 50) {
        score += 15;
      } else if (analysis.github_commits > 10) {
        score += 5;
      }

      if (analysis.github_contributors > 5) {
        score += 10;
      }
    } else {
      score -= 5; // No code repository
    }

    // Website analysis
    if (analysis.website_domain) {
      if (analysis.domain_age_days > 365) {
        score += 10;
      } else if (analysis.domain_age_days < 30) {
        score -= 10; // Very new domain
      }
    }

    // Telegram community
    if (analysis.telegram_group) {
      if (analysis.telegram_members > 5000) {
        score += 10;
      } else if (analysis.telegram_members > 1000) {
        score += 5;
      } else if (analysis.telegram_members < 100) {
        score -= 5;
      }
    }

    // Red flags analysis
    score -= analysis.social_red_flags.length * 10;

    // Community sentiment
    if (analysis.community_sentiment === "positive") {
      score += 10;
    } else if (analysis.community_sentiment === "negative") {
      score -= 15;
    }

    // Influencer mentions
    if (analysis.influencer_mentions > 5) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreLiquidityAnalysis(analysis: LiquidityAnalysis): number {
    let score = 50; // Start with neutral score

    // Liquidity amount
    if (analysis.total_liquidity_usd > 1000000) {
      score += 25;
    } else if (analysis.total_liquidity_usd > 100000) {
      score += 15;
    } else if (analysis.total_liquidity_usd > 10000) {
      score += 5;
    } else if (analysis.total_liquidity_usd < 1000) {
      score -= 20; // Very low liquidity
    }

    // Liquidity lock status
    if (analysis.liquidity_locked) {
      score += 20;

      if (analysis.lock_duration_days && analysis.lock_duration_days > 365) {
        score += 10; // Long lock period
      } else if (
        analysis.lock_duration_days &&
        analysis.lock_duration_days < 30
      ) {
        score -= 5; // Short lock period
      }

      if (analysis.lock_percentage > 80) {
        score += 10; // High percentage locked
      } else if (analysis.lock_percentage < 50) {
        score -= 10; // Low percentage locked
      }
    } else {
      score -= 25; // Unlocked liquidity is risky
    }

    // Holder concentration
    const topHolderPercentage = analysis.major_holders.reduce(
      (max, holder) => Math.max(max, holder.percentage),
      0,
    );

    if (topHolderPercentage > 50) {
      score -= 20; // Very concentrated
    } else if (topHolderPercentage > 20) {
      score -= 10; // Moderately concentrated
    }

    // Known exchanges holding tokens is positive
    const exchangeHolders = analysis.major_holders.filter(
      (h) => h.is_known_exchange,
    );
    if (exchangeHolders.length > 0) {
      score += 10;
    }

    // Recent large transactions analysis
    const recentSells = analysis.recent_large_transactions.filter(
      (tx) => tx.type === "sell" && tx.amount_usd > 10000,
    );

    if (recentSells.length > 3) {
      score -= 15; // Many large sells recently
    }

    // Liquidity stability
    score += (analysis.liquidity_stability_score - 50) * 0.5;

    // Rug pull indicators
    score -= analysis.rug_pull_indicators.length * 10;

    return Math.max(0, Math.min(100, score));
  }

  private scoreFeeAnalysis(analysis: FeeAnalysis): number {
    let score = 100; // Start with perfect score

    // Honeypot detection
    if (analysis.honeypot_detected) {
      return 0; // Immediate fail for honeypots
    }

    // Fee analysis
    const maxFee = Math.max(
      analysis.buy_fee_percentage,
      analysis.sell_fee_percentage,
      analysis.transfer_fee_percentage,
    );

    if (maxFee > 20) {
      score -= 40; // Very high fees
    } else if (maxFee > 10) {
      score -= 25; // High fees
    } else if (maxFee > 5) {
      score -= 10; // Moderate fees
    }

    // Hidden fees are suspicious
    if (analysis.hidden_fees) {
      score -= 20;
    }

    // Asymmetric fees (different buy/sell) are suspicious
    const feeAsymmetry = Math.abs(
      analysis.buy_fee_percentage - analysis.sell_fee_percentage,
    );
    if (feeAsymmetry > 5) {
      score -= 15;
    }

    // Anti-bot mechanisms can be positive if reasonable
    if (analysis.anti_bot_mechanisms.length > 0) {
      if (analysis.anti_bot_mechanisms.includes("blacklist")) {
        score -= 10; // Blacklists can be misused
      }

      if (analysis.cooldown_periods.some((period) => period > 300)) {
        score -= 15; // Very long cooldowns are suspicious
      }
    }

    // Sandwich protection is positive
    if (analysis.sandwich_protection) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreCrossChainThreats(threats: any[]): number {
    let score = 100; // Start with perfect score

    // Penalize based on number and severity of cross-chain threats
    for (const threat of threats) {
      if (threat.confidence_score > 0.8) {
        score -= 30; // High confidence threat
      } else if (threat.confidence_score > 0.5) {
        score -= 15; // Medium confidence threat
      } else {
        score -= 5; // Low confidence threat
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  public getRiskCategory(
    score: number,
  ): "HIGH_RISK" | "MEDIUM_RISK" | "LOW_RISK" | "ALPHA" {
    if (score <= 30) return "HIGH_RISK";
    if (score <= 60) return "MEDIUM_RISK";
    if (score <= 70) return "LOW_RISK";
    return "ALPHA";
  }

  public shouldAlert(score: number, alertThreshold: number = 30): boolean {
    return score <= alertThreshold;
  }

  public getScoreExplanation(
    score: number,
    input: ThreatScoringInput,
  ): string[] {
    const explanations: string[] = [];

    if (score <= 30) {
      explanations.push("🚨 HIGH RISK - Avoid this token");
    } else if (score <= 60) {
      explanations.push("⚠️ MEDIUM RISK - Exercise caution");
    } else if (score <= 70) {
      explanations.push("📊 LOW RISK - Generally safe but monitor");
    } else {
      explanations.push("✅ POTENTIAL ALPHA - Good opportunity");
    }

    // Add specific explanations based on analysis
    if (input.fee_analysis?.honeypot_detected) {
      explanations.push("🍯 Honeypot detected - cannot sell tokens");
    }

    if (
      input.liquidity_analysis &&
      !input.liquidity_analysis.liquidity_locked
    ) {
      explanations.push("🔓 Liquidity not locked - rug pull risk");
    }

    if (
      input.bytecode_analysis?.has_mint_function &&
      !input.bytecode_analysis.access_controls.length
    ) {
      explanations.push("🪙 Unlimited minting capability");
    }

    if (input.social_analysis?.social_red_flags.length) {
      explanations.push(
        `📱 ${input.social_analysis.social_red_flags.length} social red flags detected`,
      );
    }

    return explanations;
  }
}
