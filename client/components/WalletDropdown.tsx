import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  LogOut,
  Info,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface WalletDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string;
}

export default function WalletDropdown({
  isOpen,
  onClose,
  publicKey,
}: WalletDropdownProps) {
  const { disconnect, balance } = useWallet();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showBrowserExtension, setShowBrowserExtension] = useState(false);
  const [showMobileApp, setShowMobileApp] = useState(false);
  const [showSecurityTip, setShowSecurityTip] = useState(false);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const copyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey);
        // Create a temporary toast notification
        const toast = document.createElement("div");
        toast.textContent = "Address copied!";
        toast.className =
          "fixed top-4 right-4 bg-cyber-green text-dark-bg px-4 py-2 rounded font-bold text-sm z-50";
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  // Fetch real SOL balance from Solana RPC with multiple fallbacks
  const fetchRealBalance = async () => {
    if (!publicKey) return;

    setIsRefreshing(true);

    // List of free public RPC endpoints
    const rpcEndpoints = [
      "https://api.mainnet-beta.solana.com",
      "https://rpc.ankr.com/solana",
      "https://solana-mainnet.g.alchemy.com/v2/demo",
      "https://rpc.helius.xyz/?api-key=demo",
      "https://api.metaplex.solana.com/",
    ];

    for (const endpoint of rpcEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [publicKey],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.result && typeof data.result.value === "number") {
            const solBalance = data.result.value / 1000000000; // Convert lamports to SOL
            setRealBalance(solBalance);
            console.log(
              `✅ Balance fetched from ${endpoint}: ${solBalance.toFixed(6)} SOL`,
            );
            setIsRefreshing(false);
            return; // Success, exit function
          }
        }
      } catch (error) {
        console.warn(`RPC ${endpoint} failed:`, error.message);
        continue; // Try next endpoint
      }
    }

    // All RPCs failed
    console.error("All RPC endpoints failed, keeping cached balance");
    setRealBalance(null);
    setIsRefreshing(false);
  };

  // Fetch real balance when component mounts
  useEffect(() => {
    if (publicKey && isOpen) {
      fetchRealBalance();
    }
  }, [publicKey, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 bg-dark-bg border border-cyber-green/30 z-50 font-mono text-sm"
    >
      {/* Header */}
      <div className="p-4 border-b border-cyber-green/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-cyber-green font-bold">WALLET CONNECTED</span>
          <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Address:</span>
            <button
              onClick={copyAddress}
              className="text-cyber-blue hover:text-cyber-green transition-colors"
              title="Click to copy"
            >
              {publicKey
                ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`
                : "No address"}
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Balance:</span>
            <span className="text-cyber-orange font-bold">
              {realBalance !== null
                ? `${realBalance.toFixed(6)} SOL`
                : `${balance.toFixed(4)} SOL (cached)`}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center px-3 py-2 text-red-400 hover:bg-red-400/10 transition-all duration-300 group"
        >
          <LogOut className="w-4 h-4 mr-3 group-hover:animate-pulse" />
          <span>Disconnect Wallet</span>
        </button>
      </div>

      {/* Connection Help */}
      <div className="border-t border-cyber-blue/20 p-4">
        <div className="flex items-center mb-3">
          <Info className="w-4 h-4 text-cyber-blue mr-2" />
          <span className="text-cyber-blue font-bold text-xs">
            CONNECTION METHODS
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Browser Extension - Collapsible */}
          <div className="border border-cyber-purple/20">
            <button
              onClick={() => setShowBrowserExtension(!showBrowserExtension)}
              className="w-full p-3 bg-cyber-purple/5 hover:bg-cyber-purple/10 transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <Monitor className="w-3 h-3 text-cyber-purple mr-2" />
                <span className="text-cyber-purple font-bold text-xs">
                  BROWSER EXTENSION
                </span>
              </div>
              {showBrowserExtension ? (
                <ChevronUp className="w-3 h-3 text-cyber-purple" />
              ) : (
                <ChevronDown className="w-3 h-3 text-cyber-purple" />
              )}
            </button>
            {showBrowserExtension && (
              <div className="p-3 bg-cyber-purple/5 border-t border-cyber-purple/20">
                <p className="text-gray-300 leading-relaxed mb-3">
                  Install Phantom, Solflare, Backpack, or other Solana wallet
                  extensions. Click the extension icon and create/import your
                  wallet. Return here and click "Connect Wallet".
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="https://phantom.app/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-dark-bg text-xs text-center transition-all duration-200 rounded"
                  >
                    Get Phantom
                  </a>
                  <a
                    href="https://solflare.com/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-dark-bg text-xs text-center transition-all duration-200 rounded"
                  >
                    Get Solflare
                  </a>
                  <a
                    href="https://backpack.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-dark-bg text-xs text-center transition-all duration-200 rounded"
                  >
                    Get Backpack
                  </a>
                  <a
                    href="https://glow.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-dark-bg text-xs text-center transition-all duration-200 rounded"
                  >
                    Get Glow
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Mobile App Browser - Collapsible */}
          <div className="border border-cyber-orange/20">
            <button
              onClick={() => setShowMobileApp(!showMobileApp)}
              className="w-full p-3 bg-cyber-orange/5 hover:bg-cyber-orange/10 transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <Smartphone className="w-3 h-3 text-cyber-orange mr-2" />
                <span className="text-cyber-orange font-bold text-xs">
                  MOBILE APP BROWSER
                </span>
              </div>
              {showMobileApp ? (
                <ChevronUp className="w-3 h-3 text-cyber-orange" />
              ) : (
                <ChevronDown className="w-3 h-3 text-cyber-orange" />
              )}
            </button>
            {showMobileApp && (
              <div className="p-3 bg-cyber-orange/5 border-t border-cyber-orange/20">
                <p className="text-gray-300 leading-relaxed mb-3">
                  Open this site in your wallet app's built-in browser. Most
                  Solana mobile wallets have a dApp browser. Look for "Browser"
                  or "dApps" in your wallet app.
                </p>
                <div className="text-cyber-orange text-xs bg-cyber-orange/10 p-2 rounded">
                  📱 Compatible Wallets:
                  <br />• Phantom Mobile
                  <br />• Solflare Mobile
                  <br />• Glow Mobile
                  <br />• Slope Mobile
                  <br />• Trust Wallet
                </div>
              </div>
            )}
          </div>

          {/* Security Tip - Collapsible */}
          <div className="border border-cyber-green/20">
            <button
              onClick={() => setShowSecurityTip(!showSecurityTip)}
              className="w-full p-3 bg-cyber-green/5 hover:bg-cyber-green/10 transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <span className="text-cyber-green text-xs font-bold">
                  🔒 SECURITY TIPS
                </span>
              </div>
              {showSecurityTip ? (
                <ChevronUp className="w-3 h-3 text-cyber-green" />
              ) : (
                <ChevronDown className="w-3 h-3 text-cyber-green" />
              )}
            </button>
            {showSecurityTip && (
              <div className="p-3 bg-cyber-green/5 border-t border-cyber-green/20">
                <div className="space-y-2 text-gray-300 text-xs leading-relaxed">
                  <p>
                    🔐 <strong>Never share your seed phrase</strong> with anyone
                  </p>
                  <p>
                    🚫 <strong>NimRev never asks</strong> for private keys or
                    passwords
                  </p>
                  <p>
                    ✅ <strong>We only request</strong> wallet connection
                    permissions
                  </p>
                  <p>
                    🔍 <strong>Always verify</strong> the URL is nimrev.xyz
                  </p>
                  <p>
                    ⚠️ <strong>Beware of phishing</strong> sites with similar
                    names
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Balance Refresh */}
        <div className="mt-3 pt-3 border-t border-cyber-blue/20">
          <button
            onClick={fetchRealBalance}
            disabled={!publicKey || isRefreshing}
            className="w-full px-3 py-1 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-xs hover:bg-cyber-blue hover:text-dark-bg transition-all duration-200 disabled:opacity-50"
          >
            {isRefreshing ? "🔄 Refreshing..." : "🔄 Refresh Balance"}
          </button>
        </div>
      </div>
    </div>
  );
}
