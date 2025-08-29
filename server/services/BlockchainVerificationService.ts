import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';

interface SolanaConfig {
  rpcUrl: string;
  vermTokenMint: string;
  stakingProgramId: string;
}

interface TokenAccountInfo {
  mint: string;
  owner: string;
  amount: number;
  decimals: number;
}

interface StakingVerificationResult {
  isStaking: boolean;
  stakeAmount: number;
  stakingAccount?: string;
  timestamp?: number;
  error?: string;
}

interface TradeVerificationResult {
  hasTraded: boolean;
  recentTrades: number;
  totalVolume: number;
  lastTradeTime?: number;
  error?: string;
}

interface WalletVerificationResult {
  isValid: boolean;
  balance: number;
  tokenAccounts: TokenAccountInfo[];
  transactionCount: number;
  age: number; // in days
  error?: string;
}

export class BlockchainVerificationService {
  private connection: Connection;
  private config: SolanaConfig;

  constructor() {
    this.config = {
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      vermTokenMint: process.env.VERM_TOKEN_MINT || 'Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups',
      stakingProgramId: process.env.STAKING_PROGRAM_ID || 'StakeVERM1111111111111111111111111111111111111'
    };

    this.connection = new Connection(this.config.rpcUrl, 'confirmed');
  }

  /**
   * Verify wallet exists and has transaction history
   */
  async verifyWallet(walletAddress: string): Promise<WalletVerificationResult> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get account info
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      if (!accountInfo) {
        return {
          isValid: false,
          balance: 0,
          tokenAccounts: [],
          transactionCount: 0,
          age: 0,
          error: 'Wallet not found on Solana blockchain'
        };
      }

      // Get SOL balance
      const balance = await this.connection.getBalance(publicKey);
      
      // Get token accounts
      const tokenAccounts = await this.getTokenAccounts(publicKey);
      
