import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  Star,
  Zap
} from 'lucide-react';

interface AirdropWalletConnectionProps {
  onWalletConnected?: (publicKey: string) => void;
  onWalletDisconnected?: () => void;
  requiredForTasks?: boolean;
  showRewards?: boolean;
}

interface WalletStats {
  totalEarned: number;
  pendingRewards: number;
  completedTasks: number;
  walletAge?: number;
}

export default function AirdropWalletConnection({
  onWalletConnected,
  onWalletDisconnected,
  requiredForTasks = true,
  showRewards = true
}: AirdropWalletConnectionProps) {
  const { publicKey, connected, connecting, disconnect, connect } = useWallet();
  const [walletStats, setWalletStats] = useState<WalletStats>({
    totalEarned: 0,
    pendingRewards: 0,
    completedTasks: 0
  });
  const [showCopied, setShowCopied] = useState(false);
  const [walletVerified, setWalletVerified] = useState(false);

  // Handle wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      const publicKeyStr = publicKey.toBase58();
      onWalletConnected?.(publicKeyStr);
      loadWalletStats(publicKeyStr);
      verifyWallet(publicKeyStr);
    } else {
      onWalletDisconnected?.();
      setWalletStats({
        totalEarned: 0,
        pendingRewards: 0,
        completedTasks: 0
      });
    }
  }, [connected, publicKey, onWalletConnected, onWalletDisconnected]);

  const loadWalletStats = async (walletAddress: string) => {
    try {
      // In a real implementation, this would fetch from your API
      const response = await fetch(`/api/airdrop/wallet-stats/${walletAddress}`);
      if (response.ok) {
        const stats = await response.json();
        setWalletStats(stats.data || walletStats);
      }
    } catch (error) {
      console.error('Failed to load wallet stats:', error);
    }
  };

  const verifyWallet = async (walletAddress: string) => {
    try {
      // Check if wallet has any transaction history or VERM tokens
      // This is a placeholder - implement real verification logic
      setWalletVerified(true);
    } catch (error) {
      console.error('Failed to verify wallet:', error);
    }
  };

  const copyWalletAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 border border-cyber-blue/50 rounded-xl p-6 text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>

        <h3 className="text-xl font-cyber font-bold text-white mb-2">
          Connect Your Solana Wallet
        </h3>
        
        <p className="text-gray-300 mb-6 max-w-md mx-auto">
          {requiredForTasks 
            ? "Connect your wallet to participate in the VERM airdrop and complete verification tasks."
            : "Connect your wallet to track your earnings and claim rewards."
          }
        </p>

        <div className="mb-6">
          <WalletMultiButton className="!bg-gradient-to-r !from-cyber-green !to-cyber-blue hover:!from-cyber-blue hover:!to-cyber-green !text-white !rounded-lg !px-8 !py-3 !font-bold !transition-all !duration-300" />
        </div>

        {requiredForTasks && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-3">
              <Shield className="w-6 h-6 text-cyber-green mx-auto mb-2" />
              <div className="text-xs text-gray-300">Secure</div>
            </div>
            <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-3">
              <Zap className="w-6 h-6 text-cyber-blue mx-auto mb-2" />
              <div className="text-xs text-gray-300">Instant</div>
            </div>
            <div className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-3">
              <Star className="w-6 h-6 text-cyber-purple mx-auto mb-2" />
              <div className="text-xs text-gray-300">Rewarded</div>
            </div>
          </div>
        )}

        {connecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 text-cyber-blue">
              <div className="w-4 h-4 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-mono">Connecting...</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-cyber-green/20 to-cyber-blue/20 border border-cyber-green/50 rounded-xl p-6"
    >
      {/* Wallet Info Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">
                {formatWalletAddress(publicKey!.toBase58())}
              </span>
              {walletVerified && (
                <CheckCircle className="w-4 h-4 text-cyber-green" />
              )}
            </div>
            <div className="text-xs text-gray-400">Solana Wallet Connected</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyWalletAddress}
            className="p-2 hover:bg-cyber-green/20 rounded-lg transition-colors relative"
            title="Copy wallet address"
          >
            <Copy className="w-4 h-4 text-cyber-green" />
            <AnimatePresence>
              {showCopied && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-cyber-green text-dark-bg px-2 py-1 rounded text-xs font-bold"
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          
          <button
            onClick={() => window.open(`https://solscan.io/account/${publicKey!.toBase58()}`, '_blank')}
            className="p-2 hover:bg-cyber-blue/20 rounded-lg transition-colors"
            title="View on Solscan"
          >
            <ExternalLink className="w-4 h-4 text-cyber-blue" />
          </button>

          <button
            onClick={handleDisconnect}
            className="px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Wallet Stats */}
      {showRewards && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-green">
              {walletStats.totalEarned.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">VERM Earned</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-orange">
              {walletStats.pendingRewards.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-blue">
              {walletStats.completedTasks}
            </div>
            <div className="text-xs text-gray-400">Tasks Done</div>
          </div>
        </div>
      )}

      {/* Wallet Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
          <span className="text-cyber-green font-mono">Ready for Airdrop</span>
        </div>
        
        {walletVerified ? (
          <div className="flex items-center gap-1 text-cyber-green">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-cyber-orange">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Verification Pending</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {requiredForTasks && (
        <div className="mt-4 flex gap-2">
          <button className="flex-1 px-3 py-2 bg-cyber-green/20 border border-cyber-green/50 text-cyber-green rounded-lg text-xs font-bold hover:bg-cyber-green/30 transition-colors">
            Start Tasks
          </button>
          <button className="flex-1 px-3 py-2 bg-cyber-blue/20 border border-cyber-blue/50 text-cyber-blue rounded-lg text-xs font-bold hover:bg-cyber-blue/30 transition-colors">
            View Progress
          </button>
        </div>
      )}
    </motion.div>
  );
}
