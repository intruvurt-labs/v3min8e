-- NIMREV Security Platform Database Schema
-- Production-ready schema for comprehensive security scanning platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (enhanced for security platform)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    tier VARCHAR(20) DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'enterprise', 'elite')),
    api_key VARCHAR(255) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Security-specific fields
    scan_quota_daily INTEGER DEFAULT 10,
    scan_quota_monthly INTEGER DEFAULT 100,
    wallet_addresses JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    security_settings JSONB DEFAULT '{}'::jsonb
);

-- Security scans table (main scanning records)
CREATE TABLE IF NOT EXISTS security_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Scan configuration
    address VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL,
    scan_type VARCHAR(20) DEFAULT 'comprehensive' CHECK (scan_type IN ('basic', 'comprehensive', 'elite')),
    
    -- Scan status and results
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_phase VARCHAR(50),
    
    -- Results summary
    score INTEGER CHECK (score >= 0 AND score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
    findings_count INTEGER DEFAULT 0,
    critical_findings_count INTEGER DEFAULT 0,
    
    -- Detailed results (JSONB for flexibility)
    findings JSONB DEFAULT '[]'::jsonb,
    report JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance metrics
    processing_time_ms INTEGER,
    
    -- Indexes for performance
    INDEX idx_security_scans_user_id (user_id),
    INDEX idx_security_scans_status (status),
    INDEX idx_security_scans_network (network),
    INDEX idx_security_scans_risk_level (risk_level),
    INDEX idx_security_scans_created_at (created_at DESC),
    INDEX idx_security_scans_address (address),
    INDEX idx_security_scans_score (score)
);

-- Security findings table (normalized findings data)
CREATE TABLE IF NOT EXISTS security_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES security_scans(id) ON DELETE CASCADE,
    finding_id VARCHAR(255) NOT NULL,
    
    -- Finding classification
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    
    -- Finding details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb,
    mitigation TEXT,
    
    -- Security references
    cve_id VARCHAR(50),
    cwe_id VARCHAR(50),
    owasp_category VARCHAR(100),
    
    -- Additional metadata
    source_tool VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_security_findings_scan_id (scan_id),
    INDEX idx_security_findings_severity (severity),
    INDEX idx_security_findings_type (type),
    INDEX idx_security_findings_confidence (confidence)
);

-- User scan quotas and usage tracking
CREATE TABLE IF NOT EXISTS user_scan_quotas (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Current usage
    daily_scans_used INTEGER DEFAULT 0,
    monthly_scans_used INTEGER DEFAULT 0,
    total_scans_used INTEGER DEFAULT 0,
    
    -- Quota limits
    daily_scan_limit INTEGER DEFAULT 10,
    monthly_scan_limit INTEGER DEFAULT 100,
    
    -- Reset tracking
    last_daily_reset DATE DEFAULT CURRENT_DATE,
    last_monthly_reset DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    
    -- Overage handling
    overage_allowed BOOLEAN DEFAULT FALSE,
    overage_count INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_usage CHECK (
        daily_scans_used >= 0 AND 
        monthly_scans_used >= 0 AND 
        total_scans_used >= 0 AND
        daily_scan_limit >= 0 AND
        monthly_scan_limit >= 0
    )
);

-- Threat intelligence database
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Threat identification
    threat_id VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL,
    
    -- Threat classification
    threat_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Threat details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    indicators JSONB DEFAULT '[]'::jsonb,
    attribution JSONB DEFAULT '{}'::jsonb,
    
    -- Intelligence sources
    source VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    false_positive BOOLEAN DEFAULT FALSE,
    
    -- Lifecycle
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'mitigated')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_threat_intelligence_address (address),
    INDEX idx_threat_intelligence_network (network),
    INDEX idx_threat_intelligence_severity (severity),
    INDEX idx_threat_intelligence_type (threat_type),
    INDEX idx_threat_intelligence_status (status),
    INDEX idx_threat_intelligence_verified (verified)
);

-- Scan progress tracking for real-time updates
CREATE TABLE IF NOT EXISTS scan_progress (
    scan_id UUID PRIMARY KEY REFERENCES security_scans(id) ON DELETE CASCADE,
    
    -- Current state
    current_phase VARCHAR(50) NOT NULL,
    phase_progress INTEGER DEFAULT 0 CHECK (phase_progress >= 0 AND phase_progress <= 100),
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    
    -- Phase details
    current_task VARCHAR(255),
    estimated_completion TIMESTAMP WITH TIME ZONE,
    phase_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Real-time findings
    live_findings JSONB DEFAULT '[]'::jsonb,
    phase_metrics JSONB DEFAULT '{}'::jsonb,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications and alerts
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Related entities
    scan_id UUID REFERENCES security_scans(id) ON DELETE CASCADE,
    threat_id UUID REFERENCES threat_intelligence(id) ON DELETE SET NULL,
    
    -- Delivery tracking
    delivered BOOLEAN DEFAULT FALSE,
    read BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    
    -- Channels
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_priority (priority),
    INDEX idx_notifications_read (read),
    INDEX idx_notifications_created_at (created_at DESC)
);

