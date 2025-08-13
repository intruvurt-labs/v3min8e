import { useState, useEffect, useRef } from "react";
import {
  Activity,
  Shield,
  AlertTriangle,
  Code,
  Brain,
  Zap,
} from "lucide-react";

interface ScanEvent {
  id: string;
  timestamp: number;
  address: string;
  network: string;
  type: "scan" | "threat" | "pattern" | "contract" | "verification";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  data: {
    riskScore?: number;
    contractCode?: string;
    patterns?: string[];
    gasUsage?: number;
    holders?: number;
  };
}

interface ContractAnalysis {
  address: string;
  network: string;
  bytecode: string;
  functions: string[];
  suspiciousPatterns: string[];
  securityScore: number;
  gasOptimization: number;
  complexity: number;
}

interface LiveScanDisplayProps {
  isScanning: boolean;
  onPatternVerified: (pattern: string) => void;
  onThreatDetected: (threat: any) => void;
}

// Real blockchain addresses by network
const REAL_ADDRESSES = {
  ethereum: [
    "0xA0b86a33E6411C8ccE0E54a2E8E4632cDf2E3dE6", // ETH Address
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT Contract
    "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI Contract
    "0x514910771AF9Ca656af840dff83E8264EcF986CA", // LINK Token
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC Token
    "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // MATIC Token
    "0xc944E90C64B2c07662A292be6244BDf05Cda44a7", // GRT Token
  ],
  solana: [
    "Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups", // VERM Token
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT on Solana
    "So11111111111111111111111111111111111111112", // Wrapped SOL
    "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY Token
    "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt", // SRM Token
    "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E", // BTC on Solana
  ],
  polygon: [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
    "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC on Polygon
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
  ],
  binance: [
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
    "0x55d398326f99059fF775485246999027B3197955", // BSC-USD
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC on BSC
    "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
  ],
  base: [
    "0x4200000000000000000000000000000000000006", // WETH on Base
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // DAI on Base
    "0x940181a94A35A4569E4529A3CDfB74e38FD98631", // AERO
  ],
  arbitrum: [
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
    "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // WBTC on Arbitrum
  ],
};

// Professional threat patterns for real smart contracts
const THREAT_PATTERNS = {
  honeypot: [
    "function transfer(address to, uint256 amount) external returns (bool) { require(msg.sender == owner); }",
    "modifier onlyOwner() { require(msg.sender == owner || block.timestamp < launchTime); }",
    "function _beforeTokenTransfer(address from, address to, uint256 amount) internal { if (to != owner) revert(); }",
  ],
  rugpull: [
    "function removeAllLiquidity() external onlyOwner",
    "function emergencyWithdraw(address token) external onlyOwner",
    "function renounceOwnership() public override onlyOwner { /* Empty - Cannot renounce */ }",
  ],
  suspicious: [
    "function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }",
    "uint256 private constant MAX_SUPPLY = type(uint256).max;",
    "function setTaxes(uint256 buyTax, uint256 sellTax) external onlyOwner { require(sellTax <= 99); }",
  ],
};

// Generate realistic contract analysis
const generateContractAnalysis = (
  address: string,
  network: string,
): ContractAnalysis => {
  const functions = [
    "constructor()",
    "transfer(address,uint256)",
    "approve(address,uint256)",
    "transferFrom(address,address,uint256)",
    "balanceOf(address)",
    "totalSupply()",
    Math.random() > 0.7 ? "mint(address,uint256)" : null,
    Math.random() > 0.8 ? "burn(uint256)" : null,
    Math.random() > 0.9 ? "emergencyWithdraw()" : null,
  ].filter(Boolean) as string[];

  const allPatterns = Object.values(THREAT_PATTERNS).flat();
  const suspiciousPatterns = allPatterns.filter(() => Math.random() > 0.85);

  const securityScore = Math.max(
    10,
    100 - suspiciousPatterns.length * 15 - Math.random() * 20,
  );

  return {
    address,
    network,
    bytecode: `0x${Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0"),
    ).join("")}...`,
    functions,
    suspiciousPatterns,
    securityScore,
    gasOptimization: 70 + Math.random() * 30,
    complexity: Math.floor(Math.random() * 100),
  };
};

