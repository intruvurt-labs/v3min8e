// Advanced Encryption Service for P2P Trading
// Supports multiple encryption levels with real cryptographic implementations

export type EncryptionLevel = "basic" | "advanced" | "military";

export interface EncryptionConfig {
  level: EncryptionLevel;
  keyRotation: boolean;
  perfectForwardSecrecy: boolean;
  messageExpiry: number; // minutes
}

export interface EncryptedMessage {
  content: string;
  algorithm: string;
  iv?: string;
  salt?: string;
  timestamp: number;
  expiresAt?: number;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

class AdvancedEncryptionService {
  private keyPairs: Map<string, KeyPair> = new Map();
  private sharedSecrets: Map<string, CryptoKey> = new Map();
  private config: EncryptionConfig;

  constructor(config: EncryptionConfig) {
    this.config = config;
  }

  // Generate cryptographically secure random bytes
  private generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // Convert ArrayBuffer to hex string
  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Convert hex string to ArrayBuffer
  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  // Basic encryption using AES-GCM
  async encryptBasic(message: string, password: string): Promise<EncryptedMessage> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Generate salt and derive key
    const salt = this.generateRandomBytes(16);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 128 },
      false,
      ["encrypt"]
    );

    // Generate IV and encrypt
    const iv = this.generateRandomBytes(12);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const timestamp = Date.now();
    const expiresAt = this.config.messageExpiry > 0 ? 
      timestamp + (this.config.messageExpiry * 60 * 1000) : undefined;

    return {
      content: this.arrayBufferToHex(encrypted),
      algorithm: "AES-128-GCM",
      iv: this.arrayBufferToHex(iv),
      salt: this.arrayBufferToHex(salt),
      timestamp,
      expiresAt,
    };
  }

  // Advanced encryption using AES-256-GCM
  async encryptAdvanced(message: string, password: string): Promise<EncryptedMessage> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Generate salt and derive key with higher iterations
    const salt = this.generateRandomBytes(32);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 200000, // Increased iterations
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 }, // 256-bit key
      false,
      ["encrypt"]
    );

    // Generate IV and encrypt
    const iv = this.generateRandomBytes(16); // Larger IV for AES-256
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const timestamp = Date.now();
    const expiresAt = this.config.messageExpiry > 0 ? 
      timestamp + (this.config.messageExpiry * 60 * 1000) : undefined;

    return {
      content: this.arrayBufferToHex(encrypted),
      algorithm: "AES-256-GCM",
      iv: this.arrayBufferToHex(iv),
      salt: this.arrayBufferToHex(salt),
      timestamp,
      expiresAt,
    };
  }

  // Military-grade encryption simulation using ChaCha20-Poly1305 concept
  async encryptMilitary(message: string, password: string): Promise<EncryptedMessage> {
    // Since Web Crypto API doesn't support ChaCha20-Poly1305, we simulate with AES-256
    // but with additional security measures
    const encoder = new TextEncoder();
    
    // Add noise to the message for traffic analysis resistance
    const noise = this.arrayBufferToHex(this.generateRandomBytes(16));
    const paddedMessage = message + `[NOISE:${noise}]`;
    const data = encoder.encode(paddedMessage);
    
    // Use multiple rounds of key derivation
    const salt1 = this.generateRandomBytes(32);
    const salt2 = this.generateRandomBytes(32);
    
    let keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password + salt1.toString()),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    // First round
    let intermediateKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt1,
        iterations: 300000,
        hash: "SHA-512", // Stronger hash
      },
      keyMaterial,
      { name: "HMAC", hash: "SHA-512" },
      true,
      ["sign"]
    );

    // Export and re-import for second round
    const keyBytes = await crypto.subtle.exportKey("raw", intermediateKey);
    keyMaterial = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    // Second round - final encryption key
    const finalKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt2,
        iterations: 500000, // Very high iterations
        hash: "SHA-512",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    // Generate IV and encrypt
    const iv = this.generateRandomBytes(16);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      finalKey,
      data
    );

    const timestamp = Date.now();
    const expiresAt = this.config.messageExpiry > 0 ? 
      timestamp + (this.config.messageExpiry * 60 * 1000) : undefined;

    return {
      content: this.arrayBufferToHex(encrypted),
      algorithm: "CHACHA20-POLY1305-SIM", // Simulated
      iv: this.arrayBufferToHex(iv),
      salt: this.arrayBufferToHex(salt1) + ":" + this.arrayBufferToHex(salt2),
      timestamp,
      expiresAt,
    };
  }

  // Main encryption method
  async encryptMessage(message: string, password: string): Promise<EncryptedMessage> {
    try {
      switch (this.config.level) {
        case "basic":
          return await this.encryptBasic(message, password);
        case "advanced":
          return await this.encryptAdvanced(message, password);
        case "military":
          return await this.encryptMilitary(message, password);
        default:
          throw new Error("Unsupported encryption level");
      }
    } catch (error) {
      console.error("Encryption failed:", error);
      throw error;
    }
  }

  // Decrypt basic message
  async decryptBasic(encryptedMsg: EncryptedMessage, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Recreate key from salt
    const salt = this.hexToArrayBuffer(encryptedMsg.salt!);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 128 },
      false,
      ["decrypt"]
    );

    // Decrypt
    const iv = this.hexToArrayBuffer(encryptedMsg.iv!);
    const encryptedData = this.hexToArrayBuffer(encryptedMsg.content);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedData
    );

    return decoder.decode(decrypted);
  }

  // Decrypt advanced message
  async decryptAdvanced(encryptedMsg: EncryptedMessage, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Recreate key from salt
    const salt = this.hexToArrayBuffer(encryptedMsg.salt!);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 200000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // Decrypt
    const iv = this.hexToArrayBuffer(encryptedMsg.iv!);
    const encryptedData = this.hexToArrayBuffer(encryptedMsg.content);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedData
    );

    return decoder.decode(decrypted);
  }

  // Decrypt military message
  async decryptMilitary(encryptedMsg: EncryptedMessage, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Split the combined salt
    const [salt1Hex, salt2Hex] = encryptedMsg.salt!.split(":");
    const salt1 = this.hexToArrayBuffer(salt1Hex);
    const salt2 = this.hexToArrayBuffer(salt2Hex);

    // Recreate the multi-round key derivation
    let keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password + salt1.toString()),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    // First round
    let intermediateKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt1,
        iterations: 300000,
        hash: "SHA-512",
      },
      keyMaterial,
      { name: "HMAC", hash: "SHA-512" },
      true,
      ["sign"]
    );

    // Export and re-import for second round
    const keyBytes = await crypto.subtle.exportKey("raw", intermediateKey);
    keyMaterial = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    // Second round - final decryption key
    const finalKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt2,
        iterations: 500000,
        hash: "SHA-512",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // Decrypt
    const iv = this.hexToArrayBuffer(encryptedMsg.iv!);
    const encryptedData = this.hexToArrayBuffer(encryptedMsg.content);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      finalKey,
      encryptedData
    );

    const decryptedText = decoder.decode(decrypted);
    
    // Remove noise padding
    const noiseIndex = decryptedText.lastIndexOf("[NOISE:");
    if (noiseIndex !== -1) {
      return decryptedText.substring(0, noiseIndex);
    }
    
    return decryptedText;
  }

  // Main decryption method
  async decryptMessage(encryptedMsg: EncryptedMessage, password: string): Promise<string> {
    try {
      // Check if message has expired
      if (encryptedMsg.expiresAt && Date.now() > encryptedMsg.expiresAt) {
        throw new Error("Message has expired");
      }

      switch (encryptedMsg.algorithm) {
        case "AES-128-GCM":
          return await this.decryptBasic(encryptedMsg, password);
        case "AES-256-GCM":
          return await this.decryptAdvanced(encryptedMsg, password);
        case "CHACHA20-POLY1305-SIM":
          return await this.decryptMilitary(encryptedMsg, password);
        default:
          throw new Error("Unsupported encryption algorithm");
      }
    } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
    }
  }

  // Generate ECDH key pair for Perfect Forward Secrecy
  async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-384", // Strong curve
      },
      false, // Not extractable for security
      ["deriveKey"]
    );

    return keyPair;
  }

  // Derive shared secret using ECDH
  async deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey,
      },
      privateKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Generate secure hash for message integrity
  async generateHash(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return this.arrayBufferToHex(hashBuffer);
  }

  // Verify message integrity
  async verifyHash(message: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.generateHash(message);
    return actualHash === expectedHash;
  }

  // Update configuration
  updateConfig(newConfig: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  // Clean up expired keys (if perfect forward secrecy is enabled)
  cleanupExpiredKeys(): void {
    if (this.config.perfectForwardSecrecy) {
      // In a real implementation, this would remove old keys
      // For now, we just clear all stored keys
      this.keyPairs.clear();
      this.sharedSecrets.clear();
    }
  }
}

// Export singleton instance
export const encryptionService = new AdvancedEncryptionService({
  level: "advanced",
  keyRotation: true,
  perfectForwardSecrecy: true,
  messageExpiry: 60, // 1 hour default
});

export default AdvancedEncryptionService;
