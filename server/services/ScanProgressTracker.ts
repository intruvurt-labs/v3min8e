import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import SecurityScannerService from "./SecurityScannerService";
import jwt from "jsonwebtoken";

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  subscribedScans: Set<string>;
}

interface ProgressUpdate {
  scanId: string;
  userId: string;
  phase: string;
  progress: number;
  currentTask: string;
  estimatedTime: number;
  findings: any[];
  timestamp: string;
}

export class ScanProgressTracker extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private scannerService: SecurityScannerService;

  constructor(port: number = 8083) {
    super();

    this.wss = new WebSocketServer({
      port,
      perMessageDeflate: false,
    });

    this.scannerService = new SecurityScannerService();
    this.setupWebSocketServer();
    this.setupScannerListeners();

    console.log(`🔄 Scan Progress Tracker started on port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on("connection", (ws: WebSocket, request) => {
      console.log("📡 New WebSocket connection established");

      ws.on("message", async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleClientMessage(ws, message);
        } catch (error) {
          console.error("❌ Error processing WebSocket message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            }),
          );
        }
      });

      ws.on("close", () => {
        this.handleClientDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error("🚨 WebSocket error:", error);
      });
    });
  }

  private async handleClientMessage(
    ws: WebSocket,
    message: any,
  ): Promise<void> {
    const { type, token, scanId, data } = message;

    switch (type) {
      case "authenticate":
        await this.authenticateClient(ws, token);
        break;

      case "subscribe_scan":
        await this.subscribeToScan(ws, scanId);
        break;

      case "unsubscribe_scan":
        await this.unsubscribeFromScan(ws, scanId);
        break;

      case "get_scan_status":
        await this.sendScanStatus(ws, scanId);
        break;

      case "get_user_scans":
        await this.sendUserScans(ws);
        break;

      case "ping":
        ws.send(
          JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }),
        );
        break;

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Unknown message type: ${type}`,
          }),
        );
    }
  }

  private async authenticateClient(
    ws: WebSocket,
    token: string,
  ): Promise<void> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default-secret",
      ) as any;
      const userId = decoded.userId || decoded.sub;

      if (!userId) {
        throw new Error("Invalid token payload");
      }

      const clientId = this.generateClientId();
      const client: ClientConnection = {
        ws,
        userId,
        subscribedScans: new Set(),
      };

      this.clients.set(clientId, client);

      ws.send(
        JSON.stringify({
          type: "authenticated",
          clientId,
          userId,
          timestamp: new Date().toISOString(),
        }),
      );

      console.log(`✅ Client authenticated: ${userId}`);
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "authentication_error",
          message: "Invalid authentication token",
        }),
      );
      ws.close(1008, "Authentication failed");
    }
  }

  private async subscribeToScan(ws: WebSocket, scanId: string): Promise<void> {
    const client = this.findClientBySocket(ws);
    if (!client) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Client not authenticated",
        }),
      );
      return;
    }

    // Verify user owns this scan or has permission
    const scanResult = await this.scannerService.getScanResult(scanId);
    if (!scanResult || scanResult.user_id !== client.userId) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Unauthorized access to scan",
        }),
      );
      return;
    }

    client.subscribedScans.add(scanId);

    ws.send(
      JSON.stringify({
        type: "subscribed",
        scanId,
        timestamp: new Date().toISOString(),
      }),
    );

    // Send current progress if scan is active
    const progress = this.scannerService.getScanProgress(scanId);
    if (progress) {
      this.sendProgressUpdate(client, progress);
    }
  }

  private async unsubscribeFromScan(
    ws: WebSocket,
    scanId: string,
  ): Promise<void> {
    const client = this.findClientBySocket(ws);
    if (client) {
      client.subscribedScans.delete(scanId);
      ws.send(
        JSON.stringify({
          type: "unsubscribed",
          scanId,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private async sendScanStatus(ws: WebSocket, scanId: string): Promise<void> {
    const client = this.findClientBySocket(ws);
    if (!client) return;

    try {
      const scanResult = await this.scannerService.getScanResult(scanId);
      if (!scanResult || scanResult.user_id !== client.userId) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Scan not found or unauthorized",
          }),
        );
        return;
      }

      ws.send(
        JSON.stringify({
          type: "scan_status",
          scanId,
          status: scanResult.status,
          progress:
            scanResult.status === "completed"
              ? 100
              : scanResult.status === "error"
                ? 0
                : this.scannerService.getScanProgress(scanId)?.progress || 0,
          data: scanResult,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to fetch scan status",
        }),
      );
    }
  }

  private async sendUserScans(ws: WebSocket): Promise<void> {
    const client = this.findClientBySocket(ws);
    if (!client) return;

    try {
      const scans = await this.scannerService.getUserScanHistory(
        client.userId,
        20,
      );

      ws.send(
        JSON.stringify({
          type: "user_scans",
          scans: scans.map((scan) => ({
            scanId: scan.scan_id,
            status: scan.status,
            address: scan.address,
            network: scan.network,
            score: scan.score,
            riskLevel: scan.risk_level,
            createdAt: scan.created_at,
            completedAt: scan.completed_at,
          })),
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to fetch user scans",
        }),
      );
    }
  }

  private setupScannerListeners(): void {
    // Listen for progress updates from scanner service
    this.scannerService.on("progress", (progressData) => {
      this.broadcastProgressUpdate(progressData);
    });

    // Listen for scan completion
    this.scannerService.on("scan_completed", (scanData) => {
      this.broadcastScanCompletion(scanData);
    });

    // Listen for scan errors
    this.scannerService.on("error", (errorData) => {
      this.broadcastScanError(errorData);
    });
  }

  private broadcastProgressUpdate(progressData: any): void {
    const { scanId } = progressData;

    this.clients.forEach((client) => {
      if (client.subscribedScans.has(scanId)) {
        this.sendProgressUpdate(client, progressData);
      }
    });
  }

  private sendProgressUpdate(
    client: ClientConnection,
    progressData: any,
  ): void {
    const update: ProgressUpdate = {
      scanId: progressData.scanId,
      userId: client.userId,
      phase: progressData.phase,
      progress: progressData.progress,
      currentTask: progressData.currentTask,
      estimatedTime: progressData.estimatedTime,
      findings: progressData.findings || [],
      timestamp: new Date().toISOString(),
    };

    client.ws.send(
      JSON.stringify({
        type: "progress_update",
        data: update,
      }),
    );
  }

  private broadcastScanCompletion(scanData: any): void {
    const { scanId } = scanData;

    this.clients.forEach((client) => {
      if (client.subscribedScans.has(scanId)) {
        client.ws.send(
          JSON.stringify({
            type: "scan_completed",
            scanId,
            data: scanData,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });
  }

  private broadcastScanError(errorData: any): void {
    const { scanId } = errorData;

    this.clients.forEach((client) => {
      if (client.subscribedScans.has(scanId)) {
        client.ws.send(
          JSON.stringify({
            type: "scan_error",
            scanId,
            error: errorData.error,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });
  }

  private handleClientDisconnect(ws: WebSocket): void {
    // Find and remove client
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws === ws) {
        this.clients.delete(clientId);
        console.log(`🔌 Client disconnected: ${client.userId}`);
        break;
      }
    }
  }

  private findClientBySocket(ws: WebSocket): ClientConnection | null {
    for (const client of this.clients.values()) {
      if (client.ws === ws) {
        return client;
      }
    }
    return null;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check for monitoring
  public getActiveConnections(): number {
    return this.clients.size;
  }

  public getConnectionStats(): any {
    const userConnections = new Map<string, number>();

    this.clients.forEach((client) => {
      const count = userConnections.get(client.userId) || 0;
      userConnections.set(client.userId, count + 1);
    });

    return {
      totalConnections: this.clients.size,
      uniqueUsers: userConnections.size,
      averageConnectionsPerUser:
        this.clients.size / (userConnections.size || 1),
    };
  }

  public cleanup(): void {
    this.clients.forEach((client) => {
      client.ws.close(1001, "Server shutting down");
    });
    this.wss.close();
  }
}

export default ScanProgressTracker;
