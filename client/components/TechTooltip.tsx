import { useState, useRef } from "react";
import { HelpCircle, Info } from "lucide-react";

interface TechTooltipProps {
  term: string;
  definition: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  variant?: "inline" | "icon" | "underline";
}

export default function TechTooltip({
  term,
  definition,
  children,
  position = "top",
  variant = "underline",
}: TechTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileTooltipOpen, setIsMobileTooltipOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  const toggleMobileTooltip = () => {
    setIsMobileTooltipOpen(!isMobileTooltipOpen);
  };

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

  const renderContent = () => {
    if (variant === "icon") {
      return (
        <span className="inline-flex items-center gap-1">
          {children}
          <HelpCircle className="w-3 h-3 text-cyber-blue/60 hover:text-cyber-blue transition-colors cursor-help" />
        </span>
      );
    }

    if (variant === "underline") {
      return (
        <span className="border-b border-dotted border-cyber-blue/50 cursor-help hover:border-cyber-blue transition-colors">
          {children}
        </span>
      );
    }

    return children;
  };

  return (
    <span className="relative inline-block">
      {/* Desktop tooltip */}
      <span
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={toggleMobileTooltip}
        className="inline-block"
      >
        {renderContent()}
      </span>

      {/* Tooltip content */}
      {(isVisible || isMobileTooltipOpen) && (
        <div
          className={`absolute z-50 w-64 p-3 bg-dark-bg border-2 border-cyber-blue/50 shadow-lg neon-border animate-onboarding-fade-in ${positionClasses[position]}`}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />

          {/* Content */}
          <div>
            <div className="text-cyber-blue font-cyber font-bold text-sm mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {term}
            </div>
            <p className="text-gray-300 font-mono text-xs leading-relaxed">
              {definition}
            </p>
          </div>

          {/* Mobile close indicator */}
          {isMobileTooltipOpen && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setIsMobileTooltipOpen(false)}
                className="text-cyber-orange text-xs hover:text-cyber-green transition-colors"
              >
                Tap to close
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// Pre-defined tooltips for common NimRev terms
export function VermTooltip({ children }: { children: React.ReactNode }) {
  return (
    <TechTooltip
      term="VERM Token"
      definition="NimRev's native utility token used for payments, staking, and accessing premium features. VERM stands for 'Vermin' - our term for advanced threat detection agents."
    >
      {children}
    </TechTooltip>
  );
}

export function SubversionSweepTooltip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TechTooltip
      term="SUBVERSION SWEEP"
      definition="NimRev's proprietary 24/7 blockchain monitoring technology that detects threats by analyzing what attackers try to hide rather than what they show."
    >
      {children}
    </TechTooltip>
  );
}

export function ThreatScoringTooltip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TechTooltip
      term="Threat Scoring (0-100)"
      definition="Our AI-powered risk assessment scale: 0-30 = High Risk (immediate alerts), 31-70 = Neutral (monitored), 71-100 = Alpha Signals (potential opportunities)."
    >
      {children}
    </TechTooltip>
  );
}

export function HackerProofTooltip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TechTooltip
      term="Hacker-Proof Validation"
      definition="Multi-layer security protocol using AI pattern recognition, manual expert review, and cryptographic verification to ensure audit integrity."
    >
      {children}
    </TechTooltip>
  );
}

export function FlaggedAuditTooltip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TechTooltip
      term="Flagged Audit"
      definition="High-risk code patterns detected by AI that require comprehensive manual review by security experts. Pricing: $3,000-$38,000 based on complexity."
    >
      {children}
    </TechTooltip>
  );
}
