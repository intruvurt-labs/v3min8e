import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  AlertTriangle,
  Activity,
  Clock,
  Globe,
  ExternalLink,
  RefreshCw,
  TrendingDown,
} from "lucide-react";

interface ThreatFeedItem {
  id: string;
  token_address: string;
  blockchain: string;
  token_symbol?: string;
  risk_score: number;
  threat_categories: string[];
  created_at: string;
  alert_count: number;
}

export function LiveThreatFeed() {
  const [threats, setThreats] = useState<ThreatFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadThreats();

    if (autoRefresh) {
      const interval = setInterval(loadThreats, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadThreats = async () => {
    try {
      const response = await fetch("/api/nimrev/live-threats");
      if (response.ok) {
        const data = await response.json();
        setThreats(data);
      }
    } catch (error) {
      console.error("Failed to load threats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-red-500 border-red-500/50";
    if (score <= 60) return "text-yellow-500 border-yellow-500/50";
    if (score <= 70) return "text-blue-500 border-blue-500/50";
    return "text-green-500 border-green-500/50";
  };

  const getRiskBadgeVariant = (
    score: number,
  ): "destructive" | "secondary" | "default" | "outline" => {
    if (score <= 30) return "destructive";
    if (score <= 60) return "secondary";
    if (score <= 70) return "outline";
    return "default";
  };

  const formatThreatCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      honeypot: "🍯 Honeypot",
      rug_pull: "🪤 Rug Pull",
      high_fees: "💸 High Fees",
      mint_authority: "🪙 Mint Authority",
      social_red_flag: "📱 Social Red Flag",
      liquidity_drain: "💧 Liquidity Drain",
      cross_chain_scam: "🌐 Cross-Chain Scam",
    };
    return categoryMap[category] || category;
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Card className="border-cyber-grid bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center text-cyber-green">
            <Activity className="w-5 h-5 mr-2" />
            Live Threat Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Activity className="w-8 h-8 animate-spin text-cyber-green" />
            <span className="ml-2 text-muted-foreground">
              Loading threats...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyber-grid bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-cyber-green">
              <Activity className="w-5 h-5 mr-2" />
              Live Threat Feed
              <Badge
                variant="outline"
                className="ml-2 border-red-500 text-red-500"
              >
                {threats.length} Active
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time detection of high-risk tokens and security threats
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={
                autoRefresh ? "border-cyber-green text-cyber-green" : ""
              }
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`}
              />
              Auto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadThreats}
              className="border-cyber-blue text-cyber-blue"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {threats.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="w-12 h-12 mx-auto text-cyber-green mb-4" />
            <h3 className="text-lg font-semibold text-cyber-green mb-2">
              All Clear!
            </h3>
            <p className="text-muted-foreground">
              No high-risk threats detected in the last 24 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className={`border rounded-lg p-4 bg-card/30 backdrop-blur transition-all hover:bg-card/50 ${getRiskColor(threat.risk_score)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-foreground">
                        {threat.token_symbol || "Unknown Token"}
                      </h4>
                      <Badge variant={getRiskBadgeVariant(threat.risk_score)}>
                        Risk: {threat.risk_score}/100
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-cyber-blue text-cyber-blue"
                      >
                        {threat.blockchain}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <code
                        className="text-sm bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80"
                        onClick={() => copyToClipboard(threat.token_address)}
                        title="Click to copy"
                      >
                        {threat.token_address.substring(0, 8)}...
                        {threat.token_address.substring(
                          threat.token_address.length - 6,
                        )}
                      </code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>

                    {threat.threat_categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {threat.threat_categories
                          .slice(0, 3)
                          .map((category, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {formatThreatCategory(category)}
                            </Badge>
                          ))}
                        {threat.threat_categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{threat.threat_categories.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {getTimeAgo(threat.created_at)}
                      {threat.alert_count > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {threat.alert_count} alerts sent
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${getRiskColor(threat.risk_score).split(" ")[0]}`}
                    >
                      {threat.risk_score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Risk Score
                    </div>
                  </div>
                </div>

                {threat.risk_score <= 30 && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                    <div className="flex items-center text-red-400">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="font-semibold">HIGH RISK DETECTED</span>
                    </div>
                    <p className="text-red-300 text-xs mt-1">
                      This token shows critical security vulnerabilities. Avoid
                      interaction.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
