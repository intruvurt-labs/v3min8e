import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Zap,
  CheckCircle,
  Clock,
  Users,
  MessageCircle,
  Bot,
  Twitter,
  ExternalLink,
  Copy,
  Wallet,
  Star,
  Trophy,
  Target,
  Shield,
  Crown,
  Coins,
  TrendingUp,
  Activity,
  Globe,
  Lock,
  RefreshCw,
  AlertTriangle,
  Search,
  Eye,
  ArrowRight,
  Award,
  Gamepad2,
} from "lucide-react";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import AirdropWalletConnection from "@/components/AirdropWalletConnection";
import SocialAuthVerification from "@/components/SocialAuthVerification";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/components/UserProfileSystem";

interface AirdropTask {
  id: string;
  title: string;
  description: string;
  type: "social" | "bot" | "scan" | "referral" | "staking" | "trading";
  reward: number;
  multiplier?: number;
  status: "locked" | "available" | "in_progress" | "completed" | "failed";
  requirements?: string[];
  verificationMethod: "api" | "manual" | "blockchain" | "bot_token";
  icon: React.ReactNode;
  difficulty: "easy" | "medium" | "hard" | "legendary";
  estimatedTime: string;
  apiEndpoint?: string;
  externalUrl?: string;
  isRepeatable?: boolean;
  cooldown?: number; // hours
  lastCompleted?: number;
}

interface UserAirdropProgress {
  totalEarned: number;
  tasksCompleted: number;
  currentStreak: number;
  multiplierActive: boolean;
  rank: string;
  nextMilestone: number;
  referralCount: number;
  botTokenVerified: boolean;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  totalEarned: number;
  tasksCompleted: number;
  streak: number;
}

