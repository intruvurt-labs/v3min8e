import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

interface OnboardingState {
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;
  currentTour: string | null;
  completedSteps: string[];
}

const ONBOARDING_STORAGE_KEY = "nimrev_onboarding_state";

export function useOnboarding() {
  const location = useLocation();
  const navigate = useNavigate();

  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    () => {
      try {
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn("Failed to load onboarding state:", error);
      }

      return {
        isFirstVisit: true,
        hasCompletedOnboarding: false,
        currentTour: null,
        completedSteps: [],
      };
    },
  );

  // Save state to localStorage
  const saveState = useCallback((newState: OnboardingState) => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
      setOnboardingState(newState);
    } catch (error) {
      console.warn("Failed to save onboarding state:", error);
    }
  }, []);

  // Check if user should see onboarding
  const shouldShowOnboarding = useCallback(() => {
    return (
      onboardingState.isFirstVisit && !onboardingState.hasCompletedOnboarding
    );
  }, [onboardingState]);

  // Start onboarding tour
  const startOnboarding = useCallback(
    (tourId: string) => {
      saveState({
        ...onboardingState,
        currentTour: tourId,
        isFirstVisit: false,
      });
    },
    [onboardingState, saveState],
  );

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    saveState({
      ...onboardingState,
      hasCompletedOnboarding: true,
      currentTour: null,
      isFirstVisit: false,
    });
  }, [onboardingState, saveState]);

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    saveState({
      ...onboardingState,
      hasCompletedOnboarding: true,
      currentTour: null,
      isFirstVisit: false,
    });
  }, [onboardingState, saveState]);

  // Mark step as completed
  const completeStep = useCallback(
    (stepId: string) => {
      if (!onboardingState.completedSteps.includes(stepId)) {
        saveState({
          ...onboardingState,
          completedSteps: [...onboardingState.completedSteps, stepId],
        });
      }
    },
    [onboardingState, saveState],
  );

  // Reset onboarding (for testing/admin)
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setOnboardingState({
      isFirstVisit: true,
      hasCompletedOnboarding: false,
      currentTour: null,
      completedSteps: [],
    });
  }, []);

  // Get onboarding steps for current page
  const getPageSteps = useCallback(
    (pageName: string): OnboardingStep[] => {
      const stepMap: Record<string, OnboardingStep[]> = {
        index: [
          {
            id: "welcome",
            title: "Welcome to NimRev!",
            description:
              "NimRev is your advanced blockchain security platform. We provide real-time threat detection, smart contract auditing, and transparent intelligence to keep your crypto investments safe.",
          },
          {
            id: "scanner-intro",
            title: "Security Scanner",
            description:
              'Our main scanner can analyze wallet addresses, detect threats, and provide real-time security intelligence. Click "ENTER THE GRID" to access the scanner.',
            action: {
              text: "Try Scanner Now",
              onClick: () => navigate("/grid"),
            },
          },
          {
            id: "features-overview",
            title: "Core Features",
            description:
              "NimRev offers quantum cryptography, decentralized consensus, zero-knowledge proofs, and advanced smart contract security. Scroll down to explore our technology stack.",
          },
        ],
        grid: [
          {
            id: "grid-welcome",
            title: "NimRev Grid Scanner",
            description:
              "This is your security command center. Here you can scan wallet addresses, monitor threats in real-time, and access advanced security analysis tools.",
          },
          {
            id: "wallet-scan",
            title: "Wallet Scanner",
            description:
              "Enter any wallet address to get a comprehensive security analysis. Our AI analyzes transaction patterns, risk factors, and potential threats.",
          },
          {
            id: "threat-feed",
            title: "Live Threat Feed",
            description:
              "Monitor real-time security threats across multiple blockchains. Each alert shows threat type, risk level, and affected addresses.",
          },
          {
            id: "network-selection",
            title: "Multi-Chain Support",
            description:
              "Switch between different blockchain networks including Solana, Ethereum, Base, and more. Each network has specialized security monitoring.",
          },
        ],
        audit: [
          {
            id: "audit-intro",
            title: "Smart Contract Auditing",
            description:
              "Get professional security audits for your smart contracts using our AI-powered analysis engine. Upload your contract code for comprehensive vulnerability scanning.",
          },
          {
            id: "audit-process",
            title: "Audit Process",
            description:
              "Our audit process includes automated vulnerability detection, manual review by security experts, and a detailed report with recommendations.",
          },
        ],
        staking: [
          {
            id: "staking-intro",
            title: "VERM Token Staking",
            description:
              "Stake your VERM tokens to earn rewards and gain access to premium features. Staking also gives you governance rights in the NimRev ecosystem.",
          },
          {
            id: "staking-benefits",
            title: "Staking Benefits",
            description:
              "Staked VERM provides enhanced detection tools, early threat alerts, community governance rights, and report-to-earn rewards.",
          },
        ],
      };

      return stepMap[pageName] || [];
    },
    [navigate],
  );

  // Auto-start onboarding on first visit
  useEffect(() => {
    if (shouldShowOnboarding() && location.pathname === "/") {
      // Small delay to let the page load
      const timer = setTimeout(() => {
        startOnboarding("main");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, shouldShowOnboarding, startOnboarding]);

  // Track page visits for contextual tips
  const trackPageVisit = useCallback((pageName: string) => {
    // Could be used for analytics or showing page-specific tips
    console.log(`Page visited: ${pageName}`);
  }, []);

  return {
    // State
    shouldShowOnboarding: shouldShowOnboarding(),
    hasCompletedOnboarding: onboardingState.hasCompletedOnboarding,
    currentTour: onboardingState.currentTour,
    completedSteps: onboardingState.completedSteps,

    // Actions
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    completeStep,
    resetOnboarding,
    trackPageVisit,

    // Utils
    getPageSteps,
    isStepCompleted: (stepId: string) =>
      onboardingState.completedSteps.includes(stepId),
  };
}

// Quick tips hook for contextual help
export function useQuickTips() {
  const [activeTip, setActiveTip] = useState<string | null>(null);
  const [dismissedTips, setDismissedTips] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("nimrev_dismissed_tips");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const showTip = useCallback(
    (tipId: string) => {
      if (!dismissedTips.includes(tipId)) {
        setActiveTip(tipId);
      }
    },
    [dismissedTips],
  );

  const dismissTip = useCallback(
    (tipId: string) => {
      const newDismissed = [...dismissedTips, tipId];
      setDismissedTips(newDismissed);
      setActiveTip(null);

      try {
        localStorage.setItem(
          "nimrev_dismissed_tips",
          JSON.stringify(newDismissed),
        );
      } catch (error) {
        console.warn("Failed to save dismissed tips:", error);
      }
    },
    [dismissedTips],
  );

  const clearActiveTip = useCallback(() => {
    setActiveTip(null);
  }, []);

  return {
    activeTip,
    showTip,
    dismissTip,
    clearActiveTip,
    hasDismissedTip: (tipId: string) => dismissedTips.includes(tipId),
  };
}
