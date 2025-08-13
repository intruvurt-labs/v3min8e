import { useState, useEffect } from "react";
import { twitterService } from "../services/TwitterService";
import {
  Clock,
  Heart,
  MessageCircle,
  Repeat2,
  ExternalLink,
  Shield,
  AlertTriangle,
  Zap,
  Target,
} from "lucide-react";

interface CryptoFeedItem {
  id: string;
  type:
    | "launch"
    | "ico"
    | "presale"
    | "airdrop"
    | "security_risk"
    | "hack"
    | "alpha"
    | "warning";
  content: string;
  author: {
    username: string;
    name: string;
    verified: boolean;
    avatar: string;
    credibilityScore: number;
  };
  timestamp: string;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
  relevanceScore: number;
  tags: string[];
  urls: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

interface CryptoTwitterFeedProps {
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export default function CryptoTwitterFeed({
  maxItems = 20,
  showFilters = true,
  compact = false,
}: CryptoTwitterFeedProps) {
  const [feedItems, setFeedItems] = useState<CryptoFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filterOptions = [
    { id: "all", label: "All Intelligence", icon: "🌐" },
    { id: "security_risk", label: "Security Risks", icon: "🚨" },
    { id: "hack", label: "Hacks & Exploits", icon: "🔓" },
    { id: "launch", label: "New Launches", icon: "🚀" },
    { id: "alpha", label: "Alpha Signals", icon: "💎" },
    { id: "airdrop", label: "Airdrops", icon: "🪂" },
    { id: "ico", label: "ICO/Presales", icon: "💰" },
  ];

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const items = await twitterService.getCryptoIntelligenceFeed(maxItems);
      setFeedItems(items);
    } catch (error) {
      console.error("Failed to load crypto Twitter feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshFeed = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const filteredItems =
    selectedFilter === "all"
      ? feedItems
      : feedItems.filter((item) => item.type === selectedFilter);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case "critical":
        return "text-red-400 bg-red-400/10 border-red-400/30";
      case "high":
        return "text-orange-400 bg-orange-400/10 border-orange-400/30";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "low":
        return "text-green-400 bg-green-400/10 border-green-400/30";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
  };

  const getTypeIcon = (type: string): JSX.Element => {
    switch (type) {
      case "security_risk":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "hack":
        return <Shield className="w-4 h-4 text-red-500" />;
      case "launch":
        return <Zap className="w-4 h-4 text-green-400" />;
      case "alpha":
        return <Target className="w-4 h-4 text-blue-400" />;
      case "airdrop":
        return <span className="text-purple-400">🪂</span>;
      case "ico":
        return <span className="text-yellow-400">💰</span>;
      default:
        return <span className="text-gray-400">📢</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="border border-gray-600 rounded-lg p-4 bg-dark-bg/50">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-cyber font-bold text-cyber-green">
            🐦 CRYPTO INTELLIGENCE FEED
          </h3>
          <div className="px-3 py-1 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
            <span className="text-cyber-green font-mono text-sm">
              {filteredItems.length} signals
            </span>
          </div>
        </div>

        <button
          onClick={refreshFeed}
          disabled={refreshing}
          className="px-4 py-2 bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:bg-cyber-blue/30 transition-colors disabled:opacity-50"
        >
          <div
            className={`flex items-center space-x-2 ${refreshing ? "animate-pulse" : ""}`}
          >
            <span className="text-sm font-mono">
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </div>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-1 rounded-lg font-mono text-sm transition-all ${
                selectedFilter === filter.id
                  ? "bg-cyber-green/20 border border-cyber-green/50 text-cyber-green"
                  : "bg-gray-800/50 border border-gray-600/50 text-gray-400 hover:text-gray-300"
              }`}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Feed Items */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-cyber-green/50">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 bg-dark-bg/50 hover:bg-dark-bg/70 transition-all ${
              item.riskLevel === "critical"
                ? "border-red-400/50 shadow-red-400/20 shadow-lg"
                : item.riskLevel === "high"
                  ? "border-orange-400/50"
                  : "border-gray-600/50"
            }`}
          >
            {/* Author info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={item.author.avatar}
                  alt={item.author.name}
                  className="w-10 h-10 rounded-full border border-cyber-green/30"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">
                      {item.author.name}
                    </span>
                    {item.author.verified && (
                      <span className="text-cyber-blue">✓</span>
                    )}
                    <div
                      className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(item.riskLevel)}`}
                    >
                      {item.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>@{item.author.username}</span>
                    <span>•</span>
                    <span>Credibility: {item.author.credibilityScore}%</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {getTypeIcon(item.type)}
              </div>
            </div>

            {/* Content */}
            <div className="mb-3">
              <p className="text-gray-200 font-mono leading-relaxed">
                {item.content}
              </p>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-cyber-purple/20 border border-cyber-purple/30 rounded text-xs text-cyber-purple font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* URLs */}
            {item.urls.length > 0 && (
              <div className="mb-3">
                {item.urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-cyber-blue hover:text-cyber-green transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="text-sm underline">{url}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Engagement metrics */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{item.engagement.replies}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Repeat2 className="w-4 h-4" />
                  <span>{item.engagement.retweets}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{item.engagement.likes}</span>
                </div>
              </div>

              <div className="text-xs">Relevance: {item.relevanceScore}%</div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="font-mono">
              No intelligence signals found for this filter.
            </p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-gray-500 font-mono">
        <p>
          Intelligence sourced from verified crypto security experts and
          researchers
        </p>
        <p>
          ⚠️ Always DYOR (Do Your Own Research) before making investment
          decisions
        </p>
      </div>
    </div>
  );
}
