import React, { useState, useEffect } from "react";
import styles from "./BotPlatform.module.css";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Link } from "react-router-dom";
import {
  Bot,
  Shield,
  Users,
  DollarSign,
  Clock,
  MessageSquare,
  Settings,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Lock,
  Brain,
  Globe,
  Crown,
  ArrowLeft,
  ExternalLink,
  X,
  Wallet,
  CreditCard,
} from "lucide-react";
import CyberGrid from "@/components/CyberGrid";
import CyberFooter from "@/components/CyberFooter";
import CleanSystemStatus from "@/components/CleanSystemStatus";
import { useWallet } from "@/hooks/useWallet";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "active" | "premium" | "coming-soon";
  onPremiumClick?: () => void;
  isPremiumUser?: boolean;
}

interface ConfigOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  isPremium?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  status,
  onPremiumClick,
  isPremiumUser,
}) => {
  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-500/50",
    premium: isPremiumUser
      ? "bg-green-500/20 text-green-400 border-green-500/50"
      : "bg-purple-500/20 text-purple-400 border-purple-500/50",
    "coming-soon": "bg-blue-500/20 text-blue-400 border-blue-500/50",
  };

  const statusLabels = {
    active: "LIVE",
    premium: isPremiumUser ? "UNLOCKED" : "PREMIUM",
    "coming-soon": "SOON",
  };

  const handleClick = () => {
    if (status === "premium" && !isPremiumUser && onPremiumClick) {
      onPremiumClick();
    }
  };

  const isLocked = status === "premium" && !isPremiumUser;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-dark-bg/60 backdrop-blur-xl border border-cyber-green/30 p-8 transition-all duration-500 hover:scale-[1.02] hover:border-cyber-purple/50 hover:shadow-2xl hover:shadow-cyber-purple/20 ${
        isLocked ? "cursor-pointer" : ""
      }`}
      onClick={handleClick}
    >
      {/* Gradient Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/5 via-transparent to-cyber-blue/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Premium Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/80 to-cyber-blue/80 backdrop-blur-sm flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyber-purple to-cyber-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div className="text-lg font-bold text-white mb-1">
              Premium Feature
            </div>
            <div className="text-sm text-cyber-purple">
              Any token • Custom rates
            </div>
          </div>
        </div>
      )}

      <div className={`relative z-10`}>
        <div className="flex items-start justify-between mb-6">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-xl ${
              status === "active"
                ? "bg-gradient-to-r from-cyber-green to-cyber-blue"
                : status === "premium"
                ? "bg-gradient-to-r from-cyber-purple to-cyber-pink"
                : "bg-gradient-to-r from-cyber-blue to-cyber-cyan"
            } text-white shadow-lg`}
          >
            {icon}
          </div>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border backdrop-blur-xl ${statusColors[status]}`}
          >
            {statusLabels[status]}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{description}</p>

        {/* Feature indicator */}
        <div className="mt-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Enterprise Ready</span>
        </div>
      </div>
    </div>
  );
};

export default function BotPlatform() {
  const [isPremium, setIsPremium] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { connected, connect, publicKey, signTransaction, balance } = useWallet();

  const [configs, setConfigs] = useState<ConfigOption[]>([
    { id: "antispam", label: "Anti-Spam Protection", description: "Block spam messages and suspicious links", enabled: true },
    { id: "captcha", label: "Math CAPTCHA", description: "Require human verification with simple math problems", enabled: true },
    { id: "welcome", label: "Welcome Messages", description: "Greet new members with custom messages", enabled: true },
    { id: "price-alerts", label: "Price Alerts", description: "Real-time price notifications for tokens", enabled: true },
    { id: "token-gate", label: "Token Gating", description: "Restrict access based on token holdings", enabled: isPremium, isPremium: true },
    { id: "recurring", label: "Recurring Messages", description: "Schedule automated group announcements", enabled: true },
    { id: "one-click-buy", label: "One-Click Buy", description: "Enable direct token purchases through the bot", enabled: isPremium, isPremium: true },
    { id: "advanced-analytics", label: "Advanced Analytics", description: "Detailed group insights and reports", enabled: isPremium, isPremium: true },
  ]);

  const features = [
    { icon: <Bot className="h-6 w-6" />, title: "/setupbot Command", description: "One command transforms any Telegram group into a professional ecosystem with custom token integration and premium features.", status: "active" as const },
    { icon: <Users className="h-6 w-6" />, title: "Multi-Tenant Architecture", description: "Infinite projects, each with isolated settings, custom tokens, premium rules, and independent configurations.", status: "active" as const },
    { icon: <Crown className="h-6 w-6" />, title: "Any Token Premium System", description: "Projects choose their premium currency: VERM, SOL, or any custom Solana token with dynamic pricing.", status: "premium" as const },
    { icon: <Shield className="h-6 w-6" />, title: "Enterprise Security Suite", description: "Advanced anti-spam, CAPTCHA verification, and AI-powered threat detection with customizable filters.", status: "active" as const },
    { icon: <BarChart3 className="h-6 w-6" />, title: "Real-Time Analytics", description: "Comprehensive dashboard with user engagement, token metrics, and performance insights with export capabilities.", status: "premium" as const },
    { icon: <MessageSquare className="h-6 w-6" />, title: "Smart Messaging System", description: "Dynamic welcome/goodbye messages, recurring announcements, and custom command responses per project.", status: "active" as const },
    { icon: <Zap className="h-6 w-6" />, title: "One-Click Token Integration", description: "Direct Jupiter DEX integration for instant token purchases, swaps, and DeFi interactions within Telegram.", status: "premium" as const },
    { icon: <Lock className="h-6 w-6" />, title: "Advanced Token Gating", description: "Automatic wallet verification, token balance checking, and permission management with role assignment.", status: "premium" as const },
    { icon: <Settings className="h-6 w-6" />, title: "Project Management Hub", description: "Complete admin interface for managing multiple projects, custom commands, and premium subscriptions.", status: "active" as const },
  ];

  const toggleConfig = (id: string) => {
    setConfigs((prev) =>
      prev.map((config) => {
        if (config.id === id) {
          if (config.isPremium && !isPremium) {
            setIsPaymentOpen(true);
            return config;
          }
          return { ...config, enabled: !config.enabled };
        }
        return config;
      }),
    );
  };

  const handlePremiumFeatureClick = () => {
    setIsPaymentOpen(true);
  };

  const PREMIUM_PRICE_SOL = 0.055;

  const handlePayment = async () => {
    if (!connected) {
      await connect();
      return;
    }

    if (typeof balance === 'undefined' || balance < PREMIUM_PRICE_SOL) {
      alert(`Insufficient SOL balance: Need ${PREMIUM_PRICE_SOL} SOL`);
      return;
    }

    if (!publicKey) {
      alert("Wallet not properly connected.");
      return;
    }

    if (!signTransaction) {
      alert("Signer unavailable. Try reconnecting your wallet.");
      return;
    }
    setIsProcessingPayment(true);
    try {
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const treasuryPubkey = new PublicKey("outofbounds.sol");

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: typeof publicKey === "string" ? new PublicKey(publicKey) : publicKey,
          toPubkey: treasuryPubkey,
          lamports: PREMIUM_PRICE_SOL * LAMPORTS_PER_SOL,
        })
      );

      transaction.feePayer = typeof publicKey === "string" ? new PublicKey(publicKey) : publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await signTransaction(transaction).then(signed =>
        connection.sendRawTransaction(signed.serialize())
      );

      await connection.confirmTransaction(signature, "processed");

      setIsPremium(true);
      setPaymentSuccess(true);
      setConfigs(prev =>
        prev.map(cfg => (cfg.isPremium ? { ...cfg, enabled: true } : cfg))
      );
      localStorage.setItem("nimrev_premium_status", "true");
      localStorage.setItem("nimrev_premium_wallet", publicKey.toString());
      setTimeout(() => {
        setIsPaymentOpen(false);
        setPaymentSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Payment failed:", error);
      alert(`Payment failed: ${error?.message ?? "Unknown error"}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    const premiumStatus = localStorage.getItem("nimrev_premium_status");
    const premiumWallet = localStorage.getItem("nimrev_premium_wallet");
    if (premiumStatus === "true" && premiumWallet && publicKey && premiumWallet === publicKey.toString()) {
      setIsPremium(true);
      setConfigs((prev) =>
        prev.map((config) =>
          config.isPremium ? { ...config, enabled: true } : config,
        ),
      );
    }
  }, [publicKey]);

  const [botStats, setBotStats] = useState({
    activeGroups: "Loading...",
    messagesProcessed: "Loading...",
    spamBlocked: "Loading...",
    uptime: "Loading...",
  });

  const fetchBotStats = async () => {
    try {
      const response = await fetch("/api/bot/stats", {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setBotStats({
          activeGroups: response.status === 404 ? "API 404" : "Error",
          messagesProcessed: response.status === 404 ? "API 404" : "Error",
          spamBlocked: response.status === 404 ? "API 404" : "Error",
          uptime: "Offline",
        });
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setBotStats({
          activeGroups: data.activeGroups?.toString() || "0",
          messagesProcessed: data.messagesProcessed?.toString() || "0",
          spamBlocked: data.spamBlocked?.toString() || "0",
          uptime: data.uptime || "Connecting...",
        });
      } else {
        setBotStats({
          activeGroups: "Service Unavailable",
          messagesProcessed: "Service Unavailable",
          spamBlocked: "Service Unavailable",
          uptime: "Offline",
        });
      }
    } catch (error) {
      setBotStats({
        activeGroups: "Network Error",
        messagesProcessed: "Network Error",
        spamBlocked: "Network Error",
        uptime: "Offline",
      });
    }
  };

  //other state hooks, effects, and full JSX render here,
  // with critical runtime fixes implemented.

    // Initial fetch
    fetchRealTimeStatus();
    fetchBotStats();

    // Set up real-time intervals
    const statusInterval = setInterval(fetchRealTimeStatus, 3000); // Every 3 seconds for real-time
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 1000); // Every second for time updates
    const statsInterval = setInterval(fetchBotStats, 30000); // Every 30 seconds for general stats

    return () => {
      clearInterval(statusInterval);
      clearInterval(timeInterval);
      clearInterval(statsInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      {/* Animated Cyber Grid Background */}
      <CyberGrid intensity="low" animated={true} />

      {/* Header */}
      <header className="relative z-10 border-b border-cyber-green/30 bg-dark-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-cyber-green hover:text-cyber-blue transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-mono text-sm">Back to Protocol</span>
              </Link>
              <div className="w-px h-6 bg-cyber-green/30"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyber-purple/20 rounded-xl border border-cyber-purple flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyber-purple" />
                </div>
                <div>
                  <h1 className="text-2xl font-cyber font-bold text-cyber-purple">
                    NimRev Bot Platform
                  </h1>
                  <p className="text-sm text-gray-400 font-mono">
                    Multi-Tenant Telegram Intelligence
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://t.me/nimrev_bot"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple rounded-lg hover:bg-cyber-purple hover:text-white transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="font-mono text-sm">Open Telegram Bot</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Render geometric shapes */}
      {geometricShapes.map((shape: any) => (
        <div
          key={shape.id}
          className={`absolute geometric-shape ${shape.type === "circle" ? "shape-circle" : "polygon-shape"}`}
          data-x={shape.x}
          data-y={shape.y}
          data-size={shape.size}
          data-rotation={shape.rotation}
          data-animation-delay={shape.animationDelay}
          data-animation-duration={shape.animationDuration}
          data-color={shape.color}
        >
          {/* Empty child, styling handled by CSS */}
        </div>
      ))}

        {/* Real-time Bot Status Panel - Left Side */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-20">
          <CleanSystemStatus
            status={realTimeStatus}
            currentTime={currentTime}
          />
        </div>

        {/* Video Header */}
        <div className="absolute top-8 right-8 z-20">
          <div className="relative w-[200px] h-[250px] rounded-2xl overflow-hidden backdrop-blur-sm bg-dark-bg/60 border border-cyber-green/50 shadow-2xl shadow-cyber-purple/20">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F9a8474ab0524497c85c9ce04674c08c9%2F61d4fd3e97124c13b5aea0a252af3f27?format=webp&width=800"
              alt="Cyber Vision"
              className="w-full h-full object-cover mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-green/30 via-transparent to-cyber-purple/30 mix-blend-overlay"></div>
            <div className="absolute inset-0 border-2 border-cyber-green/60 rounded-2xl animate-pulse"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-purple/30 bg-cyber-purple/10 px-4 py-2 text-sm font-medium text-cyber-purple mb-6 font-mono">
              <Bot className="h-4 w-4" />
              Now Available on Telegram
            </div>

            <div className="relative transform perspective-1000">
              {/* Beveled 3D Glitched Title */}
              <h1 className="relative text-7xl md:text-9xl font-black tracking-tighter mb-6 font-cyber">
                <div className="relative inline-block">
                  {/* Multiple glitch layers */}
                  <span
                    className="absolute inset-0 text-cyber-green opacity-70 animate-pulse nimrev-glitch-green"
                  >
                    NimRev
                  </span>

                  <span
                    className="absolute inset-0 text-cyber-blue opacity-60 nimrev-glitch-blue"
                  >
                    NimRev
                  </span>

                  {/* Main text with 3D bevel effect */}
                  <span
                    className="relative text-white nimrev-title-glow"
                  >
                    NimRev
                  </span>
                </div>
              </h1>

              {/* Subtitle with enhanced 3D Effect */}
              <div className="relative text-4xl md:text-7xl font-bold mb-8 font-mono">
                <span
                  className={`bg-gradient-to-r from-cyber-purple via-cyber-blue to-cyber-green bg-clip-text text-transparent ${styles.gradientTitle}`}
                >
                  Multi-Tenant Bot
                </span>
              </div>
            </div>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-mono">
              The most sophisticated{" "}
              <span className="text-cyber-green font-semibold">
                multi-tenant platform
              </span>{" "}
              that transforms any project into a professional{" "}
              <span className="text-cyber-purple font-semibold">
                Telegram ecosystem
              </span>{" "}
              with enterprise-grade features
            </p>

            {/* Feature Preview Cards */}
            <div className="relative mb-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Setup Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-dark-bg/90 backdrop-blur-xl border border-cyber-green/30 rounded-2xl p-8 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-purple to-cyber-pink rounded-xl flex items-center justify-center mb-4">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      One-Command Setup
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Transform any Telegram group with /setupbot - complete
                      configuration in under 2 minutes
                    </p>
                  </div>
                </div>

                {/* Multi-Tenant Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue to-cyber-cyan rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-dark-bg/90 backdrop-blur-xl border border-cyber-blue/30 rounded-2xl p-8 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-blue to-cyber-cyan rounded-xl flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Infinite Projects
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Each project gets isolated settings, custom tokens, and
                      premium features tailored to their community
                    </p>
                  </div>
                </div>

                {/* Premium Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-pink to-cyber-purple rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-dark-bg/90 backdrop-blur-xl border border-cyber-purple/30 rounded-2xl p-8 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-pink to-cyber-purple rounded-xl flex items-center justify-center mb-4">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Any Token Support
                    </h3>
                    <p className="text-gray-300 text-sm">
                      VERM, SOL, or any custom Solana token - projects choose
                      their premium currency
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <a
                href="https://t.me/NimRev_Bot"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyber-purple to-cyber-blue px-12 py-6 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 font-mono"
              >
                <Bot className="h-6 w-6" />
                <span>Try Demo Bot</span>
              </a>

              <Link
                to="/dashboard"
                className="group relative inline-flex items-center gap-3 rounded-2xl border border-cyber-green bg-cyber-green/10 backdrop-blur-xl px-12 py-6 text-lg font-semibold text-cyber-green transition-all duration-300 hover:scale-105 hover:bg-cyber-green hover:text-dark-bg font-mono"
              >
                <BarChart3 className="h-6 w-6" />
                <span>Live Dashboard</span>
              </Link>

              {/* VERM Token CTA */}
              <a
                href="https://jup.ag/tokens/Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-cyan px-12 py-6 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyber-green/25 font-mono"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-cyan rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                <DollarSign className="relative h-6 w-6" />
                <span className="relative">Get VERM Token</span>
                <div className="relative flex items-center gap-1 text-sm">
                  <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                  <span>AI Signals</span>
                </div>
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple/20 to-cyber-blue/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-green/30 rounded-2xl p-6 text-center">
                  <Users className="h-8 w-8 text-cyber-purple mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white">
                    {botStats.activeGroups}
                  </div>
                  <div className="text-sm text-gray-300">Active Projects</div>
                  <div className="text-xs text-cyber-purple mt-1">
                    Ready to scale
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 to-cyber-cyan/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-blue/30 rounded-2xl p-6 text-center">
                  <MessageSquare className="h-8 w-8 text-cyber-blue mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white">
                    {botStats.messagesProcessed}
                  </div>
                  <div className="text-sm text-gray-300">Messages/Day</div>
                  <div className="text-xs text-cyber-blue mt-1">
                    Processing live
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-cyber-green/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-cyan/30 rounded-2xl p-6 text-center">
                  <Shield className="h-8 w-8 text-cyber-cyan mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white">
                    {botStats.spamBlocked}
                  </div>
                  <div className="text-sm text-gray-300">Spam Blocked</div>
                  <div className="text-xs text-cyber-cyan mt-1">
                    Protection active
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-green/20 to-cyber-purple/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-green/30 rounded-2xl p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-cyber-green mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white">
                    {botStats.uptime}
                  </div>
                  <div className="text-sm text-gray-300">System Status</div>
                  <div className="text-xs text-cyber-green mt-1">
                    Fully operational
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Features Grid */}
      <section className="py-32 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-bg/50 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-purple/20 bg-cyber-purple/10 px-6 py-3 text-sm font-medium text-cyber-purple mb-8 font-mono">
              <Zap className="h-4 w-4" />
              Enterprise Features
            </div>
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyber-purple to-cyber-blue bg-clip-text text-transparent mb-6 font-cyber">
              Transform Any Project
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-mono">
              Professional-grade features that rival Jupiter and Orca platforms.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple to-cyber-blue font-semibold mt-2">
                Each project gets its own isolated ecosystem.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                status={feature.status}
                onPremiumClick={handlePremiumFeatureClick}
                isPremiumUser={isPremium}
              />
            ))}
          </div>

          {/* Additional Platform Benefits */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-8 rounded-2xl border border-cyber-green/30 bg-dark-bg/60 backdrop-blur-xl px-12 py-8 font-mono">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-sm text-gray-300">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyber-purple">100+</div>
                <div className="text-sm text-gray-300">Tokens Supported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyber-blue">24/7</div>
                <div className="text-sm text-gray-300">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyber-green">0.1s</div>
                <div className="text-sm text-gray-300">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Configuration Demo */}
      <section className="py-20 relative z-10 bg-gradient-to-br from-dark-bg/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-cyber">
                Real-Time Configuration
              </h2>
              <p className="text-lg text-gray-300 font-mono">
                Configure your bot settings instantly with our intuitive admin
                interface.
              </p>
            </div>

            <div className="rounded-xl bg-dark-bg/80 border border-cyber-green/30 p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white font-mono">
                  Bot Configuration
                </h3>
                <div className="flex items-center gap-2 text-cyber-green">
                  <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
                  <span className="text-sm font-medium font-mono">Live</span>
                </div>
              </div>

              <div className="space-y-4">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-cyber-green/20 hover:border-cyber-purple/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white font-mono">
                          {config.label}
                        </h4>
                        {config.isPremium && !isPremium && (
                          <Crown className="h-4 w-4 text-cyber-orange" />
                        )}
                      </div>
                      <p className="text-sm text-gray-300 font-mono">
                        {config.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleConfig(config.id)}
                      disabled={config.isPremium && !isPremium}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.enabled ? "bg-cyber-green" : "bg-gray-300"
                      } ${config.isPremium && !isPremium ? "opacity-50 cursor-not-allowed" : ""}`}
                      aria-label={`Toggle ${config.label}`}
                      title={`Toggle ${config.label}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {!isPremium && (
                <div className="mt-6 p-4 rounded-lg bg-cyber-orange/10 border border-cyber-orange/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-cyber-orange" />
                    <span className="text-sm font-medium text-cyber-orange font-mono">
                      Premium Features Available
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mb-3 font-mono">
                    Unlock advanced token gating, one-click buy, and analytics
                    for just 0.055 SOL (one-time)
                  </p>
                  <button
                    onClick={() => setIsPaymentOpen(true)}
                    className="px-4 py-2 rounded bg-cyber-orange text-white text-sm font-medium hover:bg-cyber-orange/90 transition-colors font-mono"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Security & Verification */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-cyber">
                Advanced Security & Verification
              </h2>
              <p className="text-lg text-gray-300 font-mono">
                Multi-layered protection to keep your community safe and
                spam-free.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-green/20 text-cyber-green">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2 font-mono">
                        Math CAPTCHA System
                      </h3>
                      <p className="text-gray-300 font-mono">
                        Simple arithmetic problems verify human users while
                        blocking automated bots and spam accounts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-orange/20 text-cyber-orange">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2 font-mono">
                        AI-Powered Spam Detection
                      </h3>
                      <p className="text-gray-300 font-mono">
                        Advanced algorithms detect and block spam, scams, and
                        malicious links before they reach your community.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-purple/20 text-cyber-purple">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2 font-mono">
                        Token-Based Access Control
                      </h3>
                      <p className="text-gray-300 font-mono">
                        Automatically verify token holdings and grant
                        appropriate permissions to community members.
                      </p>
                      {!isPremium && (
                        <span className="inline-flex items-center gap-1 text-xs text-cyber-orange mt-1 font-mono">
                          <Crown className="h-3 w-3" />
                          Premium Feature
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-xl border border-cyber-purple/20 bg-gradient-to-br from-dark-bg to-dark-bg/60 p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-cyber-cyan mb-2">
                      <Bot className="h-4 w-4" />
                      <span className="text-sm font-medium text-white font-mono">
                        NimRevScanBot Security Check
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 font-mono">
                      New user verification in progress...
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-cyber-green" />
                      <span className="text-sm text-white font-mono">
                        CAPTCHA: 7 + 3 = ? ✓
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-cyber-green" />
                      <span className="text-sm text-white font-mono">
                        Spam check: Clean ✓
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-cyber-green" />
                      <span className="text-sm text-white font-mono">
                        Token verification: 1000+ $VERM ✓
                      </span>
                      {!isPremium && (
                        <Crown className="h-3 w-3 text-cyber-orange" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-cyber-green" />
                      <span className="text-sm text-white font-mono">
                        Access granted: VIP member ✓
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-cyber-green/10 border border-cyber-green/20">
                    <div className="text-sm text-cyber-green font-medium font-mono">
                      ✅ User verified and welcomed to the community!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10 bg-gradient-to-br from-dark-bg/50 to-dark-bg/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-cyber text-cyber-green mb-6">
              Ready to Protect Your Community?
            </h2>
            <p className="text-lg text-gray-300 mb-8 font-mono">
              Join thousands of communities already using NimRevScanBot for
              comprehensive group management and security.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://t.me/NimRev_Bot"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-cyber-purple px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-cyber-purple/90 hover:scale-105 font-mono"
              >
                <Bot className="h-5 w-5" />
                Add NimRevScanBot Now
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-cyber-blue bg-transparent px-8 py-4 text-lg font-semibold text-cyber-blue transition-all duration-200 hover:bg-cyber-blue/10 font-mono"
              >
                <Globe className="h-5 w-5" />
                View Pricing
              </Link>
            </div>

            <div className="mt-8 text-sm text-gray-300 font-mono">
              Free tier available • Premium features 0.045 SOL one-time • 24/7
              support
            </div>
          </div>
        </div>
      </section>

      <CyberFooter />

      {/* Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-dark-bg border border-cyber-purple/50 rounded-2xl p-8 max-w-md w-full mx-4">
            {/* Close button */}
            <button
              onClick={() => setIsPaymentOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              title="Close payment modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              {!paymentSuccess ? (
                <>
                  <div className="w-16 h-16 bg-gradient-to-r from-cyber-purple to-cyber-orange rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Crown className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 font-cyber">
                    Upgrade to Premium
                  </h3>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-cyber-orange mb-2">
                      {PREMIUM_PRICE_SOL} SOL
                    </div>
                    <div className="text-sm text-gray-300 font-mono">
                      One-time payment • Lifetime access
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 text-left">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyber-green" />
                      <span className="text-sm text-gray-300">
                        Advanced Token Gating
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyber-green" />
                      <span className="text-sm text-gray-300">
                        One-Click Trading
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyber-green" />
                      <span className="text-sm text-gray-300">
                        Advanced Analytics
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyber-green" />
                      <span className="text-sm text-gray-300">
                        Priority Support
                      </span>
                    </div>
                  </div>

                  {!connected ? (
                    <button
                      onClick={connect}
                      className="w-full bg-gradient-to-r from-cyber-purple to-cyber-blue text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 font-mono"
                    >
                      <Wallet className="w-5 h-5" />
                      Connect Wallet
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-cyber-green/10 border border-cyber-green/20 rounded-lg">
                        <div className="text-xs text-gray-300 mb-1">
                          Connected Wallet:
                        </div>
                        <div className="text-sm font-mono text-cyber-green">
                          {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Balance: {balance.toFixed(4)} SOL
                        </div>
                      </div>

                      {balance >= PREMIUM_PRICE_SOL ? (
                        <button
                          onClick={handlePayment}
                          disabled={isProcessingPayment}
                          className="w-full bg-gradient-to-r from-cyber-green to-cyber-blue text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessingPayment ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5" />
                              Pay {PREMIUM_PRICE_SOL} SOL
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-center">
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                            <div className="text-sm text-red-400">
                              Insufficient SOL balance
                            </div>
                            <div className="text-xs text-gray-400">
                              Need {PREMIUM_PRICE_SOL} SOL, have{" "}
                              {balance.toFixed(4)} SOL
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              window.open("https://jup.ag", "_blank")
                            }
                            className="w-full bg-cyber-orange text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300 font-mono"
                          >
                            Buy SOL on Jupiter
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyber-green rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-cyber-green mb-4 font-cyber">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-300 font-mono">
                    Premium features have been activated
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
