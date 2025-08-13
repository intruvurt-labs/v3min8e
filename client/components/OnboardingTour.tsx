import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  component?: React.ReactNode;
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({
  steps,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-bg border-2 border-cyber-green/50 max-w-2xl w-full p-8 neon-border animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-2">
              Welcome to NimRev
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-cyber-blue font-mono text-sm">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep
                        ? "bg-cyber-green"
                        : "bg-cyber-green/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-cyber-orange transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
            {currentStepData.title}
          </h3>

          {currentStepData.component ? (
            <div className="mb-6">{currentStepData.component}</div>
          ) : null}

          <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6">
            {currentStepData.description}
          </p>

          {currentStepData.action && (
            <button
              onClick={currentStepData.action.onClick}
              className="px-6 py-3 bg-cyber-purple/20 border-2 border-cyber-purple text-cyber-purple font-mono font-bold hover:bg-cyber-purple hover:text-dark-bg transition-all duration-300 neon-border mb-4"
            >
              {currentStepData.action.text}
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-cyber-blue hover:text-cyber-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-cyber-orange transition-colors font-mono text-sm"
          >
            Skip Tour
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green font-mono font-bold hover:bg-cyber-green hover:text-dark-bg transition-all duration-300"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Interactive demo components for onboarding
export function WalletScanDemo() {
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const startDemo = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
      <h4 className="text-cyber-green font-bold mb-3">Try Wallet Scanner</h4>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Enter wallet address..."
          defaultValue="3x7F...8h2K"
          className="flex-1 px-3 py-2 bg-dark-bg border border-cyber-green/30 text-cyber-green font-mono text-sm focus:border-cyber-green focus:outline-none"
        />
        <button
          onClick={startDemo}
          disabled={isScanning}
          className="px-4 py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green font-mono text-sm hover:bg-cyber-green/30 transition-colors disabled:opacity-50"
        >
          {isScanning ? "Scanning..." : "Scan"}
        </button>
      </div>

      {isScanning && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-cyber-blue font-mono text-xs">
              Analyzing transactions...
            </span>
            <span className="text-cyber-green font-mono text-xs">
              {scanProgress}%
            </span>
          </div>
          <div className="w-full bg-cyber-green/20 h-2">
            <div
              className="bg-cyber-green h-2 transition-all duration-200"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {scanProgress === 100 && (
        <div className="p-3 bg-cyber-green/10 border border-cyber-green/30">
          <div className="text-cyber-green font-mono text-xs">
            ✓ Scan Complete: Low Risk (Score: 85/100)
          </div>
        </div>
      )}
    </div>
  );
}

export function ThreatFeedDemo() {
  const [threats] = useState([
    {
      id: 1,
      type: "Honeypot",
      address: "4x9A...2b5E",
      risk: "HIGH",
      time: "2s ago",
    },
    {
      id: 2,
      type: "Rug Pull",
      address: "7xF3...9c1A",
      risk: "CRITICAL",
      time: "5s ago",
    },
    {
      id: 3,
      type: "Suspicious",
      address: "2xB7...4d8C",
      risk: "MEDIUM",
      time: "12s ago",
    },
  ]);

  return (
    <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
      <h4 className="text-cyber-orange font-bold mb-3">Live Threat Feed</h4>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {threats.map((threat) => (
          <div
            key={threat.id}
            className="flex justify-between items-center p-2 bg-dark-bg/50 border border-cyber-orange/20"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  threat.risk === "CRITICAL"
                    ? "bg-red-500"
                    : threat.risk === "HIGH"
                      ? "bg-cyber-orange"
                      : "bg-yellow-500"
                }`}
              />
              <span className="text-cyber-blue font-mono text-xs">
                {threat.type}
              </span>
              <span className="text-gray-300 font-mono text-xs">
                {threat.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono px-2 py-1 rounded ${
                  threat.risk === "CRITICAL"
                    ? "bg-red-500/20 text-red-400"
                    : threat.risk === "HIGH"
                      ? "bg-cyber-orange/20 text-cyber-orange"
                      : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {threat.risk}
              </span>
              <span className="text-gray-400 font-mono text-xs">
                {threat.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
