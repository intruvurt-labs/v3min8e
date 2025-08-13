import { useState, useEffect, useCallback, useMemo } from "react";
import { useSpring, animated, config } from "react-spring";
import { Zap, Crown, Star, Trophy, TrendingUp, Flame } from "lucide-react";
import {
  getSafeAnimationConfig,
  AnimationCleanup,
  prefersReducedMotion,
} from "@/utils/animationUtils";

interface StakingLevel {
  name: string;
  minStake: number;
  maxStake: number;
  apr: number;
  color: string;
  icon: JSX.Element;
  particles: number;
  glowIntensity: number;
}

interface GamifiedStakingAnimationsProps {
  currentStaked: number;
  targetStaked: number;
  currentAPR: number;
  isStaking: boolean;
  rewards: number;
}

export default function GamifiedStakingAnimations({
  currentStaked,
  targetStaked,
  currentAPR,
  isStaking,
  rewards,
}: GamifiedStakingAnimationsProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [particleAnimation, setParticleAnimation] = useState(false);

  // Performance optimizations
  const animationConfig = useMemo(() => getSafeAnimationConfig(), []);
  const cleanup = useMemo(() => new AnimationCleanup(), []);
  const shouldReduceMotion = useMemo(() => prefersReducedMotion(), []);

  const stakingLevels: StakingLevel[] = [
    {
      name: "Bronze Explorer",
      minStake: 0,
      maxStake: 499,
      apr: 36.9,
      color: "text-amber-600",
      icon: <Star className="w-6 h-6" />,
      particles: 5,
      glowIntensity: 1,
    },
    {
      name: "Silver Pioneer",
      minStake: 500,
      maxStake: 999,
      apr: 98,
      color: "text-gray-400",
      icon: <Zap className="w-6 h-6" />,
      particles: 10,
      glowIntensity: 1.5,
    },
    {
      name: "Gold Warrior",
      minStake: 1000,
      maxStake: 4999,
      apr: 153,
      color: "text-yellow-400",
      icon: <Trophy className="w-6 h-6" />,
      particles: 15,
      glowIntensity: 2,
    },
    {
      name: "Platinum Master",
      minStake: 5000,
      maxStake: 9999,
      apr: 246,
      color: "text-cyan-400",
      icon: <Crown className="w-6 h-6" />,
      particles: 20,
      glowIntensity: 2.5,
    },
    {
      name: "Diamond Legend",
      minStake: 10000,
      maxStake: Infinity,
      apr: 369,
      color: "text-blue-400",
      icon: <Flame className="w-6 h-6" />,
      particles: 30,
      glowIntensity: 3,
    },
  ];

  const getCurrentLevel = (staked: number) => {
    return stakingLevels.findIndex(
      (level) => staked >= level.minStake && staked <= level.maxStake,
    );
  };

  const getNextLevel = (staked: number) => {
    const currentLevelIndex = getCurrentLevel(staked);
    return currentLevelIndex < stakingLevels.length - 1
      ? stakingLevels[currentLevelIndex + 1]
      : null;
  };

  const getProgressToNextLevel = (staked: number) => {
    const nextLevel = getNextLevel(staked);
    if (!nextLevel) return 100;

    const currentLevelIndex = getCurrentLevel(staked);
    const currentLevelMin = stakingLevels[currentLevelIndex].minStake;
    const nextLevelMin = nextLevel.minStake;

    return Math.min(
      ((staked - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100,
      100,
    );
  };

  // Optimized animations with reduced motion support
  const progressAnimation = useSpring({
    width: `${getProgressToNextLevel(currentStaked)}%`,
    config: shouldReduceMotion ? { duration: 0 } : config.molasses,
  });

  const aprAnimation = useSpring({
    number: currentAPR,
    config: shouldReduceMotion ? { duration: 0 } : config.wobbly,
  });

  const rewardsAnimation = useSpring({
    number: rewards,
    config: shouldReduceMotion ? { duration: 0 } : config.gentle,
  });

  const levelUpAnimation = useSpring({
    opacity: showLevelUp ? 1 : 0,
    scale: showLevelUp ? 1 : 0,
    config: shouldReduceMotion ? { duration: 0 } : config.wobbly,
  });

  const stakingPulse = useSpring({
    scale: shouldReduceMotion ? 1 : isStaking ? 1.05 : 1,
    opacity: shouldReduceMotion ? 1 : isStaking ? 0.8 : 1,
    config: shouldReduceMotion
      ? { duration: 0 }
      : { duration: animationConfig.animationDuration },
    loop: shouldReduceMotion ? false : isStaking,
  });

  // Check for level up
  useEffect(() => {
    const newLevel = getCurrentLevel(currentStaked);
    if (newLevel > currentLevel && currentLevel !== 0) {
      setShowLevelUp(true);
      setParticleAnimation(true);
      const timer = setTimeout(
        () => {
          setShowLevelUp(false);
          setParticleAnimation(false);
        },
        shouldReduceMotion ? 1000 : 3000,
      );

      cleanup.add(() => clearTimeout(timer));
    }
    setCurrentLevel(newLevel);
  }, [currentStaked, currentLevel, cleanup, shouldReduceMotion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup.cleanup();
  }, [cleanup]);

  // Optimized particle effect for animations
  const ParticleField = useCallback(
    ({ count, color }: { count: number; color: string }) => {
      // Reduce particle count if reduced motion is preferred or device is low-end
      const optimizedCount = shouldReduceMotion
        ? 0
        : Math.min(count, animationConfig.particleCount);

      if (optimizedCount === 0) return null;

      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: optimizedCount }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-current ${color} ${shouldReduceMotion ? "" : "animate-pulse"}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: shouldReduceMotion
                  ? "0s"
                  : `${Math.random() * 2}s`,
                animationDuration: shouldReduceMotion
                  ? "0s"
                  : `${2 + Math.random() * 3}s`,
                willChange: shouldReduceMotion ? "auto" : "opacity",
              }}
            />
          ))}
        </div>
      );
    },
    [shouldReduceMotion, animationConfig.particleCount],
  );

  const currentLevelData = stakingLevels[getCurrentLevel(currentStaked)];
  const nextLevelData = getNextLevel(currentStaked);

  return (
    <div className="relative">
      {/* Level Up Celebration */}
      <animated.div
        style={levelUpAnimation}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-cyber font-bold text-cyber-green neon-glow mb-2">
            LEVEL UP!
          </h2>
          <p className="text-xl text-cyber-blue font-mono">
            Welcome to {currentLevelData?.name}!
          </p>
          <p className="text-lg text-cyber-orange font-mono mt-2">
            New APR: {currentLevelData?.apr}%
          </p>
        </div>
      </animated.div>

      {/* Current Level Display */}
      <animated.div
        style={stakingPulse}
        className="border border-cyber-green/30 p-6 bg-cyber-green/5 mb-6 relative overflow-hidden"
      >
        <ParticleField
          count={currentLevelData?.particles || 5}
          color={currentLevelData?.color || "text-cyber-green"}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`${currentLevelData?.color} mr-3`}>
                {currentLevelData?.icon}
              </div>
              <div>
                <h3 className="text-xl font-cyber font-bold text-cyber-green">
                  {currentLevelData?.name}
                </h3>
                <p className="text-sm text-gray-400 font-mono">
                  Tier {getCurrentLevel(currentStaked) + 1} Staker
                </p>
              </div>
            </div>
            <div className="text-right">
              <animated.div className="text-3xl font-cyber font-bold text-cyber-orange">
                {aprAnimation.number.to((n) => `${n.toFixed(1)}%`)}
              </animated.div>
              <p className="text-sm text-gray-400 font-mono">Current APR</p>
            </div>
          </div>

          {/* Progress to Next Level */}
          {nextLevelData && (
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress to {nextLevelData.name}</span>
                <span>
                  {currentStaked.toLocaleString()} /{" "}
                  {nextLevelData.minStake.toLocaleString()} VERM
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                <animated.div
                  style={progressAnimation}
                  className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </animated.div>
              </div>
              <p className="text-xs text-cyber-blue mt-1 font-mono">
                Next tier unlocks {nextLevelData.apr}% APR
              </p>
            </div>
          )}
        </div>
      </animated.div>

      {/* Rewards Counter with Animation */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-cyber-orange/30 p-4 bg-cyber-orange/5 text-center relative overflow-hidden">
          <ParticleField count={8} color="text-cyber-orange" />
          <div className="relative z-10">
            <animated.div className="text-2xl font-bold text-cyber-orange">
              {rewardsAnimation.number.to((n) => n.toFixed(4))}
            </animated.div>
            <p className="text-sm text-gray-400 font-mono">Total Rewards</p>
          </div>
        </div>

        <div className="border border-cyber-purple/30 p-4 bg-cyber-purple/5 text-center relative overflow-hidden">
          <ParticleField count={8} color="text-cyber-purple" />
          <div className="relative z-10">
            <div className="text-2xl font-bold text-cyber-purple">
              {currentStaked.toLocaleString()}
            </div>
            <p className="text-sm text-gray-400 font-mono">VERM Staked</p>
          </div>
        </div>
      </div>

      {/* Level Progression Roadmap */}
      <div className="border border-cyber-blue/30 p-4 bg-cyber-blue/5">
        <h4 className="text-lg font-cyber font-bold text-cyber-blue mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          STAKING ROADMAP
        </h4>
        <div className="space-y-3">
          {stakingLevels.map((level, index) => {
            const isCurrentLevel = index === getCurrentLevel(currentStaked);
            const isUnlocked = currentStaked >= level.minStake;

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded transition-all duration-300 ${
                  isCurrentLevel
                    ? "bg-cyber-green/20 border border-cyber-green/50"
                    : isUnlocked
                      ? "bg-gray-800/50"
                      : "bg-gray-900/30 opacity-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`${level.color} mr-3 ${isCurrentLevel ? "animate-pulse" : ""}`}
                  >
                    {level.icon}
                  </div>
                  <div>
                    <p
                      className={`font-bold ${isCurrentLevel ? "text-cyber-green" : "text-gray-300"}`}
                    >
                      {level.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {level.minStake.toLocaleString()}
                      {level.maxStake === Infinity
                        ? "+"
                        : ` - ${level.maxStake.toLocaleString()}`}{" "}
                      VERM
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${level.color}`}>{level.apr}%</p>
                  <p className="text-xs text-gray-400">APR</p>
                </div>
                {isCurrentLevel && (
                  <div className="absolute right-2">
                    <Crown className="w-4 h-4 text-cyber-green animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
