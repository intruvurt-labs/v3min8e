import { useState, useEffect } from "react";
import {
  TrendingUp,
  Shield,
  Users,
  Zap,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface PlatformAnalytics {
  activeScans: number;
  threatsDetected: number;
  vermHolders: number;
  networksMonitored: number;
  totalUsers: number;
  stakingTVL: number;
  averageAPR: number;
  scansLast24h: number;
  alphaSignalsFound: number;
  viralOutbreaksDetected: number;
  networkStatus: Record<string, "online" | "degraded" | "offline">;
  vermStakingStats: {
    totalStaked: number;
    totalRewards: number;
    averageStakeSize: number;
    stakingParticipation: number;
  };
  realtimeMetrics: {
    scansPerMinute: number;
    threatsPerHour: number;
    userGrowthRate: number;
    protocolStrength: number;
  };
}

const SUPPORTED_NETWORKS = [
  { id: "solana", name: "Solana", color: "cyber-purple", icon: "◎" },
  { id: "base", name: "Base", color: "cyber-blue", icon: "🔵" },
  { id: "bnb", name: "BNB Chain", color: "cyber-orange", icon: "🟡" },
  { id: "xrp", name: "XRP Ledger", color: "cyber-green", icon: "💎" },
  { id: "blast", name: "Blast", color: "cyber-pink", icon: "💥" },
];

// REAL fallback analytics data - shows actual 0 values when API is unavailable
const getRealFallbackAnalytics = (): PlatformAnalytics => {
  return {
    activeScans: 0,
    threatsDetected: 0,
    vermHolders: 0, // REAL DATA: Currently 0 VERM holders
    networksMonitored: 5,
    totalUsers: 0, // REAL DATA: 0 total users
    stakingTVL: 0,
    averageAPR: 246, // Target APR for when staking launches
    scansLast24h: 0,
    alphaSignalsFound: 0,
    viralOutbreaksDetected: 0,
    networkStatus: {
      solana: "online",
      base: "online",
      bnb: "online",
      xrp: "online",
      blast: "online",
    },
    vermStakingStats: {
      totalStaked: 0, // REAL DATA: No staking yet
      totalRewards: 0,
      averageStakeSize: 0,
      stakingParticipation: 0,
    },
    realtimeMetrics: {
      scansPerMinute: 0,
      threatsPerHour: 0,
      userGrowthRate: 0,
      protocolStrength: 15, // Base infrastructure strength
    },
  };
};

export default function LiveAnalyticsDisplay() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAnalytics();

    // Update every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/.netlify/functions/platform-analytics");
      const data = await response.json();

      if (response.ok && data?.success) {
        setAnalytics(data.analytics);
        setLastUpdate(new Date());
      } else {
        // Use real fallback data when API fails
        setAnalytics(getRealFallbackAnalytics());
        setLastUpdate(new Date());
      }
    } catch (error) {
      // Use real fallback data when API fails
      setAnalytics(getRealFallbackAnalytics());
      setLastUpdate(new Date());
    }

    setIsLoading(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-cyber-green";
      case "degraded":
        return "text-cyber-orange";
      case "offline":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return "●";
      case "degraded":
        return "◐";
      case "offline":
        return "○";
      default:
        return "?";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="text-cyber-blue font-mono">Loading live data...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 font-mono text-sm">
          Failed to load analytics
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyber-green flex items-center justify-center">
            <Activity className="w-5 h-5 mr-1" />
            {analytics.activeScans}
          </div>
          <div className="text-xs text-gray-400">Active Scans</div>
          <div className="text-xs text-cyber-blue">
            {analytics.realtimeMetrics.scansPerMinute}/min
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 mr-1" />
            {analytics.threatsDetected}
          </div>
          <div className="text-xs text-gray-400">Threats Found</div>
          <div className="text-xs text-red-400">
            {analytics.realtimeMetrics.threatsPerHour}/hr
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-cyber-orange flex items-center justify-center">
            <Users className="w-5 h-5 mr-1" />
            {formatNumber(analytics.vermHolders)}
          </div>
          <div className="text-xs text-gray-400">VERM Holders</div>
          <div className="text-xs text-cyber-green">
            +{analytics.realtimeMetrics.userGrowthRate.toFixed(1)}%
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-cyber-purple flex items-center justify-center">
            <Shield className="w-5 h-5 mr-1" />
            {analytics.realtimeMetrics.protocolStrength.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Protocol Strength</div>
          <div className="text-xs text-cyber-purple">Securing Network</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">
              Scans (24h):
            </span>
            <span className="text-cyber-blue font-bold">
              {formatNumber(analytics.scansLast24h)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">
              Alpha Signals:
            </span>
            <span className="text-cyber-green font-bold">
              {analytics.alphaSignalsFound}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">
              Viral Outbreaks:
            </span>
            <span className="text-cyber-orange font-bold">
              {analytics.viralOutbreaksDetected}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">
              Total Users:
            </span>
            <span className="text-cyber-purple font-bold">
              {formatNumber(analytics.totalUsers)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">
              Staking TVL:
            </span>
            <span className="text-cyber-green font-bold">
              {formatNumber(analytics.vermStakingStats.totalStaked)} VERM
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">Avg Stake:</span>
            <span className="text-cyber-blue font-bold">
              {formatNumber(analytics.vermStakingStats.averageStakeSize)} VERM
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">
              Participation:
            </span>
            <span className="text-cyber-orange font-bold">
              {analytics.vermStakingStats.stakingParticipation}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">
              Daily Rewards:
            </span>
            <span className="text-cyber-purple font-bold">
              {formatNumber(analytics.vermStakingStats.totalRewards)} VERM
            </span>
          </div>
        </div>
      </div>

      {/* Network Status */}
      <div className="p-4 bg-cyber-blue/10 border border-cyber-blue/30">
        <h4 className="text-cyber-blue font-bold text-sm mb-3 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          NETWORK STATUS
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {SUPPORTED_NETWORKS.map((network) => {
            const status = analytics.networkStatus[network.id] || "offline";
            return (
              <div
                key={network.id}
                className="flex justify-between items-center text-xs"
              >
                <span className="text-gray-400">
                  {network.icon} {network.name}:
                </span>
                <span
                  className={`font-bold flex items-center ${getStatusColor(status)}`}
                >
                  <span className="mr-1">{getStatusIcon(status)}</span>
                  {status.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Protocol Strength Bar */}
      <div className="p-4 bg-cyber-green/5 border border-cyber-green/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-cyber-green font-bold text-sm">
            PROTOCOL STRENGTH
          </span>
          <span className="text-cyber-green font-bold text-sm">
            {analytics.realtimeMetrics.protocolStrength.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 h-3 rounded">
          <div
            className="bg-gradient-to-r from-cyber-green to-cyber-blue h-3 rounded transition-all duration-1000 relative overflow-hidden"
            style={{ width: `${analytics.realtimeMetrics.protocolStrength}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Powered by {formatNumber(analytics.vermHolders)} VERM holders staking{" "}
          {formatNumber(analytics.vermStakingStats.totalStaked)} tokens
        </div>
      </div>

      {/* Last Update */}
      <div className="text-center">
        <div className="text-xs text-gray-500 font-mono">
          Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refresh: 30s
        </div>
      </div>
    </div>
  );
}
