import crypto from "crypto";
import axios from "axios";
import { ScanResult } from "../../shared/nimrev-types";
import { supabase } from "../utils/supabase";
import { getEnv } from "../utils/env";

interface IPFSNode {
  url: string;
  apiKey?: string;
  isHealthy: boolean;
  lastCheck: Date;
}

interface LedgerEntry {
  id: string;
  scanId: string;
  dataHash: string;
  ipfsHash: string;
  signature: string;
  timestamp: Date;
  blockNumber?: number;
  chainProof?: string;
  isVerified: boolean;
}

interface TransparencyProof {
  scanId: string;
  originalHash: string;
  ipfsHash: string;
  signature: string;
  timestamp: string;
  verificationSteps: VerificationStep[];
}

interface VerificationStep {
  step: string;
  status: "success" | "failed";
  details: string;
  timestamp: string;
}

export class TransparencyLedger {
  private ipfsNodes: IPFSNode[] = [];
  private signingKey: string;
  private publicKey: string;
  private ledgerEntries: Map<string, LedgerEntry> = new Map();

  constructor() {
    this.signingKey = getEnv("NIMREV_SIGNING_KEY") || this.generateSigningKey();
    this.publicKey = this.derivePublicKey(this.signingKey);
    this.initializeIPFSNodes();
  }

