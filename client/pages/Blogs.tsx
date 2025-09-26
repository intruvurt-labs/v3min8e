import { useEffect } from "react";
import { Link } from "react-router-dom";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import CyberGrid from "@/components/CyberGrid";
import { useDynamicSEO, useSEOTracking } from "@/hooks/useDynamicSEO";

export default function CrossChainSecurity2025() {
  // SEO init
  const { setMeta } = useDynamicSEO("article", {
    title: "Cross Chain Security in 2025 — How Aurebix and NimRev Are Redefining Trust",
    description:
      "Aurebix Mini + NimRev deliver subversion-first detection, soft-upgrade resilience, and verifiable logs for cross chain security.",
    keywords: [
      "cross chain security",
      "blockchain threat detection",
      "rug pull prevention",
      "Aurebix Mini",
      "NimRev scanner",
      "agent workflow builder",
      "reverse mining",
      "subversion sweep",
    ],
    readingTime: "12 min",
    category: "Security Research",
    publishedAt: "2025-09-26",
  });

  const { trackInteraction } = useSEOTracking();

  useEffect(() => {
    setMeta?.();
    trackInteraction("view_article", { slug: "cross-chain-security-2025" });
  }, []);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Cross Chain Security in 2025 How Aurebix and NimRev Are Redefining Trust",
    description:
      "Why subversion-first detection and soft-upgrade SaaS matter for cross chain security in 2025.",
    datePublished: "2025-09-26",
    author: { "@type": "Organization", name: "Aurebix" },
    publisher: {
      "@type": "Organization",
      name: "Aurebix",
      logo: { "@type": "ImageObject", url: "https://aurebix.pro/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": "https://aurebix.pro/blog/cross-chain-security-2025" },
    articleSection: "Security Research",
    keywords:
      "cross chain security, blockchain threat detection, Aurebix Mini, NimRev, reverse mining, subversion sweep",
  };

  const SectionCard: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
    id,
    title,
    children,
  }) => (
    <section id={id} className="scroll-mt-28">
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_8px_50px_-12px_rgba(0,0,0,0.4)]">
        <h2 className="text-xl md:text-2xl font-cyber font-black text-gray-100 mb-3">
          {title}
        </h2>
        <div className="h-px w-full bg-white/10 mb-5" />
        <div className="prose prose-invert max-w-none">
          {children}
        </div>
      </div>
    </section>
  );

  const Anchor: React.FC<{ to: string; label: string }> = ({ to, label }) => (
    <a
      href={to}
      onClick={() => trackInteraction("toc_click", { to })}
      className="px-3 py-2 rounded-lg text-sm font-mono text-gray-200 hover:text-cyber-green hover:bg-white/5 transition-colors border border-white/10"
    >
      {label}
    </a>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f19] via-[#0b0f19] to-[#090d15] text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated />
      <CyberNav />

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="relative z-10 pt-24 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Hero Glass */}
          <div className="mb-10 backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_20px_70px_-24px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <span className="px-3 py-1 text-xs font-mono rounded-full border border-white/10 bg-white/5 text-gray-300">
                Security Research
              </span>
              <span className="text-xs font-mono text-gray-400">
                12 min read • {new Date("2025-09-26").toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-cyber font-black tracking-tight text-gray-100 mb-4">
              Cross Chain Security in 2025 <span className="text-cyber-green">How Aurebix and NimRev Are Redefining Trust</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 font-mono leading-relaxed">
              The multi chain future demands more than passive scanning. Aurebix Mini with NimRev introduces
              subversion first detection, soft upgrade resilience, and verifiable logs so your apps ship fast and stay safe.
            </p>
          </div>

          {/* TOC Glass */}
          <div className="mb-14 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-cyber font-bold text-gray-100 mb-3">Table of Contents</h3>
            <div className="flex flex-wrap gap-2">
              <Anchor to="#vectors" label="Attack Vectors" />
              <Anchor to="#exploits" label="Real World Exploits" />
              <Anchor to="#methods" label="Subversion and Reverse Mining" />
              <Anchor to="#aurebix" label="Aurebix Mini Layer" />
              <Anchor to="#soft-upgrade" label="Soft Upgrade Logic" />
              <Anchor to="#logs" label="Logs and Notifications" />
              <Anchor to="#start" label="Getting Started" />
              <Anchor to="#future" label="Future Directions" />
              <Anchor to="#cta" label="Call to Action" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">

              <SectionCard id="vectors" title="Cross Chain Attack Vectors That Matter Right Now">
                <p>
                  Bridges move billions daily and adversaries follow the liquidity. The highest signal vectors we track:
                </p>
                <ul>
                  <li><strong>Flash bridge draining</strong> — race settlements across networks to pull value before confirmations finalize.</li>
                  <li><strong>Sandwich and arbitrage traps</strong> — orchestrated front running across chains to amplify price impact.</li>
                  <li><strong>Wormhole injection</strong> — introduce fake assets into relay paths to impersonate wrapped value.</li>
                  <li><strong>Fake wrapped assets</strong> — clones with hidden mint authority that flood pools with counterfeit supply.</li>
                  <li><strong>Liquidity sniping</strong> — exploit the first blocks of fresh liquidity when price oracles lag.</li>
                </ul>
                <p className="text-gray-400 text-sm">
                  Keywords: cross chain security, bridge exploits, multi chain vulnerability, blockchain protection.
                </p>
              </SectionCard>

              <SectionCard id="exploits" title="Real World Exploits and What They Teach Us">
                <p>
                  Large heists in 2024 and early 2025 revealed a pattern—detection that reacts after exits is too late.
                  Our learning: security must model <em>intent</em>, not just outcomes. That is why our stack correlates
                  on chain signals, code traits, and timing to raise early alerts.
                </p>
              </SectionCard>

              <SectionCard id="methods" title="Subversion Sweep and Reverse Mining Explained">
                <ul>
                  <li><strong>Subversion sweep</strong> inspects what attackers try to hide: delegatecalls, gated transfer logic, covert fee switches, and suspicious revert signatures.</li>
                  <li><strong>Reverse mining</strong> works backward from outcomes to isolate setups that only make sense in a malicious context.</li>
                </ul>
                <p>
                  Together they output <strong>TrustScore</strong> and <strong>RiskScore</strong> in real time, feeding your agent graph to block, warn, or proceed with confidence.
                </p>
              </SectionCard>

              <SectionCard id="aurebix" title="Aurebix Mini The Lightweight Security Layer for Builders">
                <ul>
                  <li>Drag and drop MCP agent graph with test and production modes.</li>
                  <li>Four free agents included; scale to fifty six plus on paid tiers.</li>
                  <li>OAuth via Google and GitHub, optional passwordless email, Unity and Zapier connectors.</li>
                  <li>Secure secret storage with KMS and audit trails for every run.</li>
                </ul>
                <p>
                  Indie speed, enterprise safety. That is the point of Aurebix Mini.
                </p>
              </SectionCard>

              <SectionCard id="soft-upgrade" title="Soft Upgrade Logic and Graceful Failure Handling">
                <p>
                  When a free plan hits its cap, we never hard fail. We queue tasks, notify the user, and present a non blocking upgrade path while preserving work.
                  Retries, backoff, and circuit breakers keep flows resilient even under stress.
                </p>
              </SectionCard>

              <SectionCard id="logs" title="Why Logs and Notifications Change the Game">
                <p>
                  Every node emits structured logs and trace spans. Sensitive data is redacted. Users can opt for email or webhook notifications per workflow or only on failures.
                  Auditable runs turn “it worked on my machine” into a verifiable timeline.
                </p>
              </SectionCard>

              <SectionCard id="start" title="Step by Step Getting Started">
                <ol>
                  <li>Sign in with Google, GitHub, or email.</li>
                  <li>Provision your four free agents.</li>
                  <li>Create a graph: On token event → NimRev scan → Send email alert.</li>
                  <li>Play in sandbox to validate.</li>
                  <li>Publish to production and monitor logs.</li>
                  <li>Add more agents and connectors as you grow.</li>
                </ol>
              </SectionCard>

              <SectionCard id="future" title="Looking Ahead Zero Knowledge Proofs and Collective Defense">
                <ul>
                  <li>Zero knowledge proofs to attest to safety without exposing private logic.</li>
                  <li>Community weighted intelligence for federated detection signals.</li>
                  <li>Model ensembles blending OpenAI, Gemini, and Anthropic for robust scoring.</li>
                </ul>
              </SectionCard>

              <SectionCard id="cta" title="Final Word and Call to Action">
                <p>
                  Security is adoption. With Aurebix Mini and NimRev you ship with trust built in. Start free with four agents and scale without migrations or downtime.
                </p>
                <div className="mt-5">
                  <Link
                    to="/builder"
                    onClick={() => trackInteraction("cta_click", { cta: "start_building" })}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-cyber-green/60 text-cyber-green backdrop-blur bg-cyber-green/10 hover:bg-cyber-green hover:text-[#0b0f19] transition-colors font-mono font-bold"
                  >
                    Start building — free agents included
                  </Link>
                </div>
              </SectionCard>

            </div>

            {/* Side Rail */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="text-sm font-cyber font-bold text-gray-100 mb-2">Why we matter</h4>
                <p className="text-sm text-gray-300 font-mono">
                  Operational security by default, never hard fail, and verifiable intelligence. That is Aurebix.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-gray-200 font-bold">Trust that compiles</div>
                    <div className="text-gray-400">Traces and replay</div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-gray-200 font-bold">Resilience</div>
                    <div className="text-gray-400">Soft upgrade on limits</div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-gray-200 font-bold">Security</div>
                    <div className="text-gray-400">Encrypted secrets</div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-gray-200 font-bold">Growth</div>
                    <div className="text-gray-400">Agents that earn</div>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="text-sm font-cyber font-bold text-gray-100 mb-2">Subscribe for new research</h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    trackInteraction("newsletter_submit", { page: "CrossChainSecurity2025" });
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    required
                    placeholder="ghost@protonmail.com"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-cyber-green"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg border border-cyber-green/60 text-cyber-green backdrop-blur bg-cyber-green/10 hover:bg-cyber-green hover:text-[#0b0f19] transition-colors font-mono font-bold"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <CyberFooter />
    </div>
  );
}
