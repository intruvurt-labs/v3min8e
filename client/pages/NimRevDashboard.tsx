import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Search,
  TrendingDown,
  TrendingUp,
  Clock,
  Globe,
  Zap,
  Target,
  Database,
  GitBranch,
} from "lucide-react";
import { LiveThreatFeed } from "../components/LiveThreatFeed";
import { RiskHeatmap } from "../components/RiskHeatmap";
import { AddressWatchlist } from "../components/AddressWatchlist";
import { TransparencyLog } from "../components/TransparencyLog";
import { ScannerStats } from "../components/ScannerStats";

interface DashboardStats {
  totalScans: number;
  highRiskDetected: number;
  activeWatches: number;
  threatsBlocked: number;
  lastUpdateTime: string;
}

interface QuickScanResult {
  address: string;
  blockchain: string;
  riskScore: number;
  threatCategories: string[];
  scanTime: number;
}

export default function NimRevDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scanAddress, setScanAddress] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QuickScanResult | null>(null);
  const [selectedBlockchain, setSelectedBlockchain] = useState("ethereum");

  useEffect(() => {
    loadDashboardStats();
    const interval = setInterval(loadDashboardStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/nimrev/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  };

  const handleQuickScan = async () => {
    if (!scanAddress.trim()) return;

    setScanning(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/nimrev/quick-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: scanAddress,
          blockchain: selectedBlockchain,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScanResult(result);
      } else {
        throw new Error("Scan failed");
      }
    } catch (error) {
      console.error("Quick scan failed:", error);
      // Show error state
    } finally {
      setScanning(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-red-500";
    if (score <= 60) return "text-yellow-500";
    if (score <= 70) return "text-blue-500";
    return "text-green-500";
  };

  const getRiskBadgeVariant = (
    score: number,
  ): "destructive" | "secondary" | "default" | "outline" => {
    if (score <= 30) return "destructive";
    if (score <= 60) return "secondary";
    if (score <= 70) return "outline";
    return "default";
  };

  const getRiskLabel = (score: number) => {
    if (score <= 30) return "HIGH RISK";
    if (score <= 60) return "MEDIUM RISK";
    if (score <= 70) return "LOW RISK";
    return "ALPHA";
  };

  return (
    <div className="min-h-screen bg-darker-bg">
      {/* Header */}
      <div className="border-b border-cyber-grid bg-dark-bg/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl font-bold text-cyber-green glitch"
                data-text="NimRev Scanner"
              >
                NimRev Scanner
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time blockchain threat intelligence & security analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className="border-cyber-green text-cyber-green"
              >
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
              <Badge
                variant="outline"
                className="border-cyber-blue text-cyber-blue"
              >
                8 Chains Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-cyber-grid bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Scans
                </CardTitle>
                <Database className="h-4 w-4 text-cyber-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyber-blue">
                  {stats.totalScans.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">24h period</p>
              </CardContent>
            </Card>

            <Card className="border-cyber-grid bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  High Risk Detected
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {stats.highRiskDetected}
                </div>
                <p className="text-xs text-muted-foreground">Threats blocked</p>
              </CardContent>
            </Card>

            <Card className="border-cyber-grid bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Watches
                </CardTitle>
                <Eye className="h-4 w-4 text-cyber-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyber-green">
                  {stats.activeWatches}
                </div>
                <p className="text-xs text-muted-foreground">
                  Addresses monitored
                </p>
              </CardContent>
            </Card>

            <Card className="border-cyber-grid bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <Target className="h-4 w-4 text-cyber-orange" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyber-orange">
                  99.7%
                </div>
                <p className="text-xs text-muted-foreground">Accuracy rate</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Scan */}
        <Card className="border-cyber-grid bg-card/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-cyber-green">
              <Search className="w-5 h-5 mr-2" />
              Quick Threat Scan
            </CardTitle>
            <CardDescription>
              Instantly analyze any token address for security threats across
              multiple blockchains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter token address (0x... or base58)"
                    value={scanAddress}
                    onChange={(e) => setScanAddress(e.target.value)}
                    className="border-cyber-grid bg-input/50"
                  />
                </div>
                <select
                  value={selectedBlockchain}
                  onChange={(e) => setSelectedBlockchain(e.target.value)}
                  className="px-3 py-2 border border-cyber-grid bg-input/50 rounded-md text-foreground"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="solana">Solana</option>
                  <option value="base">Base</option>
                  <option value="blast">Blast</option>
                  <option value="polygon">Polygon</option>
                  <option value="avalanche">Avalanche</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="optimism">Optimism</option>
                </select>
                <Button
                  onClick={handleQuickScan}
                  disabled={scanning || !scanAddress.trim()}
                  className="bg-cyber-green hover:bg-cyber-green/80 text-dark-bg"
                >
                  {scanning ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Scan
                    </>
                  )}
                </Button>
              </div>

              {scanResult && (
                <Alert className="border-cyber-grid bg-card/30">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {scanResult.address.substring(0, 10)}...
                          {scanResult.address.substring(
                            scanResult.address.length - 8,
                          )}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({scanResult.blockchain})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={getRiskBadgeVariant(scanResult.riskScore)}
                        >
                          {getRiskLabel(scanResult.riskScore)}
                        </Badge>
                        <span
                          className={`font-bold ${getRiskColor(scanResult.riskScore)}`}
                        >
                          {scanResult.riskScore}/100
                        </span>
                      </div>
                    </div>
                    {scanResult.threatCategories.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">
                          Threats:{" "}
                        </span>
                        {scanResult.threatCategories.map((threat, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-1 text-xs"
                          >
                            {threat}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Scan completed in {scanResult.scanTime}ms
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="live-feed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card/50 border border-cyber-grid">
            <TabsTrigger
              value="live-feed"
              className="data-[state=active]:bg-cyber-green data-[state=active]:text-dark-bg"
            >
              <Activity className="w-4 h-4 mr-2" />
              Live Feed
            </TabsTrigger>
            <TabsTrigger
              value="heatmap"
              className="data-[state=active]:bg-cyber-green data-[state=active]:text-dark-bg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Risk Heatmap
            </TabsTrigger>
            <TabsTrigger
              value="watchlist"
              className="data-[state=active]:bg-cyber-green data-[state=active]:text-dark-bg"
            >
              <Eye className="w-4 h-4 mr-2" />
              Watchlist
            </TabsTrigger>
            <TabsTrigger
              value="transparency"
              className="data-[state=active]:bg-cyber-green data-[state=active]:text-dark-bg"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Transparency
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-cyber-green data-[state=active]:text-dark-bg"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-feed">
            <LiveThreatFeed />
          </TabsContent>

          <TabsContent value="heatmap">
            <RiskHeatmap />
          </TabsContent>

          <TabsContent value="watchlist">
            <AddressWatchlist />
          </TabsContent>

          <TabsContent value="transparency">
            <TransparencyLog />
          </TabsContent>

          <TabsContent value="analytics">
            <ScannerStats />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-cyber-grid bg-dark-bg/50 backdrop-blur mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-cyber-green mb-4">
                NimRev Scanner
              </h3>
              <p className="text-sm text-muted-foreground">
                Decentralized blockchain threat intelligence. Power stays with
                the people. No hidden agendas. No compromise.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-cyber-blue mb-4">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Real-time threat detection</li>
                <li>• Cross-chain analysis</li>
                <li>• Social footprint scanning</li>
                <li>• Community-driven scoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyber-orange mb-4">
                Blockchain Coverage
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "Ethereum",
                  "Solana",
                  "Base",
                  "Blast",
                  "Polygon",
                  "Avalanche",
                  "Arbitrum",
                  "Optimism",
                ].map((chain) => (
                  <Badge key={chain} variant="outline" className="text-xs">
                    {chain}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-cyber-grid mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 NimRev Scanner. Powered by blockchain transparency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
