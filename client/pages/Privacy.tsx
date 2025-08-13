import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              PRIVACY POLICY
            </h1>
            <p className="text-lg text-cyber-blue font-mono mb-4">
              Data Protection & User Privacy
            </p>
            <p className="text-sm text-gray-400 font-mono">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8 text-gray-300 font-mono">
            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                1. INFORMATION WE COLLECT
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="text-cyber-blue font-bold mb-2">
                    Blockchain Data
                  </h3>
                  <p>
                    We collect and analyze publicly available blockchain
                    transaction data to provide our services. This includes
                    wallet addresses, transaction patterns, and smart contract
                    interactions.
                  </p>
                </div>
                <div>
                  <h3 className="text-cyber-blue font-bold mb-2">
                    User Provided Information
                  </h3>
                  <p>
                    When you contact us or create an account, we may collect
                    name, email address, and communication preferences.
                  </p>
                </div>
                <div>
                  <h3 className="text-cyber-blue font-bold mb-2">
                    Usage Analytics
                  </h3>
                  <p>
                    We collect anonymous usage statistics to improve our
                    platform performance and user experience.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                2. HOW WE USE YOUR INFORMATION
              </h2>
              <ul className="space-y-2 text-sm">
                <li>
                  • Provide real-time blockchain analysis and risk detection
                  services
                </li>
                <li>• Send security alerts and platform notifications</li>
                <li>• Improve our detection algorithms and user experience</li>
                <li>• Respond to support requests and communications</li>
                <li>• Comply with legal obligations and prevent fraud</li>
              </ul>
            </section>

            <section className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                3. WHAT WE DON'T COLLECT
              </h2>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-cyber-orange/10 border-l-4 border-cyber-orange">
                  <p>
                    <strong>Private Keys:</strong> We never request, store, or
                    have access to your private keys.
                  </p>
                </div>
                <div className="p-3 bg-cyber-orange/10 border-l-4 border-cyber-orange">
                  <p>
                    <strong>Wallet Control:</strong> We operate in read-only
                    mode and cannot access your funds.
                  </p>
                </div>
                <div className="p-3 bg-cyber-orange/10 border-l-4 border-cyber-orange">
                  <p>
                    <strong>Personal Financial Data:</strong> We don't track
                    your personal trading activities or balances.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                4. DATA SHARING
              </h2>
              <div className="space-y-4 text-sm">
                <p>
                  We do not sell, rent, or trade your personal information to
                  third parties. We may share information only in these limited
                  circumstances:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• With your explicit consent</li>
                  <li>• To comply with legal requirements or court orders</li>
                  <li>• To protect our rights, property, or safety</li>
                  <li>• In connection with a business transfer or merger</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                5. DATA SECURITY
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  We implement industry-standard security measures including:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• End-to-end encryption for sensitive communications</li>
                  <li>• Secure data storage with access controls</li>
                  <li>
                    • Regular security audits and vulnerability assessments
                  </li>
                  <li>• Employee training on data protection practices</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                6. YOUR RIGHTS
              </h2>
              <div className="space-y-3 text-sm">
                <p>You have the right to:</p>
                <ul className="space-y-2 ml-4">
                  <li>�� Access your personal data we hold</li>
                  <li>• Request correction of inaccurate information</li>
                  <li>
                    • Request deletion of your data (subject to legal
                    requirements)
                  </li>
                  <li>• Opt-out of marketing communications</li>
                  <li>• Data portability for your information</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at{" "}
                  <a
                    href="mailto:verm@nimrev.xyz"
                    className="text-cyber-green hover:text-cyber-blue transition-colors"
                  >
                    verm@nimrev.xyz
                  </a>
                </p>
              </div>
            </section>

            <section className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                7. COOKIES & TRACKING
              </h2>
              <div className="space-y-3 text-sm">
                <p>We use minimal cookies and tracking technologies:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Essential cookies for platform functionality</li>
                  <li>
                    • Analytics cookies to understand usage patterns (anonymous)
                  </li>
                  <li>• No third-party advertising or tracking cookies</li>
                </ul>
                <p className="mt-4">
                  You can control cookie preferences through your browser
                  settings.
                </p>
              </div>
            </section>

            <section className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-purple mb-4">
                8. INTERNATIONAL TRANSFERS
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  Your data may be processed in countries outside your
                  residence. We ensure adequate protection through:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Standard contractual clauses</li>
                  <li>• Adequacy decisions from relevant authorities</li>
                  <li>• Appropriate safeguards for data protection</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-green/30 p-6 bg-cyber-green/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4">
                9. CHILDREN'S PRIVACY
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  Our services are not intended for individuals under 18 years
                  of age. We do not knowingly collect personal information from
                  children. If we become aware that we have collected such
                  information, we will take steps to delete it promptly.
                </p>
              </div>
            </section>

            <section className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-blue mb-4">
                10. CHANGES TO THIS POLICY
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  We may update this privacy policy to reflect changes in our
                  practices or legal requirements. We will notify users of
                  material changes through:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Email notifications to registered users</li>
                  <li>• Prominent notices on our platform</li>
                  <li>• Updates to this page with revision date</li>
                </ul>
              </div>
            </section>

            <section className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
              <h2 className="text-xl font-cyber font-bold text-cyber-orange mb-4">
                11. CONTACT INFORMATION
              </h2>
              <div className="space-y-3 text-sm">
                <p>For privacy-related questions or concerns:</p>
                <div className="p-3 bg-cyber-orange/10 border border-cyber-orange/30">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:verm@nimrev.xyz"
                      className="text-cyber-green hover:text-cyber-blue transition-colors"
                    >
                      verm@nimrev.xyz
                    </a>
                  </p>
                  <p>
                    <strong>Subject Line:</strong> Privacy Policy Inquiry
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
