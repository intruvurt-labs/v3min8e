# NimRev Protocol Deployment Guide

## VERM Staking Smart Contract Deployment

### Prerequisites

1. **Solana CLI Tools**

   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
   ```

2. **Anchor Framework**

   ```bash
   npm install -g @coral-xyz/anchor-cli
   ```

3. **Wallet Setup**
   ```bash
   solana-keygen new --outfile ~/.config/solana/id.json
   solana config set --keypair ~/.config/solana/id.json
   ```

### Contract Deployment

#### Development Network

```bash
# Set to devnet
solana config set --url devnet

# Airdrop SOL for gas fees
solana airdrop 2

# Build the contract
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
anchor verify EdabwrorVWrqix5zhY9FpEBuBR1bqLRtcMvnGrnJ8ePp
```

#### Mainnet Deployment

```bash
# CAUTION: Mainnet deployment requires real SOL
solana config set --url mainnet

# Ensure sufficient SOL balance
solana balance

# Deploy to mainnet (requires ~2-5 SOL for deployment)
anchor deploy --provider.cluster mainnet

# Update contract address in environment
echo "VERM_STAKING_PROGRAM_ID=EdabwrorVWrqix5zhY9FpEBuBR1bqLRtcMvnGrnJ8ePp" >> .env.local
```

## Multi-Chain Wrapped VERM Deployment

### Base Network (Layer 2)

```solidity
// ERC-20 Wrapped VERM Contract
contract WrappedVERM {
    string public name = "Wrapped VERM";
    string public symbol = "wVERM";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // 1:1 bridge with Solana VERM
    mapping(address => uint256) public balanceOf;

    // Bridge functions
    function bridgeFromSolana(bytes32 solanaAddress, uint256 amount) external;
    function bridgeToSolana(bytes32 solanaAddress, uint256 amount) external;
}
```

### BNB Smart Chain

```bash
# Deploy using Hardhat/Truffle
npx hardhat deploy --network bsc --contract WrappedVERM

# Contract address: 0x2345678901234567890123456789012345678901
```

### XRP Ledger

```javascript
// Issue VERM token on XRPL
const token = {
  currency: "VERM",
  issuer: "rVermToken1234567890123456789012345678",
  value: "1000000000", // Total supply
};
```

### Blast Network

```bash
# Deploy using Blast-specific tools
blast-cli deploy --contract WrappedVERM --network mainnet

# Contract address: 0x3456789012345678901234567890123456789012
```

## Environment Configuration

### Production Environment Variables

```bash
# Solana Configuration
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
SOLANA_NETWORK=mainnet-beta
VERM_TOKEN_MINT=EdabwrorVWrqix5zhY9FpEBuBR1bqLRtcMvnGrnJ8ePp
VERM_STAKING_PROGRAM=EdabwrorVWrqix5zhY9FpEBuBR1bqLRtcMvnGrnJ8ePp

# Multi-Chain Contract Addresses
VERM_BASE_CONTRACT=0x1234567890123456789012345678901234567890
VERM_BNB_CONTRACT=0x2345678901234567890123456789012345678901
VERM_XRP_ISSUER=rVermToken1234567890123456789012345678
VERM_BLAST_CONTRACT=0x3456789012345678901234567890123456789012

# Price Feed APIs
COINGECKO_API_KEY=YOUR_COINGECKO_API_KEY
DEXSCREENER_API_URL=https://api.dexscreener.com/latest/dex

# Security
VERM_MINIMUM_USD=25
RATE_LIMIT_DEMO=3
RATE_LIMIT_VERM=100
RATE_LIMIT_PREMIUM=500

# Database (Production)
DATABASE_URL=postgresql://user:pass@host:5432/nimrev_prod
REDIS_URL=redis://localhost:6379
```

## Security Considerations

### Smart Contract Security

- ✅ **Reentrancy Protection**: All external calls protected
- ✅ **Integer Overflow**: Using SafeMath equivalents
- ✅ **Access Control**: Authority-based permissions
- ✅ **Pause Mechanism**: Emergency stop functionality
- ✅ **Upgrade Path**: Proxy pattern for contract updates

### Bridge Security

- 🔐 **Multi-Sig Wallets**: 3/5 multisig for bridge operations
- 🔐 **Time Delays**: 24-hour delay for large transfers
- 🔐 **Rate Limiting**: Maximum daily bridge amounts
- 🔐 **Oracle Verification**: Price feed validation

### API Security

- 🛡️ **Rate Limiting**: Per-wallet and IP-based limits
- 🛡️ **Input Validation**: All inputs sanitized and validated
- 🛡️ **CORS Protection**: Restricted to nimrev.xyz domain
- 🛡️ **DDoS Protection**: Cloudflare integration

## Monitoring & Analytics

### Contract Events

```typescript
// Monitor staking events
const stakeEventFilter = program.addEventListener("StakeEvent", (event) => {
  console.log("Stake:", event.user, event.amount, event.apr);
});

// Monitor unstaking events
const unstakeEventFilter = program.addEventListener("UnstakeEvent", (event) => {
  console.log("Unstake:", event.user, event.amount);
});
```

### Health Checks

```bash
# Check contract status
curl https://nimrev.xyz/api/health/contract

# Check bridge status
curl https://nimrev.xyz/api/health/bridge

# Check price feeds
curl https://nimrev.xyz/api/health/prices
```

## Backup & Recovery

### Wallet Backup

```bash
# Backup deployment wallet
cp ~/.config/solana/id.json ~/secure-backup/solana-deployer-$(date +%Y%m%d).json

# Backup multisig keys
cp ~/multisig-keys/* ~/secure-backup/multisig-$(date +%Y%m%d)/
```

### Database Backup

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > nimrev-backup-$(date +%Y%m%d).sql

# Redis backup
redis-cli --rdb nimrev-redis-$(date +%Y%m%d).rdb
```

## Post-Deployment Checklist

- [ ] Contract deployed and verified on Solscan
- [ ] Multi-chain bridges operational
- [ ] Price feeds updating correctly
- [ ] Rate limiting functional
- [ ] Wallet verification working
- [ ] Demo mode operational
- [ ] Analytics tracking active
- [ ] Security monitoring enabled
- [ ] Backup systems tested
- [ ] Documentation updated

## Support & Maintenance

### Emergency Contacts

- **Technical Lead**: tech@nimrev.xyz
- **Security Team**: security@nimrev.xyz
- **Operations**: ops@nimrev.xyz

### Maintenance Windows

- **Weekly**: Sundays 02:00-04:00 UTC
- **Emergency**: Immediate response team available 24/7

### Upgrade Process

1. **Testing**: Deploy to devnet/testnet first
2. **Security Review**: Full audit for major changes
3. **Community Notice**: 7-day advance notice
4. **Staged Rollout**: Gradual deployment across networks
5. **Monitoring**: Enhanced monitoring during upgrades
