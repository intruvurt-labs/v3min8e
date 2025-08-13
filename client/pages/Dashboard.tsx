import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import EnhancedKnowledgeTree from "@/components/EnhancedKnowledgeTree";
import { useWallet } from "@/hooks/useWallet";

interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalScans: number;
  dailyStreak: number;
  vermBalance: number;
  stakedVerm: number;
  gritBalance: number;
  posgTokens: number;
  apr: number;
  trustScore: number;
  lastLogin: Date;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: "scan" | "stake" | "social";
  completed: boolean;
  progress: number;
  target: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: Date;
}

export default function Dashboard() {
  const { publicKey, balance } = useWallet();
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNext: 1000,
    totalScans: 0,
    dailyStreak: 0,
    vermBalance: 0,
    stakedVerm: 0,
    gritBalance: 0,
    posgTokens: 0,
    apr: 0,
    trustScore: 0,
    lastLogin: new Date(),
  });

  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([
    {
      id: "1",
      title: "First Steps",
      description: "Perform your first token scan",
      reward: 100,
      type: "scan",
      completed: false,
      progress: 0,
      target: 1,
    },
    {
      id: "2",
      title: "Getting Started",
      description: "Connect your wallet",
      reward: 50,
      type: "stake",
      completed: false,
      progress: 0,
      target: 1,
    },
    {
      id: "3",
      title: "Join the Community",
      description: "Visit the community page",
      reward: 25,
      type: "social",
      completed: false,
      progress: 0,
      target: 1,
    },
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "First Scan",
      description: "Complete your first token analysis",
      icon: "🔍",
      unlocked: false,
    },
    {
      id: "2",
      title: "Data Ghost",
      description: "Detect 10 scam tokens",
      icon: "👻",
      unlocked: false,
    },
    {
      id: "3",
      title: "Streak Master",
      description: "Maintain 30-day login streak",
      icon: "🔥",
      unlocked: false,
    },
    {
      id: "4",
      title: "Whale Watcher",
      description: "Stake over 10,000 VERM",
      icon: "🐋",
      unlocked: false,
    },
  ]);

  // Calculate APR based on staked amount (10x staking amounts, original APR percentages)
  const calculateAPR = (stakedAmount: number) => {
    if (stakedAmount >= 100000) return 36.9; // 10K -> 100K VERM
    if (stakedAmount >= 50000) return 24.6; // 5K -> 50K VERM
    if (stakedAmount >= 10000) return 15.3; // 1K -> 10K VERM
    if (stakedAmount >= 5000) return 9.8; // 500 -> 5K VERM
    return 3.69; // 100 -> 1K VERM minimum
  };

  // Update stats when wallet connects
  useEffect(() => {
    if (publicKey && balance !== null) {
      // Update user stats with real wallet data
      setUserStats((prev) => ({
        ...prev,
        level: Math.max(1, Math.floor((balance || 0) / 1000) + 1), // Level based on SOL balance
        vermBalance: 0, // Will be updated via API when VERM balance is fetched
        apr: calculateAPR(prev.stakedVerm),
      }));

      // Mark wallet connection challenge as complete
      setDailyChallenges((prev) =>
        prev.map((challenge) =>
          challenge.id === "2"
            ? { ...challenge, completed: true, progress: 1 }
            : challenge,
        ),
      );

      // Unlock first achievement if wallet connected
      setAchievements((prev) =>
        prev.map((achievement) =>
          achievement.id === "1"
            ? { ...achievement, unlocked: true, date: new Date() }
            : achievement,
        ),
      );
    }
  }, [publicKey, balance]);

  const claimDailyReward = () => {
    // Simulate daily login reward
    setUserStats((prev) => ({
      ...prev,
      xp: prev.xp + 100,
      vermBalance: prev.vermBalance + 10,
      posgTokens: prev.posgTokens + 1,
      dailyStreak: prev.dailyStreak + 1,
      lastLogin: new Date(),
    }));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              DATA GHOST HQ
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-4">
              Personal Command Center
            </p>
          </div>

          {/* Wallet Connection Prompt */}
          {!publicKey && (
            <div className="text-center mb-12">
              <div className="border border-cyber-orange/30 p-8 bg-cyber-orange/5 max-w-md mx-auto">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                  CONNECT WALLET
                </h3>
                <p className="text-gray-300 font-mono text-sm mb-6">
                  Connect your Solana wallet to view your dashboard stats and
                  start earning rewards
                </p>
                <Link
                  to="/staking"
                  className="inline-block px-8 py-4 bg-cyber-orange/20 border-2 border-cyber-orange text-cyber-orange font-mono font-bold tracking-wider hover:bg-cyber-orange hover:text-dark-bg transition-all duration-300 neon-border"
                >
                  GO TO STAKING
                </Link>
              </div>
            </div>
          )}

          {/* User Level & Stats */}
          <div className="grid lg:grid-cols-4 gap-6 mb-12">
            <div className="lg:col-span-2 border border-cyber-green/30 p-6 bg-cyber-green/5 neon-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-cyber font-bold text-cyber-green">
                    Level {userStats.level}{" "}
                    {userStats.level < 5
                      ? "Rookie"
                      : userStats.level < 15
                        ? "Data Ghost"
                        : "Elite Scanner"}
                  </h2>
                  <p className="text-gray-400 font-mono text-sm">
                    {userStats.xp.toLocaleString()} XP •{" "}
                    {userStats.xpToNext.toLocaleString()} to next level
                  </p>
                </div>
                <div className="text-4xl">👻</div>
              </div>

              {/* XP Progress Bar */}
              <div className="w-full bg-dark-bg border border-cyber-green/30 rounded">
                <div
                  className="h-3 bg-gradient-to-r from-cyber-green to-cyber-blue rounded transition-all duration-500"
                  style={{
                    width: `${(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                <div>
                  <div className="text-xl font-cyber font-bold text-cyber-green">
                    {userStats.totalScans}
                  </div>
                  <div className="text-gray-400 font-mono text-xs">
                    Total Scans
                  </div>
                </div>
                <div>
                  <div className="text-xl font-cyber font-bold text-cyber-orange">
                    {userStats.dailyStreak}
                  </div>
                  <div className="text-gray-400 font-mono text-xs">
                    Day Streak
                  </div>
                </div>
                <div>
                  <div className="text-xl font-cyber font-bold text-cyber-blue">
                    {userStats.trustScore}%
                  </div>
                  <div className="text-gray-400 font-mono text-xs">
                    Trust Score
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-4">
                TOKEN BALANCES
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300 font-mono text-sm">VERM</span>
                  <span className="text-cyber-green font-bold">
                    {userStats.vermBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 font-mono text-sm">
                    Staked VERM
                  </span>
                  <span className="text-cyber-blue font-bold">
                    {userStats.stakedVerm.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 font-mono text-sm">GRIT</span>
                  <span className="text-cyber-orange font-bold">
                    {userStats.gritBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 font-mono text-sm">
                    PoSg Tokens
                  </span>
                  <span className="text-cyber-purple font-bold">
                    {userStats.posgTokens}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h3 className="text-lg font-cyber font-bold text-cyber-orange mb-4">
                STAKING REWARDS
              </h3>
              <div className="text-center">
                <div className="text-3xl font-cyber font-black text-cyber-orange mb-2">
                  {calculateAPR(userStats.stakedVerm).toFixed(1)}%
                </div>
                <div className="text-gray-300 font-mono text-sm mb-4">
                  Current APR
                </div>
                <div className="text-gray-400 font-mono text-xs">
                  Next tier:{" "}
                  {userStats.stakedVerm >= 100000
                    ? "MAX"
                    : userStats.stakedVerm >= 50000
                      ? "100K VERM"
                      : userStats.stakedVerm >= 10000
                        ? "50K VERM"
                        : userStats.stakedVerm >= 5000
                          ? "10K VERM"
                          : "5K VERM"}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Challenges */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-6">
                DAILY CHALLENGES
              </h3>
              <div className="space-y-4">
                {dailyChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="border border-gray-600 p-4 bg-dark-bg/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-cyber-green font-bold text-sm">
                          {challenge.title}
                        </h4>
                        <p className="text-gray-300 text-xs">
                          {challenge.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-cyber-orange font-bold text-sm">
                          +{challenge.reward} XP
                        </div>
                        {challenge.completed && (
                          <div className="text-cyber-green text-xs">
                            ✓ Complete
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-dark-bg border border-gray-600 rounded mt-2">
                      <div
                        className={`h-2 rounded transition-all duration-500 ${
                          challenge.completed
                            ? "bg-cyber-green"
                            : "bg-cyber-orange"
                        }`}
                        style={{
                          width: `${(challenge.progress / challenge.target) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      Progress: {challenge.progress}/{challenge.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h3 className="text-xl font-cyber font-bold text-cyber-green mb-6">
                DAILY LOGIN REWARD
              </h3>
              <div className="text-center">
                <div className="text-6xl mb-4">💰</div>
                <div className="text-2xl font-cyber font-bold text-cyber-green mb-2">
                  Day {userStats.dailyStreak} Reward
                </div>
                <div className="text-gray-300 font-mono text-sm mb-6">
                  100 XP • 10 VERM • 1 PoSg Token
                </div>
                <button
                  onClick={claimDailyReward}
                  className="w-full px-6 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border animate-pulse-glow"
                >
                  CLAIM DAILY REWARD
                </button>
                <div className="text-gray-400 font-mono text-xs mt-4">
                  Streak multiplier: x
                  {Math.min(Math.floor(userStats.dailyStreak / 7) + 1, 5)}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5 mb-12">
            <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-6">
              ACHIEVEMENTS
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 border text-center transition-all duration-300 ${
                    achievement.unlocked
                      ? "border-cyber-green bg-cyber-green/10"
                      : "border-gray-600 bg-gray-800/50 opacity-50"
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h4 className="text-cyber-green font-bold text-sm mb-1">
                    {achievement.title}
                  </h4>
                  <p className="text-gray-300 text-xs mb-2">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && achievement.date && (
                    <div className="text-gray-400 text-xs">
                      {achievement.date.toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/terminal"
              className="block p-6 border border-cyber-green/30 bg-cyber-green/5 hover:bg-cyber-green/10 transition-all duration-300 text-center neon-border"
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-cyber font-bold text-cyber-green mb-2">
                VERMINPORT
              </h3>
              <p className="text-gray-300 font-mono text-sm">
                Advanced token scanning
              </p>
            </Link>

            <Link
              to="/staking"
              className="block p-6 border border-cyber-blue/30 bg-cyber-blue/5 hover:bg-cyber-blue/10 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-3">💎</div>
              <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-2">
                DUAL STAKING
              </h3>
              <p className="text-gray-300 font-mono text-sm">
                Stake VERM & GRIT
              </p>
            </Link>

            <Link
              to="/community"
              className="block p-6 border border-cyber-orange/30 bg-cyber-orange/5 hover:bg-cyber-orange/10 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-cyber font-bold text-cyber-orange mb-2">
                COMMUNITY
              </h3>
              <p className="text-gray-300 font-mono text-sm">
                Join data ghosts
              </p>
            </Link>
          </div>

          {/* Enhanced Knowledge Tree */}
          <div className="mt-12">
            <EnhancedKnowledgeTree
              userLevel={userStats.level}
              scanCount={userStats.totalScans}
              verifiedPatterns={Math.floor(userStats.totalScans * 0.3)} // 30% verification rate
              userWallet={publicKey || undefined}
            />
          </div>

          {/* APR Tier Information */}
          <div className="mt-12 border border-cyber-orange/30 p-6 bg-cyber-orange/5">
            <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-6">
              STAKING APR TIERS
            </h3>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { min: 1000, max: 4999, apr: 3.69 }, // 100-499 -> 1K-4.9K
                { min: 5000, max: 9999, apr: 9.8 }, // 500-999 -> 5K-9.9K
                { min: 10000, max: 49999, apr: 15.3 }, // 1K-4.9K -> 10K-49.9K
                { min: 50000, max: 99999, apr: 24.6 }, // 5K-9.9K -> 50K-99.9K
                { min: 100000, max: Infinity, apr: 36.9 }, // 10K+ -> 100K+
              ].map((tier, index) => (
                <div
                  key={index}
                  className={`p-4 border text-center ${
                    userStats.stakedVerm >= tier.min &&
                    userStats.stakedVerm <= tier.max
                      ? "border-cyber-green bg-cyber-green/10"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-cyber-orange font-bold text-lg">
                    {tier.apr}%
                  </div>
                  <div className="text-gray-300 text-xs">
                    {tier.min.toLocaleString()}
                    {tier.max === Infinity
                      ? "+"
                      : ` - ${tier.max.toLocaleString()}`}{" "}
                    VERM
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Strengthening Call-to-Action */}
          <div className="mt-8 p-6 bg-gradient-to-r from-cyber-green/10 to-cyber-purple/10 border border-cyber-green/30">
            <div className="text-center">
              <h3 className="text-2xl font-cyber font-bold text-cyber-green mb-4 flex items-center justify-center">
                🚀 STRENGTHEN THE NIMREV PROTOCOL
              </h3>
              <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6 max-w-2xl mx-auto">
                Your VERM staking directly powers the network's AI threat
                detection algorithms. The more VERM staked collectively, the
                stronger our subversive analysis becomes. Help secure the
                protocol while earning progressive rewards up to 36.9% APR.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-green mb-1">
                    {((userStats.stakedVerm / 10000000) * 100).toFixed(3)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Your Network Contribution
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-blue mb-1">
                    {Math.floor(userStats.stakedVerm * 0.1)}
                  </div>
                  <div className="text-xs text-gray-400">
                    AI Compute Power Added
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-orange mb-1">
                    {calculateAPR(userStats.stakedVerm).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Current Reward APR
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link
                  to="/staking"
                  className="px-8 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border"
                >
                  INCREASE STAKE
                </Link>
                <button
                  onClick={() =>
                    window.open("https://dexscreener.com/solana/verm", "_blank")
                  }
                  className="px-8 py-4 border-2 border-cyber-orange text-cyber-orange font-mono font-bold tracking-wider hover:bg-cyber-orange/20 transition-all duration-300"
                >
                  GET MORE VERM
                </button>
              </div>

              <div className="mt-4 text-xs text-cyber-blue font-mono">
                💡 More stakers = Stronger AI = Better threat detection for
                everyone
              </div>
            </div>
          </div>
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
