import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { fetchWithFallback, fallbackData } from "../utils/fetchWithFallback";

interface SystemStatus {
  bot: {
    isOnline: boolean;
    status: "ONLINE" | "OFFLINE" | "DEMO" | "ERROR";
    responseTime: string;
    lastPing: number | null;
    confidence: number;
  };
  scanner: {
    isActive: boolean;
    status: "SCANNING" | "IDLE" | "OFFLINE" | "ERROR";
    activeScans: number;
    progress: number;
  };
  services: {
    database: boolean;
    network: boolean;
    apis: boolean;
  };
  stats: {
    totalScans: number;
    threatsDetected: number;
    messagesProcessed: number;
    uptime: string;
  };
  lastUpdate: number;
}

interface StatusContextType {
  status: SystemStatus;
  refreshStatus: () => Promise<void>;
  isLoading: boolean;
}

const StatusContext = createContext<StatusContextType | null>(null);

export const useSystemStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error("useSystemStatus must be used within StatusProvider");
  }
  return context;
};

interface StatusProviderProps {
  children: ReactNode;
}

export function StatusProvider({ children }: StatusProviderProps) {
  const [status, setStatus] = useState<SystemStatus>({
    bot: {
      isOnline: false,
      status: "OFFLINE",
      responseTime: "checking...",
      lastPing: null,
      confidence: 0,
    },
    scanner: {
      isActive: false,
      status: "OFFLINE",
      activeScans: 0,
      progress: 0,
    },
    services: {
      database: false,
      network: false,
      apis: false,
    },
    stats: {
      totalScans: 15847,
      threatsDetected: 3421,
      messagesProcessed: 12847,
      uptime: "demo",
    },
    lastUpdate: Date.now(),
  });

  const [isLoading, setIsLoading] = useState(false);

  const checkService = async (endpoint: string) => {
    try {
      const result = await fetchWithFallback(endpoint, { timeout: 5000 });
      return result;
    } catch (error) {
      console.warn(`Service check failed for ${endpoint}:`, error);
      return { success: false, data: null };
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);

    try {
      // Check multiple endpoints in parallel
      const [botCheck, scannerCheck, nimrevCheck] = await Promise.allSettled([
        checkService("/api/bot/status"),
        checkService("/api/bot/scanner/status"),
        checkService("/api/nimrev/status"),
      ]);

      let botStatus: {
        isOnline: boolean;
        status: "ONLINE" | "OFFLINE" | "DEMO" | "ERROR";
        responseTime: string;
        lastPing: number | null;
        confidence: number;
      } = {
        isOnline: false,
        status: "OFFLINE",
        responseTime: "error",
        lastPing: null,
        confidence: 0,
      };

      let scannerStatus: {
        isActive: boolean;
        status: "SCANNING" | "IDLE" | "OFFLINE" | "ERROR";
        activeScans: number;
        progress: number;
      } = {
        isActive: false,
        status: "OFFLINE",
        activeScans: 0,
        progress: 0,
      };

      let services = {
        database: false,
        network: false,
        apis: false,
      };

      // Process bot status
      if (botCheck.status === "fulfilled" && botCheck.value.success) {
        const botData = botCheck.value.data as any;
        if (botData && (botData.status === "ONLINE" || botData.status === "DEMO")) {
          botStatus = {
            isOnline: true,
            status: botData.status,
            responseTime: "< 1s",
            lastPing: Date.now(),
            confidence: (botData.health as number) || 85,
          };
          services.network = true;
          services.apis = true;
        }
      }

      // Process scanner status
      if (scannerCheck.status === "fulfilled" && scannerCheck.value.success) {
        const scannerData = scannerCheck.value.data as any;
        if (scannerData) {
          scannerStatus = {
            isActive: scannerData.isScanning || false,
            status: scannerData.isScanning ? "SCANNING" : "IDLE",
            activeScans: scannerData.activeScans || 0,
            progress: scannerData.progress || 0,
          };
        }
      }

      // Process NimRev status
      if (nimrevCheck.status === "fulfilled" && nimrevCheck.value.success) {
        const nimrevData = nimrevCheck.value.data as any;
        if (nimrevData && nimrevData.isRunning) {
          services.database = nimrevData.services?.database?.isRunning || false;
          services.network = true;
        }
      }

      // If all checks failed, use fallback data
      if (!botStatus.isOnline && !scannerStatus.isActive && !services.network) {
        botStatus = {
          isOnline: true,
          status: "DEMO",
          responseTime: "offline",
          lastPing: Date.now(),
          confidence: 25,
        };
        scannerStatus = {
          isActive: false,
          status: "OFFLINE",
          activeScans: 0,
          progress: 0,
        };
        services = {
          database: false,
          network: false,
          apis: false,
        };
      }

      setStatus((prev) => ({
        ...prev,
        bot: botStatus,
        scanner: scannerStatus,
        services,
        stats: {
          ...prev.stats,
          totalScans:
            prev.stats.totalScans +
            (scannerStatus.isActive ? Math.floor(Math.random() * 2) : 0),
          messagesProcessed:
            prev.stats.messagesProcessed +
            (botStatus.isOnline ? Math.floor(Math.random() * 3) : 0),
        },
        lastUpdate: Date.now(),
      }));
    } catch (error) {
      console.warn("Status check failed - using fallback data:", error);

      // Use proper fallback data on error
      setStatus((prev) => ({
        ...prev,
        bot: {
          isOnline: false,
          status: "OFFLINE",
          responseTime: "error",
          lastPing: null,
          confidence: 0,
        },
        scanner: {
          isActive: false,
          status: "OFFLINE",
          activeScans: 0,
          progress: 0,
        },
        services: {
          database: false,
          network: false,
          apis: false,
        },
        lastUpdate: Date.now(),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial status check
    refreshStatus();

    // Regular updates every 10 seconds
    const interval = setInterval(refreshStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <StatusContext.Provider value={{ status, refreshStatus, isLoading }}>
      {children}
    </StatusContext.Provider>
  );
}

// Helper hooks for specific status checks
export const useBotStatus = () => {
  const { status } = useSystemStatus();
  return status.bot;
};

export const useScannerStatus = () => {
  const { status } = useSystemStatus();
  return status.scanner;
};

export const useServiceStatus = () => {
  const { status } = useSystemStatus();
  return status.services;
};

export const useStatsStatus = () => {
  const { status } = useSystemStatus();
  return status.stats;
};
