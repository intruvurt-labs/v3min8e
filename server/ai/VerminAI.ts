import { z } from "zod";

/* ================================
   1) Types & Schemas (strict)
================================== */

export const Network = z.enum([
  "solana",
  "ethereum",
  "base",
  "blast",
  "polygon",
  "avalanche",
  "arbitrum",
  "optimism",
]);
export type Network = z.infer<typeof Network>;

export const Address = z.string().min(3); // refine with per-chain validation if needed

// Low-level measurements we extract from chain+offchain
export const FeaturesSchema = z.object({
  liquidityRatio: z.number().min(0).nullable(), // 0..1 or null if unknown
  holderDistribution: z.object({
    top1Percent: z.number().min(0).max(100).nullable(),
    top10Percent: z.number().min(0).max(100).nullable(),
    uniqueHolders: z.number().int().min(0).nullable(),
  }),
  contractAgeSec: z.number().int().min(0).nullable(),
  transactionPatterns: z.object({
    botLikeActivity: z.number().min(0).max(1).nullable(),
    humanLikeActivity: z.number().min(0).max(1).nullable(),
    suspiciousTransfers: z.number().int().min(0).nullable(),
  }),
  crossChainActivity: z.object({
    bridgeTxCount: z.number().int().min(0).nullable(),
    multiChainPresence: z.boolean().nullable(),
  }),

  volumeSpikes: z.object({
    last24h: z.number().min(0).nullable(), // X over baseline
    last7d: z.number().min(0).nullable(),
  }),
  socialSentiment: z.object({
    score: z.number().min(-1).max(1).nullable(), // -1..1
    mentions24h: z.number().int().min(0).nullable(),
  }),
  socialMentions: z.object({
    growth24h: z.number().min(-1000).nullable(), // %
  }),
  whaleActivity: z.object({
    accumulating: z.number().min(0).max(1).nullable(),
    selling: z.number().min(0).max(1).nullable(),
    newWhales: z.number().int().min(0).nullable(),
  }),
  developmentActivity: z.object({
    commits: z.number().int().min(0).nullable(),
    activeDevs: z.number().int().min(0).nullable(),
  }),
  marketCapGrowth: z.object({
    last7d: z.number().min(-1e6).nullable(), // X
  }),

  influencerActivity: z.object({
    bigFollowers: z.number().int().min(0).nullable(),
  }),
  searchTrends: z.object({
    spike: z.number().min(0).nullable(),
  }),
  networkEffect: z.object({
    velocity: z.number().min(0).max(1).nullable(),
  }),
  memePotential: z.number().min(0).max(1).nullable(),

  // Raw tx data (optional for pattern model)
  transactionData: z
    .array(
      z.object({
        hash: z.string(),
        from: z.string(),
        to: z.string(),
        value: z.number(), // native minor units okay; just be consistent
        timestamp: z.number().int(),
        gasUsed: z.number().int(),
      }),
    )
    .default([]),
});
export type Features = z.infer<typeof FeaturesSchema>;

export type ThreatResult = {
  threatScore: number; // 0..1
  confidence: number;  // 0..1
  indicators: string[];
};

export type AlphaResult = {
  alphaScore: number;          // 0..1
  potentialMultiplier: number; // capped
  confidence: number;          // 0..1
  signals: string[];
};

export type ViralResult = {
  viralScore: number;  // 0..1
  timeToViralHrs: number; // >=1
  confidence: number;  // 0..1
  catalysts: string[];
};

export type PatternResult = {
  knownPatterns: { type: string; similarity: number; description: string }[];
  novelPatterns: { type: string; confidence: number; description: string }[];
  riskLevel: number; // 0..1
};

export type Analysis = {
  threat: ThreatResult;
  alpha: AlphaResult;
  viral: ViralResult;
  patterns: PatternResult;
  summary: string;
  metadata: {
    processingMs: number;
    overallConfidence: number;
    featureKeys: number;
    aiModelsUsed: number;
  };
};

