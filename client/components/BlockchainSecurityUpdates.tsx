import { useEffect, useState } from "react";
import {
  Shield,
  AlertTriangle,
  ExternalLink,
  Clock,
  Zap,
  Network,
  Globe,
} from "lucide-react";

interface SecurityUpdate {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  type: "vulnerability" | "patch" | "advisory" | "enhancement";
  date: string;
  source: string;
  network:
    | "solana"
    | "ethereum"
    | "polygon"
    | "arbitrum"
    | "optimism"
    | "base"
    | "avalanche"
    | "bsc"
    | "fantom"
    | "multi-chain";
  link?: string;
  affected?: string[];
  cve?: string;
}

interface BlockchainSecurityUpdatesProps {
  className?: string;
  compact?: boolean;
  networks?: string[];
}

export default function BlockchainSecurityUpdates({
  className = "",
  compact = false,
  networks = ["solana", "ethereum", "polygon", "arbitrum", "optimism", "base"],
}: BlockchainSecurityUpdatesProps) {
  const [updates, setUpdates] = useState<SecurityUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");

  // Comprehensive security updates for multiple blockchain networks
  const mockUpdates: SecurityUpdate[] = [
    // Solana Updates
    {
      id: "sol-1",
      title: "Solana Validator Security Patch v1.18.22",
      description:
        "Critical security update addressing potential RPC vulnerabilities and consensus improvements for Q1 2025.",
      severity: "critical",
      type: "patch",
      date: "2025-01-15",
      source: "Solana Labs",
      network: "solana",
      link: "https://github.com/solana-labs/solana/releases",
      affected: ["Validators", "RPC Nodes"],
      cve: "CVE-2025-0001",
    },
    {
      id: "sol-2",
      title: "Token Extensions Program Security Advisory",
      description:
        "New attack vectors identified in Token Extensions programs. Developers should review implementation immediately.",
      severity: "high",
      type: "advisory",
      date: "2025-01-12",
      source: "Solana Security Working Group",
      network: "solana",
      affected: ["DeFi Protocols", "Token Programs"],
    },

    // Ethereum Updates
    {
      id: "eth-1",
      title: "Ethereum Cancun-Deneb Post-Upgrade Security Review",
      description:
        "Security analysis reveals potential validator MEV extraction vulnerabilities in proto-danksharding implementation.",
      severity: "high",
      type: "advisory",
      date: "2025-01-14",
      source: "Ethereum Foundation",
      network: "ethereum",
      affected: ["Validators", "Staking Protocols"],
      cve: "CVE-2025-0002",
    },
    {
      id: "eth-2",
      title: "ERC-4337 Account Abstraction Vulnerability",
      description:
        "Critical vulnerability in Account Abstraction implementations allowing unauthorized access. Immediate patches required.",
      severity: "critical",
      type: "vulnerability",
      date: "2025-01-13",
      source: "OpenZeppelin",
      network: "ethereum",
      link: "https://blog.openzeppelin.com/security-advisory",
      affected: ["Smart Wallets", "AA Implementations"],
    },

    // Polygon Updates
    {
      id: "pol-1",
      title: "Polygon zkEVM Security Enhancement",
      description:
        "Updated security measures for Polygon zkEVM following recent state transition vulnerabilities.",
      severity: "medium",
      type: "enhancement",
      date: "2025-01-11",
      source: "Polygon Technology",
      network: "polygon",
      affected: ["zkEVM Users", "Cross-chain Apps"],
    },

    // Arbitrum Updates
    {
      id: "arb-1",
      title: "Arbitrum Stylus Execution Environment Security",
      description:
        "Critical vulnerability in Stylus WASM execution environment. Immediate upgrade required for all validators.",
      severity: "critical",
      type: "vulnerability",
      date: "2025-01-10",
      source: "Arbitrum Foundation",
      network: "arbitrum",
      affected: ["Validators", "Stylus Contracts"],
      cve: "CVE-2025-0003",
    },

    // Base Updates
    {
      id: "base-1",
      title: "Base Superchain Interoperability Security",
      description:
        "Enhanced security protocols for Superchain interoperability and cross-chain messaging.",
      severity: "medium",
      type: "enhancement",
      date: "2025-01-09",
      source: "Coinbase",
      network: "base",
      affected: ["Cross-chain Apps", "Superchain Users"],
    },

    // Multi-chain Updates
    {
      id: "multi-1",
      title: "Intent-Based Bridge Security Framework",
      description:
        "Comprehensive security framework for intent-based cross-chain protocols and MEV protection strategies.",
      severity: "high",
      type: "advisory",
      date: "2025-01-08",
      source: "NimRev Protocol",
      network: "multi-chain",
      affected: ["Intent Solvers", "Cross-chain DeFi"],
    },

    // Optimism Updates
    {
      id: "opt-1",
      title: "Optimism Superchain Fault Proof Security Analysis",
      description:
        "Security review of new Superchain fault proof system and potential attack vectors in multi-chain environment.",
      severity: "medium",
      type: "advisory",
      date: "2025-01-07",
      source: "Optimism Foundation",
      network: "optimism",
      affected: ["Superchain Validators", "L2 Users"],
    },
  ];

  useEffect(() => {
    const fetchSecurityUpdates = async () => {
      setIsLoading(true);

      try {
        // Simulate API call - in real app, fetch from multiple sources:
        // - Each network's official security feeds
        // - CVE databases
        // - Security research platforms
        // - NimRev's own threat intelligence
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setUpdates(mockUpdates);
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Failed to fetch security updates:", error);
        setUpdates(mockUpdates); // Fallback to mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityUpdates();

    // Refresh every 10 minutes for security updates
    const interval = setInterval(fetchSecurityUpdates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getNetworkColor = (network: string) => {
    switch (network) {
      case "solana":
        return "text-cyber-purple border-cyber-purple/30 bg-cyber-purple/10";
      case "ethereum":
        return "text-blue-400 border-blue-400/30 bg-blue-400/10";
      case "polygon":
        return "text-purple-400 border-purple-400/30 bg-purple-400/10";
      case "arbitrum":
        return "text-cyan-400 border-cyan-400/30 bg-cyan-400/10";
      case "optimism":
        return "text-red-400 border-red-400/30 bg-red-400/10";
      case "base":
        return "text-blue-500 border-blue-500/30 bg-blue-500/10";
      case "avalanche":
        return "text-red-500 border-red-500/30 bg-red-500/10";
      case "bsc":
        return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
      case "fantom":
        return "text-blue-300 border-blue-300/30 bg-blue-300/10";
      case "multi-chain":
        return "text-cyber-green border-cyber-green/30 bg-cyber-green/10";
      default:
        return "text-gray-400 border-gray-400/30 bg-gray-400/10";
    }
  };

  const getNetworkIcon = (network: string) => {
    switch (network) {
      case "solana":
        return "◎";
      case "ethereum":
        return "Ξ";
      case "polygon":
        return "⬟";
      case "arbitrum":
        return "🔵";
      case "optimism":
        return "🔴";
      case "base":
        return "🟦";
      case "avalanche":
        return "🔺";
      case "bsc":
        return "🟡";
      case "fantom":
        return "👻";
      case "multi-chain":
        return "🌐";
      default:
        return "⚡";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400 border-red-400/30 bg-red-400/5";
      case "high":
        return "text-cyber-orange border-cyber-orange/30 bg-cyber-orange/5";
      case "medium":
        return "text-cyber-blue border-cyber-blue/30 bg-cyber-blue/5";
      case "low":
        return "text-cyber-green border-cyber-green/30 bg-cyber-green/5";
      default:
        return "text-gray-400 border-gray-600/30 bg-gray-600/5";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Shield className="w-4 h-4" />;
      case "low":
        return <Shield className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "patch":
        return <Zap className="w-3 h-3" />;
      case "vulnerability":
        return <AlertTriangle className="w-3 h-3" />;
      case "advisory":
        return <Shield className="w-3 h-3" />;
      case "enhancement":
        return <Shield className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  const filteredUpdates =
    selectedNetwork === "all"
      ? updates
      : updates.filter((update) => update.network === selectedNetwork);

  const networkOptions = [
    { id: "all", name: "All Networks", icon: "🌐" },
    { id: "solana", name: "Solana", icon: "◎" },
    { id: "ethereum", name: "Ethereum", icon: "Ξ" },
    { id: "polygon", name: "Polygon", icon: "⬟" },
    { id: "arbitrum", name: "Arbitrum", icon: "🔵" },
    { id: "optimism", name: "Optimism", icon: "🔴" },
    { id: "base", name: "Base", icon: "🟦" },
  ];

  if (compact) {
    return (
      <div
        className={`border border-cyber-blue/30 bg-cyber-blue/5 rounded-lg ${className}`}
      >
        <div className="p-4 border-b border-cyber-blue/20">
          <div className="flex items-center justify-between">
            <h3 className="text-cyber-blue font-mono font-bold text-sm flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              BLOCKCHAIN SECURITY
            </h3>
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-cyber-blue text-xs">
                Loading updates...
              </span>
            </div>
          ) : (
            filteredUpdates.slice(0, 4).map((update) => (
              <div
                key={update.id}
                className={`p-3 border rounded ${getSeverityColor(update.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(update.severity)}
                    <span className="font-mono font-bold text-xs uppercase">
                      {update.severity}
                    </span>
                    <span className="text-xs">
                      {getNetworkIcon(update.network)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{update.date}</span>
                </div>
                <h4 className="font-mono font-bold text-sm mb-1">
                  {update.title}
                </h4>
                <p className="text-xs text-gray-300 mb-2">
                  {update.description}
                </p>
                {update.link && (
                  <a
                    href={update.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-cyber-green hover:text-cyber-blue transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Details
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border border-cyber-blue/30 bg-cyber-blue/5 rounded-lg ${className}`}
    >
      <div className="p-6 border-b border-cyber-blue/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-cyber font-bold text-cyber-blue flex items-center">
            <Globe className="w-6 h-6 mr-3" />
            BLOCKCHAIN SECURITY INTELLIGENCE
          </h2>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <p className="text-cyber-blue/80 font-mono text-sm mb-4">
          Multi-chain security monitoring, threat detection, and vulnerability
          intelligence
        </p>

        {/* Network Filter */}
        <div className="flex flex-wrap gap-2">
          {networkOptions.map((network) => (
            <button
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={`px-3 py-1 border rounded text-xs font-mono transition-all duration-300 ${
                selectedNetwork === network.id
                  ? "border-cyber-green bg-cyber-green/20 text-cyber-green"
                  : "border-gray-600/30 text-gray-400 hover:border-cyber-blue/50 hover:text-cyber-blue"
              }`}
            >
              <span className="mr-1">{network.icon}</span>
              {network.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-cyber-blue">Loading security updates...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUpdates.map((update) => (
              <div
                key={update.id}
                className={`p-4 border rounded-lg ${getSeverityColor(update.severity)} hover:border-opacity-60 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(update.severity)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm uppercase">
                          {update.severity}
                        </span>
                        <div
                          className={`px-2 py-1 rounded text-xs font-mono ${getNetworkColor(update.network)}`}
                        >
                          <span className="mr-1">
                            {getNetworkIcon(update.network)}
                          </span>
                          {update.network.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTypeIcon(update.type)}
                        <span className="text-xs font-mono opacity-80">
                          {update.type}
                        </span>
                        {update.cve && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono">
                            {update.cve}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{update.date}</div>
                    <div className="text-xs text-gray-500">{update.source}</div>
                  </div>
                </div>

                <h3 className="font-mono font-bold text-lg mb-2">
                  {update.title}
                </h3>
                <p className="text-gray-300 font-mono text-sm mb-3 leading-relaxed">
                  {update.description}
                </p>

                {update.affected && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">
                      Affected Components:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {update.affected.map((component, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple text-xs font-mono rounded"
                        >
                          {component}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-xs text-gray-400">
                      Source:{" "}
                      <span className="text-cyber-green">{update.source}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Network:{" "}
                      <span
                        className={
                          getNetworkColor(update.network).split(" ")[0]
                        }
                      >
                        {update.network.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {update.link && (
                    <a
                      href={update.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 transition-all duration-300 rounded text-sm font-mono"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