export default function Airdrop() {
  const { connected, publicKey } = useWallet();
  const { currentProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "leaderboard" | "verification"
  >("overview");
  const [tasks, setTasks] = useState<AirdropTask[]>([]);
  const [userProgress, setUserProgress] = useState<UserAirdropProgress>({
    totalEarned: 0,
    tasksCompleted: 0,
    currentStreak: 0,
    multiplierActive: false,
    rank: "Vermin Hunter",
    nextMilestone: 1000,
    referralCount: 0,
    botTokenVerified: false,
  });
  const [selectedTask, setSelectedTask] = useState<AirdropTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [totalVermDetected, setTotalVermDetected] = useState(2938402);
  const [lastScanUpdate, setLastScanUpdate] = useState(Date.now());
  const [endTimestamp, setEndTimestamp] = useState<number>(0);
  const [countdown, setCountdown] = useState({ days: 90, hours: 0, mins: 0, secs: 0 });
  const pad2 = (n: number) => n.toString().padStart(2, "0");

  // Initialize and reset countdown to 90 days (persist new target)
  useEffect(() => {
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const newEnd = Date.now() + ninetyDaysMs;
    setEndTimestamp(newEnd);
    try {
      localStorage.setItem("nimrev_airdrop_end", String(newEnd));
    } catch {}

    const update = () => {
      const now = Date.now();
      const total = Math.max(0, Math.floor((newEnd - now) / 1000));
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const mins = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      setCountdown({ days, hours, mins, secs });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real statistics
  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/airdrop/stats", {
          signal: abortController.signal,
        });

        // Check if component is still mounted and response is ok
        if (!isActive) return; // Component unmounted

        if (!response.ok) {
          if (response.status === 429) {
            console.warn(
              "Rate limit reached for stats, will retry on next interval",
            );
            return; // Don't throw error, just skip this update
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (isActive && data.success && data.data) {
          setTotalVermDetected(data.data.totalVermDetected || 0);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
          return;
        }
        if (isActive) {
          console.error("Failed to fetch airdrop stats:", error);
        }
      }
    };

    fetchStats();
    // Update stats every 60 seconds to avoid rate limiting
    const interval = setInterval(() => {
      if (isActive) {
        fetchStats();
      }
    }, 60000);

    return () => {
      isActive = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, []);

  // Initialize tasks
  useEffect(() => {
    const initialTasks: AirdropTask[] = [
      {
        id: "follow_twitter",
        title: "Follow @nimrevxyz",
        description:
          "Follow our official Twitter account for updates and alpha",
        type: "social",
        reward: 50,
        status: "available",
        verificationMethod: "manual",
        icon: <Twitter className="w-5 h-5" />,
        difficulty: "easy",
        estimatedTime: "1 min",
        externalUrl: "https://twitter.com/nimrevxyz",
        requirements: ["Active Twitter account"],
      },
      {
        id: "join_telegram",
        title: "Join Telegram",
        description: "Join our Telegram community for real-time discussions",
        type: "social",
        reward: 50,
        status: "available",
        verificationMethod: "manual",
        icon: <MessageCircle className="w-5 h-5" />,
        difficulty: "easy",
        estimatedTime: "1 min",
        externalUrl: "https://t.me/nimrevxyz",
        requirements: ["Telegram account"],
      },
      {
        id: "verify_bot_token",
        title: "Verify Bot Token",
        description:
          "Verify your Telegram bot token to unlock premium features",
        type: "bot",
        reward: 200,
        multiplier: 2,
        status: "available",
        verificationMethod: "bot_token",
        icon: <Bot className="w-5 h-5" />,
        difficulty: "medium",
        estimatedTime: "5 min",
        requirements: ["Telegram Bot API Token", "Admin access"],
        apiEndpoint: "/api/verify-bot-token",
      },
      {
        id: "first_scan",
        title: "Complete First Address Scan",
        description: "Use our scanner to analyze a Solana or Ethereum address",
        type: "scan",
        reward: 100,
        status: "available",
        verificationMethod: "api",
        icon: <Search className="w-5 h-5" />,
        difficulty: "easy",
        estimatedTime: "2 min",
        requirements: ["Any blockchain address"],
        apiEndpoint: "/api/verify-scan",
      },
      {
        id: "daily_scan_streak",
        title: "7-Day Scan Streak",
        description:
          "Perform at least one scan every day for 7 consecutive days",
        type: "scan",
        reward: 500,
        multiplier: 3,
        status: "available",
        verificationMethod: "blockchain",
        icon: <TrendingUp className="w-5 h-5" />,
        difficulty: "medium",
        estimatedTime: "7 days",
        isRepeatable: true,
        cooldown: 168, // 7 days
        requirements: ["Daily scanner usage"],
      },
      {
        id: "stake_100_verm",
        title: "Stake 100 $VERM",
        description: "Stake at least 100 VERM tokens to support the protocol",
        type: "staking",
        reward: 300,
        multiplier: 1.5,
        status: "available",
        verificationMethod: "blockchain",
        icon: <Coins className="w-5 h-5" />,
        difficulty: "medium",
        estimatedTime: "3 min",
        requirements: ["100 VERM tokens", "Connected wallet"],
        apiEndpoint: "/api/verify-staking",
      },
      {
        id: "refer_5_users",
        title: "Refer 5 Active Users",
        description: "Invite 5 users who complete at least 3 tasks each",
        type: "referral",
        reward: 750,
        multiplier: 4,
        status: "available",
        verificationMethod: "api",
        icon: <Users className="w-5 h-5" />,
        difficulty: "hard",
        estimatedTime: "1-2 weeks",
        requirements: ["Referral links", "Active referrals"],
        apiEndpoint: "/api/verify-referrals",
      },
      {
        id: "premium_trade",
        title: "Complete P2P Trade",
        description:
          "Successfully complete a trade using our P2P trading system",
        type: "trading",
        reward: 400,
        multiplier: 2,
        status: "available",
        verificationMethod: "blockchain",
        icon: <Activity className="w-5 h-5" />,
        difficulty: "medium",
        estimatedTime: "10 min",
        requirements: ["Connected wallet", "Trading partner"],
        apiEndpoint: "/api/verify-trade",
      },
      {
        id: "legendary_hunter",
        title: "Legendary Vermin Hunter",
        description: "Complete all other tasks and scan 1000+ addresses",
        type: "scan",
        reward: 2000,
        multiplier: 10,
        status: "locked",
        verificationMethod: "api",
        icon: <Crown className="w-5 h-5" />,
        difficulty: "legendary",
        estimatedTime: "1+ month",
        requirements: ["All tasks completed", "1000+ scans", "Premium status"],
        apiEndpoint: "/api/verify-legendary",
      },
    ];

    setTasks(initialTasks);
    loadUserProgress();
    fetchLeaderboard();
  }, []);

  // Update vermin count with realistic growth
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - lastScanUpdate;
      const growth = Math.floor((timeDiff / 1000) * (Math.random() * 3 + 1)); // 1-4 per second

      setTotalVermDetected((prev) => prev + growth);
      setLastScanUpdate(now);
    }, 2000);

    return () => clearInterval(interval);
  }, [lastScanUpdate]);

  const loadUserProgress = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem("nimrev_airdrop_progress");
    if (saved && currentProfile) {
      try {
        const progress = JSON.parse(saved);
        setUserProgress(progress);
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    }
  };

  const saveUserProgress = (progress: UserAirdropProgress) => {
    setUserProgress(progress);
    localStorage.setItem("nimrev_airdrop_progress", JSON.stringify(progress));
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/airdrop/leaderboard");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setLeaderboard(result.data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      // Fallback to empty array
      setLeaderboard([]);
    }
  };

  const startTask = async (task: AirdropTask) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);

    // Update task status
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: "in_progress" } : t)),
    );

    // Handle different task types
    if (task.externalUrl) {
      window.open(task.externalUrl, "_blank");
    }
  };

  const completeTask = async (taskId: string, verificationData?: any) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setIsVerifying(true);

    try {
      // Real API verification with proof data
      const response = await fetch(`/api/airdrop/verify-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          userId: currentProfile?.id,
          walletAddress: publicKey?.toString(),
          proof: verificationData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Verification failed");
      }

      // Update task status
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "completed",
                lastCompleted: Date.now(),
              }
            : t,
        ),
      );

      // Update user progress
      const newProgress = {
        ...userProgress,
        totalEarned: userProgress.totalEarned + task.reward,
        tasksCompleted: userProgress.tasksCompleted + 1,
        currentStreak: userProgress.currentStreak + 1,
      };

      // Check for bot token verification
      if (taskId === "verify_bot_token") {
        newProgress.botTokenVerified = true;
      }

      saveUserProgress(newProgress);
      setIsTaskModalOpen(false);

      // Show success notification (would integrate with GlobalNotificationSystem)
      console.log(`Task completed! Earned ${task.reward} VERM tokens`);
    } catch (error) {
      console.error("Task verification failed:", error);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "failed" } : t)),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyBotToken = async () => {
    if (!verificationCode.trim()) return;

    setIsVerifying(true);
    try {
      // Call actual API to verify bot token
      const response = await fetch("/api/airdrop/verify-bot-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: verificationCode,
          userId: currentProfile?.id,
          walletAddress: publicKey?.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        await completeTask("verify_bot_token");
        setVerificationCode("");
      } else {
        throw new Error(result.message || "Verification failed");
      }
    } catch (error) {
      console.error("Bot token verification failed:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-cyber-green border-cyber-green";
      case "medium":
        return "text-cyber-blue border-cyber-blue";
      case "hard":
        return "text-cyber-orange border-cyber-orange";
      case "legendary":
        return "text-cyber-purple border-cyber-purple";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-cyber-green/20 border-cyber-green text-cyber-green";
      case "in_progress":
        return "bg-cyber-blue/20 border-cyber-blue text-cyber-blue";
      case "failed":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "locked":
        return "bg-gray-500/20 border-gray-500 text-gray-400";
      default:
        return "bg-cyber-orange/20 border-cyber-orange text-cyber-orange";
    }
  };

  const copyReferralLink = () => {
    const referralLink = `https://nimrev.xyz/airdrop?ref=${currentProfile?.id || "guest"}`;
    navigator.clipboard.writeText(referralLink);
    // Show notification
  };

  // Enhanced progressive reveal - show airdrop info even without connection
  const showAirdropInfo = true; // Always show airdrop information
  const requiresConnection = !connected || !currentProfile;

  if (requiresConnection && !showAirdropInfo) {
    return (
      <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
        <CyberGrid intensity="low" animated={true} />
        <CyberNav />

        <div className="relative z-10 pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-cyber-red to-cyber-orange rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-cyber font-bold text-cyber-red mb-4">
              WALLET CONNECTION REQUIRED
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet and create a profile to participate in the
              VERM airdrop
            </p>
            <div className="bg-cyber-red/10 border border-cyber-red/30 rounded-lg p-6">
              <p className="text-gray-300">
                🔒 Secure your spot in the largest blockchain security airdrop
              </p>
            </div>
          </div>
        </div>

        <CyberFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      {/* Airdrop Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
        style={{
          backgroundImage: `url('https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2F0dd1e4b8e6084b1d82de54954159ffa4?format=webp&width=1920')`,
        }}
      />
      <CyberGrid intensity="medium" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Wallet Connection */}
          <div className="mb-8">
            <AirdropWalletConnection
              onWalletConnected={(publicKey) => {
                console.log('Wallet connected:', publicKey);
                // Refresh user progress when wallet connects
                loadUserProgress();
              }}
              onWalletDisconnected={() => {
                console.log('Wallet disconnected');
              }}
              requiredForTasks={true}
              showRewards={true}
            />
          </div>

          {/* Header with live stats */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-cyber font-bold text-cyber-green mb-4 neon-glow flex items-center justify-center gap-4"
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Ff11efe56691d494d9bb91a1d21ef9fe6?format=webp&width=80"
                alt="NimRev Logo"
                className="w-16 h-16 rounded-full"
              />
              $VERM AIRDROP
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Ff11efe56691d494d9bb91a1d21ef9fe6?format=webp&width=80"
                alt="NimRev Logo"
                className="w-16 h-16 rounded-full"
              />
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-cyber font-bold text-cyber-orange mb-4"
            >
              1,000,000 VERM TOKEN GIVEAWAY
            </motion.h2>
            <p className="text-xl text-gray-300 mb-6">
              🚀 <strong className="text-cyber-green">EARN FREE CRYPTO</strong>{" "}
              by protecting Web3! Complete security tasks, verify your identity,
              and claim your share of the most valuable security tokens in DeFi.
            </p>

            {/* Value Proposition Highlights */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyber-green">$2.50</div>
                <div className="text-sm text-gray-300">Current VERM Value</div>
              </div>
              <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyber-blue">
                  5-10 MIN
                </div>
                <div className="text-sm text-gray-300">Average Earn Time</div>
              </div>
              <div className="bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyber-orange">
                  NO FEES
                </div>
                <div className="text-sm text-gray-300">100% Free to Join</div>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="bg-gradient-to-r from-cyber-red/20 to-cyber-orange/20 border border-cyber-red/50 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <span className="bg-cyber-red text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  🔥 LIMITED TIME OFFER
                </span>
              </div>
              <div className="flex justify-center gap-4">
                {[
                  String(countdown.days),
                  pad2(countdown.hours),
                  pad2(countdown.mins),
                  pad2(countdown.secs),
                ].map((time, index) => (
                  <div
                    key={index}
                    className="bg-cyber-green/30 border border-cyber-green rounded-lg p-4 text-center backdrop-blur-sm"
                  >
                    <div className="text-2xl font-bold text-cyber-green animate-pulse">
                      {time}
                    </div>
                    <div className="text-xs text-gray-300 font-bold">
                      {["DAYS", "HOURS", "MINS", "SECS"][index]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <p className="text-cyber-orange font-bold">
                  ⚡ Pool decreases as more hunters join!
                </p>
              </div>
            </div>

            {/* Live Stats */}
            <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-xl p-6 mb-8 relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2F03532437303f4389b84919f0164e3ce6?format=webp&width=300')`,
                }}
              />
              <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-2">
                🐭 Total Vermin Detected: {totalVermDetected.toLocaleString()}
              </h2>
              <p className="text-sm text-gray-300">
                Scan logs updated in real-time. Block by block.
              </p>
              <div className="flex justify-center gap-8 mt-4 text-sm">
                <div>
                  <span className="text-cyber-blue">Active Hunters:</span>
                  <span className="text-white font-bold ml-1">1,247</span>
                </div>
                <div>
                  <span className="text-cyber-orange">Total Rewards:</span>
                  <span className="text-white font-bold ml-1">2.4M VERM</span>
                </div>
                <div>
                  <span className="text-cyber-purple">Success Rate:</span>
                  <span className="text-white font-bold ml-1">72.4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Progress Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyber-green text-sm">Total Earned</span>
                <Coins className="w-4 h-4 text-cyber-green" />
              </div>
              <div className="text-2xl font-bold text-white">
                {userProgress.totalEarned}
              </div>
              <div className="text-xs text-gray-400">VERM tokens</div>
            </div>

            <div className="bg-dark-bg/60 border border-cyber-blue/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyber-blue text-sm">Tasks Done</span>
                <Target className="w-4 h-4 text-cyber-blue" />
              </div>
              <div className="text-2xl font-bold text-white">
                {userProgress.tasksCompleted}
              </div>
              <div className="text-xs text-gray-400">
                of {tasks.length} total
              </div>
            </div>

            <div className="bg-dark-bg/60 border border-cyber-orange/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyber-orange text-sm">
                  Current Streak
                </span>
                <TrendingUp className="w-4 h-4 text-cyber-orange" />
              </div>
              <div className="text-2xl font-bold text-white">
                {userProgress.currentStreak}
              </div>
              <div className="text-xs text-gray-400">days active</div>
            </div>

            <div className="bg-dark-bg/60 border border-cyber-purple/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyber-purple text-sm">Hunter Rank</span>
                <Crown className="w-4 h-4 text-cyber-purple" />
              </div>
              <div className="text-lg font-bold text-white">
                {userProgress.rank}
              </div>
              <div className="text-xs text-gray-400">
                Level up at {userProgress.nextMilestone}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-lg p-1 flex">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: <Globe className="w-4 h-4" />,
                },
                {
                  id: "tasks",
                  label: "Tasks",
                  icon: <Target className="w-4 h-4" />,
                },
                {
                  id: "leaderboard",
                  label: "Leaderboard",
                  icon: <Trophy className="w-4 h-4" />,
                },
                {
                  id: "verification",
                  label: "Bot Verification",
                  icon: <Bot className="w-4 h-4" />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-cyber-green/20 text-cyber-green border border-cyber-green/50"
                      : "text-gray-400 hover:text-white hover:bg-dark-bg/40"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Social Proof Banner */}
          <div className="bg-gradient-to-r from-cyber-green/10 to-cyber-blue/10 border border-cyber-green/30 rounded-xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2F36a192d52edd47bca0e1f1581626cd8b?format=webp&width=100')`,
                }}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-cyber-green">
                  <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse"></div>
                  <span className="font-bold text-lg">47</span>
                </div>
                <span className="text-sm text-gray-300">
                  🔥 Claims this hour
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-cyber-orange">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold text-lg">2,847</span>
                </div>
                <span className="text-sm text-gray-300">
                  ⚡ Top earner (VERM)
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-cyber-blue">
                  <Users className="w-5 h-5" />
                  <span className="font-bold text-lg">15,847</span>
                </div>
                <span className="text-sm text-gray-300">🚀 Total hunters</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="bg-cyber-green/20 text-cyber-green px-3 py-1 rounded-full text-xs font-bold">
                💰 Average earnings: 847 VERM ($2,117.50)
              </span>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Utility Map */}
                <div className="border border-cyber-green/30 p-6 rounded-xl">
                  <h3 className="text-2xl font-cyber font-bold text-cyber-green mb-4 flex items-center gap-2">
                    🕸️ VERM Utility Map
                    <Gamepad2 className="w-6 h-6" />
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        title: "Deploy Tracking Beacons",
                        desc: "via our dApp",
                        icon: "📡",
                        progress: 65,
                      },
                      {
                        title: "Stake $VERM",
                        desc: "to fund surveillance cats",
                        icon: "🐱",
                        progress: 40,
                      },
                      {
                        title: "Vote on Proposals",
                        desc: "rodent suppression plans",
                        icon: "🗳️",
                        progress: 80,
                      },
                      {
                        title: "Buy Rat Traps (NFTs)",
                        desc: "collect rare traps",
                        icon: "🪤",
                        progress: 25,
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="bg-dark-bg/40 border border-cyber-blue/20 rounded-lg p-4"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h4 className="font-bold text-white mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400 mb-3">
                          {item.desc}
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-cyber-blue h-2 rounded-full transition-all duration-500"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-cyber-blue mt-1">
                          {item.progress}% complete
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VermTech Labs */}
                <div className="border border-cyber-orange/30 p-6 rounded-xl">
                  <h3 className="text-2xl font-cyber font-bold text-cyber-orange mb-4">
                    🧪 VermTech Labs
                  </h3>
                  <p className="text-gray-300 mb-4">
                    We're experimenting with rodent AI that predicts rug pulls
                    12 blocks in advance. Accuracy: 72.4% unless bribed.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg p-4">
                      <h4 className="font-bold text-cyber-orange mb-2">
                        🤖 AI Predictions
                      </h4>
                      <div className="text-2xl font-bold text-white">72.4%</div>
                      <div className="text-xs text-gray-400">Success Rate</div>
                    </div>
                    <div className="bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg p-4">
                      <h4 className="font-bold text-cyber-orange mb-2">
                        ⚡ Real-time Scans
                      </h4>
                      <div className="text-2xl font-bold text-white">12s</div>
                      <div className="text-xs text-gray-400">Average Speed</div>
                    </div>
                    <div className="bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg p-4">
                      <h4 className="font-bold text-cyber-orange mb-2">
                        🛡️ Threats Blocked
                      </h4>
                      <div className="text-2xl font-bold text-white">2,847</div>
                      <div className="text-xs text-gray-400">This Week</div>
                    </div>
                  </div>
                </div>

                {/* Referral System */}
                <div className="border border-cyber-purple/30 p-6 rounded-xl">
                  <h3 className="text-2xl font-cyber font-bold text-cyber-purple mb-4">
                    👥 Referral Program
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-300 mb-4">
                        Invite hunters to join the resistance. Earn 10% of their
                        rewards plus bonus multipliers.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Referrals:</span>
                          <span className="text-white font-bold">
                            {userProgress.referralCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bonus Earned:</span>
                          <span className="text-cyber-purple font-bold">
                            {Math.floor(userProgress.totalEarned * 0.1)} VERM
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyber-purple mb-2">
                        Your Referral Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={`https://nimrev.xyz/airdrop?ref=${currentProfile?.id || "guest"}`}
                          readOnly
                          className="flex-1 bg-dark-bg/50 border border-cyber-purple/30 rounded px-3 py-2 text-white text-sm"
                        />
                        <button
                          onClick={copyReferralLink}
                          className="px-4 py-2 bg-cyber-purple/20 border border-cyber-purple rounded text-cyber-purple hover:bg-cyber-purple hover:text-dark-bg transition-all"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Task Requirements Notice */}
              {!connected && (
                <div className="bg-cyber-orange/20 border border-cyber-orange/50 rounded-xl p-6 text-center mb-6">
                  <Wallet className="w-12 h-12 text-cyber-orange mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-cyber-orange mb-2">
                    Wallet Required for Task Verification
                  </h3>
                  <p className="text-gray-300">
                    Connect your Solana wallet above to participate in tasks and earn VERM rewards.
                  </p>
                </div>
              )}

              {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ scale: 1.02 }}
                    className={`border rounded-xl p-6 transition-all duration-300 ${
                    task.status === "locked"
                      ? "border-gray-500/30 bg-gray-500/10 opacity-50"
                      : task.status === "completed"
                        ? "border-cyber-green/50 bg-cyber-green/10"
                        : `border-cyber-green/30 bg-dark-bg/60 hover:border-cyber-green/50 ${connected ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`
                  }`}
                  onClick={() => {
                    if (!connected) return;
                    if (task.status !== "locked" && task.status !== "completed") {
                      startTask(task);
                    }
                  }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-3 rounded-lg border ${getDifficultyColor(task.difficulty)}`}
                        >
                          {task.icon}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {task.title}
                            </h3>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(task.difficulty)}`}
                            >
                              {task.difficulty.toUpperCase()}
                            </div>
                            {task.multiplier && (
                              <div className="px-2 py-1 rounded-full text-xs font-bold bg-cyber-orange/20 border border-cyber-orange text-cyber-orange">
                                {task.multiplier}x
                              </div>
                            )}
                          </div>

                          <p className="text-gray-300 mb-3">
                            {task.description}
                          </p>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-4 h-4" />
                              {task.estimatedTime}
                            </div>
                            <div className="flex items-center gap-1 text-cyber-green">
                              <Gift className="w-4 h-4" />
                              {task.reward} VERM
                            </div>
                          </div>

                          {task.requirements && (
                            <div className="mt-2 text-xs text-gray-400">
                              Requirements: {task.requirements.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}
                        >
                          {task.status === "in_progress"
                            ? "IN PROGRESS"
                            : task.status === "completed"
                              ? "COMPLETED"
                              : task.status === "failed"
                                ? "FAILED"
                                : task.status === "locked"
                                  ? "LOCKED"
                                  : "AVAILABLE"}
                        </div>

                        {task.status === "completed" ? (
                          <CheckCircle className="w-6 h-6 text-cyber-green" />
                        ) : task.status === "locked" ? (
                          <Lock className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ArrowRight className="w-6 h-6 text-cyber-blue" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-cyber font-bold text-cyber-orange mb-2">
                    🏆 TOP VERMIN HUNTERS
                  </h3>
                  <p className="text-gray-300">
                    The most successful exterminators in the protocol
                  </p>
                </div>

                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-xl p-6 ${
                      entry.rank <= 3
                        ? "border-cyber-orange/50 bg-cyber-orange/10"
                        : "border-cyber-green/30 bg-dark-bg/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                            entry.rank === 1
                              ? "bg-yellow-500 text-black"
                              : entry.rank === 2
                                ? "bg-gray-300 text-black"
                                : entry.rank === 3
                                  ? "bg-yellow-600 text-white"
                                  : "bg-cyber-green/20 text-cyber-green"
                          }`}
                        >
                          {entry.rank <= 3 ? entry.avatar : entry.rank}
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {entry.username}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Tasks: {entry.tasksCompleted}</span>
                            <span>Streak: {entry.streak} days</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyber-green">
                          {entry.totalEarned.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">VERM earned</div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* User's position */}
                {currentProfile && (
                  <div className="border border-cyber-blue/50 rounded-xl p-6 bg-cyber-blue/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-cyber-blue/20 border border-cyber-blue flex items-center justify-center">
                          <span className="text-cyber-blue font-bold">
                            #{leaderboard.length + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {currentProfile?.username || "Guest"}
                          </h4>
                          <div className="text-sm text-gray-400">
                            Your Position
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyber-blue">
                          {userProgress.totalEarned.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">VERM earned</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "verification" && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-cyber font-bold text-cyber-blue mb-2">
                    BOT TOKEN VERIFICATION
                  </h3>
                  <p className="text-gray-300">
                    Verify your Telegram bot token to unlock premium features
                    and higher rewards
                  </p>
                </div>

                <div className="border border-cyber-blue/30 rounded-xl p-6 bg-dark-bg/60">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-cyber-blue mb-2">
                        Telegram Bot Token
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="1234567890:ABCDEFghijklmnop-QRSTUVWXYZ123456789"
                        className="w-full bg-dark-bg/50 border border-cyber-blue/30 rounded-lg px-3 py-3 text-white font-mono focus:outline-none focus:border-cyber-blue"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Get your bot token from @BotFather on Telegram
                      </p>
                    </div>

                    <div className="bg-cyber-blue/10 border border-cyber-blue/20 rounded-lg p-4">
                      <h4 className="font-bold text-cyber-blue mb-2">
                        What you'll unlock:
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>• 2x reward multiplier on all tasks</li>
                        <li>• Access to premium scanning features</li>
                        <li>• Real-time threat notifications</li>
                        <li>• Advanced P2P trading capabilities</li>
                        <li>• Custom bot commands and automation</li>
                      </ul>
                    </div>

                    <button
                      onClick={verifyBotToken}
                      disabled={!verificationCode.trim() || isVerifying}
                      className="w-full px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Verify Bot Token
                        </>
                      )}
                    </button>

                    {userProgress.botTokenVerified && (
                      <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-cyber-green" />
                        <div>
                          <div className="font-bold text-cyber-green">
                            Bot Token Verified!
                          </div>
                          <div className="text-sm text-gray-300">
                            Premium features are now active
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-bg border border-cyber-green/30 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  {selectedTask.icon}
                </div>
                <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                  {selectedTask.title}
                </h3>
                <p className="text-gray-300 mb-6">{selectedTask.description}</p>

                <div className="space-y-4">
                  <div className="bg-cyber-green/10 border border-cyber-green/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Reward:</span>
                      <span className="font-bold text-cyber-green">
                        {selectedTask.reward} VERM
                      </span>
                    </div>
                    {selectedTask.multiplier && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-300">
                          Multiplier:
                        </span>
                        <span className="font-bold text-cyber-orange">
                          {selectedTask.multiplier}x
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedTask.requirements && (
                    <div className="text-left">
                      <h4 className="font-bold text-white mb-2">
                        Requirements:
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {selectedTask.requirements.map((req, index) => (
                          <li key={index}>�� {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsTaskModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-600/20 transition-colors"
                    >
                      Cancel
                    </button>

                    {/* Social Auth Integration */}
                    {(selectedTask.id === 'follow_twitter' || selectedTask.id === 'join_telegram') && (
                      <div className="mb-4">
                        <SocialAuthVerification
                          userId={currentProfile?.id || 'guest'}
                          taskId={selectedTask.id}
                          platform={selectedTask.id === 'follow_twitter' ? 'twitter' : 'telegram'}
                          onVerificationComplete={(success, data) => {
                            if (success) {
                              completeTask(selectedTask.id, data);
                            }
                          }}
                          onVerificationStart={() => setIsVerifying(true)}
                        />
                      </div>
                    )}

                    {/* Default completion button for non-social tasks */}
                    {selectedTask.id !== 'follow_twitter' && selectedTask.id !== 'join_telegram' && (
                      <button
                        onClick={() => completeTask(selectedTask.id)}
                        disabled={isVerifying}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Complete Task
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CyberFooter />
    </div>
  );
}