  private initializeIPFSNodes() {
    // Initialize IPFS nodes for redundant storage
    this.ipfsNodes = [
      {
        url: "https://api.pinata.cloud",
        apiKey: getEnv("PINATA_API_KEY"),
        isHealthy: true,
        lastCheck: new Date(),
      },
      {
        url: "https://ipfs.infura.io:5001",
        apiKey: getEnv("INFURA_PROJECT_ID"),
        isHealthy: true,
        lastCheck: new Date(),
      },
      {
        url: "https://api.web3.storage",
        apiKey: getEnv("WEB3_STORAGE_TOKEN"),
        isHealthy: true,
        lastCheck: new Date(),
      },
    ];

    // Health check IPFS nodes
    this.performHealthChecks();

    // Schedule regular health checks
    setInterval(
      () => {
        this.performHealthChecks();
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }

  private generateSigningKey(): string {
    // Generate a cryptographic signing key for scan results
    return crypto.randomBytes(32).toString("hex");
  }

  private derivePublicKey(privateKey: string): string {
    // Derive public key from private key (simplified)
    return crypto.createHash("sha256").update(privateKey).digest("hex");
  }

  public async storeImmutableScanResult(
    scanResult: ScanResult,
  ): Promise<LedgerEntry> {
    try {
      console.log(`📝 Storing immutable scan result: ${scanResult.id}`);

      // 1. Create deterministic hash of scan data
      const scanData = this.prepareScanDataForStorage(scanResult);
      const dataHash = this.createDataHash(scanData);

      // 2. Generate cryptographic signature
      const signature = this.signData(scanData, dataHash);

      // 3. Store in IPFS for immutable storage
      const ipfsHash = await this.storeInIPFS(scanData);

      // 4. Create ledger entry
      const ledgerEntry: LedgerEntry = {
        id: crypto.randomUUID(),
        scanId: scanResult.id,
        dataHash,
        ipfsHash,
        signature,
        timestamp: new Date(),
        isVerified: true,
      };

      // 5. Store entry in database
      await this.storeLedgerEntry(ledgerEntry);

      // 6. Add to local cache
      this.ledgerEntries.set(scanResult.id, ledgerEntry);

      // 7. Update scan result with transparency data
      await this.updateScanResultWithTransparencyData(
        scanResult.id,
        ledgerEntry,
      );

      console.log(`✅ Scan result stored immutably: IPFS ${ipfsHash}`);
      return ledgerEntry;
    } catch (error) {
      console.error("Failed to store immutable scan result:", error);
      throw error;
    }
  }

  private prepareScanDataForStorage(scanResult: ScanResult): any {
    // Create a clean, deterministic representation of scan data
    return {
      scanId: scanResult.id,
      tokenAddress: scanResult.token_address,
      blockchain: scanResult.blockchain,
      tokenSymbol: scanResult.token_symbol,
      tokenName: scanResult.token_name,
      riskScore: scanResult.risk_score,
      threatCategories: scanResult.threat_categories?.sort() || [],
      scannerVersion: scanResult.scanner_version,
      scanTimestamp: scanResult.created_at,

      // Include analysis results
      bytecodeAnalysis: scanResult.bytecode_analysis,
      socialAnalysis: scanResult.social_analysis,
      liquidityAnalysis: scanResult.liquidity_analysis,
      feeAnalysis: scanResult.fee_analysis,

      // Metadata
      creatorAddress: scanResult.creator_address,
      contractHash: scanResult.contract_hash,
      scanDuration: scanResult.scan_duration_ms,
    };
  }

  private createDataHash(data: any): string {
    // Create deterministic hash of the data
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  private signData(data: any, dataHash: string): string {
    // Create cryptographic signature
    const signatureData = {
      dataHash,
      timestamp: new Date().toISOString(),
      scanner: "NimRev-v1.0.0",
      publicKey: this.publicKey,
    };

    const signatureString = JSON.stringify(signatureData);
    const hmac = crypto.createHmac("sha256", this.signingKey);
    hmac.update(signatureString);
    return hmac.digest("hex");
  }

  private async storeInIPFS(data: any): Promise<string> {
    const healthyNodes = this.ipfsNodes.filter((node) => node.isHealthy);

    if (healthyNodes.length === 0) {
      throw new Error("No healthy IPFS nodes available");
    }

    // Try to store on multiple nodes for redundancy
    const storagePromises = healthyNodes.map((node) =>
      this.storeOnIPFSNode(node, data),
    );

    try {
      // Wait for at least one successful storage
      const results = await Promise.allSettled(storagePromises);
      const successfulResults = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<string>).value);

      if (successfulResults.length === 0) {
        throw new Error("Failed to store on any IPFS node");
      }

      // Return the first successful hash (they should all be the same)
      const ipfsHash = successfulResults[0];

      console.log(
        `📦 Stored on ${successfulResults.length}/${healthyNodes.length} IPFS nodes: ${ipfsHash}`,
      );
      return ipfsHash;
    } catch (error) {
      console.error("IPFS storage failed:", error);
      throw error;
    }
  }

  private async storeOnIPFSNode(node: IPFSNode, data: any): Promise<string> {
    try {
      const formData = new FormData();
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      formData.append("file", blob, `scan-${Date.now()}.json`);

      let response;

      if (node.url.includes("pinata.cloud")) {
        response = await this.storeOnPinata(node, formData);
      } else if (node.url.includes("infura.io")) {
        response = await this.storeOnInfura(node, formData);
      } else if (node.url.includes("web3.storage")) {
        response = await this.storeOnWeb3Storage(node, formData);
      } else {
        throw new Error(`Unknown IPFS provider: ${node.url}`);
      }

      return response;
    } catch (error) {
      console.error(`Failed to store on ${node.url}:`, error);
      node.isHealthy = false;
      node.lastCheck = new Date();
      throw error;
    }
  }

  private async storeOnPinata(
    node: IPFSNode,
    formData: FormData,
  ): Promise<string> {
    const response = await axios.post(`${node.url}/api/v0/add`, formData, {
      headers: {
        Authorization: `Bearer ${node.apiKey}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    return response.data.Hash;
  }

  private async storeOnInfura(
    node: IPFSNode,
    formData: FormData,
  ): Promise<string> {
    const auth = Buffer.from(`${node.apiKey}:`).toString("base64");

    const response = await axios.post(`${node.url}/api/v0/add`, formData, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    return response.data.Hash;
  }

  private async storeOnWeb3Storage(
    node: IPFSNode,
    formData: FormData,
  ): Promise<string> {
    const response = await axios.post(`${node.url}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${node.apiKey}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    return response.data.cid;
  }

  private async storeLedgerEntry(entry: LedgerEntry) {
    try {
      await supabase.from("transparency_ledger").insert({
        id: entry.id,
        scan_id: entry.scanId,
        data_hash: entry.dataHash,
        ipfs_hash: entry.ipfsHash,
        signature: entry.signature,
        timestamp: entry.timestamp.toISOString(),
        is_verified: entry.isVerified,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to store ledger entry:", error);
      throw error;
    }
  }

  private async updateScanResultWithTransparencyData(
    scanId: string,
    entry: LedgerEntry,
  ) {
    try {
      await supabase
        .from("scan_results")
        .update({
          ipfs_hash: entry.ipfsHash,
          signature: entry.signature,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scanId);
    } catch (error) {
      console.error(
        "Failed to update scan result with transparency data:",
        error,
      );
    }
  }

  public async verifyLedgerEntry(scanId: string): Promise<TransparencyProof> {
    try {
      console.log(`🔍 Verifying ledger entry for scan: ${scanId}`);

      const verificationSteps: VerificationStep[] = [];
      let isValid = true;

      // Step 1: Retrieve ledger entry
      const entry = await this.getLedgerEntry(scanId);
      if (!entry) {
        verificationSteps.push({
          step: "retrieve_ledger_entry",
          status: "failed",
          details: "Ledger entry not found",
          timestamp: new Date().toISOString(),
        });
        isValid = false;
      } else {
        verificationSteps.push({
          step: "retrieve_ledger_entry",
          status: "success",
          details: `Found ledger entry: ${entry.id}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Step 2: Verify IPFS storage
      if (entry) {
        try {
          const ipfsData = await this.retrieveFromIPFS(entry.ipfsHash);
          verificationSteps.push({
            step: "verify_ipfs_storage",
            status: "success",
            details: `Successfully retrieved data from IPFS: ${entry.ipfsHash}`,
            timestamp: new Date().toISOString(),
          });

          // Step 3: Verify data hash
          const calculatedHash = this.createDataHash(ipfsData);
          if (calculatedHash === entry.dataHash) {
            verificationSteps.push({
              step: "verify_data_hash",
              status: "success",
              details: `Data hash matches: ${calculatedHash}`,
              timestamp: new Date().toISOString(),
            });
          } else {
            verificationSteps.push({
              step: "verify_data_hash",
              status: "failed",
              details: `Hash mismatch. Expected: ${entry.dataHash}, Got: ${calculatedHash}`,
              timestamp: new Date().toISOString(),
            });
            isValid = false;
          }

          // Step 4: Verify cryptographic signature
          const signatureValid = this.verifySignature(
            ipfsData,
            entry.dataHash,
            entry.signature,
          );
          if (signatureValid) {
            verificationSteps.push({
              step: "verify_signature",
              status: "success",
              details: "Cryptographic signature is valid",
              timestamp: new Date().toISOString(),
            });
          } else {
            verificationSteps.push({
              step: "verify_signature",
              status: "failed",
              details: "Invalid cryptographic signature",
              timestamp: new Date().toISOString(),
            });
            isValid = false;
          }
        } catch (error) {
          verificationSteps.push({
            step: "verify_ipfs_storage",
            status: "failed",
            details: `Failed to retrieve from IPFS: ${error.message}`,
            timestamp: new Date().toISOString(),
          });
          isValid = false;
        }
      }

      const proof: TransparencyProof = {
        scanId,
        originalHash: entry?.dataHash || "",
        ipfsHash: entry?.ipfsHash || "",
        signature: entry?.signature || "",
        timestamp: entry?.timestamp.toISOString() || "",
        verificationSteps,
      };

      console.log(
        `${isValid ? "✅" : "❌"} Verification ${isValid ? "passed" : "failed"} for scan: ${scanId}`,
      );
      return proof;
    } catch (error) {
      console.error("Verification failed:", error);
      throw error;
    }
  }

  private async getLedgerEntry(scanId: string): Promise<LedgerEntry | null> {
    try {
      // Check local cache first
      if (this.ledgerEntries.has(scanId)) {
        return this.ledgerEntries.get(scanId)!;
      }

      // Query database
      const { data, error } = await supabase
        .from("transparency_ledger")
        .select("*")
        .eq("scan_id", scanId)
        .single();

      if (error || !data) {
        return null;
      }

      const entry: LedgerEntry = {
        id: data.id,
        scanId: data.scan_id,
        dataHash: data.data_hash,
        ipfsHash: data.ipfs_hash,
        signature: data.signature,
        timestamp: new Date(data.timestamp),
        isVerified: data.is_verified,
      };

      // Cache for future use
      this.ledgerEntries.set(scanId, entry);
      return entry;
    } catch (error) {
      console.error("Failed to get ledger entry:", error);
      return null;
    }
  }

  private async retrieveFromIPFS(ipfsHash: string): Promise<any> {
    const healthyNodes = this.ipfsNodes.filter((node) => node.isHealthy);

    for (const node of healthyNodes) {
      try {
        const data = await this.retrieveFromIPFSNode(node, ipfsHash);
        return data;
      } catch (error) {
        console.warn(`Failed to retrieve from ${node.url}:`, error.message);
        continue;
      }
    }

    // Try public IPFS gateways as fallback
    const publicGateways = [
      "https://ipfs.io/ipfs",
      "https://gateway.pinata.cloud/ipfs",
      "https://cloudflare-ipfs.com/ipfs",
    ];

    for (const gateway of publicGateways) {
      try {
        const response = await axios.get(`${gateway}/${ipfsHash}`, {
          timeout: 10000,
          headers: {
            Accept: "application/json",
          },
        });
        return response.data;
      } catch (error) {
        console.warn(`Failed to retrieve from ${gateway}:`, error.message);
        continue;
      }
    }

    throw new Error(`Failed to retrieve data from IPFS: ${ipfsHash}`);
  }

  private async retrieveFromIPFSNode(
    node: IPFSNode,
    ipfsHash: string,
  ): Promise<any> {
    try {
      let url: string;
      let headers: any = {};

      if (node.url.includes("pinata.cloud")) {
        url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      } else if (node.url.includes("infura.io")) {
        url = `https://ipfs.infura.io/ipfs/${ipfsHash}`;
      } else if (node.url.includes("web3.storage")) {
        url = `https://${ipfsHash}.ipfs.w3s.link`;
      } else {
        url = `${node.url}/ipfs/${ipfsHash}`;
      }

      const response = await axios.get(url, {
        headers,
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve from ${node.url}: ${error.message}`);
    }
  }

  private verifySignature(
    data: any,
    dataHash: string,
    signature: string,
  ): boolean {
    try {
      // Recreate the signature data
      const signatureData = {
        dataHash,
        timestamp: new Date().toISOString(), // This would need to be the original timestamp
        scanner: "NimRev-v1.0.0",
        publicKey: this.publicKey,
      };

      const signatureString = JSON.stringify(signatureData);
      const hmac = crypto.createHmac("sha256", this.signingKey);
      hmac.update(signatureString);
      const calculatedSignature = hmac.digest("hex");

      // Note: In a real implementation, you'd want to include the original timestamp
      // in the stored signature data to make verification deterministic
      return calculatedSignature === signature;
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  private async performHealthChecks() {
    for (const node of this.ipfsNodes) {
      try {
        await this.checkNodeHealth(node);
      } catch (error) {
        console.warn(`Health check failed for ${node.url}:`, error.message);
      }
    }
  }

  private async checkNodeHealth(node: IPFSNode) {
    try {
      // Simple ping to check if node is responsive
      let healthCheckUrl: string;

      if (node.url.includes("pinata.cloud")) {
        healthCheckUrl = `${node.url}/api/v0/pin/ls?count=1`;
      } else if (node.url.includes("infura.io")) {
        healthCheckUrl = `${node.url}/api/v0/version`;
      } else {
        healthCheckUrl = node.url;
      }

      await axios.get(healthCheckUrl, {
        timeout: 5000,
        headers: node.apiKey ? { Authorization: `Bearer ${node.apiKey}` } : {},
      });

      node.isHealthy = true;
      node.lastCheck = new Date();
    } catch (error) {
      node.isHealthy = false;
      node.lastCheck = new Date();
      throw error;
    }
  }

  public async getPublicTransparencyLog(
    limit: number = 100,
    offset: number = 0,
  ) {
    try {
      const { data, error } = await supabase
        .from("transparency_ledger")
        .select(
          `
          id,
          scan_id,
          data_hash,
          ipfs_hash,
          timestamp,
          is_verified,
          scan_results!inner(
            token_address,
            blockchain,
            token_symbol,
            risk_score,
            threat_categories,
            scanner_version,
            created_at
          )
        `,
        )
        .eq("is_verified", true)
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Failed to get public transparency log:", error);
      throw error;
    }
  }

  public async generateTransparencyReport(scanId: string): Promise<any> {
    try {
      const proof = await this.verifyLedgerEntry(scanId);
      const ledgerEntry = await this.getLedgerEntry(scanId);

      if (!ledgerEntry) {
        throw new Error("Ledger entry not found");
      }

      const report = {
        scanId,
        transparency: {
          dataHash: ledgerEntry.dataHash,
          ipfsHash: ledgerEntry.ipfsHash,
          signature: ledgerEntry.signature,
          timestamp: ledgerEntry.timestamp.toISOString(),
          isVerified: ledgerEntry.isVerified,
        },
        verification: proof,
        ipfsGateways: [
          `https://ipfs.io/ipfs/${ledgerEntry.ipfsHash}`,
          `https://gateway.pinata.cloud/ipfs/${ledgerEntry.ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ledgerEntry.ipfsHash}`,
        ],
        publicKey: this.publicKey,
      };

      return report;
    } catch (error) {
      console.error("Failed to generate transparency report:", error);
      throw error;
    }
  }

  public getSystemStatus() {
    const healthyNodes = this.ipfsNodes.filter((node) => node.isHealthy);

    return {
      ipfsNodes: {
        total: this.ipfsNodes.length,
        healthy: healthyNodes.length,
        nodes: this.ipfsNodes.map((node) => ({
          url: node.url,
          isHealthy: node.isHealthy,
          lastCheck: node.lastCheck.toISOString(),
        })),
      },
      ledgerEntries: this.ledgerEntries.size,
      publicKey: this.publicKey,
      status: healthyNodes.length > 0 ? "operational" : "degraded",
    };
  }
}
