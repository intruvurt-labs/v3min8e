import React from "react";

interface SystemStatusData {
  botCore: { status: string; progress: number; lastPing: number | null };
  scanner: {
    status: string;
    progress: number;
    scansRunning: number;
    timeElapsed: number;
  };
  uptime: { start: number };
  currentOperation: string;
  liveFeed: Array<{ type: string; message: string; timestamp: number }>;
}

interface SystemStatusPanelProps {
  status: SystemStatusData;
  currentTime: number;
}

export default function SystemStatusPanel({
  status,
  currentTime,
}: SystemStatusPanelProps) {
  const getStatusColor = (statusText: string) => {
    if (statusText === "ONLINE" || statusText === "OPERATIONAL")
      return "text-cyber-green";
    if (statusText === "SCANNING" || statusText === "DEGRADED")
      return "text-cyber-orange";
    if (statusText.includes("CHECKING")) return "text-cyber-blue";
    return "text-red-400";
  };

  const getIndicatorColor = (statusText: string) => {
    if (statusText === "ONLINE" || statusText === "OPERATIONAL")
      return "bg-cyber-green animate-pulse";
    if (statusText === "SCANNING" || statusText === "DEGRADED")
      return "bg-cyber-orange animate-ping";
    if (statusText.includes("CHECKING")) return "bg-cyber-blue animate-pulse";
    return "bg-red-500 animate-pulse";
  };

  const formatUptime = () => {
    const elapsed = Math.floor((currentTime - status.uptime.start) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;
  };

  return (
    <div className="w-[240px] h-[300px] rounded-2xl overflow-hidden backdrop-blur-md bg-black/95 border border-cyber-blue/80 shadow-2xl shadow-cyber-blue/40">
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 border-b border-cyber-blue/50 pb-3">
          <div
            className={`w-3 h-3 rounded-full ${getIndicatorColor(status.botCore.status)}`}
          ></div>
          <span className="text-cyber-blue font-mono text-sm font-bold">
            SYSTEM STATUS
          </span>
        </div>

        {/* Bot Core Status - Only show if not checking */}
        {!status.botCore.status.includes("CHECKING") && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-mono text-sm">Bot Core</span>
              <span
                className={`font-mono text-sm ${getStatusColor(status.botCore.status)}`}
              >
                {status.botCore.status}
              </span>
            </div>
            {status.botCore.progress > 0 && (
              <div className="w-full bg-black/60 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-cyber-green to-cyber-blue"
                  style={{ width: `${status.botCore.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Scanner Status - Only show if not checking */}
        {!status.scanner.status.includes("CHECKING") && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-mono text-sm">Scanner</span>
              <span
                className={`font-mono text-sm ${getStatusColor(status.scanner.status)}`}
              >
                {status.scanner.status}
              </span>
            </div>
            {status.scanner.progress > 0 && (
              <>
                <div className="w-full bg-black/60 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      status.scanner.status === "SCANNING"
                        ? "bg-gradient-to-r from-cyber-orange to-cyber-purple animate-pulse"
                        : "bg-gradient-to-r from-cyber-blue to-cyber-cyan"
                    }`}
                    style={{ width: `${status.scanner.progress}%` }}
                  ></div>
                </div>
                {status.scanner.scansRunning > 0 && (
                  <div className="text-gray-400 font-mono text-sm">
                    Active: {status.scanner.scansRunning}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* System Uptime */}
        <div className="mb-4">
          <span className="text-gray-300 font-mono text-sm">Uptime</span>
          <div className="text-cyber-green font-mono text-sm font-bold">
            {formatUptime()}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 min-h-0 mb-4">
          <div className="text-gray-300 font-mono text-sm mb-2">Activity</div>
          <div className="h-24 overflow-y-auto space-y-2">
            {status.liveFeed.length > 0 ? (
              status.liveFeed.slice(0, 4).map((item, index) => (
                <div
                  key={`${item.timestamp}-${index}`}
                  className="flex items-start gap-2"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                      item.type === "success"
                        ? "bg-cyber-green"
                        : item.type === "info"
                          ? "bg-cyber-blue"
                          : item.type === "warning"
                            ? "bg-cyber-orange"
                            : "bg-red-400"
                    }`}
                  ></div>
                  <span
                    className={`font-mono text-sm leading-tight ${
                      item.type === "success"
                        ? "text-cyber-green"
                        : item.type === "info"
                          ? "text-cyber-blue"
                          : item.type === "warning"
                            ? "text-cyber-orange"
                            : "text-red-400"
                    }`}
                  >
                    {item.message}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 font-mono text-sm">
                System initializing...
              </div>
            )}
          </div>
        </div>

        {/* Current Operation */}
        <div className="pt-3 border-t border-cyber-blue/40">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${getIndicatorColor(status.currentOperation.includes("operational") ? "ONLINE" : status.botCore.status)}`}
            ></div>
            <span
              className={`font-mono text-sm leading-tight ${
                status.currentOperation.includes("operational")
                  ? "text-cyber-green"
                  : status.currentOperation.includes("Checking")
                    ? "text-cyber-blue"
                    : "text-cyber-orange"
              }`}
            >
              {status.currentOperation}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
