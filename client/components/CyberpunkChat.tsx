import { useState, useEffect, useRef } from "react";
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
  Crown,
  Globe,
  Activity,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  type: "user" | "system" | "scan" | "alert";
  scanResult?: {
    address: string;
    riskLevel: "safe" | "warning" | "danger";
    riskScore: number;
    findings: string[];
  };
  encrypted?: boolean;
  isPremium?: boolean;
}

interface OnlineUser {
  id: string;
  username: string;
  role: "ghost" | "scanner" | "premium" | "admin";
  lastSeen: number;
}

export default function CyberpunkChat() {
  const { connected, publicKey } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [screenProtection, setScreenProtection] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [glitchText, setGlitchText] = useState("");

  // Prevent screenshots when enabled
  useEffect(() => {
    if (screenProtection) {
      const preventScreenshot = (e: KeyboardEvent) => {
        // Prevent Print Screen, Alt+Print Screen, Ctrl+Shift+I, F12
        if (
          e.key === "PrintScreen" ||
          (e.altKey && e.key === "PrintScreen") ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          e.key === "F12"
        ) {
          e.preventDefault();
          addSystemMessage(
            "🛡️ SCREENSHOT_BLOCKED: Screen capture prevented",
            "alert",
          );
        }
      };

      const preventContext = (e: MouseEvent) => {
        e.preventDefault();
        addSystemMessage(
          "🛡️ RIGHT_CLICK_BLOCKED: Context menu disabled for security",
          "alert",
        );
      };

      document.addEventListener("keydown", preventScreenshot);
      document.addEventListener("contextmenu", preventContext);

      return () => {
        document.removeEventListener("keydown", preventScreenshot);
        document.removeEventListener("contextmenu", preventContext);
      };
    }
  }, [screenProtection]);

  // Glitch effect for terminal text
  useEffect(() => {
    const glitchTexts = [
      "NEURAL_LINK_ESTABLISHED",
      "PACKET_INJECTION_DETECTED",
      "CRYPTO_SIGNATURE_VERIFIED",
      "BLOCKCHAIN_SYNC_IN_PROGRESS",
      "THREAT_ANALYSIS_RUNNING",
      "DATA_GHOST_PROTOCOL_ACTIVE",
    ];

    const interval = setInterval(() => {
      setGlitchText(
        glitchTexts[Math.floor(Math.random() * glitchTexts.length)],
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mock online users
  useEffect(() => {
    setOnlineUsers([
      {
        id: "1",
        username: "DataGhost_01",
        role: "admin",
        lastSeen: Date.now(),
      },
      {
        id: "2",
        username: "CryptoScanner",
        role: "premium",
        lastSeen: Date.now() - 30000,
      },
      {
        id: "3",
        username: "BlockchainNinja",
        role: "scanner",
        lastSeen: Date.now() - 120000,
      },
      {
        id: "4",
        username: "Anonymous_Ghost",
        role: "ghost",
        lastSeen: Date.now() - 60000,
      },
    ]);

    // Add welcome message
    addSystemMessage("🌐 WELCOME TO THE DATA GHOST NETWORK", "system");
    addSystemMessage("🔒 End-to-end encryption: ACTIVE", "system");
    addSystemMessage("👁️ Screenshot protection: ENABLED", "system");
  }, []);

  const addSystemMessage = (
    message: string,
    type: "system" | "alert" = "system",
  ) => {
    const systemMsg: ChatMessage = {
      id: Date.now().toString(),
      user: "SYSTEM",
      message,
      timestamp: Date.now(),
      type,
      encrypted: isEncrypted,
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  const detectAddressInMessage = (message: string): string | null => {
    // Solana address pattern (44 characters, base58)
    const solanaRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
    // Ethereum address pattern (42 characters, hex)
    const ethRegex = /0x[a-fA-F0-9]{40}/g;

    const solanaMatch = message.match(solanaRegex);
    const ethMatch = message.match(ethRegex);

    return solanaMatch?.[0] || ethMatch?.[0] || null;
  };

  const scanAddress = async (address: string) => {
    setIsScanning(true);

    try {
      // Mock scan for demo - in production this would call the real scanner API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockRiskScore = Math.floor(Math.random() * 100);
      const riskLevel =
        mockRiskScore > 70 ? "danger" : mockRiskScore > 40 ? "warning" : "safe";

      const findings = [];
      if (riskLevel === "danger") {
        findings.push(
          "Potential rug pull pattern detected",
          "High-risk transactions identified",
        );
      } else if (riskLevel === "warning") {
        findings.push(
          "Unusual trading patterns",
          "Medium risk indicators present",
        );
      } else {
        findings.push(
          "No major red flags detected",
          "Standard transaction patterns",
        );
      }

      const scanResult: ChatMessage = {
        id: Date.now().toString(),
        user: "NIMREV_SCANNER",
        message: `🔍 SCAN_COMPLETE: ${address.substring(0, 8)}...${address.substring(-8)}`,
        timestamp: Date.now(),
        type: "scan",
        scanResult: {
          address,
          riskLevel,
          riskScore: mockRiskScore,
          findings,
        },
        encrypted: isEncrypted,
      };

      setMessages((prev) => [...prev, scanResult]);
    } catch (error) {
      addSystemMessage(
        "❌ SCAN_ERROR: Unable to complete address scan",
        "alert",
      );
    } finally {
      setIsScanning(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user: connected ? `Ghost_${publicKey?.slice(-4)}` : "Anonymous",
      message: newMessage,
      timestamp: Date.now(),
      type: "user",
      encrypted: isEncrypted,
      isPremium: connected, // Mock premium status based on wallet connection
    };

    setMessages((prev) => [...prev, userMsg]);

    // Check for address in message and auto-scan
    const detectedAddress = detectAddressInMessage(newMessage);
    if (detectedAddress) {
      addSystemMessage(
        `🎯 ADDRESS_DETECTED: Initiating scan on ${detectedAddress.substring(0, 8)}...`,
        "system",
      );
      await scanAddress(detectedAddress);
    }

    setNewMessage("");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-cyber-orange" />;
      case "premium":
        return <Zap className="w-4 h-4 text-cyber-purple" />;
      case "scanner":
        return <Search className="w-4 h-4 text-cyber-blue" />;
      default:
        return (
          <div className="w-4 h-4 text-cyber-green flex items-center justify-center text-xs">
            🐭
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative border border-cyber-green/30 bg-dark-bg/90 backdrop-blur-xl rounded-2xl overflow-hidden">
      {/* Screen protection overlay */}
      {screenProtection && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-green to-transparent animate-cyber-scan"></div>
          <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-cyber-blue to-transparent animate-cyber-scan"></div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 border-b border-cyber-green/30 p-4 bg-gradient-to-r from-dark-bg via-dark-bg/80 to-dark-bg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-6 h-6 text-cyber-green animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-green rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-lg font-cyber font-bold text-cyber-green">
                DATA_GHOST_NETWORK
              </h3>
              <p
                className="text-xs font-mono text-gray-400 glitch"
                data-text={glitchText}
              >
                {glitchText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEncrypted(!isEncrypted)}
              className={`p-2 rounded-lg border ${
                isEncrypted
                  ? "bg-cyber-green/20 border-cyber-green text-cyber-green"
                  : "bg-red-500/20 border-red-500 text-red-400"
              } transition-all duration-300`}
              title="Toggle E2E Encryption"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              onClick={() => setScreenProtection(!screenProtection)}
              className={`p-2 rounded-lg border ${
                screenProtection
                  ? "bg-cyber-blue/20 border-cyber-blue text-cyber-blue"
                  : "bg-gray-500/20 border-gray-500 text-gray-400"
              } transition-all duration-300`}
              title="Toggle Screenshot Protection"
            >
              {screenProtection ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-1 text-cyber-green">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-mono">{onlineUsers.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 cyber-grid">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${msg.type === "user" ? "ml-8" : "mr-8"}`}
              >
                <div
                  className={`inline-block max-w-full ${
                    msg.type === "system"
                      ? "w-full text-center"
                      : msg.type === "alert"
                        ? "w-full text-center"
                        : msg.type === "scan"
                          ? "w-full"
                          : msg.type === "user"
                            ? "ml-auto"
                            : ""
                  }`}
                >
                  {/* Message bubble */}
                  <div
                    className={`relative p-3 rounded-lg ${
                      msg.type === "system"
                        ? "bg-cyber-green/10 border border-cyber-green/30 text-cyber-green"
                        : msg.type === "alert"
                          ? "bg-red-500/10 border border-red-500/30 text-red-400"
                          : msg.type === "scan"
                            ? "bg-cyber-blue/10 border border-cyber-blue/30"
                            : msg.type === "user"
                              ? "bg-cyber-purple/10 border border-cyber-purple/30 text-right"
                              : "bg-gray-500/10 border border-gray-500/30"
                    }`}
                  >
                    {/* Encryption indicator */}
                    {msg.encrypted && (
                      <div className="absolute -top-1 -right-1">
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
                        <span
                          className={`font-cyber font-bold ${
                            msg.type === "scan"
                              ? "text-cyber-blue"
                              : msg.type === "user"
                                ? "text-cyber-purple"
                                : "text-gray-400"
                          }`}
                        >
                          {msg.user}
                        </span>
                        <span className="text-gray-500 font-mono">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Message content */}
                    <div
                      className={`font-mono text-sm ${
                        msg.type === "scan"
                          ? "text-cyber-blue"
                          : msg.type === "user"
                            ? "text-white"
                            : ""
                      }`}
                    >
                      {msg.message}
                    </div>

                    {/* Scan results */}
                    {msg.scanResult && (
                      <div className="mt-3 p-3 bg-dark-bg/50 rounded border border-cyber-blue/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-cyber text-cyber-blue">
                            SCAN_RESULT
                          </span>
                          <div
                            className={`flex items-center gap-1 ${
                              msg.scanResult.riskLevel === "safe"
                                ? "text-cyber-green"
                                : msg.scanResult.riskLevel === "warning"
                                  ? "text-cyber-orange"
                                  : "text-red-400"
                            }`}
                          >
                            {msg.scanResult.riskLevel === "safe" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : msg.scanResult.riskLevel === "warning" ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                            <span className="text-xs font-bold">
                              {msg.scanResult.riskLevel.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs space-y-1">
                          <div>
                            Risk Score:{" "}
                            <span className="font-bold">
                              {msg.scanResult.riskScore}/100
                            </span>
                          </div>
                          <div className="space-y-1">
                            {msg.scanResult.findings.map((finding, i) => (
                              <div key={i} className="text-gray-300">
                                • {finding}
                              </div>
                            ))}
                          </div>
                        </div>
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
                  <span className="text-cyber-blue font-mono text-sm">
                    SCANNING_ADDRESS...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-cyber-green/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  connected
                    ? "Type message or paste address to scan..."
                    : "Connect wallet to chat..."
                }
                disabled={!connected}
                className="flex-1 bg-dark-bg/50 border border-cyber-green/30 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyber-green disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!connected || !newMessage.trim()}
                className="px-4 py-2 bg-cyber-green/20 border border-cyber-green rounded-lg text-cyber-green hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {!connected && (
              <p className="text-xs text-gray-400 font-mono mt-2 text-center">
                🔒 Connect wallet to join the conversation
              </p>
            )}
          </div>
        </div>

        {/* Online Users Sidebar */}
        <div className="w-48 border-l border-cyber-green/30 bg-dark-bg/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-cyber-green" />
            <span className="text-sm font-cyber font-bold text-cyber-green">
              ONLINE_GHOSTS
            </span>
          </div>

          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded bg-dark-bg/30 border border-cyber-green/20"
              >
                {getRoleIcon(user.role)}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-white truncate">
                    {user.username}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Date.now() - user.lastSeen < 60000
                      ? "online"
                      : Date.now() - user.lastSeen < 300000
                        ? "away"
                        : "offline"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-2 bg-cyber-green/10 border border-cyber-green/20 rounded">
            <div className="text-xs font-mono text-cyber-green">
              <div>🆓 FREE: Basic chat</div>
              <div>👑 PREMIUM: Address scanning</div>
              <div>🔒 E2E encryption enabled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
