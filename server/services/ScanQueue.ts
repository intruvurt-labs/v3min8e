import { EventEmitter } from "events";
import { ScanRequest, ScanStatus } from "../../shared/nimrev-types";
import { supabase } from "../utils/supabase";
import { SubversiveScanner } from "./SubversiveScanner";

interface QueuedScan extends ScanRequest {
  id: string;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: ScanStatus;
}

export class ScanQueue extends EventEmitter {
  private queue: QueuedScan[] = [];
  private processing: Map<string, QueuedScan> = new Map();
  private scanner: SubversiveScanner;
  private maxConcurrentScans: number = 10;
  private processingInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor() {
    super();
    this.scanner = new SubversiveScanner();
  }

  public async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🔄 Starting scan queue processor");

    // Load any pending scans from database
    await this.loadPendingScans();

    // Start processing queue
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000);

    console.log("✅ Scan queue processor started");
  }

  public async stop() {
    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Wait for active scans to complete
    console.log(
      `⏳ Waiting for ${this.processing.size} active scans to complete...`,
    );
    while (this.processing.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("🛑 Scan queue processor stopped");
  }

  private async loadPendingScans() {
    try {
      const { data: pendingScans } = await supabase
        .from("scan_results")
        .select("id, token_address, blockchain")
        .in("scan_status", ["pending", "processing"])
        .order("created_at", { ascending: true });

      if (pendingScans) {
        for (const scan of pendingScans) {
          this.queue.push({
            id: scan.id,
            token_address: scan.token_address,
            blockchain: scan.blockchain,
            priority: "normal",
            createdAt: new Date(),
            attempts: 0,
            maxAttempts: 3,
            status: "pending",
          });
        }
        console.log(`📋 Loaded ${pendingScans.length} pending scans`);
      }
    } catch (error) {
      console.error("Failed to load pending scans:", error);
    }
  }

  public async addScan(request: ScanRequest): Promise<string> {
    // Create scan record in database
    const { data: scanResult, error } = await supabase
      .from("scan_results")
      .insert({
        token_address: request.token_address,
        blockchain: request.blockchain,
        scan_status: "pending",
        scanned_by: request.requested_by,
        scanner_version: "1.0.0",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create scan record:", error);
      throw error;
    }

    const queuedScan: QueuedScan = {
      ...request,
      id: scanResult.id,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: "pending",
    };

    // Insert into queue based on priority
    if (request.priority === "high") {
      this.queue.unshift(queuedScan);
    } else {
      this.queue.push(queuedScan);
    }

    this.emit("scanQueued", queuedScan);
    return scanResult.id;
  }

  private async processQueue() {
    if (!this.isRunning) return;

    // Process queued scans if we have capacity
    while (
      this.queue.length > 0 &&
      this.processing.size < this.maxConcurrentScans
    ) {
      const scan = this.queue.shift()!;
      this.processScan(scan);
    }
  }

  private async processScan(scan: QueuedScan) {
    this.processing.set(scan.id, scan);
    scan.status = "processing";
    scan.attempts++;

    console.log(
      `🔍 Starting scan: ${scan.blockchain}:${scan.token_address} (attempt ${scan.attempts})`,
    );

    try {
      // Update status in database
      await supabase
        .from("scan_results")
        .update({
          scan_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", scan.id);

      const startTime = Date.now();

      // Perform the actual scan
      const scanResult = await this.scanner.performComprehensiveScan(
        scan.token_address,
        scan.blockchain,
        scan.deep_scan || false,
      );

      const scanDuration = Date.now() - startTime;

      // Save results to database
      await supabase
        .from("scan_results")
        .update({
          scan_status: "completed",
          risk_score: scanResult.risk_score,
          threat_categories: scanResult.threat_categories,
          bytecode_analysis: scanResult.bytecode_analysis,
          social_analysis: scanResult.social_analysis,
          liquidity_analysis: scanResult.liquidity_analysis,
          fee_analysis: scanResult.fee_analysis,
          token_symbol: scanResult.token_symbol,
          token_name: scanResult.token_name,
          creator_address: scanResult.creator_address,
          contract_hash: scanResult.contract_hash,
          scan_duration_ms: scanDuration,
          signature: scanResult.signature,
          ipfs_hash: scanResult.ipfs_hash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scan.id);

      this.emit("scanCompleted", { scanId: scan.id, result: scanResult });
      console.log(
        `✅ Scan completed: ${scan.blockchain}:${scan.token_address} (${scanDuration}ms, risk: ${scanResult.risk_score})`,
      );

      // Trigger alerts if high risk
      if (scanResult.risk_score <= 30) {
        this.emit("highRiskDetected", { scanId: scan.id, result: scanResult });
      }
    } catch (error) {
      console.error(
        `❌ Scan failed: ${scan.blockchain}:${scan.token_address}`,
        error,
      );

      if (scan.attempts >= scan.maxAttempts) {
        // Mark as failed
        await supabase
          .from("scan_results")
          .update({
            scan_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", scan.id);

        this.emit("scanFailed", { scanId: scan.id, error });
      } else {
        // Retry later
        scan.status = "pending";
        setTimeout(() => {
          this.queue.push(scan);
        }, 5000 * scan.attempts); // Exponential backoff
      }
    } finally {
      this.processing.delete(scan.id);
    }
  }

  public getQueueStatus() {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      capacity: this.maxConcurrentScans - this.processing.size,
      isRunning: this.isRunning,
    };
  }

  public async pauseQueue() {
    this.isRunning = false;
    console.log("⏸️ Scan queue paused");
  }

  public async resumeQueue() {
    this.isRunning = true;
    console.log("▶️ Scan queue resumed");
  }

  public setPriority(scanId: string, priority: "low" | "normal" | "high") {
    const scanIndex = this.queue.findIndex((scan) => scan.id === scanId);
    if (scanIndex === -1) return false;

    const scan = this.queue.splice(scanIndex, 1)[0];
    scan.priority = priority;

    if (priority === "high") {
      this.queue.unshift(scan);
    } else {
      this.queue.push(scan);
    }

    return true;
  }

  public cancelScan(scanId: string): boolean {
    const scanIndex = this.queue.findIndex((scan) => scan.id === scanId);
    if (scanIndex !== -1) {
      this.queue.splice(scanIndex, 1);
      return true;
    }

    // Can't cancel if already processing
    return false;
  }

  public getProcessingScans(): QueuedScan[] {
    return Array.from(this.processing.values());
  }

  public getQueuedScans(): QueuedScan[] {
    return [...this.queue];
  }
}
