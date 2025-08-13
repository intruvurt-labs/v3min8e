export interface WebSocketDebugInfo {
  supported: boolean;
  protocol: string;
  host: string;
  url: string;
  readyState?: number;
  error?: string;
  timestamp: string;
}

export const testWebSocketConnection = async (
  url: string,
): Promise<WebSocketDebugInfo> => {
  const debugInfo: WebSocketDebugInfo = {
    supported: typeof WebSocket !== "undefined",
    protocol: window.location.protocol,
    host: window.location.host,
    url: url,
    timestamp: new Date().toISOString(),
  };

  if (!debugInfo.supported) {
    debugInfo.error = "WebSocket not supported by browser";
    return debugInfo;
  }

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        debugInfo.error = "Connection timeout (3 seconds)";
        debugInfo.readyState = ws.readyState;
        ws.close();
        resolve(debugInfo);
      }, 3000);

      ws.onopen = () => {
        clearTimeout(timeout);
        debugInfo.readyState = ws.readyState;
        ws.close();
        resolve(debugInfo);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        debugInfo.error = `Connection failed: ${error.type || "Unknown error"}`;
        debugInfo.readyState = ws.readyState;
        resolve(debugInfo);
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        if (!debugInfo.error) {
          if (event.wasClean) {
            // Connection succeeded and closed cleanly
            debugInfo.readyState = ws.readyState;
          } else {
            debugInfo.error = `Connection closed unexpectedly: ${event.code} ${event.reason}`;
            debugInfo.readyState = ws.readyState;
          }
        }
        resolve(debugInfo);
      };
    } catch (error) {
      debugInfo.error = `Failed to create WebSocket: ${error.message}`;
      resolve(debugInfo);
    }
  });
};

export const getWebSocketReadyStateText = (readyState: number): string => {
  switch (readyState) {
    case WebSocket.CONNECTING:
      return "CONNECTING (0)";
    case WebSocket.OPEN:
      return "OPEN (1)";
    case WebSocket.CLOSING:
      return "CLOSING (2)";
    case WebSocket.CLOSED:
      return "CLOSED (3)";
    default:
      return `UNKNOWN (${readyState})`;
  }
};

export const logWebSocketDebugInfo = (info: WebSocketDebugInfo): void => {
  console.group("🔍 WebSocket Debug Information");
  console.log(
    "📊 Support:",
    info.supported ? "✅ Supported" : "❌ Not Supported",
  );
  console.log("🌐 Protocol:", info.protocol);
  console.log("🏠 Host:", info.host);
  console.log("🔗 URL:", info.url);
  if (info.readyState !== undefined) {
    console.log("📡 Ready State:", getWebSocketReadyStateText(info.readyState));
  }
  if (info.error) {
    console.log("❌ Error:", info.error);
  }
  console.log("⏰ Timestamp:", info.timestamp);
  console.groupEnd();
};

export default {
  testWebSocketConnection,
  getWebSocketReadyStateText,
  logWebSocketDebugInfo,
};
