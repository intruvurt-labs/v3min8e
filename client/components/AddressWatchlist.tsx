import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  Activity,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react";

interface WatchedAddress {
  id: string;
  address: string;
  blockchain: string;
  watch_type: string;
  alert_threshold?: number;
  is_active: boolean;
  last_activity?: string;
  total_alerts_sent: number;
  created_at: string;
  nickname?: string;
}

interface AddressActivity {
  id: string;
  address: string;
  activity_type: string;
  amount: number;
  risk_score: number;
  timestamp: string;
  details: any;
}

export function AddressWatchlist() {
  const [watchedAddresses, setWatchedAddresses] = useState<WatchedAddress[]>(
    [],
  );
  const [recentActivity, setRecentActivity] = useState<AddressActivity[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [selectedBlockchain, setSelectedBlockchain] = useState("ethereum");
  const [filterActive, setFilterActive] = useState(true);
  const [loading, setLoading] = useState(true);

  const blockchains = [
    "ethereum",
    "solana",
    "base",
    "blast",
    "polygon",
    "avalanche",
    "arbitrum",
    "optimism",
  ];

  useEffect(() => {
    loadWatchedAddresses();
    loadRecentActivity();
  }, [filterActive]);

  const loadWatchedAddresses = async () => {
    try {
      const response = await fetch(
        `/api/nimrev/watched-addresses?active=${filterActive}`,
      );
      if (response.ok) {
        const data = await response.json();
        setWatchedAddresses(data);
      }
    } catch (error) {
      console.error("Failed to load watched addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await fetch("/api/nimrev/address-activity");
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error("Failed to load activity:", error);
    }
  };

  const addWatchedAddress = async () => {
    if (!newAddress.trim()) return;

    try {
      const response = await fetch("/api/nimrev/watched-addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: newAddress,
          blockchain: selectedBlockchain,
          watch_type: "full",
        }),
      });

      if (response.ok) {
        setNewAddress("");
        loadWatchedAddresses();
      }
    } catch (error) {
      console.error("Failed to add watched address:", error);
    }
  };

  const toggleAddressStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/nimrev/watched-addresses/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (response.ok) {
        loadWatchedAddresses();
      }
    } catch (error) {
      console.error("Failed to toggle address status:", error);
    }
  };

  const removeWatchedAddress = async (id: string) => {
    try {
      const response = await fetch(`/api/nimrev/watched-addresses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadWatchedAddresses();
      }
    } catch (error) {
      console.error("Failed to remove watched address:", error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-red-500";
    if (score <= 60) return "text-yellow-500";
    if (score <= 70) return "text-blue-500";
    return "text-green-500";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Mock data for demonstration
  const mockWatchedAddresses: WatchedAddress[] = [
    {
      id: "1",
      address: "0x1234567890123456789012345678901234567890",
      blockchain: "ethereum",
      watch_type: "full",
      alert_threshold: 10000,
      is_active: true,
      last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      total_alerts_sent: 3,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      nickname: "Suspicious Deployer",
    },
    {
      id: "2",
      address: "7LpfPEQSrZQhvE7Zm7g8FkQD4Uz8V5Qz9E3Hm1kX8JnY",
      blockchain: "solana",
      watch_type: "liquidity_only",
      is_active: true,
      last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      total_alerts_sent: 1,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockActivity: AddressActivity[] = [
    {
      id: "1",
      address: "0x1234567890123456789012345678901234567890",
      activity_type: "large_transfer",
      amount: 50000,
      risk_score: 25,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      details: { recipient: "0xabcd...", token: "USDC" },
    },
    {
      id: "2",
      address: "7LpfPEQSrZQhvE7Zm7g8FkQD4Uz8V5Qz9E3Hm1kX8JnY",
      activity_type: "liquidity_removal",
      amount: 25000,
      risk_score: 15,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      details: { pool: "SOL/USDC", percentage: 80 },
    },
  ];

  const displayAddresses =
    watchedAddresses.length > 0 ? watchedAddresses : mockWatchedAddresses;
  const displayActivity =
    recentActivity.length > 0 ? recentActivity : mockActivity;

  return (
    <div className="space-y-6">
      {/* Add New Address */}
      <Card className="border-cyber-grid bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center text-cyber-green">
            <Plus className="w-5 h-5 mr-2" />
            Add Address to Watchlist
          </CardTitle>
          <CardDescription>
            Monitor any address for suspicious activity and receive real-time
            alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Enter address to monitor (0x... or base58)"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="border-cyber-grid bg-input/50"
              />
            </div>
            <select
              value={selectedBlockchain}
              onChange={(e) => setSelectedBlockchain(e.target.value)}
              className="px-3 py-2 border border-cyber-grid bg-input/50 rounded-md text-foreground"
            >
              {blockchains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </option>
              ))}
            </select>
            <Button
              onClick={addWatchedAddress}
              disabled={!newAddress.trim()}
              className="bg-cyber-green hover:bg-cyber-green/80 text-dark-bg"
            >
              <Eye className="w-4 h-4 mr-2" />
              Watch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Watched Addresses */}
      <Card className="border-cyber-grid bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-cyber-green">
                <Eye className="w-5 h-5 mr-2" />
                Monitored Addresses
                <Badge
                  variant="outline"
                  className="ml-2 border-cyber-green text-cyber-green"
                >
                  {displayAddresses.filter((addr) => addr.is_active).length}{" "}
                  Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time monitoring of suspicious addresses and wallet
                activities
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterActive(!filterActive)}
                className={
                  filterActive ? "border-cyber-green text-cyber-green" : ""
                }
              >
                <Filter className="w-4 h-4 mr-1" />
                {filterActive ? "Active Only" : "All"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayAddresses.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Addresses Monitored
              </h3>
              <p className="text-muted-foreground">
                Add addresses above to start monitoring suspicious activity.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 bg-card/30 backdrop-blur transition-all ${
                    address.is_active
                      ? "border-cyber-grid"
                      : "border-gray-600 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <code
                          className="text-sm bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => copyToClipboard(address.address)}
                          title="Click to copy full address"
                        >
                          {formatAddress(address.address)}
                        </code>
                        <Badge
                          variant="outline"
                          className="border-cyber-blue text-cyber-blue"
                        >
                          {address.blockchain}
                        </Badge>
                        <Badge variant="outline">
                          {address.watch_type.replace("_", " ")}
                        </Badge>
                        {address.nickname && (
                          <Badge variant="secondary">{address.nickname}</Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Watching for {getTimeAgo(address.created_at)}
                        </div>

                        {address.last_activity && (
                          <div className="flex items-center">
                            <Activity className="w-3 h-3 mr-1" />
                            Last activity {getTimeAgo(address.last_activity)}
                          </div>
                        )}

                        {address.total_alerts_sent > 0 && (
                          <div className="flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {address.total_alerts_sent} alerts sent
                          </div>
                        )}

                        {address.alert_threshold && (
                          <div className="flex items-center">
                            Threshold: $
                            {address.alert_threshold.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleAddressStatus(address.id, address.is_active)
                        }
                        className={
                          address.is_active
                            ? "border-yellow-500 text-yellow-500"
                            : "border-green-500 text-green-500"
                        }
                      >
                        {address.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeWatchedAddress(address.id)}
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-cyber-grid bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center text-cyber-orange">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Live feed of suspicious activities from your monitored addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
              <p className="text-muted-foreground">
                Monitored addresses have been quiet recently.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="border border-cyber-grid rounded-lg p-4 bg-card/30 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {formatAddress(activity.address)}
                        </code>
                        <Badge variant="outline" className="capitalize">
                          {activity.activity_type.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={
                            activity.risk_score <= 30
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          Risk: {activity.risk_score}/100
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>
                            Amount:{" "}
                            <span className="font-semibold text-foreground">
                              ${activity.amount.toLocaleString()}
                            </span>
                          </span>
                          <span>{getTimeAgo(activity.timestamp)}</span>
                        </div>

                        {activity.details && (
                          <div className="mt-1 text-xs">
                            {Object.entries(activity.details).map(
                              ([key, value]) => (
                                <span key={key} className="mr-4">
                                  {key}: {String(value)}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`text-right ${getRiskColor(activity.risk_score)}`}
                    >
                      <div className="text-2xl font-bold">
                        {activity.risk_score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Risk Score
                      </div>
                    </div>
                  </div>

                  {activity.risk_score <= 30 && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                      <div className="flex items-center text-red-400">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <span className="font-semibold">
                          HIGH RISK ACTIVITY
                        </span>
                      </div>
                      <p className="text-red-300 text-xs mt-1">
                        This activity pattern suggests potential malicious
                        behavior.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
