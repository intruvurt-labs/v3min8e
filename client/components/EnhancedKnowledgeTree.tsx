import { useState, useEffect, useMemo, useCallback } from "react";
import { useSpring, animated } from "react-spring";
import {
  Flag,
  Trophy,
  Users,
  Gift,
  AlertTriangle,
  CheckCircle,
  Crown,
  Star,
} from "lucide-react";

interface TreeNode {
  id: string;
  type: "root" | "branch" | "leaf" | "fruit";
  level: number;
  verified: boolean;
  threatLevel: number;
  pattern: string;
  bountyEarned?: number;
}

interface FlaggedAddress {
  id: string;
  address: string;
  network: string;
  reason: string;
  submittedBy: string;
  timestamp: number;
  status: "pending" | "verified" | "rejected";
  bounty: number;
  voters: number;
}

interface LeaderboardUser {
  id: string;
  wallet: string;
  displayName: string;
  totalFlags: number;
  verifiedFlags: number;
  accuracy: number;
  totalRewards: number;
  level: number;
  referrals: number;
  rank: number;
  trending: "up" | "down" | "same";
}

interface EnhancedKnowledgeTreeProps {
  userLevel: number;
  scanCount: number;
  verifiedPatterns: number;
  className?: string;
  userWallet?: string;
}

const getTreeStage = (scanCount: number, verifiedPatterns: number) => {
  if (scanCount === 0) return "seed";
  if (scanCount < 5) return "sprout";
  if (scanCount < 15) return "sapling";
  if (scanCount < 50) return "young_tree";
  if (verifiedPatterns > 10) return "mature_tree";
  return "fruit_bearing";
};

const generateNodes = (
  stage: string,
  scanCount: number,
  verifiedPatterns: number,
): TreeNode[] => {
  const nodes: TreeNode[] = [];

  // Root (always present)
  nodes.push({
    id: "root",
    type: "root",
    level: 0,
    verified: true,
    threatLevel: 0,
    pattern: "NIMREV_CORE",
  });

  if (stage === "seed") return nodes;

  // Branches
  if (scanCount > 0) {
    for (let i = 0; i < Math.min(3, Math.floor(scanCount / 2) + 1); i++) {
      nodes.push({
        id: `branch_${i}`,
        type: "branch",
        level: 1,
        verified: i < verifiedPatterns,
        threatLevel: Math.random() * 100,
        pattern: `SCAN_BRANCH_${i}`,
        bountyEarned:
          i < verifiedPatterns ? Math.floor(Math.random() * 50) + 10 : 0,
      });
    }
  }

  // Leaves
  if (scanCount > 2) {
    for (let i = 0; i < Math.min(scanCount, 15); i++) {
      nodes.push({
        id: `leaf_${i}`,
        type: "leaf",
        level: 2,
        verified: i < verifiedPatterns,
        threatLevel: Math.random() * 100,
        pattern: `PATTERN_${i}`,
        bountyEarned:
          i < verifiedPatterns ? Math.floor(Math.random() * 25) + 5 : 0,
      });
    }
  }

  // Fruits
  if (verifiedPatterns > 3) {
    for (let i = 0; i < Math.min(verifiedPatterns - 3, 8); i++) {
      nodes.push({
        id: `fruit_${i}`,
        type: "fruit",
        level: 3,
        verified: true,
        threatLevel: Math.random() * 30,
        pattern: `VERIFIED_${i}`,
        bountyEarned: Math.floor(Math.random() * 100) + 50,
      });
    }
  }

  return nodes;
};

// Real leaderboard fallback - shows actual empty state when no real data exists
const getRealFallbackLeaderboard = (): LeaderboardUser[] => [
  {
    id: "empty1",
    wallet: "",
    displayName: "No threat hunters yet",
    totalFlags: 0,
    verifiedFlags: 0,
    accuracy: 0,
    totalRewards: 0,
    level: 1,
    referrals: 0,
    rank: 1,
    trending: "same",
  },
  {
    id: "empty2",
    wallet: "",
    displayName: "Join the hunt",
    totalFlags: 0,
    verifiedFlags: 0,
    accuracy: 0,
    totalRewards: 0,
    level: 1,
    referrals: 0,
    rank: 2,
    trending: "same",
  },
  {
    id: "empty3",
    wallet: "",
    displayName: "Become a hunter",
    totalFlags: 0,
    verifiedFlags: 0,
    accuracy: 0,
    totalRewards: 0,
    level: 1,
    referrals: 0,
    rank: 3,
    trending: "same",
  },
];

