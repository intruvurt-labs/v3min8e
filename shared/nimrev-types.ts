export type VerificationStatus = "pending" | "verified" | "premium" | "banned";

export type BlockchainType =
  | "solana"
  | "ethereum"
  | "base"
  | "blast"
  | "polygon"
  | "avalanche"
  | "arbitrum"
  | "optimism";

export type AlertType =
  | "rug_pull"
  | "honeypot"
  | "high_fees"
  | "mint_authority"
  | "social_red_flag"
  | "liquidity_drain"
  | "cross_chain_scam";

export type ScanStatus = "pending" | "processing" | "completed" | "failed";

export interface VerifiedUser {
  id: string;
  telegram_id?: number;
  discord_id?: number;
  wallet_address?: string;
  verification_status: VerificationStatus;
  subscription_tier: string;
  api_key?: string;
  created_at: string;
  updated_at: string;
  last_active: string;
  scan_credits: number;
  premium_expires?: string;
  reputation_score: number;
}

export interface ScanResult {
  id: string;
  token_address: string;
  blockchain: BlockchainType;
  contract_hash?: string;
  token_symbol?: string;
  token_name?: string;
  creator_address?: string;
  risk_score: number;
  threat_categories: string[];
  scan_status: ScanStatus;
  bytecode_analysis?: BytecodeAnalysis;
  social_analysis?: SocialAnalysis;
  liquidity_analysis?: LiquidityAnalysis;
  fee_analysis?: FeeAnalysis;
  scanner_version: string;
  scan_duration_ms?: number;
  community_votes_up: number;
  community_votes_down: number;
  is_public: boolean;
  ipfs_hash?: string;
  signature?: string;
  scanned_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BytecodeAnalysis {
  contract_size: number;
  function_count: number;
  has_mint_function: boolean;
  has_burn_function: boolean;
  has_pause_function: boolean;
  has_ownership_transfer: boolean;
  external_calls: string[];
  similarity_matches: Array<{
    contract_address: string;
    similarity_score: number;
    blockchain: BlockchainType;
  }>;
  hidden_functions: string[];
  proxy_pattern: boolean;
  upgrade_pattern: boolean;
  time_locks: number[];
  access_controls: string[];
}

export interface SocialAnalysis {
  twitter_handle?: string;
  twitter_created: string;
  twitter_followers: number;
  twitter_verified: boolean;
  telegram_group?: string;
  telegram_members: number;
  github_repo?: string;
  github_commits: number;
  github_contributors: number;
  website_domain?: string;
  domain_age_days: number;
  social_red_flags: string[];
  community_sentiment: "positive" | "neutral" | "negative";
  influencer_mentions: number;
}

export interface LiquidityAnalysis {
  total_liquidity_usd: number;
  liquidity_locked: boolean;
  lock_duration_days?: number;
  lock_percentage: number;
  major_holders: Array<{
    address: string;
    percentage: number;
    is_known_exchange: boolean;
  }>;
  recent_large_transactions: Array<{
    hash: string;
    amount_usd: number;
    type: "buy" | "sell";
    timestamp: string;
  }>;
  liquidity_stability_score: number;
  rug_pull_indicators: string[];
}

export interface FeeAnalysis {
  buy_fee_percentage: number;
  sell_fee_percentage: number;
  transfer_fee_percentage: number;
  max_fee_percentage: number;
  fee_exemptions: string[];
  hidden_fees: boolean;
  honeypot_detected: boolean;
  anti_bot_mechanisms: string[];
  sandwich_protection: boolean;
  cooldown_periods: number[];
}

export interface WatchedAddress {
  id: string;
  address: string;
  blockchain: BlockchainType;
  watcher_id: string;
  watch_type: "full" | "liquidity_only" | "transfers_only";
  alert_threshold?: number;
  is_active: boolean;
  alert_channels: string[];
  last_activity?: string;
  total_alerts_sent: number;
  created_at: string;
  updated_at: string;
}

export interface AlertLog {
  id: string;
  alert_type: AlertType;
  target_address: string;
  blockchain: BlockchainType;
  risk_score?: number;
  alert_data: Record<string, any>;
  recipients: string[];
  delivery_status: Record<string, any>;
  scan_result_id?: string;
  watched_address_id?: string;
  created_at: string;
  delivered_at?: string;
}

export interface RecurringMessage {
  id: string;
  group_id: string;
  platform: "telegram" | "discord";
  message_templates: string[];
  interval_minutes: number;
  risk_threshold: number;
  is_active: boolean;
  last_sent?: string;
  total_sent: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ThreatCorrelation {
  id: string;
  primary_address: string;
  primary_blockchain: BlockchainType;
  related_addresses: string[];
  related_blockchains: BlockchainType[];
  correlation_type: "same_deployer" | "similar_bytecode" | "linked_liquidity";
  confidence_score: number;
  evidence: Record<string, any>;
  created_at: string;
}

export interface BlockchainMonitorState {
  id: string;
  blockchain: BlockchainType;
  last_block_number?: number;
  last_processed_at: string;
  rpc_endpoints: string[];
  is_healthy: boolean;
  error_count: number;
  last_error?: string;
  updated_at: string;
}

export interface ScanRequest {
  token_address: string;
  blockchain: BlockchainType;
  priority?: "low" | "normal" | "high";
  requested_by?: string;
  deep_scan?: boolean;
}

export interface ScannerConfig {
  enabled_blockchains: BlockchainType[];
  scan_interval_ms: number;
  max_concurrent_scans: number;
  risk_thresholds: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  alert_cooldown_minutes: number;
  social_scan_enabled: boolean;
  bytecode_analysis_enabled: boolean;
  cross_chain_correlation_enabled: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface LiveThreatFeed {
  id: string;
  token_address: string;
  blockchain: BlockchainType;
  token_symbol?: string;
  risk_score: number;
  threat_categories: string[];
  created_at: string;
  alert_count: number;
}

export interface PublicScanResult {
  id: string;
  token_address: string;
  blockchain: BlockchainType;
  token_symbol?: string;
  token_name?: string;
  risk_score: number;
  threat_categories: string[];
  scanner_version: string;
  community_votes_up: number;
  community_votes_down: number;
  ipfs_hash?: string;
  signature?: string;
  created_at: string;
}

export interface ScannerMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metadata: Record<string, any>;
  recorded_at: string;
}
