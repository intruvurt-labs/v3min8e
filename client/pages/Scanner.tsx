import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import UserProfile from "@/components/UserProfile";
import LiveAnalyticsDisplay from "@/components/LiveAnalyticsDisplay";
import PaymentModal from "@/components/PaymentModal";
import CookieConsent from "@/components/CookieConsent";
import PixelKnowledgeTree from "@/components/PixelKnowledgeTree";
import LiveScanDisplay from "@/components/LiveScanDisplay";
import ScannerDashboard from "@/components/ScannerDashboard";
import BlockchainSecurityUpdates from "@/components/BlockchainSecurityUpdates";
import { useWallet } from "@/hooks/useWallet";
import {
  User,
  Settings,
  BarChart3,
  CreditCard,
  Shield,
  RefreshCw,
  CheckCircle,
  Calendar,
  Trophy,
  Flame,
  Gift,
  Star,
  Zap,
} from "lucide-react";

// Keep all existing interfaces from Explorer.tsx
interface TokenData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  supply: {
    total: number;
    circulating: number;
  };
  holders: number;
  riskScore: number;
  securityChecks: {
    mintDisabled: boolean;
    freezeDisabled: boolean;
    lpBurned: boolean;
    rugPull: boolean;
    honeypot: boolean;
  };
  socialMetrics: {
    twitter: number;
    telegram: number;
    reddit: number;
    discord: number;
  };
  liquidityPools: Array<{
    exchange: string;
    pair: string;
    liquidity: number;
    volume24h: number;
  }>;
  topHolders: Array<{
    address: string;
    percentage: number;
    balance: number;
  }>;
  auditStatus: "verified" | "pending" | "failed" | "not_audited";
  riskFactors: string[];
  contractType: string;
  timestamp: number;
  verminAnalysis: {
    recommendation: string;
    confidenceLevel: number;
    isDemoMode?: boolean;
  };
}

interface VermBalance {
  balance: number;
  usdValue: number;
  qualified: boolean;
  network: string;
}

interface ScanPhase {
  id: string;
  name: string;
  description: string;
  duration: number;
  progress: number;
  status: "pending" | "running" | "completed" | "error";
}

interface SupportedNetwork {
  id: string;
  name: string;
  icon: string;
  color: string;
  rpcUrl: string;
}

// New interfaces for Dashboard features
interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalScans: number;
  dailyStreak: number;
  vermBalance: number;
  stakedVerm: number;
  gritBalance: number;
  posgTokens: number;
  apr: number;
  trustScore: number;
  lastLogin: Date;
  consecutiveLogins: number;
  longestStreak: number;
  weeklyScans: number;
  monthlyScans: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: "scan" | "stake" | "social" | "login";
  completed: boolean;
  progress: number;
  target: number;
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: Date;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface DailyLoginReward {
  day: number;
  xp: number;
  verm: number;
  posgTokens: number;
  specialReward?: string;
  claimed: boolean;
}

const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    id: "solana",
    name: "Solana",
    icon: "◎",
    color: "purple",
    rpcUrl: "https://api.mainnet-beta.solana.com",
  },
  {
    id: "base",
    name: "Base",
    icon: "🔵",
    color: "blue",
    rpcUrl: "https://mainnet.base.org",
  },
  {
    id: "bnb",
    name: "BNB Chain",
    icon: "🟡",
    color: "yellow",
    rpcUrl: "https://bsc-dataseed.binance.org",
  },
  {
    id: "xrp",
    name: "XRP Ledger",
    icon: "����",
    color: "teal",
    rpcUrl: "https://s1.ripple.com:51234",
  },
  {
    id: "blast",
    name: "Blast",
    icon: "💥",
    color: "orange",
    rpcUrl: "https://rpc.blast.io",
  },
];

const DEMO_QUOTES = [
  "Multi-layer security analysis in progress...",
  "Scanning blockchain for honeypot patterns...",
  "Analyzing social sentiment and rug indicators...",
  "Cross-referencing with verified scam database...",
  "Performing advanced liquidity analysis...",
  "Checking contract ownership and mint authority...",
];

const CREATOR_WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

