// services/AirdropTrackingService.ts
interface PendingReward {
  userId: string;
  walletAddress: string;
  taskId: string;
  amount: number;
  timestamp: number;
  verified: boolean;
  distributionBatch?: number;
}

interface UserRewardSummary {
  walletAddress: string;
  username: string;
  totalEarned: number;
  tasksCompleted: number;
  joinDate: number;
  lastActivity: number;
  referralCode: string;
  referralCount: number;
  isEligible: boolean;
}

class AirdropTrackingServiceClass {
  private pendingRewards: PendingReward[] = [];
  private userSummaries: Map<string, UserRewardSummary> = new Map();

  // Track completed task for future distribution
  async trackReward(
    userId: string, 
    walletAddress: string, 
    taskId: string, 
    amount: number
  ): Promise<void> {
    const reward: PendingReward = {
      userId,
      walletAddress,
      taskId,
      amount,
      timestamp: Date.now(),
      verified: true // Since task was verified
    };

    // Save to localStorage for demo (use real DB in production)
    const existingRewards = this.getPendingRewards();
    existingRewards.push(reward);
    localStorage.setItem('nimrev_pending_rewards', JSON.stringify(existingRewards));

    // Update user summary
    this.updateUserSummary(userId, walletAddress, amount);

    // Send to backend for permanent storage
    await this.syncToBackend(reward);
  }

