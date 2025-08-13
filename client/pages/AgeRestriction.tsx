import { useState } from "react";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";

export default function AgeRestriction() {
  const [birthDate, setBirthDate] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "valid" | "invalid"
  >("pending");

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (birthDate) {
      const age = calculateAge(birthDate);
      setVerificationStatus(age >= 18 ? "valid" : "invalid");
    }
  };

  const handleContinue = () => {
    // In a real implementation, you would set a cookie or session storage
    // to remember the age verification status
    localStorage.setItem("nimrev_age_verified", "true");
    localStorage.setItem("nimrev_age_verified_date", new Date().toISOString());
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="medium" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-6xl mb-6">🔞</div>
            <h1 className="text-4xl lg:text-5xl font-cyber font-black text-cyber-orange mb-6 neon-glow">
              AGE VERIFICATION
            </h1>
            <p className="text-lg text-cyber-blue font-mono mb-4">
              18+ Age Restriction Required
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Warning Section */}
            <section className="border border-cyber-orange p-8 bg-cyber-orange/10 neon-border mb-8">
              <h2 className="text-2xl font-cyber font-bold text-cyber-orange mb-6 text-center">
                ADULT CONTENT & FINANCIAL SERVICES
              </h2>
              <div className="space-y-4 text-gray-300 font-mono text-sm">
                <p>
                  NimRev provides cryptocurrency analysis tools and financial
                  information that may include:
                </p>
                <ul className="space-y-2 ml-6">
                  <li>
                    • Complex financial instruments and risk assessment tools
                  </li>
                  <li>• Investment-related information and market analysis</li>
                  <li>
                    • Betting and gaming-related features (where legally
                    permitted)
                  </li>
                  <li>• Daily Fantasy Sports (DFS) statistics and tools</li>
                  <li>• High-risk financial content unsuitable for minors</li>
                </ul>
                <div className="p-4 bg-cyber-orange/20 border border-cyber-orange/50 mt-6">
                  <p className="text-cyber-orange font-bold text-center">
                    You must be 18 years or older to access these services.
                  </p>
                </div>
              </div>
            </section>

            {/* Verification Form */}
            {verificationStatus === "pending" && (
              <section className="border border-cyber-green/30 p-8 bg-cyber-green/5">
                <h2 className="text-xl font-cyber font-bold text-cyber-green mb-6 text-center">
                  VERIFY YOUR AGE
                </h2>
                <form onSubmit={handleVerification} className="space-y-6">
                  <div>
                    <label
                      htmlFor="birthdate"
                      className="block text-cyber-green font-mono font-bold mb-3"
                    >
                      Enter Your Date of Birth:
                    </label>
                    <input
                      type="date"
                      id="birthdate"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      className="px-8 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border animate-pulse-glow"
                    >
                      VERIFY AGE
                    </button>
                  </div>
                </form>

                <div className="mt-6 p-4 bg-cyber-blue/10 border border-cyber-blue/30 text-center">
                  <p className="text-cyber-blue font-mono text-sm">
                    Your date of birth is used only for age verification and is
                    not stored or shared.
                  </p>
                </div>
              </section>
            )}

            {/* Access Granted */}
            {verificationStatus === "valid" && (
              <section className="border border-cyber-green p-8 bg-cyber-green/10 neon-border text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-4">
                  ACCESS GRANTED
                </h2>
                <p className="text-gray-300 font-mono mb-6">
                  You have successfully verified that you are 18 years or older.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleContinue}
                    className="px-8 py-4 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 neon-border animate-pulse-glow"
                  >
                    CONTINUE TO NIMREV
                  </button>
                  <p className="text-gray-400 font-mono text-xs">
                    By continuing, you acknowledge that you are of legal age and
                    agree to our Terms of Service.
                  </p>
                </div>
              </section>
            )}

            {/* Access Denied */}
            {verificationStatus === "invalid" && (
              <section className="border border-destructive p-8 bg-destructive/10 text-center">
                <div className="text-4xl mb-4">❌</div>
                <h2 className="text-2xl font-cyber font-bold text-destructive mb-4">
                  ACCESS DENIED
                </h2>
                <p className="text-gray-300 font-mono mb-6">
                  You must be 18 years or older to access NimRev services.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/20 border border-destructive/50">
                    <p className="text-destructive font-mono text-sm">
                      Our services contain financial information and tools that
                      are restricted to adults only. Please return when you
                      reach the minimum age requirement.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setBirthDate("");
                      setVerificationStatus("pending");
                    }}
                    className="px-6 py-3 border border-cyber-blue text-cyber-blue font-mono hover:bg-cyber-blue/20 transition-all duration-300"
                  >
                    RE-VERIFY AGE
                  </button>
                </div>
              </section>
            )}

            {/* Legal Information */}
            <section className="mt-8 border border-cyber-purple/30 p-6 bg-cyber-purple/5">
              <h3 className="text-lg font-cyber font-bold text-cyber-purple mb-4">
                LEGAL REQUIREMENTS
              </h3>
              <div className="space-y-3 text-gray-300 font-mono text-sm">
                <p>
                  Age verification is required due to the nature of our
                  services, which may include:
                </p>
                <ul className="space-y-1 ml-6">
                  <li>
                    • Financial services and investment tools (18+ in most
                    jurisdictions)
                  </li>
                  <li>
                    • Gaming and betting features (21+ in some states/countries)
                  </li>
                  <li>• Complex financial instruments with high risk</li>
                  <li>• DFS participation (varies by jurisdiction)</li>
                </ul>
                <div className="mt-4 p-3 bg-cyber-purple/10 border border-cyber-purple/30">
                  <p className="text-cyber-purple font-bold text-xs">
                    Note: Some features may have additional age or
                    jurisdictional restrictions beyond the base 18+ requirement.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacy Notice */}
            <section className="mt-6 border border-cyber-blue/30 p-6 bg-cyber-blue/5">
              <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-4">
                PRIVACY PROTECTION
              </h3>
              <div className="space-y-2 text-gray-300 font-mono text-sm">
                <p>• Your birth date is used only for age verification</p>
                <p>• No personal information is stored on our servers</p>
                <p>• Verification status is saved locally on your device</p>
                <p>• You may need to re-verify if you clear browser data</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
