import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              TERMS OF SERVICE
            </h1>
            <p className="text-lg text-cyber-blue font-mono mb-4">
              User Agreement & Service Terms
            </p>
            <p className="text-sm text-gray-400 font-mono">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8 text-gray-300 font-mono">
            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                1. ACCEPTANCE OF TERMS
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  By accessing or using NimRev services, you agree to be bound
                  by these Terms of Service and all applicable laws and
                  regulations. If you do not agree with any of these terms, you
                  are prohibited from using our services.
                </p>
                <div className="p-3 bg-cyber-green/10 border-l-4 border-cyber-green">
                  <p>
                    <strong>Age Requirement:</strong> You must be at least 18
                    years old to use NimRev services.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                2. SERVICE DESCRIPTION
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  NimRev provides blockchain intelligence and risk mitigation
                  tools including:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Real-time blockchain analysis and pattern detection</li>
                  <li>• Scam and fraud detection alerts</li>
                  <li>• Educational resources about blockchain security</li>
                  <li>• Community platform for sharing intelligence</li>
                </ul>
                <div className="p-3 bg-cyber-blue/10 border-l-4 border-cyber-blue mt-4">
                  <p>
                    <strong>Important:</strong> Our services are tools for
                    information and education only, not financial advice.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-destructive/30 p-6 bg-destructive/5">
              <h2 className="text-xl font-cyber font-bold text-destructive mb-4">
                3. DISCLAIMERS & LIMITATIONS
              </h2>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-destructive/10 border border-destructive/30">
                  <h3 className="text-destructive font-bold mb-2">
                    NOT FINANCIAL ADVICE
                  </h3>
                  <p>
                    NimRev does not provide financial, investment, or trading
                    advice. All information is for educational and research
                    purposes only. Users must conduct their own research and
                    make independent decisions.
                  </p>
                </div>
                <div className="p-4 bg-destructive/10 border border-destructive/30">
                  <h3 className="text-destructive font-bold mb-2">
                    NO GUARANTEES
                  </h3>
                  <p>
                    We cannot guarantee the accuracy, completeness, or
                    timeliness of our analysis. Blockchain data and patterns can
                    change rapidly, and our tools may not catch all fraudulent
                    activities.
                  </p>
                </div>
                <div className="p-4 bg-destructive/10 border border-destructive/30">
                  <h3 className="text-destructive font-bold mb-2">
                    LIABILITY LIMITATION
                  </h3>
                  <p>
                    NimRev shall not be liable for any direct, indirect,
                    incidental, special, or consequential damages resulting from
                    use of our services, including financial losses.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                4. USER RESPONSIBILITIES
              </h2>
              <div className="space-y-3 text-sm">
                <p>As a user of NimRev services, you agree to:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Use services only for lawful purposes</li>
                  <li>
                    • Not attempt to reverse engineer or compromise our systems
                  </li>
                  <li>
                    • Not share false or misleading information in community
                    channels
                  </li>
                  <li>• Respect intellectual property rights</li>
                  <li>• Maintain the security of your account credentials</li>
                  <li>
                    • Not use automated systems to scrape or abuse our services
                  </li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                5. PROHIBITED ACTIVITIES
              </h2>
              <div className="space-y-3 text-sm">
                <p>The following activities are strictly prohibited:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Using our platform to facilitate illegal activities</li>
                  <li>
                    • Attempting to manipulate or game our detection systems
                  </li>
                  <li>• Sharing malicious links or content</li>
                  <li>• Impersonating other users or entities</li>
                  <li>• Violating privacy of other users</li>
                  <li>• Distributing spam or unsolicited communications</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                6. INTELLECTUAL PROPERTY
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  All content, features, and functionality of NimRev services
                  are owned by us and protected by copyright, trademark, and
                  other intellectual property laws.
                </p>
                <div className="space-y-2 ml-4">
                  <p>
                    <strong>Your License:</strong> Limited, non-exclusive,
                    non-transferable license to use our services for personal
                    use.
                  </p>
                  <p>
                    <strong>Restrictions:</strong> You may not copy, modify,
                    distribute, or create derivative works without permission.
                  </p>
                  <p>
                    <strong>User Content:</strong> You retain rights to content
                    you submit but grant us license to use it for service
                    provision.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                7. ACCOUNT TERMINATION
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  We reserve the right to terminate or suspend accounts that:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Violate these terms of service</li>
                  <li>• Engage in prohibited activities</li>
                  <li>• Pose security risks to our platform</li>
                  <li>• Are inactive for extended periods</li>
                </ul>
                <p className="mt-4">
                  Users may terminate their accounts at any time by contacting
                  support.
                </p>
              </div>
            </section>

            <section className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                8. DATA USAGE & PRIVACY
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  Our data usage practices are detailed in our Privacy Policy.
                  Key points:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• We analyze publicly available blockchain data</li>
                  <li>• We never request or store private keys</li>
                  <li>
                    • Personal information is collected minimally and protected
                  </li>
                  <li>
                    • Users can request data deletion subject to legal
                    requirements
                  </li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                9. MODIFICATIONS TO TERMS
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  We may modify these terms at any time. Material changes will
                  be communicated through:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Email notification to registered users</li>
                  <li>• Prominent notice on our platform</li>
                  <li>• Updated terms with revision date</li>
                </ul>
                <p className="mt-4">
                  Continued use after modifications constitutes acceptance of
                  new terms.
                </p>
              </div>
            </section>

            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                10. GOVERNING LAW
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  These terms are governed by applicable laws. Any disputes will
                  be resolved through:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Good faith negotiation first</li>
                  <li>• Binding arbitration if negotiation fails</li>
                  <li>• Jurisdiction in appropriate courts as last resort</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                11. CONTACT INFORMATION
              </h2>
              <div className="space-y-3 text-sm">
                <p>For questions about these terms:</p>
                <div className="p-3 bg-cyber-blue/10 border border-cyber-blue/30">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:verm@nimrev.xyz"
                      className="text-cyber-green hover:text-cyber-orange transition-colors"
                    >
                      verm@nimrev.xyz
                    </a>
                  </p>
                  <p>
                    <strong>Subject Line:</strong> Terms of Service Inquiry
                  </p>
                  <p>
                    <strong>Response Time:</strong> Within 48 hours
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
