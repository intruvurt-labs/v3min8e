import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";

interface QuickTipProps {
  id: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click" | "auto";
  delay?: number;
  onDismiss?: (id: string) => void;
  className?: string;
}

export default function QuickTip({
  id,
  title,
  content,
  position = "top",
  trigger = "auto",
  delay = 2000,
  onDismiss,
  className = "",
}: QuickTipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (trigger === "auto") {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [trigger, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.(id);
  };

  if (!isVisible) return null;

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-cyber-blue",
    bottom:
      "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-cyber-blue",
    left: "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-cyber-blue",
    right:
      "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-cyber-blue",
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute z-50 max-w-xs p-4 bg-dark-bg border-2 border-cyber-blue/50 shadow-lg neon-border animate-fade-in ${positionClasses[position]}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
        />

        {/* Content */}
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-cyber-blue flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-cyber-blue font-cyber font-bold text-sm mb-2">
              {title}
            </h4>
            <p className="text-gray-300 font-mono text-xs leading-relaxed">
              {content}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-cyber-orange transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {trigger === "auto" && !isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyber-blue/20">
            <div
              className="h-full bg-cyber-blue animate-shrink-width"
              style={{ animationDuration: "5s" }}
              onAnimationEnd={handleDismiss}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for floating tips
interface FloatingTipProps {
  tips: Array<{
    id: string;
    title: string;
    content: string;
    showCondition?: () => boolean;
  }>;
  onDismiss: (id: string) => void;
}

export function FloatingTips({ tips, onDismiss }: FloatingTipProps) {
  const [currentTip, setCurrentTip] = useState<number>(0);

  const activeTips = tips.filter(
    (tip) => !tip.showCondition || tip.showCondition(),
  );

  if (activeTips.length === 0) return null;

  const tip = activeTips[currentTip];

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <QuickTip
        id={tip.id}
        title={tip.title}
        content={tip.content}
        position="top"
        trigger="auto"
        delay={1000}
        onDismiss={(id) => {
          onDismiss(id);
          if (currentTip < activeTips.length - 1) {
            setCurrentTip(currentTip + 1);
          }
        }}
      />
    </div>
  );
}

// Contextual help for specific features
export function FeatureTooltip({
  children,
  title,
  content,
  position = "top",
}: {
  children: React.ReactNode;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <QuickTip
          id="feature-tooltip"
          title={title}
          content={content}
          position={position}
          trigger="hover"
        />
      )}
    </div>
  );
}
