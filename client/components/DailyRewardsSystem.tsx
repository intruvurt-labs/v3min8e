import { useState, useEffect } from "react";
import {
  Gift,
  Star,
  Crown,
  Zap,
  Trophy,
  Flame,
  Target,
  Diamond,
  Coins,
  Calendar,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DailyReward {
  day: number;
  type: "tokens" | "xp" | "nft" | "multiplier" | "special";
  amount: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  title: string;
  description: string;
  claimed: boolean;
  icon: React.ReactNode;
}

interface UserProgress {
  level: number;
  xp: number;
  nextLevelXp: number;
  streak: number;
  totalRewardsClaimed: number;
  lastClaimDate: string | null;
}

const dailyRewards: DailyReward[] = [
  {
    day: 1,
    type: "tokens",
    amount: 100,
    rarity: "common",
    title: "Welcome Tokens",
    description: "100 VERM tokens",
    claimed: false,
    icon: <Coins className="w-6 h-6" />,
  },
  {
    day: 2,
    type: "xp",
    amount: 50,
    rarity: "common",
    title: "Knowledge Boost",
    description: "50 XP points",
    claimed: false,
    icon: <Star className="w-6 h-6" />,
  },
  {
    day: 3,
    type: "tokens",
    amount: 200,
    rarity: "rare",
    title: "Token Haul",
    description: "200 VERM tokens",
    claimed: false,
    icon: <Coins className="w-6 h-6" />,
  },
  {
    day: 4,
    type: "multiplier",
    amount: 2,
    rarity: "rare",
    title: "Scan Multiplier",
    description: "2x scan rewards for 24h",
    claimed: false,
    icon: <Zap className="w-6 h-6" />,
  },
  {
    day: 5,
    type: "xp",
    amount: 100,
    rarity: "epic",
    title: "XP Surge",
    description: "100 XP points",
    claimed: false,
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    day: 6,
    type: "tokens",
    amount: 500,
    rarity: "epic",
    title: "Token Bonanza",
    description: "500 VERM tokens",
    claimed: false,
    icon: <Trophy className="w-6 h-6" />,
  },
  {
    day: 7,
    type: "nft",
    amount: 1,
    rarity: "legendary",
    title: "Ghost Badge NFT",
    description: "Exclusive Data Ghost NFT",
    claimed: false,
    icon: <Crown className="w-6 h-6" />,
  },
];

export default function DailyRewardsSystem() {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    xp: 250,
    nextLevelXp: 500,
    streak: 3,
    totalRewardsClaimed: 15,
    lastClaimDate: null,
  });

  const [rewards, setRewards] = useState<DailyReward[]>(dailyRewards);
  const [selectedReward, setSelectedReward] = useState<DailyReward | null>(
    null,
  );
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  // Check which day user is on
  const getCurrentDay = () => {
    const lastClaim = userProgress.lastClaimDate
      ? new Date(userProgress.lastClaimDate)
      : null;
    const today = new Date();
    const diffTime = lastClaim
      ? Math.abs(today.getTime() - lastClaim.getTime())
      : 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (!lastClaim) return 1;
    if (diffDays >= 1) return (userProgress.streak % 7) + 1;
    return -1; // Already claimed today
  };

  const currentDay = getCurrentDay();
  const canClaimToday = currentDay > 0;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-400 to-gray-600";
      case "rare":
        return "from-blue-400 to-blue-600";
      case "epic":
        return "from-purple-400 to-purple-600";
      case "legendary":
        return "from-yellow-400 to-orange-500";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-400";
      case "rare":
        return "border-blue-400";
      case "epic":
        return "border-purple-400";
      case "legendary":
        return "border-yellow-400";
      default:
        return "border-gray-400";
    }
  };

  const claimReward = async (reward: DailyReward) => {
    if (!canClaimToday || reward.day !== currentDay || reward.claimed) return;

    setIsClaimingReward(true);
    setSelectedReward(reward);
    setShowRewardAnimation(true);

    // Create celebration particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      y: Math.random() * 300,
    }));
    setParticles(newParticles);

    // Simulate claiming process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update rewards and user progress
    setRewards((prev) =>
      prev.map((r) => (r.day === reward.day ? { ...r, claimed: true } : r)),
    );

    setUserProgress((prev) => ({
      ...prev,
      streak: prev.streak + 1,
      totalRewardsClaimed: prev.totalRewardsClaimed + 1,
      lastClaimDate: new Date().toISOString(),
      xp: reward.type === "xp" ? prev.xp + reward.amount : prev.xp,
    }));

    // Clear animation after delay
    setTimeout(() => {
      setShowRewardAnimation(false);
      setIsClaimingReward(false);
      setSelectedReward(null);
      setParticles([]);
    }, 3000);
  };

  const calculateLevelProgress = () => {
    return (userProgress.xp / userProgress.nextLevelXp) * 100;
  };

  return (
    <div className="space-y-6">
      {/* User Progress Header */}
      <div className="bg-gradient-to-r from-dark-bg/90 to-darker-bg/90 border border-cyber-green/30 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-cyber-orange rounded-full px-2 py-1 text-xs font-bold text-white">
                {userProgress.level}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-cyber font-bold text-cyber-green">
                DATA GHOST
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Flame className="w-4 h-4 text-cyber-orange" />
                <span>{userProgress.streak} day streak</span>
                <Target className="w-4 h-4 text-cyber-blue ml-2" />
                <span>{userProgress.totalRewardsClaimed} rewards claimed</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-cyber font-bold text-cyber-purple">
              {userProgress.xp.toLocaleString()} XP
            </div>
            <div className="text-xs text-gray-400">
              {userProgress.nextLevelXp - userProgress.xp} to next level
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-dark-bg rounded-full overflow-hidden border border-cyber-green/30">
            <motion.div
              className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue"
              initial={{ width: 0 }}
              animate={{ width: `${calculateLevelProgress()}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            Level {userProgress.level} Progress
          </div>
        </div>
      </div>

      {/* Daily Rewards Grid */}
      <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-cyber font-bold text-cyber-green flex items-center gap-2">
            <Gift className="w-6 h-6" />
            DAILY REWARDS
          </h3>

          <div className="flex items-center gap-2 bg-cyber-green/10 border border-cyber-green/30 rounded-lg px-3 py-1">
            <Calendar className="w-4 h-4 text-cyber-green" />
            <span className="text-cyber-green font-mono text-sm">
              Day {Math.max(1, currentDay)} of 7
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {rewards.map((reward) => (
            <motion.div
              key={reward.day}
              className={`relative group cursor-pointer ${
                reward.day === currentDay && canClaimToday ? "scale-105" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => claimReward(reward)}
            >
              <div
                className={`
                relative p-4 rounded-xl border-2 transition-all duration-300
                ${
                  reward.claimed
                    ? "bg-gray-600/20 border-gray-600 opacity-50"
                    : reward.day === currentDay && canClaimToday
                      ? `bg-gradient-to-br ${getRarityColor(reward.rarity)} ${getRarityBorder(reward.rarity)} animate-pulse shadow-lg`
                      : reward.day < currentDay
                        ? "bg-gray-600/20 border-gray-600 opacity-50"
                        : "bg-dark-bg/80 border-gray-700 hover:border-cyber-green/50"
                }
              `}
              >
                {/* Day Number */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyber-blue rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {reward.day}
                </div>

                {/* Claimed Check */}
                {reward.claimed && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-cyber-green rounded-full flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-white text-xs"
                    >
                      ✓
                    </motion.div>
                  </div>
                )}

                {/* Reward Icon */}
                <div
                  className={`flex items-center justify-center mb-2 ${
                    reward.rarity === "legendary"
                      ? "text-yellow-400"
                      : reward.rarity === "epic"
                        ? "text-purple-400"
                        : reward.rarity === "rare"
                          ? "text-blue-400"
                          : "text-gray-400"
                  }`}
                >
                  {reward.icon}
                </div>

                {/* Reward Info */}
                <div className="text-center">
                  <div className="text-xs font-bold text-white mb-1">
                    {reward.title}
                  </div>
                  <div className="text-xs text-gray-300">
                    {reward.description}
                  </div>
                </div>

                {/* Special Effects for Current Day */}
                {reward.day === currentDay &&
                  canClaimToday &&
                  !reward.claimed && (
                    <div className="absolute inset-0 rounded-xl">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-green/20 to-cyber-blue/20 animate-pulse" />
                      <div className="absolute top-1 left-1 right-1 h-1 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-full animate-shimmer" />
                    </div>
                  )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Next Reward Preview */}
        {currentDay < 7 && (
          <div className="mt-6 p-4 bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-cyber-purple" />
                <div>
                  <div className="text-sm font-bold text-cyber-purple">
                    Tomorrow's Reward
                  </div>
                  <div className="text-xs text-gray-300">
                    {rewards[currentDay]?.title}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-cyber-purple" />
            </div>
          </div>
        )}
      </div>

      {/* Reward Animation Overlay */}
      <AnimatePresence>
        {showRewardAnimation && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="relative">
              {/* Celebration Particles */}
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-2 h-2 bg-cyber-green rounded-full"
                  initial={{
                    x: particle.x,
                    y: particle.y,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    x: particle.x + (Math.random() - 0.5) * 200,
                    y: particle.y - Math.random() * 100,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* Reward Display */}
              <motion.div
                initial={{ scale: 0, rotateY: 0 }}
                animate={{ scale: 1, rotateY: 360 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`
                  relative p-8 rounded-2xl border-4 bg-gradient-to-br ${getRarityColor(selectedReward.rarity)} ${getRarityBorder(selectedReward.rarity)}
                  shadow-2xl text-center min-w-[300px]
                `}
              >
                <div className="text-6xl mb-4 text-white">
                  {selectedReward.icon}
                </div>

                <h3 className="text-2xl font-cyber font-bold text-white mb-2">
                  REWARD CLAIMED!
                </h3>

                <div className="text-lg font-bold text-white mb-1">
                  {selectedReward.title}
                </div>

                <div className="text-sm text-white/80 mb-4">
                  {selectedReward.description}
                </div>

                <div className="flex items-center justify-center gap-2 text-cyber-green">
                  <Star className="w-5 h-5" />
                  <span className="font-bold">
                    +
                    {selectedReward.type === "xp"
                      ? selectedReward.amount + " XP"
                      : "Reward Added"}
                  </span>
                  <Star className="w-5 h-5" />
                </div>

                {/* Sparkle Effects */}
                <div className="absolute -top-2 -right-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
