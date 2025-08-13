import { useEffect, useState } from "react";

interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

interface VermPriceData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  priceHistory: PriceData[];
  lastUpdated: number;
  source: string;
}

export default function VermPriceChart() {
  const [priceData, setPriceData] = useState<VermPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch REAL price data from our server endpoint
  useEffect(() => {
    const fetchRealPriceData = async (attempt = 1) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log(
          `Attempting to fetch VERM price data... (attempt ${attempt})`,
        );

        // Try with a more extension-resistant fetch approach
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch("/api/verm-price", {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            "X-Requested-With": "XMLHttpRequest", // Help bypass some extension filtering
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(
          "API response status:",
          response.status,
          response.statusText,
        );

        // Handle response more defensively
        let responseText = "";

        if (!response.ok) {
          // For error responses, try to get error details
          try {
            responseText = await response.text();
            const errorData = JSON.parse(responseText);

            // Handle the new 503 error format
            if (response.status === 503 && errorData.error) {
              throw new Error(`PRICE_SERVICE_UNAVAILABLE: ${errorData.message || errorData.error}`);
            }

            throw new Error(`HTTP ${response.status}: ${errorData.error || errorData.message || responseText}`);
          } catch (parseError) {
            // If JSON parsing fails, use the raw response
            throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
          }
        }

        // For successful responses, read the text
        try {
          responseText = await response.text();
        } catch (e) {
          console.error("Error reading successful response:", e);
          throw new Error("Failed to read response from price API");
        }

        if (!responseText.trim()) {
          throw new Error("Empty response from price API");
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          throw new Error(
            `Invalid JSON response: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}`,
          );
        }

        if (!data.success) {
          throw new Error(data.error || "API returned unsuccessful response");
        }

        setPriceData(data.data);
        console.log("✅ Real VERM price data loaded:", data.data.source);
      } catch (error) {
        let errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch real price data";

        // Only show extension blocking message if fetch actually failed
        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")
        ) {
          // Check if we're in an environment where extensions might be interfering
          const hasExtensionSignals =
            document.querySelector('script[src*="chrome-extension"]') ||
            document.querySelector('script[src*="fullstory"]') ||
            window.location.protocol === "chrome-extension:" ||
            /chrome-extension:\/\//.test(window.location.href);

          if (hasExtensionSignals) {
            errorMessage =
              "EXTENSION_BLOCKED: Browser extensions are blocking real-time data requests. Please disable extensions or use an incognito window to view live VERM price data.";
          } else {
            errorMessage =
              "NETWORK_ERROR: Unable to connect to price data servers. Please check your internet connection and try again.";
          }
        } else if (errorMessage.includes("body stream already read")) {
          errorMessage =
            "RESPONSE_ERROR: Data stream was interrupted. Please refresh the page to try again.";
        } else if (errorMessage.includes("PRICE_SERVICE_UNAVAILABLE")) {
          errorMessage =
            "PRICE_SERVICE_TEMPORARILY_UNAVAILABLE: VERM price data sources are currently unreachable. This is normal during maintenance periods. Data will return automatically when services are restored.";
        }

        console.error("❌ Real price data fetch failed:", errorMessage);

        // If it's an extension issue and we haven't retried yet, try once more
        if (
          errorMessage.includes("EXTENSION_BLOCKED") &&
          attempt === 1 &&
          retryCount < 1
        ) {
          console.log("🔄 Retrying fetch to bypass extension interference...");
          setRetryCount(1);
          setTimeout(() => fetchRealPriceData(2), 2000); // Retry after 2 seconds
          return;
        }

        setError(errorMessage);
        setPriceData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealPriceData();

    // Update real data every 60 seconds
    const interval = setInterval(() => fetchRealPriceData(), 60000);
    return () => clearInterval(interval);
  }, []); // Keep empty dependency array since we want this to run once

  // Custom SVG chart rendering for real data
  const renderRealChart = () => {
    if (!priceData || priceData.priceHistory.length === 0) return null;

    const width = 600;
    const height = 200;
    const padding = 40;

    const prices = priceData.priceHistory.map((d) => d.price).filter(p => p != null && !isNaN(p) && isFinite(p));

    // Ensure we have valid prices
    if (prices.length === 0) {
      console.warn('No valid prices found in price history');
      return null;
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 0.000001; // Prevent division by zero

    // Create path for price line with NaN validation
    const pathPoints = priceData.priceHistory
      .map((point, index) => {
        // Validate point data
        if (!point || point.price == null || isNaN(point.price) || !isFinite(point.price)) {
          return null;
        }

        const x = padding + (index * (width - 2 * padding)) / (priceData.priceHistory.length - 1);
        const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);

        // Validate calculated coordinates
        if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
          console.warn(`Invalid coordinates for point ${index}: x=${x}, y=${y}`);
          return null;
        }

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .filter(point => point !== null)
      .join(" ");

    // Create gradient fill area with NaN validation
    const areaPoints = priceData.priceHistory
      .map((point, index) => {
        // Validate point data
        if (!point || point.price == null || isNaN(point.price) || !isFinite(point.price)) {
          return null;
        }

        const x = padding + (index * (width - 2 * padding)) / (priceData.priceHistory.length - 1);
        const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);

        // Validate calculated coordinates
        if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
          return null;
        }

        return `${x},${y}`;
      })
      .filter(point => point !== null)
      .join(" ");

    return (
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient
              id="realPriceGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="hsl(var(--cyber-green))"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--cyber-green))"
                stopOpacity="0.05"
              />
            </linearGradient>
            <filter id="realGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i * (height - 2 * padding)) / 4}
              x2={width - padding}
              y2={padding + (i * (height - 2 * padding)) / 4}
              stroke="hsl(var(--cyber-green))"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          ))}

          {/* Fill area */}
          <polygon
            points={`${padding},${height - padding} ${areaPoints} ${width - padding},${height - padding}`}
            fill="url(#realPriceGradient)"
          />

          {/* Price line */}
          <path
            d={pathPoints}
            fill="none"
            stroke="hsl(var(--cyber-green))"
            strokeWidth="2"
            filter="url(#realGlow)"
          />

          {/* Data points with NaN validation */}
          {priceData.priceHistory.map((point, index) => {
            // Validate point data
            if (!point || point.price == null || isNaN(point.price) || !isFinite(point.price)) {
              console.warn(`Skipping invalid point at index ${index}:`, point);
              return null;
            }

            const x = padding + (index * (width - 2 * padding)) / (priceData.priceHistory.length - 1);
            const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);

            // Validate calculated coordinates
            if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
              console.warn(`Skipping point with invalid coordinates at index ${index}: x=${x}, y=${y}`);
              return null;
            }

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="hsl(var(--cyber-green))"
                className="hover:r-5 transition-all duration-200"
                filter="url(#realGlow)"
              >
                <title>{`${new Date(point.timestamp).toLocaleTimeString()}: $${point.price.toFixed(6)}`}</title>
              </circle>
            );
          }).filter(Boolean)}

          {/* Price labels with validation */}
          <text
            x={padding - 5}
            y={padding + 5}
            fill="hsl(var(--cyber-green))"
            fontSize="10"
            textAnchor="end"
          >
            ${isNaN(maxPrice) || !isFinite(maxPrice) ? '0.000000' : maxPrice.toFixed(6)}
          </text>
          <text
            x={padding - 5}
            y={height - padding + 5}
            fill="hsl(var(--cyber-green))"
            fontSize="10"
            textAnchor="end"
          >
            ${isNaN(minPrice) || !isFinite(minPrice) ? '0.000000' : minPrice.toFixed(6)}
          </text>
        </svg>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="border border-cyber-green/30 p-6 bg-cyber-green/5 mt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-cyber-green border-t-transparent rounded-full"></div>
          <span className="ml-3 text-cyber-green font-mono">
            Fetching real VERM market data...
          </span>
        </div>
      </div>
    );
  }

  // Error state - NO MOCK DATA FALLBACK
  if (error || !priceData) {
    const isExtensionIssue =
      error?.includes("EXTENSION_BLOCKED") ||
      error?.includes("NETWORK_BLOCKED") ||
      error?.includes("Failed to fetch");

    return (
      <div className="border border-red-400/30 p-6 bg-red-400/5 mt-6">
        <h3 className="text-xl font-cyber font-bold text-red-400 mb-4 flex items-center gap-2">
          <span>{isExtensionIssue ? "🔌" : "⚠️"}</span>
          {isExtensionIssue
            ? "BROWSER EXTENSIONS BLOCKING DATA"
            : "REAL PRICE DATA UNAVAILABLE"}
        </h3>
        <div className="text-center py-8">
          <div className="text-red-400 font-mono mb-4 text-sm">
            {error || "Unable to fetch real market data"}
          </div>

          {isExtensionIssue ? (
            <div className="text-gray-300 text-sm mb-6 space-y-2">
              <p className="font-bold text-cyber-orange">
                Browser extensions are blocking real-time data requests.
              </p>
              <div className="text-left max-w-md mx-auto">
                <p className="mb-2 font-bold">To view live VERM price data:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    • <span className="text-cyber-green">Option 1:</span> Open
                    this site in an incognito/private window
                  </li>
                  <li>
                    • <span className="text-cyber-green">Option 2:</span>{" "}
                    Temporarily disable browser extensions
                  </li>
                  <li>
                    • <span className="text-cyber-green">Option 3:</span> Use a
                    different browser
                  </li>
                </ul>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Common blocking extensions: Ad blockers, Privacy tools, Wallet
                extensions
              </p>
            </div>
          ) : (
            <div className="text-gray-400 text-sm mb-4">
              We only show real market data, no simulations or mock data.
              <br />
              Please check your connection and try again.
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setRetryCount(0);
                setError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-400/20 border border-red-400 text-red-400 font-mono rounded hover:bg-red-400 hover:text-white transition-all duration-200"
            >
              Retry Loading Real Data
            </button>
            {isExtensionIssue && (
              <>
                <button
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="px-4 py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green font-mono rounded hover:bg-cyber-green hover:text-dark-bg transition-all duration-200"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `${window.location.origin}${window.location.pathname}`,
                      "_blank",
                    )
                  }
                  className="px-4 py-2 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-mono rounded hover:bg-cyber-blue hover:text-dark-bg transition-all duration-200"
                >
                  Open Incognito
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state with real data
  return (
    <div className="border border-cyber-green/30 p-6 bg-cyber-green/5 mt-6">
      <h3 className="text-xl font-cyber font-bold text-cyber-green mb-4 flex items-center gap-2">
        <span className="animate-pulse">📈</span>
        $VERM REAL-TIME PRICE
        <span className="w-2 h-2 bg-cyber-green rounded-full animate-pulse ml-2"></span>
        <span className="text-xs bg-cyber-green/20 px-2 py-1 rounded text-cyber-green">
          LIVE
        </span>
      </h3>

      {/* Real-time stats */}
      <div className="mb-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-gray-400 mb-1">Current Price</div>
          <div className="text-cyber-green font-bold">
            ${isNaN(priceData.price) || !isFinite(priceData.price) ? '0.000000' : priceData.price.toFixed(6)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">24h Change</div>
          <div
            className={`font-bold ${(priceData.change24h || 0) >= 0 ? "text-cyber-green" : "text-red-400"}`}
          >
            {(priceData.change24h || 0) >= 0 ? "+" : ""}
            {isNaN(priceData.change24h) || !isFinite(priceData.change24h) ? '0.00' : priceData.change24h.toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">24h Volume</div>
          <div className="text-cyber-blue font-bold">
            {priceData.volume24h > 0 && !isNaN(priceData.volume24h) && isFinite(priceData.volume24h)
              ? `$${priceData.volume24h.toLocaleString()}`
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Real data chart */}
      <div className="h-64 overflow-hidden rounded border border-cyber-green/20 bg-gradient-to-b from-cyber-green/5 to-transparent">
        {renderRealChart()}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        {priceData.source} • Last updated:{" "}
        {new Date(priceData.lastUpdated).toLocaleTimeString()}
        <br />
        <span className="text-cyber-green">
          ✓ 100% Real Market Data - No Simulations
        </span>
      </div>
    </div>
  );
}
