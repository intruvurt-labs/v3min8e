// services/VermTokenService.ts
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

// Your VERM token mint address
export const VERM_MINT = new PublicKey('Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups');
export const VERM_DECIMALS = 9; // Adjust based on your token's actual decimals

// Treasury wallet that holds VERM for airdrops (you control this)
const TREASURY_WALLET = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_WALLET || 'YOUR_TREASURY_WALLET_ADDRESS');

class VermTokenServiceClass {
  private connection: Connection;
  
  constructor() {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  // Get VERM token balance for a wallet
  async getVermBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(VERM_MINT, publicKey);
      
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error('Error getting VERM balance:', error);
      return 0;
    }
  }

  // Check if wallet has VERM token account
  async hasVermTokenAccount(walletAddress: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(VERM_MINT, publicKey);
      
      const accountInfo = await this.connection.getAccountInfo(tokenAccount);
      return accountInfo !== null;
    } catch (error) {
      return false;
    }
  }

  // Create VERM token account for new users
  async createVermTokenAccount(userWallet: PublicKey, payerWallet: PublicKey): Promise<Transaction> {
    const tokenAccount = await getAssociatedTokenAddress(VERM_MINT, userWallet);
    
    const transaction = new Transaction();
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payerWallet, // payer
        tokenAccount, // token account
        userWallet, // owner
        VERM_MINT, // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    return transaction;
  }

  // Create reward transaction (called from backend)
  async createRewardTransaction(
    recipientWallet: string, 
    amount: number,
    treasuryWallet: PublicKey
  ): Promise<string> {
    try {
      const recipient = new PublicKey(recipientWallet);
      const recipientTokenAccount = await getAssociatedTokenAddress(VERM_MINT, recipient);
      const treasuryTokenAccount = await getAssociatedTokenAddress(VERM_MINT, treasuryWallet);

      // Convert amount to lamports (considering token decimals)
      const amountInLamports = amount * Math.pow(10, VERM_DECIMALS);

      const transaction = new Transaction();

      // Check if recipient has token account, if not create it
      const recipientAccountInfo = await this.connection.getAccountInfo(recipientTokenAccount);
      if (!recipientAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            treasuryWallet, // treasury pays for account creation
            recipientTokenAccount,
            recipient,
            VERM_MINT
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          treasuryTokenAccount, // from
          recipientTokenAccount, // to
          treasuryWallet, // authority
          amountInLamports
        )
      );

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = treasuryWallet;

      return transaction.serialize({ requireAllSignatures: false }).toString('base64');
    } catch (error) {
      console.error('Error creating reward transaction:', error);
      throw new Error('Failed to create reward transaction');
    }
  }

  // Verify transaction on-chain
  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed'
      });
      
      return transaction !== null && transaction.meta?.err === null;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  // Get token price from Jupiter or similar DEX
  async getVermPrice(): Promise<number> {
    try {
      // Using Jupiter API for Solana token prices
      const response = await fetch(
        `https://price.jup.ag/v4/price?ids=${VERM_MINT.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Price API failed');
      }
      
      const data = await response.json();
      return data.data[VERM_MINT.toString()]?.price || 0;
    } catch (error) {
      console.error('Error fetching VERM price:', error);
      return 0; // Fallback price
    }
  }

  // Staking functionality
  async createStakeTransaction(
    userWallet: PublicKey,
    amount: number,
    stakingProgram: PublicKey
  ): Promise<Transaction> {
    const userTokenAccount = await getAssociatedTokenAddress(VERM_MINT, userWallet);
    const stakingTokenAccount = await getAssociatedTokenAddress(VERM_MINT, stakingProgram);
    
    const amountInLamports = amount * Math.pow(10, VERM_DECIMALS);
    
    const transaction = new Transaction();
    transaction.add(
      createTransferInstruction(
        userTokenAccount,
        stakingTokenAccount,
        userWallet,
        amountInLamports
      )
    );

    return transaction;
  }

  // Get all VERM token holders (for leaderboard/analytics)
  async getTokenHolders(): Promise<Array<{ address: string; balance: number }>> {
    try {
      const accounts = await this.connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          { dataSize: 165 }, // Token account size
          { memcmp: { offset: 0, bytes: VERM_MINT.toBase58() } }
        ]
      });

      const holders = await Promise.all(
        accounts.map(async (account) => {
          try {
            const balance = await this.connection.getTokenAccountBalance(account.pubkey);
            return {
              address: account.pubkey.toString(),
              balance: balance.value.uiAmount || 0
            };
          } catch {
            return null;
          }
        })
      );

      return holders.filter(holder => holder && holder.balance > 0) as Array<{ address: string; balance: number }>;
    } catch (error) {
      console.error('Error getting token holders:', error);
      return [];
    }
  }

  // Monitor wallet for VERM transactions
  async monitorWallet(walletAddress: string, callback: (transaction: any) => void): Promise<number> {
    const publicKey = new PublicKey(walletAddress);
    
    const subscriptionId = this.connection.onAccountChange(
      await getAssociatedTokenAddress(VERM_MINT, publicKey),
      (accountInfo, context) => {
        callback({
          slot: context.slot,
          accountInfo,
          timestamp: Date.now()
        });
      },
      'confirmed'
    );

    return subscriptionId;
  }
}

export const VermTokenService = new VermTokenServiceClass();

// React hook for VERM token integration
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

export const useVermToken = () => {
  const { publicKey, signTransaction } = useWallet();
  const [balance, setBalance] = useState(0);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      loadBalance();
      loadPrice();
    }
  }, [publicKey]);

  const loadBalance = async () => {
    if (!publicKey) return;
    
    try {
      const vermBalance = await VermTokenService.getVermBalance(publicKey.toString());
      setBalance(vermBalance);
    } catch (error) {
      console.error('Failed to load VERM balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrice = async () => {
    try {
      const vermPrice = await VermTokenService.getVermPrice();
      setPrice(vermPrice);
    } catch (error) {
      console.error('Failed to load VERM price:', error);
    }
  };

  const claimRewards = async (amount: number) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      // Request reward transaction from backend
      const response = await fetch('/api/verm/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          amount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create claim transaction');
      }

      const { transaction } = await response.json();
      
      // Deserialize and sign transaction
      const tx = Transaction.from(Buffer.from(transaction, 'base64'));
      const signedTx = await signTransaction(tx);
      
      // Send transaction
      const signature = await VermTokenService.connection.sendRawTransaction(
        signedTx.serialize()
      );

      // Wait for confirmation
      await VermTokenService.connection.confirmTransaction(signature, 'confirmed');
      
      // Refresh balance
      await loadBalance();
      
      return signature;
    } catch (error) {
      console.error('Claim failed:', error);
      throw error;
    }
  };

  const stakeTokens = async (amount: number) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      const stakingProgram = new PublicKey(process.env.NEXT_PUBLIC_STAKING_PROGRAM || '');
      const transaction = await VermTokenService.createStakeTransaction(
        publicKey,
        amount,
        stakingProgram
      );

      const { blockhash } = await VermTokenService.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const signature = await VermTokenService.connection.sendRawTransaction(
        signedTx.serialize()
      );

      await VermTokenService.connection.confirmTransaction(signature, 'confirmed');
      await loadBalance();

      return signature;
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  };

  return {
    balance,
    price,
    loading,
    dollarValue: balance * price,
    claimRewards,
    stakeTokens,
    refreshBalance: loadBalance
  };
};

// Backend API route for processing VERM rewards
// pages/api/verm/claim.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { VermTokenService } from '@/services/VermTokenService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, amount } = req.body;

    if (!walletAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user is eligible for this reward amount
    const isEligible = await verifyRewardEligibility(walletAddress, amount);
    if (!isEligible) {
      return res.status(400).json({ error: 'Not eligible for this reward' });
    }

    // Load treasury wallet (keep private key secure!)
    const treasuryKeypair = Keypair.fromSecretKey(
      Buffer.from(process.env.TREASURY_PRIVATE_KEY!, 'base64')
    );

    // Create reward transaction
    const transaction = await VermTokenService.createRewardTransaction(
      walletAddress,
      amount,
      treasuryKeypair.publicKey
    );

    res.status(200).json({ transaction });
  } catch (error) {
    console.error('Claim API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function verifyRewardEligibility(walletAddress: string, amount: number): Promise<boolean> {
  // Add your eligibility logic here
  // Check database for pending rewards, completed tasks, etc.
  return true; // Simplified for example
}

// Updated Airdrop component integration
export const VermBalanceDisplay = () => {
  const { balance, price, dollarValue, loading } = useVermToken();

  if (loading) {
    return <div className="animate-pulse">Loading balance...</div>;
  }

  return (
    <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-cyber-green text-sm font-bold">VERM Balance</span>
        <span className="text-xs text-gray-400">${price.toFixed(4)}</span>
      </div>
      <div className="text-2xl font-bold text-white">
        {balance.toLocaleString()} VERM
      </div>
      <div className="text-sm text-gray-400">
        ≈ ${dollarValue.toFixed(2)} USD
      </div>
    </div>
  );
};

// Staking component
export const VermStaking = () => {
  const { balance, stakeTokens } = useVermToken();
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0 || amount > balance) return;

    setIsStaking(true);
    try {
      const signature = await stakeTokens(amount);
      alert(`Staking successful! Transaction: ${signature}`);
      setStakeAmount('');
    } catch (error) {
      alert(`Staking failed: ${error.message}`);
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-4">
      <h3 className="text-cyber-blue font-bold mb-4">Stake VERM Tokens</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Amount to stake (Max: {balance.toLocaleString()})
          </label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            max={balance}
            className="w-full bg-dark-bg/50 border border-cyber-blue/30 rounded px-3 py-2 text-white"
            placeholder="Enter amount"
          />
        </div>
        
        <button
          onClick={handleStake}
          disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
          className="w-full bg-cyber-blue hover:bg-cyber-blue/80 disabled:opacity-50 text-white py-2 rounded transition-colors"
        >
          {isStaking ? 'Staking...' : 'Stake Tokens'}
        </button>
      </div>
    </div>
  );
};
