/**
 * Unified Type Definitions for NimRev Platform
 * This file consolidates all type definitions to ensure consistency across the entire codebase
 */

// =============================================================================
// CORE PLATFORM TYPES
// =============================================================================

export type BlockchainType = 'solana' | 'ethereum' | 'polygon' | 'binance_smart_chain' | 'arbitrum' | 'avalanche';

export type ScanStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type RiskCategory = 
  | 'honeypot'
  | 'rug_pull'
  | 'fake_token'
  | 'phishing'
  | 'malicious_contract'
  | 'suspicious_activity'
  | 'high_slippage'
  | 'low_liquidity'
  | 'blacklisted'
  | 'verified_safe';

// =============================================================================
// STANDARDIZED SCAN RESULT
// =============================================================================

export interface StandardScanResult {
  id: string;
  token_address: string;
  blockchain: BlockchainType;
  risk_score: number; // 0-100
  threat_level: ThreatLevel;
  threat_categories: RiskCategory[];
  scan_status: ScanStatus;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  completed_at?: string; // ISO string
  
  // Analysis Details
  bytecode_analysis?: BytecodeAnalysis;
  social_analysis?: SocialAnalysis;
  liquidity_analysis?: LiquidityAnalysis;
  contract_verification?: ContractVerification;
  
  // Metadata
  scan_duration_ms?: number;
  scanner_version: string;
  confidence_score: number; // 0-1
  false_positive_probability?: number; // 0-1
}

export interface BytecodeAnalysis {
  contract_size: number;
  function_count: number;
  suspicious_patterns: string[];
  malicious_signatures: string[];
  complexity_score: number;
  optimization_level: string;
  compiler_version?: string;
  verified_source: boolean;
}

export interface SocialAnalysis {
  twitter_mentions: number;
  reddit_discussions: number;
  telegram_activity: number;
  sentiment_score: number; // -1 to 1
  influencer_endorsements: number;
  warning_posts: number;
  last_social_activity: string; // ISO string
}

export interface LiquidityAnalysis {
  total_liquidity_usd: number;
  liquidity_locked_percentage: number;
  largest_holder_percentage: number;
  holder_count: number;
  trading_volume_24h: number;
  price_volatility_24h: number;
  market_cap_usd?: number;
}

export interface ContractVerification {
  is_verified: boolean;
  verification_source?: string;
  contract_name?: string;
  creator_address?: string;
  creation_timestamp?: string; // ISO string
  proxy_contract: boolean;
  upgrade_authority?: string;
}

// =============================================================================
// STANDARDIZED API RESPONSES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string; // ISO string
  request_id?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total_pages: number;
    total_items: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// =============================================================================
// PRICE DATA TYPES
// =============================================================================

export interface TokenPriceData {
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  fully_diluted_valuation?: number;
  circulating_supply?: number;
  total_supply?: number;
  last_updated: string; // ISO string
  source: string;
}

export interface PriceHistoryPoint {
  timestamp: string; // ISO string
  price: number;
  volume: number;
}

// =============================================================================
// USER AND AUTHENTICATION TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  wallet_address: string;
  email?: string;
  username?: string;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  last_login: string; // ISO string
  
  // Subscription Info
  subscription_tier: 'free' | 'premium' | 'enterprise';
  subscription_expires_at?: string; // ISO string
  
  // Usage Stats
  scans_performed: number;
  scans_remaining: number;
  monthly_scan_limit: number;
  
  // Settings
  notification_preferences: NotificationPreferences;
  api_access_enabled: boolean;
}

export interface NotificationPreferences {
  email_alerts: boolean;
  telegram_alerts: boolean;
  high_risk_only: boolean;
  weekly_reports: boolean;
}

// =============================================================================
// REAL-TIME MONITORING TYPES
// =============================================================================

export interface ThreatEvent {
  id: string;
  event_type: 'new_threat' | 'updated_threat' | 'resolved_threat';
  threat_level: ThreatLevel;
  token_address: string;
  blockchain: BlockchainType;
  description: string;
  detected_at: string; // ISO string
  scan_result_id?: string;
  affected_users?: number;
  estimated_loss_usd?: number;
}

export interface SystemMetrics {
  active_scans: number;
  completed_scans_24h: number;
  threats_detected_24h: number;
  average_scan_time_ms: number;
  system_health_score: number; // 0-100
  last_updated: string; // ISO string
}

// =============================================================================
// WEBHOOK AND EVENT TYPES
// =============================================================================

export interface WebhookPayload {
  event_type: string;
  timestamp: string; // ISO string
  data: any;
  signature?: string;
  webhook_id: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function ensureISOTimestamp(date: Date | string | number): string {
  if (typeof date === 'string') {
    // Validate if it's already a valid ISO string
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error('Invalid date string provided');
    }
    return parsed.toISOString();
  }
  return new Date(date).toISOString();
}

export function parseTimestamp(timestamp: string): Date {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid timestamp format');
  }
  return date;
}

export function isValidBlockchain(blockchain: string): blockchain is BlockchainType {
  const validBlockchains: BlockchainType[] = [
    'solana', 'ethereum', 'polygon', 'binance_smart_chain', 'arbitrum', 'avalanche'
  ];
  return validBlockchains.includes(blockchain as BlockchainType);
}

export function calculateRiskLevel(riskScore: number): ThreatLevel {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 30) return 'medium';
  if (riskScore >= 0) return 'low';
  return 'unknown';
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateScanResult(result: any): result is StandardScanResult {
  return (
    typeof result === 'object' &&
    typeof result.id === 'string' &&
    typeof result.token_address === 'string' &&
    isValidBlockchain(result.blockchain) &&
    typeof result.risk_score === 'number' &&
    typeof result.created_at === 'string' &&
    typeof result.scanner_version === 'string'
  );
}

export function validateApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    typeof response.timestamp === 'string'
  );
}
