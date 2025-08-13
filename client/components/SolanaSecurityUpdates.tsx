import { useEffect, useState } from "react";
import { Shield, AlertTriangle, ExternalLink, Clock, Zap } from "lucide-react";

interface SecurityUpdate {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  type: "vulnerability" | "patch" | "advisory" | "enhancement";
  date: string;
  source: string;
  link?: string;
  affected?: string[];
}

interface SolanaSecurityUpdatesProps {
  className?: string;
  compact?: boolean;
}

export default function SolanaSecurityUpdates({
  className = "",
  compact = false,
}: SolanaSecurityUpdatesProps) {
  const [updates, setUpdates] = useState<SecurityUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock security updates - in real app, this would fetch from Solana's security feeds
  const mockUpdates: SecurityUpdate[] = [
    {
      id: "1",
      title: "Solana Validator Security Patch v1.16.15",
      description:
        "Critical security update addressing potential RPC vulnerabilities and consensus improvements.",
      severity: "critical",
      type: "patch",
      date: "2024-01-15",
      source: "Solana Labs",
      link: "https://github.com/solana-labs/solana/releases",
      affected: ["Validators", "RPC Nodes"],
    },
    {
      id: "2",
      title: "DeFi Protocol Security Advisory",
      description:
        "New attack vectors identified in token-2022 programs. Developers should review implementation.",
      severity: "high",
      type: "advisory",
      date: "2024-01-12",
      source: "Solana Security Working Group",
      affected: ["DeFi Protocols", "Token Programs"],
    },
    {
      id: "3",
      title: "Wallet Integration Best Practices",
      description:
        "Updated security guidelines for wallet integrations following recent phishing attempts.",
      severity: "medium",
      type: "enhancement",
      date: "2024-01-10",
      source: "Solana Foundation",
      affected: ["Wallet Providers", "dApps"],
    },
    {
      id: "4",
      title: "MEV Bot Detection Improvements",
      description:
        "Enhanced detection patterns for malicious MEV activities and sandwich attacks.",
      severity: "medium",
      type: "enhancement",
      date: "2024-01-08",
      source: "NimRev Protocol",
      affected: ["DEX Users", "Traders"],
    },
    {
      id: "5",
      title: "Network Upgrade Security Analysis",
      description:
        "Comprehensive security review of upcoming Solana network features and potential impacts.",
      severity: "low",
      type: "advisory",
      date: "2024-01-05",
      source: "Solana Labs",
      affected: ["All Users"],
    },
  ];

  useEffect(() => {
    const fetchSecurityUpdates = async () => {
      setIsLoading(true);

      try {
        // Simulate API call - in real app, fetch from multiple sources:
        // - Solana Labs GitHub releases
        // - Solana Foundation security advisories
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

    // Refresh every 15 minutes
    const interval = setInterval(fetchSecurityUpdates, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  if (compact) {
    return (
      <div
        className={`border border-cyber-blue/30 bg-cyber-blue/5 rounded-lg ${className}`}
      >
        <div className="p-4 border-b border-cyber-blue/20">
          <div className="flex items-center justify-between">
            <h3 className="text-cyber-blue font-mono font-bold text-sm flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              SOLANA SECURITY
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
            updates.slice(0, 3).map((update) => (
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
            <Shield className="w-6 h-6 mr-3" />
            SOLANA SECURITY UPDATES
          </h2>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <p className="text-cyber-blue/80 font-mono text-sm">
          Real-time security advisories, patches, and threat intelligence for
          the Solana ecosystem
        </p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-cyber-blue">Loading security updates...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className={`p-4 border rounded-lg ${getSeverityColor(update.severity)} hover:border-opacity-60 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(update.severity)}
                    <div>
                      <span className="font-mono font-bold text-sm uppercase">
                        {update.severity}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTypeIcon(update.type)}
                        <span className="text-xs font-mono opacity-80">
                          {update.type}
                        </span>
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
