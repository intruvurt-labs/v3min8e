import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";

export default function About() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="medium" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Founder */}
          <div className="text-center mb-16">
            <div className="terminal mb-8 inline-block">
              <span className="text-cyber-green font-mono text-sm">
                Accessing origin story database...
              </span>
            </div>

            {/* Founder Image and Intro */}
            <div className="flex items-center justify-center mb-8">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F9a8474ab0524497c85c9ce04674c08c9%2F69a0ab5b1984497f8030b072931b0c42?format=webp&width=800"
                alt="DobledUche - Web3 Alchemist & NimRev Founder"
                className="w-32 h-32 rounded-full border-4 border-cyber-green shadow-2xl neon-glow mr-8"
              />
              <div className="text-left">
                <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-2">
                 R.Mason aka @DOBLEDUCHE
                </h2>
                <p className="text-cyber-blue font-mono text-lg mb-2">
                  Web3 Alchemist & Founder
                </p>
                <p className="text-cyber-orange font-mono text-sm italic">
                  "Power stays with the people. No hidden agendas. No
                  compromise."
                </p>
              </div>
            </div>

            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              ABOUT NIMREV GRID
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-4">
              The Real Story Behind the Subversive Intelligence Network
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-orange mx-auto animate-cyber-scan"></div>
          </div>

          {/* Core Ethos & Origin Story */}
          <section className="mb-16">
            <div className="border border-cyber-green/30 p-8 bg-cyber-green/5 neon-border">
              <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-8 flex items-center">
                <span className="text-4xl mr-3">🐀</span>
                THE VERMIN REVOLUTION
              </h2>

              {/* Core Ethos Highlight */}
              <div className="mb-8 p-6 bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg">
                <div className="text-center">
                  <h3 className="text-2xl font-cyber font-bold text-cyber-orange mb-4">
                    CORE ETHOS
                  </h3>
                  <blockquote className="text-xl font-mono italic text-cyber-orange">
                    "Power stays with the people. No hidden agendas. No
                    compromise."
                  </blockquote>
                  <p className="text-gray-300 font-mono text-sm mt-4">
                    NimRev challenges centralized narratives by providing
                    transparent, real-time threat intelligence directly to
                    communities, empowering them before risks are buried or
                    sanitized.
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-gray-300 font-mono leading-relaxed">
                <p className="text-lg">
                  <span className="text-cyber-green font-bold">
                    It started in the shadows.
                  </span>{" "}
                  Not in some Silicon Valley office with unlimited funding and
                  corporate backing. No – NimRev Grid was born in the digital
                  underground, built by those who got tired of watching the same
                  scams, rugs, and manipulations destroy real people's savings.
                </p>

                <p>
                  We were the ones who lost money to honeypots. The ones who
                  watched promising projects get rug-pulled. The ones who saw
                  whales manipulating markets while retail investors got rekt
                  over and over again.
                  <span className="text-cyber-orange font-bold">
                    {" "}
                    We said "enough."
                  </span>
                </p>

                <p>
                  So we started building. Not for profit. Not for glory. But
                  because someone had to level the playing field.
                  <span className="text-cyber-blue font-bold">
                    The vermin were tired of being prey.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* The Grind */}
          <section className="mb-16">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                <h3 className="text-2xl font-cyber font-bold text-cyber-blue mb-6 flex items-center">
                  <span className="text-3xl mr-3">⚡</span>
                  THE GRIND
                </h3>
                <div className="space-y-4 text-gray-300 font-mono text-sm">
                  <p>
                    <strong className="text-cyber-blue">Late nights.</strong>{" "}
                    Endless debugging. Scraping together server costs. Building
                    AI models on borrowed compute time.
                  </p>
                  <p>
                    <strong className="text-cyber-blue">
                      Small budget, big dreams.
                    </strong>{" "}
                    While other projects raised millions, we built with what we
                    had. Every line of code mattered. Every optimization
                    counted.
                  </p>
                  <p>
                    <strong className="text-cyber-blue">No shortcuts.</strong>{" "}
                    No copy-paste solutions. Every algorithm, every detection
                    method, every piece of the protocol was crafted from scratch
                    with one goal: protect the real ones.
                  </p>
                  <p className="text-cyber-green font-bold">
                    "If you're not grinding, you're not earning the right to
                    succeed."
                  </p>
                </div>
              </div>

              <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
                <h3 className="text-2xl font-cyber font-bold text-cyber-orange mb-6 flex items-center">
                  <span className="text-3xl mr-3">🔥</span>
                  ORGANIC GROWTH
                </h3>
                <div className="space-y-4 text-gray-300 font-mono text-sm">
                  <p>
                    <strong className="text-cyber-orange">
                      No whale manipulation.
                    </strong>{" "}
                    No artificial pumps. No paid influencers or fake hype. Just
                    real utility solving real problems.
                  </p>
                  <p>
                    <strong className="text-cyber-orange">
                      Word of mouth.
                    </strong>{" "}
                    One user telling another about how NimRev saved them from a
                    honeypot. Another sharing how our alpha signals helped them
                    catch a 100x before everyone else.
                  </p>
                  <p>
                    <strong className="text-cyber-orange">Earned trust.</strong>{" "}
                    Every threat we detected. Every scam we prevented. Every
                    alpha signal that paid off. That's how we grew. That's how
                    we'll continue to grow.
                  </p>
                  <p className="text-cyber-green font-bold">
                    "Organic is the only sustainable path to real success."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* The Monster It Became */}
          <section className="mb-16">
            <div className="border border-cyber-purple/30 p-8 bg-cyber-purple/5">
              <h2 className="text-3xl font-cyber font-bold text-cyber-purple mb-8 flex items-center">
                <span className="text-4xl mr-3">🚀</span>
                HOW IT BECAME A MONSTER
              </h2>

              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-cyber font-black text-cyber-green mb-2">
                    5
                  </div>
                  <div className="text-cyber-green font-mono text-sm">
                    Blockchain Networks
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-cyber font-black text-cyber-blue mb-2">
                    1000+
                  </div>
                  <div className="text-cyber-blue font-mono text-sm">
                    Threats Detected Daily
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-cyber font-black text-cyber-orange mb-2">
                    $2M+
                  </div>
                  <div className="text-cyber-orange font-mono text-sm">
                    Saved from Scams
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-gray-300 font-mono leading-relaxed">
                <p>
                  What started as a simple honeypot detector grew into something
                  much bigger.
                  <span className="text-cyber-purple font-bold">
                    A complete blockchain intelligence platform.
                  </span>
                  Multi-chain scanning. AI-powered threat detection. Alpha
                  signal identification. Viral outbreak prediction.
                </p>

                <p>
                  But we never forgot where we came from.{" "}
                  <span className="text-cyber-green font-bold">
                    No corporate bullshit. No marketing fluff. No promises we
                    can't keep.
                  </span>{" "}
                  Just raw, unfiltered technology that works when you need it
                  most.
                </p>

                <p>
                  The protocol became lucrative not because we chased money, but
                  because we chased excellence.{" "}
                  <span className="text-cyber-orange font-bold">
                    Real utility creates real value.
                  </span>
                  And real value attracts real users who are willing to pay for
                  real solutions.
                </p>
              </div>
            </div>
          </section>

          {/* The Real Ones */}
          <section className="mb-16">
            <div className="border border-cyber-green/30 p-8 bg-gradient-to-r from-cyber-green/10 to-cyber-blue/10">
              <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-8 flex items-center">
                <span className="text-4xl mr-3">💎</span>
                ONLY THE REAL ONES
              </h2>

              <div className="space-y-6 text-gray-300 font-mono leading-relaxed">
                <p className="text-xl text-cyber-green font-bold">
                  "Only the real ones will stay. Only the real ones will get
                  paid."
                </p>

                <p>
                  This isn't a get-rich-quick scheme. This isn't a meme coin
                  pump.
                  <span className="text-cyber-blue font-bold">
                    This is for the builders, the grinders, the ones who
                    understand that real wealth comes from real value.
                  </span>
                </p>

                <p>
                  When the market crashes, the real ones keep building. When the
                  hype dies down, the real ones keep improving. When others move
                  on to the next shiny object,
                  <span className="text-cyber-orange font-bold">
                    the real ones stay and make the protocol stronger.
                  </span>
                </p>

                <p>
                  We're not here to convince anyone. We're not here to hype
                  anyone up.
                  <span className="text-cyber-purple font-bold">
                    We're here to serve those who recognize real innovation when
                    they see it.
                  </span>
                </p>

                <div className="mt-8 p-6 bg-cyber-green/10 border border-cyber-green/30">
                  <p className="text-cyber-green font-bold text-center">
                    If you're still reading this, you might just be one of the
                    real ones.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Tech Philosophy */}
          <section className="mb-16">
            <div className="border border-cyber-orange/30 p-8 bg-cyber-orange/5">
              <h2 className="text-3xl font-cyber font-bold text-cyber-orange mb-8 flex items-center">
                <span className="text-4xl mr-3">🛠️</span>
                OUR PHILOSOPHY
              </h2>

              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                    NO BULLSHIT PRINCIPLES
                  </h3>
                  <ul className="space-y-3 text-gray-300 font-mono text-sm">
                    <li className="flex items-start">
                      <span className="text-cyber-orange mr-2">•</span>
                      <span>
                        <strong>Transparency:</strong> Our code speaks louder
                        than our marketing
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-cyber-orange mr-2">•</span>
                      <span>
                        <strong>Utility First:</strong> Every feature must solve
                        a real problem
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-cyber-orange mr-2">•</span>
                      <span>
                        <strong>Community Driven:</strong> Built by users, for
                        users
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-cyber-orange mr-2">•</span>
                      <span>
                        <strong>Open Source Spirit:</strong> Knowledge should be
                        shared
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-cyber-orange mr-2">•</span>
                      <span>
                        <strong>Ethical Technology:</strong> Protect the
                        ecosystem, not exploit it
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                    WHAT WE STAND AGAINST
                  </h3>
                  <ul className="space-y-3 text-gray-300 font-mono text-sm">
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Pump and dump schemes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Whale manipulation tactics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Fake utility promises</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Predatory tokenomics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Community exploitation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* SUBVERSION SWEEP Capabilities */}
          <section className="mb-16">
            <h2 className="text-3xl font-cyber font-bold text-cyber-blue mb-8 flex items-center">
              <span className="text-4xl mr-3">🕸️</span>
              SUBVERSION SWEEP TECHNOLOGY
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                    24/7 BLOCKCHAIN LISTENER
                  </h3>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• Persistent Node.js workers on multiple chains</li>
                    <li>• Real-time detection of new tokens/contracts</li>
                    <li>• Cross-chain threat correlation</li>
                    <li>• Address fingerprinting for bad actors</li>
                  </ul>
                </div>

                <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                    THREAT SCORING (0-100)
                  </h3>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• 0-30: High risk (auto-broadcast alerts)</li>
                    <li>• 31-70: Neutral, monitored</li>
                    <li>• 71-100: Potential alpha signals</li>
                    <li>• Community-weighted intelligence</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-cyber-green/30 p-6 bg-cyber-green/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                    TRANSPARENCY LEDGER
                  </h3>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• All scans are public and immutable</li>
                    <li>• Stored in Supabase + IPFS</li>
                    <li>• Cryptographic signatures for verification</li>
                    <li>• Community can verify any scan result</li>
                  </ul>
                </div>

                <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
                  <h3 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                    PRE-EMPTIVE ALERTS
                  </h3>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• Detects liquidity drains seconds before execution</li>
                    <li>• Social media monitoring for viral signals</li>
                    <li>• Webhook/API alerts to subscribers</li>
                    <li>• Multi-platform broadcasting</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Built with GRIT - Developer Experience */}
          <section className="mb-16">
            <div className="border border-cyber-purple/30 p-8 bg-cyber-purple/5 neon-border">
              <h2 className="text-3xl font-cyber font-bold text-cyber-purple mb-8 flex items-center">
                <span className="text-4xl mr-3">💻</span>
                BUILT WITH GRIT, NOT GIMMICKS
              </h2>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F9a8474ab0524497c85c9ce04674c08c9%2F3a3f3e49e311411ea9bc9a34fd0d9bd4?format=webp&width=800"
                    alt="Developer Experience - Starting vs Getting Errors"
                    className="w-full h-auto rounded-lg border border-cyber-purple/30 shadow-lg"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-lg text-gray-300 font-mono leading-relaxed">
                    <span className="text-cyber-purple font-bold">
                      We understand the struggle.
                    </span>{" "}
                    Every developer knows the pain: starting a new project with
                    excitement, only to spend hours debugging cryptic errors and
                    fighting with dependencies.
                  </p>

                  <p className="text-gray-300 font-mono">
                    NimRev Grid was built by developers who live this reality.
                    We chose battle-tested technologies, implemented proper
                    error handling, and created systems that actually work when
                    you need them most.
                  </p>

                  <div className="bg-cyber-purple/10 p-4 rounded border border-cyber-purple/30">
                    <p className="text-cyber-purple font-mono text-sm italic">
                      "Created for thinkers, tinkerers, and terminal
                      truth-seekers. If you're tired of noise—start listening to
                      the reverse frequency."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Join the Network */}
          <section>
            <div className="text-center border border-cyber-green/30 p-8 bg-gradient-to-r from-cyber-green/5 to-cyber-purple/5">
              <h2 className="text-3xl font-cyber font-bold text-cyber-green mb-6">
                READY TO JOIN THE VERMIN NETWORK?
              </h2>

              <p className="text-gray-300 font-mono mb-8 max-w-2xl mx-auto">
                The rats are always watching. Always analyzing. Always
                protecting the real ones from the shadows. If you're tired of
                being prey in someone else's game, it's time to become a
                predator in your own.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/staking"
                  className="px-8 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border"
                >
                  STAKE VERM
                </a>
                <a
                  href="/"
                  className="px-8 py-4 border-2 border-cyber-blue text-cyber-blue font-mono font-bold tracking-wider hover:bg-cyber-blue/20 transition-all duration-300"
                >
                  START SCANNING
                </a>
              </div>

              <div className="mt-6 text-cyber-orange font-mono text-sm">
                🐀 Stay weird. Stay watching. The rats are in the wires now.
              </div>
            </div>
          </section>
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
