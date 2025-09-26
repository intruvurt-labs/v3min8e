// App.tsx
import "./global.css";
import { StrictMode, lazy, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { WalletProvider } from "@/hooks/useWallet";
import { StatusProvider } from "@/components/UnifiedStatusManager";
import { ProfileProvider } from "@/components/UserProfileSystem";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Terminal = lazy(() => import("./pages/Terminal"));
const NimRevDashboard = lazy(() => import("./pages/NimRevDashboard"));
const BotPlatform = lazy(() => import("./pages/BotPlatform"));
const SecurityAudit = lazy(() => import("./pages/SecurityAudit"));

import Index from "./pages/Index";
import Explorer from "./pages/Explorer";
import Grid from "./pages/Grid";
import About from "./pages/About";
import Staking from "./pages/Staking";
import Whitepaper from "./pages/Whitepaper";
import Technology from "./pages/Technology";
import Roadmap from "./pages/Roadmap";
import Community from "./pages/Community";
import Airdrop from "./pages/Airdrop";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import AgeRestriction from "./pages/AgeRestriction";
import NotFound from "./pages/NotFound";
import Blogs from "./pages/Blogs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // TanStack v5
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyber-green border-t-transparent" />
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const App = () => {
  const basename = import.meta.env.BASE_URL || "/";
  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <StatusProvider>
              <ProfileProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter basename={basename}>
                    <ScrollToTop />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/grid" element={<Grid />} />
                        <Route path="/scanner" element={<Grid />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/terminal" element={<Terminal />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/explorer" element={<Explorer />} />
                        <Route path="/staking" element={<Staking />} />
                        <Route path="/whitepaper" element={<Whitepaper />} />
                        <Route path="/technology" element={<Technology />} />
                        <Route path="/roadmap" element={<Roadmap />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/airdrop" element={<Airdrop />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/disclaimer" element={<Disclaimer />} />
                        <Route path="/age-restriction" element={<AgeRestriction />} />
                        <Route path="/nimrev" element={<NimRevDashboard />} />
                        <Route path="/bot-platform" element={<BotPlatform />} />
                        <Route path="/bot-dashboard" element={<BotPlatform />} />
                        <Route path="/security-audit" element={<SecurityAudit />} />
                        <Route path="/blogs" element={<Blogs />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </ProfileProvider>
            </StatusProvider>
          </WalletProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
