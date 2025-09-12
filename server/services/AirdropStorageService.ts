import { promises as fs } from 'fs';
import path from 'path';

// Types for airdrop data structures
export interface StoredUserProgress {
  userId: string;
  walletAddress?: string;
  totalEarned: number;
  tasksCompleted: number;
  currentStreak: number;
  multiplierActive: boolean;
  rank: string;
  nextMilestone: number;
  referralCount: number;
  botTokenVerified: boolean;
  completedTasks: string[];
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  referredBy?: string;
  streakLastUpdated?: string;
  premiumFeatures: boolean;
  totalReferralEarnings: number;
}

export interface StoredTaskCompletion {
  id: string;
  userId: string;
  taskId: string;
  walletAddress?: string;
  reward: number;
  multiplier?: number;
  verificationMethod: string;
  verificationData?: any;
  completedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface StoredBotVerification {
  id: string;
  userId: string;
  walletAddress?: string;
  botToken: string; // Encrypted or hashed
  botInfo: {
    id: number;
    username: string;
    firstName: string;
  };
  verifiedAt: string;
  ipAddress?: string;
  isActive: boolean;
}

export interface StoredSocialVerification {
  id: string;
  userId: string;
  platform: 'twitter' | 'telegram';
  platformUserId: string;
  platformUsername: string;
  verificationType: 'follow' | 'membership' | 'engagement';
  verificationData: any;
  verifiedAt: string;
  isValid: boolean;
}

export interface StoredReferral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  bonusEarned: number;
  createdAt: string;
  isActive: boolean;
}

export interface LeaderboardData {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  totalEarned: number;
  tasksCompleted: number;
  streak: number;
  lastActive: string;
}

export interface AirdropStats {
  totalParticipants: number;
  totalRewardsDistributed: number;
  totalTasksCompleted: number;
  averageEarnings: number;
  topEarner: number;
  activeToday: number;
  lastUpdated: string;
}

