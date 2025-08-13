import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDynamicSEO } from "@/hooks/useDynamicSEO";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingTour, {
  WalletScanDemo,
  ThreatFeedDemo,
} from "@/components/OnboardingTour";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import MatrixBackground from "@/components/MatrixBackground";
import TelegramBotStatus from "@/components/TelegramBotStatus";
import BlockchainSecurityUpdates from "@/components/BlockchainSecurityUpdates";
import VermPriceChart from "@/components/VermPriceChart";

export default function Index() {
  const [terminalText, setTerminalText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Initialize dynamic SEO
  useDynamicSEO("index", {
    features: [
      "quantum cryptography",
      "decentralized consensus",
      "zero-knowledge proofs",
    ],
    platform: "blockchain security",
  });

  // Initialize onboarding
  const {
    shouldShowOnboarding,
    getPageSteps,
    completeOnboarding,
    skipOnboarding,
    trackPageVisit,
  } = useOnboarding();

  // Track page visit
  useEffect(() => {
    trackPageVisit("index");
  }, [trackPageVisit]);

  const fullText = "Initializing NimRev Protocol... Access Granted";

  useEffect(() => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTerminalText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, []);

  const onboardingSteps = [
    {
      id: "welcome",
      title: "Welcome to NimRev!",
      description:
        "NimRev is your advanced blockchain security platform. We provide real-time threat detection, smart contract auditing, and transparent intelligence to keep your crypto investments safe.",
    },
    {
      id: "scanner-demo",
      title: "Try the Scanner",
      description:
        "Experience our wallet scanner in action. This demo shows how easy it is to check any address for security risks.",
      component: <WalletScanDemo />,
    },
    {
      id: "threat-feed-demo",
      title: "Live Threat Monitoring",
      description:
        "See real-time security threats as they happen across multiple blockchains. Each alert provides detailed risk analysis.",
      component: <ThreatFeedDemo />,
    },
    {
      id: "get-started",
      title: "Ready to Get Started?",
      description:
        'Click "ENTER THE GRID" to access the full scanner, or explore our other features like staking, auditing, and community features. Your security journey starts here!',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      {/* Onboarding Tour */}
      {shouldShowOnboarding && (
        <OnboardingTour
          steps={onboardingSteps}
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
      {/* Animated Cyber Grid Background */}
      <CyberGrid intensity="medium" animated={true} />

      {/* Navigation */}
      <CyberNav />

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Terminal-style intro */}
          <div className="terminal mb-12 max-w-2xl">
            <div className="text-cyber-green font-mono text-sm">
              {terminalText}
              {isTyping && <span className="animate-pulse">|</span>}
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green leading-tight">
                <span className="text-cyber-blue">ADVANCED</span>
                <br />
                BLOCKCHAIN SECURITY
              </h1>

              <p className="text-lg text-gray-300 font-mono leading-relaxed mb-6">
                <span className="text-cyber-orange italic">
                  "Power stays with the people. No hidden agendas. No
                  compromise."
                </span>
                <br />
                <br />
                NimRev challenges centralized narratives by providing{" "}
                <span className="text-cyber-green">
                  transparent, real-time threat intelligence
                </span>{" "}
                directly to communities, empowering them before risks are buried
                or sanitized.
              </p>

              <p className="text-md text-gray-400 font-mono leading-relaxed">
                The Grid operates 24/7 with SUBVERSION SWEEP technology,
                detecting threats across multiple blockchains while maintaining
                complete transparency through our immutable ledger system.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/grid"
                  className="group relative px-8 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border animate-pulse-glow"
                >
                  <span className="relative z-10">ENTER THE GRID</span>
                  <div className="absolute inset-0 bg-cyber-green/10 group-hover:bg-cyber-green/20 transition-all duration-300"></div>
                </Link>

                <Link
                  to="/whitepaper"
                  className="group relative px-8 py-4 border-2 border-cyber-blue text-cyber-blue font-mono font-bold tracking-wider hover:bg-cyber-blue/20 transition-all duration-300"
                >
                  <span className="relative z-10">READ WHITEPAPER</span>
                  <div className="scan-line"></div>
                </Link>
              </div>
            </div>

            {/* Cyber Visual Element */}
            <div className="relative">
              <div className="relative w-full max-w-md mx-auto">
                {/* Telegram Bot Status - positioned above and to the right of logo */}
                <TelegramBotStatus className="absolute -top-12 -right-32 z-20" />

                {/* Matrix Background */}
                <div className="absolute inset-0 w-96 h-96 -translate-x-16 -translate-y-16">
                  <MatrixBackground className="rounded-full" />
                </div>

                {/* Central Core */}
                <div className="relative w-64 h-64 mx-auto z-10">
                  <div
                    className="absolute inset-0 rounded-full border-2 border-cyber-green animate-spin"
                    style={{ animationDuration: "20s" }}
                  >
                    <div className="absolute top-0 left-1/2 w-4 h-4 bg-cyber-green rounded-full transform -translate-x-1/2 -translate-y-2 animate-pulse-glow"></div>
                  </div>

                  <div
                    className="absolute inset-4 rounded-full border border-cyber-blue animate-spin"
                    style={{
                      animationDuration: "15s",
                      animationDirection: "reverse",
                    }}
                  >
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyber-blue rounded-full transform -translate-x-1/2 -translate-y-1"></div>
                  </div>

                  <div
                    className="absolute inset-8 rounded-full border border-cyber-orange animate-spin"
                    style={{ animationDuration: "10s" }}
                  >
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyber-orange rounded-full transform -translate-x-1/2 -translate-y-1"></div>
                  </div>

                  {/* Center logo/symbol */}
                  <div className="absolute inset-8 flex items-center justify-center">
                    <div className="w-full h-full bg-dark-bg border-2 border-cyber-green rounded-full flex items-center justify-center neon-glow overflow-hidden">
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets%2F0afef2519f0441318cbf9f55d295b37d%2Fd9eef1338ad947e389e5437d48669b0a?format=webp&width=800"
                        alt="NimRev Logo"
                        className="w-full h-full object-contain rounded-full p-4"
                      />
                    </div>
                  </div>
                </div>

                {/* Data streams */}
                <div className="absolute -inset-8 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-8 bg-gradient-to-t from-transparent to-cyber-green opacity-60 animate-data-flow`}
                      style={{
                        left: `${20 + i * 12}%`,
                        top: `${10 + (i % 2) * 40}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: "4s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-cyber font-bold text-center text-cyber-green mb-12 neon-glow">
            CORE SYSTEMS
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "QUANTUM CRYPTOGRAPHY",
                description:
                  "Advanced quantum-resistant encryption protocols ensuring long-term security against quantum computing threats.",
                icon: "🔐",
                color: "cyber-green",
              },
              {
                title: "DECENTRALIZED CONSENSUS",
                description:
                  "Novel consensus mechanism combining Proof-of-Stake with Byzantine fault tolerance for optimal performance.",
                icon: "🌐",
                color: "cyber-blue",
              },
              {
                title: "ZERO-KNOWLEDGE PROOFS",
                description:
                  "Privacy-preserving transaction validation using cutting-edge zk-SNARK implementations.",
                icon: "🛡️",
                color: "cyber-orange",
              },
              {
                title: "SMART CONTRACTS 2.0",
                description:
                  "Next-generation smart contract platform with formal verification and automated security auditing.",
                icon: "⚡",
                color: "cyber-purple",
              },
              {
                title: "INTEROPERABILITY",
                description:
                  "Cross-chain communication protocols enabling seamless integration with existing blockchain networks.",
                icon: "🔗",
                color: "electric-blue",
              },
              {
                title: "SCALABILITY ENGINE",
                description:
                  "Revolutionary sharding architecture capable of processing millions of transactions per second.",
                icon: "🚀",
                color: "neon-orange",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group relative p-6 bg-dark-bg/50 border border-${feature.color}/30 hover:border-${feature.color} transition-all duration-300 hover:bg-${feature.color}/10 neon-border`}
              >
                <div className="space-y-4">
                  <div
                    className={`text-4xl mb-4 text-${feature.color} group-hover:animate-pulse-glow`}
                  >
                    {feature.icon}
                  </div>
                  <h3
                    className={`text-lg font-cyber font-bold text-${feature.color} tracking-wider`}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 font-mono text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover scan effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 scan-line"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERM Intelligence Showcase */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-8">
            THE REVERSE ENGINEERED INTELLIGENCE SYSTEM
          </h2>

          <div className="mb-12">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F9a8474ab0524497c85c9ce04674c08c9%2Fd389cbbc3acb48238294f80584da0603?format=webp&width=800"
              alt="NimRev $VERM - The reverse engineered intelligence system"
              className="max-w-2xl w-full h-auto mx-auto rounded-lg border border-cyber-green/30 shadow-2xl neon-glow"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-cyber-green/30 bg-cyber-green/5 rounded-lg">
              <h3 className="text-lg font-cyber font-bold text-cyber-green mb-3">
                BUILT WITH GRIT
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Not gimmicks. Created for thinkers, tinkerers, and terminal
                truth-seekers. If you're tired of noise���start listening to the
                reverse frequency.
              </p>
            </div>

            <div className="p-6 border border-cyber-blue/30 bg-cyber-blue/5 rounded-lg">
              <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-3">
                SCAN WALLET
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Deep subversive analysis with cross-chain threat correlation.
                The vermin network sees what others miss.
              </p>
            </div>

            <div className="p-6 border border-cyber-purple/30 bg-cyber-purple/5 rounded-lg">
              <h3 className="text-lg font-cyber font-bold text-cyber-purple mb-3">
                VERIFY ME
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Immutable transparency ledger with cryptographic proof. Every
                scan is permanent and publicly verifiable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section className="relative z-10 py-16 px-4 border-t border-cyber-green/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-cyber font-bold text-center text-cyber-green mb-12 neon-glow">
            $VERM TOKEN
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
                <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                  ACCESS THE NETWORK
                </h3>
                <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6">
                  The $VERM token provides enhanced access to NimRev's advanced
                  detection tools, exclusive alerts, and community features.
                  Join the data ghost economy.
                </p>
                <div className="space-y-4">
                  <a
                    href="https://jup.ag/tokens/Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-6 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border text-center"
                  >
                    💊 MINT $VERM ON JUPITER
                  </a>
                </div>
              </div>

              {/* Real-time $VERM Price Chart */}
              <VermPriceChart />

              {/* Bot Platform Status */}
              <div className="border border-cyber-purple/30 p-4 bg-cyber-purple/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyber-purple rounded-full animate-pulse"></div>
                    <span className="text-cyber-purple font-mono font-bold text-sm">
                      BOT PLATFORM
                    </span>
                    <span className="text-cyber-green font-mono text-xs">
                      OPERATIONAL
                    </span>
                  </div>
                  <Link
                    to="/bot-platform"
                    className="text-cyber-purple hover:text-cyber-blue transition-colors font-mono text-xs underline"
                  >
                    View Platform →
                  </Link>
                </div>
              </div>

              {/* AI Security Audit */}
              <div className="border border-cyber-orange/30 p-4 bg-cyber-orange/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyber-orange rounded-full animate-pulse"></div>
                    <span className="text-cyber-orange font-mono font-bold text-sm">
                      AI SECURITY AUDIT
                    </span>
                    <span className="text-cyber-green font-mono text-xs bg-cyber-green/20 px-2 py-1 rounded">
                      NEW
                    </span>
                  </div>
                  <Link
                    to="/security-audit"
                    className="text-cyber-orange hover:text-cyber-blue transition-colors font-mono text-xs underline"
                  >
                    Get Audit →
                  </Link>
                </div>
                <p className="text-gray-400 font-mono text-xs mt-2">
                  ML-powered smart contract security analysis • Payment required
                  before results
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                  SECURITY AUDITS
                </h3>
                <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6">
                  $VERM has been audited by leading security platforms to ensure
                  contract safety and protect the community from malicious code.
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <a
                    href="https://gopluslabs.io/token-security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20 transition-all duration-300 text-center"
                  >
                    🔎 GoPlus Audit
                  </a>
                  <a
                    href="https://rugcheck.xyz/tokens/Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20 transition-all duration-300 text-center"
                  >
                    🔎 RugCheck
                  </a>
                  <a
                    href="https://www.certik.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20 transition-all duration-300 text-center"
                  >
                    ���️ CertiK Audit
                  </a>
                  <a
                    href="https://consensys.net/diligence/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20 transition-all duration-300 text-center"
                  >
                    ⚡ ConsenSys Diligence
                  </a>
                  <a
                    href="https://www.halborn.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20 transition-all duration-300 text-center"
                  >
                    🔐 Halborn Security
                  </a>
                  <a
                    href="https://www.quantstamp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-cyber-blue/30 text-cyber-blue font-mono text-sm hover:bg-cyber-blue/20 transition-all duration-300 text-center"
                  >
                    🔬 Quantstamp
                  </a>
                </div>
              </div>

              <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
                <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                  TOKEN UTILITY
                </h3>
                <ul className="space-y-2 text-gray-300 font-mono text-sm">
                  <li>• Enhanced detection tool access</li>
                  <li>• Early alert notifications</li>
                  <li>• Community governance rights</li>
                  <li>• Report-to-Earn rewards</li>
                  <li>• Exclusive data ghost features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Signup for Security Updates */}
      <section className="relative z-10 py-16 px-4 border-t border-cyber-blue/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center border border-cyber-green/50 p-12 bg-cyber-green/5 neon-border">
            <h2 className="text-4xl font-cyber font-bold text-cyber-green mb-6 neon-glow">
              SECURITY INTEL UPDATES
            </h2>
            <p className="text-2xl text-cyber-blue font-mono font-bold mb-8 italic">
              "Stay ahead of threats with weekly security intelligence."
            </p>

            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="ghost@protonmail.com"
                  className="flex-1 px-4 py-3 bg-dark-bg border border-cyber-green/30 text-cyber-green font-mono focus:border-cyber-green focus:outline-none transition-all duration-200 rounded"
                />
                <button className="px-6 py-3 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border rounded">
                  SUBSCRIBE
                </button>
              </div>
              <div className="mt-4 flex justify-center gap-6 text-sm">
                <label className="flex items-center gap-2 text-cyber-blue cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value="weekly"
                    defaultChecked
                    className="text-cyber-blue"
                  />
                  📅 Weekly Updates
                </label>
                <label className="flex items-center gap-2 text-cyber-orange cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value="biweekly"
                    className="text-cyber-orange"
                  />
                  📅 Bi-weekly Updates
                </label>
              </div>
            </div>

            <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5 rounded mb-6">
              <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4 flex items-center justify-center gap-2">
                <span className="animate-pulse">🌍</span>
                ALPHA LOCATIONS
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 border border-cyber-green/20 bg-cyber-green/5 rounded">
                  <div className="text-cyber-green font-bold mb-1">
                    🇺🇸 Silicon Valley
                  </div>
                  <div className="text-gray-400">Crypto VCs & Builders</div>
                </div>
                <div className="text-center p-3 border border-cyber-blue/20 bg-cyber-blue/5 rounded">
                  <div className="text-cyber-blue font-bold mb-1">
                    🇸🇬 Singapore
                  </div>
                  <div className="text-gray-400">Asian DeFi Hub</div>
                </div>
                <div className="text-center p-3 border border-cyber-purple/20 bg-cyber-purple/5 rounded">
                  <div className="text-cyber-purple font-bold mb-1">🇨🇭 Zug</div>
                  <div className="text-gray-400">Crypto Valley</div>
                </div>
                <div className="text-center p-3 border border-cyber-orange/20 bg-cyber-orange/5 rounded">
                  <div className="text-cyber-orange font-bold mb-1">
                    🇵🇹 Lisbon
                  </div>
                  <div className="text-gray-400">Web3 Nomads</div>
                </div>
                <div className="text-center p-3 border border-electric-blue/20 bg-electric-blue/5 rounded">
                  <div className="text-electric-blue font-bold mb-1">
                    🇦🇪 Dubai
                  </div>
                  <div className="text-gray-400">Blockchain Innovation</div>
                </div>
                <div className="text-center p-3 border border-neon-orange/20 bg-neon-orange/5 rounded">
                  <div className="text-neon-orange font-bold mb-1">
                    🌐 Remote
                  </div>
                  <div className="text-gray-400">Global Data Ghosts</div>
                </div>
              </div>
              <p className="text-gray-400 font-mono text-xs mt-4 italic">
                Join alphas worldwide building the future of decentralized
                security
              </p>
            </div>

            <div className="flex justify-center space-x-6">
              <a
                href="https://x.com/nimrevxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-blue hover:text-cyber-green transition-colors font-mono"
              >
                📱 X: @nimrevxyz
              </a>
              <a
                href="https://t.me/nimrevxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-blue hover:text-cyber-green transition-colors font-mono"
              >
                💬 Telegram: @nimrevxyz
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Security Updates Section */}
      <section className="relative z-10 py-16 px-4 border-t border-cyber-purple/30">
        <div className="max-w-6xl mx-auto">
          <BlockchainSecurityUpdates />
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-4 border-t border-cyber-green/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { label: "TPS", value: "1,000,000+", color: "cyber-green" },
              { label: "VALIDATORS", value: "50,000+", color: "cyber-blue" },
              {
                label: "SECURITY LEVEL",
                value: "256-BIT",
                color: "cyber-orange",
              },
              { label: "UPTIME", value: "99.99%", color: "cyber-purple" },
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={`text-4xl font-cyber font-black text-${stat.color} neon-glow`}
                >
                  {stat.value}
                </div>
                <div className="text-gray-400 font-mono text-sm tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <CyberFooter />
    </div>
  );
}
