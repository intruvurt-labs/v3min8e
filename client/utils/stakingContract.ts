// STAKING CONTRACT - TEMPORARILY DISABLED
// This file is disabled due to missing Solana dependencies
// Enable by installing: npm install @solana/web3.js @coral-xyz/anchor

// Mock exports to prevent import errors
export const STAKING_CONFIG = {
  POOL_SEED: "staking_pool",
  USER_SEED: "user_staking",
  MINIMUM_STAKE: 1000,
  MAXIMUM_STAKE: 1000000,
  LOCK_PERIODS: {
    FLEXIBLE: 0,
    DAYS_30: 30,
    DAYS_90: 90,
    DAYS_180: 180,
    DAYS_365: 365,
  },
  APR_RATES: {
    FLEXIBLE: 3.69,
    DAYS_30: 9.8,
    DAYS_90: 15.3,
    DAYS_180: 24.6,
    DAYS_365: 36.9,
  },
};

export class StakingContract {
  constructor(_connection: any) {
    console.warn(
      "StakingContract is temporarily disabled - missing Solana dependencies",
    );
  }

  async initialize(_provider: any) {
    throw new Error("Staking contract disabled - install Solana dependencies");
  }

  async stake(_amount: number, _lockPeriod: number) {
    throw new Error("Staking contract disabled - install Solana dependencies");
  }

  async unstake(_stakeAccount: any) {
    throw new Error("Staking contract disabled - install Solana dependencies");
  }

  async claimRewards(_stakeAccount: any) {
    throw new Error("Staking contract disabled - install Solana dependencies");
  }

  async getUserStakes(_wallet: any) {
    return [];
  }

  async getPoolInfo() {
    return {
      totalStaked: 0,
      totalUsers: 0,
      averageAPR: 12.5,
    };
  }
}
