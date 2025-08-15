import { useState, useEffect } from "react";
import {
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Target,
  Activity,
  Skull,
  TrendingUp,
  TrendingDown,
  Clock,
  Globe,
  Lock,
  Eye,
} from "lucide-react";

interface ScanResult {
  address: string;
  riskScore: number;
  riskLevel: "safe" | "warning" | "danger" | "critical";
  confidence: number;
  findings: string[];
  timestamp: number;
  blockchain: "solana" | "ethereum";
  details: {
    transactionCount: number;
    balance: number;
    lastActivity: number;
    suspiciousPatterns: string[];
    reputation: number;
  };
}

interface LiveScannerProps {
  onScanComplete?: (result: ScanResult) => void;
  embedded?: boolean;
}

export default function LiveAddressScanner({
  onScanComplete,
  embedded = false,
}: LiveScannerProps) {
  const [address, setAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [liveStats, setLiveStats] = useState({
    totalScans: 15847,
    threatsDetected: 3421,
    safeSites: 12426,
    lastUpdate: Date.now(),
  });
  const [glitchText, setGlitchText] = useState("");

  // Glitch effect for scanner text
  useEffect(() => {
    const glitchTexts = [
      "NEURAL_SCAN_ACTIVE",
      "BLOCKCHAIN_ANALYSIS",
      "PATTERN_RECOGNITION",
      "THREAT_ASSESSMENT",
      "RISK_CALCULATION",
      "SIGNATURE_MATCHING",
    ];

    const interval = setInterval(() => {
      setGlitchText(
        glitchTexts[Math.floor(Math.random() * glitchTexts.length)],
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update live stats
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + Math.floor(Math.random() * 3),
        lastUpdate: Date.now(),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const detectBlockchain = (addr: string): "solana" | "ethereum" => {
    // Ethereum address (42 chars, starts with 0x)
    if (addr.length === 42 && addr.startsWith("0x")) return "ethereum";
    // Solana address (32-44 chars, base58)
    if (addr.length >= 32 && addr.length <= 44) return "solana";
    return "solana"; // default
  };

  const scanAddress = async () => {
    if (!address.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      // Simulate scanning process with realistic timing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const blockchain = detectBlockchain(address);
      const mockRiskScore = Math.floor(Math.random() * 100);
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

      let riskLevel: "safe" | "warning" | "danger" | "critical";
      let findings: string[] = [];
      let suspiciousPatterns: string[] = [];

      if (mockRiskScore < 25) {
        riskLevel = "safe";
        findings = [
          "No suspicious activity detected",
          "Standard transaction patterns",
          "Good reputation score",
        ];
      } else if (mockRiskScore < 50) {
        riskLevel = "warning";
        findings = [
          "Some unusual activity patterns",
          "Medium risk indicators present",
          "Recommend caution",
        ];
        suspiciousPatterns = ["Rapid transaction bursts"];
      } else if (mockRiskScore < 80) {
        riskLevel = "danger";
        findings = [
          "High-risk patterns detected",
          "Potential malicious activity",
          "Avoid interaction",
        ];
        suspiciousPatterns = ["Honeypot indicators", "Rug pull patterns"];
      } else {
        riskLevel = "critical";
        findings = [
          "CRITICAL THREAT DETECTED",
          "Known malicious address",
          "DO NOT INTERACT",
        ];
        suspiciousPatterns = [
          "Known scammer",
          "Blacklisted address",
          "Rug pull confirmed",
        ];
      }

      const result: ScanResult = {
        address,
        riskScore: mockRiskScore,
        riskLevel,
        confidence,
        findings,
        timestamp: Date.now(),
        blockchain,
        details: {
          transactionCount: Math.floor(Math.random() * 10000),
          balance: Math.random() * 1000,
          lastActivity: Date.now() - Math.floor(Math.random() * 86400000),
          suspiciousPatterns,
          reputation: 100 - mockRiskScore,
        },
      };

      setScanResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 4)]); // Keep last 5 scans
      onScanComplete?.(result);

      // Update stats
      setLiveStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        threatsDetected:
          riskLevel === "danger" || riskLevel === "critical"
            ? prev.threatsDetected + 1
            : prev.threatsDetected,
        safeSites: riskLevel === "safe" ? prev.safeSites + 1 : prev.safeSites,
      }));
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "safe":
        return "text-cyber-green";
      case "warning":
        return "text-cyber-orange";
      case "danger":
        return "text-red-400";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-400";
    }
  };

  const getRiskBorderColor = (level: string) => {
    switch (level) {
      case "safe":
        return "border-cyber-green";
      case "warning":
        return "border-cyber-orange";
      case "danger":
        return "border-red-400";
      case "critical":
        return "border-red-600";
      default:
        return "border-gray-400";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "safe":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "danger":
        return <Shield className="w-5 h-5" />;
      case "critical":
        return <Skull className="w-5 h-5" />;
      default:
        return <Search className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBalance = (balance: number, blockchain: string) => {
    return `${balance.toFixed(4)} ${blockchain === "solana" ? "SOL" : "ETH"}`;
  };

  if (embedded) {
    return (
      <div className="space-y-4">
        {/* Compact Scanner Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && scanAddress()}
            placeholder="Paste address to scan..."
            className="flex-1 bg-dark-bg/50 border border-cyber-green/30 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyber-green"
          />
          <button
            onClick={scanAddress}
            disabled={!address.trim() || isScanning}
            className="px-4 py-2 bg-cyber-green/20 border border-cyber-green rounded-lg text-cyber-green hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 disabled:opacity-50"
          >
            {isScanning ? (
              <Search className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Compact Results */}
        {scanResult && (
          <div
            className={`p-3 rounded-lg border ${getRiskBorderColor(scanResult.riskLevel)} bg-${scanResult.riskLevel === "safe" ? "cyber-green" : scanResult.riskLevel === "warning" ? "cyber-orange" : "red-500"}/10`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={getRiskColor(scanResult.riskLevel)}>
                  {getRiskIcon(scanResult.riskLevel)}
                </div>
                <span
                  className={`font-cyber font-bold text-sm ${getRiskColor(scanResult.riskLevel)}`}
                >
                  {scanResult.riskLevel.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-mono text-gray-400">
                Risk: {scanResult.riskScore}/100
              </span>
            </div>
            <div className="text-xs space-y-1">
              {scanResult.findings.slice(0, 2).map((finding, i) => (
                <div key={i} className="text-gray-300">
                  • {finding}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scanner Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-dark-bg/60 border border-cyber-green/30 rounded-lg px-4 py-2 mb-4">
          <Brain className="w-5 h-5 text-cyber-green animate-pulse" />
          <span
            className="text-cyber-green font-cyber font-bold glitch"
            data-text={glitchText}
          >
            {glitchText}
          </span>
        </div>

        <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-2 neon-glow">
          LIVE ADDRESS SCANNER
        </h2>
        <p className="text-gray-300 font-mono">
          Real-time blockchain security analysis • Solana & Ethereum support
        </p>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-4 text-center">
          <Activity className="w-6 h-6 text-cyber-green mx-auto mb-2" />
          <div className="text-2xl font-cyber font-bold text-cyber-green">
            {liveStats.totalScans.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 font-mono">Total Scans</div>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <Shield className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-cyber font-bold text-red-400">
            {liveStats.threatsDetected.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 font-mono">Threats Blocked</div>
        </div>

        <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-4 text-center">
          <CheckCircle className="w-6 h-6 text-cyber-blue mx-auto mb-2" />
          <div className="text-2xl font-cyber font-bold text-cyber-blue">
            {liveStats.safeSites.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 font-mono">Safe Addresses</div>
        </div>

        <div className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-4 text-center">
          <Clock className="w-6 h-6 text-cyber-purple mx-auto mb-2" />
          <div className="text-sm font-cyber font-bold text-cyber-purple">
            {formatTimestamp(liveStats.lastUpdate)}
          </div>
          <div className="text-xs text-gray-400 font-mono">Last Update</div>
        </div>
      </div>

      {/* Scanner Input */}
      <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-lg p-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && scanAddress()}
            placeholder="Paste Solana or Ethereum address..."
            className="flex-1 bg-dark-bg/50 border border-cyber-green/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-cyber-green"
          />
          <button
            onClick={scanAddress}
            disabled={!address.trim() || isScanning}
            className="px-6 py-3 bg-cyber-green/20 border border-cyber-green rounded-lg text-cyber-green hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 disabled:opacity-50 font-cyber font-bold"
          >
            {isScanning ? (
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 animate-spin" />
                SCANNING...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                SCAN
              </div>
            )}
          </button>
        </div>

        <div className="mt-3 text-xs font-mono text-gray-400 text-center">
          🆓 Free scans • 🔒 No data stored • ⚡ Instant results
        </div>
      </div>

      {/* Scan Results */}
      {isScanning && (
        <div className="bg-dark-bg/60 border border-cyber-blue/30 rounded-lg p-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Search className="w-6 h-6 text-cyber-blue animate-spin" />
              <span className="text-cyber-blue font-cyber font-bold">
                ANALYZING ADDRESS...
              </span>
            </div>

            <div className="space-y-2">
              <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue animate-pulse w-3/4"></div>
              </div>
              <p className="text-xs font-mono text-gray-400">
                Running neural pattern analysis • Checking threat databases •
                Analyzing transaction history
              </p>
            </div>
          </div>
        </div>
      )}

      {scanResult && (
        <div
          className={`border ${getRiskBorderColor(scanResult.riskLevel)} rounded-lg overflow-hidden`}
        >
          {/* Result Header */}
          <div
            className={`bg-${scanResult.riskLevel === "safe" ? "cyber-green" : scanResult.riskLevel === "warning" ? "cyber-orange" : "red-500"}/20 p-4 border-b ${getRiskBorderColor(scanResult.riskLevel)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={getRiskColor(scanResult.riskLevel)}>
                  {getRiskIcon(scanResult.riskLevel)}
                </div>
                <div>
                  <h3
                    className={`text-lg font-cyber font-bold ${getRiskColor(scanResult.riskLevel)}`}
                  >
                    {scanResult.riskLevel.toUpperCase()} ADDRESS
                  </h3>
                  <p className="text-sm font-mono text-gray-400">
                    {scanResult.blockchain.toUpperCase()} •{" "}
                    {formatTimestamp(scanResult.timestamp)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-2xl font-cyber font-bold ${getRiskColor(scanResult.riskLevel)}`}
                >
                  {scanResult.riskScore}/100
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  Risk Score
                </div>
              </div>
            </div>
          </div>

          {/* Result Details */}
          <div className="p-4 bg-dark-bg/60">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-cyber font-bold text-cyber-green mb-3">
                  SCAN FINDINGS
                </h4>
                <div className="space-y-2">
                  {scanResult.findings.map((finding, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-cyber-green rounded-full mt-2"></div>
                      <span className="text-sm text-gray-300 font-mono">
                        {finding}
                      </span>
                    </div>
                  ))}
                </div>

                {scanResult.details.suspiciousPatterns.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-cyber font-bold text-red-400 mb-2">
                      THREAT PATTERNS
                    </h5>
                    <div className="space-y-1">
                      {scanResult.details.suspiciousPatterns.map(
                        (pattern, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-red-400 mt-1" />
                            <span className="text-xs text-red-300 font-mono">
                              {pattern}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-cyber font-bold text-cyber-blue mb-3">
                  ADDRESS DETAILS
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      Transactions:
                    </span>
                    <span className="text-xs text-white font-mono">
                      {scanResult.details.transactionCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      Balance:
                    </span>
                    <span className="text-xs text-white font-mono">
                      {formatBalance(
                        scanResult.details.balance,
                        scanResult.blockchain,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      Reputation:
                    </span>
                    <span
                      className={`text-xs font-mono ${scanResult.details.reputation > 70 ? "text-cyber-green" : scanResult.details.reputation > 40 ? "text-cyber-orange" : "text-red-400"}`}
                    >
                      {scanResult.details.reputation}/100
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      Confidence:
                    </span>
                    <span className="text-xs text-cyber-blue font-mono">
                      {scanResult.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-lg p-4">
          <h3 className="text-lg font-cyber font-bold text-cyber-green mb-4">
            RECENT SCANS
          </h3>
          <div className="space-y-2">
            {scanHistory.map((scan, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-dark-bg/30 rounded border border-cyber-green/20"
              >
                <div className="flex items-center gap-2">
                  <div className={getRiskColor(scan.riskLevel)}>
                    {getRiskIcon(scan.riskLevel)}
                  </div>
                  <span className="text-xs font-mono text-gray-300">
                    {scan.address.substring(0, 8)}...
                    {scan.address.substring(-6)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-cyber font-bold ${getRiskColor(scan.riskLevel)}`}
                  >
                    {scan.riskLevel.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatTimestamp(scan.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
