import { useState, useEffect } from "react";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import GamifiedStakingAnimations from "@/components/GamifiedStakingAnimations";
import GamifiedReferralSystem from "@/components/GamifiedReferralSystem";
import { useWallet } from "@/hooks/useWallet";

interface StakingPool {
  token: "VERM" | "GRIT";
  balance: number;
  staked: number;
  rewards: number;
  apr: number;
  minimumStake: number;
  lockPeriod: number;
  programId: string;
}

interface APRTier {
  min: number;
  max: number;
  apr: number;
  bonus?: string;
}

export default function Staking() {
  const {
    connected: walletConnected,
    connect: connectWallet,
    publicKey,
    balance,
  } = useWallet();
  const [selectedPool, setSelectedPool] = useState<"VERM" | "GRIT">("VERM");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const [referralData, setReferralData] = useState({
    totalReferrals: 5,
    confirmedReferrals: 3,
    pendingReferrals: 2,
    totalEarned: 6000,
    monthlyEarned: 4000,
    referralCode: "",
    currentTier: 0,
  });

  const [stakingPools, setStakingPools] = useState<StakingPool[]>([
    {
      token: "VERM",
      balance: 1250.75,
      staked: 5000,
      rewards: 156.42,
      apr: 9.8,
      minimumStake: 1000,
      lockPeriod: 0, // No lock period
      programId: "4gPquGRAh4cLqLGXKu6TdeeqTp5MA8N6KDriPaSRhc86",
    },
    {
      token: "GRIT",
      balance: 850.25,
      staked: 2500,
      rewards: 89.33,
      apr: 18.5,
      minimumStake: 500,
      lockPeriod: 7, // 7 days
      programId: "EdabwrorVWrqix5zhY9FpEBuBR1bqLRtcMvnGrnJ8ePp",
    },
  ]);

  const vermAPRTiers: APRTier[] = [
    { min: 1000, max: 4999, apr: 3.69 },
    { min: 5000, max: 9999, apr: 9.8, bonus: "Early Adopter" },
    { min: 10000, max: 49999, apr: 15.3, bonus: "Active Staker" },
    { min: 50000, max: 99999, apr: 24.6, bonus: "Whale Status" },
    { min: 100000, max: Infinity, apr: 36.9, bonus: "Legend Tier" },
  ];

  const getCurrentTier = (amount: number) => {
    return (
      vermAPRTiers.find((tier) => amount >= tier.min && amount <= tier.max) ||
      vermAPRTiers[0]
    );
  };

  const stakeTokens = async () => {
    if (!stakeAmount || !walletConnected) return;

    setIsStaking(true);

    try {
      // Simulate staking transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const amount = parseFloat(stakeAmount);
      const pool = stakingPools.find((p) => p.token === selectedPool);

      if (pool && amount <= pool.balance) {
        setStakingPools((prev) =>
          prev.map((p) =>
            p.token === selectedPool
              ? {
                  ...p,
                  balance: p.balance - amount,
                  staked: p.staked + amount,
                  apr:
                    selectedPool === "VERM"
                      ? getCurrentTier(p.staked + amount).apr
                      : p.apr,
                }
              : p,
          ),
        );
        setStakeAmount("");
      }
    } catch (error) {
      console.error("Staking failed:", error);
    } finally {
      setIsStaking(false);
    }
  };

  const unstakeTokens = async () => {
    if (!unstakeAmount || !walletConnected) return;

    setIsUnstaking(true);

    try {
      // Simulate unstaking transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const amount = parseFloat(unstakeAmount);
      const pool = stakingPools.find((p) => p.token === selectedPool);

      if (pool && amount <= pool.staked) {
        setStakingPools((prev) =>
          prev.map((p) =>
            p.token === selectedPool
              ? {
                  ...p,
                  balance: p.balance + amount,
                  staked: p.staked - amount,
                  apr:
                    selectedPool === "VERM"
                      ? getCurrentTier(p.staked - amount).apr
                      : p.apr,
                }
              : p,
          ),
        );
        setUnstakeAmount("");
      }
    } catch (error) {
      console.error("Unstaking failed:", error);
    } finally {
      setIsUnstaking(false);
    }
  };

  const claimRewards = async () => {
    if (!walletConnected) return;

    try {
      // Simulate reward claiming
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStakingPools((prev) =>
        prev.map((p) =>
          p.token === selectedPool
            ? { ...p, balance: p.balance + p.rewards, rewards: 0 }
            : p,
        ),
      );
    } catch (error) {
      console.error("Claiming rewards failed:", error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    // Show success notification
    alert("Referral link copied to clipboard!");
  };

  // Generate referral code from wallet
  useEffect(() => {
    if (publicKey) {
      setReferralData((prev) => ({
        ...prev,
        referralCode: publicKey.toString().slice(0, 8).toUpperCase(),
      }));
    }
  }, [publicKey]);

  const currentPool = stakingPools.find((p) => p.token === selectedPool);

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="medium" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              DUAL STAKING
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-4">
              Maximize Your Yield with VERM & GRIT
            </p>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
              <div className="flex border border-cyber-green/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowReferrals(false)}
                  className={`px-6 py-3 font-mono font-bold tracking-wider transition-all duration-300 ${
                    !showReferrals
                      ? "bg-cyber-green text-dark-bg"
                      : "bg-transparent text-cyber-green hover:bg-cyber-green/20"
                  }`}
                >
                  🚀 STAKING
                </button>
                <button
                  onClick={() => setShowReferrals(true)}
                  className={`px-6 py-3 font-mono font-bold tracking-wider transition-all duration-300 ${
                    showReferrals
                      ? "bg-cyber-purple text-dark-bg"
                      : "bg-transparent text-cyber-purple hover:bg-cyber-purple/20"
                  }`}
                >
                  👥 REFERRALS
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          {!walletConnected ? (
            <div className="text-center mb-12">
              <div className="border border-cyber-orange/30 p-8 bg-cyber-orange/5 max-w-md mx-auto">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                  CONNECT WALLET
                </h3>
                <p className="text-gray-300 font-mono text-sm mb-6">
                  Connect your Solana wallet to start earning rewards
                </p>
                <button
                  onClick={connectWallet}
                  className="px-8 py-4 bg-cyber-orange/20 border-2 border-cyber-orange text-cyber-orange font-mono font-bold tracking-wider hover:bg-cyber-orange hover:text-dark-bg transition-all duration-300 neon-border animate-pulse-glow"
                >
                  CONNECT PHANTOM WALLET
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Pool Selection */}
              <div className="flex justify-center mb-12">
                <div className="flex border border-cyber-green/30">
                  <button
                    onClick={() => setSelectedPool("VERM")}
                    className={`px-8 py-4 font-mono font-bold tracking-wider transition-all duration-300 ${
                      selectedPool === "VERM"
                        ? "bg-cyber-green text-dark-bg"
                        : "bg-transparent text-cyber-green hover:bg-cyber-green/20"
                    }`}
                  >
                    VERM POOL
                  </button>
                  <button
                    onClick={() => setSelectedPool("GRIT")}
                    className={`px-8 py-4 font-mono font-bold tracking-wider transition-all duration-300 ${
                      selectedPool === "GRIT"
                        ? "bg-cyber-blue text-dark-bg"
                        : "bg-transparent text-cyber-blue hover:bg-cyber-blue/20"
                    }`}
                  >
                    GRIT POOL
                  </button>
                </div>
              </div>

              {/* Pool Information */}
              {currentPool && (
                <div className="grid lg:grid-cols-3 gap-8 mb-12">
                  {/* Staking Stats */}
                  <div className="border border-cyber-green/30 p-6 bg-cyber-green/5 neon-border">
                    <h3 className="text-xl font-cyber font-bold text-cyber-green mb-6">
                      {currentPool.token} STATS
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-mono text-sm">
                          Balance:
                        </span>
                        <span className="text-cyber-green font-bold">
                          {currentPool.balance.toFixed(2)} {currentPool.token}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-mono text-sm">
                          Staked:
                        </span>
                        <span className="text-cyber-blue font-bold">
                          {currentPool.staked.toLocaleString()}{" "}
                          {currentPool.token}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-mono text-sm">
                          Rewards:
                        </span>
                        <span className="text-cyber-orange font-bold">
                          {currentPool.rewards.toFixed(2)} {currentPool.token}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-mono text-sm">
                          Current APR:
                        </span>
                        <span className="text-cyber-purple font-bold">
                          {currentPool.apr.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {currentPool.rewards > 0 && (
                      <button
                        onClick={claimRewards}
                        className="w-full mt-6 px-6 py-3 bg-cyber-orange/20 border-2 border-cyber-orange text-cyber-orange font-mono font-bold tracking-wider hover:bg-cyber-orange hover:text-dark-bg transition-all duration-300"
                      >
                        CLAIM REWARDS
                      </button>
                    )}

                    {currentPool.token === "VERM" && (
                      <a
                        href="https://jup.ag/tokens/Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-cyber-orange to-cyber-green hover:from-cyber-green hover:to-cyber-orange text-dark-bg font-bold rounded transition-all duration-300 text-center block text-sm"
                      >
                        🚀 BUY MORE VERM
                      </a>
                    )}
                  </div>

                  {/* Stake Interface */}
                  <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                    <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-6">
                      STAKE TOKENS
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-cyber-blue font-mono font-bold mb-2">
                          Amount to Stake
                        </label>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          max={currentPool.balance}
                          className="w-full px-4 py-3 bg-dark-bg border border-cyber-blue/30 text-gray-300 font-mono focus:border-cyber-blue focus:outline-none"
                          placeholder={`Min: ${currentPool.minimumStake} ${currentPool.token}`}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setStakeAmount(
                              (currentPool.balance * 0.25).toString(),
                            )
                          }
                          className="flex-1 px-3 py-2 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20"
                        >
                          25%
                        </button>
                        <button
                          onClick={() =>
                            setStakeAmount(
                              (currentPool.balance * 0.5).toString(),
                            )
                          }
                          className="flex-1 px-3 py-2 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20"
                        >
                          50%
                        </button>
                        <button
                          onClick={() =>
                            setStakeAmount(
                              (currentPool.balance * 0.75).toString(),
                            )
                          }
                          className="flex-1 px-3 py-2 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20"
                        >
                          75%
                        </button>
                        <button
                          onClick={() =>
                            setStakeAmount(currentPool.balance.toString())
                          }
                          className="flex-1 px-3 py-2 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20"
                        >
                          MAX
                        </button>
                      </div>

                      <button
                        onClick={stakeTokens}
                        disabled={
                          isStaking ||
                          !stakeAmount ||
                          parseFloat(stakeAmount) < currentPool.minimumStake
                        }
                        className={`w-full px-6 py-4 font-mono font-bold tracking-wider transition-all duration-300 ${
                          isStaking ||
                          !stakeAmount ||
                          parseFloat(stakeAmount) < currentPool.minimumStake
                            ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-cyber-blue/20 border-2 border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-dark-bg neon-border"
                        }`}
                      >
                        {isStaking ? (
                          <span className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            STAKING...
                          </span>
                        ) : (
                          "STAKE TOKENS"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Unstake Interface */}
                  <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
                    <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-6">
                      UNSTAKE TOKENS
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-cyber-orange font-mono font-bold mb-2">
                          Amount to Unstake
                        </label>
                        <input
                          type="number"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          max={currentPool.staked}
                          className="w-full px-4 py-3 bg-dark-bg border border-cyber-orange/30 text-gray-300 font-mono focus:border-cyber-orange focus:outline-none"
                          placeholder={`Available: ${currentPool.staked} ${currentPool.token}`}
                        />
                      </div>

                      {currentPool.lockPeriod > 0 && (
                        <div className="p-3 bg-cyber-orange/10 border border-cyber-orange/30">
                          <p className="text-cyber-orange font-mono text-xs">
                            ⚠️ Lock period: {currentPool.lockPeriod} days
                          </p>
                        </div>
                      )}

                      <button
                        onClick={unstakeTokens}
                        disabled={
                          isUnstaking ||
                          !unstakeAmount ||
                          parseFloat(unstakeAmount) > currentPool.staked
                        }
                        className={`w-full px-6 py-4 font-mono font-bold tracking-wider transition-all duration-300 ${
                          isUnstaking ||
                          !unstakeAmount ||
                          parseFloat(unstakeAmount) > currentPool.staked
                            ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-cyber-orange/20 border-2 border-cyber-orange text-cyber-orange hover:bg-cyber-orange hover:text-dark-bg"
                        }`}
                      >
                        {isUnstaking ? (
                          <span className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            UNSTAKING...
                          </span>
                        ) : (
                          "UNSTAKE TOKENS"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VERM APR Tiers (only show for VERM pool) */}
              {selectedPool === "VERM" && (
                <div className="border border-cyber-green/30 p-6 bg-cyber-green/5 mb-12">
                  <h3 className="text-xl font-cyber font-bold text-cyber-green mb-6">
                    VERM APR TIERS
                  </h3>
                  <div className="grid md:grid-cols-5 gap-4">
                    {vermAPRTiers.map((tier, index) => {
                      const isCurrentTier =
                        currentPool &&
                        currentPool.staked >= tier.min &&
                        currentPool.staked <= tier.max;
                      return (
                        <div
                          key={index}
                          className={`p-4 border text-center transition-all duration-300 ${
                            isCurrentTier
                              ? "border-cyber-green bg-cyber-green/20 neon-border"
                              : "border-gray-600 bg-gray-800/50"
                          }`}
                        >
                          <div className="text-2xl font-cyber font-bold text-cyber-green mb-2">
                            {tier.apr}%
                          </div>
                          <div className="text-gray-300 text-xs mb-2">
                            {tier.min.toLocaleString()}
                            {tier.max === Infinity
                              ? "+"
                              : ` - ${tier.max.toLocaleString()}`}
                          </div>
                          {tier.bonus && (
                            <div className="text-cyber-orange text-xs font-bold">
                              {tier.bonus}
                            </div>
                          )}
                          {isCurrentTier && (
                            <div className="text-cyber-green text-xs mt-2 font-bold">
                              CURRENT
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Smart Contract Information */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
                  <h3 className="text-lg font-cyber font-bold text-cyber-purple mb-4">
                    CONTRACT DETAILS
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400 font-mono">
                        Program ID:
                      </span>
                      <div className="text-cyber-green font-mono text-xs break-all mt-1">
                        {currentPool?.programId}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 font-mono">Network:</span>
                      <span className="text-cyber-blue font-mono ml-2">
                        Solana Mainnet
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-mono">Security:</span>
                      <span className="text-cyber-green font-mono ml-2">
                        Audited ✓
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                  <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-4">
                    YIELD CALCULATOR
                  </h3>
                  <div className="space-y-3 text-sm">
                    {currentPool && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-mono">
                            Daily Yield:
                          </span>
                          <span className="text-cyber-green font-mono">
                            {(
                              (currentPool.staked * currentPool.apr) /
                              100 /
                              365
                            ).toFixed(4)}{" "}
                            {currentPool.token}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-mono">
                            Weekly Yield:
                          </span>
                          <span className="text-cyber-green font-mono">
                            {(
                              (currentPool.staked * currentPool.apr) /
                              100 /
                              52
                            ).toFixed(2)}{" "}
                            {currentPool.token}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-mono">
                            Monthly Yield:
                          </span>
                          <span className="text-cyber-green font-mono">
                            {(
                              (currentPool.staked * currentPool.apr) /
                              100 /
                              12
                            ).toFixed(2)}{" "}
                            {currentPool.token}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-mono">
                            Annual Yield:
                          </span>
                          <span className="text-cyber-green font-mono">
                            {(
                              (currentPool.staked * currentPool.apr) /
                              100
                            ).toFixed(2)}{" "}
                            {currentPool.token}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
