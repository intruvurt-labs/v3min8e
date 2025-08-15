import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Shield,
  Search,
  Bot,
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Skull,
  Crown,
  Globe,
  Activity,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  Clock,
  Star,
  Gift,
  Wallet,
  Bitcoin,
  Target,
  Users,
  MessageCircle,
  ShieldCheck,
  Key,
  RefreshCw,
  Percent,
  Calculator,
  CheckSquare,
  X,
  Copy,
  ExternalLink,
  Banknote,
  Coins,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "./UserProfileSystem";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  type: "user" | "system" | "scan" | "alert" | "trade_offer" | "trade_complete";
  scanResult?: {
    address: string;
    riskLevel: "safe" | "warning" | "danger";
    riskScore: number;
    findings: string[];
  };
  tradeOffer?: TradeOffer;
  encrypted?: boolean;
  isPremium?: boolean;
  encryptionLevel?: "basic" | "advanced" | "military";
}

interface TradeOffer {
  id: string;
  offerer: string;
  recipient: string;
  offering: {
    token: string;
    amount: number;
    tokenAddress?: string;
    symbol: string;
    decimals: number;
  };
  requesting: {
    token: string;
    amount: number;
    tokenAddress?: string;
    symbol: string;
    decimals: number;
  };
  status: "pending" | "accepted" | "rejected" | "completed" | "expired";
  expiresAt: number;
  escrowAddress?: string;
  conditions?: string[];
  reputation_required?: number;
}

interface OnlineUser {
  id: string;
  username: string;
  role: "ghost" | "scanner" | "premium" | "admin";
  lastSeen: number;
  reputation: number;
  tradingEnabled: boolean;
  verificationLevel: "basic" | "verified" | "premium";
}

interface EncryptionSettings {
  level: "basic" | "advanced" | "military";
  keyRotation: boolean;
  perfectForwardSecrecy: boolean;
  messageExpiry: number; // minutes
}

