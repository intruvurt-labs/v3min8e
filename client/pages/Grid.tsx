// ============================================================================
// UPDATED GRID.TSX - INTEGRATED ADVANCED SECURITY SCANNER
// ============================================================================

import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import {
  Search,
  Eye,
  Target,
  Zap,
  AlertTriangle,
  TrendingUp,
  Shield,
  Network,
  Brain,
  Activity,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  AlertOctagon
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { 
  useAdvancedSecurityScanner,
  SecurityCaptcha,
  AddressType,
  ThreatLevel,
  ComprehensiveScanResult
} from "@/services/AdvancedSecurityScanner";
import { validateAddress, validateUrl, sanitizeContent } from "@/utils/security";

const networks = [
  {
    id: "ethereum",
    name: "Ethereum",
    color: "cyber-blue",
    icon: "⚡",
    rpc: "https://mainnet.infura.io/v3/",
    threatLevel: "medium",
    scanTime: "4-6 min",
  },
  {
    id: "solana",
    name: "Solana", 
    color: "cyber-green",
    icon: "🟢",
    rpc: "https://api.mainnet-beta.solana.com",
    threatLevel: "high",
    scanTime: "3-5 min",
  },
  {
    id: "bnb",
    name: "BNB Chain",
    color: "cyber-orange", 
    icon: "🟡",
    rpc: "https://bsc-dataseed.binance.org/",
    threatLevel: "high",
    scanTime: "2-4 min",
  },
  {
    id: "polygon",
    name: "Polygon",
    color: "cyber-purple",
    icon: "🟣", 
    rpc: "https://polygon-rpc.com/",
    threatLevel: "medium",
    scanTime: "2-3 min",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    color: "cyber-blue",
    icon: "🔵",
    rpc: "https://arb1.arbitrum.io/rpc",
    threatLevel: "low",
    scanTime: "3-4 min",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    color: "red",
    icon: "🔴",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    threatLevel: "medium", 
    scanTime: "2-4 min",
  },
  {
    id: "base", 
    name: "Base",
    color: "cyber-blue",
    icon: "🔹",
    rpc: "https://mainnet.base.org",
    threatLevel: "low",
    scanTime: "2-3 min",
  },
  {
    id: "fantom",
    name: "Fantom",
    color: "cyan",
    icon: "💙",
    rpc: "https://rpc.ftm.tools/",
    threatLevel: "medium",
    scanTime: "2-3 min",
  },
  {
    id: "optimism",
    name: "Optimism", 
    color: "red",
    icon: "🔺",
    rpc: "https://mainnet.optimism.io",
    threatLevel: "low",
    scanTime: "3-4 min",
  },
  {
    id: "cardano",
    name: "Cardano",
    color: "cyber-blue",
    icon: "💠",
    rpc: "https://cardano-mainnet.blockfrost.io/api/v0",
    threatLevel: "very-low",
    scanTime: "4-5 min",
  },
];

export default function Grid() {
  const { walletConnected, connectWallet, walletAddress } = useWallet();
  const [scanAddress, setScanAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("solana");
  
  const {
    performScan,
    isScanning,
    scanResults,
    captchaRequired,
    handleCaptchaVerify
  } = useAdvancedSecurityScanner();

  // Core ethos and mission
  const coreEthos = "Power stays with the people. No hidden agendas. No compromise.";

  // Enhanced security scanning with comprehensive validation
  const performComprehensiveScan = async () => {
    if (!scanAddress.trim()) {
      toast.error("Enter a valid blockchain address or website URL");
      return;
    }

    // Validate input based on type
    const isUrl = validateUrl(scanAddress);
    const isValidAddress = !isUrl && validateAddress(scanAddress, selectedNetwork);

    if (!isUrl && !isValidAddress) {
      toast.error(`Invalid ${selectedNetwork} address format. Please check your input.`);
      return;
    }

    if (!walletConnected) {
      toast.error("🔐 Wallet connection required for advanced security scans");
      await connectWallet();
      return;
    }

    // Perform the comprehensive scan
    await performScan(scanAddress, selectedNetwork);
  };

  // Render threat level with appropriate styling
  const renderThreatLevel = (level: ThreatLevel) => {
    const config = {
      [ThreatLevel.CRITICAL]: { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertOctagon },
      [ThreatLevel.HIGH]: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
      [ThreatLevel.MEDIUM]: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Eye },
      [ThreatLevel.LOW]: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Shield },
      [ThreatLevel.SECURE]: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
      [ThreatLevel.ALPHA]: { color: 'text-cyber-green', bg: 'bg-cyber-green/20', icon: TrendingUp }
    };

    const { color, bg, icon: Icon } = config[level];
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`font-bold text-sm uppercase ${color}`}>{level}</span>
      </div>
    );
  };

  // Render address type badge
  const renderAddressType = (type: AddressType) => {
    const typeConfig = {
      [AddressType.WALLET_ADDRESS]: { label: 'Wallet', color: 'cyber-blue', icon: '👛' },
      [AddressType.TOKEN_CONTRACT]: { label: 'Token', color: 'cyber-green', icon: '🪙' },
      [AddressType.TOKEN_MINT]: { label: 'Token Mint', color: 'cyber-green', icon: '⚡' },
      [AddressType.LIQUIDITY_POOL]: { label: 'LP Pool', color: 'cyber-purple', icon: '🏊' },
      [AddressType.STAKING_CONTRACT]: { label: 'Staking', color: 'cyber-orange', icon: '📈' },
      [AddressType.MULTISIG_WALLET]: { label: 'Multisig', color: 'cyan', icon: '🔐' },
      [AddressType.BRIDGE_CONTRACT]: { label: 'Bridge', color: 'yellow', icon: '🌉' },
      [AddressType.LENDING_PROTOCOL]: { label: 'Lending', color: 'green', icon: '🏦' },
      [AddressType.DEX_ROUTER]: { label: 'DEX Router', color: 'red', icon: '🔀' },
      [AddressType.GOVERNANCE_CONTRACT]: { label: 'Governance', color: 'purple', icon: '🗳️' },
      [AddressType.VESTING_CONTRACT]: { label: 'Vesting', color: 'orange', icon: '⏰' },
      [AddressType.PROXY_CONTRACT]: { label: 'Proxy', color: 'gray', icon: '🔄' },
      [AddressType.FACTORY_CONTRACT]: { label: 'Factory', color: 'indigo', icon: '🏭' },
      [AddressType.ORACLE_CONTRACT]: { label: 'Oracle', color: 'teal', icon: '🔮' },
      [AddressType.UNKNOWN]: { label: 'Unknown', color: 'gray', icon: '❓' }
    };

    const config = typeConfig[type] || typeConfig[AddressType.UNKNOWN];
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-${config.color}/20`}>
        <span>{config.icon}</span>
        <span className={`font-bold text-sm text-${config.color}`}>{config.label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="high" animated={true} />
      <CyberNav />

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-7xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              NIMREV GRID
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-6">
              Advanced Blockchain Security Intelligence
            </p>
            <div className="text-cyber-orange font-mono text-lg mb-8 italic">
              "{coreEthos}"
            </div>

            {/* Wallet Connection Status */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                walletConnected 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  walletConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <span className={`font-mono font-bold ${
                  walletConnected ? 'text-green-400' : 'text-red-400'
                }`}>
                  {walletConnected ? 'WALLET CONNECTED' : 'WALLET REQUIRED'}
                </span>
                {walletConnected && (
                  <span className="text-xs text-gray-400 font-mono">
                    {walletAddress?.substring(0, 6)}...{walletAddress?.substring(-4)}
                  </span>
                )}
              </div>
              
              {!walletConnected && (
                <button
                  onClick={connectWallet}
                  className="px-4 py-2 bg-cyber-green text-black font-bold rounded hover:bg-cyber-green/80 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* Main Interface */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Advanced Scanner Interface */}
            <div className="lg:col-span-2">
              <div className="border border-cyber-green/30 p-6 bg-dark-bg/50 neon-border">
                <h3 className="text-2xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-3" />
                  ADVANCED SECURITY SCANNER
                </h3>

                {/* Network Selection */}
                <div className="mb-6">
                  <label className="block text-cyber-blue font-mono font-bold mb-3">
                    SELECT BLOCKCHAIN NETWORK
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {networks.map((network) => (
                      <button
                        key={network.id}
                        onClick={() => setSelectedNetwork(network.id)}
                        className={`p-3 border-2 rounded-lg font-mono transition-all relative group ${
                          selectedNetwork === network.id
                            ? `border-${network.color} bg-${network.color}/20 text-${network.color}`
                            : "border-gray-600 text-gray-400 hover:border-gray-500"
                        }`}
                        title={`${network.name} - Threat Level: ${network.threatLevel.toUpperCase()}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-lg mb-1">{network.icon}</span>
                          <span className="text-xs text-center">{network.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address Input */}
                <div className="mb-6">
                  <label className="block text-cyber-blue font-mono font-bold mb-3">
                    ADDRESS / URL TO ANALYZE
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={scanAddress}
                      onChange={(e) => setScanAddress(e.target.value)}
                      placeholder="Enter contract address, token mint, wallet address, or website URL..."
                      className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-foreground font-mono focus:border-cyber-green focus:outline-none"
                      disabled={isScanning}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    Supports: Token contracts, LP pools, staking addresses, wallets, and websites
                  </p>
                </div>

                {/* CAPTCHA Section */}
                {captchaRequired && (
                  <div className="mb-6">
                    <SecurityCaptcha 
                      onVerify={handleCaptchaVerify}
                      difficulty="medium"
                    />
                  </div>
                )}

                {/* Scan Button */}
                <button
                  onClick={performComprehensiveScan}
                  disabled={isScanning || !scanAddress.trim() || !walletConnected}
                  className={`w-full py-4 rounded-lg font-cyber font-bold text-lg transition-all ${
                    isScanning || !walletConnected
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyber-green to-cyber-blue hover:from-cyber-blue hover:to-cyber-green text-white neon-glow"
                  }`}
                >
                  {isScanning ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                      DEEP SCANNING IN PROGRESS...
                    </div>
                  ) : !walletConnected ? (
                    <>
                      <Lock className="inline w-6 h-6 mr-3" />
                      CONNECT WALLET TO SCAN
                    </>
                  ) : (
                    <>
                      <Eye className="inline w-6 h-6 mr-3" />
                      INITIATE COMPREHENSIVE SCAN
                    </>
                  )}
                </button>

                {/* Comprehensive Scan Results */}
                {scanResults && (
                  <div className="mt-8 space-y-6">
                    {/* Header */}
                    <div className="border-t border-cyber-green/30 pt-6">
                      <h3 className="text-2xl font-cyber font-bold text-cyber-green mb-4">
                        COMPREHENSIVE ANALYSIS REPORT
                      </h3>
                      
                      {/* Basic Info */}
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-cyber-green/10 border border-cyber-green/30 rounded">
                          <div className="mb-2">{renderAddressType(scanResults.addressType)}</div>
                          <div className="text-sm text-gray-400">Address Type</div>
                        </div>
                        <div className="text-center p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded">
                          <div className="mb-2">{renderThreatLevel(scanResults.securityAnalysis.overallThreatLevel)}</div>
                          <div className="text-sm text-gray-400">Threat Level</div>
                        </div>
                        <div className="text-center p-4 bg-cyber-orange/10 border border-cyber-orange/30 rounded">
                          <div className="text-2xl font-cyber font-bold text-cyber-orange">
                            {scanResults.securityAnalysis.threatScore}/100
                          </div>
                          <div className="text-sm text-gray-400">Risk Score</div>
                        </div>
                      </div>

                      {/* Risk Factors */}
                      {scanResults.securityAnalysis.riskFactors.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            DETECTED RISK FACTORS
                          </h4>
                          <div className="space-y-3">
                            {scanResults.securityAnalysis.riskFactors.map((risk, index) => (
                              <div 
                                key={index}
                                className={`p-4 rounded-lg border-l-4 ${
                                  risk.severity === ThreatLevel.CRITICAL 
                                    ? 'border-red-500 bg-red-500/10' 
                                    : risk.severity === ThreatLevel.HIGH
                                    ? 'border-orange-500 bg-orange-500/10'
                                    : 'border-yellow-500 bg-yellow-500/10'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-bold text-white capitalize">
                                    {risk.type.replace('_', ' ')} Risk
                                  </h5>
                                  <div className="text-xs bg-gray-800 px-2 py-1 rounded">
                                    {risk.confidence}% confidence
                                  </div>
                                </div>
                                <p className="text-gray-300 text-sm mb-3">
                                  {sanitizeContent(risk.description)}
                                </p>
                                {risk.evidence.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-bold text-gray-400 mb-1">Evidence:</p>
                                    <ul className="text-xs text-gray-400 space-y-1">
                                      {risk.evidence.map((evidence, i) => (
                                        <li key={i}>• {sanitizeContent(evidence)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {risk.mitigation && (
                                  <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs">
                                    <strong>Mitigation:</strong> {sanitizeContent(risk.mitigation)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alpha Signals (if any) */}
                      {scanResults.intelligenceData?.alphaSignals?.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-cyber-green mb-3 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            ALPHA SIGNALS DETECTED
                          </h4>
                          <div className="space-y-3">
                            {scanResults.intelligenceData.alphaSignals.map((signal, index) => (
                              <div 
                                key={index}
                                className="p-4 rounded-lg bg-cyber-green/10 border border-cyber-green/30"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-bold text-cyber-green capitalize">
                                    {signal.signalType.replace('_', ' ')}
                                  </h5>
                                  <div className="text-xs bg-cyber-green/20 px-2 py-1 rounded">
                                    {signal.strength}/100 strength
                                  </div>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {sanitizeContent(signal.description)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scan Metadata */}
                      <div className="mt-6 p-4 bg-gray-800/50 border border-gray-600 rounded-lg">
                        <h4 className="font-cyber font-bold text-cyber-green mb-3">
                          🔒 TRANSPARENCY LEDGER
                        </h4>
                        <div className="text-xs font-mono text-gray-400 space-y-1">
                          <div>Scan ID: {scanResults.scanId}</div>
                          <div>Network: {scanResults.network.toUpperCase()}</div>
                          <div>Timestamp: {new Date(scanResults.scanTimestamp).toLocaleString()}</div>
                          <div>Confidence: {scanResults.securityAnalysis.confidence}%</div>
                          <div className="text-cyber-green mt-2">
                            ✓ Analysis Complete - Cryptographically Signed
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Intelligence Panel */}
            <div className="lg:col-span-1">
              <div className="border border-cyber-purple/30 p-6 bg-dark-bg/50 h-fit">
                <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  INTELLIGENCE CENTER
                </h3>

                <div className="space-y-4 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Networks Covered:</span>
                    <span className="text-cyber-green">10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address Types:</span>
                    <span className="text-cyber-blue">15+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Factors:</span>
                    <span className="text-red-400">50+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Alpha Detection:</span>
                    <span className="text-cyber-green">Advanced</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wallet Required:</span>
                    <span className="text-cyber-orange">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate Limiting:</span>
                    <span className="text-cyan-400">Active</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                  <h4 className="font-bold text-cyber-green mb-2">🛡️ Security Features</h4>
                  <ul className="text-xs space-y-1 text-gray-300">
                    <li>• Honeypot Detection</li>
                    <li>• Rug Pull Analysis</li>
                    <li>• Fake Token ID</li>
                    <li>• Liquidity Analysis</li>
                    <li>• Smart Contract Audit</li>
                    <li>• Social Sentiment</li>
                    <li>• Whale Activity</li>
                    <li>• Alpha Signal Detection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CyberFooter />
    </div>
  );
}