/* ================================
   2) Ports (interfaces)
================================== */

export interface FeatureProvider {
  extract(address: string, network: Network, options?: Record<string, unknown>): Promise<Features>;
}

export interface ThreatModel {
  predict(features: Features): Promise<ThreatResult>;
}
export interface AlphaModel {
  predict(features: Features): Promise<AlphaResult>;
}
export interface ViralModel {
  predict(features: Features): Promise<ViralResult>;
}
export interface PatternModel {
  analyze(transactions: Features["transactionData"]): Promise<PatternResult>;
}

export interface Persistence {
  saveScan(input: {
    address: string;
    network: Network;
    analysis: Analysis;
    public?: boolean;
    scannedBy?: string; // user id
  }): Promise<{ id: string } | void>;
}

/* ================================
   3) Utilities
================================== */

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const nz = (v: number | null) => (v ?? 0);

function weightedAverage(values: number[], weights: number[]) {
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const sum = values.reduce((acc, v, i) => acc + v * (weights[i] ?? 0), 0);
  return sum / sumW;
}

/* ================================
   4) Default deterministic models
   (Replace with TF/ONNX later)
================================== */

export function createThreatModel(cfg?: {
  liquidityLow?: number;    // default 0.01
  whaleTop10High?: number;  // default 80
  newContractSec?: number;  // default 86400
  botActivityHigh?: number; // default 0.7
}) : ThreatModel {
  const C = { liquidityLow: 0.01, whaleTop10High: 80, newContractSec: 86400, botActivityHigh: 0.7, ...cfg };
  return {
    async predict(f: Features): Promise<ThreatResult> {
      let score = 0;
      let conf = 0.35;
      const indicators: string[] = [];

      if (f.liquidityRatio !== null && f.liquidityRatio < C.liquidityLow) {
        score += 0.4; conf += 0.2; indicators.push("Extremely low liquidity ratio");
      }
      if (f.holderDistribution.top10Percent !== null && f.holderDistribution.top10Percent > C.whaleTop10High) {
        score += 0.3; conf += 0.15; indicators.push("High whale concentration");
      }
      if (f.contractAgeSec !== null && f.contractAgeSec < C.newContractSec) {
        score += 0.2; conf += 0.1; indicators.push("Very new contract");
      }
      if (f.transactionPatterns.botLikeActivity !== null && f.transactionPatterns.botLikeActivity > C.botActivityHigh) {
        score += 0.25; conf += 0.1; indicators.push("Bot-like transaction patterns");
      }

      return { threatScore: clamp01(score), confidence: clamp01(conf), indicators };
    },
  };
}

export function createAlphaModel(): AlphaModel {
  return {
    async predict(f: Features): Promise<AlphaResult> {
      let alpha = 0;
      let mult = 1;
      const signals: string[] = [];

      if (nz(f.volumeSpikes.last24h) > 10) { alpha += 0.3; mult *= 2; signals.push("Massive volume spike"); }
      if (nz(f.socialSentiment.score) > 0.8) { alpha += 0.25; mult *= 1.5; signals.push("Extremely positive sentiment"); }
      if (nz(f.whaleActivity.accumulating) > 0.7) { alpha += 0.2; mult *= 3; signals.push("Whale accumulation"); }
      if (nz(f.developmentActivity.commits) > 50) { alpha += 0.15; mult *= 1.2; signals.push("High development activity"); }
      if (nz(f.marketCapGrowth.last7d) > 2) { alpha += 0.1; mult *= Math.max(1, nz(f.marketCapGrowth.last7d)); signals.push("Market cap growth"); }

      const conf = clamp01(
        0.45 +
          (nz(f.volumeSpikes.last24h) > 10 ? 0.2 : 0) +
          (nz(f.socialSentiment.score) > 0.8 ? 0.15 : 0) +
          (nz(f.whaleActivity.accumulating) > 0.7 ? 0.15 : 0),
      );

      return {
        alphaScore: clamp01(alpha),
        potentialMultiplier: Math.min(1_000_000, mult),
        confidence: conf,
        signals,
      };
    },
  };
}

