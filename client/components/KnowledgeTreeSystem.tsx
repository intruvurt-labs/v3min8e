import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TreePine,
  Lock,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Brain,
  Target,
  Crown,
  Diamond,
  Sparkles,
  TrendingUp,
  Award,
  Book,
  Code,
  Search,
  Globe,
  Users,
  MessageSquare,
} from "lucide-react";

interface KnowledgeNode {
  id: string;
  title: string;
  description: string;
  category: "security" | "trading" | "community" | "advanced" | "expert";
  level: number;
  xpReward: number;
  tokenReward: number;
  prerequisites: string[];
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number;
  icon: React.ReactNode;
  tasks: string[];
  completedTasks: string[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  type: "level" | "achievement" | "collection" | "streak" | "social";
  requirement: number;
  currentProgress: number;
  reward: {
    xp: number;
    tokens: number;
    badge?: string;
    title?: string;
  };
  isCompleted: boolean;
  icon: React.ReactNode;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const knowledgeNodes: KnowledgeNode[] = [
  {
    id: "security-basics",
    title: "Security Fundamentals",
    description: "Learn the basics of blockchain security and threat detection",
    category: "security",
    level: 1,
    xpReward: 100,
    tokenReward: 50,
    prerequisites: [],
    isUnlocked: true,
    isCompleted: false,
    progress: 0,
    icon: <Shield className="w-6 h-6" />,
    tasks: [
      "Complete your first address scan",
      "Identify a medium-risk transaction",
      "Learn about common attack vectors",
    ],
    completedTasks: [],
  },
  {
    id: "advanced-scanning",
    title: "Advanced Scanning Techniques",
    description:
      "Master sophisticated scanning methods and pattern recognition",
    category: "security",
    level: 2,
    xpReward: 200,
    tokenReward: 100,
    prerequisites: ["security-basics"],
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    icon: <Search className="w-6 h-6" />,
    tasks: [
      "Perform 50 successful scans",
      "Detect 5 high-risk addresses",
      "Use pattern analysis tools",
    ],
    completedTasks: [],
  },
  {
    id: "community-engagement",
    title: "Community Networking",
    description: "Build connections and share knowledge with other data ghosts",
    category: "community",
    level: 1,
    xpReward: 150,
    tokenReward: 75,
    prerequisites: [],
    isUnlocked: true,
    isCompleted: false,
    progress: 0,
    icon: <Users className="w-6 h-6" />,
    tasks: [
      "Send 10 chat messages",
      "Help another user with advice",
      "Join a community discussion",
    ],
    completedTasks: [],
  },
  {
    id: "trading-mastery",
    title: "P2P Trading Expert",
    description: "Become proficient in secure peer-to-peer trading",
    category: "trading",
    level: 3,
    xpReward: 300,
    tokenReward: 200,
    prerequisites: ["security-basics", "community-engagement"],
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    icon: <TrendingUp className="w-6 h-6" />,
    tasks: [
      "Complete 3 successful P2P trades",
      "Maintain 100% trade success rate",
      "Use advanced encryption for trades",
    ],
    completedTasks: [],
  },
  {
    id: "data-ghost-elite",
    title: "Data Ghost Elite",
    description: "Achieve mastery across all domains of the network",
    category: "expert",
    level: 5,
    xpReward: 1000,
    tokenReward: 500,
    prerequisites: [
      "advanced-scanning",
      "trading-mastery",
      "community-engagement",
    ],
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    icon: <Crown className="w-6 h-6" />,
    tasks: [
      "Reach level 25",
      "Complete 1000 scans",
      "Mentor 5 new users",
      "Achieve 50-day streak",
    ],
    completedTasks: [],
  },
];

const milestones: Milestone[] = [
  {
    id: "first-scan",
    title: "First Steps",
    description: "Complete your very first address scan",
    type: "achievement",
    requirement: 1,
    currentProgress: 0,
    reward: { xp: 50, tokens: 25, badge: "Scanner Initiate" },
    isCompleted: false,
    icon: <Target className="w-5 h-5" />,
    rarity: "common",
  },
  {
    id: "scan-streak-7",
    title: "Weekly Warrior",
    description: "Maintain a 7-day scanning streak",
    type: "streak",
    requirement: 7,
    currentProgress: 3,
    reward: { xp: 200, tokens: 100, badge: "Consistent Scanner" },
    isCompleted: false,
    icon: <Zap className="w-5 h-5" />,
    rarity: "rare",
  },
  {
    id: "level-10",
    title: "Rising Ghost",
    description: "Reach level 10",
    type: "level",
    requirement: 10,
    currentProgress: 5,
    reward: { xp: 500, tokens: 250, title: "Rising Data Ghost" },
    isCompleted: false,
    icon: <Star className="w-5 h-5" />,
    rarity: "epic",
  },
  {
    id: "social-butterfly",
    title: "Community Champion",
    description: "Send 100 chat messages",
    type: "social",
    requirement: 100,
    currentProgress: 23,
    reward: { xp: 300, tokens: 150, badge: "Social Connector" },
    isCompleted: false,
    icon: <MessageSquare className="w-5 h-5" />,
    rarity: "rare",
  },
  {
    id: "threat-hunter",
    title: "Elite Threat Hunter",
    description: "Detect 100 high-risk addresses",
    type: "achievement",
    requirement: 100,
    currentProgress: 12,
    reward: {
      xp: 1000,
      tokens: 500,
      badge: "Threat Hunter Elite",
      title: "Guardian of the Network",
    },
    isCompleted: false,
    icon: <Shield className="w-5 h-5" />,
    rarity: "legendary",
  },
];

export default function KnowledgeTreeSystem() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>(knowledgeNodes);
  const [milestoneList, setMilestoneList] = useState<Milestone[]>(milestones);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "milestones">("tree");
  const [userLevel, setUserLevel] = useState(5);
  const [userXP, setUserXP] = useState(1250);

  // Update node unlock status based on prerequisites
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const allPrereqsCompleted = node.prerequisites.every(
          (prereqId) => prevNodes.find((n) => n.id === prereqId)?.isCompleted,
        );
        return {
          ...node,
          isUnlocked: node.prerequisites.length === 0 || allPrereqsCompleted,
        };
      }),
    );
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "security":
        return "from-cyber-green to-cyber-blue";
      case "trading":
        return "from-cyber-orange to-cyber-purple";
      case "community":
        return "from-cyber-blue to-cyber-cyan";
      case "advanced":
        return "from-cyber-purple to-cyber-pink";
      case "expert":
        return "from-yellow-400 to-orange-500";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getCategoryBorder = (category: string) => {
    switch (category) {
      case "security":
        return "border-cyber-green";
      case "trading":
        return "border-cyber-orange";
      case "community":
        return "border-cyber-blue";
      case "advanced":
        return "border-cyber-purple";
      case "expert":
        return "border-yellow-400";
      default:
        return "border-gray-400";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-400 bg-gray-400/10 text-gray-400";
      case "rare":
        return "border-blue-400 bg-blue-400/10 text-blue-400";
      case "epic":
        return "border-purple-400 bg-purple-400/10 text-purple-400";
      case "legendary":
        return "border-yellow-400 bg-yellow-400/10 text-yellow-400";
      default:
        return "border-gray-400 bg-gray-400/10 text-gray-400";
    }
  };

  const completeNodeTask = (nodeId: string, taskIndex: number) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === nodeId) {
          const newCompletedTasks = [
            ...node.completedTasks,
            node.tasks[taskIndex],
          ];
          const progress = (newCompletedTasks.length / node.tasks.length) * 100;
          const isCompleted = progress === 100;

          return {
            ...node,
            completedTasks: newCompletedTasks,
            progress,
            isCompleted,
          };
        }
        return node;
      }),
    );
  };

  const claimNodeReward = (node: KnowledgeNode) => {
    if (node.isCompleted) {
      setUserXP((prev) => prev + node.xpReward);
      // Add notification here
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-6 h-6 text-cyber-green" />
            <h2 className="text-2xl font-cyber font-bold text-cyber-green">
              KNOWLEDGE TREE
            </h2>
          </div>

          <div className="flex bg-dark-bg/60 border border-cyber-green/30 rounded-lg p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                viewMode === "tree"
                  ? "bg-cyber-green text-dark-bg"
                  : "text-gray-400 hover:text-cyber-green"
              }`}
            >
              Tree View
            </button>
            <button
              onClick={() => setViewMode("milestones")}
              className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                viewMode === "milestones"
                  ? "bg-cyber-green text-dark-bg"
                  : "text-gray-400 hover:text-cyber-green"
              }`}
            >
              Milestones
            </button>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-cyber font-bold text-cyber-purple">
            Level {userLevel}
          </div>
          <div className="text-sm text-gray-400">
            {userXP.toLocaleString()} XP
          </div>
        </div>
      </div>

      {viewMode === "tree" ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Knowledge Tree */}
          <div className="lg:col-span-2">
            <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-2xl p-6 backdrop-blur-xl">
              <div className="space-y-6">
                {/* Group nodes by level */}
                {[1, 2, 3, 4, 5].map((level) => {
                  const levelNodes = nodes.filter(
                    (node) => node.level === level,
                  );
                  if (levelNodes.length === 0) return null;

                  return (
                    <div key={level} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-cyber font-bold text-cyber-blue">
                          LEVEL {level}
                        </div>
                        <div className="flex-1 h-px bg-cyber-blue/30"></div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {levelNodes.map((node) => (
                          <motion.div
                            key={node.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedNode(node)}
                            className={`
                              relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                              ${
                                node.isCompleted
                                  ? "bg-gradient-to-br from-cyber-green/20 to-cyber-blue/20 border-cyber-green"
                                  : node.isUnlocked
                                    ? `bg-gradient-to-br ${getCategoryColor(node.category)}/10 ${getCategoryBorder(node.category)} hover:shadow-lg`
                                    : "bg-gray-600/20 border-gray-600 opacity-50 cursor-not-allowed"
                              }
                            `}
                          >
                            {/* Lock/Complete Icon */}
                            <div className="absolute -top-2 -right-2">
                              {node.isCompleted ? (
                                <div className="w-6 h-6 bg-cyber-green rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              ) : !node.isUnlocked ? (
                                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                                  <Lock className="w-4 h-4 text-gray-400" />
                                </div>
                              ) : null}
                            </div>

                            {/* Node Content */}
                            <div className="flex items-start gap-3">
                              <div
                                className={`
                                p-2 rounded-lg ${
                                  node.isCompleted
                                    ? "bg-cyber-green text-white"
                                    : node.isUnlocked
                                      ? `bg-gradient-to-br ${getCategoryColor(node.category)} text-white`
                                      : "bg-gray-600 text-gray-400"
                                }
                              `}
                              >
                                {node.icon}
                              </div>

                              <div className="flex-1">
                                <h4 className="font-bold text-white text-sm mb-1">
                                  {node.title}
                                </h4>
                                <p className="text-gray-300 text-xs mb-2">
                                  {node.description}
                                </p>

                                {/* Progress Bar */}
                                {node.isUnlocked && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">
                                        {node.completedTasks.length}/
                                        {node.tasks.length} tasks
                                      </span>
                                      <span className="text-cyber-green">
                                        {Math.round(node.progress)}%
                                      </span>
                                    </div>
                                    <div className="h-1 bg-dark-bg rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${node.progress}%` }}
                                        transition={{ duration: 0.5 }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Rewards */}
                                <div className="flex items-center gap-3 mt-2 text-xs">
                                  <div className="flex items-center gap-1 text-cyber-purple">
                                    <Star className="w-3 h-3" />
                                    <span>{node.xpReward} XP</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-cyber-orange">
                                    <Diamond className="w-3 h-3" />
                                    <span>{node.tokenReward} VERM</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Node Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-dark-bg/60 border border-cyber-green/30 rounded-2xl p-6 backdrop-blur-xl sticky top-4">
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${getCategoryColor(selectedNode.category)} text-white`}
                    >
                      {selectedNode.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        {selectedNode.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Level {selectedNode.level}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm">
                    {selectedNode.description}
                  </p>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-cyber-green text-sm">
                      Tasks:
                    </h4>
                    {selectedNode.tasks.map((task, index) => {
                      const isCompleted =
                        selectedNode.completedTasks.includes(task);
                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-2 p-2 rounded ${
                            isCompleted ? "bg-cyber-green/20" : "bg-dark-bg/50"
                          }`}
                        >
                          <div className="mt-1">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-cyber-green" />
                            ) : (
                              <div className="w-4 h-4 border border-gray-400 rounded-full" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isCompleted ? "text-cyber-green" : "text-gray-300"
                            }`}
                          >
                            {task}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Claim Reward Button */}
                  {selectedNode.isCompleted && (
                    <button
                      onClick={() => claimNodeReward(selectedNode)}
                      className="w-full bg-gradient-to-r from-cyber-green to-cyber-blue text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Claim Rewards
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <TreePine className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a node to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Milestones View */
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestoneList.map((milestone) => (
              <motion.div
                key={milestone.id}
                whileHover={{ scale: 1.02 }}
                className={`
                  relative p-6 rounded-xl border-2 ${getRarityColor(milestone.rarity)}
                  ${milestone.isCompleted ? "opacity-75" : ""}
                `}
              >
                {/* Completion Badge */}
                {milestone.isCompleted && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyber-green rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Milestone Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      milestone.rarity === "legendary"
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                        : milestone.rarity === "epic"
                          ? "bg-gradient-to-r from-purple-400 to-purple-600"
                          : milestone.rarity === "rare"
                            ? "bg-gradient-to-r from-blue-400 to-blue-600"
                            : "bg-gradient-to-r from-gray-400 to-gray-600"
                    } text-white`}
                  >
                    {milestone.icon}
                  </div>

                  <div>
                    <h3 className="font-bold text-white">{milestone.title}</h3>
                    <p className="text-xs text-gray-400 capitalize">
                      {milestone.rarity}
                    </p>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4">
                  {milestone.description}
                </p>

                {/* Progress */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-cyber-green">
                      {milestone.currentProgress}/{milestone.requirement}
                    </span>
                  </div>
                  <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(milestone.currentProgress / milestone.requirement) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400">
                    REWARDS:
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="bg-cyber-purple/20 border border-cyber-purple/30 rounded px-2 py-1 text-cyber-purple">
                      {milestone.reward.xp} XP
                    </div>
                    <div className="bg-cyber-orange/20 border border-cyber-orange/30 rounded px-2 py-1 text-cyber-orange">
                      {milestone.reward.tokens} VERM
                    </div>
                    {milestone.reward.badge && (
                      <div className="bg-cyber-green/20 border border-cyber-green/30 rounded px-2 py-1 text-cyber-green">
                        {milestone.reward.badge}
                      </div>
                    )}
                    {milestone.reward.title && (
                      <div className="bg-yellow-400/20 border border-yellow-400/30 rounded px-2 py-1 text-yellow-400">
                        {milestone.reward.title}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
