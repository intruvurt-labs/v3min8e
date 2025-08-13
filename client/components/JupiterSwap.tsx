import { useState, useEffect } from "react";
import {
  ArrowUpDown,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface SwapQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: any;
  priceImpactPct: string;
  routePlan: any[];
}

// Contract addresses - to be updated after deployment
const CONTRACTS = {
  VERM_TOKEN: "PLACEHOLDER_VERM_TOKEN_CONTRACT", // Update after deployment
  GRIT_TOKEN: "PLACEHOLDER_GRIT_TOKEN_CONTRACT", // Update after deployment
  STAKING_PROGRAM: "PLACEHOLDER_STAKING_PROGRAM_ID", // Update after deployment
};

export default function JupiterSwap() {
  const { publicKey, connected, balance, connectWallet } = useWallet();

  const [fromToken, setFromToken] = useState<Token>({
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Wrapped SOL",
    decimals: 9,
  });

  const [toToken, setToToken] = useState<Token>({
    address:
      CONTRACTS.VERM_TOKEN !== "PLACEHOLDER_VERM_TOKEN_CONTRACT"
        ? CONTRACTS.VERM_TOKEN
        : "Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups", // fallback for demo
    symbol: "VERM",
    name: "Vermin Token",
    decimals: 6,
  });

  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<{ [key: string]: number }>({});
  const [lastQuoteTime, setLastQuoteTime] = useState<number>(0);

  // Popular Solana tokens with contract placeholders
  const popularTokens: Token[] = [
    {
      address: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Wrapped SOL",
      decimals: 9,
    },
    {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address:
        CONTRACTS.VERM_TOKEN !== "PLACEHOLDER_VERM_TOKEN_CONTRACT"
          ? CONTRACTS.VERM_TOKEN
          : "Auu4U7cVjm41yVnVtBCwHW2FBAKznPgLR7hQf4Esjups",
      symbol: "VERM",
      name: "Vermin Token",
      decimals: 6,
    },
    {
      address:
        CONTRACTS.GRIT_TOKEN !== "PLACEHOLDER_GRIT_TOKEN_CONTRACT"
          ? CONTRACTS.GRIT_TOKEN
          : "PLACEHOLDER_GRIT_TOKEN_CONTRACT",
      symbol: "GRIT",
      name: "Grit Token",
      decimals: 6,
    },
    {
      address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
      symbol: "RAY",
      name: "Raydium",
      decimals: 6,
    },
  ];

  // Fetch user token balances
  const fetchUserBalances = async () => {
    if (!publicKey || !connected) return;

    try {
      // In production, this would fetch real balances from the blockchain
      // For now, use demo data
      setUserBalance({
        [fromToken.address]: balance || 0,
        [toToken.address]: Math.random() * 1000,
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      setError("Failed to fetch token balances");
    }
  };

  // Clear messages after timeout
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  // Enhanced quote function with comprehensive error handling
  const getQuote = async (
    inputMint: string,
    outputMint: string,
    amount: string,
  ) => {
    if (!amount || parseFloat(amount) === 0) {
      setQuote(null);
      setToAmount("");
      return;
    }

    // Rate limiting - prevent too many requests
    const now = Date.now();
    if (now - lastQuoteTime < 1000) return; // 1 second throttle
    setLastQuoteTime(now);

    // Validation
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      clearMessages();
      return;
    }

    // Check if user has sufficient balance
    const userTokenBalance = userBalance[inputMint] || 0;
    if (connected && numAmount > userTokenBalance) {
      setError(
        `Insufficient balance. You have ${userTokenBalance.toFixed(4)} ${fromToken.symbol}`,
      );
      clearMessages();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const inputAmount = (
        numAmount * Math.pow(10, fromToken.decimals)
      ).toString();

      // Check for placeholder contracts
      if (
        inputMint.includes("PLACEHOLDER") ||
        outputMint.includes("PLACEHOLDER")
      ) {
        throw new Error(
          "Token contract not yet deployed. Please wait for deployment.",
        );
      }

      const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}&slippageBps=${Math.floor(slippage * 100)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const quoteData = await response.json();

      if (!quoteData || !quoteData.outAmount) {
        throw new Error("No valid route found for this trade");
      }

      setQuote(quoteData);

      // Calculate output amount with precision
      const outputAmount =
        parseFloat(quoteData.outAmount) / Math.pow(10, toToken.decimals);
      setToAmount(outputAmount.toFixed(Math.min(6, toToken.decimals)));

      // Validate price impact
      const priceImpact = parseFloat(quoteData.priceImpactPct);
      if (priceImpact > 0.05) {
        // 5% price impact warning
        setError(
          `High price impact: ${(priceImpact * 100).toFixed(2)}%. Consider reducing trade size.`,
        );
        clearMessages();
      }
    } catch (error: any) {
      console.error("Quote error:", error);
      setQuote(null);
      setToAmount("0");

      if (error.message?.includes("PLACEHOLDER")) {
        setError("Token contracts are being deployed. Please check back soon.");
      } else if (error.message?.includes("No route")) {
        setError("No trading route available for this token pair");
      } else if (error.message?.includes("network")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(error.message || "Failed to get quote. Please try again.");
      }

      clearMessages();
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balances when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserBalances();
    }
  }, [connected, publicKey, fromToken.address, toToken.address]);

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        fromAmount &&
        fromToken.address !== toToken.address &&
        parseFloat(fromAmount) > 0
      ) {
        getQuote(fromToken.address, toToken.address, fromAmount);
      } else {
        setQuote(null);
        setToAmount("");
      }
    }, 1000); // Increased to 1 second to reduce API calls

    return () => clearTimeout(timer);
  }, [fromAmount, fromToken.address, toToken.address, slippage]);

  // Validate input changes
  useEffect(() => {
    const amount = parseFloat(fromAmount);
    if (fromAmount && (isNaN(amount) || amount <= 0)) {
      setError("Please enter a valid amount");
      clearMessages();
    } else if (fromAmount && connected) {
      const balance = userBalance[fromToken.address] || 0;
      if (amount > balance) {
        setError(
          `Insufficient balance. Available: ${balance.toFixed(4)} ${fromToken.symbol}`,
        );
        clearMessages();
      }
    }
  }, [fromAmount, fromToken.address, userBalance, connected]);

  const switchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const executeSwap = async () => {
    if (!quote || !connected || !publicKey) {
      setError("Please connect your wallet first");
      clearMessages();
      return;
    }

    // Validation checks
    const numAmount = parseFloat(fromAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Invalid swap amount");
      clearMessages();
      return;
    }

    const userTokenBalance = userBalance[fromToken.address] || 0;
    if (numAmount > userTokenBalance) {
      setError(`Insufficient ${fromToken.symbol} balance`);
      clearMessages();
      return;
    }

    // Check for placeholder contracts
    if (
      fromToken.address.includes("PLACEHOLDER") ||
      toToken.address.includes("PLACEHOLDER")
    ) {
      setError(
        "Token contracts are still being deployed. Please check back soon.",
      );
      clearMessages();
      return;
    }

    setIsSwapping(true);
    setError(null);

    try {
      // Get fresh quote to ensure accuracy
      await getQuote(fromToken.address, toToken.address, fromAmount);

      if (!quote) {
        throw new Error("Unable to get fresh quote for swap");
      }

      // Step 1: Get serialized transaction from Jupiter
      const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        }),
      });

      if (!swapResponse.ok) {
        const errorData = await swapResponse.json().catch(() => null);
        throw new Error(
          errorData?.error || `Swap API error: ${swapResponse.status}`,
        );
      }

      const { swapTransaction } = await swapResponse.json();

      if (!swapTransaction) {
        throw new Error("No swap transaction received");
      }

      // Step 2: Execute transaction through wallet
      // Note: This would be implemented with actual wallet integration
      // For now, simulate the transaction process

      console.log("Executing swap transaction...");

      // Simulate transaction execution time
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // In production, you would:
      // 1. Deserialize the transaction
      // 2. Sign it with the user's wallet
      // 3. Send it to the Solana network
      // 4. Wait for confirmation

      // For demo purposes, simulate success
      if (Math.random() > 0.1) {
        // 90% success rate for demo
        // Update local balances (in production, these would be fetched from blockchain)
        setUserBalance((prev) => ({
          ...prev,
          [fromToken.address]: (prev[fromToken.address] || 0) - numAmount,
          [toToken.address]:
            (prev[toToken.address] || 0) + parseFloat(toAmount),
        }));

        setSuccess(
          `Successfully swapped ${numAmount} ${fromToken.symbol} for ${parseFloat(toAmount).toFixed(4)} ${toToken.symbol}`,
        );

        // Reset form
        setFromAmount("");
        setToAmount("");
        setQuote(null);

        // Refresh balances
        fetchUserBalances();
      } else {
        throw new Error(
          "Transaction failed due to network congestion. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Swap execution failed:", error);

      if (error.message?.includes("User rejected")) {
        setError("Transaction was cancelled by user");
      } else if (error.message?.includes("insufficient")) {
        setError("Insufficient funds for transaction");
      } else if (error.message?.includes("network")) {
        setError("Network error. Please try again.");
      } else if (error.message?.includes("slippage")) {
        setError("Price moved too much. Try increasing slippage tolerance.");
      } else {
        setError(error.message || "Swap failed. Please try again.");
      }
    } finally {
      setIsSwapping(false);
      clearMessages();
    }
  };

  return (
    <div className="border border-cyber-purple/30 bg-cyber-purple/5 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-cyber font-bold text-cyber-purple">
          🔄 JUPITER SWAP
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
          ></div>
          <span className="text-xs text-gray-400">
            {connected ? "Connected" : "Disconnected"}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-cyber-purple transition-colors ml-2"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm">{success}</span>
        </div>
      )}

      {/* Wallet Connection Warning */}
      {!connected && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
          <p className="text-yellow-400 text-sm mb-2">
            Connect your wallet to start swapping
          </p>
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple rounded hover:bg-cyber-purple hover:text-white transition-all"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 border border-cyber-purple/20 rounded bg-dark-bg">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Slippage Tolerance</label>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 text-xs rounded ${
                    slippage === value
                      ? "bg-cyber-purple text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* From Token */}
        <div className="p-4 border border-cyber-green/30 rounded bg-cyber-green/5">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">From</label>
            <div className="text-xs text-gray-400">
              Balance:{" "}
              {connected
                ? (userBalance[fromToken.address] || 0).toFixed(4)
                : "--"}{" "}
              {fromToken.symbol}
              {connected && userBalance[fromToken.address] > 0 && (
                <button
                  onClick={() =>
                    setFromAmount(
                      (userBalance[fromToken.address] || 0).toString(),
                    )
                  }
                  className="ml-2 text-cyber-green hover:text-cyber-green/80 underline"
                >
                  MAX
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Prevent negative numbers and limit decimal places
                if (
                  value === "" ||
                  (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)
                ) {
                  setFromAmount(value);
                }
              }}
              placeholder="0.00"
              min="0"
              step="any"
              disabled={!connected}
              className="flex-1 bg-transparent text-2xl font-mono text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <select
              value={fromToken.address}
              onChange={(e) => {
                const token = popularTokens.find(
                  (t) => t.address === e.target.value,
                );
                if (token) setFromToken(token);
              }}
              className="bg-dark-bg border border-cyber-green/30 text-cyber-green px-3 py-2 rounded font-mono text-sm"
            >
              {popularTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={switchTokens}
            className="p-2 border border-cyber-blue/30 rounded-full text-cyber-blue hover:bg-cyber-blue/10 transition-all"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>

        {/* To Token */}
        <div className="p-4 border border-cyber-orange/30 rounded bg-cyber-orange/5">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">To (estimated)</label>
            <span className="text-xs text-gray-400">
              Balance:{" "}
              {connected
                ? (userBalance[toToken.address] || 0).toFixed(4)
                : "--"}{" "}
              {toToken.symbol}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-mono text-white outline-none"
            />
            <select
              value={toToken.address}
              onChange={(e) => {
                const token = popularTokens.find(
                  (t) => t.address === e.target.value,
                );
                if (token) setToToken(token);
              }}
              className="bg-dark-bg border border-cyber-orange/30 text-cyber-orange px-3 py-2 rounded font-mono text-sm"
            >
              {popularTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quote Info */}
        {quote && (
          <div className="p-3 border border-gray-600 rounded bg-gray-800/50 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Price Impact:</span>
              <span
                className={`${parseFloat(quote.priceImpactPct) > 1 ? "text-red-400" : "text-cyber-green"}`}
              >
                {(parseFloat(quote.priceImpactPct) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Route:</span>
              <span className="text-cyber-blue">
                {quote.routePlan.length} hop(s)
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Swap Button */}
        <button
          onClick={executeSwap}
          disabled={
            !connected ||
            !quote ||
            isLoading ||
            isSwapping ||
            !fromAmount ||
            parseFloat(fromAmount) <= 0 ||
            error !== null ||
            (connected &&
              parseFloat(fromAmount) > (userBalance[fromToken.address] || 0))
          }
          className={`w-full py-4 font-mono font-bold text-lg tracking-wider transition-all duration-300 rounded ${
            !connected
              ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
              : !quote ||
                  isLoading ||
                  isSwapping ||
                  !fromAmount ||
                  parseFloat(fromAmount) <= 0 ||
                  error !== null
                ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-cyber-purple/20 border-2 border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white"
          }`}
        >
          {!connected ? (
            "Connect Wallet"
          ) : isSwapping ? (
            <div className="flex items-center justify-center">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Executing Swap...
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Getting Quote...
            </div>
          ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
            "Enter Amount"
          ) : !quote && fromAmount ? (
            "No Route Found"
          ) : fromToken.address.includes("PLACEHOLDER") ||
            toToken.address.includes("PLACEHOLDER") ? (
            "Contract Pending Deployment"
          ) : (
            `Swap ${fromToken.symbol} for ${toToken.symbol}`
          )}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Powered by Jupiter Protocol • Best rates across Solana
      </div>
    </div>
  );
}