export function createViralModel(): ViralModel {
  return {
    async predict(f: Features): Promise<ViralResult> {
      let vs = 0;
      let ttv = Number.POSITIVE_INFINITY;
      const cats: string[] = [];

      const mentions = nz(f.socialMentions.growth24h);
      if (mentions > 5) { vs += 0.4; ttv = Math.min(ttv, Math.max(6, 72 - mentions * 2)); cats.push("Exponential social growth"); }

      if (nz(f.influencerActivity.bigFollowers) > 0) { vs += 0.3; ttv = Math.min(ttv, 48); cats.push("Major influencer engagement"); }
      if (nz(f.searchTrends.spike) > 3) { vs += 0.2; ttv = Math.min(ttv, 24); cats.push("Search trend spike"); }
      if (nz(f.networkEffect.velocity) > 0.8) { vs += 0.1; ttv = Math.min(ttv, 12); cats.push("Strong network velocity"); }
      if (nz(f.memePotential) > 0.8) cats.push("High meme potential");

      const conf = clamp01(
        weightedAverage(
          [Math.min(1, mentions / 10), nz(f.influencerActivity.bigFollowers) > 0 ? 1 : 0, Math.min(1, nz(f.searchTrends.spike) / 5)],
          [0.5, 0.3, 0.2],
        ),
      );

      return {
        viralScore: clamp01(vs),
        timeToViralHrs: Number.isFinite(ttv) ? Math.max(1, Math.round(ttv)) : 72,
        confidence: conf,
        catalysts: cats,
      };
    },
  };
}

export function createPatternModel(confidenceThreshold = 0.85): PatternModel {
  function classifyTx(tx: { value: number; gasUsed: number }) {
    const v = tx.value > 1_000_000 ? "large" : tx.value > 1_000 ? "medium" : "small";
    const g = tx.gasUsed > 100_000 ? "high_gas" : "normal_gas";
    return `${v}_${g}`;
  }

  return {
    async analyze(txs): Promise<PatternResult> {
      const patterns: { type: string; similarity: number; description: string }[] = [];
      // naive similarity: proportion of large_high_gas
      const lh = txs.filter((t) => classifyTx(t) === "large_high_gas").length;
      const sim = clamp01(txs.length ? lh / txs.length : 0);

      if (sim > confidenceThreshold) {
        patterns.push({
          type: "scam_pattern",
          similarity: sim,
          description: "High proportion of large value and high gas transactions",
        });
      }

      // No unsupervised novelty in prod stub; keep 0; plug real model later
      const novel: PatternResult["novelPatterns"] = [];

      const risk = clamp01(patterns.length * 0.3 + novel.length * 0.1);
      return { knownPatterns: patterns, novelPatterns: novel, riskLevel: risk };
    },
  };
}

/* ================================
   5) Summary (tone selectable)
================================== */

export type SummaryTone = "clinical" | "vermin";

