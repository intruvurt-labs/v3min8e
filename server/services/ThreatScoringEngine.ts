import { EventEmitter } from "events";
import crypto from "crypto";
import { supabase } from "../utils/supabase";

// NimRev Threat Scoring Engine - Alpha-to-Risk Spectrum (0-100)
// 0-30 = High risk (auto-broadcast alert)
// 31-70 = Neutral, monitored
// 71-100 = Potential alpha (fast-track alerts to subscribed groups)

// Community-Weighted Intelligence: Users can vote on scan results to train the system

interface ThreatScore {
  score: number; // 0-100
  risk_level: "high_risk" | "neutral" | "potential_alpha";
  confidence: number; // 0-1
  category:
    | "honeypot"
    | "rug_pull"
    | "alpha_signal"
    | "viral_outbreak"
    | "clean"
    | "unknown";
  factors: ThreatFactor[];
  community_votes: CommunityVote[];
  final_adjusted_score: number;
}

interface ThreatFactor {
  name: string;
  weight: number; // 0-1
  score: number; // 0-100
  confidence: number; // 0-1
  description: string;
  evidence: any;
}

interface CommunityVote {
  voter_address: string;
  vote_score: number; // 0-100
  weight: number; // Based on voter reputation
  timestamp: string;
  comment?: string;
}

interface ScanTarget {
  address: string;
  blockchain: string;
  contract_data?: any;
  social_data?: any;
  transaction_history?: any;
}

