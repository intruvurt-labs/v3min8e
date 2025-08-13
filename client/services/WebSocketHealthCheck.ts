export class WebSocketHealthCheck {
  private static instance: WebSocketHealthCheck;
  private healthStatus: "unknown" | "healthy" | "unhealthy" = "unknown";
  private lastCheckTime: number = 0;
  private checkInterval: number = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): WebSocketHealthCheck {
    if (!WebSocketHealthCheck.instance) {
      WebSocketHealthCheck.instance = new WebSocketHealthCheck();
    }
    return WebSocketHealthCheck.instance;
  }

  public async checkWebSocketHealth(url: string): Promise<boolean> {
    const now = Date.now();

    // Return cached result if recent
    if (
      now - this.lastCheckTime < this.checkInterval &&
      this.healthStatus !== "unknown"
    ) {
      return this.healthStatus === "healthy";
    }

    try {
      // Quick health check with timeout
      const healthPromise = new Promise<boolean>((resolve) => {
        const testWs = new WebSocket(url);

        const timeout = setTimeout(() => {
          testWs.close();
          resolve(false);
        }, 3000); // 3 second timeout

        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close();
          resolve(true);
        };

        testWs.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        testWs.onclose = (event) => {
          clearTimeout(timeout);
          // If it connected and then closed cleanly, it's healthy
          resolve(event.wasClean);
        };
      });

      const isHealthy = await healthPromise;
      this.healthStatus = isHealthy ? "healthy" : "unhealthy";
      this.lastCheckTime = now;

      return isHealthy;
    } catch (error) {
      console.warn("WebSocket health check failed:", error);
      this.healthStatus = "unhealthy";
      this.lastCheckTime = now;
      return false;
    }
  }

  public getLastKnownStatus(): "unknown" | "healthy" | "unhealthy" {
    return this.healthStatus;
  }

  public isWebSocketSupported(): boolean {
    return typeof WebSocket !== "undefined";
  }
}

export const wsHealthCheck = WebSocketHealthCheck.getInstance();
export default wsHealthCheck;
