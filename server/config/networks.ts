export interface NetworkConfig {
  id: string;
  name: string;
  displayName: string;
  chainId: number;
  currency: string;
  rpcUrls: string[];
  explorerUrls: string[];
  threatLevel: "very-low" | "low" | "medium" | "high" | "critical";
  scanCapabilities: {
    contractAnalysis: boolean;
    bytecodeScanning: boolean;
    transactionMonitoring: boolean;
    honeypotDetection: boolean;
    rugPullDetection: boolean;
    socialAnalysis: boolean;
  };
  averageScanTime: number; // in seconds
  gasTracking: boolean;
  nativeTokenTracking: boolean;
  defiProtocolSupport: string[];
  knownThreats: number;
  monthlyScans: number;
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    id: "ethereum",
    name: "ethereum",
    displayName: "Ethereum",
    chainId: 1,
    currency: "ETH",
    rpcUrls: [
      "https://mainnet.infura.io/v3/",
      "https://eth-mainnet.alchemyapi.io/v2/",
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
    averageScanTime: 300, // 5 minutes
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
    chainId: 101,
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
    averageScanTime: 240, // 4 minutes
    gasTracking: false, // Solana uses different fee structure
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
      "https://bsc-dataseed.binance.org/",
      "https://bsc-dataseed1.defibit.io/",
      "https://bsc-dataseed1.ninicoin.io/",
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
    averageScanTime: 180, // 3 minutes
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: [
      "PancakeSwap",
      "Venus",
      "Alpaca",
      "Biswap",
      "ApeSwap",
    ],
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
      "https://polygon-rpc.com/",
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
    averageScanTime: 150, // 2.5 minutes
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: [
      "QuickSwap",
      "Aave",
      "Curve",
      "SushiSwap",
      "Balancer",
    ],
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
      "https://arbitrum-mainnet.infura.io/v3/",
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
    averageScanTime: 210, // 3.5 minutes
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: [
      "Uniswap V3",
      "GMX",
      "Radiant",
      "Camelot",
      "Balancer",
    ],
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
    averageScanTime: 180, // 3 minutes
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
      "https://base-mainnet.diamondswap.org/rpc",
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
    averageScanTime: 150, // 2.5 minutes
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
      "https://rpc.ftm.tools/",
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
    averageScanTime: 165, // 2.75 minutes
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: [
      "SpookySwap",
      "Curve",
      "Geist",
      "Beethoven X",
      "SpiritSwap",
    ],
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
      "https://optimism-mainnet.infura.io/v3/",
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
    averageScanTime: 195, // 3.25 minutes
    gasTracking: true,
    nativeTokenTracking: true,
    defiProtocolSupport: [
      "Uniswap V3",
      "Velodrome",
      "Aave",
      "Curve",
      "Synthetix",
    ],
    knownThreats: 567,
    monthlyScans: 7890,
  },

  cardano: {
    id: "cardano",
    name: "cardano",
    displayName: "Cardano",
    chainId: 1815, // Cardano doesn't use EVM chainId, this is custom
    currency: "ADA",
    rpcUrls: [
      "https://cardano-mainnet.blockfrost.io/api/v0",
      "https://graphql-api.mainnet.dandelion.link",
    ],
    explorerUrls: ["https://cardanoscan.io", "https://explorer.cardano.org"],
    threatLevel: "very-low",
    scanCapabilities: {
      contractAnalysis: true, // Plutus smart contracts
      bytecodeScanning: false, // Different from EVM
      transactionMonitoring: true,
      honeypotDetection: false, // Limited DeFi ecosystem
      rugPullDetection: true,
      socialAnalysis: true,
    },
    averageScanTime: 270, // 4.5 minutes
    gasTracking: false, // Different fee structure
    nativeTokenTracking: true,
    defiProtocolSupport: ["SundaeSwap", "Minswap", "WingRiders", "MuesliSwap"],
    knownThreats: 156,
    monthlyScans: 3450,
  },
};

export const getNetworkConfig = (networkId: string): NetworkConfig | null => {
  return SUPPORTED_NETWORKS[networkId] || null;
};

export const getAllNetworks = (): NetworkConfig[] => {
  return Object.values(SUPPORTED_NETWORKS);
};

export const getNetworksByThreatLevel = (
  threatLevel: string,
): NetworkConfig[] => {
  return Object.values(SUPPORTED_NETWORKS).filter(
    (network) => network.threatLevel === threatLevel,
  );
};

export const getTotalNetworkCoverage = (): {
  totalNetworks: number;
  totalScans: number;
  totalThreats: number;
  averageScanTime: number;
} => {
  const networks = Object.values(SUPPORTED_NETWORKS);
  return {
    totalNetworks: networks.length,
    totalScans: networks.reduce(
      (sum, network) => sum + network.monthlyScans,
      0,
    ),
    totalThreats: networks.reduce(
      (sum, network) => sum + network.knownThreats,
      0,
    ),
    averageScanTime: Math.round(
      networks.reduce((sum, network) => sum + network.averageScanTime, 0) /
        networks.length,
    ),
  };
};

export const getHighRiskNetworks = (): NetworkConfig[] => {
  return Object.values(SUPPORTED_NETWORKS).filter(
    (network) =>
      network.threatLevel === "high" || network.threatLevel === "critical",
  );
};

export const getScanCapabilitiesMatrix = (): Record<
  string,
  Record<string, boolean>
> => {
  const matrix: Record<string, Record<string, boolean>> = {};

  Object.values(SUPPORTED_NETWORKS).forEach((network) => {
    matrix[network.id] = network.scanCapabilities;
  });

  return matrix;
};

// Network-specific scan configurations
export const NETWORK_SCAN_CONFIGS = {
  ethereum: {
    gasThreshold: 100, // gwei
    blockConfirmations: 12,
    honeypotPatterns: ["selfdestruct", "delegatecall", "proxy_trap"],
    rugPullIndicators: [
      "mint_authority",
      "liquidity_drain",
      "ownership_concentration",
    ],
  },

  solana: {
    lamportsThreshold: 1000000, // 0.001 SOL
    slotConfirmations: 32,
    honeypotPatterns: ["token_freeze", "mint_disable", "transfer_hook"],
    rugPullIndicators: [
      "freeze_authority",
      "mint_authority",
      "update_authority",
    ],
  },

  bnb: {
    gasThreshold: 5, // gwei (lower than Ethereum)
    blockConfirmations: 15,
    honeypotPatterns: ["fee_manipulation", "blacklist_trap", "max_tx_limit"],
    rugPullIndicators: [
      "ownership_control",
      "liquidity_lock",
      "dev_allocation",
    ],
  },

  // Add more network-specific configurations as needed
};

export default SUPPORTED_NETWORKS;