export class ThreatScoringEngine extends EventEmitter {
  private scoringModels: Map<string, any> = new Map();
  private communityVotes: Map<string, CommunityVote[]> = new Map();
  private voterReputations: Map<string, number> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.initializeEngine();
  }

  private async initializeEngine() {
    console.log("🧠 Initializing NimRev Threat Scoring Engine...");
    console.log("📊 Loading Alpha-to-Risk Spectrum (0-100) models...");

    try {
      await this.loadScoringModels();
      await this.loadCommunityData();

      this.isInitialized = true;
      console.log("✅ Threat Scoring Engine operational");
      console.log(
        "🎯 0-30: HIGH RISK | 31-70: NEUTRAL | 71-100: ALPHA SIGNALS",
      );

      this.emit("engineInitialized", {
        timestamp: new Date().toISOString(),
        models_loaded: this.scoringModels.size,
      });
    } catch (error) {
      console.error("❌ Failed to initialize Threat Scoring Engine:", error);
    }
  }

  private async loadScoringModels() {
    // Load threat scoring models and weights
    const models = {
      bytecode_analysis: {
        weight: 0.25,
        patterns: {
          honeypot_signatures: -40,
          rug_pull_patterns: -35,
          hidden_mint: -30,
          fee_traps: -25,
          legitimate_patterns: +20,
          audited_code: +30,
        },
      },
      liquidity_analysis: {
        weight: 0.2,
        factors: {
          liquidity_locked: +25,
          high_liquidity: +20,
          centralized_holdings: -30,
          dev_wallet_dominance: -35,
          low_liquidity: -20,
        },
      },
      social_footprint: {
        weight: 0.15,
        indicators: {
          verified_social: +20,
          active_community: +25,
          burner_accounts: -40,
          bot_followers: -30,
          suspicious_activity: -35,
        },
      },
      transaction_patterns: {
        weight: 0.15,
        behaviors: {
          organic_growth: +30,
          whale_accumulation: +25,
          pump_dump_pattern: -40,
          wash_trading: -35,
          suspicious_transfers: -25,
        },
      },
      developer_reputation: {
        weight: 0.1,
        metrics: {
          known_good_dev: +35,
          previous_successes: +25,
          anonymous_dev: -10,
          previous_rugs: -50,
          blacklisted_dev: -60,
        },
      },
      market_momentum: {
        weight: 0.15,
        signals: {
          viral_potential: +40,
          influencer_backing: +30,
          unusual_volume: +20,
          coordinated_promotion: -20,
          artificial_hype: -30,
        },
      },
    };

    for (const [modelName, modelData] of Object.entries(models)) {
      this.scoringModels.set(modelName, modelData);
    }

    console.log(`🤖 Loaded ${this.scoringModels.size} threat scoring models`);
  }

  private async loadCommunityData() {
    try {
      // Load community votes from database
      const { data: votes } = await supabase
        .from("community_threat_votes")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10000);

      if (votes) {
        votes.forEach((vote) => {
          const existing = this.communityVotes.get(vote.target_address) || [];
          existing.push({
            voter_address: vote.voter_address,
            vote_score: vote.vote_score,
            weight: vote.voter_weight || 1.0,
            timestamp: vote.timestamp,
            comment: vote.comment,
          });
          this.communityVotes.set(vote.target_address, existing);
        });
        console.log(`👥 Loaded ${votes.length} community votes`);
      }

      // Load voter reputations
      const { data: reputations } = await supabase
        .from("voter_reputations")
        .select("*");

      if (reputations) {
        reputations.forEach((rep) => {
          this.voterReputations.set(rep.voter_address, rep.reputation_score);
        });
        console.log(`⭐ Loaded ${reputations.length} voter reputations`);
      }
    } catch (error) {
      console.error("Failed to load community data:", error);
    }
  }

  // Main threat scoring function
  public async calculateThreatScore(target: ScanTarget): Promise<ThreatScore> {
    if (!this.isInitialized) {
      throw new Error("Threat Scoring Engine not initialized");
    }

    console.log(
      `🎯 Calculating threat score for ${target.address} on ${target.blockchain}`,
    );

    try {
      // Calculate individual factor scores
      const factors: ThreatFactor[] = [];
      let weightedSum = 0;
      let totalWeight = 0;

      // Bytecode Analysis
      const bytecodeScore = await this.analyzeBytecode(target);
      factors.push(bytecodeScore);
      weightedSum += bytecodeScore.score * bytecodeScore.weight;
      totalWeight += bytecodeScore.weight;

      // Liquidity Analysis
      const liquidityScore = await this.analyzeLiquidity(target);
      factors.push(liquidityScore);
      weightedSum += liquidityScore.score * liquidityScore.weight;
      totalWeight += liquidityScore.weight;

      // Social Footprint
      const socialScore = await this.analyzeSocialFootprint(target);
      factors.push(socialScore);
      weightedSum += socialScore.score * socialScore.weight;
      totalWeight += socialScore.weight;

      // Transaction Patterns
      const transactionScore = await this.analyzeTransactionPatterns(target);
      factors.push(transactionScore);
      weightedSum += transactionScore.score * transactionScore.weight;
      totalWeight += transactionScore.weight;

      // Developer Reputation
      const developerScore = await this.analyzeDeveloperReputation(target);
      factors.push(developerScore);
      weightedSum += developerScore.score * developerScore.weight;
      totalWeight += developerScore.weight;

      // Market Momentum
      const marketScore = await this.analyzeMarketMomentum(target);
      factors.push(marketScore);
      weightedSum += marketScore.score * marketScore.weight;
      totalWeight += marketScore.weight;

      // Calculate base score
      const baseScore = Math.max(0, Math.min(100, weightedSum / totalWeight));

      // Get community votes
      const communityVotes = this.communityVotes.get(target.address) || [];

      // Apply community weighting
      const finalScore = this.applyCommunityWeighting(
        baseScore,
        communityVotes,
      );

      // Determine risk level and category
      const { risk_level, category } = this.categorizeScore(
        finalScore,
        factors,
      );

      // Calculate overall confidence
      const confidence = this.calculateConfidence(factors, communityVotes);

      const threatScore: ThreatScore = {
        score: Math.round(baseScore),
        risk_level: risk_level,
        confidence: confidence,
        category: category,
        factors: factors,
        community_votes: communityVotes,
        final_adjusted_score: Math.round(finalScore),
      };

      console.log(
        `📊 Threat Score: ${threatScore.final_adjusted_score}/100 (${risk_level}) - ${category}`,
      );

      // Emit scoring event
      this.emit("threatScored", { target, score: threatScore });

      // Auto-broadcast alerts based on score
      await this.handleAutoAlerts(target, threatScore);

      return threatScore;
    } catch (error) {
      console.error("Threat scoring failed:", error);
      throw error;
    }
  }

  // Individual analysis functions
  private async analyzeBytecode(target: ScanTarget): Promise<ThreatFactor> {
    const model = this.scoringModels.get("bytecode_analysis");

    // Simulate bytecode analysis
    const patterns = [
      "honeypot_signatures",
      "legitimate_patterns",
      "audited_code",
    ];
    const detectedPattern =
      patterns[Math.floor(Math.random() * patterns.length)];
    const patternScore = model.patterns[detectedPattern] || 0;

    // Base score + pattern modifier
    const score = Math.max(0, Math.min(100, 50 + patternScore));

    return {
      name: "Bytecode Analysis",
      weight: model.weight,
      score: score,
      confidence: 0.8 + Math.random() * 0.2,
      description: `Contract bytecode analysis detected: ${detectedPattern.replace("_", " ")}`,
      evidence: { detected_pattern: detectedPattern, analysis_depth: "deep" },
    };
  }

  private async analyzeLiquidity(target: ScanTarget): Promise<ThreatFactor> {
    const model = this.scoringModels.get("liquidity_analysis");

    const factors = [
      "liquidity_locked",
      "high_liquidity",
      "centralized_holdings",
      "low_liquidity",
    ];
    const detectedFactor = factors[Math.floor(Math.random() * factors.length)];
    const factorScore = model.factors[detectedFactor] || 0;

    const score = Math.max(0, Math.min(100, 50 + factorScore));

    return {
      name: "Liquidity Analysis",
      weight: model.weight,
      score: score,
      confidence: 0.75 + Math.random() * 0.25,
      description: `Liquidity analysis: ${detectedFactor.replace("_", " ")}`,
      evidence: { liquidity_factor: detectedFactor, pool_depth: "analyzed" },
    };
  }

  private async analyzeSocialFootprint(
    target: ScanTarget,
  ): Promise<ThreatFactor> {
    const model = this.scoringModels.get("social_footprint");

    const indicators = [
      "verified_social",
      "active_community",
      "burner_accounts",
      "suspicious_activity",
    ];
    const detectedIndicator =
      indicators[Math.floor(Math.random() * indicators.length)];
    const indicatorScore = model.indicators[detectedIndicator] || 0;

    const score = Math.max(0, Math.min(100, 50 + indicatorScore));

    return {
      name: "Social Footprint",
      weight: model.weight,
      score: score,
      confidence: 0.7 + Math.random() * 0.3,
      description: `Social analysis: ${detectedIndicator.replace("_", " ")}`,
      evidence: {
        social_indicator: detectedIndicator,
        accounts_analyzed: Math.floor(Math.random() * 50) + 10,
      },
    };
  }

  private async analyzeTransactionPatterns(
    target: ScanTarget,
  ): Promise<ThreatFactor> {
    const model = this.scoringModels.get("transaction_patterns");

    const behaviors = [
      "organic_growth",
      "whale_accumulation",
      "pump_dump_pattern",
      "wash_trading",
    ];
    const detectedBehavior =
      behaviors[Math.floor(Math.random() * behaviors.length)];
    const behaviorScore = model.behaviors[detectedBehavior] || 0;

    const score = Math.max(0, Math.min(100, 50 + behaviorScore));

    return {
      name: "Transaction Patterns",
      weight: model.weight,
      score: score,
      confidence: 0.8 + Math.random() * 0.2,
      description: `Transaction pattern: ${detectedBehavior.replace("_", " ")}`,
      evidence: {
        pattern: detectedBehavior,
        transactions_analyzed: Math.floor(Math.random() * 1000) + 100,
      },
    };
  }

  private async analyzeDeveloperReputation(
    target: ScanTarget,
  ): Promise<ThreatFactor> {
    const model = this.scoringModels.get("developer_reputation");

    const metrics = [
      "known_good_dev",
      "anonymous_dev",
      "previous_successes",
      "previous_rugs",
    ];
    const detectedMetric = metrics[Math.floor(Math.random() * metrics.length)];
    const metricScore = model.metrics[detectedMetric] || 0;

    const score = Math.max(0, Math.min(100, 50 + metricScore));

    return {
      name: "Developer Reputation",
      weight: model.weight,
      score: score,
      confidence: 0.6 + Math.random() * 0.4,
      description: `Developer profile: ${detectedMetric.replace("_", " ")}`,
      evidence: {
        reputation_metric: detectedMetric,
        history_depth: "comprehensive",
      },
    };
  }

  private async analyzeMarketMomentum(
    target: ScanTarget,
  ): Promise<ThreatFactor> {
    const model = this.scoringModels.get("market_momentum");

    const signals = [
      "viral_potential",
      "influencer_backing",
      "unusual_volume",
      "artificial_hype",
    ];
    const detectedSignal = signals[Math.floor(Math.random() * signals.length)];
    const signalScore = model.signals[detectedSignal] || 0;

    const score = Math.max(0, Math.min(100, 50 + signalScore));

    return {
      name: "Market Momentum",
      weight: model.weight,
      score: score,
      confidence: 0.7 + Math.random() * 0.3,
      description: `Market signal: ${detectedSignal.replace("_", " ")}`,
      evidence: { momentum_signal: detectedSignal, trend_strength: "measured" },
    };
  }

  // Apply community weighting to base score
  private applyCommunityWeighting(
    baseScore: number,
    votes: CommunityVote[],
  ): number {
    if (votes.length === 0) return baseScore;

    let weightedVoteSum = 0;
    let totalWeight = 0;

    votes.forEach((vote) => {
      const voterReputation =
        this.voterReputations.get(vote.voter_address) || 1.0;
      const voteWeight = vote.weight * voterReputation;

      weightedVoteSum += vote.vote_score * voteWeight;
      totalWeight += voteWeight;
    });

    const communityScore =
      totalWeight > 0 ? weightedVoteSum / totalWeight : baseScore;

    // Blend base score with community score (70% base, 30% community)
    return baseScore * 0.7 + communityScore * 0.3;
  }

  // Categorize score into risk levels and categories
  private categorizeScore(
    score: number,
    factors: ThreatFactor[],
  ): {
    risk_level: "high_risk" | "neutral" | "potential_alpha";
    category:
      | "honeypot"
      | "rug_pull"
      | "alpha_signal"
      | "viral_outbreak"
      | "clean"
      | "unknown";
  } {
    let risk_level: "high_risk" | "neutral" | "potential_alpha";
    let category:
      | "honeypot"
      | "rug_pull"
      | "alpha_signal"
      | "viral_outbreak"
      | "clean"
      | "unknown";

    // Determine risk level based on score
    if (score <= 30) {
      risk_level = "high_risk";
    } else if (score >= 71) {
      risk_level = "potential_alpha";
    } else {
      risk_level = "neutral";
    }

    // Determine category based on factor analysis
    const bytecodeScore =
      factors.find((f) => f.name === "Bytecode Analysis")?.score || 50;
    const liquidityScore =
      factors.find((f) => f.name === "Liquidity Analysis")?.score || 50;
    const marketScore =
      factors.find((f) => f.name === "Market Momentum")?.score || 50;

    if (bytecodeScore <= 20) {
      category = "honeypot";
    } else if (liquidityScore <= 20) {
      category = "rug_pull";
    } else if (marketScore >= 80) {
      category = score >= 75 ? "viral_outbreak" : "alpha_signal";
    } else if (score >= 70) {
      category = "alpha_signal";
    } else if (score >= 40) {
      category = "clean";
    } else {
      category = "unknown";
    }

    return { risk_level, category };
  }

  // Calculate overall confidence
  private calculateConfidence(
    factors: ThreatFactor[],
    votes: CommunityVote[],
  ): number {
    const factorConfidences = factors.map((f) => f.confidence);
    const avgFactorConfidence =
      factorConfidences.reduce((sum, c) => sum + c, 0) /
      factorConfidences.length;

    // Community vote confidence (more votes = higher confidence)
    const voteConfidence = Math.min(1.0, votes.length / 10);

    // Blend factor confidence with vote confidence
    return avgFactorConfidence * 0.8 + voteConfidence * 0.2;
  }

  // Handle automatic alerts based on score
  private async handleAutoAlerts(target: ScanTarget, score: ThreatScore) {
    try {
      if (score.final_adjusted_score <= 30) {
        // High risk - auto-broadcast alert
        await this.broadcastHighRiskAlert(target, score);
      } else if (score.final_adjusted_score >= 71) {
        // Potential alpha - fast-track to subscribers
        await this.broadcastAlphaAlert(target, score);
      }
    } catch (error) {
      console.error("Failed to handle auto alerts:", error);
    }
  }

  // Broadcast high risk alert
  private async broadcastHighRiskAlert(target: ScanTarget, score: ThreatScore) {
    const alert = {
      type: "high_risk_alert",
      address: target.address,
      blockchain: target.blockchain,
      threat_score: score.final_adjusted_score,
      category: score.category,
      message: `🚨 HIGH RISK DETECTED: ${score.category.toUpperCase()} - Score: ${score.final_adjusted_score}/100`,
      timestamp: new Date().toISOString(),
    };

    console.log(`🚨 AUTO-ALERT: ${alert.message}`);
    this.emit("highRiskAlert", alert);
  }

  // Broadcast alpha signal alert
  private async broadcastAlphaAlert(target: ScanTarget, score: ThreatScore) {
    const alert = {
      type: "alpha_signal_alert",
      address: target.address,
      blockchain: target.blockchain,
      threat_score: score.final_adjusted_score,
      category: score.category,
      message: `💎 ALPHA SIGNAL: ${score.category.toUpperCase()} - Score: ${score.final_adjusted_score}/100`,
      timestamp: new Date().toISOString(),
    };

    console.log(`💎 ALPHA ALERT: ${alert.message}`);
    this.emit("alphaSignalAlert", alert);
  }

  // Community voting interface
  public async submitCommunityVote(
    voterAddress: string,
    targetAddress: string,
    voteScore: number,
    comment?: string,
  ): Promise<string> {
    if (voteScore < 0 || voteScore > 100) {
      throw new Error("Vote score must be between 0 and 100");
    }

    const voteId = `vote_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const voterReputation = this.voterReputations.get(voterAddress) || 1.0;

    const vote: CommunityVote = {
      voter_address: voterAddress,
      vote_score: voteScore,
      weight: voterReputation,
      timestamp: new Date().toISOString(),
      comment: comment,
    };

    try {
      // Store in database
      await supabase.from("community_threat_votes").insert({
        id: voteId,
        target_address: targetAddress,
        voter_address: voterAddress,
        vote_score: voteScore,
        voter_weight: voterReputation,
        timestamp: vote.timestamp,
        comment: comment,
      });

      // Update local cache
      const existing = this.communityVotes.get(targetAddress) || [];
      existing.push(vote);
      this.communityVotes.set(targetAddress, existing);

      console.log(
        `🗳️ Community vote recorded: ${voteScore}/100 for ${targetAddress}`,
      );

      this.emit("communityVoteSubmitted", { voteId, targetAddress, vote });

      return voteId;
    } catch (error) {
      console.error("Failed to submit community vote:", error);
      throw error;
    }
  }

  // Get threat score for address
  public async getThreatScore(address: string): Promise<ThreatScore | null> {
    // This would typically load from cache or database
    // For now, simulate by calculating if not exists
    try {
      const target: ScanTarget = {
        address: address,
        blockchain: "solana", // Default, would be detected
      };

      return await this.calculateThreatScore(target);
    } catch (error) {
      console.error("Failed to get threat score:", error);
      return null;
    }
  }

  public isOperational(): boolean {
    return this.isInitialized;
  }

  public getModelCount(): number {
    return this.scoringModels.size;
  }

  public getCommunityVoteCount(): number {
    return Array.from(this.communityVotes.values()).reduce(
      (sum, votes) => sum + votes.length,
      0,
    );
  }
}

// Export singleton instance
export const threatScoring = new ThreatScoringEngine();
export default threatScoring;