export function summarize(
  tone: SummaryTone,
  input: {
    address: string;
    network: Network;
    threat: ThreatResult;
    alpha: AlphaResult;
    viral: ViralResult;
  },
): string {
  const { threat, alpha, viral, address, network } = input;

  if (tone === "clinical") {
    const lines: string[] = [];
    lines.push(`NimRev report for ${network}:${address}`);
    lines.push(`Threat score ${Math.round(threat.threatScore * 100)}%; confidence ${Math.round(threat.confidence * 100)}%`);
    if (threat.indicators.length) lines.push(`Indicators: ${threat.indicators.join("; ")}`);
    if (alpha.alphaScore > 0.4) lines.push(`Alpha: score ${Math.round(alpha.alphaScore * 100)}%; est potential ~${alpha.potentialMultiplier.toFixed(0)}x`);
    if (viral.viralScore > 0.4) lines.push(`Viral: score ${Math.round(viral.viralScore * 100)}%; ETA ~${viral.timeToViralHrs}h`);
    lines.push("Method: heuristic scoring; social and activity signals; pattern analysis.");
    lines.push("Disclosure: analysis is informational; not financial advice.");
    return lines.join("\n");
  }

  // "vermin" tone
  let s = "🐀 VERMIN INTELLIGENCE REPORT 🐀\n\n";
  if (threat.threatScore > 0.7) {
    s += `⚠️ THREAT DETECTED; confidence ${Math.round(threat.confidence * 100)}%\n`;
  } else if (threat.threatScore > 0.4) {
    s += "🔍 CAUTION ADVISED; mid-level signatures present\n";
  } else {
    s += "✅ INITIAL SCAN CLEAN; no immediate hazards detected\n";
  }
  if (alpha.alphaScore > 0.6) {
    s += `💎 ALPHA SIGNAL; potential ~${alpha.potentialMultiplier.toFixed(0)}x; momentum forming\n`;
  }
  if (viral.viralScore > 0.5) {
    s += `🚀 VIRAL MOMENTUM; ~${viral.timeToViralHrs}h window possible\n`;
  }
  if (threat.indicators.length) s += `Indicators: ${threat.indicators.join("; ")}\n`;
  s += "\nDisclaimer; intelligence only; verify independently.";
  return s;
}

/* ================================
   6) Default Feature Provider
   (dev-friendly; deterministic; no randomness)
================================== */

export class MockFeatureProvider implements FeatureProvider {
  async extract(address: string, network: Network): Promise<Features> {
    // Replace with real fetchers for Solana/EVM etc.
    // Deterministic pseudo-values from address hash
    const seed = [...address].reduce((a, c) => (a + c.charCodeAt(0)) % 9973, 0) / 9973;
    const pct = (n: number) => Math.round(n * 100);

    return FeaturesSchema.parse({
      liquidityRatio: 0.02 + (seed % 0.01), // 0.02..0.03
      holderDistribution: {
        top1Percent: pct(0.1 + (seed % 0.1)),   // 10..20
        top10Percent: pct(0.5 + (seed % 0.2)),  // 50..70
        uniqueHolders: Math.floor(1000 + seed * 1000),
      },
      contractAgeSec: 3600 * (12 + Math.floor(seed * 96)), // 12h..108h
      transactionPatterns: {
        botLikeActivity: 0.4 + (seed % 0.3), // 0.4..0.7
        humanLikeActivity: 0.3 + (seed % 0.4),
        suspiciousTransfers: Math.floor(seed * 10),
      },
      crossChainActivity: {
        bridgeTxCount: Math.floor(seed * 5),
        multiChainPresence: seed > 0.5,
      },
      volumeSpikes: { last24h: 5 + Math.floor(seed * 15), last7d: 2 + Math.floor(seed * 10) },
      socialSentiment: { score: -0.2 + (seed % 1), mentions24h: Math.floor(seed * 500) },
      socialMentions: { growth24h: -5 + Math.floor(seed * 20) },
      whaleActivity: { accumulating: 0.3 + (seed % 0.5), selling: 0.1 + (seed % 0.4), newWhales: Math.floor(seed * 3) },
      developmentActivity: { commits: Math.floor(seed * 120), activeDevs: Math.floor(seed * 10) },
      marketCapGrowth: { last7d: 1 + (seed % 5) },
      influencerActivity: { bigFollowers: Math.floor(seed * 3) },
      searchTrends: { spike: 1 + (seed % 9) },
      networkEffect: { velocity: 0.2 + (seed % 0.7) },
      memePotential: 0.2 + (seed % 0.7),
      transactionData: Array.from({ length: 200 }, (_, i) => ({
        hash: `0x${i.toString(16).padStart(8, "0")}`,
        from: `0xseed${i}`,
        to: address,
        value: Math.floor(10 ** (seed * 6)) + i,
        timestamp: Date.now() - i * 60000,
        gasUsed: 21_000 + (i % 100_000),
      })),
    });
  }
}

