-- NimRev Scanner Database Migration
-- Creates all required tables for blockchain threat detection and monitoring
-- Execute in Supabase SQL editor

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for user verification status
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'premium', 'banned');

-- Enum for supported blockchains
CREATE TYPE blockchain_type AS ENUM ('solana', 'ethereum', 'base', 'blast', 'polygon', 'avalanche', 'arbitrum', 'optimism');

-- Enum for alert types
CREATE TYPE alert_type AS ENUM ('rug_pull', 'honeypot', 'high_fees', 'mint_authority', 'social_red_flag', 'liquidity_drain', 'cross_chain_scam');

-- Enum for scan status
CREATE TYPE scan_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 1. Verified Users Table
CREATE TABLE verified_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    discord_id BIGINT UNIQUE,
    wallet_address TEXT,
    verification_status verification_status DEFAULT 'pending',
    subscription_tier TEXT DEFAULT 'free',
    api_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scan_credits INTEGER DEFAULT 100,
    premium_expires TIMESTAMP WITH TIME ZONE,
    reputation_score INTEGER DEFAULT 0
);

-- 2. Scan Results Table
CREATE TABLE scan_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token_address TEXT NOT NULL,
    blockchain blockchain_type NOT NULL,
    contract_hash TEXT,
    token_symbol TEXT,
    token_name TEXT,
    creator_address TEXT,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    threat_categories TEXT[], -- Array of detected threats
    scan_status scan_status DEFAULT 'pending',
    bytecode_analysis JSONB,
    social_analysis JSONB,
    liquidity_analysis JSONB,
    fee_analysis JSONB,
    scanner_version TEXT DEFAULT '1.0.0',
    scan_duration_ms INTEGER,
    community_votes_up INTEGER DEFAULT 0,
    community_votes_down INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    ipfs_hash TEXT, -- For immutable storage
    signature TEXT, -- Scanner signature for verification
    scanned_by UUID REFERENCES verified_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recurring Messages Table
CREATE TABLE recurring_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id TEXT NOT NULL, -- Telegram/Discord group ID
    platform TEXT NOT NULL CHECK (platform IN ('telegram', 'discord')),
    message_templates TEXT[], -- Array of message variations
    interval_minutes INTEGER DEFAULT 60,
    risk_threshold INTEGER DEFAULT 30, -- Only alert if risk score <= threshold
    is_active BOOLEAN DEFAULT true,
    last_sent TIMESTAMP WITH TIME ZONE,
    total_sent INTEGER DEFAULT 0,
    created_by UUID REFERENCES verified_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Watched Addresses Table
CREATE TABLE watched_addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    address TEXT NOT NULL,
    blockchain blockchain_type NOT NULL,
    watcher_id UUID REFERENCES verified_users(id),
    watch_type TEXT DEFAULT 'full', -- 'full', 'liquidity_only', 'transfers_only'
    alert_threshold DECIMAL(20,8), -- Alert if movement above this amount
    is_active BOOLEAN DEFAULT true,
    alert_channels TEXT[], -- ['telegram:123456', 'discord:789012']
    last_activity TIMESTAMP WITH TIME ZONE,
    total_alerts_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address, blockchain, watcher_id)
);

-- 5. Alerts Log Table
CREATE TABLE alerts_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_type alert_type NOT NULL,
    target_address TEXT NOT NULL,
    blockchain blockchain_type NOT NULL,
    risk_score INTEGER,
    alert_data JSONB, -- Flexible alert payload
    recipients TEXT[], -- Array of sent destinations
    delivery_status JSONB, -- Status per recipient
    scan_result_id UUID REFERENCES scan_results(id),
    watched_address_id UUID REFERENCES watched_addresses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- 6. Blockchain Monitoring State Table
