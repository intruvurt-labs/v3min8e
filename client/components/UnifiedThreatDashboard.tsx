import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, Shield, Zap, Eye, Bot, Target, 
  TrendingUp, Clock, Users, Cpu, ChevronDown, ChevronUp
} from 'lucide-react';
import { useUnifiedThreatMonitor, GlobalThreatEvent } from '../hooks/useUnifiedThreatMonitor';

interface ThreatEventItemProps {
  event: GlobalThreatEvent;
  isLatest?: boolean;
}

function ThreatEventItem({ event, isLatest }: ThreatEventItemProps) {
  const getSeverityColor = () => {
    switch (event.severity) {
      case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-cyber-blue border-cyber-blue/30 bg-cyber-blue/10';
    }
  };

  const getTypeIcon = () => {
    switch (event.type) {
      case 'high_risk_detected': return <AlertTriangle className="w-4 h-4" />;
      case 'scan_completed': return <Shield className="w-4 h-4" />;
      case 'address_activity': return <Target className="w-4 h-4" />;
      case 'bot_activity': return <Bot className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatTime = () => {
    return new Date(event.timestamp).toLocaleTimeString();
  };

  const formatMessage = () => {
    if (event.data.alertMessage) return event.data.alertMessage;
    
    switch (event.type) {
      case 'high_risk_detected':
        return `High-risk token: ${event.data.address?.slice(0, 10)}... (${event.data.riskScore}/100)`;
      case 'scan_completed':
        return `Scan: ${event.data.blockchain}:${event.data.address?.slice(0, 8)}...`;
      case 'address_activity':
        return `Activity: ${event.data.address?.slice(0, 8)}... on ${event.data.blockchain}`;
      case 'bot_activity':
        return event.data.botAction || 'Bot action performed';
      default:
        return 'System event';
    }
  };

  return (
    <div className={`
      p-3 rounded-lg border transition-all duration-300 ${getSeverityColor()}
      ${isLatest ? 'ring-2 ring-current ring-opacity-50 animate-pulse' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                {event.severity}
              </span>
              <span className="text-xs opacity-60">
                {event.data.source}
              </span>
            </div>
            
            <p className="text-sm font-medium mb-1">
              {formatMessage()}
            </p>
            
            <div className="flex flex-wrap gap-2 text-xs">
              {event.data.blockchain && (
                <span className="px-2 py-1 rounded bg-current bg-opacity-20 font-mono">
                  {event.data.blockchain.toUpperCase()}
                </span>
              )}
              {event.data.threatCategories?.map(category => (
                <span key={category} className="px-2 py-1 rounded bg-current bg-opacity-20 font-mono">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <span className="text-xs font-mono opacity-60">
          {formatTime()}
        </span>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

function StatsCard({ title, value, icon, color, subtitle, trend }: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'down': return <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 bg-card/50 border border-cyber-green/20 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold font-mono text-cyber-green">
          {value}
        </p>
        <p className="text-sm text-cyber-blue">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function UnifiedThreatDashboard() {
  const { 
    stats, 
    recentEvents, 
    isConnected, 
    isConnecting,
    connectionError,
    getCriticalEvents,
    getEventsByType,
    requestStats
  } = useUnifiedThreatMonitor();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [latestEventId, setLatestEventId] = useState<string | null>(null);

  // Track latest event for highlighting
  useEffect(() => {
    if (recentEvents.length > 0) {
      const latest = recentEvents[recentEvents.length - 1];
      setLatestEventId(latest.id);
      
      // Clear highlight after 3 seconds
      const timer = setTimeout(() => setLatestEventId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [recentEvents]);

  const filteredEvents = recentEvents.filter(event => {
    if (selectedFilter === 'all') return true;
    return event.severity === selectedFilter;
  }).slice(-20); // Show last 20 events

  const criticalEvents = getCriticalEvents();
  const scanEvents = getEventsByType('scan_completed');
  const threatEvents = getEventsByType('high_risk_detected');

  if (!isConnected && !isConnecting) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-red-400 mb-2">
          Real-Time System Offline
        </h3>
        <p className="text-gray-400 mb-4">
          {connectionError || 'Unable to connect to unified threat monitoring system'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green rounded-lg hover:bg-cyber-green/30 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className={`w-6 h-6 ${isConnected ? 'text-cyber-green animate-pulse' : 'text-gray-400'}`} />
          <h2 className="text-xl font-bold text-cyber-green font-mono">
            UNIFIED THREAT MONITOR
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyber-green animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-mono text-cyber-blue">
              {isConnecting ? 'CONNECTING...' : isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={requestStats}
            className="px-3 py-1 text-xs font-mono text-cyber-blue hover:text-cyber-green transition-colors"
          >
            REFRESH
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-cyber-blue hover:text-cyber-green transition-colors"
          >
            <span className="text-xs font-mono">
              {isExpanded ? 'COLLAPSE' : 'EXPAND'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Active Scans"
            value={stats.activeScans}
            icon={<Zap className="w-5 h-5" />}
            color="bg-cyber-blue/20 text-cyber-blue"
            subtitle="Currently processing"
          />
          
          <StatsCard
            title="Threats (24h)"
            value={stats.threatsDetected24h}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="bg-red-500/20 text-red-400"
            subtitle="High-risk detected"
            trend={stats.threatsDetected24h > 10 ? 'up' : 'stable'}
          />
          
          <StatsCard
            title="Monitored Addresses"
            value={stats.addressesMonitored}
            icon={<Eye className="w-5 h-5" />}
            color="bg-cyber-green/20 text-cyber-green"
            subtitle="24/7 monitoring"
          />
          
          <StatsCard
            title="System Health"
            value={stats.systemHealth.toUpperCase()}
            icon={<Shield className="w-5 h-5" />}
            color={
              stats.systemHealth === 'healthy' ? 'bg-cyber-green/20 text-cyber-green' :
              stats.systemHealth === 'degraded' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            }
            subtitle={`${stats.connectedClients} clients`}
          />
        </div>
      )}

      {/* Event Filters */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-mono text-cyber-blue">FILTER:</span>
        {['all', 'critical', 'high', 'medium'].map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter as any)}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
              selectedFilter === filter
                ? 'bg-cyber-green text-dark-bg'
                : 'text-cyber-green hover:bg-cyber-green/20'
            }`}
          >
            {filter.toUpperCase()}
            {filter !== 'all' && (
              <span className="ml-1">
                ({recentEvents.filter(e => e.severity === filter).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Real-time Event Feed */}
      {isExpanded && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-cyber-green font-mono">
              LIVE THREAT FEED
            </h3>
            <span className="text-xs font-mono text-cyber-blue">
              {filteredEvents.length} events shown
            </span>
          </div>

          <div className="h-96 overflow-y-auto space-y-2 pr-2">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">
                  No events match the current filter
                </p>
              </div>
            ) : (
              filteredEvents.reverse().map((event) => (
                <ThreatEventItem
                  key={event.id}
                  event={event}
                  isLatest={event.id === latestEventId}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-lg font-bold text-red-400 font-mono">
            {criticalEvents.length}
          </div>
          <div className="text-xs text-red-300">Critical Events</div>
        </div>
        
        <div className="p-3 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg">
          <div className="text-lg font-bold text-cyber-blue font-mono">
            {scanEvents.length}
          </div>
          <div className="text-xs text-cyber-blue/80">Scans Completed</div>
        </div>
        
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="text-lg font-bold text-orange-400 font-mono">
            {threatEvents.length}
          </div>
          <div className="text-xs text-orange-300">Threats Detected</div>
        </div>
      </div>
    </div>
  );
}
