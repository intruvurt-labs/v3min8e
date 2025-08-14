import React, { useEffect, useState } from "react";
import { X, AlertTriangle, Shield, Activity, Bot, Target } from "lucide-react";
import {
  useRealTimeNotifications,
  useUnifiedThreatMonitor,
  GlobalThreatEvent,
} from "../hooks/useUnifiedThreatMonitor";

interface NotificationItemProps {
  event: GlobalThreatEvent;
  onDismiss: (id: string) => void;
}

function NotificationItem({ event, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getSeverityColors = () => {
    switch (event.severity) {
      case "critical":
        return "bg-red-900/90 border-red-500 text-red-100";
      case "high":
        return "bg-orange-900/90 border-orange-500 text-orange-100";
      case "medium":
        return "bg-yellow-900/90 border-yellow-500 text-yellow-100";
      default:
        return "bg-blue-900/90 border-blue-500 text-blue-100";
    }
  };

  const getIcon = () => {
    switch (event.type) {
      case "high_risk_detected":
        return <AlertTriangle className="w-5 h-5" />;
      case "scan_completed":
        return <Shield className="w-5 h-5" />;
      case "address_activity":
        return <Target className="w-5 h-5" />;
      case "bot_activity":
        return <Bot className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const formatMessage = () => {
    if (event.data.alertMessage) {
      return event.data.alertMessage;
    }

    switch (event.type) {
      case "high_risk_detected":
        return `High-risk token detected: ${event.data.address?.slice(0, 8)}... (Risk: ${event.data.riskScore}/100)`;
      case "scan_completed":
        return `Scan completed for ${event.data.blockchain}: ${event.data.address?.slice(0, 8)}...`;
      case "address_activity":
        return `Suspicious activity on ${event.data.blockchain}: ${event.data.address?.slice(0, 8)}...`;
      case "bot_activity":
        return event.data.botAction || "Bot activity detected";
      default:
        return "System event detected";
    }
  };

  const formatTime = () => {
    const now = new Date();
    const eventTime = new Date(event.timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return eventTime.toLocaleTimeString();
    }
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 
        ${getSeverityColors()}
        ${isVisible ? "transform translate-x-0 opacity-100" : "transform translate-x-full opacity-0"}
      `}
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg border border-current opacity-20 animate-pulse pointer-events-none" />

      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase font-bold tracking-wider">
                {event.severity} threat
              </span>
              <span className="text-xs opacity-75">{formatTime()}</span>
            </div>

            <button
              onClick={() => onDismiss(event.id)}
              className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-1 text-sm font-medium">{formatMessage()}</p>

          {/* Additional details */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {event.data.blockchain && (
              <span className="px-2 py-1 rounded bg-current bg-opacity-20 font-mono">
                {event.data.blockchain.toUpperCase()}
              </span>
            )}
            {event.data.riskScore !== undefined && (
              <span className="px-2 py-1 rounded bg-current bg-opacity-20 font-mono">
                Risk: {event.data.riskScore}/100
              </span>
            )}
            {event.data.source && (
              <span className="px-2 py-1 rounded bg-current bg-opacity-20 font-mono">
                {event.data.source}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Severity indicator bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-current rounded-l-lg opacity-80" />
    </div>
  );
}

export default function GlobalThreatNotifications() {
  const { notifications, dismissNotification, clearAllNotifications } =
    useRealTimeNotifications();
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-expand when new critical notifications arrive
  useEffect(() => {
    const hasCritical = notifications.some((n) => n.severity === "critical");
    if (hasCritical && isMinimized) {
      setIsMinimized(false);
    }
  }, [notifications, isMinimized]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyber-green" />
          <span className="text-cyber-green font-mono text-sm font-bold">
            LIVE THREATS ({notifications.length})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-cyber-green hover:text-cyber-blue transition-colors text-xs font-mono"
          >
            {isMinimized ? "EXPAND" : "MINIMIZE"}
          </button>

          {notifications.length > 1 && (
            <button
              onClick={clearAllNotifications}
              className="text-cyber-orange hover:text-red-400 transition-colors text-xs font-mono"
            >
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {!isMinimized && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((event) => (
            <NotificationItem
              key={event.id}
              event={event}
              onDismiss={dismissNotification}
            />
          ))}
        </div>
      )}

      {/* Minimized indicator */}
      {isMinimized && (
        <div className="p-3 bg-dark-bg/90 border border-cyber-green/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-cyber-green font-mono text-xs">
              {notifications.filter((n) => n.severity === "critical").length}{" "}
              critical threats
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Global stats indicator component
export function GlobalStatsIndicator() {
  const { stats, isConnected } = useUnifiedThreatMonitor();

  if (!isConnected || !stats) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex items-center space-x-4 px-4 py-2 bg-dark-bg/90 border border-cyber-green/30 rounded-lg backdrop-blur-sm">
        {/* Connection status */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyber-green animate-pulse" : "bg-red-500"}`}
          />
          <span className="text-xs font-mono text-cyber-green">
            {isConnected ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        {/* Active scans */}
        <div className="flex items-center space-x-2">
          <Activity className="w-3 h-3 text-cyber-blue" />
          <span className="text-xs font-mono text-cyber-blue">
            {stats.activeScans} scans
          </span>
        </div>

        {/* Threats detected */}
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-3 h-3 text-cyber-orange" />
          <span className="text-xs font-mono text-cyber-orange">
            {stats.threatsDetected24h} threats
          </span>
        </div>

        {/* System health */}
        <div className="flex items-center space-x-2">
          <Shield
            className={`w-3 h-3 ${
              stats.systemHealth === "healthy"
                ? "text-cyber-green"
                : stats.systemHealth === "degraded"
                  ? "text-cyber-orange"
                  : "text-red-500"
            }`}
          />
          <span
            className={`text-xs font-mono ${
              stats.systemHealth === "healthy"
                ? "text-cyber-green"
                : stats.systemHealth === "degraded"
                  ? "text-cyber-orange"
                  : "text-red-500"
            }`}
          >
            {stats.systemHealth.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