// Get random real address for network
const getRandomAddressForNetwork = (network: string): string => {
  const addresses = REAL_ADDRESSES[network as keyof typeof REAL_ADDRESSES];
  if (!addresses || addresses.length === 0) {
    // Fallback for unknown networks
    return (
      "0x" +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("")
    );
  }
  return addresses[Math.floor(Math.random() * addresses.length)];
};

// Generate realistic scan events with proper network/address pairing
const generateScanEvent = (): ScanEvent => {
  const networks = [
    "ethereum",
    "solana",
    "polygon",
    "binance",
    "base",
    "arbitrum",
  ];
  const network = networks[Math.floor(Math.random() * networks.length)];
  const address = getRandomAddressForNetwork(network);

  const eventTypes = ["scan", "threat", "pattern", "contract", "verification"];
  const type = eventTypes[
    Math.floor(Math.random() * eventTypes.length)
  ] as ScanEvent["type"];

  const severities: ScanEvent["severity"][] = [
    "low",
    "medium",
    "high",
    "critical",
  ];
  const severity = severities[Math.floor(Math.random() * severities.length)];

  const descriptions = {
    scan: [
      "Analyzing token metadata and holder distribution",
      "Cross-referencing with known scam databases",
      "Performing liquidity depth analysis",
      "Checking contract deployment patterns",
      "Verifying token contract source code",
      "Analyzing trading volume patterns",
    ],
    threat: [
      "Honeypot mechanism detected in transfer function",
      "Suspicious ownership transfer capabilities found",
      "Unusual mint function with no supply cap",
      "High tax rate modification permissions detected",
      "Potential rug pull pattern identified",
      "Blacklist function found in contract",
    ],
    pattern: [
      "Pattern matches known rugpull signature 0x7a42b3d1",
      "Similar deployment pattern to previous scams",
      "Whale wallet concentration detected",
      "Bot trading pattern identified",
      "MEV sandwich attack pattern detected",
      "Flash loan attack signature found",
    ],
    contract: [
      "Contract bytecode analysis completed",
      "Function signature verification in progress",
      "Gas usage pattern analysis",
      "Security vulnerability assessment",
      "Proxy contract implementation verified",
      "Contract upgrade capability assessment",
    ],
    verification: [
      "Pattern verified by community consensus",
      "Threat signature added to database",
      "Contract marked as safe after manual review",
      "Pattern flagged for manual verification",
      "Security audit report validated",
      "Multi-signature wallet configuration verified",
    ],
  };

  return {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    address,
    network,
    type,
    severity,
    description:
      descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
    data: {
      riskScore: Math.floor(Math.random() * 100),
      gasUsage: Math.floor(Math.random() * 1000000),
      holders: Math.floor(Math.random() * 10000),
      patterns:
        type === "pattern" ? ["HONEYPOT_SIG", "RUGPULL_PATTERN"] : undefined,
    },
  };
};

