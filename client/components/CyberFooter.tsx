import { Link } from "react-router-dom";

export default function CyberFooter() {
  return (
    <footer className="relative bg-darker-bg border-t border-cyber-green/20">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F0afef2519f0441318cbf9f55d295b37d%2Fd9eef1338ad947e389e5437d48669b0a?format=webp&width=800"
                alt="NimRev Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-cyber-green font-bold text-xl tracking-wide">
                NimRev
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Advanced blockchain intelligence platform providing real-time risk
              assessment and security scanning.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
              <span className="text-cyber-green text-xs font-medium">
                System Online
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <div className="space-y-3">
              <Link
                to="/scanner"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Scanner
              </Link>
              <Link
                to="/dashboard"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Dashboard
              </Link>
              <Link
                to="/staking"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Staking
              </Link>
              <a
                href="https://nimrev.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Live Platform ↗
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <div className="space-y-3">
              <Link
                to="/whitepaper"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Whitepaper
              </Link>
              <Link
                to="/technology"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Technology
              </Link>
              <Link
                to="/about"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                About
              </Link>
              <Link
                to="/roadmap"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Roadmap
              </Link>
            </div>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <div className="space-y-3">
              <Link
                to="/contact"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Contact
              </Link>
              <Link
                to="/community"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Community
              </Link>
              <a
                href="https://x.com/nimrevxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Twitter ↗
              </a>
              <a
                href="mailto:verm@nimrev.xyz"
                className="block text-gray-400 hover:text-cyber-green transition-colors text-sm"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cyber-green/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="text-gray-500 text-sm">
              © 2024 NimRev Protocol. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/disclaimer"
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                Disclaimer
              </Link>
              <Link
                to="/age-restriction"
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                18+ Only
              </Link>
            </div>

            {/* Warning */}
            <div className="text-gray-500 text-xs text-center lg:text-right">
              Not financial advice • High risk investment
            </div>
          </div>
        </div>
      </div>

      {/* Subtle scan line effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-green/30 to-transparent"></div>
    </footer>
  );
}
