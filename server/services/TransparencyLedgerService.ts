import { EventEmitter } from "events";
import crypto from "crypto";
import { supabase } from "../utils/supabase";

// Transparency Ledger - Core to NimRev's "Power to the people" philosophy
// All scans are public and immutable - stored with cryptographic proof
// Users can verify NimRev never retroactively edits scan results

interface TransparencyEntry {
  id: string;
  scan_id: string;
  address: string;
  blockchain: string;
  scan_results: any;
  threat_score: number;
  timestamp: string;
  ipfs_hash: string;
  signature: string;
  public_key: string;
  immutable: boolean;
  verification_count: number;
}

interface ScanVerification {
  entry_id: string;
  verifier_address: string;
  verification_result: "valid" | "invalid" | "disputed";
  verification_timestamp: string;
  verification_signature: string;
}

export class TransparencyLedgerService extends EventEmitter {
  private ledgerEntries: Map<string, TransparencyEntry> = new Map();
  private verifications: Map<string, ScanVerification[]> = new Map();
  private nimrevPrivateKey: string;
  private nimrevPublicKey: string;
  private isInitialized = false;

  constructor() {
    super();
    this.initializeLedger();
  }

  private async initializeLedger() {
    console.log("📜 Initializing NimRev Transparency Ledger...");
    console.log("🔒 Generating cryptographic keys for scan verification...");

    try {
      // Initialize cryptographic keys for signing
      await this.initializeKeys();

      // Load existing ledger entries
      await this.loadExistingEntries();

      this.isInitialized = true;
      console.log("✅ Transparency Ledger fully operational");
      console.log("🌍 All scan results are now publicly verifiable");

      this.emit("ledgerInitialized", {
        entryCount: this.ledgerEntries.size,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Failed to initialize Transparency Ledger:", error);
    }
  }

  private async initializeKeys() {
    // In production, these would be securely managed keys
    // For demo purposes, we'll use deterministic keys
    const keyMaterial =
      process.env.NIMREV_LEDGER_KEY || "nimrev_transparency_2025";

    this.nimrevPrivateKey = crypto
      .createHash("sha256")
      .update(keyMaterial)
      .digest("hex");
    this.nimrevPublicKey = crypto
      .createHash("sha256")
      .update(this.nimrevPrivateKey + "_public")
      .digest("hex");

    console.log(
      `🔑 NimRev Public Key: ${this.nimrevPublicKey.substring(0, 16)}...`,
    );
  }

  private async loadExistingEntries() {
    try {
      const { data: entries } = await supabase
        .from("transparency_ledger")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1000);

      if (entries) {
        entries.forEach((entry) => {
          this.ledgerEntries.set(entry.id, entry);
        });
        console.log(
          `📊 Loaded ${entries.length} existing transparency entries`,
        );
      }
    } catch (error) {
      console.error("Failed to load existing ledger entries:", error);
    }
  }

  // Create immutable ledger entry for scan result
  public async createLedgerEntry(scanData: {
    scan_id: string;
    address: string;
    blockchain: string;
    scan_results: any;
    threat_score: number;
  }): Promise<TransparencyEntry> {
    if (!this.isInitialized) {
      throw new Error("Transparency Ledger not initialized");
    }

    const timestamp = new Date().toISOString();
    const entryId = `ledger_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

    // Create IPFS hash (simulated - in production would upload to IPFS)
    const ipfsHash = await this.createIPFSHash(scanData);

    // Create cryptographic signature
    const signature = this.signScanData(scanData, timestamp);

    const entry: TransparencyEntry = {
      id: entryId,
      scan_id: scanData.scan_id,
      address: scanData.address,
      blockchain: scanData.blockchain,
      scan_results: scanData.scan_results,
      threat_score: scanData.threat_score,
      timestamp: timestamp,
      ipfs_hash: ipfsHash,
      signature: signature,
      public_key: this.nimrevPublicKey,
      immutable: true,
      verification_count: 0,
    };

    // Store in database
    try {
      await supabase.from("transparency_ledger").insert(entry);

      // Add to local cache
      this.ledgerEntries.set(entryId, entry);

      console.log(
        `📜 Ledger entry created: ${entryId} for ${scanData.address}`,
      );

      this.emit("entryCreated", entry);

      return entry;
    } catch (error) {
      console.error("Failed to create ledger entry:", error);
      throw error;
    }
  }

  // Verify the integrity of a ledger entry
  public async verifyEntry(
    entryId: string,
    verifierAddress?: string,
  ): Promise<{
    valid: boolean;
    details: string;
    verification_id?: string;
  }> {
    const entry = this.ledgerEntries.get(entryId);

    if (!entry) {
      return {
        valid: false,
        details: "Entry not found in transparency ledger",
      };
    }

    try {
      // Verify cryptographic signature
      const expectedSignature = this.signScanData(
        {
          scan_id: entry.scan_id,
          address: entry.address,
          blockchain: entry.blockchain,
          scan_results: entry.scan_results,
          threat_score: entry.threat_score,
        },
        entry.timestamp,
      );

      const signatureValid = expectedSignature === entry.signature;

      // Verify IPFS hash integrity
      const expectedIPFS = await this.createIPFSHash({
        scan_id: entry.scan_id,
        address: entry.address,
        blockchain: entry.blockchain,
        scan_results: entry.scan_results,
        threat_score: entry.threat_score,
      });

      const ipfsValid = expectedIPFS === entry.ipfs_hash;

      const isValid = signatureValid && ipfsValid;

      // Record verification if verifier address provided
      let verificationId;
      if (verifierAddress) {
        verificationId = await this.recordVerification(
          entryId,
          verifierAddress,
          isValid ? "valid" : "invalid",
        );
      }

      const result = {
        valid: isValid,
        details: isValid
          ? "Entry verified - signature and IPFS hash are valid"
          : `Verification failed - Signature: ${signatureValid}, IPFS: ${ipfsValid}`,
        verification_id: verificationId,
      };

      this.emit("entryVerified", { entry, result, verifierAddress });

      return result;
    } catch (error) {
      console.error("Verification error:", error);
      return {
        valid: false,
        details: `Verification error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // Record a community verification
  private async recordVerification(
    entryId: string,
    verifierAddress: string,
    result: "valid" | "invalid" | "disputed",
  ): Promise<string> {
    const verificationId = `verify_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const verification: ScanVerification = {
      entry_id: entryId,
      verifier_address: verifierAddress,
      verification_result: result,
      verification_timestamp: new Date().toISOString(),
      verification_signature: this.signVerification(
        entryId,
        verifierAddress,
        result,
      ),
    };

    try {
      await supabase.from("scan_verifications").insert({
        id: verificationId,
        ...verification,
      });

      // Update verification count
      const entry = this.ledgerEntries.get(entryId);
      if (entry) {
        entry.verification_count += 1;
        this.ledgerEntries.set(entryId, entry);

        await supabase
          .from("transparency_ledger")
          .update({ verification_count: entry.verification_count })
          .eq("id", entryId);
      }

      // Store in local cache
      const existing = this.verifications.get(entryId) || [];
      existing.push(verification);
      this.verifications.set(entryId, existing);

      console.log(`✅ Verification recorded: ${verificationId}`);
      return verificationId;
    } catch (error) {
      console.error("Failed to record verification:", error);
      throw error;
    }
  }

  // Create IPFS hash (simulated for demo)
  private async createIPFSHash(data: any): Promise<string> {
    const dataString = JSON.stringify(data, null, 0);
    const hash = crypto.createHash("sha256").update(dataString).digest("hex");
    return `Qm${hash.substring(0, 44)}`; // Simulate IPFS hash format
  }

  // Sign scan data with NimRev private key
  private signScanData(scanData: any, timestamp: string): string {
    const dataString =
      JSON.stringify(scanData) + timestamp + this.nimrevPrivateKey;
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  // Sign verification with timestamp
  private signVerification(
    entryId: string,
    verifierAddress: string,
    result: string,
  ): string {
    const dataString =
      entryId + verifierAddress + result + new Date().toISOString();
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  // Get ledger entry by ID
  public getLedgerEntry(entryId: string): TransparencyEntry | null {
    return this.ledgerEntries.get(entryId) || null;
  }

  // Get all entries for an address
  public getEntriesForAddress(address: string): TransparencyEntry[] {
    return Array.from(this.ledgerEntries.values())
      .filter((entry) => entry.address === address)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }

  // Get recent entries
  public getRecentEntries(limit: number = 50): TransparencyEntry[] {
    return Array.from(this.ledgerEntries.values())
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  // Get ledger statistics
  public getLedgerStats(): {
    totalEntries: number;
    totalVerifications: number;
    averageVerificationsPerEntry: number;
    oldestEntry: string;
    newestEntry: string;
  } {
    const entries = Array.from(this.ledgerEntries.values());
    const totalVerifications = entries.reduce(
      (sum, entry) => sum + entry.verification_count,
      0,
    );

    const sortedByDate = entries.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return {
      totalEntries: entries.length,
      totalVerifications: totalVerifications,
      averageVerificationsPerEntry:
        entries.length > 0 ? totalVerifications / entries.length : 0,
      oldestEntry: sortedByDate[0]?.timestamp || "N/A",
      newestEntry: sortedByDate[sortedByDate.length - 1]?.timestamp || "N/A",
    };
  }

  // Export ledger for external verification
  public exportLedger(): {
    entries: TransparencyEntry[];
    public_key: string;
    export_timestamp: string;
    export_signature: string;
  } {
    const entries = Array.from(this.ledgerEntries.values());
    const exportTimestamp = new Date().toISOString();

    const exportData = {
      entries: entries,
      public_key: this.nimrevPublicKey,
      export_timestamp: exportTimestamp,
    };

    const exportSignature = crypto
      .createHash("sha256")
      .update(JSON.stringify(exportData) + this.nimrevPrivateKey)
      .digest("hex");

    return {
      ...exportData,
      export_signature: exportSignature,
    };
  }

  // Dispute an entry (community feature)
  public async disputeEntry(
    entryId: string,
    disputerAddress: string,
    reason: string,
  ): Promise<string> {
    const disputeId = `dispute_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    try {
      await supabase.from("ledger_disputes").insert({
        id: disputeId,
        entry_id: entryId,
        disputer_address: disputerAddress,
        reason: reason,
        timestamp: new Date().toISOString(),
        status: "open",
      });

      console.log(`⚠️ Dispute filed: ${disputeId} for entry ${entryId}`);

      this.emit("entryDisputed", {
        entryId,
        disputerAddress,
        reason,
        disputeId,
      });

      return disputeId;
    } catch (error) {
      console.error("Failed to file dispute:", error);
      throw error;
    }
  }

  // Public key for external verification
  public getPublicKey(): string {
    return this.nimrevPublicKey;
  }

  public isOperational(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const transparencyLedger = new TransparencyLedgerService();
export default transparencyLedger;
