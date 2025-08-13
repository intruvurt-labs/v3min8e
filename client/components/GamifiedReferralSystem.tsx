import { useState, useEffect } from "react";
import { useSpring, animated, config } from "react-spring";
import {
  Users,
  Gift,
  Copy,
  Trophy,
  Star,
  Zap,
  Target,
  TrendingUp,
  Award,
  Crown,
} from "lucide-react";

interface ReferralTier {
  name: string;
  minReferrals: number;
  bonusMultiplier: number;
  color: string;
  icon: JSX.Element;
  perks: string[];
}

interface ReferralData {
  totalReferrals: number;
  confirmedReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  monthlyEarned: number;
  referralCode: string;
  currentTier: number;
}

interface GamifiedReferralSystemProps {
  referralData: ReferralData;
  onCopyReferralLink: () => void;
}

export default function GamifiedReferralSystem({
  referralData,
  onCopyReferralLink,
}: GamifiedReferralSystemProps) {
  const [showTierUpgrade, setShowTierUpgrade] = useState(false);
  const [animateEarnings, setAnimateEarnings] = useState(false);

  const referralTiers: ReferralTier[] = [
    {
      name: "Recruit",
      minReferrals: 0,
      bonusMultiplier: 1,
      color: "text-gray-400",
      icon: <Users className="w-5 h-5" />,
      perks: ["2000 VERM per referral", "Basic referral tracking"],
    },
    {
      name: "Advocate",
      minReferrals: 5,
      bonusMultiplier: 1.1,
      color: "text-blue-400",
      icon: <Star className="w-5 h-5" />,
      perks: [
        "2200 VERM per referral",
        "Referral analytics",
        "Priority support",
      ],
    },
    {
      name: "Influencer",
      minReferrals: 15,
      bonusMultiplier: 1.25,
      color: "text-purple-400",
      icon: <Zap className="w-5 h-5" />,
      perks: [
        "2500 VERM per referral",
        "Custom referral codes",
        "Exclusive features",
      ],
    },
    {
      name: "Ambassador",
      minReferrals: 50,
      bonusMultiplier: 1.5,
      color: "text-yellow-400",
      icon: <Trophy className="w-5 h-5" />,
      perks: [
        "3000 VERM per referral",
        "Revenue sharing",
        "Direct team access",
      ],
    },
    {
      name: "Legend",
      minReferrals: 100,
      bonusMultiplier: 2,
      color: "text-cyan-400",
      icon: <Crown className="w-5 h-5" />,
      perks: [
        "4000 VERM per referral",
        "Partnership opportunities",
        "Governance voting",
      ],
    },
  ];

  const getCurrentTier = () => {
    return referralTiers.findIndex(
      (tier, index) =>
        referralData.confirmedReferrals >= tier.minReferrals &&
        (index === referralTiers.length - 1 ||
          referralData.confirmedReferrals <
            referralTiers[index + 1].minReferrals),
    );
  };

  const getNextTier = () => {
    const currentIndex = getCurrentTier();
    return currentIndex < referralTiers.length - 1
      ? referralTiers[currentIndex + 1]
      : null;
  };

  const getProgressToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier) return 100;

    const currentTierIndex = getCurrentTier();
    const currentTierMin = referralTiers[currentTierIndex].minReferrals;
    const nextTierMin = nextTier.minReferrals;

    return Math.min(
      ((referralData.confirmedReferrals - currentTierMin) /
        (nextTierMin - currentTierMin)) *
        100,
      100,
    );
  };

  const currentTier = referralTiers[getCurrentTier()];
  const nextTier = getNextTier();

  // Animations
  const progressAnimation = useSpring({
    width: `${getProgressToNextTier()}%`,
    config: config.molasses,
  });

  const earningsAnimation = useSpring({
    number: referralData.totalEarned,
    config: config.gentle,
  });

  const referralCountAnimation = useSpring({
    number: referralData.confirmedReferrals,
    config: config.wobbly,
  });

  const tierUpgradeAnimation = useSpring({
    opacity: showTierUpgrade ? 1 : 0,
    scale: showTierUpgrade ? 1 : 0,
    config: config.wobbly,
  });

  // Check for tier upgrades
  useEffect(() => {
    const newTierIndex = getCurrentTier();
    if (newTierIndex > referralData.currentTier) {
      setShowTierUpgrade(true);
      setTimeout(() => setShowTierUpgrade(false), 4000);
    }
  }, [referralData.confirmedReferrals, referralData.currentTier]);

  // Animate earnings when they change
  useEffect(() => {
    setAnimateEarnings(true);
    const timer = setTimeout(() => setAnimateEarnings(false), 1000);
    return () => clearTimeout(timer);
  }, [referralData.totalEarned]);

  return (
    <div className="space-y-6">
      {/* Tier Upgrade Celebration */}
      <animated.div
        style={tierUpgradeAnimation}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="text-center p-8 bg-cyber-purple/20 border border-cyber-purple rounded-lg">
          <div className="text-6xl mb-4">🎊</div>
          <h2 className="text-4xl font-cyber font-bold text-cyber-purple neon-glow mb-2">
            TIER UPGRADE!
          </h2>
          <p className="text-xl text-cyber-blue font-mono">
            Welcome to {currentTier.name} Status!
          </p>
          <p className="text-lg text-cyber-green font-mono mt-2">
            New bonus: {Math.round((currentTier.bonusMultiplier - 1) * 100)}%
            extra rewards
          </p>
        </div>
      </animated.div>

      {/* Current Tier Status */}
      <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 ${currentTier.color} animate-pulse`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`${currentTier.color} mr-3 animate-pulse`}>
                {currentTier.icon}
              </div>
              <div>
                <h3 className="text-2xl font-cyber font-bold text-cyber-purple">
                  {currentTier.name}
                </h3>
                <p className="text-sm text-gray-400 font-mono">
                  Referral Tier {getCurrentTier() + 1}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-cyber-green">
                +{Math.round((currentTier.bonusMultiplier - 1) * 100)}%
              </div>
              <p className="text-sm text-gray-400">Bonus Multiplier</p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress to {nextTier.name}</span>
                <span>
                  {referralData.confirmedReferrals} / {nextTier.minReferrals}{" "}
                  referrals
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                <animated.div
                  style={progressAnimation}
                  className="h-full bg-gradient-to-r from-cyber-purple to-cyber-pink rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </animated.div>
              </div>
              <p className="text-xs text-cyber-blue mt-1 font-mono">
                {nextTier.minReferrals - referralData.confirmedReferrals} more
                referrals to unlock {nextTier.name}
              </p>
            </div>
          )}

          {/* Current Tier Perks */}
          <div>
            <h4 className="text-sm font-bold text-cyber-purple mb-2">
              CURRENT PERKS:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentTier.perks.map((perk, index) => (
                <div
                  key={index}
                  className="flex items-center text-sm text-gray-300"
                >
                  <Award className="w-3 h-3 text-cyber-green mr-2" />
                  {perk}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-cyber-green/30 p-4 bg-cyber-green/5 text-center relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 bg-cyber-green animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          <animated.div className="text-2xl font-bold text-cyber-green relative z-10">
            {referralCountAnimation.number.to((n) => Math.floor(n))}
          </animated.div>
          <p className="text-sm text-gray-400 font-mono relative z-10">
            Confirmed
          </p>
        </div>

        <div className="border border-cyber-orange/30 p-4 bg-cyber-orange/5 text-center">
          <div className="text-2xl font-bold text-cyber-orange">
            {referralData.pendingReferrals}
          </div>
          <p className="text-sm text-gray-400 font-mono">Pending</p>
        </div>

        <div
          className={`border border-cyber-blue/30 p-4 bg-cyber-blue/5 text-center transition-all duration-500 ${animateEarnings ? "animate-pulse scale-105" : ""}`}
        >
          <animated.div className="text-2xl font-bold text-cyber-blue">
            {earningsAnimation.number.to((n) => Math.floor(n).toLocaleString())}
          </animated.div>
          <p className="text-sm text-gray-400 font-mono">Total VERM</p>
        </div>

        <div className="border border-cyber-purple/30 p-4 bg-cyber-purple/5 text-center">
          <div className="text-2xl font-bold text-cyber-purple">
            {referralData.monthlyEarned.toLocaleString()}
          </div>
          <p className="text-sm text-gray-400 font-mono">This Month</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
        <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4 flex items-center">
          <Gift className="w-5 h-5 mr-2" />
          YOUR REFERRAL LINK
        </h3>

        <div className="flex items-center space-x-4 mb-4">
          <code className="flex-1 bg-dark-bg border border-cyber-green/30 px-4 py-3 rounded font-mono text-sm text-cyber-green">
            {`${window.location.origin}?ref=${referralData.referralCode}`}
          </code>
          <button
            onClick={onCopyReferralLink}
            className="px-6 py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 font-bold rounded flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            COPY
          </button>
        </div>

        <div className="text-sm text-gray-400 text-center">
          Share this link to earn{" "}
          <span className="text-cyber-green font-bold">
            {Math.round(2000 * currentTier.bonusMultiplier)} VERM
          </span>{" "}
          for each confirmed referral!
        </div>
      </div>

      {/* Tier Progression Roadmap */}
      <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
        <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          REFERRAL ROADMAP
        </h3>

        <div className="space-y-3">
          {referralTiers.map((tier, index) => {
            const isCurrentTier = index === getCurrentTier();
            const isUnlocked =
              referralData.confirmedReferrals >= tier.minReferrals;

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded transition-all duration-300 ${
                  isCurrentTier
                    ? "bg-cyber-purple/20 border border-cyber-purple/50"
                    : isUnlocked
                      ? "bg-gray-800/50"
                      : "bg-gray-900/30 opacity-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`${tier.color} mr-3 ${isCurrentTier ? "animate-pulse" : ""}`}
                  >
                    {tier.icon}
                  </div>
                  <div>
                    <p
                      className={`font-bold ${isCurrentTier ? "text-cyber-purple" : "text-gray-300"}`}
                    >
                      {tier.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tier.minReferrals}+ referrals
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tier.color}`}>
                    {Math.round(2000 * tier.bonusMultiplier)} VERM
                  </p>
                  <p className="text-xs text-gray-400">per referral</p>
                </div>
                {isCurrentTier && (
                  <div className="ml-2">
                    <TrendingUp className="w-4 h-4 text-cyber-purple animate-bounce" />
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
