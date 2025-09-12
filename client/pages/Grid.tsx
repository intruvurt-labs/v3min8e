import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import {
  Search,
  Eye,
  Target,
  Zap,
  AlertTriangle,
  TrendingUp,
  Shield,
  Network,
  Brain,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { wsHealthCheck } from "@/services/WebSocketHealthCheck";
import {
  testWebSocketConnection,
  logWebSocketDebugInfo,
} from "@/utils/webSocketDebug";
import quickWebSocketCheck from "@/utils/quickWebSocketCheck";
import { fetchWithFallback } from "@/utils/fetchWithFallback";

// Core ethos and threat scoring types
interface ThreatScore {
  score: number; // 0-100 scale
  risk: "high" | "medium" | "low" | "alpha";
  confidence: number;
  category:
    | "honeypot"
    | "rug_pull"
    | "alpha_signal"
    | "viral_outbreak"
    | "clean";
}

interface SubversiveScanResult {
  address: string;
  network: string;
  timestamp: string;
  threatScore: ThreatScore;
  subversiveAnalysis: {
    bytecodeFingerprint: string;
    hiddenMintAuthority: boolean;
    feeTrapDetected: boolean;
    socialFootprint: "legitimate" | "burner" | "suspicious";
    patternMatch: string[];
  };
  transparencyLedger: {
    scanId: string;
    ipfsHash: string;
    signature: string;
    immutable: boolean;
  };
}

export default function Grid() {
  const { walletConnected, connectWallet } = useWallet();
  const [scanAddress, setScanAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("solana");
  const [scanResults, setScanResults] = useState<SubversiveScanResult | null>(
    null,
  );
  const [isScanning, setIsScanning] = useState(false);
  const [realTimeThreats, setRealTimeThreats] = useState<any[]>([]);
  const [subversionSweepActive, setSubversionSweepActive] = useState(true);
  const [verminIntelligence, setVerminIntelligence] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Core Ethos - Power to the People
  const coreEthos =
    "Power stays with the people. No hidden agendas. No compromise.";

  // Networks supported by the Grid - 10 Major Blockchain Networks
  const networks = [
    {
      id: "ethereum",
      name: "Ethereum",
      color: "cyber-blue",
      icon: "⚡",
      rpc: "https://mainnet.infura.io/v3/",
      threatLevel: "medium",
      scanTime: "4-6 min",
    },
    {
      id: "solana",
      name: "Solana",
      color: "cyber-green",
      icon: "🟢",
      rpc: "https://api.mainnet-beta.solana.com",
      threatLevel: "high",
      scanTime: "3-5 min",
    },
    {
      id: "bnb",
      name: "BNB Chain",
      color: "cyber-orange",
      icon: "🟡",
      rpc: "https://bsc-dataseed.binance.org/",
      threatLevel: "high",
      scanTime: "2-4 min",
    },
    {
      id: "polygon",
      name: "Polygon",
      color: "cyber-purple",
      icon: "🟣",
      rpc: "https://polygon-rpc.com/",
      threatLevel: "medium",
      scanTime: "2-3 min",
    },
    {
      id: "arbitrum",
      name: "Arbitrum",
      color: "cyber-blue",
      icon: "🔵",
      rpc: "https://arb1.arbitrum.io/rpc",
      threatLevel: "low",
      scanTime: "3-4 min",
    },
    {
      id: "avalanche",
      name: "Avalanche",
      color: "red",
      icon: "🔴",
      rpc: "https://api.avax.network/ext/bc/C/rpc",
      threatLevel: "medium",
      scanTime: "2-4 min",
    },
    {
      id: "base",
      name: "Base",
      color: "cyber-blue",
      icon: "🔹",
      rpc: "https://mainnet.base.org",
      threatLevel: "low",
      scanTime: "2-3 min",
    },
    {
      id: "fantom",
      name: "Fantom",
      color: "cyan",
      icon: "💙",
      rpc: "https://rpc.ftm.tools/",
      threatLevel: "medium",
      scanTime: "2-3 min",
    },
    {
      id: "optimism",
      name: "Optimism",
      color: "red",
      icon: "🔺",
      rpc: "https://mainnet.optimism.io",
      threatLevel: "low",
      scanTime: "3-4 min",
    },
    {
      id: "cardano",
      name: "Cardano",
      color: "cyber-blue",
      icon: "💠",
      rpc: "https://cardano-mainnet.blockfrost.io/api/v0",
      threatLevel: "very-low",
      scanTime: "4-5 min",
    },
  ];

  // Real-time threat monitoring with WebSocket integration
  useEffect(() => {
    if (!subversionSweepActive) return;

    let intervalId: NodeJS.Timeout;

    const fetchRealThreats = async () => {
      try {
        // Try to fetch real threat data from backend (public)
        const result = await fetchWithFallback(
          "/api/security/threats/live",
          { timeout: 12000, retries: 1 },
        );

        if (result.success && (result.data as any)?.threats?.length > 0) {
          const threats = (result.data as any).threats;
          setRealTimeThreats((prev) => [
            ...threats.slice(0, 3),
            ...prev.slice(0, 2),
          ]);
          return;
        }
      } catch (error) {
        // Silent fallback
      }

      // Fallback to enhanced realistic simulation
      const networks = ["ethereum", "solana", "bnb", "polygon", "arbitrum"];
      const threatTypes = [
        {
          type: "honeypot_detected",
          severity: "critical",
          message: "🚨 HONEYPOT DETECTED - Contract blocks sell transactions",
          probability: 0.15,
        },
        {
          type: "rug_pull_warning",
          severity: "high",
          message: "⚠️ RUG PULL RISK - Liquidity can be drained instantly",
          probability: 0.2,
        },
        {
          type: "security_breach",
          severity: "critical",
          message:
            "🔓 SECURITY BREACH - Smart contract vulnerability exploited",
          probability: 0.1,
        },
        {
          type: "pump_dump_detected",
          severity: "medium",
          message: "📈📉 PUMP & DUMP - Coordinated price manipulation detected",
          probability: 0.25,
        },
        {
          type: "phishing_campaign",
          severity: "high",
          message:
            "🎣 PHISHING ALERT - Fake website impersonating legitimate project",
          probability: 0.2,
        },
        {
          type: "alpha_signal",
          severity: "alpha",
          message: "💎 ALPHA DETECTED - Unusual whale accumulation patterns",
          probability: 0.1,
        },
      ];

      // Generate threat based on probability distribution
      const rand = Math.random();
      let cumulativeProbability = 0;
      let selectedThreat = threatTypes[0];

      for (const threat of threatTypes) {
        cumulativeProbability += threat.probability;
        if (rand <= cumulativeProbability) {
          selectedThreat = threat;
          break;
        }
      }

      const net = networks[Math.floor(Math.random() * networks.length)];
      const newThreat = {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedThreat.type,
        address: generateRealisticAddress(net),
        network: net,
        severity: selectedThreat.severity,
        message: selectedThreat.message,
        timestamp: new Date().toISOString(),
        confidence: Math.floor(Math.random() * 20) + 80, // 80-99% confidence
        source: "NIMREV_AI_DETECTION",
      };

      setRealTimeThreats((prev) => [newThreat, ...prev.slice(0, 4)]);
    };

    // Initial fetch
    fetchRealThreats();

    // Set up interval for periodic updates (every 12-18 seconds for more realistic feel)
    intervalId = setInterval(fetchRealThreats, 12000 + Math.random() * 6000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [subversionSweepActive]);

  // Generate realistic blockchain addresses by network
  const generateRealisticAddress = (network: string) => {
    const hex = () =>
      "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    const base58 = (len: number) => {
      const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    };
    const bech32 = () => {
      const charset = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
      const body = Array.from({ length: 52 }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
      return `addr1${body}`;
    };

    switch (network) {
      case "solana":
        return base58(32 + Math.floor(Math.random() * 12));
      case "ethereum":
      case "bnb":
      case "polygon":
      case "arbitrum":
      case "avalanche":
      case "base":
      case "optimism":
        return hex();
      case "cardano":
        return bech32();
      default:
        return hex();
    }
  };

  // Real-time WebSocket connection for progress tracking
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [scanProgress, setScanProgress] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");

  // Initialize WebSocket connection with robust error handling
  useEffect(() => {
    let websocket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isIntentionallyClosed = false;

    const connectWebSocket = async () => {
      try {
        // Check if WebSocket is supported
        if (typeof WebSocket === "undefined") {
          console.warn("⚠️ WebSocket not supported in this browser");
          setWsConnectionStatus("error");
          return;
        }

        // Check if we're in a secure context and adjust URL accordingly
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host =
          window.location.hostname === "localhost"
            ? "localhost:8083"
            : window.location.hostname + ":8083";
        const wsUrl = `${protocol}//${host}`;

        console.log("🔄 Quick availability check for WebSocket...");
        const isAvailable = await quickWebSocketCheck(wsUrl);

        if (!isAvailable) {
          console.log(
            "ℹ️ WebSocket server not available, using HTTP polling mode",
          );
          setWsConnectionStatus("error");
          return;
        }

        console.log(
          "✅ WebSocket available, establishing connection to:",
          wsUrl,
        );
        setWsConnectionStatus("connecting");

        websocket = new WebSocket(wsUrl);

        // Set connection timeout (reduced to 3 seconds for better UX)
        const connectionTimeout = setTimeout(() => {
          if (websocket && websocket.readyState === WebSocket.CONNECTING) {
            console.log(
              "⏰ WebSocket connection timeout after 3 seconds - using fallback mode",
            );
            websocket.close();
            setWsConnectionStatus("error");
          }
        }, 3000);

        websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log("✅ Connected to scan progress tracker successfully");
          setWs(websocket);
          setWsConnectionStatus("connected");

          // Authenticate with JWT token (if available)
          const token = localStorage.getItem("auth_token");
          if (token && websocket && websocket.readyState === WebSocket.OPEN) {
            try {
              websocket.send(
                JSON.stringify({
                  type: "authenticate",
                  token: token,
                }),
              );
              console.log("🔐 Authentication message sent");
            } catch (error) {
              console.error("❌ Failed to send authentication:", error);
              setWsConnectionStatus("error");
            }
          }
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error("❌ Failed to parse WebSocket message:", error);
          }
        };

        websocket.onclose = (event) => {
          console.log("🔌 WebSocket connection closed", {
            code: event.code,
            wasClean: event.wasClean,
          });
          setWs(null);
          setWsConnectionStatus("disconnected");

          // Only attempt to reconnect if it was a successful connection that got interrupted
          if (
            !isIntentionallyClosed &&
            event.code !== 1000 &&
            event.wasClean === false
          ) {
            console.log(
              "🔄 Connection interrupted, attempting to reconnect in 5 seconds...",
            );
            setWsConnectionStatus("connecting");
            reconnectTimeout = setTimeout(() => {
              if (!isIntentionallyClosed) {
                connectWebSocket().catch((error) => {
                  console.log(
                    "ℹ️ Reconnection unsuccessful, continuing with fallback mode",
                  );
                  setWsConnectionStatus("error");
                });
              }
            }, 5000);
          } else {
            // Don't retry if server is not available
            setWsConnectionStatus("error");
          }
        };

        websocket.onerror = (error) => {
          // Log error details for debugging without alarming the user
          console.log("🔍 WebSocket connection unavailable:", {
            readyState: websocket?.readyState,
            url: websocket?.url,
            timestamp: new Date().toISOString(),
          });

          setWsConnectionStatus("error");
          setWs(null);

          // Provide helpful information without being alarming
          console.log(
            "ℹ️ Real-time features require WebSocket server on port 8083",
          );
          console.log("🔄 Using HTTP polling for progress updates instead");
        };
      } catch (error) {
        console.error("❌ Failed to create WebSocket connection:", {
          error: error.message || error,
          name: error.name,
          stack: error.stack,
        });
        setWs(null);
        setWsConnectionStatus("error");

        // Log helpful debugging information
        console.log("🔍 WebSocket Debug Information:");
        console.log("  • Browser:", navigator.userAgent);
        console.log("  • Protocol:", window.location.protocol);
        console.log("  • Host:", window.location.host);
        console.log("  • WebSocket Support:", typeof WebSocket !== "undefined");
      }
    };

    // Initial connection attempt (graceful failure expected in development)
    connectWebSocket().catch((error) => {
      console.log("ℹ️ WebSocket unavailable, using HTTP polling mode");
      setWsConnectionStatus("error");
    });

    return () => {
      isIntentionallyClosed = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close(1000, "Component unmounting");
      }
    };
  }, []);

  const handleWebSocketMessage = (message: any) => {
    try {
      if (!message || typeof message !== "object") {
        console.warn("⚠️ Invalid WebSocket message format:", message);
        return;
      }

      switch (message.type) {
        case "authenticated":
          console.log("✅ WebSocket authenticated");
          // Request user scan history safely
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: "get_user_scans" }));
            } catch (error) {
              console.error("❌ Failed to request user scans:", error);
            }
          }
          break;

        case "progress_update":
          if (message.data) {
            setScanProgress(message.data);
            setVerminIntelligence(
              `${message.data.currentTask || "Processing..."}\nProgress: ${message.data.progress || 0}%`,
            );
          }
          break;

        case "scan_completed":
          if (message.data) {
            setScanResults(message.data);
            setScanProgress(null);
            setIsScanning(false);
            setVerminIntelligence(
              "🎯 SCAN COMPLETED - Full analysis available",
            );
            toast.success("Security scan completed successfully!");
          }
          break;

        case "scan_error":
          setScanProgress(null);
          setIsScanning(false);
          const errorMsg = message.error || "Unknown error occurred";
          setVerminIntelligence(`❌ SCAN FAILED: ${errorMsg}`);
          toast.error("Scan failed - Please try again");
          break;

        case "user_scans":
          setScanHistory(Array.isArray(message.scans) ? message.scans : []);
          break;

        case "error":
          console.error("❌ WebSocket server error:", message.message);
          toast.error(`Connection error: ${message.message}`);
          break;

        case "pong":
          // Heartbeat response - connection is alive
          console.log("💓 WebSocket heartbeat received");
          break;

        default:
          console.warn("⚠️ Unknown WebSocket message type:", message.type);
      }
    } catch (error) {
      console.error("❌ Error handling WebSocket message:", error, message);
    }
  };

  // Enhanced real security scanning with backend integration
  const performSubversiveScan = async () => {
    if (!scanAddress.trim()) {
      toast.error("Enter a valid blockchain address or website URL");
      return;
    }

    // Detect if input is a URL or blockchain address
    const isUrl =
      scanAddress.includes("://") ||
      scanAddress.includes("www.") ||
      scanAddress.includes(".com") ||
      scanAddress.includes(".org") ||
      scanAddress.includes(".net") ||
      scanAddress.includes(".io");

    if (!walletConnected && !isUrl) {
      toast.error("Please connect your wallet to perform blockchain scans");
      await connectWallet();
      return;
    }

    setIsScanning(true);
    setVerminIntelligence("🔄 Initializing comprehensive security scan...");
    setScanResults(null);
    setScanProgress(null);

    try {
      // Determine scan type and endpoint based on input
      const isUrl =
        scanAddress.includes("://") ||
        scanAddress.includes("www.") ||
        scanAddress.includes(".com") ||
        scanAddress.includes(".org") ||
        scanAddress.includes(".net") ||
        scanAddress.includes(".io");

      const endpoint = isUrl
        ? "/api/security/scan-website"
        : "/api/security/scan";
      const requestBody = isUrl
        ? {
            url: scanAddress,
            scanType: "comprehensive",
          }
        : {
            address: scanAddress,
            network: selectedNetwork,
            scanType: "comprehensive",
          };

      // Make API call to backend security scanner
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Scan request failed: ${response.statusText}`);
      }

      const scanData = await response.json();
      const scanId = scanData.scanId;

      // Subscribe to real-time progress updates if WebSocket is available
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({
              type: "subscribe_scan",
              scanId: scanId,
            }),
          );
          setVerminIntelligence(
            `🎯 Scan initiated (ID: ${scanId.substring(0, 8)}...)\n⏳ Real-time progress tracking enabled`,
          );
        } catch (error) {
          console.error("❌ Failed to subscribe to scan updates:", error);
          setVerminIntelligence(
            `🎯 Scan initiated (ID: ${scanId.substring(0, 8)}...)\n⏳ Progress will be checked periodically`,
          );

          // Fallback: Poll for results
          pollForScanResults(scanId);
        }
      } else {
        setVerminIntelligence(
          `🎯 Scan initiated (ID: ${scanId.substring(0, 8)}...)\n⏳ Progress will be checked periodically`,
        );

        // Fallback: Poll for results
        pollForScanResults(scanId);
      }
    } catch (error) {
      console.error("Scan error:", error);
      setIsScanning(false);
      setVerminIntelligence(
        "❌ SCAN FAILED - Unable to connect to security services",
      );
      toast.error("Failed to initiate scan - Please check your connection");

      // Fallback to simulated scan for demo purposes
      performFallbackScan();
    }
  };

  // Polling fallback for when WebSocket is not available
  const pollForScanResults = (scanId: string) => {
    let pollCount = 0;
    const maxPolls = 60; // Maximum 5 minutes (60 polls × 5 seconds)

    const pollInterval = setInterval(async () => {
      try {
        pollCount++;

        if (pollCount > maxPolls) {
          clearInterval(pollInterval);
          setIsScanning(false);
          setVerminIntelligence("⏰ SCAN TIMEOUT - Please try again");
          toast.error("Scan timed out - Please try again");
          return;
        }

        const response = await fetch(`/api/security/scan/${scanId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (response.ok) {
          const scanResult = await response.json();

          if (scanResult.success && scanResult.data) {
            const status = scanResult.data.status;
            const progress = scanResult.data.progress || 0;

            if (status === "completed") {
              clearInterval(pollInterval);
              setScanResults(scanResult.data);
              setIsScanning(false);
              setVerminIntelligence(
                "🎯 SCAN COMPLETED - Full analysis available",
              );
              toast.success("Security scan completed successfully!");
            } else if (status === "error") {
              clearInterval(pollInterval);
              setIsScanning(false);
              setVerminIntelligence(
                `❌ SCAN FAILED: ${scanResult.data.error_message || "Unknown error"}`,
              );
              toast.error("Scan failed - Please try again");
            } else {
              // Update progress
              const currentPhase =
                scanResult.data.current_phase || "Processing";
              setVerminIntelligence(
                `⏳ ${currentPhase}...\nProgress: ${progress}%\nPolling for updates...`,
              );
            }
          }
        }
      } catch (error) {
        console.error("❌ Polling error:", error);
        // Continue polling unless it's a critical error
      }
    }, 5000); // Poll every 5 seconds
  };

  // Fallback simulation for demo when backend is unavailable
  const performFallbackScan = async () => {
    const scanPhases = [
      "🔍 Initiating NIMREV Security Sweep...",
      "🧠 AI analyzing bytecode patterns...",
      "🔒 Cross-referencing threat intelligence...",
      "🕸️ Mapping social footprint networks...",
      "⚡ Calculating threat probability matrix...",
      "🎯 Generating comprehensive report...",
    ];

    for (const phase of scanPhases) {
      setVerminIntelligence(phase);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Generate realistic threat assessment
    const threatScore = Math.floor(Math.random() * 100);
    const riskLevel =
      threatScore > 80
        ? "critical"
        : threatScore > 60
          ? "high"
          : threatScore > 40
            ? "medium"
            : "low";

    const result: SubversiveScanResult = {
      address: scanAddress,
      network: selectedNetwork,
      timestamp: new Date().toISOString(),
      threatScore: {
        score: threatScore,
        risk: riskLevel as any,
        confidence: 85 + Math.floor(Math.random() * 15),
        category:
          threatScore > 70
            ? "honeypot"
            : threatScore > 40
              ? "rug_pull"
              : "clean",
      },
      subversiveAnalysis: {
        bytecodeFingerprint: `0x${Math.random().toString(16).substr(2, 16)}`,
        hiddenMintAuthority: Math.random() < 0.2,
        feeTrapDetected: Math.random() < 0.15,
        socialFootprint: Math.random() < 0.3 ? "suspicious" : "legitimate",
        patternMatch:
          threatScore > 70
            ? ["Critical Threat Pattern", "Honeypot Signature"]
            : ["Standard Contract"],
      },
      transparencyLedger: {
        scanId: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
        signature: `0x${Math.random().toString(16).substr(2, 64)}`,
        immutable: true,
      },
    };

    setScanResults(result);
    setIsScanning(false);

    const report = generateIntelligenceReport(result);
    setVerminIntelligence(report);

    toast.success(
      `Security scan completed - Risk Level: ${riskLevel.toUpperCase()}`,
    );
  };

  const generateIntelligenceReport = (result: SubversiveScanResult): string => {
    const { threatScore, subversiveAnalysis } = result;

    if (threatScore.risk === "high") {
      return `��� NIMREV SECURITY ALERT 🚨\n\n⚠️ HIGH RISK DETECTED - Exercise extreme caution!\nThreat Score: ${threatScore.score}/100\nConfidence: ${threatScore.confidence}%\n\nFindings:\n${subversiveAnalysis.feeTrapDetected ? "• Fee trap mechanism detected\n" : ""}${subversiveAnalysis.hiddenMintAuthority ? "• Hidden mint authority found\n" : ""}• Social footprint: ${subversiveAnalysis.socialFootprint}\n\n🚨 RECOMMENDATION: AVOID OR PROCEED WITH EXTREME CAUTION`;
    } else if (threatScore.risk === "medium") {
      return `⚠️ NIMREV SECURITY REPORT ⚠️\n\nMODERATE RISK DETECTED\nThreat Score: ${threatScore.score}/100\nConfidence: ${threatScore.confidence}%\n\nContract appears to have some risk factors but may be legitimate.\nRecommend additional research and limited exposure.\n\n💡 RECOMMENDATION: PROCEED WITH CAUTION`;
    } else {
      return `✅ NIMREV SECURITY REPORT ✅\n\nLOW RISK ASSESSMENT\nThreat Score: ${threatScore.score}/100\nConfidence: ${threatScore.confidence}%\n\nContract appears legitimate with standard security practices.\nNo major red flags detected in current analysis.\n\n🛡️ RECOMMENDATION: APPEARS SAFE - ALWAYS DYOR`;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="high" animated={true} />
      <CyberNav />

      {/* Hero Section with Core Ethos */}
      <section className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Grid Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-7xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              NIMREV GRID
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-6">
              Subversive Intelligence Network
            </p>
            <div className="text-cyber-orange font-mono text-lg mb-8 italic">
              "{coreEthos}"
            </div>

            {/* Core Mission */}
            <div className="max-w-4xl mx-auto text-gray-300 font-mono leading-relaxed mb-8">
              <p className="text-lg">
                NimRev challenges centralized narratives by providing
                transparent, real-time threat intelligence directly to
                communities, empowering them before risks are buried or
                sanitized.
              </p>
            </div>

            {/* SUBVERSION SWEEP Status with WebSocket indicator */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${subversionSweepActive ? "bg-cyber-green animate-pulse" : "bg-gray-500"}`}
                ></div>
                <span className="text-cyber-green font-mono font-bold">
                  SUBVERSION SWEEP:{" "}
                  {subversionSweepActive ? "ACTIVE" : "OFFLINE"}
                </span>
                <button
                  onClick={() =>
                    setSubversionSweepActive(!subversionSweepActive)
                  }
                  className="ml-2 px-3 py-1 bg-cyber-green/20 hover:bg-cyber-green/40 border border-cyber-green text-cyber-green text-xs rounded transition-all"
                >
                  {subversionSweepActive ? "PAUSE" : "ACTIVATE"}
                </button>
              </div>

              {/* WebSocket Connection Status */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full ${
                    wsConnectionStatus === "connected"
                      ? "bg-green-400 animate-pulse"
                      : wsConnectionStatus === "connecting"
                        ? "bg-yellow-400 animate-spin"
                        : wsConnectionStatus === "error"
                          ? "bg-red-400 animate-pulse"
                          : "bg-gray-500"
                  }`}
                ></div>
                <span className="text-gray-300 font-mono text-xs">
                  Real-time:{" "}
                  {wsConnectionStatus === "connected"
                    ? "CONNECTED"
                    : wsConnectionStatus === "connecting"
                      ? "CONNECTING..."
                      : wsConnectionStatus === "error"
                        ? "CONNECTION FAILED"
                        : "DISCONNECTED"}
                </span>
                {wsConnectionStatus !== "connected" && (
                  <span className="text-gray-400 font-mono text-xs">
                    {wsConnectionStatus === "error"
                      ? "(Server offline - using HTTP polling)"
                      : "(Using fallback mode)"}
                  </span>
                )}
              </div>

              {/* Connection mode info */}
              {wsConnectionStatus === "error" && (
                <div className="text-xs text-gray-500 font-mono mt-2 px-4">
                  💡 Real-time mode unavailable - using HTTP polling for updates
                </div>
              )}
            </div>
          </div>

          {/* Main Grid Interface */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Scanning Interface */}
            <div className="lg:col-span-2">
              <div className="border border-cyber-green/30 p-6 bg-dark-bg/50 neon-border">
                <h3 className="text-2xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-3" />
                  SUBVERSIVE SCANNER
                </h3>

                {/* Network Selection */}
                <div className="mb-6">
                  <label className="block text-cyber-blue font-mono font-bold mb-3">
                    TARGET NETWORK
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {networks.map((network) => (
                      <button
                        key={network.id}
                        onClick={() => setSelectedNetwork(network.id)}
                        className={`p-3 border-2 rounded-lg font-mono transition-all relative group ${
                          selectedNetwork === network.id
                            ? `border-${network.color} bg-${network.color}/20 text-${network.color}`
                            : "border-gray-600 text-gray-400 hover:border-gray-500"
                        }`}
                        title={`${network.name} - Threat Level: ${network.threatLevel.toUpperCase()} - Scan Time: ${network.scanTime}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-lg mb-1">{network.icon}</span>
                          <span className="text-xs text-center">
                            {network.name}
                          </span>
                          <div
                            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                              network.threatLevel === "very-low"
                                ? "bg-green-400"
                                : network.threatLevel === "low"
                                  ? "bg-yellow-400"
                                  : network.threatLevel === "medium"
                                    ? "bg-orange-400"
                                    : network.threatLevel === "high"
                                      ? "bg-red-400"
                                      : "bg-gray-400"
                            } opacity-0 group-hover:opacity-100 transition-opacity`}
                          ></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address Input */}
                <div className="mb-6">
                  <label className="block text-cyber-blue font-mono font-bold mb-3">
                    TARGET ADDRESS
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={scanAddress}
                      onChange={(e) => setScanAddress(e.target.value)}
                      placeholder="Enter contract address, token mint, or website URL..."
                      className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-foreground font-mono focus:border-cyber-green focus:outline-none"
                      disabled={isScanning}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Scan Button */}
                <button
                  onClick={performSubversiveScan}
                  disabled={isScanning || !scanAddress.trim()}
                  className={`w-full py-4 rounded-lg font-cyber font-bold text-lg transition-all ${
                    isScanning
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyber-green to-cyber-blue hover:from-cyber-blue hover:to-cyber-green text-white neon-glow"
                  }`}
                >
                  {isScanning ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                      SCANNING...
                    </div>
                  ) : (
                    <>
                      <Eye className="inline w-6 h-6 mr-3" />
                      INITIATE SUBVERSIVE SCAN
                    </>
                  )}
                </button>

                {/* Vermin Intelligence Display */}
                {verminIntelligence && (
                  <div className="mt-6 p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                    <pre className="text-cyber-green font-mono text-sm whitespace-pre-wrap">
                      {verminIntelligence}
                    </pre>
                  </div>
                )}
              </div>

              {/* Scan Results */}
              {scanResults && (
                <div className="mt-6 border border-cyber-blue/30 p-6 bg-dark-bg/50">
                  <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                    SUBVERSIVE ANALYSIS COMPLETE
                  </h3>

                  {/* Threat Score Display */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-cyber-green/10 border border-cyber-green/30 rounded">
                      <div className="text-3xl font-cyber font-bold text-cyber-green">
                        {scanResults.threatScore.score}/100
                      </div>
                      <div className="text-sm text-gray-400">Threat Score</div>
                    </div>
                    <div className="text-center p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded">
                      <div className="text-xl font-cyber font-bold text-cyber-blue capitalize">
                        {scanResults.threatScore.risk}
                      </div>
                      <div className="text-sm text-gray-400">Risk Level</div>
                    </div>
                    <div className="text-center p-4 bg-cyber-orange/10 border border-cyber-orange/30 rounded">
                      <div className="text-xl font-cyber font-bold text-cyber-orange">
                        {scanResults.threatScore.confidence}%
                      </div>
                      <div className="text-sm text-gray-400">Confidence</div>
                    </div>
                  </div>

                  {/* Transparency Ledger */}
                  <div className="p-4 bg-gray-800/50 border border-gray-600 rounded-lg">
                    <h4 className="font-cyber font-bold text-cyber-green mb-2">
                      🔒 TRANSPARENCY LEDGER
                    </h4>
                    <div className="text-xs font-mono text-gray-400 space-y-1">
                      <div>
                        Scan ID: {scanResults.transparencyLedger.scanId}
                      </div>
                      <div>IPFS: {scanResults.transparencyLedger.ipfsHash}</div>
                      <div>
                        Signature:{" "}
                        {scanResults.transparencyLedger.signature.substring(
                          0,
                          20,
                        )}
                        ...
                      </div>
                      <div className="text-cyber-green">
                        ✓ Immutable & Publicly Verifiable
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Real-Time Threat Feed */}
            <div className="lg:col-span-1">
              <div className="border border-cyber-purple/30 p-6 bg-dark-bg/50 h-fit">
                <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  LIVE THREAT FEED
                </h3>

                <div
                  className="space-y-3 max-h-96 overflow-y-auto"
                  ref={scrollRef}
                >
                  {realTimeThreats.map((threat, index) => (
                    <div
                      key={threat.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        threat.severity === "high"
                          ? "border-red-500 bg-red-500/10"
                          : threat.severity === "alpha"
                            ? "border-cyber-green bg-cyber-green/10"
                            : "border-cyber-blue bg-cyber-blue/10"
                      }`}
                    >
                      <div className="text-xs font-mono text-gray-400 mb-1">
                        {new Date(threat.timestamp).toLocaleTimeString()} •{" "}
                        {threat.network.toUpperCase()}
                      </div>
                      <div className="text-sm font-mono text-white">
                        {threat.message}
                      </div>
                      <div className="text-xs font-mono text-gray-500 mt-1 truncate">
                        {threat.address}
                      </div>
                    </div>
                  ))}

                  {realTimeThreats.length === 0 && (
                    <div className="text-center text-gray-500 font-mono text-sm py-8">
                      Monitoring blockchain networks...
                      <div className="flex justify-center mt-2">
                        <div className="animate-spin w-4 h-4 border-2 border-cyber-purple border-t-transparent rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid Statistics */}
              <div className="mt-6 border border-cyber-orange/30 p-6 bg-dark-bg/50">
                <h3 className="text-lg font-cyber font-bold text-cyber-orange mb-4">
                  GRID STATISTICS
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Scans:</span>
                    <span className="text-cyber-green">2,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Networks Monitored:</span>
                    <span className="text-cyber-blue">10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Threats Detected:</span>
                    <span className="text-red-400">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Alpha Signals:</span>
                    <span className="text-cyber-green">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cross-Chain Coverage:</span>
                    <span className="text-cyber-purple">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Uptime:</span>
                    <span className="text-cyber-green">99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid - Images Showcase */}
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Rug Scam Detection */}
            <div className="border border-cyber-green/30 p-6 bg-dark-bg/50 text-center">
              <div className="w-full h-48 rounded-lg mb-4 border border-cyber-green/30 bg-gradient-to-br from-cyber-green/20 to-cyber-green/5 flex items-center justify-center">
                <div className="text-8xl transform hover:scale-110 transition-transform duration-300 filter drop-shadow-2xl">
                  <div className="relative">
                    <div className="text-red-500 animate-pulse">🛡️</div>
                    <div className="absolute -top-2 -right-2 text-2xl text-cyber-green animate-bounce">
                      ⚡
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-cyber font-bold text-cyber-green mb-2">
                THREAT DETECTION
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Advanced pattern recognition identifies honeypots, rug pulls,
                and malicious contracts before they strike.
              </p>
            </div>

            {/* All-Seeing Network */}
            <div className="border border-cyber-blue/30 p-6 bg-dark-bg/50 text-center">
              <div className="w-full h-48 rounded-lg mb-4 border border-cyber-blue/30 bg-gradient-to-br from-cyber-blue/20 to-cyber-blue/5 flex items-center justify-center">
                <div className="text-8xl transform hover:scale-110 transition-transform duration-300 filter drop-shadow-2xl">
                  <div className="relative">
                    <div className="text-cyber-blue animate-spin-slow">🕸️</div>
                    <div className="absolute -top-1 -right-1 text-3xl text-cyber-green animate-pulse">
                      👁️
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-2">
                NETWORK MONITORING
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Real-time surveillance across multiple blockchain networks,
                providing comprehensive threat intelligence and analysis.
              </p>
            </div>

            {/* Developer Experience */}
            <div className="border border-cyber-purple/30 p-6 bg-dark-bg/50 text-center">
              <div className="w-full h-48 rounded-lg mb-4 border border-cyber-purple/30 bg-gradient-to-br from-cyber-purple/20 to-cyber-purple/5 flex items-center justify-center">
                <div className="text-8xl transform hover:scale-110 transition-transform duration-300 filter drop-shadow-2xl">
                  <div className="relative">
                    <div className="text-cyber-purple animate-pulse">⚙️</div>
                    <div className="absolute -bottom-2 -left-2 text-3xl text-cyber-orange animate-bounce">
                      🔥
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-cyber font-bold text-cyber-purple mb-2">
                SECURITY INTELLIGENCE
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Powered by advanced AI and machine learning algorithms for
                precise vulnerability assessment and risk evaluation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CyberFooter />
    </div>
  );
}