export class AirdropStorageService {
  private dataDir: string;
  private initialized = false;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'airdrop');
  }

  /**
   * Initialize storage directories
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'users'), { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'tasks'), { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'bots'), { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'social'), { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'referrals'), { recursive: true });
      
      this.initialized = true;
      console.log('Airdrop storage service initialized');
    } catch (error) {
      console.error('Failed to initialize airdrop storage:', error);
      throw error;
    }
  }

  /**
   * Helper method to read JSON file
   */
  private async readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Helper method to write JSON file
   */
  private async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // User Progress Methods
  async getUserProgress(userId: string): Promise<StoredUserProgress | null> {
    await this.initialize();
    const filePath = path.join(this.dataDir, 'users', `${userId}.json`);
    return this.readJsonFile<StoredUserProgress>(filePath);
  }

  async saveUserProgress(progress: StoredUserProgress): Promise<void> {
    await this.initialize();
    progress.updatedAt = new Date().toISOString();
    const filePath = path.join(this.dataDir, 'users', `${progress.userId}.json`);
    await this.writeJsonFile(filePath, progress);
  }

  async createUserProgress(userId: string, walletAddress?: string, referredBy?: string): Promise<StoredUserProgress> {
    const now = new Date().toISOString();
    const progress: StoredUserProgress = {
      userId,
      walletAddress,
      totalEarned: 0,
      tasksCompleted: 0,
      currentStreak: 0,
      multiplierActive: false,
      rank: 'Ghost Recruit',
      nextMilestone: 100,
      referralCount: 0,
      botTokenVerified: false,
      completedTasks: [],
      lastActive: now,
      createdAt: now,
      updatedAt: now,
      referredBy,
      premiumFeatures: false,
      totalReferralEarnings: 0
    };

    await this.saveUserProgress(progress);
    return progress;
  }

  // Task Completion Methods
  async saveTaskCompletion(completion: Omit<StoredTaskCompletion, 'id'>): Promise<StoredTaskCompletion> {
    await this.initialize();
    const taskCompletion: StoredTaskCompletion = {
      id: this.generateId(),
      ...completion
    };

    const filePath = path.join(this.dataDir, 'tasks', `${taskCompletion.id}.json`);
    await this.writeJsonFile(filePath, taskCompletion);

    // Ensure and update user progress
    let userProgress = await this.getUserProgress(completion.userId);
    if (!userProgress) {
      userProgress = await this.createUserProgress(completion.userId, completion.walletAddress);
    }
    userProgress.totalEarned += completion.reward * (completion.multiplier || 1);
    userProgress.tasksCompleted += 1;
    if (!userProgress.completedTasks.includes(completion.taskId)) {
      userProgress.completedTasks.push(completion.taskId);
    }
    userProgress.lastActive = new Date().toISOString();

    // Update rank
    userProgress.rank = this.calculateRank(userProgress.totalEarned);
    userProgress.nextMilestone = this.calculateNextMilestone(userProgress.totalEarned);

    await this.saveUserProgress(userProgress);

    return taskCompletion;
  }

  async getUserTaskCompletions(userId: string): Promise<StoredTaskCompletion[]> {
    await this.initialize();
    const tasksDir = path.join(this.dataDir, 'tasks');
    
    try {
      const files = await fs.readdir(tasksDir);
      const completions: StoredTaskCompletion[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const completion = await this.readJsonFile<StoredTaskCompletion>(
            path.join(tasksDir, file)
          );
          if (completion && completion.userId === userId) {
            completions.push(completion);
          }
        }
      }

      return completions.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get user task completions:', error);
      return [];
    }
  }

  async isTaskCompleted(userId: string, taskId: string): Promise<boolean> {
    const completions = await this.getUserTaskCompletions(userId);
    return completions.some(completion => completion.taskId === taskId);
  }

  // Bot Verification Methods
  async saveBotVerification(verification: Omit<StoredBotVerification, 'id'>): Promise<StoredBotVerification> {
    await this.initialize();
    const botVerification: StoredBotVerification = {
      id: this.generateId(),
      ...verification
    };

    const filePath = path.join(this.dataDir, 'bots', `${botVerification.id}.json`);
    await this.writeJsonFile(filePath, botVerification);

    // Update user progress
    const userProgress = await this.getUserProgress(verification.userId);
    if (userProgress) {
      userProgress.botTokenVerified = true;
      userProgress.premiumFeatures = true;
      userProgress.multiplierActive = true;
      await this.saveUserProgress(userProgress);
    }

    return botVerification;
  }

  async getUserBotVerifications(userId: string): Promise<StoredBotVerification[]> {
    await this.initialize();
    const botsDir = path.join(this.dataDir, 'bots');
    
    try {
      const files = await fs.readdir(botsDir);
      const verifications: StoredBotVerification[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const verification = await this.readJsonFile<StoredBotVerification>(
            path.join(botsDir, file)
          );
          if (verification && verification.userId === userId) {
            verifications.push(verification);
          }
        }
      }

      return verifications;
    } catch (error) {
      console.error('Failed to get user bot verifications:', error);
      return [];
    }
  }

  // Social Verification Methods
  async saveSocialVerification(verification: Omit<StoredSocialVerification, 'id'>): Promise<StoredSocialVerification> {
    await this.initialize();
    const socialVerification: StoredSocialVerification = {
      id: this.generateId(),
      ...verification
    };

    const filePath = path.join(this.dataDir, 'social', `${socialVerification.id}.json`);
    await this.writeJsonFile(filePath, socialVerification);

    return socialVerification;
  }

  async getUserSocialVerifications(userId: string): Promise<StoredSocialVerification[]> {
    await this.initialize();
    const socialDir = path.join(this.dataDir, 'social');
    
    try {
      const files = await fs.readdir(socialDir);
      const verifications: StoredSocialVerification[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const verification = await this.readJsonFile<StoredSocialVerification>(
            path.join(socialDir, file)
          );
          if (verification && verification.userId === userId) {
            verifications.push(verification);
          }
        }
      }

      return verifications;
    } catch (error) {
      console.error('Failed to get user social verifications:', error);
      return [];
    }
  }

  // Referral Methods
  async saveReferral(referral: Omit<StoredReferral, 'id'>): Promise<StoredReferral> {
    await this.initialize();
    const referralRecord: StoredReferral = {
      id: this.generateId(),
      ...referral
    };

    const filePath = path.join(this.dataDir, 'referrals', `${referralRecord.id}.json`);
    await this.writeJsonFile(filePath, referralRecord);

    // Update referrer progress
    const referrerProgress = await this.getUserProgress(referral.referrerId);
    if (referrerProgress) {
      referrerProgress.referralCount += 1;
      referrerProgress.totalReferralEarnings += referral.bonusEarned;
      await this.saveUserProgress(referrerProgress);
    }

    return referralRecord;
  }

  async getUserReferrals(userId: string): Promise<StoredReferral[]> {
    await this.initialize();
    const referralsDir = path.join(this.dataDir, 'referrals');
    
    try {
      const files = await fs.readdir(referralsDir);
      const referrals: StoredReferral[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const referral = await this.readJsonFile<StoredReferral>(
            path.join(referralsDir, file)
          );
          if (referral && referral.referrerId === userId) {
            referrals.push(referral);
          }
        }
      }

      return referrals;
    } catch (error) {
      console.error('Failed to get user referrals:', error);
      return [];
    }
  }

  // Leaderboard Methods
  async getLeaderboard(limit: number = 10): Promise<LeaderboardData[]> {
    await this.initialize();
    const usersDir = path.join(this.dataDir, 'users');
    
    try {
      const files = await fs.readdir(usersDir);
      const users: StoredUserProgress[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const user = await this.readJsonFile<StoredUserProgress>(
            path.join(usersDir, file)
          );
          if (user) {
            users.push(user);
          }
        }
      }

      // Sort by total earned
      users.sort((a, b) => b.totalEarned - a.totalEarned);

      // Convert to leaderboard format
      return users.slice(0, limit).map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: `Hunter_${user.userId.slice(0, 8)}`,
        avatar: this.getAvatarForRank(index + 1),
        totalEarned: user.totalEarned,
        tasksCompleted: user.tasksCompleted,
        streak: user.currentStreak,
        lastActive: user.lastActive
      }));
    } catch (error) {
      console.error('Failed to generate leaderboard:', error);
      return [];
    }
  }

  // Statistics Methods
  async getStats(): Promise<AirdropStats> {
    await this.initialize();
    const usersDir = path.join(this.dataDir, 'users');
    
    try {
      const files = await fs.readdir(usersDir);
      let totalParticipants = 0;
      let totalRewardsDistributed = 0;
      let totalTasksCompleted = 0;
      let topEarner = 0;
      let activeToday = 0;

      const today = new Date().toDateString();

      for (const file of files) {
        if (file.endsWith('.json')) {
          const user = await this.readJsonFile<StoredUserProgress>(
            path.join(usersDir, file)
          );
          if (user) {
            totalParticipants++;
            totalRewardsDistributed += user.totalEarned;
            totalTasksCompleted += user.tasksCompleted;
            topEarner = Math.max(topEarner, user.totalEarned);
            
            if (new Date(user.lastActive).toDateString() === today) {
              activeToday++;
            }
          }
        }
      }

      const averageEarnings = totalParticipants > 0 ? totalRewardsDistributed / totalParticipants : 0;

      return {
        totalParticipants,
        totalRewardsDistributed,
        totalTasksCompleted,
        averageEarnings: Math.round(averageEarnings),
        topEarner,
        activeToday,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to generate stats:', error);
      return {
        totalParticipants: 0,
        totalRewardsDistributed: 0,
        totalTasksCompleted: 0,
        averageEarnings: 0,
        topEarner: 0,
        activeToday: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Helper Methods
  private calculateRank(totalEarned: number): string {
    if (totalEarned >= 10000) return "Legendary Hunter";
    if (totalEarned >= 5000) return "Elite Scanner";
    if (totalEarned >= 2000) return "Guardian Ghost";
    if (totalEarned >= 1000) return "Skilled Hunter";
    if (totalEarned >= 500) return "Active Scanner";
    if (totalEarned >= 100) return "Vermin Tracker";
    return "Ghost Recruit";
  }

  private calculateNextMilestone(totalEarned: number): number {
    const milestones = [100, 500, 1000, 2000, 5000, 10000, 20000];
    return milestones.find(milestone => milestone > totalEarned) || 50000;
  }

  private getAvatarForRank(rank: number): string {
    switch (rank) {
      case 1: return "🏆";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "👻";
    }
  }

  // Cleanup Methods
  async cleanup(): Promise<void> {
    try {
      // Clean up old temporary files, expired verifications, etc.
      console.log('Airdrop storage cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup airdrop storage:', error);
    }
  }
}

export const airdropStorageService = new AirdropStorageService();
export default AirdropStorageService;
