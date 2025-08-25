import React, { useState, useEffect } from 'react';

// Placeholder for react-router-dom Link, as it's not available in this environment
const Link = ({ to, className, children }) => <a href={to} className={className}>{children}</a>;

// Placeholder for Lucide React icons
const Bot = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><path d="M22 6c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4v8a4 4 0 0 0 4 4h4v4h8a4 4 0 0 0 4-4V6Z"/><path d="M12 16v4H8a2 2 0 0 1-2-2"/></svg>;
const Users = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const Crown = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 8-4-8-4 8-6-8z"/><path d="M12 15a4 4 0 0 1 4 4v2H8v-2a4 4 0 0 1 4-4Z"/></svg>;
const ArrowLeft = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const ExternalLink = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>;
const MessageSquare = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const Shield = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const TrendingUp = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const Zap = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const DollarSign = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const BarChart3 = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;

// Placeholder components to make the app render
const CleanSystemStatus = ({ status, currentTime }) => (
  <div className="bg-dark-bg/80 backdrop-blur-xl border border-cyber-green/30 p-4 rounded-xl shadow-2xl shadow-cyber-purple/20 text-xs font-mono">
    <h3 className="text-white text-sm font-semibold mb-2">System Status</h3>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${status.botCore.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      <span className={`text-${status.botCore.status === 'ONLINE' ? 'green-400' : 'red-400'}`}>{status.botCore.status}</span>
    </div>
    <div className="mt-2 text-gray-400">
      <p>Current Time: {new Date(currentTime).toLocaleTimeString()}</p>
      <p>Operation: {status.currentOperation}</p>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, status }) => (
  <div className="group relative h-full">
    <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
    <div className="relative bg-dark-bg/90 backdrop-blur-xl border border-cyber-green/30 rounded-2xl p-6 h-full flex flex-col">
      <div className="w-12 h-12 bg-gradient-to-r from-cyber-purple to-cyber-pink rounded-xl flex items-center justify-center mb-4 flex-shrink-0">
        {Icon && <Icon className="h-6 w-6 text-white" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-300 text-sm flex-grow">{description}</p>
      <div className={`mt-4 text-xs font-mono px-2 py-1 rounded-full ${status === 'Active' ? 'bg-cyber-green/20 text-cyber-green' : 'bg-gray-500/20 text-gray-400'}`}>
        Status: {status}
      </div>
    </div>
  </div>
);

const CyberGrid = () => (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#2a2a2a" strokeWidth="0.5"/>
                </pattern>
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                    <rect width="80" height="80" fill="url(#smallGrid)"/>
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#3d3d3d" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    </div>
);

const styles = {
  gradientTitle: 'text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-cyber-blue to-cyber-green',
};

// Mock data for the app to function
const mockConfigs = [
  { id: 1, label: "Advanced Token Gating", description: "Limit access to content based on token ownership.", isPremium: true, enabled: false },
  { id: 2, label: "One-Click Buy", description: "Generate a quick, pre-filled buy link for any token.", isPremium: true, enabled: false },
  { id: 3, label: "Spam Protection", description: "Automatically block common spam and scam messages.", isPremium: false, enabled: true },
  { id: 4, label: "Live Analytics", description: "View real-time chat and user activity data.", isPremium: true, enabled: false },
];

const mockFeatures = [
    { icon: Bot, title: "One-Command Setup", description: "Transform any Telegram group with /setupbot.", status: "Active" },
    { icon: Users, title: "Infinite Projects", description: "Each project gets isolated settings and custom tokens.", status: "Active" },
    { icon: Crown, title: "Any Token Support", description: "Supports VERM, SOL, or any custom Solana token.", status: "Active" },
    { icon: Shield, title: "Enterprise-Grade Security", description: "Built on a robust, secure, and scalable architecture.", status: "Active" },
    { icon: Zap, title: "Blazing Fast Performance", description: "Sub-second response times for all commands and functions.", status: "Active" },
    { icon: TrendingUp, title: "Real-Time Analytics", description: "Get live insights into your community and project health.", status: "Active" },
];

export default function App() {
  const [realTimeStatus, setRealTimeStatus] = useState({
    botCore: { status: "OFFLINE", progress: 0, lastPing: null },
    scanner: { status: "OFFLINE", progress: 0, scansRunning: 0, timeElapsed: 0 },
    uptime: { start: Date.now() },
    currentOperation: "System check in progress",
    liveFeed: [],
  });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [geometricShapes, setGeometricShapes] = useState([]);
  const [botStats, setBotStats] = useState({ activeGroups: "...", messagesProcessed: "...", spamBlocked: "...", uptime: "..." });
  const [isPremium, setIsPremium] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [configs, setConfigs] = useState(mockConfigs);

  // Function to toggle a configuration setting
  const toggleConfig = (id) => {
    setConfigs(configs.map(config =>
      config.id === id ? { ...config, enabled: !config.enabled } : config
    ));
  };

  const handlePremiumFeatureClick = () => {
    // This is a placeholder function
    setIsPaymentOpen(true);
  };

  useEffect(() => {
    // Generate random geometric shapes
    const shapes = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      type: Math.random() > 0.5 ? "circle" : "polygon",
      size: Math.random() * 150 + 30,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      color: [
        "rgba(255, 182, 193, 0.3)", // Light Pink
        "rgba(173, 216, 230, 0.3)", // Light Blue
        "rgba(144, 238, 144, 0.3)", // Light Green
        "rgba(255, 218, 185, 0.3)", // Peach
        "rgba(221, 160, 221, 0.3)", // Plum
        "rgba(175, 238, 238, 0.3)", // Pale Turquoise
      ][Math.floor(Math.random() * 6)],
      animationDelay: Math.random() * 5,
      animationDuration: 3 + Math.random() * 4,
    }));
    setGeometricShapes(shapes);

    // Placeholder for API calls, simulating a real-time dashboard
    const fetchRealTimeStatus = async () => {
        setRealTimeStatus({
            botCore: { status: "ONLINE", progress: 100, lastPing: new Date() },
            scanner: { status: "ONLINE", progress: 100, scansRunning: 5, timeElapsed: 120 },
            uptime: { start: new Date(Date.now() - 3600000) }, // 1 hour ago
            currentOperation: "Scanning new message queues",
            liveFeed: [],
        });
        setCurrentTime(Date.now());
    };

    const fetchBotStats = async () => {
        setBotStats({
            activeGroups: "125",
            messagesProcessed: "4,500,000",
            spamBlocked: "12,000",
            uptime: "24/7",
        });
    };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-cyber-green hover:text-cyber-blue transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-mono text-sm hidden sm:inline">Back to Protocol</span>
              </Link>
              <div className="w-px h-6 bg-cyber-green/30 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyber-purple/20 rounded-xl border border-cyber-purple flex items-center justify-center">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-purple" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-cyber font-bold text-cyber-purple">
                    NimRev Bot Platform
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 font-mono hidden sm:block">
                    Multi-Tenant Telegram Intelligence
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://t.me/nimrev_bot"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple rounded-lg hover:bg-cyber-purple hover:text-white transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="font-mono text-sm hidden sm:inline">Now Available on Telegram</span>
                <span className="font-mono text-sm sm:hidden">Telegram</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Render geometric shapes */}
      {geometricShapes.map((shape) => (
        <div
          key={shape.id}
          className={`absolute geometric-shape ${shape.type === "circle" ? "shape-circle" : "polygon-shape"}`}
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            backgroundColor: shape.color,
            transform: `rotate(${shape.rotation}deg)`,
            animationDelay: `${shape.animationDelay}s`,
            animationDuration: `${shape.animationDuration}s`,
            borderRadius: shape.type === 'circle' ? '50%' : '10%',
            opacity: 0,
          }}
        >
          {/* Empty child, styling handled by CSS */}
        </div>
      ))}

      {/* Real-time Bot Status Panel - Responsive positioning */}
      <div className="absolute top-20 sm:top-24 left-4 sm:left-8 z-20">
        <CleanSystemStatus
          status={realTimeStatus}
          currentTime={currentTime}
        />
      </div>

      {/* Video Header - Responsive positioning */}
      <div className="absolute top-20 sm:top-24 right-4 sm:right-8 z-20">
        <div className="relative w-[150px] h-[180px] sm:w-[200px] sm:h-[250px] rounded-2xl overflow-hidden backdrop-blur-sm bg-dark-bg/60 border border-cyber-green/50 shadow-2xl shadow-cyber-purple/20">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F9a8474ab0524497c85c9ce04674c08c9%2F61d4fd3e97124c13b5aea0a252af3f27?format=webp&width=800"
            alt="Cyber Vision"
            className="w-full h-full object-cover mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-green/30 via-transparent to-cyber-purple/30 mix-blend-overlay"></div>
          <div className="absolute inset-0 border-2 border-cyber-green/60 rounded-2xl animate-pulse"></div>
        </div>
      </div>

      {/* Hero Section - Improved spacing and layout */}
      <section className="relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-purple/30 bg-cyber-purple/10 px-4 py-2 text-sm font-medium text-cyber-purple mb-6 font-mono">
              <Bot className="h-4 w-4" />
              Now Available on Telegram
            </div>

            <div className="relative transform perspective-1000 mb-8">
              {/* Beveled 3D Glitched Title */}
              <h1 className="relative text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter mb-6 font-cyber">
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
              <div className="relative text-2xl sm:text-4xl md:text-7xl font-bold mb-8 font-mono">
                <span
                  className={`bg-gradient-to-r from-cyber-purple via-cyber-blue to-cyber-green bg-clip-text text-transparent ${styles.gradientTitle}`}
                >
                  Multi-Tenant Bot
                </span>
              </div>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-mono">
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

            {/* Feature Preview Cards - Better responsive grid */}
            <div className="relative mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Setup Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-dark-bg/90 backdrop-blur-xl border border-cyber-green/30 rounded-2xl p-6 sm:p-8 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-purple to-cyber-pink rounded-xl flex items-center justify-center mb-4">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
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
                  <div className="relative bg-dark-bg/90 backdrop-blur-xl border border-cyber-blue/30 rounded-2xl p-6 sm:p-8 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-blue to-cyber-cyan rounded-xl flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                      Infinite Projects
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Each project gets isolated settings, custom tokens, and
                      premium features tailored to their community
                    </p>
                  </div>
                </div>

                {/* Premium Card */}
                <div className="group relative sm:col-span-2 lg:col-span-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-pink to-cyber-purple rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-dark-bg/90 backdrop-blur-xl border border-cyber-purple/30 rounded-2xl p-6 sm:p-8 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-pink to-cyber-purple rounded-xl flex items-center justify-center mb-4">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
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

            {/* Primary Action Buttons - Better responsive layout */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-16">
              <a
                href="https://t.me/NimRev_Bot"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyber-purple to-cyber-blue px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-semibold text-white transition-all duration-300 hover:scale-105 font-mono"
              >
                <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Try Demo Bot</span>
              </a>

              <Link
                to="/dashboard"
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl border border-cyber-green bg-cyber-green/10 backdrop-blur-xl px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-semibold text-cyber-green transition-all duration-300 hover:scale-105 hover:bg-cyber-green hover:text-dark-bg font-mono"
              >
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Live Dashboard</span>
              </Link>

              {/* VERM Token CTA */}
              <a
                href="https://jup.ag/tokens/Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-cyan px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyber-green/25 font-mono"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-cyan rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                <DollarSign className="relative h-5 w-5 sm:h-6 sm:w-6" />
                <span className="relative">Get VERM Token</span>
                <div className="relative flex items-center gap-1 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                  <span>AI Signals</span>
                </div>
              </a>
            </div>

            {/* Quick Stats - Improved responsive grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple/20 to-cyber-blue/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-green/30 rounded-2xl p-4 sm:p-6 text-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-purple mx-auto mb-2 sm:mb-3" />
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {botStats.activeGroups}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">Active Projects</div>
                  <div className="text-xs text-cyber-purple mt-1">
                    Ready to scale
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 to-cyber-cyan/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-blue/30 rounded-2xl p-4 sm:p-6 text-center">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-blue mx-auto mb-2 sm:mb-3" />
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {botStats.messagesProcessed}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">Messages/Day</div>
                  <div className="text-xs text-cyber-blue mt-1">
                    Processing live
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-cyber-green/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-cyan/30 rounded-2xl p-4 sm:p-6 text-center">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-cyan mx-auto mb-2 sm:mb-3" />
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {botStats.spamBlocked}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">Spam Blocked</div>
                  <div className="text-xs text-cyber-cyan mt-1">
                    Protection active
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-green/20 to-cyber-purple/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-dark-bg/60 backdrop-blur-xl border border-cyber-green/30 rounded-2xl p-4 sm:p-6 text-center">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-green mx-auto mb-2 sm:mb-3" />
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {botStats.uptime}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">System Status</div>
                  <div className="text-xs text-cyber-green mt-1">
                    Fully operational
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Improved spacing and layout */}
      <section className="py-16 sm:py-24 lg:py-32 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-bg/50 to-transparent"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-purple/20 bg-cyber-purple/10 px-6 py-3 text-sm font-medium text-cyber-purple mb-8 font-mono">
              <Zap className="h-4 w-4" />
              Enterprise Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyber-purple to-cyber-blue bg-clip-text text-transparent mb-6 font-cyber">
              Transform Any Project
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-mono">
              Professional-grade features that rival Jupiter and Orca platforms.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple to-cyber-blue font-semibold mt-2">
                Each project gets its own isolated ecosystem.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {mockFeatures.map((feature, index) => (
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
          <div className="mt-16 sm:mt-20 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-6 sm:gap-8 rounded-2xl border border-cyber-green/30 bg-dark-bg/60 backdrop-blur-xl px-8 sm:px-12 py-6 sm:py-8 font-mono">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">∞</div>
                <div className="text-xs sm:text-sm text-gray-300">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-cyber-purple">100+</div>
                <div className="text-xs sm:text-sm text-gray-300">Tokens Supported</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-cyber-blue">24/7</div>
                <div className="text-xs sm:text-sm text-gray-300">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-cyber-green">0.1s</div>
                <div className="text-xs sm:text-sm text-gray-300">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Configuration Demo - Better responsive layout */}
      <section className="py-16 sm:py-20 relative z-10 bg-gradient-to-br from-dark-bg/10 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-cyber">
                Real-Time Configuration
              </h2>
              <p className="text-base sm:text-lg text-gray-300 font-mono">
                Configure your bot settings instantly with our intuitive admin
                interface.
              </p>
            </div>

            <div className="rounded-xl bg-dark-bg/80 border border-cyber-green/30 p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white font-mono">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white font-mono text-sm sm:text-base">
                          {config.label}
                        </h4>
                        {config.isPremium && !isPremium && (
                          <Crown className="h-4 w-4 text-cyber-orange flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 font-mono">
                        {config.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleConfig(config.id)}
                      disabled={config.isPremium && !isPremium}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
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
      <section className="py-16 sm:py-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-cyber">
                Uncompromising Security
              </h2>
              <p className="text-base sm:text-lg text-gray-300 font-mono">
                Our platform is built with a focus on security and reliability.
              </p>
            </div>
            <div className="rounded-xl bg-dark-bg/80 border border-cyber-green/30 p-6 sm:p-8 backdrop-blur-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-dark-bg/50 border border-cyber-blue/30">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-blue mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white font-mono">
                      Robust Architecture
                    </h3>
                    <p className="text-sm text-gray-300 font-mono mt-1">
                      Our system uses isolated microservices to ensure stability and resilience against attacks.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-dark-bg/50 border border-cyber-green/30">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white font-mono">
                      Continuous Monitoring
                    </h3>
                    <p className="text-sm text-gray-300 font-mono mt-1">
                      We monitor platform health 24/7 to guarantee maximum uptime and quick response to issues.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Better spacing */}
      <footer className="py-8 sm:py-12 relative z-10 bg-dark-bg/80 border-t border-cyber-green/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 font-mono text-sm">
          &copy; {new Date().getFullYear()} NimRev. All rights reserved.
        </div>
      </footer>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-bg border border-cyber-purple/30 p-6 sm:p-8 rounded-xl max-w-sm w-full text-center font-mono">
            <h3 className="text-xl font-bold text-white mb-4">Upgrade to Premium</h3>
            <p className="text-gray-300 mb-6">This is a demo. In a real application, a payment modal would appear here.</p>
            <button
              onClick={() => setIsPaymentOpen(false)}
              className="px-6 py-2 rounded bg-cyber-green text-white hover:bg-cyber-green/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Improved CSS styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(30% 0 55% 0); transform: translate(1px, 1px) rotate(0.5deg); }
          15% { clip-path: inset(5% 0 85% 0); transform: translate(3px, -2px) rotate(-1deg); }
          30% { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 2px) rotate(1.5deg); }
          45% { clip-path: inset(10% 0 60% 0); transform: translate(2px, -1px) rotate(-0.5deg); }
          60% { clip-path: inset(40% 0 45% 0); transform: translate(-1px, 3px) rotate(1deg); }
          75% { clip-path: inset(20% 0 60% 0); transform: translate(3px, 1px) rotate(-1.5deg); }
          90% { clip-path: inset(60% 0 15% 0); transform: translate(-3px, -2px) rotate(0.5deg); }
          100% { clip-path: inset(30% 0 55% 0); transform: translate(1px, 1px) rotate(0.5deg); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(45% 0 40% 0); transform: translate(2px, 3px) rotate(-1.5deg); }
          20% { clip-path: inset(80% 0 5% 0); transform: translate(-1px, 2px) rotate(1deg); }
          40% { clip-path: inset(10% 0 70% 0); transform: translate(2px, -3px) rotate(0.5deg); }
          60% { clip-path: inset(60% 0 20% 0); transform: translate(-3px, -1px) rotate(-1deg); }
          80% { clip-path: inset(25% 0 65% 0); transform: translate(1px, 1px) rotate(1.5deg); }
          100% { clip-path: inset(45% 0 40% 0); transform: translate(2px, 3px) rotate(-1.5deg); }
        }
        .nimrev-glitch-green {
          animation: glitch-anim-1 8s infinite linear alternate-reverse;
        }
        .nimrev-glitch-blue {
          animation: glitch-anim-2 8s infinite linear alternate;
        }
        .nimrev-title-glow {
          text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff, 0 0 40px #ff00ff, 0 0 50px #ff00ff;
        }
        .font-cyber {
          font-family: 'Inter', sans-serif;
        }
        .font-mono {
          font-family: 'Fira Code', 'Roboto Mono', monospace;
        }
        .bg-dark-bg {
          background-color: #0d1117;
        }
        .text-foreground {
          color: #c9d1d9;
        }
        .border-cyber-green {
          border-color: #00ffc8;
        }
        .bg-cyber-purple {
          background-color: #a78bfa;
        }
        .text-cyber-purple {
          color: #a78bfa;
        }
        .text-cyber-green {
          color: #00ffc8;
        }
        .text-cyber-blue {
          color: #00aaff;
        }
        .text-cyber-cyan {
          color: #00fffb;
        }
        .text-cyber-pink {
          color: #ff00a5;
        }
        .text-cyber-orange {
          color: #ff9900;
        }
        .geometric-shape {
            animation: move-and-fade var(--animation-duration, 5s) infinite ease-in-out alternate;
            position: absolute;
            opacity: 0;
        }
        @keyframes move-and-fade {
            0% {
                transform: translate(0, 0) rotate(0deg) scale(0.5);
                opacity: 0;
            }
            50% {
                opacity: 0.3;
            }
            100% {
                transform: translate(50px, -30px) rotate(360deg) scale(1.2);
                opacity: 0;
            }
        }
      `}</style>
    </div>
  );
}
