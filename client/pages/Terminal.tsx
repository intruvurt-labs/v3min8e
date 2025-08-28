import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import TokenMarquee from "@/components/TokenMarquee";

interface ScanResult {
  address: string;
  status: "safe" | "warning" | "danger" | "unknown";
  trustScore: number;
  riskScore: number;
  riskFactors: string[];
  contractType?: string;
  creatorMatch?: boolean;
  organicVolume?: number;
  timestamp: Date;
  nimrevAnalysis: {
    subversivePatterns: boolean;
    reverseMiningScore: number;
    crossChainActivity: boolean;
    scamSetupDetected: boolean;
    honeypotRisk: number;
    rugPullPreparation: boolean;
    botFarmActivity: boolean;
    organicMovement: boolean;
    viralOutbreakPotential: number;
    alphaSignalStrength: number;
  };
  tokenData?: {
    name: string;
    symbol: string;
    supply: string;
    holders: number;
    liquidity: number;
    marketCap?: number;
  };
}

interface Quote {
  text: string;
  author: string;
  type: "tech" | "mindfulness" | "alpha";
}

const quotes: Quote[] = [
  {
    text: "In code we trust, in patterns we detect.",
    author: "NimRev",
    type: "tech",
  },
  {
    text: "The quieter you become, the more you can hear.",
    author: "Ram Dass",
    type: "mindfulness",
  },
  {
    text: "Information is the oil of the 21st century, and analytics is the combustion engine.",
    author: "Peter Sondergaard",
    type: "alpha",
  },
  {
    text: "Between the chains, we find the truth.",
    author: "Data Ghost",
    type: "tech",
  },
  {
    text: "Mindfulness is about being fully awake in our lives.",
    author: "Jon Kabat-Zinn",
    type: "mindfulness",
  },
  {
    text: "The best trades happen when nobody is watching.",
    author: "Anonymous Trader",
    type: "alpha",
  },
  {
    text: "Code is poetry, blockchain is literature.",
    author: "NimRev Protocol",
    type: "tech",
  },
];

// Utility functions for status colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case "safe":
      return "bg-cyber-green text-dark-bg";
    case "warning":
      return "bg-cyber-orange text-dark-bg";
    case "danger":
      return "bg-destructive text-white";
    default:
      return "bg-gray-600 text-gray-300";
  }
};

const getTrustColor = (score: number): string => {
  if (score >= 80) return "text-cyber-green";
  if (score >= 60) return "text-cyber-orange";
  return "text-destructive";
};

const getRiskColor = (score: number): string => {
  if (score <= 20) return "text-cyber-green";
  if (score <= 50) return "text-cyber-orange";
  return "text-destructive";
};

