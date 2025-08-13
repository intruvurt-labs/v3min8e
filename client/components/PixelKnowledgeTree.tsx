import { useEffect, useState } from "react";

interface PixelKnowledgeTreeProps {
  userLevel: number;
  scanCount: number;
  verifiedPatterns: number;
  className?: string;
}

interface TreeStage {
  name: string;
  minScans: number;
  description: string;
  color: string;
}

const TREE_STAGES: TreeStage[] = [
  {
    name: "SEED",
    minScans: 0,
    description: "Starting your journey",
    color: "#666",
  },
  {
    name: "SPROUT",
    minScans: 1,
    description: "First scan completed",
    color: "#4ade80",
  },
  {
    name: "SAPLING",
    minScans: 5,
    description: "Growing knowledge",
    color: "#22c55e",
  },
  {
    name: "YOUNG TREE",
    minScans: 15,
    description: "Expanding expertise",
    color: "#16a34a",
  },
  {
    name: "MATURE TREE",
    minScans: 50,
    description: "Advanced security analyst",
    color: "#15803d",
  },
  {
    name: "ANCIENT TREE",
    minScans: 100,
    description: "Master of cyber security",
    color: "#14532d",
  },
];

export default function PixelKnowledgeTree({
  userLevel,
  scanCount,
  verifiedPatterns,
  className = "",
}: PixelKnowledgeTreeProps) {
  const [animationFrame, setAnimationFrame] = useState(0);

  // Determine current tree stage
  const currentStage = TREE_STAGES.reduce((stage, next) =>
    scanCount >= next.minScans ? next : stage,
  );

  const nextStage = TREE_STAGES.find((stage) => stage.minScans > scanCount);
  const progressToNext = nextStage
    ? Math.min(
        100,
        ((scanCount - currentStage.minScans) /
          (nextStage.minScans - currentStage.minScans)) *
          100,
      )
    : 100;

  // Animation for glowing effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 60);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Generate tree pixels based on progress
  const generateTreePixels = () => {
    const pixels: Array<{
      x: number;
      y: number;
      color: string;
      glow?: boolean;
      type?: string;
    }> = [];
    const centerX = 15;
    const groundY = 28;

    // Ground/roots
    for (let x = 5; x < 26; x++) {
      pixels.push({ x, y: groundY + 1, color: "#8B4513", type: "ground" });
      if (x > 10 && x < 20) {
        pixels.push({ x, y: groundY + 2, color: "#654321", type: "ground" });
      }
    }

    if (scanCount === 0) {
      // Just a seed
      pixels.push({ x: centerX, y: groundY, color: "#8B4513", glow: true });
      pixels.push({ x: centerX, y: groundY - 1, color: "#4ade80", glow: true });
      return pixels;
    }

    // Trunk - gets taller with more scans
    const trunkHeight = Math.min(12, 4 + Math.floor(scanCount / 3));
    for (let y = 0; y < trunkHeight; y++) {
      const trunkWidth = y < 3 ? 2 : 1;
      for (let offset = 0; offset < trunkWidth; offset++) {
        pixels.push({
          x: centerX + offset - Math.floor(trunkWidth / 2),
          y: groundY - y,
          color: y < 2 ? "#8B4513" : "#A0522D",
          type: "trunk",
        });
      }
    }

    // Branches - more complex with higher levels
    if (scanCount >= 3) {
      const branchLevels = Math.min(4, Math.floor(scanCount / 5) + 1);

      for (let level = 0; level < branchLevels; level++) {
        const branchY = groundY - trunkHeight + 2 + level * 2;
        const branchLength = Math.max(1, 3 - level);

        // Left branch
        for (let i = 1; i <= branchLength; i++) {
          pixels.push({
            x: centerX - i,
            y: branchY - Math.floor(i / 2),
            color: "#8B4513",
            type: "branch",
          });
        }

        // Right branch
        for (let i = 1; i <= branchLength; i++) {
          pixels.push({
            x: centerX + i,
            y: branchY - Math.floor(i / 2),
            color: "#8B4513",
            type: "branch",
          });
        }
      }
    }

    // Leaves - appear based on scan count and verified patterns
    if (scanCount >= 5) {
      const leafPositions = [
        // Top cluster
        { x: centerX - 1, y: groundY - trunkHeight - 1 },
        { x: centerX, y: groundY - trunkHeight - 2 },
        { x: centerX + 1, y: groundY - trunkHeight - 1 },
        { x: centerX, y: groundY - trunkHeight - 3 },
        // Side clusters
        { x: centerX - 3, y: groundY - trunkHeight + 3 },
        { x: centerX - 4, y: groundY - trunkHeight + 2 },
        { x: centerX + 3, y: groundY - trunkHeight + 3 },
        { x: centerX + 4, y: groundY - trunkHeight + 2 },
        // Additional leaves for higher levels
        { x: centerX - 2, y: groundY - trunkHeight },
        { x: centerX + 2, y: groundY - trunkHeight },
        { x: centerX - 1, y: groundY - trunkHeight + 1 },
        { x: centerX + 1, y: groundY - trunkHeight + 1 },
      ];

      const maxLeaves = Math.min(
        leafPositions.length,
        Math.floor(scanCount / 2),
      );

      for (let i = 0; i < maxLeaves; i++) {
        const pos = leafPositions[i];
        const isVerified = i < verifiedPatterns;
        const leafColor = isVerified ? "#00ff88" : "#22c55e";

        pixels.push({
          x: pos.x,
          y: pos.y,
          color: leafColor,
          glow: isVerified && animationFrame % 30 < 15,
          type: "leaf",
        });
      }
    }

    // Fruits/rewards for verified patterns
    if (verifiedPatterns > 5) {
      const fruitPositions = [
        { x: centerX - 2, y: groundY - trunkHeight + 1 },
        { x: centerX + 2, y: groundY - trunkHeight + 1 },
        { x: centerX - 1, y: groundY - trunkHeight + 2 },
        { x: centerX + 1, y: groundY - trunkHeight + 2 },
      ];

      const maxFruits = Math.min(
        fruitPositions.length,
        Math.floor(verifiedPatterns / 3),
      );

      for (let i = 0; i < maxFruits; i++) {
        const pos = fruitPositions[i];
        pixels.push({
          x: pos.x,
          y: pos.y,
          color: "#ff6b35",
          glow: animationFrame % 20 < 10,
          type: "fruit",
        });
      }
    }

    return pixels;
  };

  const treePixels = generateTreePixels();

  return (
    <div className={`relative ${className}`}>
      {/* Tree Canvas */}
      <div className="bg-gradient-to-b from-cyber-blue/10 to-cyber-green/5 border border-cyber-green/30 rounded-lg p-6 mb-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-cyber font-bold text-cyber-green mb-2 flex items-center justify-center gap-2">
            <span className="animate-pulse">🌳</span>
            KNOWLEDGE TREE
            <span className="animate-pulse">🌳</span>
          </h3>
          <p className="text-cyber-blue font-mono text-sm">
            {currentStage.description} • {currentStage.name}
          </p>
        </div>

        {/* Pixel Tree Display */}
        <div className="flex justify-center mb-6">
          <div
            className="grid gap-0 border border-cyber-green/20 bg-gradient-to-b from-blue-900/20 to-green-900/20 p-4 rounded"
            style={{
              gridTemplateColumns: "repeat(30, 8px)",
              gridTemplateRows: "repeat(32, 8px)",
              width: "240px",
              height: "256px",
            }}
          >
            {Array.from({ length: 30 * 32 }, (_, i) => {
              const x = i % 30;
              const y = Math.floor(i / 30);
              const pixel = treePixels.find((p) => p.x === x && p.y === y);

              return (
                <div
                  key={i}
                  className={`w-2 h-2 transition-all duration-300 ${
                    pixel?.glow ? "animate-pulse" : ""
                  }`}
                  style={{
                    backgroundColor: pixel?.color || "transparent",
                    boxShadow: pixel?.glow
                      ? `0 0 4px ${pixel.color}, 0 0 8px ${pixel.color}`
                      : "none",
                  }}
                  title={pixel ? `${pixel.type} (${x}, ${y})` : ""}
                />
              );
            })}
          </div>
        </div>

        {/* Tree Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-cyber-green/10 border border-cyber-green/20 rounded">
            <div className="text-lg font-bold text-cyber-green">
              {scanCount}
            </div>
            <div className="text-xs text-gray-400">Total Scans</div>
          </div>
          <div className="text-center p-3 bg-cyber-blue/10 border border-cyber-blue/20 rounded">
            <div className="text-lg font-bold text-cyber-blue">
              {verifiedPatterns}
            </div>
            <div className="text-xs text-gray-400">Verified Patterns</div>
          </div>
          <div className="text-center p-3 bg-cyber-orange/10 border border-cyber-orange/20 rounded">
            <div className="text-lg font-bold text-cyber-orange">
              {userLevel}
            </div>
            <div className="text-xs text-gray-400">Data Ghost Level</div>
          </div>
          <div className="text-center p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded">
            <div className="text-lg font-bold text-cyber-purple">
              {currentStage.name}
            </div>
            <div className="text-xs text-gray-400">Tree Stage</div>
          </div>
        </div>

        {/* Progress to Next Stage */}
        {nextStage && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress to {nextStage.name}</span>
              <span>{Math.floor(progressToNext)}%</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-1000 relative"
                style={{ width: `${progressToNext}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {nextStage.minScans - scanCount} more scans needed
            </div>
          </div>
        )}

        {/* Growth Tips */}
        <div className="mt-6 p-4 bg-cyber-green/5 border border-cyber-green/20 rounded">
          <h4 className="text-cyber-green font-bold text-sm mb-2">
            🌱 Growth Tips:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300">
            <div>• Complete more scans to grow your tree</div>
            <div>• Verify patterns to grow glowing leaves</div>
            <div>• Reach milestones to unlock new stages</div>
            <div>• Higher levels earn more XP per scan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
