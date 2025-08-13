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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Globe,
  Database,
  Users,
} from "lucide-react";

interface ScannerMetrics {
  totalScans: number;
  scansToday: number;
  averageRiskScore: number;
  threatsDetected: number;
  accuracyRate: number;
  averageScanTime: number;
  activeMonitors: number;
  blockchainsSupported: number;
}

interface BlockchainStats {
  blockchain: string;
  scans: number;
  threats: number;
  averageRisk: number;
  performance: number;
}

interface ThreatTypeStats {
  type: string;
  count: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  status: "good" | "warning" | "critical";
  description: string;
}

export function ScannerStats() {
  const [metrics, setMetrics] = useState<ScannerMetrics | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats[]>([]);
  const [threatStats, setThreatStats] = useState<ThreatTypeStats[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

  useEffect(() => {
    loadMetrics();
    loadBlockchainStats();
    loadThreatStats();
    loadPerformanceMetrics();
  }, [selectedTimeframe]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(
        `/api/nimrev/metrics?timeframe=${selectedTimeframe}`,
      );
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  const loadBlockchainStats = async () => {
    try {
      const response = await fetch(
        `/api/nimrev/blockchain-stats?timeframe=${selectedTimeframe}`,
      );
      if (response.ok) {
        const data = await response.json();
        setBlockchainStats(data);
      }
    } catch (error) {
      console.error("Failed to load blockchain stats:", error);
    }
  };

  const loadThreatStats = async () => {
    try {
      const response = await fetch(
        `/api/nimrev/threat-stats?timeframe=${selectedTimeframe}`,
      );
      if (response.ok) {
        const data = await response.json();
        setThreatStats(data);
      }
    } catch (error) {
      console.error("Failed to load threat stats:", error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await fetch("/api/nimrev/performance-metrics");
      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load performance metrics:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "📈";
      case "down":
        return "📉";
      default:
        return "➡️";
    }
  };

  // Mock data for demonstration
  const mockMetrics: ScannerMetrics = {
    totalScans: 12847,
    scansToday: 234,
    averageRiskScore: 67.3,
    threatsDetected: 89,
    accuracyRate: 99.7,
    averageScanTime: 1250,
    activeMonitors: 1456,
    blockchainsSupported: 8,
  };

  const mockBlockchainStats: BlockchainStats[] = [
    {
      blockchain: "ethereum",
      scans: 4521,
      threats: 23,
      averageRisk: 65.2,
      performance: 98.5,
    },
    {
      blockchain: "solana",
      scans: 3214,
      threats: 18,
      averageRisk: 71.8,
      performance: 99.1,
    },
    {
      blockchain: "base",
      scans: 2156,
      threats: 15,
      averageRisk: 69.4,
      performance: 97.9,
    },
    {
      blockchain: "blast",
      scans: 1345,
      threats: 12,
      averageRisk: 64.7,
      performance: 98.8,
    },
    {
      blockchain: "polygon",
      scans: 987,
      threats: 8,
      averageRisk: 72.1,
      performance: 99.2,
    },
  ];

  const mockThreatStats: ThreatTypeStats[] = [
    { type: "honeypot", count: 34, percentage: 38.2, trend: "up" },
    { type: "high_fees", count: 28, percentage: 31.5, trend: "stable" },
    { type: "rug_pull", count: 15, percentage: 16.9, trend: "down" },
    { type: "mint_authority", count: 8, percentage: 9.0, trend: "stable" },
    { type: "social_red_flag", count: 4, percentage: 4.5, trend: "up" },
  ];

  const mockPerformanceMetrics: PerformanceMetric[] = [
    {
      metric: "Scan Latency",
      value: 1.25,
      unit: "seconds",
      status: "good",
      description: "Average time to complete a scan",
    },
    {
      metric: "API Response Time",
      value: 245,
      unit: "ms",
      status: "good",
      description: "Average API response time",
    },
    {
      metric: "Uptime",
      value: 99.9,
      unit: "%",
      status: "good",
      description: "System availability",
    },
    {
      metric: "Queue Size",
      value: 12,
      unit: "scans",
      status: "good",
      description: "Pending scans in queue",
    },
    {
      metric: "Error Rate",
      value: 0.3,
      unit: "%",
      status: "good",
      description: "Failed scan percentage",
    },
    {
      metric: "Memory Usage",
      value: 76,
      unit: "%",
      status: "warning",
      description: "System memory utilization",
    },
  ];

  const displayMetrics = metrics || mockMetrics;
  const displayBlockchainStats =
    blockchainStats.length > 0 ? blockchainStats : mockBlockchainStats;
  const displayThreatStats =
    threatStats.length > 0 ? threatStats : mockThreatStats;
  const displayPerformanceMetrics =
    performanceMetrics.length > 0 ? performanceMetrics : mockPerformanceMetrics;

  return (
    <Card className="border-cyber-grid bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-cyber-green">
              <BarChart3 className="w-5 h-5 mr-2" />
              Scanner Analytics & Performance
            </CardTitle>
            <CardDescription>
              Comprehensive metrics and performance analysis of the NimRev
              scanning system
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1 text-sm border border-cyber-grid bg-input/50 rounded"
            >
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-cyber-grid">
            <TabsTrigger value="overview">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="blockchains">
              <Globe className="w-4 h-4 mr-2" />
              Blockchains
            </TabsTrigger>
            <TabsTrigger value="threats">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Threats
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Database className="w-4 h-4 mr-2 text-cyber-blue" />
                      Total Scans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyber-blue">
                      {displayMetrics.totalScans.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{displayMetrics.scansToday} today
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                      Threats Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">
                      {displayMetrics.threatsDetected}
                    </div>
                    <p className="text-xs text-muted-foreground">Last 24h</p>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Target className="w-4 h-4 mr-2 text-green-400" />
                      Accuracy Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">
                      {displayMetrics.accuracyRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Community verified
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-cyber-orange" />
                      Avg Scan Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyber-orange">
                      {(displayMetrics.averageScanTime / 1000).toFixed(2)}s
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sub-second response
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Scanner Status</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-500">Online</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Monitors</span>
                        <span className="font-semibold">
                          {displayMetrics.activeMonitors}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Blockchain Coverage</span>
                        <span className="font-semibold">
                          {displayMetrics.blockchainsSupported} chains
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Risk Score</span>
                        <span className="font-semibold text-cyber-orange">
                          {displayMetrics.averageRiskScore}/100
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Last scan completed</span>
                        <span className="text-muted-foreground">
                          2 seconds ago
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>High-risk detection</span>
                        <span className="text-muted-foreground">
                          5 minutes ago
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>System health check</span>
                        <span className="text-muted-foreground">
                          15 minutes ago
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Database backup</span>
                        <span className="text-muted-foreground">
                          1 hour ago
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="blockchains">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Blockchain Performance Analysis
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {displayBlockchainStats.map((stat, index) => (
                  <div
                    key={stat.blockchain}
                    className="border border-cyber-grid rounded-lg p-4 bg-card/30 backdrop-blur"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold capitalize text-cyber-blue">
                            {stat.blockchain}
                          </h4>
                          <Badge variant="outline">
                            {(
                              (stat.scans /
                                displayBlockchainStats.reduce(
                                  (sum, s) => sum + s.scans,
                                  0,
                                )) *
                              100
                            ).toFixed(1)}
                            % share
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Scans</span>
                            <div className="font-semibold">
                              {stat.scans.toLocaleString()}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Threats
                            </span>
                            <div className="font-semibold text-red-400">
                              {stat.threats}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Avg Risk
                            </span>
                            <div className="font-semibold text-cyber-orange">
                              {stat.averageRisk}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Performance
                            </span>
                            <div
                              className={`font-semibold ${stat.performance > 98 ? "text-green-400" : "text-yellow-400"}`}
                            >
                              {stat.performance}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Threat Rate
                        </div>
                        <div className="text-lg font-bold text-red-400">
                          {((stat.threats / stat.scans) * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="threats">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Threat Type Distribution
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {displayThreatStats.map((threat, index) => (
                    <div
                      key={threat.type}
                      className="border border-cyber-grid rounded-lg p-4 bg-card/30 backdrop-blur"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold capitalize">
                              {threat.type.replace("_", " ")}
                            </span>
                            <span className="text-sm">
                              {getTrendIcon(threat.trend)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{threat.count} detections</span>
                            <span>{threat.percentage}% of total</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-400">
                            {threat.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Threat Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div>
                        <h5 className="font-semibold mb-2">
                          Most Common Threats
                        </h5>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Honeypot tokens (38.2%)</li>
                          <li>High transaction fees (31.5%)</li>
                          <li>Rug pull indicators (16.9%)</li>
                        </ol>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">Trending Threats</h5>
                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                          <li>Social red flags increasing</li>
                          <li>Honeypot detections rising</li>
                          <li>Rug pull indicators decreasing</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">
                          Risk Distribution
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>High Risk (0-30)</span>
                            <span>34%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Medium Risk (31-60)</span>
                            <span>28%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Low Risk (61-70)</span>
                            <span>15%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Alpha (71-100)</span>
                            <span>23%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                System Performance Metrics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayPerformanceMetrics.map((metric, index) => (
                  <Card key={index} className="border-cyber-grid bg-card/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {metric.metric}
                        {getStatusIcon(metric.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${getStatusColor(metric.status)}`}
                      >
                        {metric.value}
                        <span className="text-sm font-normal ml-1">
                          {metric.unit}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metric.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Resource Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU Usage</span>
                          <span>34%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: "34%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memory Usage</span>
                          <span>76%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: "76%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Disk Usage</span>
                          <span>45%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: "45%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Network I/O</span>
                          <span>23%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: "23%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Operational Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Scanner Nodes</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>3/3 Online</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Database Connections</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Healthy</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>API Endpoints</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>All Responsive</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Blockchain RPCs</span>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span>7/8 Available</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>IPFS Storage</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Synced</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