CREATE TABLE blockchain_monitor_state (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blockchain blockchain_type UNIQUE NOT NULL,
    last_block_number BIGINT,
    last_processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rpc_endpoints TEXT[],
    is_healthy BOOLEAN DEFAULT true,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Cross-Chain Threat Correlation Table
CREATE TABLE threat_correlations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    primary_address TEXT NOT NULL,
    primary_blockchain blockchain_type NOT NULL,
    related_addresses TEXT[],
    related_blockchains blockchain_type[],
    correlation_type TEXT, -- 'same_deployer', 'similar_bytecode', 'linked_liquidity'
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    evidence JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Scanner Performance Metrics Table
CREATE TABLE scanner_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL,
    metadata JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_scan_results_token_blockchain ON scan_results(token_address, blockchain);
CREATE INDEX idx_scan_results_risk_score ON scan_results(risk_score);
CREATE INDEX idx_scan_results_created_at ON scan_results(created_at DESC);
CREATE INDEX idx_watched_addresses_active ON watched_addresses(address, blockchain) WHERE is_active = true;
CREATE INDEX idx_alerts_log_created_at ON alerts_log(created_at DESC);
CREATE INDEX idx_alerts_log_target ON alerts_log(target_address, blockchain);
CREATE INDEX idx_verified_users_telegram ON verified_users(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE INDEX idx_verified_users_discord ON verified_users(discord_id) WHERE discord_id IS NOT NULL;
CREATE INDEX idx_threat_correlations_primary ON threat_correlations(primary_address, primary_blockchain);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_verified_users_updated_at BEFORE UPDATE ON verified_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scan_results_updated_at BEFORE UPDATE ON scan_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_messages_updated_at BEFORE UPDATE ON recurring_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_watched_addresses_updated_at BEFORE UPDATE ON watched_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blockchain_monitor_updated_at BEFORE UPDATE ON blockchain_monitor_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial blockchain monitor states
INSERT INTO blockchain_monitor_state (blockchain, rpc_endpoints) VALUES
('solana', ARRAY['https://api.mainnet-beta.solana.com', 'https://rpc.ankr.com/solana']),
('ethereum', ARRAY['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth']),
('base', ARRAY['https://mainnet.base.org', 'https://rpc.ankr.com/base']),
('blast', ARRAY['https://rpc.blast.io', 'https://rpc.ankr.com/blast']),
('polygon', ARRAY['https://polygon-rpc.com', 'https://rpc.ankr.com/polygon']),
('avalanche', ARRAY['https://api.avax.network/ext/bc/C/rpc', 'https://rpc.ankr.com/avalanche']),
('arbitrum', ARRAY['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum']),
('optimism', ARRAY['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism']);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- Create view for public scan results (for transparency ledger)
CREATE VIEW public_scan_results AS
SELECT 
    id,
    token_address,
    blockchain,
    token_symbol,
    token_name,
    risk_score,
    threat_categories,
    scanner_version,
    community_votes_up,
    community_votes_down,
    ipfs_hash,
    signature,
    created_at
FROM scan_results 
WHERE is_public = true AND scan_status = 'completed'
ORDER BY created_at DESC;

-- Create view for real-time threat feed
CREATE VIEW live_threat_feed AS
SELECT 
    sr.id,
    sr.token_address,
    sr.blockchain,
    sr.token_symbol,
    sr.risk_score,
    sr.threat_categories,
    sr.created_at,
    COUNT(al.id) as alert_count
FROM scan_results sr
LEFT JOIN alerts_log al ON sr.id = al.scan_result_id
WHERE sr.scan_status = 'completed' 
    AND sr.risk_score <= 30 
    AND sr.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY sr.id
ORDER BY sr.risk_score ASC, sr.created_at DESC;

COMMENT ON TABLE verified_users IS 'Stores user verification status and subscription information';
COMMENT ON TABLE scan_results IS 'Immutable log of all token/contract security scans';
COMMENT ON TABLE recurring_messages IS 'Configuration for automated group alerts';
COMMENT ON TABLE watched_addresses IS 'User-configured address monitoring subscriptions';
COMMENT ON TABLE alerts_log IS 'Delivery log for all sent alerts and notifications';
COMMENT ON TABLE threat_correlations IS 'Cross-chain threat intelligence correlation data';
