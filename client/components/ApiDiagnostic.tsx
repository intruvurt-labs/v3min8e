import { useState, useEffect } from "react";

interface DiagnosticResult {
  endpoint: string;
  status: "pending" | "success" | "error";
  response?: any;
  error?: string;
  timestamp: number;
}

import { fetchWithFallback } from "../utils/fetchWithFallback";

export default function ApiDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testEndpoints = [
    "/api/ping",
    "/api/bot/status",
    "/api/bot/scanner/status",
    "/api/nimrev/status",
    "/api/verm-price",
  ];

  const runDiagnostic = async () => {
    setIsRunning(true);
    const newResults: DiagnosticResult[] = [];

    for (const endpoint of testEndpoints) {
      const result: DiagnosticResult = {
        endpoint,
        status: "pending",
        timestamp: Date.now(),
      };

      try {
        const res = await fetchWithFallback(endpoint, { timeout: 12000, retries: 1 });
        if (res.success) {
          result.status = "success";
          result.response = res.data;
        } else {
          result.status = "error";
          result.error = res.error || "timeout";
        }
      } catch (error) {
        result.status = "error";
        result.error = error instanceof Error ? error.message : String(error);
      }

      newResults.push(result);
      setResults([...newResults]);
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <div className="fixed top-4 right-4 w-96 bg-dark-bg border border-cyber-green/30 rounded-lg p-4 z-50 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyber-green font-mono font-bold">API Diagnostic</h3>
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="px-3 py-1 bg-cyber-green/20 border border-cyber-green text-cyber-green text-xs font-mono rounded hover:bg-cyber-green/30 disabled:opacity-50"
        >
          {isRunning ? "Testing..." : "Retest"}
        </button>
      </div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-600 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-cyan-400 font-mono text-xs">
                {result.endpoint}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-mono ${
                  result.status === "success"
                    ? "bg-green-600 text-white"
                    : result.status === "error"
                      ? "bg-red-600 text-white"
                      : "bg-yellow-600 text-white"
                }`}
              >
                {result.status.toUpperCase()}
              </span>
            </div>

            {result.error && (
              <div className="text-red-400 text-xs font-mono mb-1">
                Error: {result.error}
              </div>
            )}

            {result.response && (
              <div className="text-gray-300 text-xs font-mono">
                Response:{" "}
                {JSON.stringify(result.response, null, 2).substring(0, 200)}
                {JSON.stringify(result.response).length > 200 && "..."}
              </div>
            )}

            <div className="text-gray-500 text-xs">
              {new Date(result.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-400 space-y-1">
        <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
        <div>URL: {window.location.href}</div>
        <div>Protocol: {window.location.protocol}</div>
        <div>Host: {window.location.host}</div>
      </div>
    </div>
  );
}
