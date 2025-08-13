import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";

export default function Whitepaper() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="terminal mb-8 inline-block">
              <span className="text-cyber-green font-mono text-sm">
                Loading NimRev Unified Platform documentation... Last updated:
                January 2025
              </span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              NIMREV LITEPAPER
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-4">
              The Silent Advantage - Unified Threat Intelligence Platform
            </p>
            <div className="flex justify-center items-center space-x-4 text-sm font-mono text-gray-400">
              <span>🧠 12 min read</span>
              <span>•</span>
              <span>Real-time Multi-Platform Intelligence</span>
              <span>•</span>
              <span>AI-Powered Security Audits</span>
            </div>

            <div className="mt-6 p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse"></div>
                <span className="text-cyber-green font-mono font-bold">
                  PLATFORM STATUS: FULLY OPERATIONAL
                </span>
              </div>
              <p className="text-gray-300 font-mono text-sm">
                10-Chain Coverage • AI Security Audits • Real-Time WebSocket •
                Cross-Chain Threat Intelligence
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-12">
            {/* TL;DR Section */}
            <section className="border border-cyber-green/30 p-8 bg-dark-bg/50 neon-border">
              <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                <span className="text-3xl mr-3">🧠</span>
                TL;DR FOR THE CURIOUS MINDS
              </h2>
              <p className="text-lg text-gray-300 font-mono leading-relaxed mb-4">
                NimRev is now a unified real-time intelligence platform that
                combines blockchain threat detection, AI-powered security
                audits, and multi-platform monitoring. It's like having a
                super-smart robot detective team that watches across Web,
                Telegram, and blockchain simultaneously.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-cyber-blue/10 border border-cyber-blue/30">
                  <h4 className="text-cyber-blue font-bold mb-2">
                    Protocol Scanner
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Real-time blockchain monitoring with WebSocket alerts
                  </p>
                </div>
                <div className="p-4 bg-cyber-purple/10 border border-cyber-purple/30">
                  <h4 className="text-cyber-purple font-bold mb-2">
                    Bot Platform
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Multi-tenant Telegram bot with analytics dashboard
                  </p>
                </div>
                <div className="p-4 bg-cyber-orange/10 border border-cyber-orange/30">
                  <h4 className="text-cyber-orange font-bold mb-2">
                    AI Security Audits
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Comprehensive smart contract and project code analysis
                  </p>
                </div>
              </div>
            </section>

            {/* What is NimRev */}
            <section>
              <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                <span className="text-4xl mr-3">🌌</span>
                WHAT IS NIMREV? (UPDATED 2025)
              </h2>
              <div className="space-y-6 text-gray-300 font-mono leading-relaxed">
                <p>
                  <strong className="text-cyber-orange">NimRev</strong> [short
                  for the double-reversed word:
                  <span className="text-cyber-blue">
                    {" "}
                    nimrev=reverse-mining=vermin(RATs=Rogue Address Tracker)
                  </span>
                  ] is now a unified real-time intelligence and security
                  platform built for the entire crypto ecosystem.
                </p>
                <p>
                  In a digital world flooded with bots, hype, and misleading
                  signals, NimRev provides a unified dashboard that connects Web
                  interface, Telegram bot, and AI security audits in real-time.
                </p>
                <div className="border-l-4 border-cyber-green pl-6 bg-cyber-green/5 p-4">
                  <p className="text-cyber-green font-bold">
                    Think of it as: Crypto Night Vision + Weather Radar + Lie
                    Detector + AI Security Expert + Real-Time Command Center—all
                    unified.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <h4 className="text-cyber-blue font-bold">
                      UNIFIED PLATFORM TRACKS:
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Real-time WebSocket threat monitoring</li>
                      <li>• Cross-platform coordinated attacks</li>
                      <li>• AI-powered smart contract vulnerabilities</li>
                      <li>• Bot farm assembly and coordination</li>
                      <li>• Multi-chain stealth launches</li>
                      <li>• Telegram bot performance and analytics</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-cyber-orange font-bold">
                      ENHANCED ADVANTAGES:
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Instant alerts via multiple channels</li>
                      <li>• AI security audit before you invest</li>
                      <li>• Bot commands for quick scans</li>
                      <li>• Unified dashboard across platforms</li>
                      <li>• Real-time threat feed synchronization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Platform Architecture */}
            <section>
              <h2 className="text-3xl font-cyber font-bold text-cyber-purple mb-6 flex items-center">
                <span className="text-4xl mr-3">🏗️</span>
                UNIFIED PLATFORM ARCHITECTURE
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
                    <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                      Real-Time Core (WebSocket)
                    </h3>
                    <ul className="space-y-2 text-gray-300 font-mono text-sm">
                      <li>• WebSocket server (ws://localhost:8082)</li>
                      <li>• Event-driven architecture</li>
                      <li>• Cross-platform data synchronization</li>
                      <li>• Real-time threat broadcasting</li>
                    </ul>
                  </div>

                  <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
                    <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                      Bot Platform Integration
                    </h3>
                    <ul className="space-y-2 text-gray-300 font-mono text-sm">
                      <li>• Multi-tenant Telegram bot (@nimrev_bot)</li>
                      <li>• Web dashboard (/bot-dashboard)</li>
                      <li>• Performance analytics API</li>
                      <li>• Command processing system</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
                    <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                      AI Security Audit Engine
                    </h3>
                    <ul className="space-y-2 text-gray-300 font-mono text-sm">
                      <li>• ML-powered contract analysis</li>
                      <li>• Project code security scanning</li>
                      <li>��� File-based vulnerability detection</li>
                      <li>• Automated hacker-proof auditing</li>
                    </ul>
                  </div>

                  <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                    <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                      Enhanced Detection Systems
                    </h3>
                    <ul className="space-y-2 text-gray-300 font-mono text-sm">
                      <li>• Subversive Method with real-time processing</li>
                      <li>• Reverse-Mining Algorithm optimization</li>
                      <li>• Cross-chain correlation engine</li>
                      <li>• 97%+ accuracy threat detection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Enhanced Core Tools */}
            <section>
              <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                <span className="text-4xl mr-3">🧪</span>
                NIMREV'S ENHANCED CORE TOOLS
              </h2>
              <div className="space-y-8">
                {[
                  {
                    name: "UNIFIED THREAT MONITOR",
                    subtitle: "(Real-Time WebSocket Engine)",
                    features: [
                      "WebSocket-powered real-time threat detection",
                      "Cross-platform event synchronization",
                      "Live threat feed with severity filtering",
                      "Instant alerts to all connected platforms",
                    ],
                    color: "cyber-green",
                    new: true,
                  },
                  {
                    name: "AI SECURITY AUDIT SYSTEM",
                    subtitle: "(ML-Powered Analysis)",
                    features: [
                      "Comprehensive smart contract vulnerability scanning",
                      "Project code security analysis with ML algorithms",
                      "File-based security audit with hacker-proof validation",
                      "Pay-first audit system with guaranteed results",
                    ],
                    color: "cyber-orange",
                    new: true,
                  },
                  {
                    name: "RATSCAN ENHANCED",
                    subtitle: "(Rogue Address Tracker)",
                    features: [
                      "Real-time visual map of suspicious wallets",
                      "Cross-chain wallet clustering with ML",
                      "WebSocket-powered live updates",
                      "Enhanced behavioral pattern recognition",
                    ],
                    color: "cyber-blue",
                  },
                  {
                    name: "BOT PLATFORM INTEGRATION",
                    subtitle: "(Multi-Tenant System)",
                    features: [
                      "Telegram bot with command processing",
                      "Web dashboard for bot management",
                      "Performance analytics and monitoring",
                      "Cross-platform command execution",
                    ],
                    color: "cyber-purple",
                    new: true,
                  },
                  {
                    name: "ENHANCED HONEYPOT SNIFFER",
                    subtitle: "(AI-Powered Detection)",
                    features: [
                      "ML-enhanced trap detection with 97% accuracy",
                      "Real-time WebSocket alert distribution",
                      "Cross-platform reputation tracking",
                      "Advanced deployer behavior analysis",
                    ],
                    color: "cyber-orange",
                  },
                  {
                    name: "CROSS-CHAIN COORDINATION DETECTOR",
                    subtitle: "(10-Network Analysis)",
                    features: [
                      "Unified monitoring across 10 major blockchains",
                      "Real-time cross-chain attack detection",
                      "Coordinated bot army identification",
                      "Bridge tracking and fund flow analysis",
                      "Ethereum, Solana, BNB, Polygon, Arbitrum coverage",
                      "Avalanche, Base, Fantom, Optimism, Cardano support",
                    ],
                    color: "electric-blue",
                    new: true,
                  },
                ].map((tool, i) => (
                  <div
                    key={i}
                    className={`border border-${tool.color}/30 p-6 bg-dark-bg/30 hover:border-${tool.color} transition-all duration-300 neon-border relative`}
                  >
                    {tool.new && (
                      <div className="absolute top-4 right-4 bg-cyber-green text-dark-bg px-2 py-1 text-xs font-bold rounded">
                        NEW 2025
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3
                          className={`text-xl font-cyber font-bold text-${tool.color} mb-1`}
                        >
                          {i + 1}. {tool.name}
                        </h3>
                        {tool.subtitle && (
                          <p className="text-sm text-gray-400 font-mono">
                            {tool.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tool.features.map((feature, j) => (
                        <li
                          key={j}
                          className="text-gray-300 font-mono text-sm flex items-start"
                        >
                          <span className={`text-${tool.color} mr-2`}>▸</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Security Audit System */}
            <section className="border border-cyber-orange/50 p-8 bg-cyber-orange/5 neon-border">
              <h2 className="text-3xl font-cyber font-bold text-cyber-orange mb-6 flex items-center">
                <span className="text-4xl mr-3">🔒</span>
                AI SECURITY AUDIT SYSTEM (NEW)
              </h2>
              <div className="space-y-6">
                <p className="text-gray-300 font-mono leading-relaxed">
                  Our revolutionary AI-powered security audit system provides
                  comprehensive analysis of smart contracts, project code, and
                  file-based vulnerabilities. This hacker-proof system requires
                  payment in full before delivering results, ensuring serious
                  security assessments only.
                </p>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-cyber-orange font-bold mb-4">
                      AUDIT CAPABILITIES
                    </h4>
                    <ul className="space-y-2 text-gray-300 font-mono text-sm">
                      <li>• Smart contract vulnerability scanning with ML</li>
                      <li>• Project codebase security analysis</li>
                      <li>
                        • File-based security audit with pattern recognition
                      </li>
                      <li>• Automated exploit detection and prevention</li>
                      <li>
                        • Cross-reference with known vulnerability databases
                      </li>
                      <li>• Hacker-proof validation and verification</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-cyber-orange font-bold mb-4">
                      AUDIT PROCESS
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-cyber-orange/20 border border-cyber-orange rounded-full flex items-center justify-center text-xs">
                          1
                        </div>
                        <span className="text-gray-300 text-sm">
                          Submit project for audit
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-cyber-orange/20 border border-cyber-orange rounded-full flex items-center justify-center text-xs">
                          2
                        </div>
                        <span className="text-gray-300 text-sm">
                          Payment required in full (VERM tokens)
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-cyber-orange/20 border border-cyber-orange rounded-full flex items-center justify-center text-xs">
                          3
                        </div>
                        <span className="text-gray-300 text-sm">
                          AI/ML automated analysis begins
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-cyber-orange/20 border border-cyber-orange rounded-full flex items-center justify-center text-xs">
                          4
                        </div>
                        <span className="text-gray-300 text-sm">
                          Manual audit if inconclusive results
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-cyber-orange/20 border border-cyber-orange rounded-full flex items-center justify-center text-xs">
                          5
                        </div>
                        <span className="text-gray-300 text-sm">
                          Comprehensive report delivered
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-dark-bg/50 border border-cyber-orange/30">
                  <h4 className="text-cyber-orange font-bold mb-4">
                    AUDIT PRICING
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border border-cyber-green/30 bg-cyber-green/5">
                      <h5 className="text-cyber-green font-bold mb-2">
                        Basic Audit
                      </h5>
                      <p className="text-2xl font-cyber text-cyber-green mb-2">
                        500 VERM
                      </p>
                      <p className="text-gray-300 text-xs">
                        Smart contract only
                      </p>
                    </div>
                    <div className="text-center p-4 border border-cyber-orange/30 bg-cyber-orange/5">
                      <h5 className="text-cyber-orange font-bold mb-2">
                        Comprehensive
                      </h5>
                      <p className="text-2xl font-cyber text-cyber-orange mb-2">
                        2000 VERM
                      </p>
                      <p className="text-gray-300 text-xs">
                        Full project + files
                      </p>
                    </div>
                    <div className="text-center p-4 border border-cyber-purple/30 bg-cyber-purple/5">
                      <h5 className="text-cyber-purple font-bold mb-2">
                        Enterprise
                      </h5>
                      <p className="text-2xl font-cyber text-cyber-purple mb-2">
                        5000 VERM
                      </p>
                      <p className="text-gray-300 text-xs">
                        Multi-project + priority
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How You Earn */}
            <section>
              <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                <span className="text-4xl mr-3">🚀</span>
                ENHANCED EARNING OPPORTUNITIES
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: "Real-Time Alert Advantage",
                    desc: "WebSocket-powered instant alerts give you microsecond advantages over others.",
                  },
                  {
                    title: "Cross-Platform Intelligence",
                    desc: "Use both web and Telegram bot for maximum market intelligence gathering.",
                  },
                  {
                    title: "AI Audit Services",
                    desc: "Provide security audit services to others using our AI platform.",
                  },
                  {
                    title: "Report-to-Earn Enhanced",
                    desc: "Improved VERM rewards for verified threat reports with ML validation.",
                  },
                  {
                    title: "Bot Performance Bonuses",
                    desc: "Earn rewards for high-performance bot usage and command processing.",
                  },
                  {
                    title: "Multi-Platform Referrals",
                    desc: "Bring users to both web platform and bot system for enhanced bonuses.",
                  },
                ].map((earn, i) => (
                  <div
                    key={i}
                    className="border border-cyber-orange/30 p-6 bg-cyber-orange/5 hover:border-cyber-orange transition-all duration-300"
                  >
                    <h4 className="text-cyber-orange font-bold font-cyber mb-3">
                      {earn.title}
                    </h4>
                    <p className="text-gray-300 font-mono text-sm">
                      {earn.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Philosophy Updated */}
            <section className="border border-cyber-purple/30 p-8 bg-cyber-purple/5">
              <h2 className="text-3xl font-cyber font-bold text-cyber-purple mb-6 flex items-center">
                <span className="text-4xl mr-3">🕵️</span>
                NIMREV PHILOSOPHY (EVOLVED)
              </h2>
              <div className="text-center">
                <p className="text-2xl text-cyber-purple font-cyber font-bold mb-6 neon-glow">
                  "Built for Data Ghosts, Powered by AI, United Across
                  Platforms"
                </p>
                <p className="text-gray-300 font-mono mb-6">
                  We believe the best way to thrive in crypto is through unified
                  intelligence:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="text-cyber-green text-2xl">🤫</div>
                    <p className="text-cyber-green font-mono font-bold">
                      Stay quiet
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyber-blue text-2xl">🧠</div>
                    <p className="text-cyber-blue font-mono font-bold">
                      Use AI intelligence
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyber-purple text-2xl">🔗</div>
                    <p className="text-cyber-purple font-mono font-bold">
                      Unite platforms
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyber-orange text-2xl">⚡</div>
                    <p className="text-cyber-orange font-mono font-bold">
                      Act instantly
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyber-green text-2xl">🎯</div>
                    <p className="text-cyber-green font-mono font-bold">
                      Stay precise
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 font-mono text-sm mt-6 italic">
                  NimRev users are not clout chasers. They are the unified
                  intelligence network, connected across platforms, powered by
                  AI, watching in real-time.
                </p>
              </div>
            </section>

            {/* Safety & Differentiators */}
            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-4 flex items-center">
                  <span className="text-3xl mr-3">⚖️</span>
                  IS NIMREV SAFE? (ENHANCED)
                </h2>
                <div className="space-y-3">
                  <div className="text-cyber-green font-bold text-xl mb-4">
                    YES, EVEN MORE SO.
                  </div>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• Zero private key requirements</li>
                    <li>• Read-only blockchain data access</li>
                    <li>• Security audited and verified (Jan 2025)</li>
                    <li>• Hacker-proof audit system</li>
                    <li>• Real-time threat monitoring protection</li>
                    <li>• Multi-platform security validation</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-cyber font-bold text-cyber-blue mb-4 flex items-center">
                  <span className="text-3xl mr-3">✨</span>
                  WHAT MAKES NIMREV UNIQUE NOW?
                </h2>
                <ul className="space-y-2 text-gray-300 font-mono text-sm">
                  <li>• First unified Web + Telegram + AI platform</li>
                  <li>• Real-time WebSocket threat distribution</li>
                  <li>• AI-powered security audit system</li>
                  <li>• Cross-platform synchronized intelligence</li>
                  <li>• 97%+ ML-enhanced accuracy</li>
                  <li>• Instant multi-channel alerting</li>
                  <li>• Hacker-proof audit validation</li>
                </ul>
              </section>
            </div>

            {/* Coming Soon Updated */}
            <section>
              <h2 className="text-3xl font-cyber font-bold text-cyber-orange mb-6 flex items-center">
                <span className="text-4xl mr-3">🔧</span>
                ROADMAP 2025
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "NimRev Mobile App with unified platform access",
                  "Advanced AI audit models with blockchain integration",
                  "Custom multi-platform alert builder",
                  "Enhanced cross-chain support (15+ networks)",
                  "Real-time DeFi protocol integration",
                  "NFT Ghost Badges with platform achievements",
                  "Enterprise API suite for institutions",
                  "Machine learning threat prediction models",
                  "Advanced bot farm detection algorithms",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="border border-cyber-orange/30 p-4 bg-cyber-orange/5 text-center"
                  >
                    <p className="text-gray-300 font-mono text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ Updated */}
            <section>
              <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                <span className="text-4xl mr-3">❓</span>
                FAQ (UPDATED 2025)
              </h2>
              <div className="space-y-6">
                {[
                  {
                    q: "How do the Web platform and Telegram bot work together?",
                    a: "They're unified via WebSocket real-time synchronization. Actions on one platform instantly reflect on the other with shared threat intelligence.",
                  },
                  {
                    q: "What makes the AI security audits different?",
                    a: "Our ML-powered system analyzes smart contracts, project files, and cross-references with exploit databases. Payment required upfront ensures serious audits only.",
                  },
                  {
                    q: "How fast are the real-time alerts?",
                    a: "WebSocket-powered alerts deliver in under 1.2 seconds. You get threats detection before they propagate across networks.",
                  },
                  {
                    q: "Can I use both free and paid features?",
                    a: "Yes. Basic scanning is free. Premium features like AI audits, enhanced analytics, and real-time WebSocket require VERM tokens.",
                  },
                  {
                    q: "How accurate is the threat detection now?",
                    a: "Our enhanced ML algorithms achieve 96.3% accuracy with <0.15% false positives. This improved significantly in 2025.",
                  },
                  {
                    q: "What happens if the AI audit is inconclusive?",
                    a: "Automatic escalation to manual audit by security experts. You still receive comprehensive results without additional payment.",
                  },
                ].map((faq, i) => (
                  <div
                    key={i}
                    className="border border-cyber-green/30 p-6 bg-dark-bg/30"
                  >
                    <h4 className="text-cyber-green font-bold font-mono mb-3">
                      Q: {faq.q}
                    </h4>
                    <p className="text-gray-300 font-mono text-sm">
                      A: {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* What NimRev Is Not */}
            <section className="border border-destructive/30 p-8 bg-destructive/5">
              <h2 className="text-3xl font-cyber font-bold text-destructive mb-6 flex items-center">
                <span className="text-4xl mr-3">🚫</span>
                WHAT NIMREV IS NOT
              </h2>
              <ul className="space-y-3 text-gray-300 font-mono">
                <li>
                  • It's not financial advice (intelligence platform only)
                </li>
                <li>
                  • It's not a pump group (unified threat detection system)
                </li>
                <li>
                  • It's not a prediction tool (detects behavior and
                  vulnerabilities)
                </li>
                <li>
                  • It's not a replacement for due diligence (enhancement tool)
                </li>
                <li>
                  • It's not free AI audits (payment required for comprehensive
                  analysis)
                </li>
              </ul>
            </section>

            {/* Timeline Updated */}
            <section>
              <h2 className="text-3xl font-cyber font-bold text-cyber-blue mb-6 flex items-center">
                <span className="text-4xl mr-3">📆</span>
                PLATFORM EVOLUTION TIMELINE
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    phase: "Alpha Testing",
                    status: "COMPLETED",
                    color: "cyber-green",
                    date: "2024",
                  },
                  {
                    phase: "Unified Platform",
                    status: "DEPLOYED",
                    color: "cyber-blue",
                    date: "Jan 2025",
                  },
                  {
                    phase: "AI Security Audits",
                    status: "LIVE",
                    color: "cyber-orange",
                    date: "Jan 2025",
                  },
                  {
                    phase: "Enterprise Suite",
                    status: "Q2 2025",
                    color: "cyber-purple",
                    date: "Coming",
                  },
                ].map((phase, i) => (
                  <div
                    key={i}
                    className={`text-center border border-${phase.color}/30 p-4 bg-${phase.color}/5`}
                  >
                    <h4
                      className={`text-${phase.color} font-bold font-cyber mb-2`}
                    >
                      {phase.phase}
                    </h4>
                    <p className="text-gray-300 font-mono text-sm mb-1">
                      {phase.status}
                    </p>
                    <p className="text-gray-400 font-mono text-xs">
                      {phase.date}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Join Movement */}
            <section className="text-center border border-cyber-green/50 p-12 bg-cyber-green/5 neon-border">
              <h2 className="text-4xl font-cyber font-bold text-cyber-green mb-6 neon-glow">
                JOIN THE UNIFIED INTELLIGENCE NETWORK
              </h2>
              <p className="text-2xl text-cyber-blue font-mono font-bold mb-8 italic">
                "In a world full of bots, be the Ghost with AI vision."
              </p>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h4 className="text-cyber-purple font-bold">
                    Web Platform Access
                  </h4>
                  <a
                    href="https://nimrev.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300"
                  >
                    ACCESS PROTOCOL SCANNER
                  </a>
                </div>
                <div className="space-y-4">
                  <h4 className="text-cyber-purple font-bold">
                    Telegram Bot Access
                  </h4>
                  <a
                    href="https://t.me/nimrev_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-cyber-purple/20 border-2 border-cyber-purple text-cyber-purple font-mono font-bold tracking-wider hover:bg-cyber-purple hover:text-dark-bg transition-all duration-300"
                  >
                    ACCESS TELEGRAM BOT
                  </a>
                </div>
              </div>
              <div className="flex justify-center space-x-6 mb-8">
                <a
                  href="https://x.com/nimrevxyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-blue hover:text-cyber-green transition-colors font-mono"
                >
                  Twitter: x.com/nimrevxyz
                </a>
                <a
                  href="https://t.me/nimrevxyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-blue hover:text-cyber-green transition-colors font-mono"
                >
                  Community: t.me/nimrevxyz
                </a>
              </div>
            </section>

            {/* Mutable Note */}
            <div className="text-center text-gray-400 font-mono text-sm p-6 border-t border-cyber-green/30">
              <p className="mb-2">
                <strong>Mutable Litepaper Note:</strong> This document updates
                with platform evolution.
              </p>
              <p className="mb-2">
                Last major update: January 2025 - Unified Platform Launch + AI
                Security Audits
              </p>
              <p className="mt-4 text-cyber-green">
                Got questions about the unified platform or AI audits? Ask and
                we'll update accordingly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
