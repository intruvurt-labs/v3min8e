import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Sphere, Box, Line } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";

interface TreeNode {
  id: string;
  type: "root" | "branch" | "leaf" | "fruit";
  position: [number, number, number];
  verified: boolean;
  threatLevel: number;
  connections: string[];
  data: {
    address?: string;
    network?: string;
    riskScore?: number;
    pattern?: string;
  };
}

interface KnowledgeTree3DProps {
  userLevel: number;
  scanCount: number;
  verifiedPatterns: number;
  className?: string;
}

// Tree growth stages based on user progression
const getTreeStage = (scanCount: number, verifiedPatterns: number) => {
  if (scanCount === 0) return "seed";
  if (scanCount < 5) return "sprout";
  if (scanCount < 15) return "sapling";
  if (scanCount < 50) return "young_tree";
  if (verifiedPatterns > 10) return "mature_tree";
  return "fruit_bearing";
};

// Generate tree nodes based on progression
const generateTreeNodes = (
  stage: string,
  scanCount: number,
  verifiedPatterns: number,
): TreeNode[] => {
  const nodes: TreeNode[] = [];

  // Root node (always present)
  nodes.push({
    id: "root",
    type: "root",
    position: [0, -2, 0],
    verified: true,
    threatLevel: 0,
    connections: [],
    data: { pattern: "NIMREV_CORE" },
  });

  if (stage === "seed") return nodes;

  // Trunk branches (appear after first scan)
  if (scanCount > 0) {
    for (let i = 0; i < Math.min(3, Math.floor(scanCount / 2) + 1); i++) {
      const angle = (i * Math.PI * 2) / 3;
      nodes.push({
        id: `trunk_${i}`,
        type: "branch",
        position: [Math.cos(angle) * 0.5, -1 + i * 0.3, Math.sin(angle) * 0.5],
        verified: i < verifiedPatterns,
        threatLevel: Math.random() * 100,
        connections: ["root"],
        data: { pattern: `SCAN_BRANCH_${i}` },
      });
    }
  }

  // Pattern leaves (grow with each scan)
  if (stage !== "seed" && stage !== "sprout") {
    for (let i = 0; i < Math.min(scanCount, 20); i++) {
      const branch = Math.floor(i / 7);
      const leafAngle = i * Math.PI * 0.618 * 2; // Golden ratio distribution
      const radius = 1 + Math.random() * 1.5;
      const height = branch * 0.5 + Math.random() * 1.5;

      nodes.push({
        id: `leaf_${i}`,
        type: "leaf",
        position: [
          Math.cos(leafAngle) * radius,
          height,
          Math.sin(leafAngle) * radius,
        ],
        verified: i < verifiedPatterns,
        threatLevel: Math.random() * 100,
        connections: [`trunk_${branch}`],
        data: {
          pattern: `PATTERN_${i}`,
          riskScore: Math.floor(Math.random() * 100),
        },
      });
    }
  }

  // Fruit nodes (appear when patterns are verified)
  if (verifiedPatterns > 5) {
    for (let i = 0; i < Math.min(verifiedPatterns - 5, 8); i++) {
      const fruitAngle = i * Math.PI * 0.618 * 2;
      const radius = 0.8 + Math.random() * 0.7;

      nodes.push({
        id: `fruit_${i}`,
        type: "fruit",
        position: [
          Math.cos(fruitAngle) * radius,
          1.5 + Math.random() * 1,
          Math.sin(fruitAngle) * radius,
        ],
        verified: true,
        threatLevel: 10 + Math.random() * 20, // Low threat for verified patterns
        connections: [`leaf_${i * 2}`],
        data: {
          pattern: `VERIFIED_PATTERN_${i}`,
          riskScore: Math.floor(Math.random() * 30), // Low risk for fruits
        },
      });
    }
  }

  return nodes;
};

