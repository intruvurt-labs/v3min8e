import { useState, useEffect } from "react";
import { Shield, X } from "lucide-react";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    try {
      // Check if user has already acknowledged essential cookies
      const consentChoice = localStorage.getItem("nimrev-essential-cookies");
      console.log("Cookie consent choice:", consentChoice);

      if (!consentChoice) {
        // Show consent banner after a short delay for better UX
        const timer = setTimeout(() => {
          console.log("Showing cookie consent");
          setShowConsent(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error checking cookie consent:", error);
      // If localStorage fails, show the banner anyway
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    console.log("Cookie consent accepted");
    try {
      localStorage.setItem("nimrev-essential-cookies", "accepted");
      localStorage.setItem("nimrev-cookie-timestamp", Date.now().toString());
    } catch (error) {
      console.error("Error saving cookie consent:", error);
    }
    setShowConsent(false);
  };

  const handleClose = () => {
    console.log("Cookie consent closed");
    try {
      // Since these are essential cookies, we still need to store the choice
      localStorage.setItem("nimrev-essential-cookies", "acknowledged");
      localStorage.setItem("nimrev-cookie-timestamp", Date.now().toString());
    } catch (error) {
      console.error("Error saving cookie consent:", error);
    }
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div
      className="fixed bottom-4 right-4 max-w-sm bg-dark-bg border-2 border-cyber-green rounded-lg p-4 shadow-2xl"
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Shield className="w-5 h-5 text-cyber-green" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-cyber-green font-cyber font-bold text-sm">
              ESSENTIAL COOKIES
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-red-400 transition-colors ml-2"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-gray-300 font-mono text-xs space-y-2">
            <p>
              We use essential cookies for{" "}
              <span className="text-cyber-orange font-bold">
                security and functionality
              </span>
              :
            </p>

            <ul className="text-xs space-y-1 text-gray-300 ml-2">
              <li>• Session management</li>
              <li>• Scan rate limiting</li>
              <li>• Security preferences</li>
            </ul>

            <p className="text-cyber-blue text-xs">
              <span className="font-bold">No tracking or analytics.</span> Just
              what's needed for the scanner to work.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green font-mono font-bold text-xs hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 rounded cursor-pointer"
              type="button"
            >
              CONTINUE
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-xs hover:bg-gray-600/20 transition-all duration-300 rounded cursor-pointer"
              type="button"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
