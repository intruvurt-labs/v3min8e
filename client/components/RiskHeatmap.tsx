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
  TrendingUp,
  Map,
  BarChart3,
  Filter,
  Calendar,
  Globe,
} from "lucide-react";

interface RiskData {
  blockchain: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  count: number;
  percentage: number;
  change24h: number;
}

interface TimeSeriesData {
  timestamp: string;
  riskScore: number;
  blockchain: string;
}

interface HeatmapCell {
  blockchain: string;
  hour: number;
  riskLevel: number;
  threatCount: number;
}

export function RiskHeatmap() {
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [selectedBlockchain, setSelectedBlockchain] = useState("all");

  const blockchains = [
    "all",
    "ethereum",
    "solana",
    "base",
    "blast",
    "polygon",
    "avalanche",
    "arbitrum",
    "optimism",
  ];

  useEffect(() => {
    loadRiskData();
    loadTimeSeriesData();
    loadHeatmapData();
  }, [selectedTimeframe, selectedBlockchain]);

  const loadRiskData = async () => {
    try {
      const response = await fetch(
        `/api/nimrev/risk-data?timeframe=${selectedTimeframe}&blockchain=${selectedBlockchain}`,
      );
      if (response.ok) {
        const data = await response.json();
        setRiskData(data);
      }
    } catch (error) {
      console.error("Failed to load risk data:", error);
    }
  };

  const loadTimeSeriesData = async () => {
    try {
      const response = await fetch(
        `/api/nimrev/risk-timeseries?timeframe=${selectedTimeframe}&blockchain=${selectedBlockchain}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data);
      }
    } catch (error) {
      console.error("Failed to load time series data:", error);
    }
  };

  const loadHeatmapData = async () => {
    try {
      const response = await fetch(
        `/api/nimrev/risk-heatmap?timeframe=${selectedTimeframe}`,
      );
      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data);
      }
    } catch (error) {
      console.error("Failed to load heatmap data:", error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getHeatmapCellColor = (riskLevel: number, threatCount: number) => {
    const intensity = Math.min(threatCount / 10, 1); // Normalize to 0-1
    if (riskLevel <= 30) {
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`; // Red gradient
    } else if (riskLevel <= 60) {
      return `rgba(245, 158, 11, ${0.2 + intensity * 0.6})`; // Orange gradient
    } else if (riskLevel <= 70) {
      return `rgba(59, 130, 246, ${0.2 + intensity * 0.6})`; // Blue gradient
    } else {
      return `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`; // Green gradient
    }
  };

  const generateMockHeatmapData = (): HeatmapCell[] => {
    const data: HeatmapCell[] = [];
    const blockchains = ["ethereum", "solana", "base", "blast", "polygon"];

    for (let blockchain of blockchains) {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          blockchain,
          hour,
          riskLevel: Math.floor(Math.random() * 100),
          threatCount: Math.floor(Math.random() * 20),
        });
      }
    }
    return data;
  };

  const generateMockRiskData = (): RiskData[] => {
    return [
      {
        blockchain: "ethereum",
        riskLevel: "critical",
        count: 45,
        percentage: 23,
        change24h: 12,
      },
      {
        blockchain: "solana",
        riskLevel: "high",
        count: 78,
        percentage: 19,
        change24h: -5,
      },
      {
        blockchain: "base",
        riskLevel: "medium",
        count: 132,
        percentage: 31,
        change24h: 8,
      },
      {
        blockchain: "blast",
        riskLevel: "low",
        count: 89,
        percentage: 15,
        change24h: -3,
      },
      {
        blockchain: "polygon",
        riskLevel: "medium",
        count: 67,
        percentage: 12,
        change24h: 15,
      },
    ];
  };

  // Use mock data if no real data is available
  const displayRiskData =
    riskData.length > 0 ? riskData : generateMockRiskData();
  const displayHeatmapData =
    heatmapData.length > 0 ? heatmapData : generateMockHeatmapData();

  return (
    <Card className="border-cyber-grid bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-cyber-green">
              <Map className="w-5 h-5 mr-2" />
              Risk Heatmap & Analytics
            </CardTitle>
            <CardDescription>
              Visual representation of threat distribution across blockchains
              and time
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
            <select
              value={selectedBlockchain}
              onChange={(e) => setSelectedBlockchain(e.target.value)}
              className="px-3 py-1 text-sm border border-cyber-grid bg-input/50 rounded"
            >
              {blockchains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain === "all"
                    ? "All Chains"
                    : chain.charAt(0).toUpperCase() + chain.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="heatmap" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-cyber-grid">
            <TabsTrigger value="heatmap">
              <Map className="w-4 h-4 mr-2" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <BarChart3 className="w-4 h-4 mr-2" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  24-Hour Threat Activity
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500/40 rounded"></div>
                    <span>Low Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500/40 rounded"></div>
                    <span>Medium Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500/40 rounded"></div>
                    <span>High Risk</span>
                  </div>
                </div>
              </div>

              <div className="bg-card/30 p-4 rounded-lg border border-cyber-grid">
                <div className="grid grid-cols-25 gap-1">
                  {/* Hour headers */}
                  <div></div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className="text-xs text-center text-muted-foreground py-1"
                    >
                      {i.toString().padStart(2, "0")}
                    </div>
                  ))}

                  {/* Blockchain rows */}
                  {["ethereum", "solana", "base", "blast", "polygon"].map(
                    (blockchain) => (
                      <React.Fragment key={blockchain}>
                        <div className="text-xs text-muted-foreground py-2 pr-2 text-right capitalize">
                          {blockchain}
                        </div>
                        {Array.from({ length: 24 }, (_, hour) => {
                          const cellData = displayHeatmapData.find(
                            (d) =>
                              d.blockchain === blockchain && d.hour === hour,
                          );
                          return (
                            <div
                              key={hour}
                              className="aspect-square rounded border border-cyber-grid/30 cursor-pointer hover:border-cyber-green transition-colors"
                              style={{
                                backgroundColor: cellData
                                  ? getHeatmapCellColor(
                                      cellData.riskLevel,
                                      cellData.threatCount,
                                    )
                                  : "rgba(0,0,0,0.1)",
                              }}
                              title={`${blockchain} - ${hour}:00\nRisk: ${cellData?.riskLevel || 0}\nThreats: ${cellData?.threatCount || 0}`}
                            />
                          );
                        })}
                      </React.Fragment>
                    ),
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Risk Distribution by Blockchain
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayRiskData.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getRiskColor(item.riskLevel)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">
                        {item.blockchain}
                      </h4>
                      <Badge
                        variant="outline"
                        className={getRiskColor(item.riskLevel)}
                      >
                        {item.riskLevel}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Threats Detected:</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Market Share:</span>
                        <span>{item.percentage}%</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>24h Change:</span>
                        <span
                          className={
                            item.change24h >= 0
                              ? "text-red-400"
                              : "text-green-400"
                          }
                        >
                          {item.change24h >= 0 ? "+" : ""}
                          {item.change24h}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Risk Trends Over Time</h3>

              <div className="bg-card/30 p-6 rounded-lg border border-cyber-grid">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                  <p>Interactive trend charts coming soon...</p>
                  <p className="text-sm mt-2">
                    Real-time visualization of risk patterns and threat
                    evolution across blockchains
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Average Risk Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyber-orange">
                      67.3
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +2.1% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Threats Detected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">234</div>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Most Active Chain</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyber-blue">
                      Ethereum
                    </div>
                    <p className="text-xs text-muted-foreground">
                      89 threats detected
                    </p>
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
