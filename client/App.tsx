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
import Index from "./pages/Index";
import Explorer from "./pages/Explorer";
import Grid from "./pages/Grid";
import Terminal from "./pages/Terminal";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
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
import NimRevDashboard from "./pages/NimRevDashboard";
import BotPlatform from "./pages/BotPlatform";
import SecurityAudit from "./pages/SecurityAudit";
import Blogs from "./pages/Blogs";
import ChatPage from "./pages/ChatPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <StatusProvider>
        <ProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                <Route path="/bot-platform" element={<BotPlatform />} />
                <Route path="/security-audit" element={<SecurityAudit />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ProfileProvider>
      </StatusProvider>
    </WalletProvider>
  </QueryClientProvider>
);

// Prevent multiple root creations during hot module reloading
const container = document.getElementById("root")!;
if (!(container as any)._reactRootContainer) {
  const root = createRoot(container);
  (container as any)._reactRootContainer = root;
  root.render(<App />);
} else {
  (container as any)._reactRootContainer.render(<App />);
}
