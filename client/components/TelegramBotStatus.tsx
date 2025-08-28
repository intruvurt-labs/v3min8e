import { useEffect, useState } from "react";
import { Bot, Zap, MessageCircle, Shield, Activity } from "lucide-react";
import { fetchWithFallback, fallbackData } from "../utils/fetchWithFallback";

interface TelegramBotStatusProps {
  className?: string;
}

interface BotMetrics {
  isOnline: boolean;
  responseTime: string;
  activeUsers: number;
  messagesProcessed: number;
  uptime: string;
  lastUpdate: Date;
  isReal?: boolean;
  dataSource?: string;
}

export default function TelegramBotStatus({
  className = "",
}: TelegramBotStatusProps) {
  const [metrics, setMetrics] = useState<BotMetrics>({
    isOnline: false,
    responseTime: "checking...",
    activeUsers: 0,
    messagesProcessed: 0,
    uptime: "Starting...",
    lastUpdate: new Date(),
    isReal: false,
    dataSource: "Initializing...",
  });

  useEffect(() => {
    // Check real bot status from API with improved error handling
    const checkBotStatus = async () => {
      try {
        // Try both bot status endpoints with fallback
        const [botResult, nimrevResult] = await Promise.allSettled([
          fetchWithFallback(
            "/api/bot/status",
            { timeout: 5000 },
            fallbackData.botStatus,
          ),
          fetchWithFallback(
            "/api/nimrev/status",
            { timeout: 5000 },
            fallbackData.nimrevStatus,
          ),
        ]);

        let botRunning = false;
        let responseTime = "checking...";
        let realActiveUsers = 0;
        let realMessagesProcessed = 0;
        let realUptime = "Offline";
        let dataSource = "No Connection";
        let isReal = false;

        // Process bot API response
        if (botResult.status === "fulfilled" && botResult.value.success) {
          const botData = botResult.value.data;
          if (
            botData &&
            (botData.status === "ONLINE" || botData.status === "DEMO")
          ) {
            botRunning = true;
            responseTime = botData.status === "ONLINE" ? "< 1s" : "demo";
            realActiveUsers = botData.activeUsers || 0;
            realMessagesProcessed = botData.messagesProcessed || 0;
            realUptime = botData.uptime || "95%";
            dataSource = botResult.value.isFallback
              ? "Fallback Data"
              : "Bot API";
            isReal = !botResult.value.isFallback && botData.isReal;
          }
        }

        // Process NimRev API response
        if (nimrevResult.status === "fulfilled" && nimrevResult.value.success) {
          const nimrevData = nimrevResult.value.data;
          if (nimrevData?.isRunning) {
            botRunning = true;
            responseTime = "< 1s";
            realActiveUsers = nimrevData.stats?.activeUsers || realActiveUsers;
            realMessagesProcessed =
              nimrevData.stats?.messagesProcessed || realMessagesProcessed;
            realUptime = nimrevData.stats?.uptime || realUptime;
            if (!isReal) {
              dataSource = nimrevResult.value.isFallback
                ? "Fallback Data"
                : "NimRev API";
              isReal = !nimrevResult.value.isFallback;
            }
          }
        }

        // Update metrics with parsed data
        setMetrics((prev) => ({
          ...prev,
          isOnline: botRunning,
          responseTime,
          activeUsers: realActiveUsers,
          messagesProcessed:
            realMessagesProcessed || prev?.messagesProcessed || 0,
          lastUpdate: new Date(),
          uptime: realUptime,
          isReal,
          dataSource,
        }));
      } catch (error) {
        console.warn("Bot status check failed:", error);
        // Use fallback data
        setMetrics((prev) => ({
          ...prev,
          isOnline: false,
          responseTime: "error",
          activeUsers: 0,
          messagesProcessed: 0,
          uptime: "Connection Failed",
          lastUpdate: new Date(),
          isReal: false,
          dataSource: "Error",
        }));
      }
    };

    // Initial check
    checkBotStatus();

    // Check every 15 seconds for more responsive updates
    const interval = setInterval(checkBotStatus, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Modern Bot Status Panel */}
      <div className="relative w-80 bg-gradient-to-br from-dark-bg/90 to-darker-bg/90 border border-cyber-green/30 rounded-lg backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-green/20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="w-6 h-6 text-cyber-green" />
              <div
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${metrics.isOnline ? "bg-cyber-green animate-pulse" : "bg-red-500"}`}
              ></div>
            </div>
            <div>
              <h3 className="text-cyber-green font-mono font-bold text-sm">
                NIMREV BOT
              </h3>
              <p className="text-cyber-blue text-xs font-mono opacity-80">
                {metrics.isReal ? "Live Data" : "No Data"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end mb-1">
              <div
                className={`w-2 h-2 rounded-full ${metrics.isReal ? "bg-cyber-green animate-pulse" : "bg-gray-500"}`}
              ></div>
              <div
                className={`text-xs font-mono font-bold ${metrics.isOnline ? "text-cyber-green" : "text-red-400"}`}
              >
                {metrics.isOnline ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
            <div
              className={`text-xs font-mono ${metrics.isReal ? "text-cyber-blue" : "text-gray-400"}`}
            >
              {metrics.isReal ? "REAL DATA" : "NO DATA"}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {metrics.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {/* Response Time */}
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyber-orange" />
              <div>
                <div className="text-cyber-orange font-mono font-bold text-sm">
                  {metrics.responseTime}
                </div>
                <div className="text-gray-400 text-xs">Response</div>
              </div>
            </div>

            {/* Active Users */}
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyber-blue" />
              <div>
                <div className="text-cyber-blue font-mono font-bold text-sm">
                  {metrics.activeUsers}
                </div>
                <div className="text-gray-400 text-xs">Active Users</div>
              </div>
            </div>

            {/* Messages Processed */}
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-cyber-purple" />
              <div>
                <div className="text-cyber-purple font-mono font-bold text-sm">
                  {metrics.messagesProcessed.toLocaleString()}
                </div>
                <div className="text-gray-400 text-xs">Messages</div>
              </div>
            </div>

            {/* Uptime */}
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyber-green" />
              <div>
                <div className="text-cyber-green font-mono font-bold text-sm">
                  {metrics.uptime}
                </div>
                <div className="text-gray-400 text-xs">Uptime</div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <a
            href="https://t.me/nimrev_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-4 px-4 py-3 bg-gradient-to-r from-cyber-green/20 to-cyber-blue/20 border border-cyber-green/50 text-cyber-green font-mono font-bold text-center text-sm hover:from-cyber-green/30 hover:to-cyber-blue/30 transition-all duration-300 rounded neon-border group"
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>ACCESS BOT</span>
              <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
            </div>
          </a>
        </div>

        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-lg border border-cyber-green/20 pointer-events-none">
          <div className="absolute inset-0 rounded-lg border border-cyber-green/40 animate-pulse"></div>
        </div>

        {/* Data flow particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div
            className="absolute top-8 left-4 w-1 h-1 bg-cyber-green rounded-full animate-ping"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="absolute top-16 right-8 w-1 h-1 bg-cyber-blue rounded-full animate-ping"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-12 left-8 w-1 h-1 bg-cyber-orange rounded-full animate-ping"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