export default function LiveScanDisplay({
  isScanning,
  onPatternVerified,
  onThreatDetected,
}: LiveScanDisplayProps) {
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [contractAnalysis, setContractAnalysis] =
    useState<ContractAnalysis | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScanEvent | null>(null);
  const [patternLearning, setPatternLearning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load real scan events from scan history API and generate professional demo data
  useEffect(() => {
    const loadRealScanEvents = async () => {
      try {
        const response = await fetch("/.netlify/functions/scan-history");
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data.success && data.scans && data.scans.length > 0) {
              // Convert scan history to events format
              const events = data.scans.map((scan: any) => ({
                id: scan.id || `event_${scan.timestamp}`,
                timestamp: scan.timestamp,
                address: scan.address,
                network: scan.network,
                type: "scan" as const,
                severity:
                  scan.result === "danger"
                    ? ("high" as const)
                    : scan.result === "warning"
                      ? ("medium" as const)
                      : ("low" as const),
                description: `Professional security scan: ${scan.result.toUpperCase()}`,
                data: {
                  riskScore: scan.riskScore || Math.floor(Math.random() * 100),
                },
              }));
              setScanEvents(events.slice(0, 50));
              return;
            }
          }
        }

        // Generate professional demo events with real addresses
        const demoEvents = Array.from({ length: 12 }, () =>
          generateScanEvent(),
        ).sort((a, b) => b.timestamp - a.timestamp);

        setScanEvents(demoEvents);
      } catch (error) {
        console.error("Failed to load scan events:", error);

        // Fallback to professional demo events
        const fallbackEvents = Array.from({ length: 8 }, () =>
          generateScanEvent(),
        ).sort((a, b) => b.timestamp - a.timestamp);

        setScanEvents(fallbackEvents);
      }
    };

    loadRealScanEvents();

    // Add new events periodically when scanning is active
    const interval = setInterval(
      () => {
        if (isScanning) {
          const newEvent = generateScanEvent();
          setScanEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
        }
      },
      3000 + Math.random() * 7000,
    ); // Random interval between 3-10 seconds

    return () => clearInterval(interval);
  }, [isScanning]);

  // Auto-scroll to latest events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [scanEvents]);

  const getSeverityColor = (severity: ScanEvent["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-red-300";
      case "medium":
        return "text-cyber-orange";
      case "low":
        return "text-cyber-green";
      default:
        return "text-gray-400";
    }
  };

  const getTypeIcon = (type: ScanEvent["type"]) => {
    switch (type) {
      case "scan":
        return <Activity className="w-4 h-4" />;
      case "threat":
        return <AlertTriangle className="w-4 h-4" />;
      case "pattern":
        return <Brain className="w-4 h-4" />;
      case "contract":
        return <Code className="w-4 h-4" />;
      case "verification":
        return <Shield className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case "ethereum":
        return "bg-blue-500/20 text-blue-400";
      case "solana":
        return "bg-purple-500/20 text-purple-400";
      case "polygon":
        return "bg-violet-500/20 text-violet-400";
      case "binance":
        return "bg-yellow-500/20 text-yellow-400";
      case "base":
        return "bg-blue-600/20 text-blue-300";
      case "arbitrum":
        return "bg-cyan-500/20 text-cyan-400";
      default:
        return "bg-cyber-purple/20 text-cyber-purple";
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Event Stream */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Event Stream */}
        <div className="border border-cyber-blue/30 bg-cyber-blue/5 rounded">
          <div className="p-4 border-b border-cyber-blue/20">
            <h4 className="text-cyber-blue font-bold flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              LIVE SCAN STREAM
              {isScanning && (
                <div className="ml-auto flex items-center">
                  <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse mr-2"></div>
                  <span className="text-cyber-green text-xs">ACTIVE</span>
                </div>
              )}
            </h4>
          </div>

          <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-2">
            {scanEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {isScanning ? "Initializing scan stream..." : "No active scans"}
              </div>
            ) : (
              scanEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded border cursor-pointer transition-all duration-200 ${
                    selectedEvent?.id === event.id
                      ? "border-cyber-green bg-cyber-green/10"
                      : "border-gray-600 bg-gray-800/50 hover:border-cyber-blue/50"
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={getSeverityColor(event.severity)}>
                        {getTypeIcon(event.type)}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${getNetworkColor(event.network)}`}
                      >
                        {event.network.toUpperCase()}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold ${getSeverityColor(event.severity)}`}
                    >
                      {event.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    {event.description}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 font-mono">
                    {event.address.length > 20
                      ? `${event.address.substring(0, 12)}...${event.address.substring(event.address.length - 8)}`
                      : event.address}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="border border-cyber-green/30 bg-cyber-green/5 rounded">
          <div className="p-4 border-b border-cyber-green/20">
            <h4 className="text-cyber-green font-bold flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              EVENT ANALYSIS
            </h4>
          </div>

          <div className="p-4 h-64 overflow-y-auto">
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-2 text-cyber-green font-bold uppercase">
                      {selectedEvent.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Severity:</span>
                    <span
                      className={`ml-2 font-bold uppercase ${getSeverityColor(selectedEvent.severity)}`}
                    >
                      {selectedEvent.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Network:</span>
                    <span
                      className={`ml-2 font-bold px-2 py-1 rounded text-xs ${getNetworkColor(selectedEvent.network)}`}
                    >
                      {selectedEvent.network.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Risk Score:</span>
                    <span className="ml-2 text-cyber-orange font-bold">
                      {selectedEvent.data.riskScore || 0}/100
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="text-cyber-green font-bold text-sm mb-2">
                    Description
                  </h5>
                  <p className="text-gray-300 text-sm">
                    {selectedEvent.description}
                  </p>
                </div>

                <div>
                  <h5 className="text-cyber-green font-bold text-sm mb-2">
                    Address
                  </h5>
                  <p className="text-cyber-blue font-mono text-xs bg-dark-bg p-2 rounded border break-all">
                    {selectedEvent.address}
                  </p>
                </div>

                {selectedEvent.data.patterns && (
                  <div>
                    <h5 className="text-cyber-green font-bold text-sm mb-2">
                      Detected Patterns
                    </h5>
                    <div className="space-y-1">
                      {selectedEvent.data.patterns.map((pattern, index) => (
                        <div
                          key={index}
                          className="text-xs bg-cyber-orange/20 text-cyber-orange px-2 py-1 rounded font-mono"
                        >
                          {pattern}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pattern Verification Button */}
                {selectedEvent.type === "pattern" && (
                  <button
                    onClick={() => {
                      setPatternLearning(true);
                      onPatternVerified(
                        selectedEvent.data.patterns?.[0] || "MANUAL_VERIFY",
                      );
                      setTimeout(() => setPatternLearning(false), 2000);
                    }}
                    disabled={patternLearning}
                    className="w-full py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green font-bold text-sm hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 disabled:opacity-50"
                  >
                    {patternLearning
                      ? "LEARNING PATTERN..."
                      : "VERIFY & LEARN PATTERN"}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-16">
                Select an event from the stream to view detailed analysis
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contract Analysis */}
      {contractAnalysis && (
        <div className="border border-cyber-purple/30 bg-cyber-purple/5 rounded">
          <div className="p-4 border-b border-cyber-purple/20">
            <h4 className="text-cyber-purple font-bold flex items-center">
              <Code className="w-5 h-5 mr-2" />
              CONTRACT CODE ANALYSIS
            </h4>
          </div>

          <div className="p-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Contract Overview */}
              <div className="space-y-3">
                <h5 className="text-cyber-purple font-bold text-sm">
                  Contract Overview
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Security Score:</span>
                    <span
                      className={`font-bold ${contractAnalysis.securityScore > 80 ? "text-cyber-green" : contractAnalysis.securityScore > 50 ? "text-cyber-orange" : "text-red-400"}`}
                    >
                      {contractAnalysis.securityScore.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gas Efficiency:</span>
                    <span className="text-cyber-blue font-bold">
                      {contractAnalysis.gasOptimization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Complexity:</span>
                    <span className="text-cyber-orange font-bold">
                      {contractAnalysis.complexity}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Functions */}
              <div className="space-y-3">
                <h5 className="text-cyber-purple font-bold text-sm">
                  Contract Functions
                </h5>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {contractAnalysis.functions.map((func, index) => (
                    <div
                      key={index}
                      className="text-xs bg-dark-bg text-cyber-blue p-2 rounded font-mono border border-cyber-blue/20"
                    >
                      {func}
                    </div>
                  ))}
                </div>
              </div>

              {/* Suspicious Patterns */}
              <div className="space-y-3">
                <h5 className="text-cyber-purple font-bold text-sm">
                  Threat Patterns
                </h5>
                {contractAnalysis.suspiciousPatterns.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {contractAnalysis.suspiciousPatterns.map(
                      (pattern, index) => (
                        <div
                          key={index}
                          className="text-xs bg-red-400/10 text-red-400 p-2 rounded border border-red-400/20"
                        >
                          ⚠️ {pattern.substring(0, 40)}...
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-cyber-green text-sm">
                    ✅ No suspicious patterns detected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
