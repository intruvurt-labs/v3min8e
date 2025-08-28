import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, Bot } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import WalletDropdown from "@/components/WalletDropdown";

interface NavItem {
  name: string;
  href: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    name: "GRID",
    href: "/grid",
    description: "NimRev Grid - Subversive Intelligence Network",
  },
  {
    name: "AI AUDIT",
    href: "/security-audit",
    description: "Smart Contract Security Analysis",
  },
  {
    name: "SWAP STAKE",
    href: "/staking",
    description: "Jupiter Swap & VERM Staking",
  },
  { name: "LITEPAPER", href: "/whitepaper", description: "NimRev Docs" },
  { name: "BLUEPRINT", href: "/technology", description: "Core Systems" },
  { name: "COMMUNITY", href: "/community", description: "Join Network" },
  { name: "AIRDROP 🎁", href: "/airdrop", description: "VERM Token Airdrop" },
  { name: "CONTACT", href: "/contact", description: "Secure Channel" },
];

const legalItems: NavItem[] = [
  { name: "ABOUT", href: "/about", description: "Origin Story" },
  { name: "BLOGS", href: "/blogs", description: "Security Intelligence" },
  { name: "PRIVACY", href: "/privacy", description: "Privacy Policy" },
  { name: "TERMS", href: "/terms", description: "Terms of Service" },
  {
    name: "DISCLAIMER",
    href: "/disclaimer",
    description: "Financial Disclaimer",
  },
  {
    name: "AGE 18+",
    href: "/age-restriction",
    description: "Age Verification",
  },
];

