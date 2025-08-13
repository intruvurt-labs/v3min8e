/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Contact form types
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "feedback" | "support" | "partnership" | "security" | "other";
}

export interface ContactResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

/**
 * NimRev Scanning API types
 */
export interface ScanRequest {
  address: string;
  network?: "mainnet" | "devnet" | "testnet";
  deep?: boolean;
}

export interface ScanResult {
  address: string;
  status: "safe" | "warning" | "danger" | "unknown";
  trustScore: number;
  riskFactors: string[];
  contractType?: string;
  creatorMatch?: boolean;
  organicVolume?: number;
  analysis: {
    subversivePatterns: boolean;
    crossChainActivity: any[];
    organicMovement: boolean;
    knownCreator: boolean;
    honeypotDetected: boolean;
    rugPullRisk: number;
    botActivity: number;
  };
  timestamp: Date;
  retryCount?: number;
}

export interface ScanResponse {
  success: boolean;
  data?: ScanResult;
  message: string;
  retryAfter?: number;
}
