import { EventEmitter } from "events";
import { WebSocketServer, WebSocket } from "ws";
import { NimRevOrchestrator } from "./NimRevOrchestrator";
import { supabase } from "../utils/supabase";
import { getEnv } from "../utils/env";

export interface GlobalThreatEvent {
  id: string;
  type:
    | "scan_completed"
    | "high_risk_detected"
    | "address_activity"
    | "system_alert"
    | "bot_activity";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  data: {
    address?: string;
    blockchain?: string;
    riskScore?: number;
    threatCategories?: string[];
    scanId?: string;
    alertMessage?: string;
    botAction?: string;
    projectId?: string;
    source: "scanner" | "bot" | "monitor" | "system";
    metadata?: Record<string, any>;
  };
}

export interface RealtimeStats {
  activeScans: number;
  threatsDetected24h: number;
  addressesMonitored: number;
  botsOnline: number;
  avgRiskScore: number;
  lastThreatTime: Date | null;
  systemHealth: "healthy" | "degraded" | "critical";
  connectedClients: number;
}

export class UnifiedThreatMonitor extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private orchestrator: NimRevOrchestrator | null = null;
  private isRunning = false;
  private realtimeStats: RealtimeStats;
  private eventHistory: GlobalThreatEvent[] = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.realtimeStats = {
      activeScans: 0,
      threatsDetected24h: 0,
      addressesMonitored: 0,
      botsOnline: 0,
      avgRiskScore: 0,
      lastThreatTime: null,
      systemHealth: "healthy",
      connectedClients: 0,
    };
  }

  public async start(server?: any) {
    if (this.isRunning) return;

    try {
      console.log("🚀 Starting Unified Threat Monitor...");

      // Start WebSocket server on a different port to avoid conflicts
      this.wss = new WebSocketServer({
        port: 8082, // Changed from 8081 to 8082 to avoid port conflict
        perMessageDeflate: false,
      });

      // Add error handling for the WebSocket server
      this.wss.on("error", (error) => {
        console.error("❌ WebSocket server error:", error);
        if (error.code === "EADDRINUSE") {
          console.error(
            "🚨 Port 8082 is already in use. Please check for running services.",
          );
          this.isRunning = false;
          return;
        }
      });

      this.setupWebSocketHandlers();
      this.setupStatsUpdates();
      this.loadInitialStats();

      this.isRunning = true;
      console.log("✅ Unified Threat Monitor started on ws://localhost:8082");

      // Emit startup event
      this.broadcastEvent({
        id: this.generateEventId(),
        type: "system_alert",
        severity: "low",
        timestamp: new Date(),
        data: {
          alertMessage: "Unified Threat Monitor online",
          source: "system",
          metadata: { status: "startup", version: "1.0.0" },
        },
      });
    } catch (error) {
      console.error("Failed to start Unified Threat Monitor:", error);
      throw error;
    }
  }

  public setOrchestrator(orchestrator: NimRevOrchestrator) {
    this.orchestrator = orchestrator;
    this.setupOrchestratorListeners();
  }

  private setupWebSocketHandlers() {
    if (!this.wss) return;

    this.wss.on("connection", (ws) => {
      console.log("🔗 New real-time client connected");
      this.clients.add(ws);
      this.updateConnectedClients();

      // Send current stats and recent events
      ws.send(
        JSON.stringify({
          type: "init",
          stats: this.realtimeStats,
          recentEvents: this.eventHistory.slice(-10),
        }),
      );

      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on("close", () => {
        console.log("🔌 Real-time client disconnected");
        this.clients.delete(ws);
        this.updateConnectedClients();
        clearInterval(heartbeat);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
        this.updateConnectedClients();
        clearInterval(heartbeat);
      });

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error("Failed to parse client message:", error);
        }
      });
    });
  }

  private setupOrchestratorListeners() {
    if (!this.orchestrator) return;

    console.log("🔗 Connecting to NimRev Orchestrator events...");

    // Listen for scan completions
    this.orchestrator.on("scanCompleted", ({ scanId, result }) => {
      this.broadcastEvent({
        id: this.generateEventId(),
        type: "scan_completed",
        severity:
          result.risk_score <= 30
            ? "high"
            : result.risk_score <= 60
              ? "medium"
              : "low",
        timestamp: new Date(),
        data: {
          address: result.token_address,
          blockchain: result.blockchain,
          riskScore: result.risk_score,
          threatCategories: result.threat_categories,
          scanId: result.id,
          source: "scanner",
          metadata: {
            tokenSymbol: result.token_symbol,
            scanDuration: result.scan_duration_ms,
          },
        },
      });

      // Update stats
      this.realtimeStats.threatsDetected24h++;
      if (result.risk_score <= 30) {
        this.realtimeStats.lastThreatTime = new Date();
      }
    });

    // Listen for high risk detections
    this.orchestrator.on("highRiskDetected", ({ scanId, result }) => {
      this.broadcastEvent({
        id: this.generateEventId(),
        type: "high_risk_detected",
        severity: "critical",
        timestamp: new Date(),
        data: {
          address: result.token_address,
          blockchain: result.blockchain,
          riskScore: result.risk_score,
          threatCategories: result.threat_categories,
          scanId: result.id,
          alertMessage: `CRITICAL THREAT: ${result.token_symbol || "Unknown"} - Risk Score: ${result.risk_score}/100`,
          source: "scanner",
          metadata: {
            tokenSymbol: result.token_symbol,
            urgency: "immediate",
          },
        },
      });
    });

    // Listen for address activity
    this.orchestrator.on("addressActivity", (activity) => {
      this.broadcastEvent({
        id: this.generateEventId(),
        type: "address_activity",
        severity: activity.suspicious ? "medium" : "low",
        timestamp: new Date(),
        data: {
          address: activity.address,
          blockchain: activity.blockchain,
          alertMessage: `Address activity detected: ${activity.type}`,
          source: "monitor",
          metadata: activity,
        },
      });
    });

    // Listen for bot activities
    this.orchestrator.on("botActivity", (activity) => {
      this.broadcastEvent({
        id: this.generateEventId(),
        type: "bot_activity",
        severity: "low",
        timestamp: new Date(),
        data: {
          botAction: activity.action,
          alertMessage: activity.message,
          source: "bot",
          metadata: activity,
        },
      });
    });
  }

  private setupStatsUpdates() {
    // Update stats every 10 seconds
    setInterval(async () => {
      await this.updateRealtimeStats();
      this.broadcastStats();
    }, 10000);

    // Health check every 30 seconds
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);
  }

  private async loadInitialStats() {
    try {
      // Get 24h threat count
      const { count: threatCount } = await supabase
        .from("scan_results")
        .select("*", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .lte("risk_score", 30);

      // Get active addresses count
      const { count: addressCount } = await supabase
        .from("watched_addresses")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get average risk score
      const { data: avgData } = await supabase
        .from("scan_results")
        .select("risk_score")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .eq("scan_status", "completed");

      const avgRiskScore =
        avgData?.reduce((sum, item) => sum + item.risk_score, 0) /
          (avgData?.length || 1) || 0;

      this.realtimeStats = {
        ...this.realtimeStats,
        threatsDetected24h: threatCount || 0,
        addressesMonitored: addressCount || 0,
        avgRiskScore: Math.round(avgRiskScore),
        botsOnline: getEnv("TELEGRAM_BOT_TOKEN") ? 1 : 0,
      };
    } catch (error) {
      console.error("Failed to load initial stats:", error);
    }
  }

  private async updateRealtimeStats() {
    try {
      // Get active scans from orchestrator
      if (this.orchestrator) {
        const status = await this.orchestrator.getSystemStatus();
        this.realtimeStats.activeScans =
          status.services?.scanQueue?.processing || 0;
        this.realtimeStats.systemHealth = status.isRunning
          ? "healthy"
          : "degraded";
      }

      // Update other stats periodically
      const now = Date.now();
      if (now % 60000 < 10000) {
        // Every minute
        await this.loadInitialStats();
      }
    } catch (error) {
      console.error("Failed to update stats:", error);
      this.realtimeStats.systemHealth = "critical";
    }
  }

  private async performHealthCheck() {
    const healthChecks = {
      database: false,
      orchestrator: false,
      webSocket: false,
    };

    try {
      // Check database connection
      const { error } = await supabase
        .from("scan_results")
        .select("id")
        .limit(1);
      healthChecks.database = !error;

      // Check orchestrator
      healthChecks.orchestrator = this.orchestrator !== null;

      // Check WebSocket server
      healthChecks.webSocket =
        this.wss !== null && this.wss.readyState === this.wss.OPEN;

      const healthyChecks = Object.values(healthChecks).filter(Boolean).length;
      const totalChecks = Object.keys(healthChecks).length;

      if (healthyChecks === totalChecks) {
        this.realtimeStats.systemHealth = "healthy";
      } else if (healthyChecks >= totalChecks / 2) {
        this.realtimeStats.systemHealth = "degraded";
      } else {
        this.realtimeStats.systemHealth = "critical";
      }
    } catch (error) {
      console.error("Health check failed:", error);
      this.realtimeStats.systemHealth = "critical";
    }
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case "subscribe":
        // Handle subscription to specific threat types
        console.log("Client subscribed to:", data.filters);
        break;
      case "unsubscribe":
        console.log("Client unsubscribed from:", data.filters);
        break;
      case "request_stats":
        ws.send(
          JSON.stringify({
            type: "stats",
            data: this.realtimeStats,
          }),
        );
        break;
      case "request_history":
        ws.send(
          JSON.stringify({
            type: "history",
            data: this.eventHistory.slice(-50),
          }),
        );
        break;
    }
  }

  public broadcastEvent(event: GlobalThreatEvent) {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Log important events
    if (event.severity === "critical" || event.severity === "high") {
      console.log(
        `🚨 ${event.severity.toUpperCase()} THREAT:`,
        event.data.alertMessage || event.type,
      );
    }

    // Broadcast to all connected clients
    const message = JSON.stringify({
      type: "threat_event",
      data: event,
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    // Emit for other internal listeners
    this.emit("globalThreatEvent", event);
  }

  public broadcastStats() {
    const message = JSON.stringify({
      type: "stats_update",
      data: this.realtimeStats,
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private updateConnectedClients() {
    this.realtimeStats.connectedClients = this.clients.size;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getStats(): RealtimeStats {
    return { ...this.realtimeStats };
  }

  public getRecentEvents(limit: number = 50): GlobalThreatEvent[] {
    return this.eventHistory.slice(-limit);
  }

  public async stop() {
    if (!this.isRunning) return;

    console.log("🛑 Stopping Unified Threat Monitor...");

    // Close all client connections
    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.isRunning = false;
    console.log("✅ Unified Threat Monitor stopped");
  }
}

// Singleton instance
export const unifiedThreatMonitor = new UnifiedThreatMonitor();
