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

interface CleanSystemStatusProps {
  status: SystemStatusData;
  currentTime: number;
}

export default function CleanSystemStatus({
  status,
  currentTime,
}: CleanSystemStatusProps) {
  const getMainStatusColor = () => {
    if (status.botCore.status === "ONLINE") return "text-cyber-green";
    if (status.botCore.status === "OFFLINE") return "text-red-400";
    return "text-cyber-orange";
  };

  const getIndicatorColor = () => {
    if (status.botCore.status === "ONLINE")
      return "bg-cyber-green animate-pulse";
    if (status.botCore.status === "OFFLINE") return "bg-red-500 animate-pulse";
    return "bg-cyber-orange animate-ping";
  };

  const getScannerColor = () => {
    if (status.scanner.status === "SCANNING") return "text-cyber-orange";
    if (status.scanner.status === "OPERATIONAL") return "text-cyber-green";
    return "text-gray-400";
  };

  const formatUptime = () => {
    const elapsed = Math.floor((currentTime - status.uptime.start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className="w-[260px] h-[220px] rounded-2xl overflow-hidden backdrop-blur-md bg-black/95 border border-cyber-blue/80 shadow-2xl shadow-cyber-blue/40">
      <div className="p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-cyber-blue/50 pb-3">
          <div className={`w-4 h-4 rounded-full ${getIndicatorColor()}`}></div>
          <span className="text-cyber-blue font-mono text-lg font-bold">
            SYSTEM STATUS
          </span>
        </div>

        {/* Main Status - Large and Clear */}
        <div className="text-center mb-5">
          <div
            className={`text-3xl font-bold font-mono mb-2 ${getMainStatusColor()}`}
          >
            {status.botCore.status}
          </div>
          <div className="text-gray-300 font-mono text-base leading-tight">
            {status.currentOperation}
          </div>
        </div>

        {/* Essential Metrics - Side by Side */}
        <div className="grid grid-cols-2 gap-4 text-center mb-5">
          <div>
            <div className="text-sm text-gray-400 font-mono mb-1">UPTIME</div>
            <div className="text-cyber-green font-mono text-xl font-bold">
              {formatUptime()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 font-mono mb-1">SCANNER</div>
            <div className={`font-mono text-xl font-bold ${getScannerColor()}`}>
              {status.scanner.status}
            </div>
          </div>
        </div>

        {/* Latest Activity - NO SCROLL, Limited Items */}
        {status.liveFeed.length > 0 && (
          <div className="mt-auto">
            <div className="text-sm text-gray-400 font-mono mb-2 text-center">
              LATEST
            </div>
            <div className="space-y-2">
              {status.liveFeed.slice(0, 2).map((item, index) => (
                <div
                  key={`${item.timestamp}-${index}`}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.type === "success"
                        ? "bg-cyber-green"
                        : item.type === "info"
                          ? "bg-cyber-blue"
                          : "bg-cyber-orange"
                    }`}
                  ></div>
                  <span
                    className={`font-mono text-sm leading-tight ${
                      item.type === "success"
                        ? "text-cyber-green"
                        : item.type === "info"
                          ? "text-cyber-blue"
                          : "text-cyber-orange"
                    }`}
                  >
                    {item.message.length > 22
                      ? `${item.message.substring(0, 22)}...`
                      : item.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