export default function Scanner() {
  // Merge state from both Explorer and Dashboard
  const { publicKey, balance, connectWallet, walletConnected } = useWallet();

  // Scanner states (from Explorer.tsx)
  const [scanAddress, setScanAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("solana");
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirmationScan, setIsConfirmationScan] = useState(false);
  const [scanResult, setScanResult] = useState<TokenData | null>(null);
  const [scanPhases, setScanPhases] = useState<ScanPhase[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [vermBalance, setVermBalance] = useState<VermBalance | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionDays, setSubscriptionDays] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [canScanIP, setCanScanIP] = useState(true);
  const [hasUsedFreeScan, setHasUsedFreeScan] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // Dashboard states with enhanced gamification
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNext: 1000,
    totalScans: 0,
    dailyStreak: 0,
    vermBalance: 0,
    stakedVerm: 0,
    gritBalance: 0,
    posgTokens: 0,
    apr: 0,
    trustScore: 0,
    lastLogin: new Date(),
    consecutiveLogins: 0,
    longestStreak: 0,
    weeklyScans: 0,
    monthlyScans: 0,
  });

  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([
    {
      id: "login",
      title: "Daily Login Master",
      description: "Login for 7 consecutive days",
      reward: 500,
      type: "login",
      completed: false,
      progress: 0,
      target: 7,
      icon: "🔥",
    },
    {
      id: "scan",
      title: "Security Analyst",
      description: "Perform 5 token scans today",
      reward: 300,
      type: "scan",
      completed: false,
      progress: 0,
      target: 5,
      icon: "🔍",
    },
    {
      id: "streak",
      title: "Streak Legend",
      description: "Maintain your login streak",
      reward: 200,
      type: "login",
      completed: false,
      progress: 0,
      target: 1,
      icon: "⚡",
    },
    {
      id: "social",
      title: "Community Explorer",
      description: "Check security updates",
      reward: 150,
      type: "social",
      completed: false,
      progress: 0,
      target: 1,
      icon: "👥",
    },
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_scan",
      title: "Scanner Initiate",
      description: "Complete your first token scan",
      icon: "🔍",
      unlocked: false,
      rarity: "common",
    },
    {
      id: "streak_7",
      title: "Weekly Warrior",
      description: "Maintain 7-day login streak",
      icon: "🔥",
      unlocked: false,
      rarity: "rare",
    },
    {
      id: "streak_30",
      title: "Monthly Master",
      description: "Maintain 30-day login streak",
      icon: "👑",
      unlocked: false,
      rarity: "epic",
    },
    {
      id: "whale",
      title: "VERM Whale",
      description: "Stake over 100,000 VERM",
      icon: "🐋",
      unlocked: false,
      rarity: "legendary",
    },
    {
      id: "scanner_pro",
      title: "Security Expert",
      description: "Complete 100 token scans",
      icon: "🛡️",
      unlocked: false,
      rarity: "epic",
    },
    {
      id: "early_adopter",
      title: "Early Adopter",
      description: "Joined NimRev in 2025",
      icon: "🚀",
      unlocked: true,
      date: new Date(),
      rarity: "rare",
    },
  ]);

  const [dailyLoginRewards, setDailyLoginRewards] = useState<
    DailyLoginReward[]
  >([
    { day: 1, xp: 100, verm: 10, posgTokens: 1, claimed: false },
    { day: 2, xp: 120, verm: 12, posgTokens: 1, claimed: false },
    { day: 3, xp: 150, verm: 15, posgTokens: 2, claimed: false },
    { day: 4, xp: 180, verm: 18, posgTokens: 2, claimed: false },
    { day: 5, xp: 220, verm: 22, posgTokens: 3, claimed: false },
    { day: 6, xp: 250, verm: 25, posgTokens: 3, claimed: false },
    {
      day: 7,
      xp: 300,
      verm: 30,
      posgTokens: 5,
      specialReward: "🎁 Bonus Chest",
      claimed: false,
    },
  ]);

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showAchievementNotification, setShowAchievementNotification] =
    useState<Achievement | null>(null);
  const [showView, setShowView] = useState<"scanner" | "dashboard">("scanner");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(false);
  const [scanInterval, setScanInterval] = useState<NodeJS.Timeout | null>(null);
  const [realtimeTokens, setRealtimeTokens] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Memoize expensive calculations to prevent unnecessary re-computation
  const userLevel = useMemo(
    () => Math.floor(userStats.xp / 1000) + 1,
    [userStats.xp],
  );
  const totalScans = useMemo(
    () => userStats.totalScans,
    [userStats.totalScans],
  );
  const verifiedPatterns = useMemo(
    () => Math.floor(totalScans * 0.3),
    [totalScans],
  );

  // Memoize APR calculation to prevent function recreation on every render
  const calculateAPR = useCallback((stakedAmount: number) => {
    if (stakedAmount >= 100000) return 36.9;
    if (stakedAmount >= 50000) return 24.6;
    if (stakedAmount >= 10000) return 15.3;
    if (stakedAmount >= 5000) return 9.8;
    return 3.69;
  }, []);

  // Enhanced daily login system
  const checkDailyLogin = () => {
    const today = new Date();
    const lastLogin = new Date(userStats.lastLogin);
    const timeDiff = today.getTime() - lastLogin.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (daysDiff >= 1) {
      // User is logging in today
      const isConsecutive = daysDiff === 1;
      const newStreak = isConsecutive ? userStats.dailyStreak + 1 : 1;
      const streakMultiplier = Math.min(Math.floor(newStreak / 7) + 1, 5);

      setUserStats((prev) => ({
        ...prev,
        lastLogin: today,
        dailyStreak: newStreak,
        consecutiveLogins: prev.consecutiveLogins + 1,
        longestStreak: Math.max(prev.longestStreak, newStreak),
      }));

      // Show daily reward modal
      setShowDailyReward(true);

      // Check for streak achievements
      if (newStreak === 7) {
        unlockAchievement("streak_7");
      } else if (newStreak === 30) {
        unlockAchievement("streak_30");
      }

      // Update login challenge progress
      setDailyChallenges((prev) =>
        prev.map((challenge) =>
          challenge.type === "login"
            ? {
                ...challenge,
                progress: Math.min(challenge.progress + 1, challenge.target),
              }
            : challenge,
        ),
      );
    }
  };

  const claimDailyReward = (dayIndex: number) => {
    const reward = dailyLoginRewards[dayIndex];
    const streakMultiplier = Math.min(
      Math.floor(userStats.dailyStreak / 7) + 1,
      5,
    );

    setUserStats((prev) => ({
      ...prev,
      xp: prev.xp + reward.xp * streakMultiplier,
      vermBalance: prev.vermBalance + reward.verm * streakMultiplier,
      posgTokens: prev.posgTokens + reward.posgTokens * streakMultiplier,
    }));

    setDailyLoginRewards((prev) =>
      prev.map((r, i) => (i === dayIndex ? { ...r, claimed: true } : r)),
    );

    setShowDailyReward(false);
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements((prev) =>
      prev.map((achievement) =>
        achievement.id === achievementId && !achievement.unlocked
          ? { ...achievement, unlocked: true, date: new Date() }
          : achievement,
      ),
    );

    const achievement = achievements.find((a) => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      setShowAchievementNotification(achievement);
      setTimeout(() => setShowAchievementNotification(null), 5000);
    }
  };

  // Real scanner functionality
  const performScan = async (isConfirmation = false) => {
    if (!scanAddress.trim()) {
      alert("⚠️ Please enter a token or contract address to scan");
      return;
    }

    // Enhanced security validation
    const trimmedAddress = scanAddress.trim();

    // Basic length validation
    if (trimmedAddress.length < 10 || trimmedAddress.length > 100) {
      alert("⚠️ Invalid address length");
      return;
    }

    // Character validation (allow alphanumeric and common crypto chars)
    const allowedChars = /^[a-zA-Z0-9x]+$/;
    if (!allowedChars.test(trimmedAddress)) {
      alert("⚠️ Address contains invalid characters");
      return;
    }

    // Check if user has premium access
    const hasAccess =
      vermBalance?.qualified || hasSubscription || publicKey === CREATOR_WALLET;

    if (!hasAccess && isConfirmation) {
      setShowPremiumModal(true);
      return;
    }

    setIsScanning(true);
    setIsConfirmationScan(isConfirmation);

    try {
      // Simulate scanning phases
      const phases = [
        { name: "Initializing Scan", duration: 1000 },
        { name: "Blockchain Analysis", duration: 2000 },
        { name: "Security Checks", duration: 1500 },
        { name: "Risk Assessment", duration: 1000 },
      ];

      for (let i = 0; i < phases.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, phases[i].duration));
      }

      // Enhanced XP calculation with bonuses
      const baseXP = isConfirmation ? 200 : 100;
      const streakBonus = Math.floor(userStats.dailyStreak / 3) * 10;
      const levelBonus = userLevel * 5;
      const totalXP = baseXP + streakBonus + levelBonus;

      setUserStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        xp: prev.xp + totalXP,
        weeklyScans: prev.weeklyScans + 1,
        monthlyScans: prev.monthlyScans + 1,
      }));

      // Show XP gain notification with epic animation (XSS-safe)
      const xpGainElement = document.createElement("div");
      xpGainElement.className =
        "fixed top-20 right-4 z-50 bg-cyber-green/90 border border-cyber-green text-dark-bg px-6 py-3 rounded-lg font-cyber font-bold animate-bounce-in";

      // Create elements safely without innerHTML to prevent XSS
      const container = document.createElement("div");
      container.className = "flex items-center gap-2";

      const iconSpan = document.createElement("span");
      iconSpan.className = "text-2xl";
      iconSpan.textContent = "⚡";

      const contentDiv = document.createElement("div");

      const xpDiv = document.createElement("div");
      xpDiv.className = "text-lg";
      xpDiv.textContent = `+${Math.floor(totalXP)} XP`; // Sanitize numeric input

      const messageDiv = document.createElement("div");
      messageDiv.className = "text-xs opacity-80";
      messageDiv.textContent = "Scan Complete!";

      contentDiv.appendChild(xpDiv);
      contentDiv.appendChild(messageDiv);
      container.appendChild(iconSpan);
      container.appendChild(contentDiv);
      xpGainElement.appendChild(container);

      document.body.appendChild(xpGainElement);
      setTimeout(() => {
        if (document.body.contains(xpGainElement)) {
          document.body.removeChild(xpGainElement);
        }
      }, 3000);

      // Real token analysis via API
      let scanResult: TokenData | null = null;

      try {
        const response = await fetch("/.netlify/functions/scan-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: scanAddress,
            network: selectedNetwork,
            deep: hasAccess,
            userWallet: publicKey,
          }),
        });

        const data = await response.json();

        if (data.success && data.tokenData) {
          scanResult = {
            ...data.tokenData,
            verminAnalysis: {
              recommendation:
                data.tokenData.verminAnalysis?.recommendation ||
                (hasAccess
                  ? "✅ Analysis complete"
                  : "⚠️ Limited analysis - upgrade for full features"),
              confidenceLevel:
                data.tokenData.verminAnalysis?.confidenceLevel ||
                (hasAccess ? 85 : 45),
              isDemoMode: !hasAccess,
            },
          };
        }
      } catch (error) {
        console.error("API scan failed:", error);
      }

      // Fallback to basic analysis if API fails
      if (!scanResult) {
        scanResult = {
          symbol: scanAddress.slice(0, 6).toUpperCase(),
          name: `Token ${scanAddress.slice(0, 8)}`,
          price: 0,
          change24h: 0,
          marketCap: 0,
          volume24h: 0,
          supply: { total: 0, circulating: 0 },
          holders: 0,
          riskScore: 99, // High risk when no data available
          securityChecks: {
            mintDisabled: false,
            freezeDisabled: false,
            lpBurned: false,
            rugPull: false,
            honeypot: false,
          },
          socialMetrics: { twitter: 0, telegram: 0, reddit: 0, discord: 0 },
          liquidityPools: [],
          topHolders: [],
          auditStatus: "not_audited" as const,
          riskFactors: ["No data available", "Unable to verify token"],
          contractType:
            selectedNetwork === "solana" ? "SPL Token" : "ERC-20 Token",
          timestamp: Date.now(),
          verminAnalysis: {
            recommendation:
              "⚠️ Analysis unavailable - token data could not be retrieved",
            confidenceLevel: 0,
            isDemoMode: true,
          },
        };
      }

      setScanResult(scanResult);

      // Update challenges
      setDailyChallenges((prev) =>
        prev.map((challenge) =>
          challenge.type === "scan"
            ? {
                ...challenge,
                progress: Math.min(challenge.progress + 1, challenge.target),
              }
            : challenge,
        ),
      );

      // Check for achievements
      if (userStats.totalScans === 0) {
        unlockAchievement("first_scan");
      }
      if (userStats.totalScans + 1 >= 100) {
        unlockAchievement("scanner_pro");
      }
    } catch (error) {
      console.error("Scan failed:", error);
      alert("❌ Scan failed. Please try again.");
    } finally {
      setIsScanning(false);
      setIsConfirmationScan(false);
    }
  };

  // Premium features - Real-time token monitoring
  const startRealtimeMonitoring = async () => {
    if (!vermBalance?.qualified && !hasSubscription) {
      setShowPremiumModal(true);
      return;
    }

    setIsAutoScanEnabled(true);

    // Simulate real-time token fetching from pump.fun/letsbonk.fun
    const fetchRealtimeTokens = async () => {
      try {
        // In production, this would connect to pump.fun API or WebSocket
        const mockTokens = [
          {
            address: `${Date.now().toString(36)}${Math.random().toString(36)}`,
            name: `MEME${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            symbol: Math.random().toString(36).slice(2, 6).toUpperCase(),
            marketCap: Math.random() * 1000000,
            created: new Date().toISOString(),
            chain: selectedNetwork,
            riskScore: Math.floor(Math.random() * 100),
          },
        ];

        setRealtimeTokens((prev) => [...mockTokens, ...prev.slice(0, 9)]);

        // Auto-scan new tokens
        for (const token of mockTokens) {
          await performAutoScan(token.address);
        }
      } catch (error) {
        console.error("Failed to fetch realtime tokens:", error);
      }
    };

    // Start monitoring
    fetchRealtimeTokens();
    const interval = setInterval(fetchRealtimeTokens, 5000); // Check every 5 seconds
    setScanInterval(interval);
  };

  const stopRealtimeMonitoring = () => {
    setIsAutoScanEnabled(false);
    if (scanInterval) {
      clearInterval(scanInterval);
      setScanInterval(null);
    }
  };

  const performAutoScan = async (address: string) => {
    // Perform background scan for auto-detected tokens
    console.log(`Auto-scanning token: ${address}`);
    // In production, this would perform actual security analysis
  };

  // Analytics functionality
  const openAnalytics = () => {
    setShowAnalytics(true);
  };

  // Quick scan functionality
  const quickScan = () => {
    if (scanAddress.trim()) {
      performScan(false);
    } else {
      // Focus the input and provide feedback
      const input = document.getElementById(
        "scan-address-input",
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.classList.add("animate-pulse");
        setTimeout(() => input.classList.remove("animate-pulse"), 1000);
      }
      alert("💡 Please enter a token address first");
    }
  };

  // Initialize daily login check
  useEffect(() => {
    checkDailyLogin();
  }, []);

  // Quote rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % DEMO_QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check wallet connection and stats
  useEffect(() => {
    if (walletConnected && publicKey) {
      // Update user stats with real wallet data
      setUserStats((prev) => ({
        ...prev,
        level: Math.max(1, Math.floor((balance || 0) / 1000) + 1),
        vermBalance: 0, // Will be updated via API
        apr: calculateAPR(prev.stakedVerm),
      }));

      // Mark wallet connection challenge as complete
      setDailyChallenges((prev) =>
        prev.map((challenge) =>
          challenge.id === "social"
            ? { ...challenge, completed: true, progress: 1 }
            : challenge,
        ),
      );
    }
  }, [publicKey, balance, walletConnected]);

  const renderDashboardView = () => (
    <div className="space-y-8">
      {/* Enhanced Header with Daily Login Streak */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-6xl animate-bounce">👻</div>
          <div>
            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green neon-glow">
              DATA GHOST HQ
            </h1>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="bg-cyber-orange/20 px-3 py-1 rounded border border-cyber-orange/30 animate-pulse-glow">
                <span className="text-cyber-orange font-bold">
                  🔥 {userStats.dailyStreak} Day Streak
                </span>
              </div>
              <div className="bg-cyber-blue/20 px-3 py-1 rounded border border-cyber-blue/30">
                <span className="text-cyber-blue font-bold">
                  Level {userLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced User Stats Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 border border-cyber-green/30 p-6 bg-cyber-green/5 interactive-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-cyber font-bold text-cyber-green">
                Level {userLevel}{" "}
                {userLevel < 5
                  ? "Rookie"
                  : userLevel < 15
                    ? "Data Ghost"
                    : "Elite Scanner"}
              </h2>
              <p className="text-gray-400 font-mono text-sm">
                {userStats.xp.toLocaleString()} XP •{" "}
                {userStats.xpToNext.toLocaleString()} to next level
              </p>
            </div>
            <div className="text-4xl animate-pulse-glow">👻</div>
          </div>

          {/* Enhanced XP Progress Bar */}
          <div className="w-full bg-dark-bg border border-cyber-green/30 rounded mb-4">
            <div
              className="h-3 bg-gradient-to-r from-cyber-green to-cyber-blue rounded transition-all duration-500 animate-shimmer"
              style={{
                width: `${(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-cyber font-bold text-cyber-green">
                {userStats.totalScans}
              </div>
              <div className="text-gray-400 font-mono text-xs">Total Scans</div>
            </div>
            <div>
              <div className="text-xl font-cyber font-bold text-cyber-orange">
                {userStats.dailyStreak}
              </div>
              <div className="text-gray-400 font-mono text-xs">Day Streak</div>
            </div>
            <div>
              <div className="text-xl font-cyber font-bold text-cyber-blue">
                {userStats.trustScore}%
              </div>
              <div className="text-gray-400 font-mono text-xs">Trust Score</div>
            </div>
            <div>
              <div className="text-xl font-cyber font-bold text-cyber-purple">
                {userStats.longestStreak}
              </div>
              <div className="text-gray-400 font-mono text-xs">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Token Balances */}
        <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5 interactive-card">
          <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-cyber-blue rounded-full animate-pulse"></div>
            TOKEN BALANCES
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300 font-mono text-sm">VERM</span>
              <span className="text-cyber-green font-bold">
                {userStats.vermBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-mono text-sm">
                Staked VERM
              </span>
              <span className="text-cyber-blue font-bold">
                {userStats.stakedVerm.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-mono text-sm">GRIT</span>
              <span className="text-cyber-orange font-bold">
                {userStats.gritBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-mono text-sm">
                PoSg Tokens
              </span>
              <span className="text-cyber-purple font-bold">
                {userStats.posgTokens}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Staking Rewards */}
        <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5 interactive-card">
          <h3 className="text-lg font-cyber font-bold text-cyber-orange mb-4">
            STAKING REWARDS
          </h3>
          <div className="text-center">
            <div className="text-3xl font-cyber font-black text-cyber-orange mb-2 animate-text-glow">
              {calculateAPR(userStats.stakedVerm).toFixed(1)}%
            </div>
            <div className="text-gray-300 font-mono text-sm mb-4">
              Current APR
            </div>
            <div className="text-gray-400 font-mono text-xs">
              Next tier:{" "}
              {userStats.stakedVerm >= 100000
                ? "MAX"
                : userStats.stakedVerm >= 50000
                  ? "100K VERM"
                  : userStats.stakedVerm >= 10000
                    ? "50K VERM"
                    : userStats.stakedVerm >= 5000
                      ? "10K VERM"
                      : "5K VERM"}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Daily Challenges & Login Rewards */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5 interactive-card">
          <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            DAILY CHALLENGES
          </h3>
          <div className="space-y-4">
            {dailyChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="border border-gray-600 p-4 bg-dark-bg/50 interactive-card"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{challenge.icon}</span>
                    <div>
                      <h4 className="text-cyber-green font-bold text-sm">
                        {challenge.title}
                      </h4>
                      <p className="text-gray-300 text-xs">
                        {challenge.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyber-orange font-bold text-sm">
                      +{challenge.reward} XP
                    </div>
                    {challenge.completed && (
                      <div className="text-cyber-green text-xs animate-bounce-in">
                        ✓ Complete
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-dark-bg border border-gray-600 rounded mt-2">
                  <div
                    className={`h-2 rounded transition-all duration-500 ${
                      challenge.completed
                        ? "bg-cyber-green animate-shimmer"
                        : "bg-cyber-orange"
                    }`}
                    style={{
                      width: `${(challenge.progress / challenge.target) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Progress: {challenge.progress}/{challenge.target}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Daily Login Rewards */}
        <div className="border border-cyber-green/30 p-6 bg-cyber-green/5 interactive-card">
          <h3 className="text-xl font-cyber font-bold text-cyber-green mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            DAILY LOGIN REWARDS
          </h3>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dailyLoginRewards.map((reward, index) => (
              <div
                key={reward.day}
                className={`p-2 text-center border rounded transition-all duration-300 ${
                  reward.claimed
                    ? "border-cyber-green bg-cyber-green/20 text-cyber-green"
                    : index < userStats.dailyStreak
                      ? "border-cyber-orange bg-cyber-orange/20 text-cyber-orange animate-pulse-glow"
                      : "border-gray-600 bg-gray-800/50 text-gray-400"
                }`}
              >
                <div className="text-xs font-bold">Day {reward.day}</div>
                <div className="text-xl mb-1">
                  {reward.claimed
                    ? "✅"
                    : index < userStats.dailyStreak
                      ? "🎁"
                      : "📦"}
                </div>
                <div className="text-xs">{reward.xp} XP</div>
                <div className="text-xs">{reward.verm} VERM</div>
                {reward.specialReward && (
                  <div className="text-xs text-cyber-orange">
                    {reward.specialReward}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-300 mb-2">
              Current Streak: {userStats.dailyStreak} days
            </div>
            <div className="text-xs text-cyber-orange">
              Streak Multiplier: x
              {Math.min(Math.floor(userStats.dailyStreak / 7) + 1, 5)}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Achievements */}
      <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5 interactive-card">
        <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-6 flex items-center gap-2">
          <Star className="w-5 h-5" />
          ACHIEVEMENTS
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 border text-center transition-all duration-300 achievement-badge ${
                achievement.unlocked
                  ? `border-cyber-green bg-cyber-green/10 ${
                      achievement.rarity === "legendary"
                        ? "shadow-glow-purple"
                        : achievement.rarity === "epic"
                          ? "shadow-glow-blue"
                          : achievement.rarity === "rare"
                            ? "shadow-glow-green"
                            : ""
                    }`
                  : "border-gray-600 bg-gray-800/50 opacity-50"
              }`}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h4
                className={`font-bold text-sm mb-1 ${
                  achievement.rarity === "legendary"
                    ? "text-cyber-purple"
                    : achievement.rarity === "epic"
                      ? "text-cyber-blue"
                      : achievement.rarity === "rare"
                        ? "text-cyber-orange"
                        : "text-cyber-green"
                }`}
              >
                {achievement.title}
              </h4>
              <p className="text-gray-300 text-xs mb-2">
                {achievement.description}
              </p>
              <div
                className={`text-xs px-2 py-1 rounded ${
                  achievement.rarity === "legendary"
                    ? "bg-cyber-purple/20 text-cyber-purple"
                    : achievement.rarity === "epic"
                      ? "bg-cyber-blue/20 text-cyber-blue"
                      : achievement.rarity === "rare"
                        ? "bg-cyber-orange/20 text-cyber-orange"
                        : "bg-cyber-green/20 text-cyber-green"
                }`}
              >
                {achievement.rarity.toUpperCase()}
              </div>
              {achievement.unlocked && achievement.date && (
                <div className="text-gray-400 text-xs mt-1">
                  {achievement.date.toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderScannerView = () => {
    const selectedNetworkData = SUPPORTED_NETWORKS.find(
      (n) => n.id === selectedNetwork,
    );

    return (
      <div className="space-y-8">
        {/* Streamlined Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F0afef2519f0441318cbf9f55d295b37d%2Fbddcf83b231449fda8c2ae5f6dd01e48?format=webp&width=800"
              alt="NimRev Logo"
              className="w-16 h-16 mr-4 neon-glow rounded-xl opacity-90"
              style={{
                background: "transparent",
                filter: "drop-shadow(0 0 8px rgba(0, 255, 136, 0.4))",
              }}
            />
            <div>
              <h1 className="text-3xl lg:text-4xl font-cyber font-black text-cyber-green neon-glow">
                ENTERPRISE SCANNER
              </h1>
              <div className="text-sm text-cyber-blue font-mono opacity-80">
                Multi-Chain Security Analysis
              </div>
            </div>
          </div>

          {/* Compact Safety Notice */}
          <div className="bg-cyber-green/5 border border-cyber-green/20 rounded px-4 py-2 mb-4 inline-block">
            <span className="text-xs font-mono text-cyber-green">
              🛡️ DYOR • Independent Verification Required
            </span>
          </div>
        </div>

        {/* Simplified Action Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={openAnalytics}
            className="px-4 py-2 bg-cyber-green/10 border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/20 transition-all duration-200 font-mono text-sm rounded"
          >
            📊 Analytics
          </button>
          <button
            onClick={quickScan}
            className="px-4 py-2 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-dark-bg transition-all duration-200 font-mono text-sm font-bold rounded"
          >
            🎯 Quick Scan
          </button>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="px-4 py-2 bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20 transition-all duration-200 font-mono text-sm rounded"
          >
            ⭐ Premium
          </button>
        </div>

        {/* Compact Network Selection */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-sm font-mono text-gray-400">Network:</span>
          <div className="flex gap-2">
            {SUPPORTED_NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network.id)}
                className={`px-3 py-1 text-sm font-mono rounded transition-all duration-200 ${
                  selectedNetwork === network.id
                    ? "bg-gray-500/20 text-gray-300 border border-gray-500/50"
                    : "bg-gray-800/50 text-gray-400 border border-gray-600/30 hover:border-gray-500/50 hover:text-gray-300"
                } ${isScanning ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                disabled={isScanning}
              >
                <span className="mr-1">{network.icon}</span>
                {network.name}
              </button>
            ))}
          </div>
        </div>

        {/* Streamlined Scanner Interface */}
        <div className="max-w-4xl mx-auto">
          {/* Main Scanner Input */}
          <div className="border border-cyber-green/30 p-6 bg-cyber-green/5 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-cyber font-bold text-cyber-green">
                Token Scanner
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-cyber-green">LIVE</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Token Address ({selectedNetworkData?.name})
                </label>
                <div className="relative">
                  <input
                    id="scan-address-input"
                    type="text"
                    value={scanAddress}
                    onChange={(e) => setScanAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-200 rounded"
                    placeholder={`Enter ${selectedNetworkData?.name} address...`}
                    disabled={isScanning}
                  />
                  {scanAddress.trim() && scanAddress.length > 20 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => performScan(false)}
                  disabled={isScanning || !scanAddress.trim()}
                  className={`flex-1 px-4 py-3 font-mono font-bold transition-all duration-200 rounded ${
                    isScanning
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : !scanAddress.trim()
                        ? "bg-cyber-green/10 border border-cyber-green/30 text-cyber-green/50 cursor-not-allowed"
                        : "bg-cyber-green/20 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-dark-bg"
                  }`}
                >
                  {isScanning && !isConfirmationScan ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full animate-spin mr-2"></div>
                      Scanning...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Scan Token
                    </div>
                  )}
                </button>

                <button
                  onClick={() => performScan(true)}
                  disabled={isScanning || !scanResult}
                  className={`px-4 py-3 font-mono font-bold transition-all duration-200 rounded ${
                    isScanning || !scanResult
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-cyber-orange/20 border border-cyber-orange text-cyber-orange hover:bg-cyber-orange hover:text-dark-bg"
                  }`}
                >
                  {isScanning && isConfirmationScan ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-cyber-orange border-t-transparent rounded-full animate-spin mr-2"></div>
                      Confirming...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Confirm
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Scanner Status */}
            {isScanning && (
              <div className="border border-cyber-blue/30 p-4 bg-cyber-blue/5 rounded-lg mt-4">
                <div className="text-center">
                  <div className="text-lg font-cyber font-bold text-cyber-blue mb-2">
                    {isConfirmationScan
                      ? "Confirmation Scan"
                      : "Analyzing Token"}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">
                    {scanAddress.slice(0, 8)}...{scanAddress.slice(-8)}
                  </div>
                </div>
              </div>
            )}

            {/* Scan Results */}
            {scanResult && (
              <div className="border border-cyber-purple/30 p-4 bg-cyber-purple/5 rounded-lg mt-4">
                <h4 className="text-lg font-cyber font-bold text-cyber-purple mb-3">
                  Scan Results
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Risk Score:</span>
                    <span
                      className={`ml-2 font-bold ${
                        scanResult.riskScore > 70
                          ? "text-red-400"
                          : scanResult.riskScore > 40
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {scanResult.riskScore}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Holders:</span>
                    <span className="ml-2 text-white">
                      {scanResult.holders.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Market Cap:</span>
                    <span className="ml-2 text-white">
                      ${scanResult.marketCap.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">LP Burned:</span>
                    <span
                      className={`ml-2 font-bold ${scanResult.securityChecks.lpBurned ? "text-green-400" : "text-red-400"}`}
                    >
                      {scanResult.securityChecks.lpBurned ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-dark-bg/50 rounded border">
                  <div className="text-xs text-gray-400 mb-1">Analysis:</div>
                  <div className="text-sm text-gray-300">
                    {scanResult.verminAnalysis.recommendation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="high" animated={true} />
      <CyberNav />

      {/* Achievement Notification */}
      {showAchievementNotification && (
        <div className="fixed top-4 right-4 z-50 bg-cyber-purple/90 backdrop-blur-sm border border-cyber-purple rounded-lg p-4 animate-slide-in-right">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cyber-purple/20 flex items-center justify-center text-2xl animate-bounce">
              {showAchievementNotification.icon}
            </div>
            <div>
              <div className="font-bold text-sm text-white">
                Achievement Unlocked!
              </div>
              <div className="text-cyber-purple font-bold">
                {showAchievementNotification.title}
              </div>
              <div className="text-xs text-gray-300">
                {showAchievementNotification.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reward Modal */}
      {showDailyReward && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-bg border border-cyber-green rounded-lg p-8 max-w-md mx-4 glass-morphism">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎁</div>
              <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-4">
                Daily Login Reward!
              </h2>
              <div className="text-gray-300 font-mono mb-6">
                Day {userStats.dailyStreak} • Streak x
                {Math.min(Math.floor(userStats.dailyStreak / 7) + 1, 5)}
              </div>

              <div className="grid grid-cols-7 gap-2 mb-6">
                {dailyLoginRewards.map((reward, index) => (
                  <button
                    key={reward.day}
                    onClick={() => claimDailyReward(index)}
                    disabled={
                      index !== userStats.dailyStreak - 1 || reward.claimed
                    }
                    className={`p-2 text-center border rounded transition-all duration-300 ${
                      index === userStats.dailyStreak - 1 && !reward.claimed
                        ? "border-cyber-green bg-cyber-green/20 text-cyber-green animate-pulse-glow cursor-pointer hover:scale-105"
                        : reward.claimed
                          ? "border-cyber-blue bg-cyber-blue/20 text-cyber-blue"
                          : "border-gray-600 bg-gray-800/50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-xs font-bold">Day {reward.day}</div>
                    <div className="text-xl mb-1">
                      {reward.claimed
                        ? "✅"
                        : index === userStats.dailyStreak - 1
                          ? "🎁"
                          : "📦"}
                    </div>
                    <div className="text-xs">{reward.xp} XP</div>
                    <div className="text-xs">{reward.verm} VERM</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowDailyReward(false)}
                className="px-6 py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green font-mono font-bold hover:bg-cyber-green hover:text-dark-bg transition-all duration-300"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-dark-bg/80 backdrop-blur-sm border-b border-cyber-purple/30">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyber-purple to-cyber-blue flex items-center justify-center font-bold text-sm animate-pulse-glow">
                {userLevel}
              </div>
              <div className="text-sm font-mono">
                <span className="text-cyber-green">Level {userLevel}</span>
                <span className="text-gray-400 ml-2">
                  • {userStats.dailyStreak} day streak 🔥
                </span>
                <span className="text-gray-400 ml-2">• {totalScans} scans</span>
              </div>
            </div>
            <div className="flex-1 bg-dark-bg/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-purple to-cyber-blue transition-all duration-1000 ease-out animate-shimmer"
                style={{
                  width: `${Math.min((userStats.xp % 1000) / 10, 100)}%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-400">
              {1000 - (userStats.xp % 1000)} XP to next level
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* View Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-dark-bg/50 rounded-lg p-1 border border-cyber-purple/30">
              <button
                onClick={() => setShowView("scanner")}
                className={`px-6 py-2 font-mono font-bold text-sm transition-all duration-300 ${
                  showView === "scanner"
                    ? "bg-cyber-green text-dark-bg rounded"
                    : "text-cyber-green hover:bg-cyber-green/20"
                }`}
              >
                🔍 SCANNER
              </button>
              <button
                onClick={() => setShowView("dashboard")}
                className={`px-6 py-2 font-mono font-bold text-sm transition-all duration-300 ${
                  showView === "dashboard"
                    ? "bg-cyber-purple text-dark-bg rounded"
                    : "text-cyber-purple hover:bg-cyber-purple/20"
                }`}
              >
                👻 DASHBOARD
              </button>
            </div>
          </div>

          {/* Render selected view */}
          {showView === "dashboard"
            ? renderDashboardView()
            : renderScannerView()}

          {/* Epic Pixel Knowledge Tree */}
          <div className="mt-12">
            <PixelKnowledgeTree
              userLevel={userLevel}
              scanCount={totalScans}
              verifiedPatterns={verifiedPatterns}
            />
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-bg border border-cyber-purple rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h2 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                Premium Features Required
              </h2>
              <div className="text-gray-300 font-mono text-sm mb-6 space-y-2">
                <p>
                  ✨ Real-time token monitoring from pump.fun & letsbonk.fun
                </p>
                <p>🔍 Automated scanning of new token launches</p>
                <p>📊 Advanced analytics and detailed reports</p>
                <p>⏰ Scheduled and timed scans</p>
                <p>💎 Hold $25+ VERM or subscribe to unlock</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="px-4 py-2 bg-gray-600 text-gray-300 font-mono rounded hover:bg-gray-500 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPremiumModal(false);
                    window.open("/staking", "_blank");
                  }}
                  className="px-4 py-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple font-mono rounded hover:bg-cyber-purple hover:text-dark-bg transition-all duration-200"
                >
                  Get Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-bg border border-cyber-green rounded-lg p-8 max-w-2xl mx-4 w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-cyber font-bold text-cyber-green">
                Scanner Analytics
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-cyber-green/30 p-4 bg-cyber-green/5 rounded">
                <div className="text-2xl font-bold text-cyber-green">
                  {userStats.totalScans}
                </div>
                <div className="text-sm text-gray-400">Total Scans</div>
              </div>
              <div className="border border-cyber-blue/30 p-4 bg-cyber-blue/5 rounded">
                <div className="text-2xl font-bold text-cyber-blue">
                  {userStats.weeklyScans}
                </div>
                <div className="text-sm text-gray-400">This Week</div>
              </div>
              <div className="border border-cyber-orange/30 p-4 bg-cyber-orange/5 rounded">
                <div className="text-2xl font-bold text-cyber-orange">
                  {userStats.monthlyScans}
                </div>
                <div className="text-sm text-gray-400">This Month</div>
              </div>
              <div className="border border-cyber-purple/30 p-4 bg-cyber-purple/5 rounded">
                <div className="text-2xl font-bold text-cyber-purple">
                  {Math.floor(userStats.totalScans * 0.15)}
                </div>
                <div className="text-sm text-gray-400">Threats Detected</div>
              </div>
            </div>

            <div className="border border-cyber-blue/30 p-4 bg-cyber-blue/5 rounded">
              <h3 className="text-lg font-bold text-cyber-blue mb-3">
                Recent Activity
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Last scan:</span>
                  <span className="text-white">
                    {scanResult ? "Just now" : "No recent scans"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Accuracy rate:</span>
                  <span className="text-cyber-green">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Login streak:</span>
                  <span className="text-cyber-orange">
                    {userStats.dailyStreak} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CookieConsent />
    </div>
  );
}