  private getPendingRewards(): PendingReward[] {
    try {
      const stored = localStorage.getItem('nimrev_pending_rewards');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private updateUserSummary(userId: string, walletAddress: string, rewardAmount: number) {
    const existing = this.userSummaries.get(userId) || {
      walletAddress,
      username: `user_${userId.slice(0, 8)}`,
      totalEarned: 0,
      tasksCompleted: 0,
      joinDate: Date.now(),
      lastActivity: Date.now(),
      referralCode: userId,
      referralCount: 0,
      isEligible: true
    };

    existing.totalEarned += rewardAmount;
    existing.tasksCompleted += 1;
    existing.lastActivity = Date.now();

    this.userSummaries.set(userId, existing);
    
    // Save updated summary
    localStorage.setItem('nimrev_user_summary', JSON.stringify([...this.userSummaries.values()]));
  }

  private async syncToBackend(reward: PendingReward): Promise<void> {
    try {
      await fetch('/api/airdrop/track-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reward)
      });
    } catch (error) {
      console.error('Failed to sync reward to backend:', error);
      // Store in retry queue
      const retryQueue = JSON.parse(localStorage.getItem('nimrev_retry_queue') || '[]');
      retryQueue.push(reward);
      localStorage.setItem('nimrev_retry_queue', JSON.stringify(retryQueue));
    }
  }

  // Get user's total pending rewards
  getUserRewards(userId: string): { totalPending: number; taskCount: number; rewards: PendingReward[] } {
    const rewards = this.getPendingRewards().filter(r => r.userId === userId);
    const totalPending = rewards.reduce((sum, r) => sum + r.amount, 0);
    
    return {
      totalPending,
      taskCount: rewards.length,
      rewards
    };
  }

  // Generate distribution CSV for manual processing
  generateDistributionCSV(): string {
    const rewards = this.getPendingRewards();
    const userTotals = new Map<string, { address: string; total: number; tasks: number }>();

    // Aggregate by wallet address
    rewards.forEach(reward => {
      const existing = userTotals.get(reward.walletAddress) || {
        address: reward.walletAddress,
        total: 0,
        tasks: 0
      };
      
      existing.total += reward.amount;
      existing.tasks += 1;
      userTotals.set(reward.walletAddress, existing);
    });

    // Generate CSV
    const headers = 'Wallet Address,Total VERM,Tasks Completed,Distribution Date\n';
    const rows = Array.from(userTotals.values())
      .sort((a, b) => b.total - a.total) // Sort by highest rewards
      .map(user => `${user.address},${user.total},${user.tasks},${new Date().toISOString()}`)
      .join('\n');

    return headers + rows;
  }

  // Export distribution data
  exportDistributionData(): void {
    const csv = this.generateDistributionCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `verm_distribution_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Get distribution statistics
  getDistributionStats(): {
    totalUsers: number;
    totalTokens: number;
    avgPerUser: number;
    topEarners: Array<{ address: string; amount: number }>;
  } {
    const rewards = this.getPendingRewards();
    const userTotals = new Map<string, number>();

    rewards.forEach(reward => {
      const current = userTotals.get(reward.walletAddress) || 0;
      userTotals.set(reward.walletAddress, current + reward.amount);
    });

    const totalUsers = userTotals.size;
    const totalTokens = Array.from(userTotals.values()).reduce((sum, amount) => sum + amount, 0);
    const avgPerUser = totalUsers > 0 ? totalTokens / totalUsers : 0;

    const topEarners = Array.from(userTotals.entries())
      .map(([address, amount]) => ({ address, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      totalUsers,
      totalTokens,
      avgPerUser,
      topEarners
    };
  }

  // Validate wallet addresses for distribution
  validateWalletAddresses(): { valid: string[]; invalid: string[] } {
    const rewards = this.getPendingRewards();
    const addresses = [...new Set(rewards.map(r => r.walletAddress))];
    
    const valid: string[] = [];
    const invalid: string[] = [];

    addresses.forEach(address => {
      try {
        // Basic Solana address validation
        if (address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
          valid.push(address);
        } else {
          invalid.push(address);
        }
      } catch {
        invalid.push(address);
      }
    });

    return { valid, invalid };
  }

  // Clear all data (use carefully!)
  clearAllData(): void {
    localStorage.removeItem('nimrev_pending_rewards');
    localStorage.removeItem('nimrev_user_summary');
    localStorage.removeItem('nimrev_retry_queue');
    this.userSummaries.clear();
    this.pendingRewards = [];
  }
}

export const AirdropTrackingService = new AirdropTrackingServiceClass();

// Updated Airdrop component - replace completeTask function
const completeTask = async (taskId: string) => {
  if (!currentProfile || !publicKey) return;
  
  setIsVerifying(true);
  try {
    // Verify task completion (existing logic)
    const result = await verifyTaskCompletion(taskId, currentProfile.id, publicKey.toString());
    
    // Track reward for manual distribution (NEW)
    await AirdropTrackingService.trackReward(
      currentProfile.id,
      publicKey.toString(), 
      taskId, 
      result.reward
    );

    // Update UI state
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { 
        ...t, 
        status: "completed" as const,
        lastCompleted: Date.now()
      } : t
    ));

    // Update user progress
    const newProgress = {
      ...userProgress,
      totalEarned: userProgress.totalEarned + result.reward,
      tasksCompleted: userProgress.tasksCompleted + 1,
      currentStreak: userProgress.currentStreak + 1,
      lastActivity: Date.now()
    };
    setUserProgress(newProgress);

    setIsTaskModalOpen(false);

    // Show success with countdown to distribution
    const daysLeft = Math.ceil((93 * 24 * 60 * 60 * 1000 - (Date.now() - Date.now())) / (24 * 60 * 60 * 1000));
    
    NotificationService.success(
      `${result.reward} VERM earned! Distribution in ${daysLeft} days.`,
      {
        action: {
          label: 'Share Achievement',
          onClick: () => shareEarnings(result.reward, currentProfile.username)
        }
      }
    );

    // Track analytics
    trackEvent('task_completed', {
      taskId,
      reward: result.reward,
      totalEarned: newProgress.totalEarned,
      daysUntilDistribution: daysLeft
    });

  } catch (error) {
    console.error('Task completion failed:', error);
    NotificationService.error(
      error instanceof Error ? error.message : 'Task verification failed'
    );
  } finally {
    setIsVerifying(false);
  }
};

// Distribution Dashboard Component (for admin use)
export const DistributionDashboard = () => {
  const [stats, setStats] = useState(AirdropTrackingService.getDistributionStats());
  const [validation, setValidation] = useState({ valid: [], invalid: [] });

  useEffect(() => {
    setStats(AirdropTrackingService.getDistributionStats());
    setValidation(AirdropTrackingService.validateWalletAddresses());
  }, []);

  const handleExport = () => {
    AirdropTrackingService.exportDistributionData();
    NotificationService.success('Distribution CSV exported!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-cyber-green mb-6">VERM Distribution Dashboard</h2>
        
        {/* Statistics Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyber-green">{stats.totalUsers}</div>
            <div className="text-sm text-gray-300">Total Users</div>
          </div>
          
          <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyber-blue">{stats.totalTokens.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Total VERM</div>
          </div>
          
          <div className="bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyber-orange">{Math.round(stats.avgPerUser)}</div>
            <div className="text-sm text-gray-300">Avg per User</div>
          </div>
          
          <div className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyber-purple">{validation.valid.length}</div>
            <div className="text-sm text-gray-300">Valid Wallets</div>
          </div>
        </div>

        {/* Top Earners */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Top 10 Earners</h3>
          <div className="space-y-2">
            {stats.topEarners.map((earner, index) => (
              <div key={earner.address} className="flex justify-between items-center bg-dark-bg/40 p-3 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-cyber-orange font-bold">#{index + 1}</span>
                  <span className="font-mono text-sm">{earner.address.slice(0, 8)}...{earner.address.slice(-4)}</span>
                </div>
                <span className="text-cyber-green font-bold">{earner.amount.toLocaleString()} VERM</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invalid Addresses Alert */}
        {validation.invalid.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <h4 className="text-red-400 font-bold mb-2">⚠️ Invalid Wallet Addresses Found</h4>
            <div className="text-sm text-gray-300">
              {validation.invalid.length} invalid addresses detected. Review before distribution.
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-cyber-green hover:bg-cyber-green/80 text-dark-bg font-bold rounded-lg transition-colors"
          >
            📊 Export Distribution CSV
          </button>
          
          <button
            onClick={() => setStats(AirdropTrackingService.getDistributionStats())}
            className="px-6 py-3 bg-cyber-blue hover:bg-cyber-blue/80 text-white font-bold rounded-lg transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

// Countdown component for distribution date
export const DistributionCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(93 * 24 * 60 * 60 * 1000); // 93 days in ms

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

  return (
    <div className="bg-gradient-to-r from-cyber-green/20 to-cyber-blue/20 border border-cyber-green/30 rounded-xl p-6 text-center">
      <h3 className="text-xl font-bold text-cyber-green mb-4">🗓️ VERM Distribution Countdown</h3>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { value: days, label: 'DAYS' },
          { value: hours, label: 'HOURS' },  
          { value: minutes, label: 'MINS' },
          { value: seconds, label: 'SECS' }
        ].map((item, index) => (
          <div key={index} className="bg-cyber-green/20 border border-cyber-green rounded-lg p-4">
            <div className="text-2xl font-bold text-cyber-green">{item.value.toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-300 font-bold">{item.label}</div>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-gray-300">
        All earned VERM tokens will be distributed to qualified wallets
      </p>
    </div>
  );
};
