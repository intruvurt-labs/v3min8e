// networks.ts
import { z } from "zod";

/* =========================
   Base Types & Schemas
========================= */

export const ThreatLevel = z.enum(["very-low", "low", "medium", "high", "critical"]);
export type ThreatLevel = z.infer<typeof ThreatLevel>;

const ScanCapsSchema = z.object({
  contractAnalysis: z.boolean(),
  bytecodeScanning: z.boolean(),
  transactionMonitoring: z.boolean(),
  honeypotDetection: z.boolean(),
  rugPullDetection: z.boolean(),
  socialAnalysis: z.boolean(),
});

export const NetworkConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().min(1),
  chainId: z.number().int().nonnegative(),
  currency: z.string().min(1),
  rpcUrls: z.array(z.string().url().or(z.string().min(1))).min(1),
  explorerUrls: z.array(z.string().url()).min(1),
  threatLevel: ThreatLevel,
  scanCapabilities: ScanCapsSchema,
  averageScanTime: z.number().int().positive(),
  gasTracking: z.boolean(),
  nativeTokenTracking: z.boolean(),
  defiProtocolSupport: z.array(z.string()),
  knownThreats: z.number().int().nonnegative(),
  monthlyScans: z.number().int().nonnegative(),
});
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;

/* =========================
   Supported Networks (const)
========================= */

