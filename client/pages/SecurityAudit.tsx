import React, { useState, useEffect } from "react";
import CyberNav from "@/components/CyberNav";

// --- ErrorBoundary Component ---
// This component catches JavaScript errors in its children.
// It is useful for preventing the entire app from crashing due to a single error.

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error("Caught an error in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg text-foreground flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-4">An error occurred while rendering this component.</p>
            <details className="text-left bg-gray-800 p-4 rounded">
              <summary className="cursor-pointer text-cyber-green">Error Details</summary>
              <pre className="mt-2 text-xs text-gray-300 whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-cyber-green text-dark-bg rounded hover:bg-cyber-green/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- ToolTip Component ---
// A customizable tooltip component used throughout the app.
const ToolTip = ({ children, text, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-dark-bg border border-cyber-green px-3 py-2 rounded-lg shadow-lg max-w-xs">
            <p className="text-sm text-gray-300 font-mono">{text}</p>
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-dark-bg border-cyber-green transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-b border-r' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-t border-l' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r' :
              'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l'
            }`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// SecurityAudit Component
// This component represents a security audit result with a technology-specific tooltip.
const SecurityAudit = ({ technology, issue }) => {
  return (
    <ToolTip text={`${technology}: ${issue}`} position="top">
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 hover:border-red-500/50 transition-colors cursor-help">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-400 font-semibold text-sm">{technology}</h3>
            <p className="text-gray-300 text-xs mt-1">{issue}</p>
          </div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </ToolTip>
  );
};

// --- Main SecurityAuditPage Component ---
const SecurityAuditPage = () => {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId] = useState("user-" + Math.random().toString(36).substring(2, 9));

  // API functions
  const fetchAuditData = async () => {
    try {
      const response = await fetch('/api/security-audit');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setAuditData(data.audits || []);
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
      setError('Failed to load security audit data');
      // Fallback to example data structure
      setAuditData([
        {
          id: 1,
          technology: "Smart Contract",
          issue: "Potential reentrancy vulnerability detected",
          severity: "high",
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          technology: "Token Analysis", 
          issue: "Unusual transaction patterns observed",
          severity: "medium",
          timestamp: new Date().toISOString(),
        },
        {
          id: 3,
          technology: "Liquidity Check",
          issue: "Low liquidity pool detected",
          severity: "low", 
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createAuditEntry = async (auditData) => {
    try {
      const response = await fetch('/api/security-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...auditData,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Refresh audit data after creating new entry
      await fetchAuditData();
    } catch (error) {
      console.error('Failed to create audit entry:', error);
      setError('Failed to save audit data');
    }
  };

  useEffect(() => {
    fetchAuditData();
    
    // Set up periodic refresh for live data
    const interval = setInterval(fetchAuditData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyber-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyber-green font-mono">Loading Security Audit...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <CyberNav />
      <div className="min-h-screen bg-dark-bg text-foreground">
        {/* Cyber Grid Background */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auditGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#2a2a2a" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auditGrid)" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-cyber-green/30 bg-dark-bg/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-cyber font-bold text-cyber-green">
                    Security Audit Dashboard
                  </h1>
                  <p className="text-gray-400 font-mono mt-2">
                    Real-time blockchain security analysis
                  </p>
                </div>
                <div className="flex items-center gap-2 text-cyber-green">
                  <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                  <span className="text-sm font-mono">Live Monitoring</span>
                </div>
              </div>
            </div>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-900/20 border-b border-red-500/30 px-4 py-3">
              <div className="max-w-7xl mx-auto">
                <p className="text-red-400 text-sm font-mono text-center">{error}</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-dark-bg/60 backdrop-blur-xl border border-cyber-green/30 rounded-xl p-6">
                <h3 className="text-cyber-green font-semibold mb-2">Total Audits</h3>
                <p className="text-2xl font-bold text-white">{auditData.length}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">Active monitoring</p>
              </div>
              
              <div className="bg-dark-bg/60 backdrop-blur-xl border border-cyber-blue/30 rounded-xl p-6">
                <h3 className="text-cyber-blue font-semibold mb-2">High Priority</h3>
                <p className="text-2xl font-bold text-white">
                  {auditData.filter(audit => audit.severity === 'high').length}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-1">Requires attention</p>
              </div>
              
              <div className="bg-dark-bg/60 backdrop-blur-xl border border-cyber-purple/30 rounded-xl p-6">
                <h3 className="text-cyber-purple font-semibold mb-2">User ID</h3>
                <p className="text-lg font-mono text-white truncate">{userId}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">Session identifier</p>
              </div>
            </div>

            {/* Audit Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Security Audit Results</h2>
                <button
                  onClick={fetchAuditData}
                  className="px-4 py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green rounded-lg hover:bg-cyber-green hover:text-dark-bg transition-all duration-300 font-mono text-sm"
                >
                  Refresh Data
                </button>
              </div>
              
              {auditData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {auditData.map((audit) => (
                    <SecurityAudit
                      key={audit.id}
                      technology={audit.technology}
                      issue={audit.issue}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 border-2 border-cyber-green rounded-full"></div>
                  </div>
                  <h3 className="text-gray-400 font-semibold mb-2">No Security Issues Detected</h3>
                  <p className="text-gray-500 text-sm font-mono">Your systems are secure</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark-bg/60 backdrop-blur-xl border border-cyber-green/30 rounded-xl p-6">
                <h3 className="text-cyber-green font-semibold mb-4">Quick Scan</h3>
                <p className="text-gray-300 text-sm mb-4 font-mono">
                  Perform an immediate security scan of your contracts
                </p>
                <button
                  onClick={() => createAuditEntry({
                    technology: "Manual Scan",
                    issue: "User-initiated security audit",
                    severity: "info"
                  })}
                  className="w-full px-4 py-2 bg-cyber-green text-dark-bg rounded-lg hover:bg-cyber-green/90 transition-colors font-mono"
                >
                  Start Scan
                </button>
              </div>
              
              <div className="bg-dark-bg/60 backdrop-blur-xl border border-cyber-purple/30 rounded-xl p-6">
                <h3 className="text-cyber-purple font-semibold mb-4">Export Report</h3>
                <p className="text-gray-300 text-sm mb-4 font-mono">
                  Download a comprehensive security audit report
                </p>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(auditData, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const exportFileDefaultName = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }}
                  className="w-full px-4 py-2 bg-cyber-purple text-white rounded-lg hover:bg-cyber-purple/90 transition-colors font-mono"
                >
                  Export JSON
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SecurityAuditPage;
