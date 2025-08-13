# VERM Staking Contract Deployment Guide

## Prerequisites

1. **Install Anchor Framework**

```bash
# Install Anchor (latest version)
npm install -g @coral-xyz/anchor-cli

# Verify installation
anchor --version
```

2. **Install Solana CLI**

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.31/install)"

# Add to PATH
export PATH="/home/user/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

3. **Configure Solana Network**

```bash
# For mainnet deployment
solana config set --url https://api.mainnet-beta.solana.com

# For testing on devnet
solana config set --url https://api.devnet.solana.com

# Create or import deployer wallet
solana-keygen new --outfile ./deployer-keypair.json
# OR import existing wallet
solana-keygen recover 'prompt://' --outfile ./deployer-keypair.json

# Set as default keypair
solana config set --keypair ./deployer-keypair.json
```

## Deployment Steps

### Step 1: Prepare the Contract

1. **Initialize Anchor Project** (if not already done)

```bash
anchor init verm_staking --javascript
cd verm_staking
```

2. **Update Anchor.toml**

```toml
[features]
seeds = false
skip-lint = false

[programs.localnet]
verm_staking = "StakeVERM1111111111111111111111111111111111111"

[programs.devnet]
verm_staking = "StakeVERM1111111111111111111111111111111111111"

[programs.mainnet]
verm_staking = "StakeVERM1111111111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "mainnet"  # Change to "devnet" for testing
wallet = "./deployer-keypair.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Step 2: Fund Deployment Wallet

```bash
# Check balance
solana balance

# For mainnet: Fund with at least 0.5 SOL for deployment costs
# For devnet: Request airdrop
solana airdrop 2
```

### Step 3: Build and Deploy

```bash
# Build the contract
anchor build

# Deploy to current cluster
anchor deploy

# Note the Program ID from deployment output
```

### Step 4: Initialize Staking Pool

```bash
# Run deployment script
node deploy-staking.js
```

### Step 5: Verify Deployment

```bash
# Check program deployment
solana program show <PROGRAM_ID>

# Verify on Solscan
# Mainnet: https://solscan.io/account/<PROGRAM_ID>
# Devnet: https://solscan.io/account/<PROGRAM_ID>?cluster=devnet
```

## Post-Deployment Configuration

### Step 1: Update Frontend Configuration

1. **Update `client/utils/stakingContract.ts`**

```typescript
export const STAKING_CONFIG = {
  PROGRAM_ID: new PublicKey("YOUR_DEPLOYED_PROGRAM_ID"),
  STAKING_POOL: new PublicKey("YOUR_STAKING_POOL_PDA"),
  VERM_TOKEN_MINT: new PublicKey(
    "Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups",
  ),
  // ... rest of config
};
```

2. **Update Staking Page** (`client/pages/Staking.tsx`)

```typescript
import { StakingContract, STAKING_CONFIG } from "@/utils/stakingContract";

// Initialize contract in your component
const stakingContract = new StakingContract(connection);
await stakingContract.initialize(provider);
```

### Step 2: Fund Staking Pool with Rewards

```bash
# Transfer initial VERM tokens to staking pool for rewards
spl-token transfer <VERM_TOKEN_MINT> <AMOUNT> <STAKING_POOL_PDA> --fund-recipient --allow-unfunded-recipient
```

### Step 3: Test Staking Functionality

1. **Test with Small Amount First**

   - Connect wallet with VERM tokens
   - Attempt small stake (100 VERM minimum)
   - Verify staking transaction success
   - Check staking dashboard updates

2. **Test Unstaking**
   - Wait for minimum lock period (7 days)
   - Test unstaking functionality
   - Verify rewards calculation

### Step 4: Monitor and Analytics

1. **Set up monitoring**

   - Track total staked amounts
   - Monitor reward distribution
   - Watch for any contract issues

2. **Analytics Dashboard**
   - Real-time staking metrics
   - User staking statistics
   - APR tracking

## Security Considerations

1. **Audit Checklist**

   - [ ] Contract code reviewed by security experts
   - [ ] All edge cases tested
   - [ ] Emergency pause mechanism tested
   - [ ] Reward calculation accuracy verified

2. **Operational Security**
   - [ ] Multi-sig wallet for contract authority
   - [ ] Separate treasury management
   - [ ] Regular security monitoring
   - [ ] Incident response plan

## Contract Features

### Staking Parameters

- **Minimum Stake**: 100 VERM
- **Minimum Lock Period**: 7 days
- **Maximum Lock Period**: 4 years (1,460 days)
- **Base APR**: 3.69%
- **Maximum APR**: 36.9% (for 4-year lock)

### APR Calculation Formula

```
Progressive APR = Base APR + (Max APR - Base APR) × sqrt(lock_days / max_days)
```

### Reward Distribution

- Rewards calculated per block
- Compound interest system
- Proportional to stake amount and lock duration

## Emergency Procedures

### Contract Upgrade

```bash
# Build new version
anchor build

# Deploy upgrade
anchor upgrade <PROGRAM_ID> target/deploy/verm_staking.so --provider.cluster mainnet
```

### Pause Contract (if emergency pause is implemented)

```bash
# Call emergency pause function
# This should be restricted to contract authority only
```

## Support and Monitoring

### Key Metrics to Monitor

1. Total Value Locked (TVL)
2. Number of active stakers
3. Average staking duration
4. Reward distribution rate
5. Contract transaction volume

### Troubleshooting Common Issues

1. **Transaction Failures**: Check wallet balance and network status
2. **High Gas Fees**: Consider batching operations during off-peak hours
3. **Staking Disabled**: Verify contract status and authority settings

## Contract Addresses (Update After Deployment)

### Mainnet

- **Program ID**: `<TO_BE_UPDATED>`
- **Staking Pool**: `<TO_BE_UPDATED>`
- **VERM Token**: `Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups`

### Devnet (for testing)

- **Program ID**: `<TO_BE_UPDATED>`
- **Staking Pool**: `<TO_BE_UPDATED>`
- **VERM Token**: `<DEVNET_TOKEN_ADDRESS>`

---

**⚠️ IMPORTANT**: Always test thoroughly on devnet before mainnet deployment. Ensure you have sufficient SOL for deployment costs and proper backup of all keypairs.
