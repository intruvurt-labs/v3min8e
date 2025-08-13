import { useState, useEffect } from "react";
import { useSpring, animated } from "react-spring";

interface TreeNode {
  id: string;
  type: "root" | "branch" | "leaf" | "fruit";
  level: number;
  verified: boolean;
  threatLevel: number;
  pattern: string;
}

interface SimpleKnowledgeTreeProps {
  userLevel: number;
  scanCount: number;
  verifiedPatterns: number;
  className?: string;
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
      });
    }
  }

  return nodes;
};

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
    transform: `scale(${isHovered ? 1.1 : 1})`,
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
        return "w-4 h-4";
      case "branch":
        return "w-3 h-3";
      case "leaf":
        return "w-2 h-2";
      case "fruit":
        return "w-3 h-3";
      default:
        return "w-2 h-2";
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
        return "🟢";
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
        className={`${getNodeSize()} flex items-center justify-center text-xs`}
      >
        {getNodeIcon()}
      </div>
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-bg border border-cyber-green/30 rounded text-xs whitespace-nowrap z-10">
          {node.pattern}
        </div>
      )}
    </animated.div>
  );
}

export default function SimpleKnowledgeTree({
  userLevel,
  scanCount,
  verifiedPatterns,
  className = "",
}: SimpleKnowledgeTreeProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [treeStage, setTreeStage] = useState("seed");

  useEffect(() => {
    const stage = getTreeStage(scanCount, verifiedPatterns);
    setTreeStage(stage);
    setNodes(generateNodes(stage, scanCount, verifiedPatterns));
  }, [scanCount, verifiedPatterns]);

  const organizeNodesByLevel = (nodes: TreeNode[]) => {
    const levels: { [key: number]: TreeNode[] } = {};
    nodes.forEach((node) => {
      if (!levels[node.level]) levels[node.level] = [];
      levels[node.level].push(node);
    });
    return levels;
  };

  const nodesByLevel = organizeNodesByLevel(nodes);

  return (
    <div className={`${className}`}>
      {/* Tree Visualization */}
      <div className="min-h-80 bg-dark-bg border border-cyber-green/30 rounded p-8 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Tree Structure */}
        <div className="relative z-10 flex flex-col items-center space-y-8">
          {Object.keys(nodesByLevel)
            .sort()
            .map((levelKey) => {
              const level = parseInt(levelKey);
              const levelNodes = nodesByLevel[level];

              return (
                <div key={level} className="flex justify-center space-x-6">
                  {levelNodes.map((node, index) => (
                    <TreeNodeComponent
                      key={node.id}
                      node={node}
                      index={index}
                      onSelect={() => setSelectedNode(node)}
                    />
                  ))}
                </div>
              );
            })}
        </div>

        {/* Growth Animation Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="w-full h-full animate-pulse opacity-20"
            style={{
              background: `radial-gradient(circle at center bottom, rgba(0, 255, 136, 0.3) 0%, transparent 70%)`,
            }}
          />
        </div>
      </div>

      {/* Tree Information Panel */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tree Stats */}
        <div className="p-4 bg-cyber-green/5 border border-cyber-green/30 rounded">
          <h4 className="text-cyber-green font-bold mb-3 flex items-center">
            🌱 KNOWLEDGE TREE STATUS
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Stage:</span>
              <span className="text-cyber-green font-bold uppercase">
                {treeStage.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Nodes:</span>
              <span className="text-cyber-blue font-bold">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Verified Patterns:</span>
              <span className="text-cyber-orange font-bold">
                {verifiedPatterns}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">User Level:</span>
              <span className="text-cyber-purple font-bold">{userLevel}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Growth Progress</span>
              <span>{Math.min(100, (scanCount / 50) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded">
              <div
                className="bg-gradient-to-r from-cyber-green to-cyber-blue h-2 rounded transition-all duration-1000"
                style={{ width: `${Math.min(100, (scanCount / 50) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Selected Node Details */}
        <div className="p-4 bg-cyber-blue/5 border border-cyber-blue/30 rounded">
          <h4 className="text-cyber-blue font-bold mb-3 flex items-center">
            🔍 NODE ANALYSIS
          </h4>
          {selectedNode ? (
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
                <span className="text-gray-400">Level:</span>
                <span className="text-cyber-purple font-bold">
                  {selectedNode.level}
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
              <div className="flex justify-between">
                <span className="text-gray-400">Threat Level:</span>
                <span
                  className={`font-bold ${selectedNode.threatLevel > 70 ? "text-red-400" : selectedNode.threatLevel > 30 ? "text-cyber-orange" : "text-cyber-green"}`}
                >
                  {selectedNode.threatLevel.toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm text-center py-8">
              Hover over nodes in the tree to view details
            </div>
          )}
        </div>
      </div>

      {/* Growth Milestones */}
      {treeStage !== "seed" && (
        <div className="mt-4 p-3 bg-cyber-purple/10 border border-cyber-purple/30 rounded">
          <div className="text-cyber-purple text-sm font-bold flex items-center">
            🎉 Growth Milestone: {treeStage.replace("_", " ").toUpperCase()}!
            <span className="ml-auto text-xs text-gray-400">
              Next milestone at {Math.ceil(scanCount / 10) * 10} scans
            </span>
          </div>
          <div className="text-gray-400 text-xs mt-1">
            Continue scanning to grow your knowledge tree and unlock advanced
            pattern recognition
          </div>
        </div>
      )}
    </div>
  );
}