export default function CyberNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {
    connected: walletConnected,
    connect: connectWallet,
    publicKey,
    balance,
  } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(timer);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-dark-bg/80 backdrop-blur-md border-b border-cyber-green/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-8 h-8 bg-cyber-green/20 rounded-xl border border-cyber-green animate-pulse-glow flex items-center justify-center opacity-80">
                <Home className="w-4 h-4 text-cyber-green animate-pulse" />
                <div className="absolute inset-1 bg-cyber-green/10 rounded-lg animate-electric-current"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-cyber-green font-cyber font-bold text-lg tracking-wider group-hover:text-shadow-lg transition-all duration-300">
                NIMREV
              </span>
              <span className="text-cyber-blue text-xs font-mono tracking-widest opacity-80">
                PROTOCOL
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative px-4 py-2 text-sm font-mono tracking-wider transition-all duration-300 ${
                    isActive
                      ? "text-cyber-green border border-cyber-green/50 bg-cyber-green/10 neon-glow"
                      : "text-gray-300 hover:text-cyber-green hover:border-cyber-green/30 border border-transparent"
                  }`}
                >
                  <span className="relative z-10">{item.name}</span>
                  <div
                    className={`absolute inset-0 bg-cyber-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      isActive ? "opacity-100" : ""
                    }`}
                  />

                  {/* Scan line effect */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 scan-line" />

                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-dark-bg border border-cyber-green/30 text-xs text-cyber-green font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {item.description}
                  </div>
                </Link>
              );
            })}

            {/* Legal Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 text-sm font-mono tracking-wider text-gray-300 hover:text-cyber-orange border border-transparent hover:border-cyber-orange/30 transition-all duration-300">
                DOX
              </button>

              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-dark-bg border border-cyber-orange/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                {legalItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-4 py-3 text-xs font-mono tracking-wider border-b border-cyber-orange/20 transition-all duration-300 ${
                        isActive
                          ? "text-cyber-orange bg-cyber-orange/10"
                          : "text-gray-300 hover:text-cyber-orange hover:bg-cyber-orange/5"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="flex items-center space-x-4">
            {/* Bot Platform Link */}
            <Link
              to="/bot-platform"
              className="hidden sm:flex items-center px-3 py-1.5 bg-gradient-to-r from-cyber-purple to-cyber-orange hover:from-cyber-orange hover:to-cyber-purple text-white font-bold text-xs rounded transition-all duration-300 group border border-cyber-purple/50"
            >
              <Bot className="w-3 h-3 mr-1.5" />
              <span className="group-hover:animate-pulse">BOT PLATFORM</span>
            </Link>

            {/* Wallet Connection */}
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="hidden sm:flex items-center px-3 py-1.5 bg-gradient-to-r from-cyber-blue to-cyber-purple hover:from-cyber-purple hover:to-cyber-blue text-white font-bold text-xs rounded transition-all duration-300 group border border-cyber-blue/50"
              >
                <Wallet className="w-3 h-3 mr-1.5" />
                <span className="group-hover:animate-pulse">
                  CONNECT WALLET
                </span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  className="hidden sm:flex items-center px-3 py-1.5 bg-cyber-green/20 border border-cyber-green/50 rounded text-xs hover:bg-cyber-green/30 transition-all duration-300"
                >
                  <div className="w-2 h-2 bg-cyber-green rounded-full mr-2 animate-pulse"></div>
                  <span className="text-cyber-green font-mono font-bold">
                    {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                  </span>
                </button>

                {/* Wallet Dropdown */}
                {publicKey && (
                  <WalletDropdown
                    isOpen={showWalletDropdown}
                    onClose={() => setShowWalletDropdown(false)}
                    publicKey={publicKey}
                  />
                )}
              </div>
            )}

            {/* System Time */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-cyber-green text-xs font-mono tracking-wider">
                {formatTime(currentTime)}
              </span>
              <span className="text-cyber-blue text-xs font-mono opacity-60">
                UTC+0
              </span>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
              <span className="text-cyber-green text-xs font-mono hidden sm:block">
                ONLINE
              </span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 flex flex-col justify-center items-center space-y-1 group"
              aria-label="Toggle mobile menu"
            >
              <div
                className={`w-4 h-0.5 bg-cyber-green transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5 w-6" : "group-hover:w-6"}`}
              ></div>
              <div
                className={`w-6 h-0.5 bg-cyber-green transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
              ></div>
              <div
                className={`w-4 h-0.5 bg-cyber-green transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5 w-6" : "group-hover:w-6"}`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Cyber scan line across nav */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyber-green/50 to-transparent animate-cyber-scan"></div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-dark-bg/95 backdrop-blur-md border-b border-cyber-green/30 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
            {/* Main Navigation */}
            <div className="space-y-3">
              <h3 className="text-cyber-green font-cyber font-bold text-sm tracking-wider">
                NAVIGATION
              </h3>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 border rounded transition-all duration-300 ${
                    location.pathname === item.href
                      ? "border-cyber-green bg-cyber-green/10 text-cyber-green"
                      : "border-cyber-green/30 text-gray-300 hover:border-cyber-green hover:bg-cyber-green/5"
                  }`}
                >
                  <div className="font-mono font-bold text-sm">{item.name}</div>
                  <div className="text-xs text-gray-400">
                    {item.description}
                  </div>
                </Link>
              ))}
            </div>

            {/* Bot Platform Section */}
            <div className="pt-4 border-t border-cyber-green/30">
              <h3 className="text-cyber-purple font-cyber font-bold text-sm tracking-wider mb-3">
                BOT PLATFORM
              </h3>
              <Link
                to="/bot-platform"
                className="w-full px-4 py-3 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple font-mono font-bold text-sm hover:bg-cyber-purple hover:text-white transition-all duration-300 rounded block text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <Bot className="w-4 h-4" />
                  ACCESS BOT PLATFORM
                </div>
              </Link>
            </div>

            {/* Wallet Section */}
            <div className="pt-4 border-t border-cyber-green/30">
              <h3 className="text-cyber-blue font-cyber font-bold text-sm tracking-wider mb-3">
                WALLET
              </h3>
              {!walletConnected ? (
                <button
                  onClick={() => {
                    connectWallet();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green font-mono font-bold text-sm hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 rounded"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Wallet className="w-4 h-4" />
                    CONNECT WALLET
                  </div>
                </button>
              ) : (
                <div className="px-4 py-3 border border-cyber-blue/30 bg-cyber-blue/5 rounded">
                  <div className="text-cyber-blue font-mono font-bold text-sm">
                    {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Balance: {balance?.toFixed(4)} SOL
                  </div>
                </div>
              )}
            </div>

            {/* Legal Links */}
            <div className="pt-4 border-t border-cyber-green/30">
              <h3 className="text-cyber-orange font-cyber font-bold text-sm tracking-wider mb-3">
                LEGAL
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {legalItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 border border-cyber-orange/30 text-cyber-orange font-mono text-xs hover:bg-cyber-orange/10 transition-all duration-300 rounded text-center"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="pt-4 border-t border-cyber-green/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                  <span className="text-cyber-green text-xs font-mono">
                    SYSTEM ONLINE
                  </span>
                </div>
                <div className="text-cyber-blue text-xs font-mono">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