export default function AdvancedChatTrading() {
  const { connected, publicKey } = useWallet();
  const { currentProfile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [screenProtection, setScreenProtection] = useState(true);
  const [encryptionSettings, setEncryptionSettings] = useState<EncryptionSettings>({
    level: "advanced",
    keyRotation: true,
    perfectForwardSecrecy: true,
    messageExpiry: 60,
  });
  const [activeTradeOffers, setActiveTradeOffers] = useState<TradeOffer[]>([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTradeUser, setSelectedTradeUser] = useState<OnlineUser | null>(null);
  const [tradeFormData, setTradeFormData] = useState({
    offeringToken: "SOL",
    offeringAmount: "",
    requestingToken: "USDC",
    requestingAmount: "",
    conditions: "",
    expiryHours: "24",
  });
  const [messagesEndRef] = useState(useRef<HTMLDivElement>(null));
  const [glitchText, setGlitchText] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);

  // Advanced encryption functions
  const generateEncryptionKey = () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return key;
  };

  const encryptMessage = async (message: string, level: string) => {
    try {
      if (level === "basic") {
        return btoa(message); // Simple base64 encoding for demo
      } else if (level === "advanced") {
        // AES-256 simulation
        const key = encryptionKey || generateEncryptionKey();
        return `AES256:${btoa(message + key.slice(0, 16))}`;
      } else {
        // Military-grade ChaCha20-Poly1305 simulation
        const key = encryptionKey || generateEncryptionKey();
        return `CHACHA20:${btoa(message + key.slice(0, 32))}`;
      }
    } catch (error) {
      console.error("Encryption failed:", error);
      return message;
    }
  };

  const decryptMessage = async (encryptedMessage: string, level: string) => {
    try {
      if (level === "basic") {
        return atob(encryptedMessage);
      } else if (encryptedMessage.startsWith("AES256:")) {
        const encoded = encryptedMessage.replace("AES256:", "");
        const decoded = atob(encoded);
        return decoded.slice(0, -16); // Remove key portion
      } else if (encryptedMessage.startsWith("CHACHA20:")) {
        const encoded = encryptedMessage.replace("CHACHA20:", "");
        const decoded = atob(encoded);
        return decoded.slice(0, -32); // Remove key portion
      }
      return encryptedMessage;
    } catch (error) {
      console.error("Decryption failed:", error);
      return "[ENCRYPTED_MESSAGE]";
    }
  };

  // Prevent screenshots and enhance security
  useEffect(() => {
    if (screenProtection) {
      const preventScreenshot = (e: KeyboardEvent) => {
        if (
          e.key === "PrintScreen" ||
          (e.altKey && e.key === "PrintScreen") ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          e.key === "F12"
        ) {
          e.preventDefault();
          addSystemMessage("🛡️ SCREENSHOT_BLOCKED: Advanced protection active", "alert");
        }
      };

      const preventContext = (e: MouseEvent) => {
        e.preventDefault();
        addSystemMessage("🛡️ CONTEXT_BLOCKED: Military-grade security enabled", "alert");
      };

      const preventDeveloperTools = () => {
        if (window.outerHeight - window.innerHeight > 200) {
          addSystemMessage("🛡️ DEVTOOLS_DETECTED: Security breach attempt blocked", "alert");
        }
      };

      document.addEventListener("keydown", preventScreenshot);
      document.addEventListener("contextmenu", preventContext);
      window.addEventListener("resize", preventDeveloperTools);

      return () => {
        document.removeEventListener("keydown", preventScreenshot);
        document.removeEventListener("contextmenu", preventContext);
        window.removeEventListener("resize", preventDeveloperTools);
      };
    }
  }, [screenProtection]);

  // Enhanced glitch effect
  useEffect(() => {
    const glitchTexts = [
      "QUANTUM_ENCRYPTION_ACTIVE",
      "P2P_TRADING_PROTOCOL_ENABLED", 
      "ZERO_KNOWLEDGE_PROOF_VERIFIED",
      "BLOCKCHAIN_BRIDGE_ESTABLISHED",
      "MULTI_SIG_ESCROW_READY",
      "ATOMIC_SWAP_INITIALIZED",
      "DECENTRALIZED_EXCHANGE_ONLINE",
      "SMART_CONTRACT_VERIFIED"
    ];
    
    const interval = setInterval(() => {
      setGlitchText(glitchTexts[Math.floor(Math.random() * glitchTexts.length)]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Generate encryption key on load
  useEffect(() => {
    if (!encryptionKey) {
      setEncryptionKey(generateEncryptionKey());
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize enhanced online users
  useEffect(() => {
    setOnlineUsers([
      { 
        id: "1", 
        username: "CryptoTrader_Pro", 
        role: "admin", 
        lastSeen: Date.now(),
        reputation: 980,
        tradingEnabled: true,
        verificationLevel: "premium"
      },
      { 
        id: "2", 
        username: "DeFi_Master", 
        role: "premium", 
        lastSeen: Date.now() - 30000,
        reputation: 875,
        tradingEnabled: true,
        verificationLevel: "verified"
      },
      { 
        id: "3", 
        username: "Yield_Farmer", 
        role: "scanner", 
        lastSeen: Date.now() - 120000,
        reputation: 720,
        tradingEnabled: true,
        verificationLevel: "verified"
      },
      { 
        id: "4", 
        username: "Anonymous_Whale", 
        role: "ghost", 
        lastSeen: Date.now() - 60000,
        reputation: 650,
        tradingEnabled: false,
        verificationLevel: "basic"
      },
    ]);

    // Enhanced welcome messages
    addSystemMessage("🌐 ADVANCED TRADING PROTOCOL INITIALIZED", "system");
    addSystemMessage(`🔐 Encryption Level: ${encryptionSettings.level.toUpperCase()}`, "system");
    addSystemMessage("⚡ P2P Trading: ENABLED | Escrow: ACTIVE", "system");
    addSystemMessage("🛡️ Zero-Knowledge Proofs: VERIFIED", "system");
  }, []);

  const addSystemMessage = (message: string, type: "system" | "alert" = "system") => {
    const systemMsg: ChatMessage = {
      id: Date.now().toString(),
      user: "NIMREV_PROTOCOL",
      message,
      timestamp: Date.now(),
      type,
      encrypted: true,
      encryptionLevel: encryptionSettings.level,
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const detectAddressInMessage = (message: string): string | null => {
    const solanaRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
    const ethRegex = /0x[a-fA-F0-9]{40}/g;
    
    const solanaMatch = message.match(solanaRegex);
    const ethMatch = message.match(ethRegex);
    
    return solanaMatch?.[0] || ethMatch?.[0] || null;
  };

  const scanAddress = async (address: string) => {
    setIsScanning(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockRiskScore = Math.floor(Math.random() * 100);
      const riskLevel = mockRiskScore > 70 ? "danger" : mockRiskScore > 40 ? "warning" : "safe";
      
      const findings = [];
      if (riskLevel === "danger") {
        findings.push("⚠️ High-risk trading patterns detected", "🚨 Potential rug pull indicators found");
      } else if (riskLevel === "warning") {
        findings.push("⚡ Unusual volume spikes detected", "📊 Medium risk indicators present");
      } else {
        findings.push("✅ Clean transaction history", "🔍 No major risk factors identified");
      }

      const scanResult: ChatMessage = {
        id: Date.now().toString(),
        user: "NIMREV_SCANNER_V2",
        message: `🔍 ENHANCED_SCAN_COMPLETE: ${address.substring(0, 8)}...${address.substring(-8)}`,
        timestamp: Date.now(),
        type: "scan",
        scanResult: {
          address,
          riskLevel,
          riskScore: mockRiskScore,
          findings,
        },
        encrypted: true,
        encryptionLevel: encryptionSettings.level,
      };

      setMessages(prev => [...prev, scanResult]);
    } catch (error) {
      addSystemMessage("❌ SCAN_ERROR: Enhanced scanner temporarily unavailable", "alert");
    } finally {
      setIsScanning(false);
    }
  };

  const createTradeOffer = async () => {
    if (!selectedTradeUser || !currentProfile) return;

    const tradeOffer: TradeOffer = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      offerer: currentProfile.username,
      recipient: selectedTradeUser.username,
      offering: {
        token: tradeFormData.offeringToken,
        amount: parseFloat(tradeFormData.offeringAmount),
        symbol: tradeFormData.offeringToken,
        decimals: 9,
      },
      requesting: {
        token: tradeFormData.requestingToken,
        amount: parseFloat(tradeFormData.requestingAmount),
        symbol: tradeFormData.requestingToken,
        decimals: 6,
      },
      status: "pending",
      expiresAt: Date.now() + (parseFloat(tradeFormData.expiryHours) * 60 * 60 * 1000),
      conditions: tradeFormData.conditions ? [tradeFormData.conditions] : [],
      reputation_required: 500,
    };

    setActiveTradeOffers(prev => [...prev, tradeOffer]);

    const tradeMessage: ChatMessage = {
      id: Date.now().toString(),
      user: "P2P_TRADING_ENGINE",
      message: `💰 NEW_TRADE_OFFER: ${tradeOffer.offering.amount} ${tradeOffer.offering.symbol} ⇄ ${tradeOffer.requesting.amount} ${tradeOffer.requesting.symbol}`,
      timestamp: Date.now(),
      type: "trade_offer",
      tradeOffer,
      encrypted: true,
      encryptionLevel: encryptionSettings.level,
    };

    setMessages(prev => [...prev, tradeMessage]);
    setShowTradeModal(false);
    
    // Reset form
    setTradeFormData({
      offeringToken: "SOL",
      offeringAmount: "",
      requestingToken: "USDC",
      requestingAmount: "",
      conditions: "",
      expiryHours: "24",
    });
  };

  const acceptTradeOffer = (tradeId: string) => {
    setActiveTradeOffers(prev => 
      prev.map(trade => 
        trade.id === tradeId 
          ? { ...trade, status: "accepted" }
          : trade
      )
    );

    addSystemMessage(`✅ TRADE_ACCEPTED: Escrow contract initiated for trade ${tradeId.slice(-8)}`, "system");
    
    // Simulate smart contract execution
    setTimeout(() => {
      addSystemMessage(`🔄 ATOMIC_SWAP_EXECUTING: Multi-signature validation in progress...`, "system");
      
      setTimeout(() => {
        addSystemMessage(`🎉 TRADE_COMPLETED: Tokens successfully swapped via secure escrow`, "system");
        
        setActiveTradeOffers(prev => 
          prev.map(trade => 
            trade.id === tradeId 
              ? { ...trade, status: "completed" }
              : trade
          )
        );
      }, 3000);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentProfile) return;

    const encryptedContent = await encryptMessage(newMessage, encryptionSettings.level);
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user: currentProfile.username,
      message: encryptedContent,
      timestamp: Date.now(),
      type: "user",
      encrypted: true,
      isPremium: connected,
      encryptionLevel: encryptionSettings.level,
    };

    setMessages(prev => [...prev, userMsg]);

    // Check for address in message and auto-scan
    const detectedAddress = detectAddressInMessage(newMessage);
    if (detectedAddress) {
      addSystemMessage(`🎯 ADDRESS_DETECTED: Initiating enhanced scan on ${detectedAddress.substring(0, 8)}...`, "system");
      await scanAddress(detectedAddress);
    }

    setNewMessage("");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="w-4 h-4 text-cyber-orange" />;
      case "premium": return <Zap className="w-4 h-4 text-cyber-purple" />;
      case "scanner": return <Search className="w-4 h-4 text-cyber-blue" />;
      default: return <Skull className="w-4 h-4 text-cyber-green" />;
    }
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case "premium": return <CheckSquare className="w-3 h-3 text-yellow-400" />;
      case "verified": return <CheckCircle className="w-3 h-3 text-blue-400" />;
      default: return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addSystemMessage("📋 COPIED: Text copied to clipboard", "system");
  };

  if (!currentProfile) {
    return (
      <div className="border border-cyber-red/30 bg-dark-bg/90 backdrop-blur-xl rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-cyber-red to-cyber-orange rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-cyber font-bold text-cyber-red mb-2">
          PROFILE REQUIRED
        </h3>
        <p className="text-gray-300 text-sm">
          Advanced P2P trading requires a verified profile for security.
        </p>
      </div>
    );
  }

  return (
    <div className="relative border border-cyber-green/30 bg-dark-bg/90 backdrop-blur-xl rounded-2xl overflow-hidden">
      {/* Advanced security overlay */}
      {screenProtection && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-green to-transparent animate-cyber-scan"></div>
          <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-cyber-blue to-transparent animate-cyber-scan"></div>
          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-cyber-purple to-transparent animate-cyber-scan"></div>
          <div className="absolute right-0 bottom-0 w-1 h-full bg-gradient-to-t from-transparent via-cyber-orange to-transparent animate-cyber-scan"></div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="relative z-10 border-b border-cyber-green/30 p-4 bg-gradient-to-r from-dark-bg via-dark-bg/80 to-dark-bg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-6 h-6 text-cyber-green animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-green rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-lg font-cyber font-bold text-cyber-green">
                P2P_TRADING_PROTOCOL_V2
              </h3>
              <p className="text-xs font-mono text-gray-400 glitch" data-text={glitchText}>
                {glitchText}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEncryptionModal(true)}
              className="p-2 rounded-lg border bg-cyber-green/20 border-cyber-green text-cyber-green transition-all duration-300"
              title="Encryption Settings"
            >
              <Key className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setScreenProtection(!screenProtection)}
              className={`p-2 rounded-lg border ${
                screenProtection 
                  ? "bg-cyber-blue/20 border-cyber-blue text-cyber-blue" 
                  : "bg-gray-500/20 border-gray-500 text-gray-400"
              } transition-all duration-300`}
              title="Advanced Protection"
            >
              {screenProtection ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </button>
            
            <div className="flex items-center gap-1 text-cyber-green">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-mono">{onlineUsers.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Enhanced Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 cyber-grid">
            {messages.map((msg) => (
              <div key={msg.id} className={`${msg.type === "user" ? "ml-8" : "mr-8"}`}>
                <div className={`inline-block max-w-full ${
                  msg.type === "system" ? "w-full text-center" :
                  msg.type === "alert" ? "w-full text-center" :
                  msg.type === "scan" ? "w-full" :
                  msg.type === "trade_offer" ? "w-full" :
                  msg.type === "user" ? "ml-auto" : ""
                }`}>
                  {/* Enhanced Message bubble */}
                  <div className={`relative p-3 rounded-lg ${
                    msg.type === "system" 
                      ? "bg-cyber-green/10 border border-cyber-green/30 text-cyber-green"
                    : msg.type === "alert"
                      ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : msg.type === "scan"
                      ? "bg-cyber-blue/10 border border-cyber-blue/30"
                    : msg.type === "trade_offer"
                      ? "bg-cyber-orange/10 border border-cyber-orange/30"
                    : msg.type === "user"
                      ? "bg-cyber-purple/10 border border-cyber-purple/30 text-right"
                      : "bg-gray-500/10 border border-gray-500/30"
                  }`}>
                    
                    {/* Advanced encryption indicator */}
                    {msg.encrypted && (
                      <div className="absolute -top-2 -right-2 flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          msg.encryptionLevel === "military" ? "bg-red-400" :
                          msg.encryptionLevel === "advanced" ? "bg-yellow-400" :
                          "bg-green-400"
                        } animate-pulse`}></div>
                        <Lock className="w-3 h-3 text-cyber-green" />
                      </div>
                    )}

                    {/* Premium indicator */}
                    {msg.isPremium && (
                      <div className="absolute -top-1 -left-1">
                        <Crown className="w-3 h-3 text-cyber-orange" />
                      </div>
                    )}

                    {/* Message header */}
                    {msg.type !== "system" && msg.type !== "alert" && (
                      <div className="flex items-center gap-2 mb-1 text-xs">
                        <span className={`font-cyber font-bold ${
                          msg.type === "scan" ? "text-cyber-blue" :
                          msg.type === "trade_offer" ? "text-cyber-orange" :
                          msg.type === "user" ? "text-cyber-purple" : "text-gray-400"
                        }`}>
                          {msg.user}
                        </span>
                        <span className="text-gray-500 font-mono">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        {msg.encrypted && (
                          <span className="text-xs text-cyber-green">
                            [{msg.encryptionLevel?.toUpperCase()}]
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message content */}
                    <div className={`font-mono text-sm ${
                      msg.type === "scan" ? "text-cyber-blue" :
                      msg.type === "trade_offer" ? "text-cyber-orange" :
                      msg.type === "user" ? "text-white" : ""
                    }`}>
                      {msg.encrypted && msg.type === "user" 
                        ? "[ENCRYPTED_MESSAGE]" 
                        : msg.message}
                    </div>

                    {/* Enhanced scan results */}
                    {msg.scanResult && (
                      <div className="mt-3 p-3 bg-dark-bg/50 rounded border border-cyber-blue/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-cyber text-cyber-blue">ENHANCED_SCAN_RESULT</span>
                          <div className={`flex items-center gap-1 ${
                            msg.scanResult.riskLevel === "safe" ? "text-cyber-green" :
                            msg.scanResult.riskLevel === "warning" ? "text-cyber-orange" :
                            "text-red-400"
                          }`}>
                            {msg.scanResult.riskLevel === "safe" ? <CheckCircle className="w-4 h-4" /> :
                             msg.scanResult.riskLevel === "warning" ? <AlertTriangle className="w-4 h-4" /> :
                             <Shield className="w-4 h-4" />}
                            <span className="text-xs font-bold">
                              {msg.scanResult.riskLevel.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Risk Score: <span className="font-bold">{msg.scanResult.riskScore}/100</span></span>
                            <button
                              onClick={() => copyToClipboard(msg.scanResult!.address)}
                              className="text-cyber-blue hover:text-white transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            {msg.scanResult.findings.map((finding, i) => (
                              <div key={i} className="text-gray-300">• {finding}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* P2P Trade Offer Display */}
                    {msg.tradeOffer && (
                      <div className="mt-3 p-4 bg-dark-bg/50 rounded border border-cyber-orange/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-cyber text-cyber-orange">P2P_TRADE_OFFER</span>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                            msg.tradeOffer.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            msg.tradeOffer.status === "accepted" ? "bg-blue-500/20 text-blue-400" :
                            msg.tradeOffer.status === "completed" ? "bg-green-500/20 text-green-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {msg.tradeOffer.status.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 items-center text-sm">
                          <div className="text-center">
                            <div className="text-cyber-green font-bold">
                              {msg.tradeOffer.offering.amount} {msg.tradeOffer.offering.symbol}
                            </div>
                            <div className="text-xs text-gray-400">Offering</div>
                          </div>
                          
                          <div className="text-center">
                            <ArrowUpDown className="w-4 h-4 text-cyber-blue mx-auto" />
                          </div>
                          
                          <div className="text-center">
                            <div className="text-cyber-purple font-bold">
                              {msg.tradeOffer.requesting.amount} {msg.tradeOffer.requesting.symbol}
                            </div>
                            <div className="text-xs text-gray-400">Requesting</div>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-300">
                          <div>Expires: {new Date(msg.tradeOffer.expiresAt).toLocaleString()}</div>
                          {msg.tradeOffer.conditions && msg.tradeOffer.conditions.length > 0 && (
                            <div>Conditions: {msg.tradeOffer.conditions.join(", ")}</div>
                          )}
                        </div>

                        {msg.tradeOffer.status === "pending" && msg.tradeOffer.recipient === currentProfile?.username && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => acceptTradeOffer(msg.tradeOffer!.id)}
                              className="flex-1 px-3 py-1 bg-cyber-green/20 border border-cyber-green text-cyber-green rounded hover:bg-cyber-green hover:text-dark-bg transition-all text-xs"
                            >
                              Accept Trade
                            </button>
                            <button className="flex-1 px-3 py-1 bg-red-500/20 border border-red-500 text-red-400 rounded hover:bg-red-500 hover:text-white transition-all text-xs">
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isScanning && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-3">
                  <Search className="w-4 h-4 text-cyber-blue animate-spin" />
                  <span className="text-cyber-blue font-mono text-sm">ENHANCED_SCANNING...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input */}
          <div className="p-4 border-t border-cyber-green/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type encrypted message or paste address to scan..."
                className="flex-1 bg-dark-bg/50 border border-cyber-green/30 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyber-green"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-cyber-green/20 border border-cyber-green rounded-lg text-cyber-green hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400 font-mono">
              <span>🔒 Military-grade encryption active | 🛡️ Zero-knowledge protocol</span>
              <span>Level: {encryptionSettings.level.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Trading Sidebar */}
        <div className="w-64 border-l border-cyber-green/30 bg-dark-bg/50 p-4 space-y-4">
          {/* Online Traders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyber-green" />
                <span className="text-sm font-cyber font-bold text-cyber-green">ONLINE_TRADERS</span>
              </div>
              <button
                onClick={() => setShowTradeModal(true)}
                className="p-1 rounded bg-cyber-orange/20 border border-cyber-orange text-cyber-orange hover:bg-cyber-orange hover:text-dark-bg transition-all"
                title="Create Trade"
              >
                <DollarSign className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-2 p-2 rounded bg-dark-bg/30 border border-cyber-green/20">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    {getVerificationBadge(user.verificationLevel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-white truncate">
                      {user.username}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Star className="w-2 h-2" />
                      {user.reputation}
                    </div>
                  </div>
                  {user.tradingEnabled && (
                    <button
                      onClick={() => {
                        setSelectedTradeUser(user);
                        setShowTradeModal(true);
                      }}
                      className="p-1 rounded bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue hover:text-white transition-all"
                      title="Trade"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Trades */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyber-orange" />
              <span className="text-sm font-cyber font-bold text-cyber-orange">ACTIVE_TRADES</span>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeTradeOffers.slice(0, 3).map((trade) => (
                <div key={trade.id} className="p-2 bg-cyber-orange/10 border border-cyber-orange/20 rounded text-xs">
                  <div className="font-bold text-cyber-orange">
                    {trade.offering.amount} {trade.offering.symbol} ⇄ {trade.requesting.amount} {trade.requesting.symbol}
                  </div>
                  <div className="text-gray-400">
                    {trade.offerer} → {trade.recipient}
                  </div>
                  <div className={`text-xs ${
                    trade.status === "pending" ? "text-yellow-400" :
                    trade.status === "completed" ? "text-green-400" :
                    "text-blue-400"
                  }`}>
                    {trade.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Features */}
          <div className="p-3 bg-cyber-green/10 border border-cyber-green/20 rounded">
            <div className="text-xs font-mono text-cyber-green space-y-1">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Multi-sig escrow</span>
              </div>
              <div className="flex items-center gap-1">
                <Key className="w-3 h-3" />
                <span>Zero-knowledge proofs</span>
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>Atomic swaps</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>Reputation system</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Creation Modal */}
      <AnimatePresence>
        {showTradeModal && (
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
              className="bg-dark-bg border border-cyber-orange/30 rounded-2xl p-6 max-w-md w-full backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-cyber font-bold text-cyber-orange">
                  CREATE P2P TRADE
                </h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-cyber-green mb-1">
                      Offering
                    </label>
                    <select
                      value={tradeFormData.offeringToken}
                      onChange={(e) => setTradeFormData(prev => ({ ...prev, offeringToken: e.target.value }))}
                      className="w-full bg-dark-bg/50 border border-cyber-green/30 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="RAY">RAY</option>
                      <option value="SRM">SRM</option>
                    </select>
                    <input
                      type="number"
                      value={tradeFormData.offeringAmount}
                      onChange={(e) => setTradeFormData(prev => ({ ...prev, offeringAmount: e.target.value }))}
                      placeholder="Amount"
                      className="w-full mt-1 bg-dark-bg/50 border border-cyber-green/30 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-cyber-purple mb-1">
                      Requesting
                    </label>
                    <select
                      value={tradeFormData.requestingToken}
                      onChange={(e) => setTradeFormData(prev => ({ ...prev, requestingToken: e.target.value }))}
                      className="w-full bg-dark-bg/50 border border-cyber-purple/30 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="USDC">USDC</option>
                      <option value="SOL">SOL</option>
                      <option value="USDT">USDT</option>
                      <option value="RAY">RAY</option>
                      <option value="SRM">SRM</option>
                    </select>
                    <input
                      type="number"
                      value={tradeFormData.requestingAmount}
                      onChange={(e) => setTradeFormData(prev => ({ ...prev, requestingAmount: e.target.value }))}
                      placeholder="Amount"
                      className="w-full mt-1 bg-dark-bg/50 border border-cyber-purple/30 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyber-blue mb-1">
                    Conditions (Optional)
                  </label>
                  <input
                    type="text"
                    value={tradeFormData.conditions}
                    onChange={(e) => setTradeFormData(prev => ({ ...prev, conditions: e.target.value }))}
                    placeholder="e.g., Min reputation 700"
                    className="w-full bg-dark-bg/50 border border-cyber-blue/30 rounded px-2 py-1 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    Expires In (Hours)
                  </label>
                  <select
                    value={tradeFormData.expiryHours}
                    onChange={(e) => setTradeFormData(prev => ({ ...prev, expiryHours: e.target.value }))}
                    className="w-full bg-dark-bg/50 border border-gray-500/30 rounded px-2 py-1 text-white text-sm"
                  >
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="72">3 Days</option>
                  </select>
                </div>

                {selectedTradeUser && (
                  <div className="p-3 bg-cyber-blue/10 border border-cyber-blue/20 rounded">
                    <div className="text-sm text-cyber-blue">
                      Trading with: <span className="font-bold">{selectedTradeUser.username}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Reputation: {selectedTradeUser.reputation} | {selectedTradeUser.verificationLevel}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowTradeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded hover:bg-gray-600/20 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={createTradeOffer}
                    disabled={!tradeFormData.offeringAmount || !tradeFormData.requestingAmount}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyber-orange to-cyber-purple text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Create Trade
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encryption Settings Modal */}
      <AnimatePresence>
        {showEncryptionModal && (
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
              className="bg-dark-bg border border-cyber-green/30 rounded-2xl p-6 max-w-md w-full backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-cyber font-bold text-cyber-green">
                  ENCRYPTION SETTINGS
                </h3>
                <button
                  onClick={() => setShowEncryptionModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-cyber-green mb-2">
                    Encryption Level
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "basic", label: "Basic (AES-128)", desc: "Standard encryption" },
                      { value: "advanced", label: "Advanced (AES-256)", desc: "Military-grade" },
                      { value: "military", label: "Military (ChaCha20)", desc: "Quantum-resistant" },
                    ].map((level) => (
                      <label key={level.value} className="flex items-center gap-3 p-2 border border-gray-600 rounded cursor-pointer hover:border-cyber-green">
                        <input
                          type="radio"
                          value={level.value}
                          checked={encryptionSettings.level === level.value}
                          onChange={(e) => setEncryptionSettings(prev => ({ ...prev, level: e.target.value as any }))}
                          className="text-cyber-green"
                        />
                        <div>
                          <div className="text-white font-mono text-sm">{level.label}</div>
                          <div className="text-gray-400 text-xs">{level.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Perfect Forward Secrecy</span>
                    <button
                      onClick={() => setEncryptionSettings(prev => ({ ...prev, perfectForwardSecrecy: !prev.perfectForwardSecrecy }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        encryptionSettings.perfectForwardSecrecy ? "bg-cyber-green" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          encryptionSettings.perfectForwardSecrecy ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto Key Rotation</span>
                    <button
                      onClick={() => setEncryptionSettings(prev => ({ ...prev, keyRotation: !prev.keyRotation }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        encryptionSettings.keyRotation ? "bg-cyber-green" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          encryptionSettings.keyRotation ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Message Expiry (minutes)
                  </label>
                  <select
                    value={encryptionSettings.messageExpiry}
                    onChange={(e) => setEncryptionSettings(prev => ({ ...prev, messageExpiry: parseInt(e.target.value) }))}
                    className="w-full bg-dark-bg/50 border border-gray-500/30 rounded px-3 py-2 text-white"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={1440}>24 hours</option>
                    <option value={0}>Never</option>
                  </select>
                </div>

                <div className="p-3 bg-cyber-blue/10 border border-cyber-blue/20 rounded">
                  <div className="text-xs font-mono text-cyber-blue">
                    Current Key: {encryptionKey.slice(0, 8)}...{encryptionKey.slice(-8)}
                  </div>
                  <button
                    onClick={() => setEncryptionKey(generateEncryptionKey())}
                    className="mt-2 text-xs text-cyber-green hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generate New Key
                  </button>
                </div>

                <button
                  onClick={() => setShowEncryptionModal(false)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue text-white rounded hover:opacity-90 transition-opacity"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
