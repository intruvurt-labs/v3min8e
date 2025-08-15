// Airdrop Service for API Integration
// Handles all airdrop-related API calls and business logic

export interface AirdropTask {
  id: string;
  title: string;
  description: string;
  type: "social" | "bot" | "scan" | "referral" | "staking" | "trading";
  reward: number;
  multiplier?: number;
  status: "locked" | "available" | "in_progress" | "completed" | "failed";
  requirements?: string[];
  verificationMethod: "api" | "manual" | "blockchain" | "bot_token";
  difficulty: "easy" | "medium" | "hard" | "legendary";
  estimatedTime: string;
  apiEndpoint?: string;
  externalUrl?: string;
  isRepeatable?: boolean;
  cooldown?: number;
  lastCompleted?: number;
}

export interface UserProgress {
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
}

export interface LeaderboardEntry {
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
  totalVermDetected: number;
  activeHunters: number;
  totalRewards: number;
  successRate: number;
  averageScanTime: number;
  threatsBlocked: number;
  lastUpdated: string;
}

export interface BotTokenVerificationRequest {
  token: string;
  userId: string;
  walletAddress?: string;
}

export interface TaskVerificationRequest {
  taskId: string;
  userId: string;
  walletAddress?: string;
  proof?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

class AirdropService {
  private baseUrl = "/api/airdrop";

  // Helper method for API requests
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Verify bot token
  async verifyBotToken(
    request: BotTokenVerificationRequest,
  ): Promise<ApiResponse<any>> {
    return this.apiRequest("/verify-bot-token", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Verify task completion
  async verifyTask(
    request: TaskVerificationRequest,
  ): Promise<ApiResponse<any>> {
    return this.apiRequest("/verify-task", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Get leaderboard
  async getLeaderboard(): Promise<
    ApiResponse<{ leaderboard: LeaderboardEntry[] }>
  > {
    return this.apiRequest("/leaderboard");
  }

  // Get airdrop statistics
  async getStats(): Promise<ApiResponse<AirdropStats>> {
    return this.apiRequest("/stats");
  }

  // Get user progress
  async getUserProgress(userId: string): Promise<ApiResponse<UserProgress>> {
    return this.apiRequest(`/user-progress/${userId}`);
  }

  // Local storage helpers
  saveUserProgress(progress: UserProgress): void {
    try {
      localStorage.setItem("nimrev_airdrop_progress", JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save user progress:", error);
    }
  }

  loadUserProgress(): UserProgress | null {
    try {
      const saved = localStorage.getItem("nimrev_airdrop_progress");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load user progress:", error);
      return null;
    }
  }

  saveTaskProgress(tasks: AirdropTask[]): void {
    try {
      localStorage.setItem("nimrev_airdrop_tasks", JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save task progress:", error);
    }
  }

  loadTaskProgress(): AirdropTask[] | null {
    try {
      const saved = localStorage.getItem("nimrev_airdrop_tasks");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load task progress:", error);
      return null;
    }
  }

  // Validate bot token format
  validateBotToken(token: string): { valid: boolean; error?: string } {
    if (!token || typeof token !== "string") {
      return { valid: false, error: "Bot token is required" };
    }

    // Telegram bot token format: {bot_id}:{auth_token}
    const botTokenRegex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;

    if (!botTokenRegex.test(token)) {
      return {
        valid: false,
        error: "Invalid bot token format. Should be: {bot_id}:{auth_token}",
      };
    }

    return { valid: true };
  }

  // Calculate rank based on total earned
  calculateRank(totalEarned: number): string {
    if (totalEarned >= 10000) return "Legendary Hunter";
    if (totalEarned >= 5000) return "Elite Scanner";
    if (totalEarned >= 2000) return "Guardian Ghost";
    if (totalEarned >= 1000) return "Skilled Hunter";
    if (totalEarned >= 500) return "Active Scanner";
    if (totalEarned >= 100) return "Vermin Tracker";
    return "Ghost Recruit";
  }

  // Calculate next milestone
  calculateNextMilestone(totalEarned: number): number {
    const milestones = [100, 500, 1000, 2000, 5000, 10000, 20000];
    return milestones.find((milestone) => milestone > totalEarned) || 50000;
  }

  // Check if task is available
  isTaskAvailable(task: AirdropTask, userProgress: UserProgress): boolean {
    // Check if task is repeatable and cooldown has passed
    if (task.isRepeatable && task.lastCompleted && task.cooldown) {
      const cooldownMs = task.cooldown * 60 * 60 * 1000; // Convert hours to ms
      const timeSinceCompletion = Date.now() - task.lastCompleted;
      if (timeSinceCompletion < cooldownMs) {
        return false;
      }
    }

    // Check specific task requirements
    switch (task.id) {
      case "legendary_hunter":
        // Requires all other tasks completed and 1000+ total earned
        return (
          userProgress.tasksCompleted >= 8 && userProgress.totalEarned >= 1000
        );

      case "refer_5_users":
        // Check if user has profile
        return userProgress.totalEarned > 0;

      case "premium_trade":
        // Requires bot token verification
        return userProgress.botTokenVerified;

      default:
        return task.status !== "locked";
    }
  }

  // Generate referral link
  generateReferralLink(userId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/airdrop?ref=${userId}`;
  }

  // Parse referral code from URL
  getReferralCode(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("ref");
  }

  // Calculate reward with multipliers
  calculateReward(task: AirdropTask, userProgress: UserProgress): number {
    let reward = task.reward;

    // Apply task multiplier
    if (task.multiplier) {
      reward *= task.multiplier;
    }

    // Apply streak multiplier
    if (userProgress.currentStreak >= 7) {
      reward *= 1.5; // 50% bonus for 7+ day streak
    }

    // Apply bot verification multiplier
    if (userProgress.botTokenVerified) {
      reward *= 1.25; // 25% bonus for verified bot
    }

    return Math.floor(reward);
  }

  // Track analytics event
  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    // In production, this would send to analytics service
    console.log("Analytics Event:", eventName, properties);

    // Store locally for debugging
    const events = JSON.parse(localStorage.getItem("nimrev_analytics") || "[]");
    events.push({
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    localStorage.setItem("nimrev_analytics", JSON.stringify(events));
  }

  // Social media verification helpers
  async verifySocialMedia(
    platform: "twitter" | "telegram",
    username: string,
  ): Promise<boolean> {
    // In production, this would call respective APIs
    // For now, simulate verification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.3); // 70% success rate
      }, 1500);
    });
  }

  // Blockchain verification helpers
  async verifyStaking(walletAddress: string, amount: number): Promise<boolean> {
    // In production, this would check staking contract
    // For now, simulate verification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.2); // 80% success rate
      }, 2000);
    });
  }

  async verifyTrade(walletAddress: string): Promise<boolean> {
    // In production, this would check trading history
    // For now, simulate verification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.4); // 60% success rate
      }, 1500);
    });
  }

  // Format numbers for display
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  // Format time duration
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""}`;
  }

  // Clean up expired data
  cleanup(): void {
    try {
      // Remove expired analytics events (older than 30 days)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const events = JSON.parse(
        localStorage.getItem("nimrev_analytics") || "[]",
      );
      const validEvents = events.filter(
        (event: any) => new Date(event.timestamp).getTime() > thirtyDaysAgo,
      );
      localStorage.setItem("nimrev_analytics", JSON.stringify(validEvents));

      console.log("Airdrop service cleanup completed");
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }
}

// Export singleton instance
export const airdropService = new AirdropService();

export default AirdropService;
