# NimRev Scanner - Security & Operations Runbook

## Table of Contents

1. [Overview](#overview)
2. [Deployment Procedures](#deployment-procedures)
3. [Security Configuration](#security-configuration)
4. [Monitoring & Alerting](#monitoring--alerting)
5. [Incident Response](#incident-response)
6. [Backup & Recovery](#backup--recovery)
7. [Performance Optimization](#performance-optimization)
8. [Maintenance Procedures](#maintenance-procedures)
9. [Emergency Procedures](#emergency-procedures)
10. [Compliance & Auditing](#compliance--auditing)

## Overview

NimRev Scanner is a decentralized blockchain threat intelligence system that provides real-time security analysis across multiple blockchains. This runbook covers all operational aspects of deploying, securing, and maintaining the system.

### Architecture Overview

- **Frontend**: React SPA with real-time dashboard
- **Backend**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: IPFS for immutable scan results
- **Monitoring**: Multi-chain blockchain listeners
- **Alerts**: Telegram, Discord, Webhooks, Email
- **Security**: Cryptographic signatures, audit trails

## Deployment Procedures

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- IPFS storage providers (Pinata, Infura, Web3.Storage)
- Telegram Bot Token (optional)
- Discord Bot Token (optional)

### Environment Variables

Create `.env` file with the following variables:

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Scanner Configuration
NIMREV_SIGNING_KEY=your_cryptographic_signing_key
SCANNER_VERSION=1.0.0

# Blockchain RPCs
ETHEREUM_RPC_URL=https://eth.llamarpc.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
BASE_RPC_URL=https://mainnet.base.org
BLAST_RPC_URL=https://rpc.blast.io
POLYGON_RPC_URL=https://polygon-rpc.com
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io

# IPFS Storage
PINATA_API_KEY=your_pinata_api_key
INFURA_PROJECT_ID=your_infura_project_id
WEB3_STORAGE_TOKEN=your_web3_storage_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Discord Bot (Optional)
DISCORD_BOT_TOKEN=your_discord_bot_token

# External APIs
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
HONEYPOT_API_KEY=your_honeypot_api_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_api_key

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### Initial Deployment

1. **Database Setup**

   ```bash
   # Run the SQL migration in Supabase
   psql -h your_supabase_host -U postgres -d postgres -f database/nimrev_migration.sql
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build Application**

   ```bash
   npm run build
   ```

4. **Start Services**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

### Production Deployment

#### Option 1: Netlify (Recommended)

1. Connect your repository to Netlify
2. Configure environment variables in Netlify dashboard
3. Set build command: `npm run build`
4. Set publish directory: `dist/spa`
5. Configure serverless functions for API endpoints

#### Option 2: Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
```

#### Option 3: VPS/Cloud Server

```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Deploy application
git clone https://github.com/your-repo/nimrev-scanner.git
cd nimrev-scanner
npm install
npm run build

# Start with PM2
pm2 start dist/server/node-build.mjs --name nimrev-scanner
pm2 startup
pm2 save
```

## Security Configuration

### API Security

1. **Rate Limiting**

   ```typescript
   // Already implemented in server
   app.use(
     rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 100, // limit each IP to 100 requests per windowMs
     }),
   );
   ```

2. **CORS Configuration**

   ```typescript
   app.use(
     cors({
       origin: process.env.ALLOWED_ORIGINS?.split(",") || [
         "http://localhost:3000",
       ],
       credentials: true,
     }),
   );
   ```

3. **Input Validation**
   - All API inputs are validated using Zod schemas
   - Address validation for blockchain addresses
   - SQL injection prevention through parameterized queries

### Database Security

1. **Row Level Security (RLS)**

   ```sql
   -- Enable RLS on sensitive tables
   ALTER TABLE verified_users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE watched_addresses ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can only see their own data" ON verified_users
     FOR ALL USING (auth.uid() = id);
   ```

2. **Encryption at Rest**

   - Supabase automatically encrypts data at rest
   - Additional encryption for sensitive fields using `ENCRYPTION_KEY`

3. **Database Monitoring**
   ```sql
   -- Monitor failed login attempts
   CREATE TABLE security_events (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     event_type TEXT NOT NULL,
     user_id UUID,
     ip_address INET,
     details JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### Cryptographic Security

1. **Scan Result Signatures**

   - Each scan result is cryptographically signed
   - Public key verification available
   - Immutable storage in IPFS

2. **Key Management**

   ```bash
   # Generate secure signing key
   openssl rand -hex 32

   # Rotate keys quarterly
   # Update NIMREV_SIGNING_KEY in environment
   # Update public key in transparency system
   ```

### Access Control

1. **API Key Management**

   ```typescript
   // Generate API keys for verified users
   const apiKey = "nr_" + crypto.randomBytes(16).toString("hex");
   ```

2. **Role-Based Access**
   - Free tier: 100 scans/day
   - Premium tier: Unlimited scans
   - Admin tier: Full system access

## Monitoring & Alerting

### System Monitoring

1. **Health Checks**

   ```typescript
   // Endpoint: GET /api/health
   {
     "status": "healthy",
     "timestamp": "2024-01-01T00:00:00Z",
     "services": {
       "database": "healthy",
       "ipfs": "healthy",
       "blockchain_rpcs": "healthy",
       "telegram_bot": "healthy"
     },
     "metrics": {
       "scans_24h": 1234,
       "threats_detected": 89,
       "avg_scan_time_ms": 1250
     }
   }
   ```

2. **Performance Metrics**

   - Scan completion time
   - API response time
   - Database query performance
   - IPFS storage latency
   - Blockchain RPC response time

3. **Error Tracking**

   ```typescript
   // Sentry integration for error tracking
   import * as Sentry from "@sentry/node";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

### Alert Thresholds

1. **Critical Alerts**

   - Scanner offline > 5 minutes
   - Database connection lost
   - IPFS storage failure
   - Memory usage > 90%
   - Error rate > 5%

2. **Warning Alerts**

   - Scan queue > 100 items
   - API response time > 5 seconds
   - RPC endpoint failure
   - Memory usage > 80%

3. **Info Alerts**
   - High threat detection rate
   - New blockchain added
   - Significant traffic increase

### Monitoring Dashboard

```bash
# Grafana dashboard queries
# Scanner performance
sum(rate(nimrev_scans_total[5m]))

# Error rate
sum(rate(nimrev_errors_total[5m])) / sum(rate(nimrev_requests_total[5m]))

# Response time
histogram_quantile(0.95, sum(rate(nimrev_request_duration_seconds_bucket[5m])) by (le))
```

## Incident Response

### Incident Classification

1. **P0 - Critical**

   - Complete service outage
   - Data breach or security incident
   - Mass false positives affecting users

2. **P1 - High**

   - Major feature outage
   - Performance degradation affecting all users
   - Single blockchain scanner failure

3. **P2 - Medium**

   - Minor feature issues
   - Performance issues affecting some users
   - Non-critical component failure

4. **P3 - Low**
   - Cosmetic issues
   - Documentation updates
   - Feature requests

### Response Procedures

#### P0 - Critical Incident Response

1. **Immediate Actions (0-15 minutes)**

   - Page on-call engineer
   - Create incident channel (#incident-YYYYMMDD-HHMMSS)
   - Post status page update
   - Begin investigation

2. **Investigation (15-60 minutes)**

   - Identify root cause
   - Implement temporary fix if possible
   - Communicate with stakeholders
   - Document timeline

3. **Resolution (1-4 hours)**

   - Deploy permanent fix
   - Verify system stability
   - Update status page
   - Begin post-mortem

4. **Post-Incident (24-48 hours)**
   - Complete post-mortem report
   - Implement preventive measures
   - Update runbooks
   - Team retrospective

#### Security Incident Response

1. **Detection**

   ```bash
   # Check for suspicious activity
   SELECT * FROM security_events
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

2. **Containment**

   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs
   - Enable enhanced monitoring

3. **Investigation**

   - Preserve evidence
   - Analyze attack vectors
   - Assess impact scope
   - Document findings

4. **Recovery**

   - Apply security patches
   - Restore from clean backups
   - Reset all credentials
   - Implement additional controls

5. **Communication**
   - Internal notification
   - User communication (if needed)
   - Regulatory reporting (if required)
   - Media response (if necessary)

## Backup & Recovery

### Database Backups

1. **Automated Backups**

   ```bash
   # Daily database backup
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump -h $SUPABASE_HOST -U postgres -d postgres > nimrev_backup_$DATE.sql

   # Upload to secure storage
   aws s3 cp nimrev_backup_$DATE.sql s3://nimrev-backups/database/

   # Keep 30 days of backups
   find /backups -name "nimrev_backup_*.sql" -mtime +30 -delete
   ```

2. **Point-in-Time Recovery**
   - Supabase provides automatic PITR
   - Manual snapshots before major updates
   - Recovery testing monthly

### IPFS Data Backup

1. **Multi-Node Redundancy**

   - Primary: Pinata Cloud
   - Secondary: Infura IPFS
   - Tertiary: Web3.Storage
   - Backup: Local IPFS node

2. **Verification Script**
   ```bash
   #!/bin/bash
   # Verify IPFS data integrity
   for hash in $(cat ipfs_hashes.txt); do
     ipfs cat $hash > /dev/null
     if [ $? -eq 0 ]; then
       echo "✓ $hash"
     else
       echo "✗ $hash - MISSING"
     fi
   done
   ```

### Configuration Backup

1. **Environment Variables**

   - Encrypted backup in secure vault
   - Version control for environment templates
   - Regular key rotation schedule

2. **Application State**
   - Database schema versions
   - Feature flags configuration
   - Alert rule definitions

## Performance Optimization

### Database Optimization

1. **Index Management**

   ```sql
   -- Monitor index usage
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename = 'scan_results';

   -- Add indexes for common queries
   CREATE INDEX CONCURRENTLY idx_scan_results_created_risk
   ON scan_results(created_at DESC, risk_score);
   ```

2. **Query Optimization**
   - Use EXPLAIN ANALYZE for slow queries
   - Implement query result caching
   - Database connection pooling

### Application Performance

1. **Caching Strategy**

   ```typescript
   // Redis caching for frequent queries
   const redis = new Redis(process.env.REDIS_URL);

   async function getCachedScanResult(address: string) {
     const cached = await redis.get(`scan:${address}`);
     if (cached) return JSON.parse(cached);

     const result = await performScan(address);
     await redis.setex(`scan:${address}`, 300, JSON.stringify(result));
     return result;
   }
   ```

2. **Resource Management**
   - Implement scan queue rate limiting
   - Graceful handling of RPC failures
   - Memory usage monitoring

### Scaling Considerations

1. **Horizontal Scaling**

   - Stateless application design
   - Load balancer configuration
   - Database read replicas

2. **Vertical Scaling**
   - Memory optimization
   - CPU usage profiling
   - Disk I/O optimization

## Maintenance Procedures

### Regular Maintenance

1. **Weekly Tasks**

   - Review system performance metrics
   - Check IPFS node health
   - Update threat intelligence database
   - Security patch assessment

2. **Monthly Tasks**

   - Database maintenance (VACUUM, ANALYZE)
   - Log file rotation and archival
   - Backup verification testing
   - Security audit review

3. **Quarterly Tasks**
   - Cryptographic key rotation
   - Dependency updates
   - Performance optimization review
   - Incident response drill

### Update Procedures

1. **Code Deployment**

   ```bash
   # Zero-downtime deployment
   git pull origin main
   npm ci
   npm run build

   # Blue-green deployment
   pm2 start dist/server/node-build.mjs --name nimrev-scanner-new

   # Health check
   curl -f http://localhost:8080/api/health

   # Switch traffic
   pm2 stop nimrev-scanner
   pm2 delete nimrev-scanner
   pm2 restart nimrev-scanner-new --name nimrev-scanner
   ```

2. **Database Migrations**

   ```bash
   # Backup before migration
   pg_dump -h $SUPABASE_HOST -U postgres -d postgres > pre_migration_backup.sql

   # Run migration
   psql -h $SUPABASE_HOST -U postgres -d postgres -f migrations/001_new_feature.sql

   # Verify migration
   npm run test:integration
   ```

## Emergency Procedures

### System Outage

1. **Immediate Response**

   ```bash
   # Check system status
   curl -f http://localhost:8080/api/health

   # Check process status
   pm2 status

   # Check logs
   pm2 logs nimrev-scanner --lines 50

   # Restart if needed
   pm2 restart nimrev-scanner
   ```

2. **Rollback Procedure**
   ```bash
   # Rollback to previous version
   git checkout previous-stable-tag
   npm ci
   npm run build
   pm2 restart nimrev-scanner
   ```

### Data Corruption

1. **Detection**

   ```sql
   -- Check for data inconsistencies
   SELECT COUNT(*) FROM scan_results WHERE risk_score < 0 OR risk_score > 100;
   SELECT COUNT(*) FROM scan_results WHERE created_at > NOW();
   ```

2. **Recovery**
   - Stop write operations
   - Restore from latest clean backup
   - Replay transactions from logs
   - Verify data integrity

### Security Breach

1. **Immediate Actions**

   - Isolate affected systems
   - Change all passwords and API keys
   - Enable audit logging
   - Notify security team

2. **Evidence Preservation**
   ```bash
   # Preserve system state
   ps aux > /tmp/process_list.txt
   netstat -tulpn > /tmp/network_connections.txt
   cp /var/log/* /tmp/incident_logs/
   ```

## Compliance & Auditing

### Audit Trail

1. **Database Auditing**

   ```sql
   -- Create audit log table
   CREATE TABLE audit_log (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     table_name TEXT NOT NULL,
     operation TEXT NOT NULL,
     old_data JSONB,
     new_data JSONB,
     user_id UUID,
     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **API Auditing**
   ```typescript
   // Log all API requests
   app.use((req, res, next) => {
     console.log({
       timestamp: new Date().toISOString(),
       method: req.method,
       url: req.url,
       ip: req.ip,
       userAgent: req.get("User-Agent"),
     });
     next();
   });
   ```

### Privacy Compliance

1. **Data Minimization**

   - Only collect necessary data
   - Automatic data purging after retention period
   - User consent for data processing

2. **Data Protection**
   - Encryption in transit and at rest
   - Access controls and logging
   - Regular security assessments

### Transparency

1. **Public Audit**

   - Open source transparency tools
   - Public scan result verification
   - Community oversight

2. **Regular Reports**
   - Monthly security report
   - Quarterly transparency report
   - Annual compliance audit

---

## Emergency Contacts

**On-Call Engineer**: +1-XXX-XXX-XXXX
**Security Team**: security@nimrev.com
**Infrastructure Team**: ops@nimrev.com
**Management**: management@nimrev.com

## External Resources

- [Supabase Status](https://status.supabase.com/)
- [IPFS Status](https://status.ipfs.io/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Blockchain RPC Status](https://chainlist.org/)

---

_Last Updated: December 2024_
_Version: 1.0.0_
_Next Review Date: March 2025_
