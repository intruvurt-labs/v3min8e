import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-cyber font-black text-destructive mb-6 neon-glow">
              FINANCIAL DISCLAIMER
            </h1>
            <p className="text-lg text-cyber-orange font-mono mb-4">
              Important Risk Warnings & Legal Notices
            </p>
            <p className="text-sm text-gray-400 font-mono">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8 text-gray-300 font-mono">
            {/* Main Warning */}
            <section className="border border-destructive p-8 bg-destructive/10 neon-border">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-cyber font-bold text-destructive mb-4">
                  CRITICAL WARNING
                </h2>
                <p className="text-destructive font-bold text-lg">
                  CRYPTOCURRENCY INVESTMENTS CARRY EXTREME RISK OF TOTAL LOSS
                </p>
              </div>
            </section>

            <section className="border border-destructive/30 p-6 bg-destructive/5">
              <h2 className="text-xl font-cyber font-bold text-destructive mb-4">
                1. NOT FINANCIAL ADVICE
              </h2>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive font-bold mb-2">
                    EDUCATIONAL PURPOSE ONLY
                  </p>
                  <p>
                    All content, analysis, tools, and information provided by
                    NimRev are for educational and informational purposes only.
                    Nothing on this platform constitutes financial, investment,
                    trading, or legal advice.
                  </p>
                </div>
                <div className="p-4 bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive font-bold mb-2">
                    NO RECOMMENDATIONS
                  </p>
                  <p>
                    NimRev does not recommend, endorse, or suggest any specific
                    cryptocurrency, token, project, or investment strategy.
                    Detection of patterns does not imply investment
                    recommendations.
                  </p>
                </div>
                <div className="p-4 bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive font-bold mb-2">
                    CONSULT PROFESSIONALS
                  </p>
                  <p>
                    Always consult qualified financial advisors, legal counsel,
                    and tax professionals before making any financial decisions.
                    Each individual's situation is unique.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                2. CRYPTOCURRENCY RISKS
              </h2>
              <div className="space-y-3 text-sm">
                <p className="text-cyber-orange font-bold mb-3">
                  Investing in cryptocurrencies involves substantial risks
                  including:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2">
                    <li>
                      • <strong>Total Loss of Capital:</strong> You may lose
                      100% of your investment
                    </li>
                    <li>
                      • <strong>Extreme Volatility:</strong> Prices can
                      fluctuate wildly without warning
                    </li>
                    <li>
                      • <strong>Regulatory Changes:</strong> Government actions
                      can severely impact values
                    </li>
                    <li>
                      • <strong>Technology Risks:</strong> Smart contract bugs
                      and protocol failures
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li>
                      • <strong>Market Manipulation:</strong> Pump and dump
                      schemes are common
                    </li>
                    <li>
                      • <strong>Liquidity Risk:</strong> Inability to sell when
                      desired
                    </li>
                    <li>
                      • <strong>Scams & Fraud:</strong> High prevalence of
                      malicious projects
                    </li>
                    <li>
                      • <strong>Technical Complexity:</strong> Irreversible
                      transactions and lost keys
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                3. DFS PLAYERS STATS BETTING REGULATIONS
              </h2>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-cyber-purple/10 border border-cyber-purple/30">
                  <p className="text-cyber-purple font-bold mb-2">
                    DAILY FANTASY SPORTS (DFS) COMPLIANCE
                  </p>
                  <p>
                    If NimRev features any fantasy sports or prediction
                    elements, users must comply with local DFS regulations. Age
                    and location restrictions apply.
                  </p>
                </div>
                <div className="p-4 bg-cyber-purple/10 border border-cyber-purple/30">
                  <p className="text-cyber-purple font-bold mb-2">
                    GAMBLING REGULATIONS
                  </p>
                  <p>
                    Any betting, wagering, or prediction features are subject to
                    local gambling laws. Users are responsible for verifying
                    legality in their jurisdiction.
                  </p>
                </div>
                <div className="p-4 bg-cyber-purple/10 border border-cyber-purple/30">
                  <p className="text-cyber-purple font-bold mb-2">
                    REGISTRATION REQUIREMENTS
                  </p>
                  <p>
                    Where applicable, users must register with appropriate
                    regulatory bodies. Check with local authorities for
                    registration requirements.
                  </p>
                </div>
                <div className="p-4 bg-cyber-purple/10 border border-cyber-purple/30">
                  <p className="text-cyber-purple font-bold mb-2">
                    PROHIBITED JURISDICTIONS
                  </p>
                  <p>
                    These features may be unavailable in certain jurisdictions
                    including but not limited to: states with strict DFS
                    prohibitions, countries with gambling restrictions, and
                    jurisdictions where such activities are illegal.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                4. PLATFORM LIMITATIONS
              </h2>
              <div className="space-y-3 text-sm">
                <p>Users acknowledge and understand:</p>
                <ul className="space-y-2 ml-4">
                  <li>
                    • Our analysis tools may have false positives or miss
                    fraudulent activity
                  </li>
                  <li>• Blockchain data can be incomplete or delayed</li>
                  <li>• Platform uptime and availability are not guaranteed</li>
                  <li>
                    • Detection algorithms are continuously evolving and may
                    change
                  </li>
                  <li>
                    • No warranty is provided for accuracy or completeness of
                    information
                  </li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                5. PERSONAL RESPONSIBILITY
              </h2>
              <div className="space-y-4 text-sm">
                <div className="p-3 bg-cyber-green/10 border-l-4 border-cyber-green">
                  <p>
                    <strong>Due Diligence:</strong> Always conduct your own
                    research and verification before making financial decisions.
                  </p>
                </div>
                <div className="p-3 bg-cyber-green/10 border-l-4 border-cyber-green">
                  <p>
                    <strong>Risk Assessment:</strong> Only invest what you can
                    afford to lose completely without affecting your financial
                    well-being.
                  </p>
                </div>
                <div className="p-3 bg-cyber-green/10 border-l-4 border-cyber-green">
                  <p>
                    <strong>Legal Compliance:</strong> Ensure all activities
                    comply with local laws and regulations in your jurisdiction.
                  </p>
                </div>
                <div className="p-3 bg-cyber-green/10 border-l-4 border-cyber-green">
                  <p>
                    <strong>Security Practices:</strong> Maintain proper
                    security for your digital assets and never share private
                    keys.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-destructive/30 p-6 bg-destructive/5">
              <h2 className="text-xl font-cyber font-bold text-destructive mb-4">
                6. LIMITATION OF LIABILITY
              </h2>
              <div className="space-y-3 text-sm">
                <div className="p-4 bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive font-bold mb-2">
                    NO LIABILITY FOR LOSSES
                  </p>
                  <p>
                    NimRev, its developers, operators, and affiliates shall not
                    be liable for any financial losses, damages, or consequences
                    resulting from:
                  </p>
                  <ul className="space-y-1 ml-4 mt-2">
                    <li>• Use of or reliance on our platform or information</li>
                    <li>• Financial decisions made based on our analysis</li>
                    <li>• Platform downtime, errors, or inaccuracies</li>
                    <li>• Third-party actions or market movements</li>
                    <li>• Regulatory changes or legal actions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                7. TAX IMPLICATIONS
              </h2>
              <div className="space-y-3 text-sm">
                <p>Users are solely responsible for:</p>
                <ul className="space-y-2 ml-4">
                  <li>
                    • Understanding tax implications of cryptocurrency
                    activities
                  </li>
                  <li>• Maintaining accurate records of all transactions</li>
                  <li>
                    • Reporting income and capital gains as required by law
                  </li>
                  <li>• Consulting tax professionals for guidance</li>
                  <li>• Complying with all applicable tax regulations</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                8. REGULATORY COMPLIANCE
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  Users must ensure compliance with all applicable regulations
                  including:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Securities laws and investment regulations</li>
                  <li>• Anti-money laundering (AML) requirements</li>
                  <li>• Know Your Customer (KYC) obligations</li>
                  <li>• Gaming and gambling regulations where applicable</li>
                  <li>• Local financial services regulations</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                9. ACKNOWLEDGMENT & ACCEPTANCE
              </h2>
              <div className="space-y-3 text-sm">
                <p>By using NimRev services, you acknowledge that you have:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Read and understood this disclaimer in its entirety</li>
                  <li>
                    • Understood the risks associated with cryptocurrency
                    investments
                  </li>
                  <li>
                    • Confirmed you are of legal age (18+) in your jurisdiction
                  </li>
                  <li>
                    • Agreed to assume full responsibility for your financial
                    decisions
                  </li>
                  <li>
                    • Agreed not to hold NimRev liable for any losses or damages
                  </li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                10. CONTACT INFORMATION
              </h2>
              <div className="space-y-3 text-sm">
                <p>For questions about this disclaimer:</p>
                <div className="p-3 bg-cyber-green/10 border border-cyber-green/30">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:verm@nimrev.xyz"
                      className="text-cyber-blue hover:text-cyber-orange transition-colors"
                    >
                      verm@nimrev.xyz
                    </a>
                  </p>
                  <p>
                    <strong>Subject Line:</strong> Financial Disclaimer Inquiry
                  </p>
                  <p>
                    <strong>Legal Notice:</strong> This communication does not
                    create attorney-client relationship
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