      // Get transaction signatures (limited to recent ones for performance)
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 100 });
      
      // Estimate wallet age from first transaction
      let age = 0;
      if (signatures.length > 0) {
        const oldestSignature = signatures[signatures.length - 1];
        if (oldestSignature.blockTime) {
          const ageMs = Date.now() - (oldestSignature.blockTime * 1000);
          age = Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Convert to days
        }
      }

      return {
        isValid: true,
        balance: balance / 1e9, // Convert lamports to SOL
        tokenAccounts,
        transactionCount: signatures.length,
        age
      };

    } catch (error) {
      console.error('Wallet verification error:', error);
      return {
        isValid: false,
        balance: 0,
        tokenAccounts: [],
        transactionCount: 0,
        age: 0,
        error: error instanceof Error ? error.message : 'Wallet verification failed'
      };
    }
  }

  /**
   * Verify VERM token staking
   */
  async verifyStaking(walletAddress: string, minimumAmount: number = 100): Promise<StakingVerificationResult> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get VERM token balance
      const vermBalance = await this.getTokenBalance(publicKey, this.config.vermTokenMint);
      
      if (vermBalance >= minimumAmount) {
        // For now, check if user has enough VERM tokens
        // In a real implementation, check actual staking contract accounts
        return {
          isStaking: true,
          stakeAmount: vermBalance,
          timestamp: Date.now()
        };
      }

      // TODO: Implement actual staking contract verification
      // This would involve:
      // 1. Finding Program Derived Addresses (PDAs) for staking accounts
      // 2. Parsing staking account data to get staked amounts
      // 3. Verifying the staking is active and not withdrawn

      return {
        isStaking: false,
        stakeAmount: vermBalance,
        error: `Insufficient VERM balance. Has ${vermBalance}, needs ${minimumAmount}`
      };

    } catch (error) {
      console.error('Staking verification error:', error);
      return {
        isStaking: false,
        stakeAmount: 0,
        error: error instanceof Error ? error.message : 'Staking verification failed'
      };
    }
  }

  /**
   * Verify trading activity
   */
  async verifyTrading(walletAddress: string, days: number = 30): Promise<TradeVerificationResult> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get recent transaction signatures
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 1000 });
      
      // Filter transactions within the time period
      const cutoffTime = Date.now() / 1000 - (days * 24 * 60 * 60);
      const recentSignatures = signatures.filter(sig => 
        sig.blockTime && sig.blockTime > cutoffTime
      );

      // Analyze transactions for trading patterns
      let tradeCount = 0;
      let totalVolume = 0;
      let lastTradeTime = 0;

      for (const sig of recentSignatures) {
        try {
          const transaction = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });

          if (transaction && transaction.meta) {
            // Look for token transfers (simplified detection)
            const preTokenBalances = transaction.meta.preTokenBalances || [];
            const postTokenBalances = transaction.meta.postTokenBalances || [];

            // If there are token balance changes, consider it a potential trade
            if (preTokenBalances.length > 0 || postTokenBalances.length > 0) {
              tradeCount++;
              if (sig.blockTime && sig.blockTime > lastTradeTime) {
                lastTradeTime = sig.blockTime;
              }
            }
          }
        } catch (txError) {
          // Skip individual transaction errors
          continue;
        }
      }

      return {
        hasTraded: tradeCount > 0,
        recentTrades: tradeCount,
        totalVolume, // TODO: Calculate actual volume from transaction data
        lastTradeTime: lastTradeTime * 1000 // Convert to milliseconds
      };

    } catch (error) {
      console.error('Trading verification error:', error);
      return {
        hasTraded: false,
        recentTrades: 0,
        totalVolume: 0,
        error: error instanceof Error ? error.message : 'Trading verification failed'
      };
    }
  }

  /**
   * Get token accounts for a wallet
   */
  private async getTokenAccounts(publicKey: PublicKey): Promise<TokenAccountInfo[]> {
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID
      });

      const accounts: TokenAccountInfo[] = [];

      for (const { account } of tokenAccounts.value) {
        try {
          const accountData = AccountLayout.decode(account.data);
          
          accounts.push({
            mint: accountData.mint.toString(),
            owner: accountData.owner.toString(),
            amount: Number(accountData.amount),
            decimals: 0 // Would need to fetch mint info for actual decimals
          });
        } catch (parseError) {
          // Skip accounts that can't be parsed
          continue;
        }
      }

      return accounts;
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      return [];
    }
  }

  /**
   * Get token balance for a specific mint
   */
  private async getTokenBalance(publicKey: PublicKey, mintAddress: string): Promise<number> {
    try {
      const mint = new PublicKey(mintAddress);
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(publicKey, {
        mint
      });

      let totalBalance = 0;

      for (const { account } of tokenAccounts.value) {
        try {
          const accountData = AccountLayout.decode(account.data);
          totalBalance += Number(accountData.amount);
        } catch (parseError) {
          continue;
        }
      }

      // Get mint decimals for proper conversion
      const mintInfo = await this.connection.getParsedAccountInfo(mint);
      let decimals = 9; // Default for VERM
      
      if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
        decimals = mintInfo.value.data.parsed.info.decimals;
      }

      return totalBalance / Math.pow(10, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Verify scan activity (placeholder for integration with scan history)
   */
  async verifyScanActivity(walletAddress: string, minimumScans: number = 1): Promise<boolean> {
    try {
      // TODO: Integrate with actual scan history database
      // For now, return true if wallet exists and has transactions
      const walletVerification = await this.verifyWallet(walletAddress);
      return walletVerification.isValid && walletVerification.transactionCount > 0;
    } catch (error) {
      console.error('Scan activity verification error:', error);
      return false;
    }
  }

  /**
   * Get current VERM token price (placeholder)
   */
  async getVermPrice(): Promise<number> {
    try {
      // TODO: Implement actual price fetching from DEX or price API
      // For now, return a fixed price
      return 2.50;
    } catch (error) {
      console.error('Error fetching VERM price:', error);
      return 2.50; // Fallback price
    }
  }

  /**
   * Calculate USD value of VERM tokens
   */
  async calculateVermValue(vermAmount: number): Promise<number> {
    const price = await this.getVermPrice();
    return vermAmount * price;
  }

  /**
   * Validate Solana wallet address format
   */
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Health check for blockchain service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; blockHeight: number }> {
    try {
      const start = Date.now();
      const blockHeight = await this.connection.getBlockHeight();
      const latency = Date.now() - start;

      return {
        healthy: latency < 5000, // Consider unhealthy if > 5 seconds
        latency,
        blockHeight
      };
    } catch (error) {
      return {
        healthy: false,
        latency: -1,
        blockHeight: -1
      };
    }
  }
}

export const blockchainVerificationService = new BlockchainVerificationService();
export default BlockchainVerificationService;
