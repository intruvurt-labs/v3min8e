import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import CryptoTwitterFeed from "@/components/CryptoTwitterFeed";
import AdvancedChatTrading from "@/components/AdvancedChatTrading";

export default function Community() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="terminal mb-8 inline-block">
              <span className="text-cyber-green font-mono text-sm">
                Connecting to NimRev network...
              </span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              DATA GHOST NETWORK
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-4">
              Live Chat • Address Scanning • E2E Encryption
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-orange mx-auto animate-cyber-scan"></div>
          </div>

          {/* Main Chat Feature */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-cyber font-bold text-cyber-purple mb-4 neon-glow">
                🌐 LIVE COMMUNITY CHAT
              </h2>
              <p className="text-lg text-gray-300 font-mono mb-6">
                Advanced P2P trading with military-grade encryption, atomic
                swaps, and zero-knowledge proofs.
                <br />
                <span className="text-cyber-green">
                  Trade tokens securely with live address scanning!
                </span>
              </p>
            </div>

            <AdvancedChatTrading />

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-4 bg-dark-bg/60 border border-cyber-green/30 rounded-lg p-4">
                <div className="text-xs font-mono text-gray-300">
                  <span className="text-cyber-green">🆓 FREE:</span> Chat &
                  basic trading
                </div>
                <div className="text-xs font-mono text-gray-300">
                  <span className="text-cyber-purple">👑 PREMIUM:</span>{" "}
                  Advanced P2P trading & escrow
                </div>
                <div className="text-xs font-mono text-gray-300">
                  <span className="text-cyber-blue">��� MILITARY:</span>{" "}
                  Quantum-resistant encryption
                </div>
                <div className="text-xs font-mono text-gray-300">
                  <span className="text-cyber-orange">⚡ ATOMIC:</span>{" "}
                  Zero-trust swaps
                </div>
              </div>
            </div>
          </section>

          {/* Philosophy */}
          <section className="mb-16 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-cyber font-bold text-cyber-orange mb-8 neon-glow">
                "In a world full of bots, be the Ghost."
              </h2>
              <p className="text-lg text-gray-300 font-mono leading-relaxed mb-8">
                The NimRev community consists of data ghosts, silent watchers,
                and precision actors who understand that the best advantage
                comes from staying quiet, analyzing signals, and acting with
                purpose. We are not pump chasers or noise makers—we are the
                intelligent observers who see patterns before they become
                obvious.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="text-lg font-cyber font-bold text-cyber-green mb-2">
                    LIVE SCANNING
                  </h3>
                  <p className="text-sm text-gray-300 font-mono">
                    Paste any blockchain address in chat for instant risk
                    analysis
                  </p>
                </div>

                <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-2">
                    ENCRYPTED CHAT
                  </h3>
                  <p className="text-sm text-gray-300 font-mono">
                    End-to-end encryption keeps conversations secure
                  </p>
                </div>

                <div className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-4">
                  <div className="text-2xl mb-2">🛡️</div>
                  <h3 className="text-lg font-cyber font-bold text-cyber-purple mb-2">
                    SCREEN PROTECTION
                  </h3>
                  <p className="text-sm text-gray-300 font-mono">
                    Anti-screenshot technology protects sensitive data
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="mb-16">
            <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-8 text-center flex items-center justify-center">
              <span className="text-4xl mr-3">🌐</span>
              CONNECT WITH US
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <a
                href="https://x.com/nimrevxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-cyber-blue/30 p-8 bg-cyber-blue/5 hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all duration-300 text-center neon-border"
              >
                <div className="text-4xl mb-4 group-hover:animate-pulse">
                  🐦
                </div>
                <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-2">
                  Twitter
                </h3>
                <p className="text-gray-300 font-mono text-sm mb-4">
                  @nimrevxyz
                </p>
                <p className="text-gray-400 font-mono text-xs">
                  Real-time alerts, updates, and community insights
                </p>
              </a>

              <a
                href="https://t.me/nimrevxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-cyber-green/30 p-8 bg-cyber-green/5 hover:border-cyber-green hover:bg-cyber-green/10 transition-all duration-300 text-center neon-border"
              >
                <div className="text-4xl mb-4 group-hover:animate-pulse">
                  💬
                </div>
                <h3 className="text-xl font-cyber font-bold text-cyber-green mb-2">
                  Telegram
                </h3>
                <p className="text-gray-300 font-mono text-sm mb-4">
                  @nimrevxyz
                </p>
                <p className="text-gray-400 font-mono text-xs">
                  Direct community chat and instant notifications
                </p>
              </a>

              <a
                href="https://discord.gg/nimrev"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-cyber-purple/30 p-8 bg-cyber-purple/5 hover:border-cyber-purple hover:bg-cyber-purple/10 transition-all duration-300 text-center neon-border"
              >
                <div className="text-4xl mb-4 group-hover:animate-pulse">
                  🎮
                </div>
                <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-2">
                  Discord
                </h3>
                <p className="text-gray-300 font-mono text-sm mb-4">
                  Join Server
                </p>
                <p className="text-gray-400 font-mono text-xs">
                  Technical discussions, support, and exclusive channels
                </p>
              </a>

              <a
                href="https://github.com/nimrev"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-cyber-orange/30 p-8 bg-cyber-orange/5 hover:border-cyber-orange hover:bg-cyber-orange/10 transition-all duration-300 text-center neon-border"
              >
                <div className="text-4xl mb-4 group-hover:animate-pulse">
                  ⚡
                </div>
                <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-2">
                  GitHub
                </h3>
                <p className="text-gray-300 font-mono text-sm mb-4">
                  Open Source
                </p>
                <p className="text-gray-400 font-mono text-xs">
                  Contribute to tools, report issues, build plugins
                </p>
              </a>
            </div>
          </section>

          {/* Community Engagement */}
          <section className="mb-16">
            <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-8 flex items-center">
              <span className="text-4xl mr-3">🤝</span>
              FOSTERING COMMUNITY ENGAGEMENT
            </h2>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                    Data Ghost Collective
                  </h3>
                  <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                    Our community thrives on the principle of collaborative
                    intelligence. We foster an environment where experienced
                    analysts mentor newcomers, sharing knowledge about
                    blockchain patterns, risk assessment, and detection
                    methodologies.
                  </p>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• Weekly pattern analysis workshops</li>
                    <li>• Peer-to-peer learning sessions</li>
                    <li>• Collaborative scam investigation teams</li>
                    <li>• Knowledge sharing through case studies</li>
                  </ul>
                </div>

                <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                    Recognition & Rewards
                  </h3>
                  <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                    We implement a merit-based system that recognizes valuable
                    contributions to the community through our Report-to-Earn
                    program and leaderboard systems.
                  </p>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• $VERM token rewards for verified reports</li>
                    <li>• NFT Ghost Badges for elite contributors</li>
                    <li>• Monthly community spotlight features</li>
                    <li>• Access to exclusive tools and early features</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-8">
                <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                    Educational Initiatives
                  </h3>
                  <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                    We believe in democratizing blockchain security knowledge.
                    Our educational programs make complex detection methods
                    accessible to users at all skill levels.
                  </p>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• "Learn to Read the Chain" tutorial series</li>
                    <li>• Interactive pattern recognition tools</li>
                    <li>• Beginner-friendly documentation</li>
                    <li>�� Community-driven content creation</li>
                  </ul>
                </div>

                <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                    Sustainable Growth
                  </h3>
                  <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                    Our community growth strategy focuses on quality over
                    quantity, attracting serious participants who contribute
                    meaningfully to the ecosystem's long-term success.
                  </p>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• Invitation-based growth model</li>
                    <li>• Community governance participation</li>
                    <li>• Sustainable reward mechanisms</li>
                    <li>• Long-term vision alignment</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Target Audiences */}
          <section className="mb-16">
            <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-8 flex items-center">
              <span className="text-4xl mr-3">🎯</span>
              OUR TARGET AUDIENCES
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Crypto Newcomers",
                  icon: "🌱",
                  description:
                    "Teenagers and young adults entering crypto who want to learn proper risk assessment and blockchain analysis",
                  color: "cyber-green",
                },
                {
                  title: "Active Traders",
                  icon: "📈",
                  description:
                    "Professional and semi-professional traders seeking edge through early scam detection and trend spotting",
                  color: "cyber-blue",
                },
                {
                  title: "DeFi Builders",
                  icon: "🏗️",
                  description:
                    "Developers and project creators who need to assess token ecosystem health and avoid malicious partnerships",
                  color: "cyber-orange",
                },
                {
                  title: "Security Researchers",
                  icon: "🔬",
                  description:
                    "Blockchain security experts, auditors, and researchers studying attack patterns and defense mechanisms",
                  color: "cyber-purple",
                },
              ].map((audience, i) => (
                <div
                  key={i}
                  className={`border border-${audience.color}/30 p-6 bg-${audience.color}/5 hover:border-${audience.color} transition-all duration-300 text-center`}
                >
                  <div className="text-4xl mb-4">{audience.icon}</div>
                  <h3
                    className={`text-lg font-cyber font-bold text-${audience.color} mb-3`}
                  >
                    {audience.title}
                  </h3>
                  <p className="text-gray-300 font-mono text-sm leading-relaxed">
                    {audience.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Sustainability Efforts */}
          <section className="mb-16 border border-cyber-green/30 p-8 bg-cyber-green/5 neon-border">
            <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-8 flex items-center">
              <span className="text-4xl mr-3">♻️</span>
              SUSTAINABLE COMMUNITY EFFORTS
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                  Environmental Responsibility
                </h3>
                <ul className="space-y-3 text-gray-300 font-mono text-sm">
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>
                      Carbon-neutral hosting infrastructure using renewable
                      energy sources
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>
                      Efficient algorithms that minimize computational overhead
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>
                      Supporting Layer 2 solutions for reduced blockchain energy
                      consumption
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                  Economic Sustainability
                </h3>
                <ul className="space-y-3 text-gray-300 font-mono text-sm">
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>Transparent tokenomics with community governance</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>
                      Revenue sharing model for active community contributors
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>
                      Long-term incentive alignment between platform and users
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                  Social Impact
                </h3>
                <ul className="space-y-3 text-gray-300 font-mono text-sm">
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>
                      Free educational resources for underprivileged communities
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>Open-source tools accessible to all developers</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyber-green mr-2">▸</span>
                    <div>
                      Partnerships with educational institutions for blockchain
                      literacy
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Join Us CTA */}
          <section className="text-center border border-cyber-blue/50 p-12 bg-cyber-blue/5 neon-border">
            <h2 className="text-4xl font-cyber font-bold text-cyber-blue mb-6 neon-glow">
              BECOME A DATA GHOST
            </h2>
            <p className="text-xl text-gray-300 font-mono mb-8 max-w-3xl mx-auto">
              Join a community that values intelligence over hype, precision
              over noise, and collaborative success over individual glory.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://t.me/nimrevxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border animate-pulse-glow"
              >
                JOIN TELEGRAM
              </a>
              <a
                href="https://discord.gg/nimrev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border-2 border-cyber-blue text-cyber-blue font-mono font-bold tracking-wider hover:bg-cyber-blue/20 transition-all duration-300"
              >
                JOIN DISCORD
              </a>
            </div>
            <p className="text-gray-400 font-mono text-sm mt-6">
              Ready to see what others miss? The network is waiting.
            </p>
          </section>
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