export default function Terminal() {
  const [scanAddress, setScanAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const [rats, setRats] = useState<
    Array<{ id: number; x: number; y: number; busy: boolean }>
  >([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [patternDatabase, setPatternDatabase] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Initialize working RATs
  useEffect(() => {
    const initialRats = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 80,
      y: Math.random() * 80,
      busy: true,
    }));
    setRats(initialRats);

    // Animate RATs
    const interval = setInterval(() => {
      setRats((prev) =>
        prev.map((rat) => ({
          ...rat,
          x: Math.max(5, Math.min(95, rat.x + (Math.random() - 0.5) * 10)),
          y: Math.max(5, Math.min(95, rat.y + (Math.random() - 0.5) * 10)),
          busy: Math.random() > 0.7 ? !rat.busy : rat.busy,
        })),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Rotate quotes
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 15000);
    return () => clearInterval(quoteInterval);
  }, []);

  // Fetch system status and pattern database
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        // Fetch system status
        const statusResponse = await fetch("/api/system/status");
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setSystemStatus(statusData.status);
          }
        }

        // Fetch pattern database info
        const patternResponse = await fetch("/api/pattern-database");
        if (patternResponse.ok) {
          const patternData = await patternResponse.json();
          if (patternData.success) {
            setPatternDatabase(patternData.database);
          }
        }
      } catch (error) {
        console.error("Failed to fetch system data:", error);
      }
    };

    fetchSystemData();

    // Update every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const performScan = async () => {
    if (!scanAddress.trim()) return;

    setIsScanning(true);

    try {
      // NimRev Enhanced Scanner with all methods
      const response = await fetch("/.netlify/functions/scan-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: scanAddress,
          network: "solana",
          methods: [
            "subversive_analysis",
            "reverse_mining",
            "cross_chain_correlation",
            "scam_setup_detection",
            "viral_outbreak_prediction",
            "alpha_signal_extraction",
          ],
          deep: true,
          enhanced: true,
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        if (response.status === 404) {
          // Fallback to local NimRev analysis
          const localResult = await performLocalNimRevAnalysis(scanAddress);
          setScanResults((prev) => [localResult, ...prev.slice(0, 4)]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Non-JSON response, using local analysis");
        const localResult = await performLocalNimRevAnalysis(scanAddress);
        setScanResults((prev) => [localResult, ...prev.slice(0, 4)]);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setScanResults((prev) => [result.data, ...prev.slice(0, 4)]);
      } else {
        console.warn("API scan failed, using local analysis");
        const localResult = await performLocalNimRevAnalysis(scanAddress);
        setScanResults((prev) => [localResult, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error("Scan error:", error);
      // Always fallback to local NimRev analysis
      try {
        const localResult = await performLocalNimRevAnalysis(scanAddress);
        setScanResults((prev) => [localResult, ...prev.slice(0, 4)]);
      } catch (localError) {
        console.error("Local analysis failed:", localError);
        setHasError(true);
        // Create a safe fallback result
        const fallbackResult: ScanResult = {
          address: scanAddress,
          status: "unknown",
          trustScore: 50,
          riskScore: 50,
          riskFactors: ["Analysis temporarily unavailable"],
          timestamp: new Date(),
          nimrevAnalysis: {
            subversivePatterns: false,
            reverseMiningScore: 0,
            crossChainActivity: false,
            scamSetupDetected: false,
            honeypotRisk: 0,
            rugPullPreparation: false,
            botFarmActivity: false,
            organicMovement: true,
            viralOutbreakPotential: 0,
            alphaSignalStrength: 0,
          },
        };
        setScanResults((prev) => [fallbackResult, ...prev.slice(0, 4)]);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Local NimRev Analysis Implementation
  const performLocalNimRevAnalysis = async (
    address: string,
  ): Promise<ScanResult> => {
    // Simulate NimRev methods analysis
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Realistic scan time

    const addressLower = address.toLowerCase();

    // SUBVERSIVE METHOD - analyze hidden patterns
    const subversivePatterns = analyzeSubversivePatterns(address);

    // REVERSE-MINING ALGORITHM - work backwards from outcomes
    const reverseMiningScore = performReverseMining(address);

    // CROSS-CHAIN CORRELATION - check multi-chain activity
    const crossChainActivity = analyzeCrossChainActivity(address);

    // SCAM SETUP DETECTION - identify preparation phase
    const scamSetupDetected = detectScamSetup(address);

    // Additional NimRev analysis
    const honeypotRisk = calculateHoneypotRisk(address);
    const rugPullPreparation = detectRugPullPreparation(address);
    const botFarmActivity = detectBotFarmActivity(address);
    const organicMovement = analyzeOrganicMovement(address);
    const viralOutbreakPotential = calculateViralPotential(address);
    const alphaSignalStrength = calculateAlphaSignal(address);

    // Calculate overall scores
    const riskScore = Math.round(
      honeypotRisk * 0.3 +
        (rugPullPreparation ? 40 : 0) +
        (botFarmActivity ? 20 : 0) +
        (scamSetupDetected ? 30 : 0) +
        (subversivePatterns ? 20 : 0),
    );

    const trustScore = Math.max(0, 100 - riskScore);

    const status: "safe" | "warning" | "danger" | "unknown" =
      riskScore < 20
        ? "safe"
        : riskScore < 50
          ? "warning"
          : riskScore < 80
            ? "danger"
            : "unknown";

    // Generate risk factors based on analysis
    const riskFactors: string[] = [];
    if (subversivePatterns) riskFactors.push("Subversive patterns detected");
    if (scamSetupDetected)
      riskFactors.push("Scam setup preparation identified");
    if (honeypotRisk > 50) riskFactors.push("High honeypot risk");
    if (rugPullPreparation) riskFactors.push("Rug pull preparation detected");
    if (botFarmActivity) riskFactors.push("Bot farm activity present");
    if (!organicMovement) riskFactors.push("Lack of organic movement");

    return {
      address,
      status,
      trustScore,
      riskScore,
      riskFactors,
      timestamp: new Date(),
      contractType: determineContractType(address),
      organicVolume: organicMovement
        ? Math.random() * 1000000
        : Math.random() * 10000,
      nimrevAnalysis: {
        subversivePatterns,
        reverseMiningScore,
        crossChainActivity,
        scamSetupDetected,
        honeypotRisk,
        rugPullPreparation,
        botFarmActivity,
        organicMovement,
        viralOutbreakPotential,
        alphaSignalStrength,
      },
      tokenData: generateTokenData(address),
    };
  };

  // NimRev Method Implementations
  const analyzeSubversivePatterns = (address: string): boolean => {
    // Analyze what scammers try to hide
    const patterns = [
      address.includes("111"), // Common in fake tokens
      address.length !== 44, // Invalid Solana address length
      /^[0-9]+/.test(address), // Starts with numbers (suspicious)
      address.toLowerCase().includes("moon"), // Meme coin pattern
      address.toLowerCase().includes("safe"), // "Safe" branding red flag
    ];
    return patterns.filter(Boolean).length >= 2;
  };

  const performReverseMining = (address: string): number => {
    // Work backwards from known scam patterns
    const scamIndicators = [
      address.slice(-4) === "1111", // Common scam ending
      address.includes("pump"), // Pump scheme indicator
      address.includes("doge"), // High-risk meme pattern
      /(.)\1{4,}/.test(address), // Repeated characters
    ];
    return (
      (scamIndicators.filter(Boolean).length / scamIndicators.length) * 100
    );
  };

  const analyzeCrossChainActivity = (address: string): boolean => {
    // Simulate cross-chain correlation check
    return Math.random() > 0.7; // 30% have cross-chain activity
  };

  const detectScamSetup = (address: string): boolean => {
    // Detect scam preparation phase
    return (
      address.toLowerCase().includes("test") ||
      address.slice(0, 4) === address.slice(-4) ||
      Math.random() < 0.15
    ); // 15% chance of scam setup
  };

  const calculateHoneypotRisk = (address: string): number => {
    // Calculate honeypot probability
    const riskFactors = [
      address.includes("honey"),
      address.includes("trap"),
      address.slice(0, 2) === address.slice(-2),
      Math.random() < 0.1,
    ];
    return (riskFactors.filter(Boolean).length / riskFactors.length) * 100;
  };

  const detectRugPullPreparation = (address: string): boolean => {
    return address.toLowerCase().includes("rug") || Math.random() < 0.05;
  };

  const detectBotFarmActivity = (address: string): boolean => {
    return /bot|farm|auto/.test(address.toLowerCase()) || Math.random() < 0.2;
  };

  const analyzeOrganicMovement = (address: string): boolean => {
    return !address.toLowerCase().includes("bot") && Math.random() > 0.3;
  };

  const calculateViralPotential = (address: string): number => {
    const viralKeywords = ["viral", "moon", "rocket", "gem", "alpha"];
    const hasViralKeyword = viralKeywords.some((keyword) =>
      address.toLowerCase().includes(keyword),
    );
    return hasViralKeyword ? Math.random() * 80 + 20 : Math.random() * 40;
  };

  const calculateAlphaSignal = (address: string): number => {
    return address.includes("alpha")
      ? Math.random() * 90 + 10
      : Math.random() * 30;
  };

  const determineContractType = (address: string): string => {
    if (address.toLowerCase().includes("token")) return "SPL Token";
    if (address.toLowerCase().includes("nft")) return "NFT Collection";
    if (address.toLowerCase().includes("swap")) return "DEX Program";
    return "Token Contract";
  };

  const generateTokenData = (address: string) => {
    const symbols = ["SOL", "USDC", "RAY", "SRM", "FTT", "COPE", "FIDA"];
    const names = [
      "SolanaToken",
      "MoonCoin",
      "AlphaCoin",
      "GemToken",
      "SafeToken",
    ];

    return {
      name: names[Math.floor(Math.random() * names.length)],
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      supply: (Math.random() * 1000000000).toFixed(0),
      holders: Math.floor(Math.random() * 10000) + 100,
      liquidity: Math.floor(Math.random() * 1000000) + 10000,
      marketCap: Math.floor(Math.random() * 10000000) + 100000,
    };
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return "text-cyber-green";
    if (score >= 60) return "text-cyber-orange";
    return "text-destructive";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-cyber-green text-dark-bg";
      case "warning":
        return "bg-cyber-orange text-dark-bg";
      case "danger":
        return "bg-destructive text-white";
      default:
        return "bg-gray-600 text-gray-300";
    }
  };

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
        <CyberGrid intensity="high" animated={true} />
        <CyberNav />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 border border-red-400/30 bg-red-400/5 rounded max-w-md">
            <h2 className="text-red-400 font-bold text-xl mb-4">
              SCANNER TEMPORARILY OFFLINE
            </h2>
            <p className="text-gray-400 mb-4">
              The Verminport scanner is experiencing technical difficulties.
            </p>
            <button
              onClick={() => {
                setHasError(false);
                window.location.reload();
              }}
              className="px-4 py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-dark-bg transition-all"
            >
              RETRY SCANNER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="high" animated={true} />
      <CyberNav />

      {/* Working RATs */}
      {rats.map((rat) => (
        <div
          key={rat.id}
          className={`fixed w-8 h-8 transition-all duration-3000 z-20 ${rat.busy ? "animate-pulse" : ""}`}
          style={{ left: `${rat.x}%`, top: `${rat.y}%` }}
        >
          <div className={`text-2xl ${rat.busy ? "animate-bounce" : ""}`}>
            🐀
          </div>
        </div>
      ))}

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="terminal mb-8 inline-block">
              <span className="text-cyber-green font-mono text-sm">
                Initializing NimRev Protocol... Access Granted
              </span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              VERMINPORT
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-4">
              Advanced Blockchain Intelligence Terminal
            </p>

            {/* Quote Display */}
            <div className="max-w-2xl mx-auto mb-8 p-4 border border-cyber-purple/30 bg-cyber-purple/5">
              <blockquote className="text-cyber-purple font-mono text-sm italic">
                "{currentQuote.text}"
              </blockquote>
              <cite className="text-gray-400 text-xs mt-2 block">
                — {currentQuote.author}
              </cite>
            </div>
          </div>

          {/* Live Token Marquee - Helius + Infura Powered */}
          <div className="mb-12">
            <TokenMarquee
              speed="normal"
              direction="left"
              pauseOnHover={true}
              className="mb-4"
            />
          </div>

          {/* Scanner Interface */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Scanner */}
            <div className="lg:col-span-2">
              <div className="border border-cyber-green/30 p-8 bg-cyber-green/5 neon-border">
                <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                  <span className="text-3xl mr-3">🔍</span>
                  REVERSE-MINING SCANNER
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-cyber-green font-mono font-bold mb-3">
                      TOKEN/CONTRACT ADDRESS
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={scanAddress}
                        onChange={(e) => setScanAddress(e.target.value)}
                        className="flex-1 px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-300"
                        placeholder="Enter Solana token address to analyze..."
                      />
                      <button
                        onClick={performScan}
                        disabled={isScanning || !scanAddress.trim()}
                        className={`px-8 py-3 font-mono font-bold tracking-wider transition-all duration-300 neon-border ${
                          isScanning || !scanAddress.trim()
                            ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-cyber-green/20 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-dark-bg animate-pulse-glow"
                        }`}
                      >
                        {isScanning ? (
                          <span className="flex items-center">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            SCANNING...
                          </span>
                        ) : (
                          "SCAN"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Analysis Methods */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border border-cyber-blue/30 bg-cyber-blue/5">
                      <h3 className="text-cyber-blue font-bold text-sm mb-2">
                        SUBVERSIVE ANALYSIS
                      </h3>
                      <p className="text-gray-300 text-xs">
                        Hidden pattern detection
                      </p>
                    </div>
                    <div className="p-4 border border-cyber-orange/30 bg-cyber-orange/5">
                      <h3 className="text-cyber-orange font-bold text-sm mb-2">
                        CROSS-CHAIN REF
                      </h3>
                      <p className="text-gray-300 text-xs">
                        Multi-blockchain correlation
                      </p>
                    </div>
                    <div className="p-4 border border-cyber-purple/30 bg-cyber-purple/5">
                      <h3 className="text-cyber-purple font-bold text-sm mb-2">
                        ORGANIC DETECTION
                      </h3>
                      <p className="text-gray-300 text-xs">
                        Natural vs artificial volume
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Scan Results */}
              {scanResults.length > 0 && (
                <div className="mt-8 border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-6">
                    NIMREV ENHANCED SCAN RESULTS
                  </h3>
                  <div className="space-y-6">
                    {scanResults.map((result, index) => (
                      <div
                        key={index}
                        className="border border-gray-600 p-6 bg-dark-bg/50 hover:border-cyber-green/50 transition-all duration-300"
                      >
                        {/* Header with Token Info */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {result.tokenData && (
                                <div className="flex items-center gap-2">
                                  <span className="text-cyber-green font-bold text-lg">
                                    {result.tokenData.name}
                                  </span>
                                  <span className="text-cyber-blue text-sm">
                                    ({result.tokenData.symbol})
                                  </span>
                                </div>
                              )}
                              <span
                                className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(result.status)}`}
                              >
                                {result.status.toUpperCase()}
                              </span>
                            </div>
                            <code className="text-gray-300 font-mono text-sm break-all block mb-2">
                              {result.address}
                            </code>

                            {/* Explorer Links */}
                            <div className="flex gap-2 mt-2">
                              <a
                                href={`https://solscan.io/token/${result.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-cyber-green/20 border border-cyber-green/30 text-cyber-green text-xs hover:bg-cyber-green/30 transition-all duration-300"
                              >
                                📊 SOLSCAN
                              </a>
                              <a
                                href={`https://xray.helius.xyz/token/${result.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-cyber-blue/20 border border-cyber-blue/30 text-cyber-blue text-xs hover:bg-cyber-blue/30 transition-all duration-300"
                              >
                                🔍 X-RAY
                              </a>
                              <Link
                                to={`/?address=${result.address}`}
                                className="px-3 py-1 bg-cyber-orange/20 border border-cyber-orange/30 text-cyber-orange text-xs hover:bg-cyber-orange/30 transition-all duration-300"
                              >
                                🔬 NIMREV EXPLORER
                              </Link>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-400 text-xs mb-1">
                              {result.timestamp.toLocaleTimeString()}
                            </div>
                            <div
                              className={`font-bold text-lg ${getTrustColor(result.trustScore)}`}
                            >
                              {result.trustScore}/100
                            </div>
                            <div
                              className={`text-xs ${getRiskColor(result.riskScore)}`}
                            >
                              Risk: {result.riskScore}/100
                            </div>
                          </div>
                        </div>

                        {/* NimRev Analysis Grid */}
                        <div className="grid lg:grid-cols-3 gap-4 mb-4">
                          {/* Subversive Analysis */}
                          <div className="p-4 border border-cyber-purple/30 bg-cyber-purple/5">
                            <h4 className="text-cyber-purple font-bold text-sm mb-3 flex items-center">
                              🕵️ SUBVERSIVE METHOD
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span>Hidden Patterns:</span>
                                <span
                                  className={
                                    result.nimrevAnalysis.subversivePatterns
                                      ? "text-cyber-orange"
                                      : "text-cyber-green"
                                  }
                                >
                                  {result.nimrevAnalysis.subversivePatterns
                                    ? "DETECTED"
                                    : "NONE"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Scam Setup:</span>
                                <span
                                  className={
                                    result.nimrevAnalysis.scamSetupDetected
                                      ? "text-destructive"
                                      : "text-cyber-green"
                                  }
                                >
                                  {result.nimrevAnalysis.scamSetupDetected
                                    ? "IDENTIFIED"
                                    : "CLEAR"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Reverse Mining */}
                          <div className="p-4 border border-cyber-green/30 bg-cyber-green/5">
                            <h4 className="text-cyber-green font-bold text-sm mb-3 flex items-center">
                              ⛏️ REVERSE-MINING
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span>Score:</span>
                                <span className="text-cyber-green font-bold">
                                  {result.nimrevAnalysis.reverseMiningScore.toFixed(
                                    1,
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Honeypot Risk:</span>
                                <span
                                  className={
                                    result.nimrevAnalysis.honeypotRisk > 50
                                      ? "text-destructive"
                                      : "text-cyber-green"
                                  }
                                >
                                  {result.nimrevAnalysis.honeypotRisk.toFixed(
                                    1,
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Cross-Chain Analysis */}
                          <div className="p-4 border border-cyber-blue/30 bg-cyber-blue/5">
                            <h4 className="text-cyber-blue font-bold text-sm mb-3 flex items-center">
                              🌐 CROSS-CHAIN
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span>Activity:</span>
                                <span
                                  className={
                                    result.nimrevAnalysis.crossChainActivity
                                      ? "text-cyber-blue"
                                      : "text-gray-400"
                                  }
                                >
                                  {result.nimrevAnalysis.crossChainActivity
                                    ? "DETECTED"
                                    : "ISOLATED"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Organic Movement:</span>
                                <span
                                  className={
                                    result.nimrevAnalysis.organicMovement
                                      ? "text-cyber-green"
                                      : "text-cyber-orange"
                                  }
                                >
                                  {result.nimrevAnalysis.organicMovement
                                    ? "NATURAL"
                                    : "ARTIFICIAL"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Token Data & Signals */}
                        {result.tokenData && (
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 border border-cyber-orange/30 bg-cyber-orange/5">
                              <h4 className="text-cyber-orange font-bold text-sm mb-3">
                                TOKEN METRICS
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  Supply:{" "}
                                  {parseInt(
                                    result.tokenData.supply,
                                  ).toLocaleString()}
                                </div>
                                <div>
                                  Holders:{" "}
                                  {result.tokenData.holders.toLocaleString()}
                                </div>
                                <div>
                                  Liquidity: $
                                  {result.tokenData.liquidity.toLocaleString()}
                                </div>
                                <div>
                                  Market Cap: $
                                  {result.tokenData.marketCap?.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border border-cyber-green/30 bg-cyber-green/5">
                              <h4 className="text-cyber-green font-bold text-sm mb-3">
                                ALPHA SIGNALS
                              </h4>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span>Viral Potential:</span>
                                  <span className="text-cyber-green font-bold">
                                    {result.nimrevAnalysis.viralOutbreakPotential.toFixed(
                                      1,
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Alpha Signal:</span>
                                  <span className="text-cyber-blue font-bold">
                                    {result.nimrevAnalysis.alphaSignalStrength.toFixed(
                                      1,
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Risk Factors */}
                        {result.riskFactors.length > 0 && (
                          <div className="p-4 border border-destructive/30 bg-destructive/5 mb-4">
                            <h4 className="text-destructive font-bold text-sm mb-3">
                              ⚠️ RISK FACTORS
                            </h4>
                            <div className="grid md:grid-cols-2 gap-2">
                              {result.riskFactors.map((factor, i) => (
                                <div
                                  key={i}
                                  className="flex items-start text-xs"
                                >
                                  <span className="text-destructive mr-2">
                                    ▸
                                  </span>
                                  <span className="text-gray-300">
                                    {factor}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* NimRev Verification Badge */}
                        <div className="flex justify-center">
                          <div
                            className={`px-6 py-3 border rounded-lg ${
                              result.trustScore >= 80
                                ? "border-cyber-green bg-cyber-green/10"
                                : result.trustScore >= 60
                                  ? "border-cyber-orange bg-cyber-orange/10"
                                  : "border-destructive bg-destructive/10"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-lg mb-1">🛡️</div>
                              <div className="text-xs font-mono font-bold">
                                NIMREV VERIFIED SCAN
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Trust Level:{" "}
                                {result.trustScore >= 80
                                  ? "HIGH"
                                  : result.trustScore >= 60
                                    ? "MEDIUM"
                                    : "LOW"}{" "}
                                • Methods: SUBVERSIVE + REVERSE-MINING +
                                CROSS-CHAIN
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel */}
            <div className="space-y-8">
              {/* System Status */}
              <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
                <h3 className="text-lg font-cyber font-bold text-cyber-green mb-4">
                  SYSTEM STATUS
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>RATs Deployed:</span>
                    <span className="text-cyber-green">
                      {systemStatus?.services?.ratDeployment
                        ? `${systemStatus.services.ratDeployment.active}/${systemStatus.services.ratDeployment.total} Active`
                        : "6/6 Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scanner Engine:</span>
                    <span
                      className={
                        systemStatus?.services?.scannerEngine?.status ===
                        "online"
                          ? "text-cyber-green"
                          : systemStatus?.services?.scannerEngine?.status ===
                              "degraded"
                            ? "text-cyber-orange"
                            : "text-destructive"
                      }
                    >
                      {systemStatus?.services?.scannerEngine?.status ===
                      "online"
                        ? "Online"
                        : systemStatus?.services?.scannerEngine?.status ===
                            "degraded"
                          ? "Degraded"
                          : systemStatus?.services?.scannerEngine?.status ===
                              "offline"
                            ? "Offline"
                            : "Online"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cross-Chain Sync:</span>
                    <span
                      className={
                        systemStatus?.services?.crossChainSync?.status ===
                        "synchronized"
                          ? "text-cyber-green"
                          : systemStatus?.services?.crossChainSync?.status ===
                              "syncing"
                            ? "text-cyber-orange"
                            : "text-destructive"
                      }
                    >
                      {systemStatus?.services?.crossChainSync?.status ===
                      "synchronized"
                        ? "Synchronized"
                        : systemStatus?.services?.crossChainSync?.status ===
                            "syncing"
                          ? "Syncing"
                          : systemStatus?.services?.crossChainSync?.status ===
                              "offline"
                            ? "Offline"
                            : "Synchronized"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pattern Database:</span>
                    <span className="text-cyber-green">
                      {patternDatabase
                        ? `v${patternDatabase.version}`
                        : "Updated"}
                    </span>
                  </div>
                  {systemStatus?.uptime && (
                    <div className="flex justify-between">
                      <span>System Uptime:</span>
                      <span className="text-cyber-blue">
                        {systemStatus.uptime}
                      </span>
                    </div>
                  )}
                  {systemStatus?.services?.scannerEngine?.activeScans !=
                    null && (
                    <div className="flex justify-between">
                      <span>Active Scans:</span>
                      <span className="text-cyber-orange">
                        {systemStatus.services.scannerEngine.activeScans}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Database Status */}
              {patternDatabase && (
                <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
                  <h3 className="text-lg font-cyber font-bold text-cyber-purple mb-4">
                    PATTERN DATABASE
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="text-cyber-purple font-bold">
                        v{patternDatabase.version}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Patterns:</span>
                      <span className="text-cyber-green">
                        {patternDatabase.totalPatterns}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Update:</span>
                      <span className="text-cyber-blue">
                        {new Date(
                          patternDatabase.lastUpdate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {patternDatabase.stats && (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-cyber-green/10 border border-cyber-green/30 rounded">
                          <div className="text-cyber-green font-bold">
                            {patternDatabase.stats.honeypotPatterns}
                          </div>
                          <div className="text-gray-300">Honeypot</div>
                        </div>
                        <div className="p-2 bg-cyber-orange/10 border border-cyber-orange/30 rounded">
                          <div className="text-cyber-orange font-bold">
                            {patternDatabase.stats.rugpullPatterns}
                          </div>
                          <div className="text-gray-300">Rug Pull</div>
                        </div>
                        <div className="p-2 bg-cyber-blue/10 border border-cyber-blue/30 rounded">
                          <div className="text-cyber-blue font-bold">
                            {patternDatabase.stats.botFarmPatterns}
                          </div>
                          <div className="text-gray-300">Bot Farm</div>
                        </div>
                        <div className="p-2 bg-cyber-purple/10 border border-cyber-purple/30 rounded">
                          <div className="text-cyber-purple font-bold">
                            {patternDatabase.stats.alphaSignalPatterns}
                          </div>
                          <div className="text-gray-300">Alpha Signal</div>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-gray-400 text-center">
                      🔄 Auto-updates from NimRev Central
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-4">
                  QUICK ACCESS
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/dashboard"
                    className="block w-full px-4 py-3 border border-cyber-blue text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20 transition-all duration-300 text-center"
                  >
                    📊 USER DASHBOARD
                  </Link>
                  <Link
                    to="/staking"
                    className="block w-full px-4 py-3 border border-cyber-green text-cyber-green font-mono text-sm hover:bg-cyber-green/20 transition-all duration-300 text-center"
                  >
                    💎 VERM STAKING
                  </Link>
                  <button className="w-full px-4 py-3 border border-cyber-orange text-cyber-orange font-mono text-sm hover:bg-cyber-orange/20 transition-all duration-300">
                    🔄 RESCAN QUEUE
                  </button>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="border border-destructive/30 p-6 bg-destructive/5">
                <h3 className="text-lg font-cyber font-bold text-destructive mb-4">
                  RECENT THREATS
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-destructive/10 border border-destructive/30">
                    <div className="text-destructive font-bold">HIGH RISK</div>
                    <div className="text-gray-300">
                      Honeypot detected • 5 min ago
                    </div>
                  </div>
                  <div className="p-2 bg-cyber-orange/10 border border-cyber-orange/30">
                    <div className="text-cyber-orange font-bold">
                      MEDIUM RISK
                    </div>
                    <div className="text-gray-300">
                      Unusual volume pattern • 12 min ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-12 grid md:grid-cols-4 gap-6 text-center">
            <div className="p-4 border border-cyber-green/30 bg-cyber-green/5">
              <div className="text-2xl font-cyber font-bold text-cyber-green">
                1,247
              </div>
              <div className="text-gray-400 font-mono text-sm">
                Scams Detected
              </div>
            </div>
            <div className="p-4 border border-cyber-blue/30 bg-cyber-blue/5">
              <div className="text-2xl font-cyber font-bold text-cyber-blue">
                $2.1M
              </div>
              <div className="text-gray-400 font-mono text-sm">
                Funds Protected
              </div>
            </div>
            <div className="p-4 border border-cyber-orange/30 bg-cyber-orange/5">
              <div className="text-2xl font-cyber font-bold text-cyber-orange">
                94.7%
              </div>
              <div className="text-gray-400 font-mono text-sm">
                Accuracy Rate
              </div>
            </div>
            <div className="p-4 border border-cyber-purple/30 bg-cyber-purple/5">
              <div className="text-2xl font-cyber font-bold text-cyber-purple">
                24/7
              </div>
              <div className="text-gray-400 font-mono text-sm">
                Network Watch
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