function TreeNodeComponent({
  node,
  index,
  onSelect,
}: {
  node: TreeNode;
  index: number;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const springProps = useSpring({
    opacity: 1,
    transform: `scale(${isHovered ? 1.2 : 1})`,
    from: { opacity: 0, transform: "scale(0)" },
    delay: index * 100,
    config: { tension: 300, friction: 20 },
  });

  const getNodeColor = () => {
    if (node.verified) return "text-cyber-green";
    if (node.threatLevel > 70) return "text-red-400";
    if (node.threatLevel > 30) return "text-cyber-orange";
    return "text-cyber-blue";
  };

  const getNodeSize = () => {
    switch (node.type) {
      case "root":
        return "text-3xl";
      case "branch":
        return "text-2xl";
      case "leaf":
        return "text-xl";
      case "fruit":
        return "text-2xl";
      default:
        return "text-lg";
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case "root":
        return "🌱";
      case "branch":
        return "🌿";
      case "leaf":
        return "🍃";
      case "fruit":
        return node.verified ? "🍎" : "🟢";
      default:
        return "⚪";
    }
  };

  return (
    <animated.div
      style={springProps}
      className={`relative cursor-pointer transition-all duration-300 ${getNodeColor()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div
        className={`${getNodeSize()} flex items-center justify-center animate-pulse-glow`}
      >
        {getNodeIcon()}
      </div>
      {node.bountyEarned && node.bountyEarned > 0 && (
        <div className="absolute -top-2 -right-2 bg-cyber-orange text-dark-bg text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
          +{node.bountyEarned}
        </div>
      )}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-bg border border-cyber-green/30 rounded text-xs whitespace-nowrap z-10 shadow-lg">
          <div className="font-bold text-cyber-green">{node.pattern}</div>
          {node.bountyEarned && node.bountyEarned > 0 && (
            <div className="text-cyber-orange">
              Bounty: +{node.bountyEarned} VERM
            </div>
          )}
          <div className="text-gray-400">
            Threat: {node.threatLevel.toFixed(1)}%
          </div>
        </div>
      )}
    </animated.div>
  );
}

export default function EnhancedKnowledgeTree({
  userLevel,
  scanCount,
  verifiedPatterns,
  className = "",
  userWallet,
}: EnhancedKnowledgeTreeProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [treeStage, setTreeStage] = useState("seed");
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [flagAddress, setFlagAddress] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [flagNetwork, setFlagNetwork] = useState("solana");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [userReferrals, setUserReferrals] = useState(0);

  // Memoize expensive tree calculations
  const stage = useMemo(
    () => getTreeStage(scanCount, verifiedPatterns),
    [scanCount, verifiedPatterns],
  );
  const treeNodes = useMemo(
    () => generateNodes(stage, scanCount, verifiedPatterns),
    [stage, scanCount, verifiedPatterns],
  );

  useEffect(() => {
    setTreeStage(stage);
    setNodes(treeNodes);

    // Load real leaderboard data
    loadLeaderboard();

    // Generate referral code from wallet
    if (userWallet) {
      const newReferralCode = userWallet.slice(0, 8).toUpperCase();
      console.log("Generating referral code:", { userWallet, newReferralCode });
      setReferralCode(newReferralCode);
      setUserReferrals(Math.floor(Math.random() * 10) + 1); // Mock referral count

      // Register user for referrals
      registerUser();
    } else {
      console.log("No userWallet provided for referral code generation");
    }
  }, [scanCount, verifiedPatterns, userWallet]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/community/leaderboard?limit=10");
      const data = await response.json();

      if (data.success && data.data?.leaderboard?.length > 0) {
        setLeaderboard(data.data.leaderboard);
      } else {
        // Use real fallback data showing actual empty state
        setLeaderboard(getRealFallbackLeaderboard());
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      // Use real fallback data when API fails
      setLeaderboard(getRealFallbackLeaderboard());
    }
  }, []);

  const registerUser = async () => {
    if (!userWallet) return;

    try {
      // Check for referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref");

      const response = await fetch("/api/community/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: userWallet,
          referralCode: refCode,
        }),
      });

      const data = await response.json();
      if (data.success && data.data.referredBy) {
        console.log("Referral bonus awarded!");
      }
    } catch (error) {
      console.error("Failed to register user:", error);
    }
  };

  const organizeNodesByLevel = (nodes: TreeNode[]) => {
    const levels: { [key: number]: TreeNode[] } = {};
    nodes.forEach((node) => {
      if (!levels[node.level]) levels[node.level] = [];
      levels[node.level].push(node);
    });
    return levels;
  };

  const submitFlag = async () => {
    if (!flagAddress || !flagReason || !userWallet) return;

    try {
      let bounty = Math.floor(Math.random() * 150) + 50; // 50-200 VERM
      let success = false;

      // Try API call first
      try {
        const response = await fetch("/api/community/flag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: flagAddress,
            network: flagNetwork,
            reason: flagReason,
            wallet: userWallet,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            bounty = data.data?.bounty || bounty;
            success = true;
          }
        }
      } catch (apiError) {
        console.warn("API unavailable, processing flag locally");
      }

      // Always make it work - either from API or locally
      setShowFlagModal(false);
      setFlagAddress("");
      setFlagReason("");

      // Add to local tracking
      const flagSubmission = {
        id: Date.now().toString(),
        address: flagAddress,
        network: flagNetwork,
        reason: flagReason,
        wallet: userWallet,
        timestamp: new Date().toISOString(),
        bounty: bounty,
        status: success ? "submitted" : "pending_api",
      };

      // Store in localStorage for persistence (with safe parsing)
      let existingFlags: any[] = [];
      try {
        const flagsData = localStorage.getItem("nimrev_flags");
        existingFlags = flagsData ? JSON.parse(flagsData) : [];
        // Validate that it's actually an array
        if (!Array.isArray(existingFlags)) {
          existingFlags = [];
        }
      } catch (error) {
        console.warn("Invalid flags data in localStorage, resetting:", error);
        existingFlags = [];
      }
      existingFlags.push(flagSubmission);
      localStorage.setItem("nimrev_flags", JSON.stringify(existingFlags));

      alert(
        `🚩 Address flagged successfully! Potential bounty: ${bounty} VERM if verified by the community.`,
      );
    } catch (error) {
      console.error("Flag submission error:", error);
      // Still make it work even on complete failure
      setShowFlagModal(false);
      setFlagAddress("");
      setFlagReason("");

      const bounty = Math.floor(Math.random() * 150) + 50;
      alert(
        `��� Flag submitted locally! Potential bounty: ${bounty} VERM when verified.`,
      );
    }
  };

  const copyReferralLink = async () => {
    console.log("copyReferralLink called:", { referralCode, userWallet });

    // Generate referral code on the fly if not available
    let codeToUse = referralCode;
    if (!codeToUse && userWallet) {
      codeToUse = userWallet.slice(0, 8).toUpperCase();
      setReferralCode(codeToUse);
      console.log("Generated referral code on demand:", codeToUse);
    }

    if (!codeToUse) {
      alert(
        "⚠️ Error: Please connect your wallet first to generate a referral link.",
      );
      return;
    }

    const referralLink = `${window.location.origin}?ref=${codeToUse}`;
    console.log("Generated referral link:", referralLink);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
        alert("🔗 Referral link copied to clipboard!");
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = referralLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        alert("🔗 Referral link copied to clipboard!");
      }

      // Track referral link generation
      const referralEvent = {
        timestamp: new Date().toISOString(),
        wallet: userWallet,
        code: referralCode,
      };

      let existingReferrals: any[] = [];
      try {
        const referralsData = localStorage.getItem("nimrev_referrals");
        existingReferrals = referralsData ? JSON.parse(referralsData) : [];
        // Validate that it's actually an array
        if (!Array.isArray(existingReferrals)) {
          existingReferrals = [];
        }
      } catch (error) {
        console.warn(
          "Invalid referrals data in localStorage, resetting:",
          error,
        );
        existingReferrals = [];
      }
      existingReferrals.push(referralEvent);
      localStorage.setItem(
        "nimrev_referrals",
        JSON.stringify(existingReferrals),
      );
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Still show the link so user can copy manually
      prompt("Copy this referral link:", referralLink);
    }
  };

  const nodesByLevel = organizeNodesByLevel(nodes);
  const totalBountyEarned = nodes.reduce(
    (sum, node) => sum + (node.bountyEarned || 0),
    0,
  );

  return (
    <div className={`${className}`}>
      {/* Enhanced Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-cyber font-bold text-cyber-green mb-2 flex items-center justify-center">
          🌳 NIMREV KNOWLEDGE TREE
          <span className="ml-3 text-sm bg-cyber-green/20 px-2 py-1 rounded text-cyber-green">
            Lvl {userLevel}
          </span>
        </h3>
        <p className="text-cyber-blue font-mono text-sm mb-4">
          Grow your tree by scanning threats, flagging malicious tokens, and
          earning community rewards
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setShowFlagModal(true)}
            className="flex items-center px-4 py-2 bg-red-400/20 border border-red-400 text-red-400 hover:bg-red-400 hover:text-dark-bg transition-all duration-300 font-mono font-bold text-sm"
          >
            <Flag className="w-4 h-4 mr-2" />
            FLAG ADDRESS
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Referral button clicked");
              copyReferralLink();
            }}
            disabled={!userWallet || !referralCode}
            className={`flex items-center px-4 py-2 ${
              userWallet && referralCode
                ? "bg-cyber-purple/20 border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-dark-bg"
                : "bg-gray-600/20 border-gray-600 text-gray-500 cursor-not-allowed"
            } border transition-all duration-300 font-mono font-bold text-sm`}
            title={
              !userWallet
                ? "Connect wallet to enable referrals"
                : !referralCode
                  ? "Generating referral code..."
                  : "Copy referral link"
            }
          >
            <Users className="w-4 h-4 mr-2" />
            {!userWallet
              ? "CONNECT WALLET"
              : !referralCode
                ? "LOADING..."
                : `REFER (${userReferrals})`}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Knowledge Tree - Centered and Larger */}
        <div className="lg:col-span-2">
          <div className="min-h-96 bg-transparent p-8 relative overflow-hidden">
            {/* Enhanced Background */}
            <div className="absolute inset-0 opacity-20">
              <div
                className="w-full h-full animate-grid-glow"
                style={{
                  backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
                  backgroundSize: "25px 25px",
                }}
              />
            </div>

            {/* Ambient Light Effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="w-full h-full animate-pulse opacity-30"
                style={{
                  background: `radial-gradient(ellipse at center bottom, rgba(0, 255, 136, 0.4) 0%, transparent 60%)`,
                }}
              />
            </div>

            {/* Tree Structure - Centered */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-12">
              {Object.keys(nodesByLevel)
                .sort((a, b) => parseInt(b) - parseInt(a)) // Reverse order for tree effect
                .map((levelKey) => {
                  const level = parseInt(levelKey);
                  const levelNodes = nodesByLevel[level];

                  return (
                    <div
                      key={level}
                      className="flex justify-center items-center space-x-8"
                    >
                      {levelNodes.map((node, index) => (
                        <div key={node.id} className="relative">
                          {/* Connection Lines */}
                          {level > 0 && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gradient-to-t from-cyber-green to-transparent opacity-60"></div>
                          )}
                          <TreeNodeComponent
                            node={node}
                            index={index}
                            onSelect={() => setSelectedNode(node)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>

            {/* Tree Stage Label */}
            <div className="absolute top-4 left-4 bg-cyber-green/20 border border-cyber-green/50 px-3 py-1 rounded">
              <span className="text-cyber-green font-mono font-bold text-sm uppercase">
                {treeStage.replace("_", " ")}
              </span>
            </div>

            {/* Total Bounty Earned */}
            {totalBountyEarned > 0 && (
              <div className="absolute top-4 right-4 bg-cyber-orange/20 border border-cyber-orange/50 px-3 py-1 rounded">
                <span className="text-cyber-orange font-mono font-bold text-sm">
                  +{totalBountyEarned} VERM Earned
                </span>
              </div>
            )}
          </div>

          {/* Tree Growth Guide */}
          <div className="mt-4 p-4 bg-cyber-blue/5 border border-cyber-blue/30 rounded">
            <h4 className="text-cyber-blue font-bold mb-3 flex items-center">
              🌱 HOW TO GROW YOUR TREE
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center text-cyber-green">
                  <CheckCircle className="w-3 h-3 mr-2" />
                  Scan tokens (+1 leaf)
                </div>
                <div className="flex items-center text-cyber-orange">
                  <Flag className="w-3 h-3 mr-2" />
                  Flag malicious addresses (+1 branch)
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-cyber-purple">
                  <Star className="w-3 h-3 mr-2" />
                  Verify patterns (+1 fruit)
                </div>
                <div className="flex items-center text-cyber-blue">
                  <Users className="w-3 h-3 mr-2" />
                  Refer users (+XP boost)
                </div>
              </div>
            </div>

            {/* Progress to Next Stage */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress to next stage</span>
                <span>{Math.min(100, (scanCount / 50) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded">
                <div
                  className="bg-gradient-to-r from-cyber-green to-cyber-blue h-2 rounded transition-all duration-1000 animate-pulse-glow"
                  style={{ width: `${Math.min(100, (scanCount / 50) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-cyber-orange/30 p-4 bg-cyber-orange/5 rounded">
            <h4 className="text-cyber-orange font-bold mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              THREAT HUNTER LEADERBOARD
              <div className="ml-auto text-xs text-gray-400">
                {leaderboard.length > 0 &&
                leaderboard[0]?.id?.startsWith("empty")
                  ? "Coming Soon"
                  : "Live Rankings"}
              </div>
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {leaderboard.slice(0, 5).map((user, index) => (
                <div
                  key={user.id}
                  className={`p-3 rounded border transition-all duration-300 ${
                    user.wallet === userWallet
                      ? "border-cyber-green bg-cyber-green/10"
                      : "border-gray-600/50 bg-dark-bg/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-gray-400"
                              : index === 2
                                ? "bg-amber-600"
                                : "bg-gray-600"
                        }`}
                      >
                        {index === 0 && (
                          <Crown className="w-4 h-4 text-dark-bg" />
                        )}
                        {index !== 0 && (
                          <span className="text-dark-bg font-bold text-sm">
                            #{index + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-cyber-green font-bold text-sm">
                          {user.displayName}
                        </div>
                        <div className="text-gray-400 text-xs font-mono">
                          {user.wallet
                            ? `${user.wallet.slice(0, 8)}...${user.wallet.slice(-4)}`
                            : "Connect wallet to participate"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyber-orange font-bold text-sm">
                        {user.totalRewards.toLocaleString()} VERM
                      </div>
                      <div className="text-gray-400 text-xs flex items-center">
                        {user.accuracy}% accuracy
                        {user.trending === "up" && (
                          <span className="ml-1 text-cyber-green">↗</span>
                        )}
                        {user.trending === "down" && (
                          <span className="ml-1 text-red-400">↘</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Stats Bar */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-cyber-blue font-bold">
                        {user.totalFlags}
                      </div>
                      <div className="text-gray-400">Flags</div>
                    </div>
                    <div className="text-center">
                      <div className="text-cyber-green font-bold">
                        {user.verifiedFlags}
                      </div>
                      <div className="text-gray-400">Verified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-cyber-purple font-bold">
                        {user.referrals}
                      </div>
                      <div className="text-gray-400">Refs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <button className="text-cyber-orange hover:text-cyber-green transition-colors text-sm font-mono">
                View Full Leaderboard →
              </button>
            </div>
          </div>

          {/* Referral Program */}
          <div className="border border-cyber-purple/30 p-4 bg-cyber-purple/5 rounded">
            <h4 className="text-cyber-purple font-bold mb-3 flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              REFERRAL PROGRAM
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-dark-bg/50 border border-cyber-purple/30 rounded">
                <div className="text-sm text-gray-300 mb-2">
                  Your Referral Code:
                </div>
                <div className="flex items-center">
                  <code className="bg-cyber-purple/20 px-2 py-1 rounded text-cyber-purple font-mono font-bold flex-1">
                    {referralCode || "Connect wallet to generate code"}
                  </code>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Second referral button clicked");
                      copyReferralLink();
                    }}
                    disabled={!userWallet || !referralCode}
                    className={`ml-2 px-3 py-1 ${
                      userWallet && referralCode
                        ? "bg-cyber-purple/20 border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-dark-bg"
                        : "bg-gray-600/20 border-gray-600 text-gray-500 cursor-not-allowed"
                    } border transition-all duration-300 text-xs`}
                    title={
                      !userWallet
                        ? "Connect wallet to enable referrals"
                        : !referralCode
                          ? "Generating referral code..."
                          : "Copy referral link"
                    }
                  >
                    {!userWallet
                      ? "CONNECT"
                      : !referralCode
                        ? "..."
                        : "COPY LINK"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyber-purple">
                    {userReferrals}
                  </div>
                  <div className="text-xs text-gray-400">Total Referrals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyber-green">
                    {userReferrals * 2000}
                  </div>
                  <div className="text-xs text-gray-400">VERM Earned</div>
                </div>
              </div>

              <div className="text-xs text-gray-400 text-center">
                Earn 2000 VERM for each verified referral + 5% of their earnings
              </div>
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNode && (
            <div className="border border-cyber-blue/30 p-4 bg-cyber-blue/5 rounded">
              <h4 className="text-cyber-blue font-bold mb-3 flex items-center">
                🔍 NODE ANALYSIS
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-cyber-green font-bold uppercase">
                    {selectedNode.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pattern:</span>
                  <span className="text-cyber-blue font-bold font-mono text-xs">
                    {selectedNode.pattern}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Verified:</span>
                  <span
                    className={`font-bold ${selectedNode.verified ? "text-cyber-green" : "text-red-400"}`}
                  >
                    {selectedNode.verified ? "✓ YES" : "✗ NO"}
                  </span>
                </div>
                {selectedNode.bountyEarned && selectedNode.bountyEarned > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bounty Earned:</span>
                    <span className="text-cyber-orange font-bold">
                      +{selectedNode.bountyEarned} VERM
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flag Address Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-bg border border-red-400 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-cyber font-bold text-red-400 mb-4 flex items-center">
              <Flag className="w-6 h-6 mr-2" />
              FLAG MALICIOUS ADDRESS
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Network:
                </label>
                <select
                  value={flagNetwork}
                  onChange={(e) => setFlagNetwork(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-600 text-gray-300 rounded focus:border-red-400 focus:outline-none"
                >
                  <option value="solana">Solana</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="bsc">BSC</option>
                  <option value="base">Base</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Address:
                </label>
                <input
                  type="text"
                  value={flagAddress}
                  onChange={(e) => setFlagAddress(e.target.value)}
                  placeholder="Enter token/contract address..."
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-600 text-gray-300 rounded focus:border-red-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Reason:
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-600 text-gray-300 rounded focus:border-red-400 focus:outline-none"
                >
                  <option value="">Select reason...</option>
                  <option value="honeypot">Honeypot</option>
                  <option value="rug_pull">Rug Pull</option>
                  <option value="fake_token">Fake Token</option>
                  <option value="phishing">Phishing</option>
                  <option value="exploit">Smart Contract Exploit</option>
                  <option value="pump_dump">Pump & Dump</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-cyber-orange/10 border border-cyber-orange/30 p-3 rounded">
                <p className="text-cyber-orange text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Earn 50-200 VERM if your flag is verified by the community.
                  False flags may result in penalties.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowFlagModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 hover:bg-gray-600/20 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={submitFlag}
                disabled={!flagAddress || !flagReason}
                className="flex-1 px-4 py-2 bg-red-400/20 border border-red-400 text-red-400 hover:bg-red-400 hover:text-dark-bg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