-- API usage tracking for rate limiting and analytics
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Request details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Response details
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    bytes_sent INTEGER DEFAULT 0,
    bytes_received INTEGER DEFAULT 0,
    
    -- Rate limiting
    rate_limit_key VARCHAR(255),
    rate_limit_remaining INTEGER,
    
    -- Authentication
    api_key_used VARCHAR(255),
    authenticated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_api_usage_user_id (user_id),
    INDEX idx_api_usage_endpoint (endpoint),
    INDEX idx_api_usage_created_at (created_at DESC),
    INDEX idx_api_usage_rate_limit_key (rate_limit_key),
    INDEX idx_api_usage_ip_address (ip_address)
);

-- Security audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(50) DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'admin', 'api')),
    actor_identifier VARCHAR(255),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    
    -- Context and changes
    details JSONB DEFAULT '{}'::jsonb,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Risk assessment
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    automated_action BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_audit_log_user_id (user_id),
    INDEX idx_audit_log_action (action),
    INDEX idx_audit_log_entity_type (entity_type),
    INDEX idx_audit_log_risk_level (risk_level),
    INDEX idx_audit_log_created_at (created_at DESC)
);

-- Contract metadata cache
CREATE TABLE IF NOT EXISTS contract_metadata (
    address VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL,
    
    -- Contract details
    name VARCHAR(255),
    symbol VARCHAR(50),
    decimals INTEGER,
    total_supply NUMERIC,
    contract_type VARCHAR(50),
    
    -- Verification status
    verified BOOLEAN DEFAULT FALSE,
    source_code_available BOOLEAN DEFAULT FALSE,
    proxy_contract BOOLEAN DEFAULT FALSE,
    
    -- Social and economic data
    market_cap NUMERIC,
    trading_volume_24h NUMERIC,
    holder_count INTEGER,
    liquidity_usd NUMERIC,
    
    -- Reputation scores
    trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),
    community_score INTEGER CHECK (community_score >= 0 AND community_score <= 100),
    developer_score INTEGER CHECK (developer_score >= 0 AND developer_score <= 100),
    
    -- Cache metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_sources JSONB DEFAULT '[]'::jsonb,
    cache_expires_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (address, network),
    INDEX idx_contract_metadata_trust_score (trust_score),
    INDEX idx_contract_metadata_verified (verified),
    INDEX idx_contract_metadata_last_updated (last_updated)
);

-- Performance optimization: Partitioning for large tables
-- Partition security_scans by created_at (monthly partitions)
-- Note: This would be implemented in production with proper partition management

-- Views for common queries
CREATE OR REPLACE VIEW user_scan_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.tier,
    COUNT(ss.id) as total_scans,
    COUNT(CASE WHEN ss.status = 'completed' THEN 1 END) as completed_scans,
    COUNT(CASE WHEN ss.risk_level = 'critical' THEN 1 END) as critical_threats_found,
    AVG(ss.score) as average_security_score,
    MAX(ss.created_at) as last_scan_date
FROM users u
LEFT JOIN security_scans ss ON u.id = ss.user_id
GROUP BY u.id, u.email, u.tier;

CREATE OR REPLACE VIEW threat_summary AS
SELECT 
    network,
    threat_type,
    severity,
    COUNT(*) as threat_count,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_threats,
    AVG(confidence_score) as avg_confidence
FROM threat_intelligence
WHERE status = 'active'
GROUP BY network, threat_type, severity
ORDER BY threat_count DESC;

-- Triggers for maintaining data integrity and audit trails
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_scans_updated_at BEFORE UPDATE ON security_scans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_intelligence_updated_at BEFORE UPDATE ON threat_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update scan quotas
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
    UPDATE user_scan_quotas 
    SET daily_scans_used = 0, 
        last_daily_reset = CURRENT_DATE
    WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
    UPDATE user_scan_quotas 
    SET monthly_scans_used = 0, 
        last_monthly_reset = DATE_TRUNC('month', CURRENT_DATE)
    WHERE last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Indexes for full-text search on findings
CREATE INDEX IF NOT EXISTS idx_security_findings_description_fts 
ON security_findings USING gin(to_tsvector('english', description));

CREATE INDEX IF NOT EXISTS idx_threat_intelligence_description_fts 
ON threat_intelligence USING gin(to_tsvector('english', description));

-- Grant appropriate permissions (adjust for your specific user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nimrev_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nimrev_app;

-- Insert default data for testing
INSERT INTO users (email, password_hash, username, tier, scan_quota_daily, scan_quota_monthly) 
VALUES 
('admin@nimrev.io', crypt('admin123', gen_salt('bf')), 'admin', 'elite', 1000, 10000),
('test@nimrev.io', crypt('test123', gen_salt('bf')), 'testuser', 'premium', 50, 500)
ON CONFLICT (email) DO NOTHING;

-- Initialize scan quotas for existing users
INSERT INTO user_scan_quotas (user_id, daily_scan_limit, monthly_scan_limit)
SELECT id, scan_quota_daily, scan_quota_monthly 
FROM users 
ON CONFLICT (user_id) DO NOTHING;

-- Performance analysis queries for monitoring
COMMENT ON TABLE security_scans IS 'Primary table for storing security scan results and metadata';
COMMENT ON TABLE threat_intelligence IS 'Centralized threat intelligence database for known malicious addresses';
COMMENT ON TABLE user_scan_quotas IS 'User quota management and usage tracking';
COMMENT ON TABLE audit_log IS 'Security audit trail for all system actions';