export const SUPPORTED_NETWORKS = {
  ethereum: {
    id: "ethereum",
    name: "ethereum",
    displayName: "Ethereum",
    chainId: 1,
    currency: "ETH",
    rpcUrls: [
      "https://mainnet.infura.io/v3/{INFURA_KEY}",
      "https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_KEY}",
      "https://cloudflare-eth.com",
      "https://ethereum.publicnode.com",
    ],
    explorerUrls: ["https://etherscan.io"],
    threatLevel: "medium",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 300,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["Uniswap", "Compound", "Aave", "Curve", "SushiSwap"],
    knownThreats: 1247,
    monthlyScans: 15640,
  },
  solana: {
    id: "solana",
    name: "solana",
    displayName: "Solana",
    chainId: 101, // cluster id placeholder; Solana is non-EVM
    currency: "SOL",
    rpcUrls: [
      "https://api.mainnet-beta.solana.com",
      "https://solana-api.projectserum.com",
      "https://rpc.ankr.com/solana",
    ],
    explorerUrls: ["https://solscan.io", "https://explorer.solana.com"],
    threatLevel: "high",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 240,
    gasTracking: false,
    nativeTokenTracking: true,
    defiProtocolSupport: ["Raydium", "Orca", "Serum", "Mango", "Jupiter"],
    knownThreats: 2891,
    monthlyScans: 22150,
  },
  bnb: {
    id: "bnb",
    name: "bnb",
    displayName: "BNB Smart Chain",
    chainId: 56,
    currency: "BNB",
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://bsc-dataseed1.defibit.io",
      "https://bsc-dataseed1.ninicoin.io",
    ],
    explorerUrls: ["https://bscscan.com"],
    threatLevel: "high",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 180,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["PancakeSwap", "Venus", "Alpaca", "Biswap", "ApeSwap"],
    knownThreats: 3452,
    monthlyScans: 28940,
  },
  polygon: {
    id: "polygon",
    name: "polygon",
    displayName: "Polygon",
    chainId: 137,
    currency: "MATIC",
    rpcUrls: [
      "https://polygon-rpc.com",
      "https://rpc-mainnet.matic.network",
      "https://matic-mainnet.chainstacklabs.com",
    ],
    explorerUrls: ["https://polygonscan.com"],
    threatLevel: "medium",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 150,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["QuickSwap", "Aave", "Curve", "SushiSwap", "Balancer"],
    knownThreats: 1856,
    monthlyScans: 19680,
  },
  arbitrum: {
    id: "arbitrum",
    name: "arbitrum",
    displayName: "Arbitrum One",
    chainId: 42161,
    currency: "ETH",
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-mainnet.infura.io/v3/{INFURA_KEY}",
      "https://rpc.ankr.com/arbitrum",
    ],
    explorerUrls: ["https://arbiscan.io"],
    threatLevel: "low",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 210,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["Uniswap V3", "GMX", "Radiant", "Camelot", "Balancer"],
    knownThreats: 654,
    monthlyScans: 8920,
  },
  avalanche: {
    id: "avalanche",
    name: "avalanche",
    displayName: "Avalanche C-Chain",
    chainId: 43114,
    currency: "AVAX",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://rpc.ankr.com/avalanche",
      "https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc",
    ],
    explorerUrls: ["https://snowtrace.io"],
    threatLevel: "medium",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 180,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["Trader Joe", "Pangolin", "Aave", "Benqi", "Curve"],
    knownThreats: 1234,
    monthlyScans: 12450,
  },
  base: {
    id: "base",
    name: "base",
    displayName: "Base",
    chainId: 8453,
    currency: "ETH",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_KEY}",
      "https://rpc.ankr.com/base",
    ],
    explorerUrls: ["https://basescan.org"],
    threatLevel: "low",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 150,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["Uniswap V3", "Aerodrome", "Compound", "BaseSwap"],
    knownThreats: 423,
    monthlyScans: 6780,
  },
  fantom: {
    id: "fantom",
    name: "fantom",
    displayName: "Fantom Opera",
    chainId: 250,
    currency: "FTM",
    rpcUrls: [
      "https://rpc.ftm.tools",
      "https://rpc.ankr.com/fantom",
      "https://fantom-mainnet.public.blastapi.io",
    ],
    explorerUrls: ["https://ftmscan.com"],
    threatLevel: "medium",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 165,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["SpookySwap", "Curve", "Geist", "Beethoven X", "SpiritSwap"],
    knownThreats: 987,
    monthlyScans: 9340,
  },
  optimism: {
    id: "optimism",
    name: "optimism",
    displayName: "Optimism",
    chainId: 10,
    currency: "ETH",
    rpcUrls: [
      "https://mainnet.optimism.io",
      "https://optimism-mainnet.infura.io/v3/{INFURA_KEY}",
      "https://rpc.ankr.com/optimism",
    ],
    explorerUrls: ["https://optimistic.etherscan.io"],
    threatLevel: "low",
    scanCapabilities: {
      contractAnalysis: true,
      bytecodeScanning: true,
      transactionMonitoring: true,
      honeypotDetection: true,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 195,
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: ["Uniswap V3", "Velodrome", "Aave", "Curve", "Synthetix"],
    knownThreats: 567,
    monthlyScans: 7890,
  },
  cardano: {
    id: "cardano",
    name: "cardano",
    displayName: "Cardano",
    chainId: 1815, // not EVM; custom sentinel
    currency: "ADA",
    rpcUrls: [
      "https://cardano-mainnet.blockfrost.io/api/v0",
      "https://graphql-api.mainnet.dandelion.link",
    ],
    explorerUrls: ["https://cardanoscan.io", "https://explorer.cardano.org"],
    threatLevel: "very-low",
    scanCapabilities: {
      contractAnalysis: true,   // Plutus
      bytecodeScanning: false,  // non-EVM
      transactionMonitoring: true,
      honeypotDetection: false,
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 270,
    gasTracking: false,
    nativeTokenTracking: true,
    defiProtocolSupport: ["SundaeSwap", "Minswap", "WingRiders", "MuesliSwap"],
    knownThreats: 156,
    monthlyScans: 3450,
  },
} as const satisfies Record<string, NetworkConfig>;

export type SupportedNetworkId = keyof typeof SUPPORTED_NETWORKS;

/* Validate at startup (throws if malformed) */
Object.values(SUPPORTED_NETWORKS).forEach((n) => NetworkConfigSchema.parse(n));

/* =========================
   Query Helpers
========================= */

export const getNetworkConfig = (networkId: string): NetworkConfig | null =>
  (SUPPORTED_NETWORKS as Record<string, NetworkConfig>)[networkId] ?? null;

export const getAllNetworks = (): NetworkConfig[] =>
  Object.values(SUPPORTED_NETWORKS) as NetworkConfig[];

export const getNetworkByChainId = (chainId: number): NetworkConfig | null =>
  (Object.values(SUPPORTED_NETWORKS) as NetworkConfig[]).find((n) => n.chainId === chainId) ?? null;

export const getNetworksByThreatLevel = (threatLevel: ThreatLevel): NetworkConfig[] =>
  (Object.values(SUPPORTED_NETWORKS) as NetworkConfig[]).filter((n) => n.threatLevel === threatLevel);

export const getHighRiskNetworks = (): NetworkConfig[] =>
  (Object.values(SUPPORTED_NETWORKS) as NetworkConfig[]).filter((n) =>
    n.threatLevel === "high" || n.threatLevel === "critical"
  );

/* Coverage metrics (memoized) */
let _coverage: {
  totalNetworks: number;
  totalScans: number;
  totalThreats: number;
  averageScanTime: number;
} | null = null;

export const getTotalNetworkCoverage = () => {
  if (_coverage) return _coverage;
  const nets = getAllNetworks();
  _coverage = {
    totalNetworks: nets.length,
    totalScans: nets.reduce((s, x) => s + x.monthlyScans, 0),
    totalThreats: nets.reduce((s, x) => s + x.knownThreats, 0),
    averageScanTime: Math.round(nets.reduce((s, x) => s + x.averageScanTime, 0) / nets.length),
  };
  return _coverage;
};

/* Capabilities matrix */
export const getScanCapabilitiesMatrix = (): Record<SupportedNetworkId, NetworkConfig["scanCapabilities"]> => {
  const out = {} as Record<SupportedNetworkId, NetworkConfig["scanCapabilities"]>;
  (Object.keys(SUPPORTED_NETWORKS) as SupportedNetworkId[]).forEach((k) => {
    out[k] = SUPPORTED_NETWORKS[k].scanCapabilities;
  });
  return out;
};

/* =========================
   RPC & Explorer Helpers
========================= */

/** Replace placeholders with env keys, e.g. {INFURA_KEY}, {ALCHEMY_KEY} */
export const withApiKeys = (url: string, env: Record<string, string | undefined>) =>
  url
    .replace("{INFURA_KEY}", env.INFURA_KEY ?? "")
    .replace("{ALCHEMY_KEY}", env.ALCHEMY_KEY ?? "");

/** Pick first usable RPC; inject API keys; allow custom predicate */
export function resolveBestRpc(
  network: SupportedNetworkId,
  env: Record<string, string | undefined> = process.env as any,
  isUsable: (url: string) => boolean = (u) => !u.endsWith("/") || true
): string {
  const cfg = SUPPORTED_NETWORKS[network] as NetworkConfig;
  const candidates = cfg.rpcUrls.map((u) => withApiKeys(u, env)).filter(Boolean);
  const chosen = candidates.find(isUsable) ?? candidates[0];
  if (!chosen) throw new Error(`No RPC URL available for ${network}`);
  return chosen;
}

/** Build an explorer link; supports address/tx/token depending on chain */
export function explorerUrl(
  network: SupportedNetworkId,
  kind: "address" | "tx" | "token",
  value: string
): string {
  const base = SUPPORTED_NETWORKS[network].explorerUrls[0];
  switch (network) {
    case "solana":
      if (kind === "address" || kind === "token") return `${base}/account/${value}`;
      if (kind === "tx") return `${base}/tx/${value}`;
      return base;
    case "cardano":
      // cardanoscan patterns differ; keep address default
      if (kind === "tx") return `${base}/transaction/${value}`;
      return `${base}/address/${value}`;
    default:
      // EVM-style explorers
      if (kind === "tx") return `${base}/tx/${value}`;
      if (kind === "token") return `${base}/token/${value}`;
      return `${base}/address/${value}`;
  }
}

/* =========================
   Scan Plans (per-network)
========================= */

const NetworkScanConfigSchema = z.object({
  gasThreshold: z.number().int().nonnegative().optional(), // gwei
  blockConfirmations: z.number().int().positive().optional(),
  lamportsThreshold: z.number().int().nonnegative().optional(),
  slotConfirmations: z.number().int().positive().optional(),
  honeypotPatterns: z.array(z.string()).default([]),
  rugPullIndicators: z.array(z.string()).default([]),
});
export type NetworkScanConfig = z.infer<typeof NetworkScanConfigSchema>;

export const NETWORK_SCAN_CONFIGS: Partial<Record<SupportedNetworkId, NetworkScanConfig>> = {
  ethereum: {
    gasThreshold: 100,
    blockConfirmations: 12,
    honeypotPatterns: ["selfdestruct", "delegatecall", "proxy_trap"],
    rugPullIndicators: ["mint_authority", "liquidity_drain", "ownership_concentration"],
  },
  solana: {
    lamportsThreshold: 1_000_000,
    slotConfirmations: 32,
    honeypotPatterns: ["token_freeze", "mint_disable", "transfer_hook"],
    rugPullIndicators: ["freeze_authority", "mint_authority", "update_authority"],
  },
  bnb: {
    gasThreshold: 5,
    blockConfirmations: 15,
    honeypotPatterns: ["fee_manipulation", "blacklist_trap", "max_tx_limit"],
    rugPullIndicators: ["ownership_control", "liquidity_lock", "dev_allocation"],
  },
  // add more networks as needed
};

export const getScanPlan = (network: SupportedNetworkId): NetworkScanConfig =>
  NetworkScanConfigSchema.parse(NETWORK_SCAN_CONFIGS[network] ?? {});

/* =========================
   Overrides / Merging
========================= */

/** Merge user overrides (env; ops) into a network config at runtime */
export function withOverrides(
  base: NetworkConfig,
  overrides: Partial<NetworkConfig>
): NetworkConfig {
  // shallow merge on arrays; prefer override if present
  const merged: NetworkConfig = {
    ...base,
    ...overrides,
    rpcUrls: overrides.rpcUrls ?? base.rpcUrls,
    explorerUrls: overrides.explorerUrls ?? base.explorerUrls,
    scanCapabilities: { ...base.scanCapabilities, ...(overrides.scanCapabilities ?? {}) },
    defiProtocolSupport: overrides.defiProtocolSupport ?? base.defiProtocolSupport,
  };
  return NetworkConfigSchema.parse(merged); // validate
}

export default SUPPORTED_NETWORKS;