/* ================================
   7) Engine (DI; caching; timeouts; persistence)
================================== */

export type VerminConfig = {
  featureProvider?: FeatureProvider;
  threatModel?: ThreatModel;
  alphaModel?: AlphaModel;
  viralModel?: ViralModel;
  patternModel?: PatternModel;
  summaryTone?: SummaryTone;
  cacheTtlMs?: number;
  persistence?: Persistence;
  timeoutMs?: number;
};

type CacheEntry = { at: number; features: Features };

export class VerminAI {
  private readonly cfg: Required<Omit<VerminConfig, "persistence">> & { persistence?: Persistence };
  private readonly cache = new Map<string, CacheEntry>();

  constructor(config: VerminConfig = {}) {
    this.cfg = {
      featureProvider: config.featureProvider ?? new MockFeatureProvider(),
      threatModel: config.threatModel ?? createThreatModel(),
      alphaModel: config.alphaModel ?? createAlphaModel(),
      viralModel: config.viralModel ?? createViralModel(),
      patternModel: config.patternModel ?? createPatternModel(0.85),
      summaryTone: config.summaryTone ?? "clinical",
      cacheTtlMs: config.cacheTtlMs ?? 30_000,
      timeoutMs: config.timeoutMs ?? 15_000,
      persistence: config.persistence,
    };
  }

  private key(address: string, network: Network) {
    return `${network}:${address}`;
  }

  private async withTimeout<T>(p: Promise<T>): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    try {
      return await p;
    } finally {
      clearTimeout(t);
    }
  }

  private async getFeatures(address: string, network: Network, options?: Record<string, unknown>): Promise<Features> {
    const k = this.key(address, network);
    const now = Date.now();
    const hit = this.cache.get(k);
    if (hit && now - hit.at < this.cfg.cacheTtlMs) return hit.features;

    const raw = await this.withTimeout(this.cfg.featureProvider.extract(address, network, options));
    const features = FeaturesSchema.parse(raw); // strict validation
    this.cache.set(k, { at: now, features });
    return features;
  }

  public async deepScan(input: { address: string; network: Network; options?: Record<string, unknown>; public?: boolean; scannedBy?: string; tone?: SummaryTone; }): Promise<{ success: true; analysis: Analysis; id?: string }> {
    const address = Address.parse(input.address);
    const network = Network.parse(input.network);
    const tone = input.tone ?? this.cfg.summaryTone;

    const started = Date.now();
    const features = await this.getFeatures(address, network, input.options);

    const [threat, alpha, viral, patterns] = await Promise.all([
      this.cfg.threatModel.predict(features),
      this.cfg.alphaModel.predict(features),
      this.cfg.viralModel.predict(features),
      this.cfg.patternModel.analyze(features.transactionData),
    ]);

    const overallConfidence = clamp01((threat.confidence + alpha.confidence + viral.confidence) / 3);
    const summary = summarize(tone, { address, network, threat, alpha, viral });

    const analysis: Analysis = {
      threat,
      alpha,
      viral,
      patterns,
      summary,
      metadata: {
        processingMs: Date.now() - started,
        overallConfidence,
        featureKeys: Object.keys(features).length,
        aiModelsUsed: 4,
      },
    };

    let id: string | undefined;
    if (this.cfg.persistence) {
      const rec = await this.cfg.persistence.saveScan({ address, network, analysis, public: input.public, scannedBy: input.scannedBy });
      if (rec && "id" in rec) id = rec.id;
    }

    return { success: true, analysis, id };
  }
}

/* ================================
   8) Singleton (default)
================================== */

export const verminAI = new VerminAI();
