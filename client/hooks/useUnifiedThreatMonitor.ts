import { useState, useEffect, useCallback, useRef } from "react";

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

interface UseUnifiedThreatMonitorOptions {
  enableReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  eventFilters?: {
    types?: string[];
    severities?: string[];
    sources?: string[];
  };
}

interface UseUnifiedThreatMonitorReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Real-time data
  stats: RealtimeStats | null;
  recentEvents: GlobalThreatEvent[];

  // Event handlers
  onThreatEvent: (callback: (event: GlobalThreatEvent) => void) => void;
  offThreatEvent: (callback: (event: GlobalThreatEvent) => void) => void;

  // Control methods
  connect: () => void;
  disconnect: () => void;
  requestStats: () => void;
  requestHistory: () => void;

  // Utility methods
  getEventsByType: (type: string) => GlobalThreatEvent[];
  getEventsBySeverity: (severity: string) => GlobalThreatEvent[];
  getCriticalEvents: () => GlobalThreatEvent[];
  getLatestThreat: () => GlobalThreatEvent | null;
}

export function useUnifiedThreatMonitor(
  options: UseUnifiedThreatMonitorOptions = {},
): UseUnifiedThreatMonitorReturn {
  const {
    enableReconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    eventFilters = {},
  } = options;

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Data state
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<GlobalThreatEvent[]>([]);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const threatEventCallbacksRef = useRef<
    Set<(event: GlobalThreatEvent) => void>
  >(new Set());

  // Event handlers
  const onThreatEvent = useCallback(
    (callback: (event: GlobalThreatEvent) => void) => {
      threatEventCallbacksRef.current.add(callback);
    },
    [],
  );

  const offThreatEvent = useCallback(
    (callback: (event: GlobalThreatEvent) => void) => {
      threatEventCallbacksRef.current.delete(callback);
    },
    [],
  );

  // WebSocket message handler
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "init":
            setStats(message.stats);
            setRecentEvents(message.recentEvents || []);
            break;

          case "threat_event":
            const threatEvent = message.data as GlobalThreatEvent;

            // Apply filters
            if (
              eventFilters.types &&
              !eventFilters.types.includes(threatEvent.type)
            ) {
              return;
            }
            if (
              eventFilters.severities &&
              !eventFilters.severities.includes(threatEvent.severity)
            ) {
              return;
            }
            if (
              eventFilters.sources &&
              !eventFilters.sources.includes(threatEvent.data.source)
            ) {
              return;
            }

            // Add to recent events
            setRecentEvents((prev) => {
              const updated = [...prev, threatEvent];
              return updated.slice(-100); // Keep last 100 events
            });

            // Notify callbacks
            threatEventCallbacksRef.current.forEach((callback) => {
              callback(threatEvent);
            });
            break;

          case "stats_update":
            setStats(message.data);
            break;

          case "history":
            setRecentEvents(message.data || []);
            break;

          case "pong":
            // Heartbeat response
            break;

          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    },
    [eventFilters],
  );

  // WebSocket connection
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const ws = new WebSocket("ws://localhost:8082");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🔗 Connected to Unified Threat Monitor");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = () => {
        console.log("🔌 Disconnected from Unified Threat Monitor");
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Auto-reconnect if enabled
        if (
          enableReconnect &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `🔄 Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionError("Connection failed");
        setIsConnecting(false);
      };

      ws.onmessage = handleMessage;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionError("Failed to connect");
      setIsConnecting(false);
    }
  }, [enableReconnect, maxReconnectAttempts, reconnectInterval, handleMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Send message helpers
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const requestStats = useCallback(() => {
    sendMessage({ type: "request_stats" });
  }, [sendMessage]);

  const requestHistory = useCallback(() => {
    sendMessage({ type: "request_history" });
  }, [sendMessage]);

  // Utility methods
  const getEventsByType = useCallback(
    (type: string) => {
      return recentEvents.filter((event) => event.type === type);
    },
    [recentEvents],
  );

  const getEventsBySeverity = useCallback(
    (severity: string) => {
      return recentEvents.filter((event) => event.severity === severity);
    },
    [recentEvents],
  );

  const getCriticalEvents = useCallback(() => {
    return recentEvents.filter((event) => event.severity === "critical");
  }, [recentEvents]);

  const getLatestThreat = useCallback(() => {
    const threats = recentEvents.filter(
      (event) =>
        event.type === "high_risk_detected" || event.severity === "critical",
    );
    return threats.length > 0 ? threats[threats.length - 1] : null;
  }, [recentEvents]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      threatEventCallbacksRef.current.clear();
    };
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,

    // Data
    stats,
    recentEvents,

    // Event handlers
    onThreatEvent,
    offThreatEvent,

    // Control methods
    connect,
    disconnect,
    requestStats,
    requestHistory,

    // Utility methods
    getEventsByType,
    getEventsBySeverity,
    getCriticalEvents,
    getLatestThreat,
  };
}

// Additional hook for notifications
export function useRealTimeNotifications() {
  const { onThreatEvent, offThreatEvent, getCriticalEvents } =
    useUnifiedThreatMonitor();
  const [notifications, setNotifications] = useState<GlobalThreatEvent[]>([]);

  useEffect(() => {
    const handleThreatEvent = (event: GlobalThreatEvent) => {
      // Only show critical and high severity events as notifications
      if (event.severity === "critical" || event.severity === "high") {
        setNotifications((prev) => {
          const updated = [...prev, event];
          return updated.slice(-5); // Keep last 5 notifications
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== event.id));
        }, 10000);
      }
    };

    onThreatEvent(handleThreatEvent);

    return () => {
      offThreatEvent(handleThreatEvent);
    };
  }, [onThreatEvent, offThreatEvent]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    dismissNotification,
    clearAllNotifications,
    criticalCount: getCriticalEvents().length,
  };
}