// Animated tree node component
function TreeNode({
  node,
  isSelected,
  onClick,
}: {
  node: TreeNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { scale, color } = useSpring({
    scale: isSelected ? 1.3 : 1,
    color: node.verified
      ? "#00ff88"
      : node.threatLevel > 70
        ? "#ff4444"
        : "#44aaff",
    config: { tension: 300, friction: 10 },
  });

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      if (node.type === "fruit") {
        meshRef.current.position.y =
          node.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const getNodeGeometry = () => {
    switch (node.type) {
      case "root":
        return <Box args={[0.3, 0.8, 0.3]} />;
      case "branch":
        return <Box args={[0.15, 0.6, 0.15]} />;
      case "leaf":
        return <Sphere args={[0.1]} />;
      case "fruit":
        return <Sphere args={[0.15]} />;
      default:
        return <Sphere args={[0.1]} />;
    }
  };

  return (
    <animated.mesh
      ref={meshRef}
      position={node.position}
      scale={scale}
      onClick={onClick}
    >
      {getNodeGeometry()}
      <animated.meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
      />

      {/* Node label */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.08}
        color="#00ff88"
        anchorX="center"
        anchorY="middle"
      >
        {node.data.pattern?.substring(0, 8)}
      </Text>
    </animated.mesh>
  );
}

// Connection lines between nodes
function TreeConnections({ nodes }: { nodes: TreeNode[] }) {
  const connections = nodes.flatMap((node) =>
    node.connections
      .map((connectionId) => {
        const connectedNode = nodes.find((n) => n.id === connectionId);
        if (connectedNode) {
          return [node.position, connectedNode.position];
        }
        return null;
      })
      .filter(Boolean),
  );

  return (
    <>
      {connections.map((connection, index) => (
        <Line
          key={index}
          points={connection as [number, number, number][]}
          color="#00ff88"
          lineWidth={2}
          opacity={0.6}
        />
      ))}
    </>
  );
}

// Main 3D scene
function TreeScene({
  nodes,
  selectedNode,
  onNodeClick,
}: {
  nodes: TreeNode[];
  selectedNode: string | null;
  onNodeClick: (nodeId: string) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ff88" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4488ff" />

      {/* Tree nodes */}
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          onClick={() => onNodeClick(node.id)}
        />
      ))}

      {/* Connections */}
      <TreeConnections nodes={nodes} />

      {/* Ground plane */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#001122" transparent opacity={0.3} />
      </mesh>

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
}

export default function KnowledgeTree3D({
  userLevel,
  scanCount,
  verifiedPatterns,
  className = "",
}: KnowledgeTree3DProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [treeStage, setTreeStage] = useState("seed");

  useEffect(() => {
    const stage = getTreeStage(scanCount, verifiedPatterns);
    setTreeStage(stage);
    setNodes(generateTreeNodes(stage, scanCount, verifiedPatterns));
  }, [scanCount, verifiedPatterns]);

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className={`relative ${className}`}>
      {/* 3D Canvas */}
      <div className="h-96 bg-dark-bg border border-cyber-green/30 rounded">
        <Canvas camera={{ position: [5, 2, 5], fov: 60 }}>
          <Suspense fallback={null}>
            <TreeScene
              nodes={nodes}
              selectedNode={selectedNode}
              onNodeClick={setSelectedNode}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Tree Information Panel */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <span className="text-gray-400">Nodes:</span>
              <span className="text-cyber-blue font-bold">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Verified Patterns:</span>
              <span className="text-cyber-orange font-bold">
                {verifiedPatterns}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Growth Level:</span>
              <span className="text-cyber-purple font-bold">{userLevel}</span>
            </div>
          </div>

          {/* Progress to next stage */}
          <div className="mt-3">
            <div className="text-xs text-gray-400 mb-1">Growth Progress</div>
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
          {selectedNodeData ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-cyber-green font-bold uppercase">
                  {selectedNodeData.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pattern:</span>
                <span className="text-cyber-blue font-bold font-mono text-xs">
                  {selectedNodeData.data.pattern}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Verified:</span>
                <span
                  className={`font-bold ${selectedNodeData.verified ? "text-cyber-green" : "text-red-400"}`}
                >
                  {selectedNodeData.verified ? "✓ YES" : "✗ NO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Threat Level:</span>
                <span
                  className={`font-bold ${selectedNodeData.threatLevel > 70 ? "text-red-400" : selectedNodeData.threatLevel > 30 ? "text-cyber-orange" : "text-cyber-green"}`}
                >
                  {selectedNodeData.threatLevel.toFixed(1)}%
                </span>
              </div>
              {selectedNodeData.data.riskScore && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Score:</span>
                  <span className="text-cyber-purple font-bold">
                    {selectedNodeData.data.riskScore}/100
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm text-center py-8">
              Click on a node to view detailed analysis
            </div>
          )}
        </div>
      </div>

      {/* Growth Milestone Notifications */}
      {treeStage !== "seed" && (
        <div className="mt-4 p-3 bg-cyber-purple/10 border border-cyber-purple/30 rounded">
          <div className="text-cyber-purple text-sm font-bold">
            🎉 Growth Milestone Unlocked:{" "}
            {treeStage.replace("_", " ").toUpperCase()}!
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
