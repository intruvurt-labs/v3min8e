// 1. FIX: App.tsx - Remove unsafe hot module replacement logic
import "./global.css";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/hooks/useWallet";
import { StatusProvider } from "@/components/UnifiedStatusManager";
import { ProfileProvider } from "@/components/UserProfileSystem";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary"; // NEW

// Lazy load heavy components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Terminal = lazy(() => import("./pages/Terminal"));
const NimRevDashboard = lazy(() => import("./pages/NimRevDashboard"));
const BotPlatform = lazy(() => import("./pages/BotPlatform"));
const SecurityAudit = lazy(() => import("./pages/SecurityAudit"));

// Import lightweight components normally
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

// Create query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (renamed from cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-green"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <StatusProvider>
          <ProfileProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
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
);

// FIXED: Safe root creation without development-only logic
const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);
