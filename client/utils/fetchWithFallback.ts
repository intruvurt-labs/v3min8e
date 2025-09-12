interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface FallbackResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isFallback?: boolean;
}

/**
 * Enhanced fetch with timeout, retries, and fallback data
 */
export async function fetchWithFallback<T>(
  url: string,
  options: FetchOptions = {},
  fallbackData?: T,
): Promise<FallbackResponse<T>> {
  const {
    timeout = 12000,
    retries = 1,
    retryDelay = 1000,
    ...fetchOptions
  } = options as FetchOptions & { signal?: AbortSignal };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Create an internal controller and bridge any external signal
    const controller = new AbortController();
    const externalSignal = (fetchOptions as any).signal as AbortSignal | undefined;
    const onExternalAbort = () => {
      try {
        if (!controller.signal.aborted) controller.abort(externalSignal?.reason ?? "external-abort");
      } catch {}
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason ?? "external-abort");
      } else {
        externalSignal.addEventListener("abort", onExternalAbort, { once: true });
      }
    }

    let timeoutId: any;
    try {
      timeoutId = setTimeout(() => {
        try {
          if (!controller.signal.aborted) controller.abort("timeout");
        } catch {}
      }, timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Handle aborts and network errors gracefully
      if (lastError.name === "AbortError") {
        // Retry if it was our timeout and retries remain
        const isTimeout = (lastError as any).message?.toLowerCase?.().includes("timeout") || (controller.signal as any).reason === "timeout";
        if (isTimeout && attempt < retries) {
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }
        // Stop retrying on external aborts
        break;
      }
      if (lastError.message.includes("TypeError: Failed to fetch")) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }
        break;
      }

      // Wait before retry (except on last attempt)
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    } finally {
      clearTimeout(timeoutId);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }

  if (fallbackData !== undefined) {
    return {
      success: true,
      data: fallbackData,
      isFallback: true,
      error: lastError?.message,
    };
  }

  return {
    success: false,
    error: lastError?.message || "Network error",
  };
}

/**
 * Simple retry wrapper for async functions
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Check if we're in a development environment
 */
export function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

/**
 * Generate fallback data for various components
 */
export const fallbackData = {
  botStatus: {
    status: "DEMO",
    health: 50,
    lastPing: Date.now(),
    recentActivity: [
      {
        type: "info" as const,
        message: "Demo mode - API unavailable",
        timestamp: Date.now(),
      },
    ],
    activeUsers: 0,
    messagesProcessed: 0,
    uptime: "Demo Mode",
    isReal: false,
  },

  scannerStatus: {
    isScanning: false,
    activeScans: 0,
    progress: 0,
    currentOperation: "Demo mode - scanner offline",
    currentScanTime: 0,
    scansCompleted: 0,
    threatsDetected: 0,
    isReal: false,
  },

  nimrevStatus: {
    isRunning: false,
    services: {
      database: { isRunning: false },
      scanQueue: { isRunning: false },
    },
    stats: {
      activeUsers: 0,
      messagesProcessed: 0,
      uptime: "Demo Mode",
    },
  },

  vermPrice: {
    price: 0,
    change24h: 0,
    volume24h: 0,
    marketCap: 0,
    priceHistory: [],
    lastUpdated: Date.now(),
    source: "Demo Mode - No Live Data",
  },
};
