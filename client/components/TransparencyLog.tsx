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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  GitBranch,
  Search,
  Download,
  Shield,
  Clock,
  FileText,
  Hash,
  Database,
  ExternalLink,
  Eye,
  CheckCircle,
} from "lucide-react";

interface ScanRecord {
  id: string;
  token_address: string;
  blockchain: string;
  token_symbol?: string;
  token_name?: string;
  risk_score: number;
  threat_categories: string[];
  scanner_version: string;
  community_votes_up: number;
  community_votes_down: number;
  ipfs_hash?: string;
  signature?: string;
  created_at: string;
}

interface IPFSEntry {
  hash: string;
  scan_id: string;
  size: number;
  created_at: string;
  verified: boolean;
}

export function TransparencyLog() {
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([]);
  const [ipfsEntries, setIpfsEntries] = useState<IPFSEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScanRecords();
    loadIpfsEntries();
  }, [selectedTimeframe, searchQuery]);

  const loadScanRecords = async () => {
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        search: searchQuery,
      });

      const response = await fetch(`/api/nimrev/public-scans?${params}`);
      if (response.ok) {
        const data = await response.json();
        setScanRecords(data);
      }
    } catch (error) {
      console.error("Failed to load scan records:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadIpfsEntries = async () => {
    try {
      const response = await fetch("/api/nimrev/ipfs-entries");
      if (response.ok) {
        const data = await response.json();
        setIpfsEntries(data);
      }
    } catch (error) {
      console.error("Failed to load IPFS entries:", error);
    }
  };

  const downloadScanData = async (scanId: string) => {
    try {
      const response = await fetch(`/api/nimrev/scan-data/${scanId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `scan-${scanId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download scan data:", error);
    }
  };

  const verifyScanSignature = async (scanId: string) => {
    try {
      const response = await fetch(`/api/nimrev/verify-signature/${scanId}`);
      if (response.ok) {
        const { valid } = await response.json();
        alert(
          valid ? "Signature is valid ✅" : "Signature verification failed ❌",
        );
      }
    } catch (error) {
      console.error("Failed to verify signature:", error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const formatHash = (hash: string) => {
    if (!hash) return "N/A";
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
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

  const getRiskBadgeVariant = (
    score: number,
  ): "destructive" | "secondary" | "default" | "outline" => {
    if (score <= 30) return "destructive";
    if (score <= 60) return "secondary";
    if (score <= 70) return "outline";
    return "default";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Mock data for demonstration
  const mockScanRecords: ScanRecord[] = [
    {
      id: "1",
      token_address: "0x1234567890123456789012345678901234567890",
      blockchain: "ethereum",
      token_symbol: "SCAM",
      token_name: "Scam Token",
      risk_score: 15,
      threat_categories: ["honeypot", "high_fees"],
      scanner_version: "1.0.0",
      community_votes_up: 42,
      community_votes_down: 3,
      ipfs_hash: "QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o",
      signature:
        "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      token_address: "7LpfPEQSrZQhvE7Zm7g8FkQD4Uz8V5Qz9E3Hm1kX8JnY",
      blockchain: "solana",
      token_symbol: "SAFE",
      token_name: "Safe Token",
      risk_score: 85,
      threat_categories: [],
      scanner_version: "1.0.0",
      community_votes_up: 128,
      community_votes_down: 7,
      ipfs_hash: "QmX45zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff6p",
      signature:
        "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567",
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockIpfsEntries: IPFSEntry[] = [
    {
      hash: "QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o",
      scan_id: "1",
      size: 2048,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      verified: true,
    },
    {
      hash: "QmX45zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff6p",
      scan_id: "2",
      size: 1876,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      verified: true,
    },
  ];

  const displayScanRecords =
    scanRecords.length > 0 ? scanRecords : mockScanRecords;
  const displayIpfsEntries =
    ipfsEntries.length > 0 ? ipfsEntries : mockIpfsEntries;

  return (
    <Card className="border-cyber-grid bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-cyber-green">
              <GitBranch className="w-5 h-5 mr-2" />
              Transparency Ledger
            </CardTitle>
            <CardDescription>
              Immutable public record of all scan results with cryptographic
              verification
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1 text-sm border border-cyber-grid bg-input/50 rounded"
            >
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by address, symbol, or IPFS hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-cyber-grid bg-input/50"
              />
            </div>
            <Button
              onClick={loadScanRecords}
              className="bg-cyber-blue hover:bg-cyber-blue/80 text-dark-bg"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <Tabs defaultValue="scans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-cyber-grid">
            <TabsTrigger value="scans">
              <FileText className="w-4 h-4 mr-2" />
              Scan Records
            </TabsTrigger>
            <TabsTrigger value="ipfs">
              <Database className="w-4 h-4 mr-2" />
              IPFS Storage
            </TabsTrigger>
            <TabsTrigger value="verification">
              <Shield className="w-4 h-4 mr-2" />
              Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scans">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Public Scan Records</h3>
                <Badge
                  variant="outline"
                  className="border-cyber-green text-cyber-green"
                >
                  {displayScanRecords.length} Records
                </Badge>
              </div>

              {displayScanRecords.map((record) => (
                <div
                  key={record.id}
                  className="border border-cyber-grid rounded-lg p-4 bg-card/30 backdrop-blur"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-foreground">
                          {record.token_symbol || "Unknown"} -{" "}
                          {record.token_name || "Unknown Token"}
                        </h4>
                        <Badge variant={getRiskBadgeVariant(record.risk_score)}>
                          Risk: {record.risk_score}/100
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-cyber-blue text-cyber-blue"
                        >
                          {record.blockchain}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <code
                          className="text-sm bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => copyToClipboard(record.token_address)}
                          title="Click to copy full address"
                        >
                          {formatAddress(record.token_address)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>

                      {record.threat_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {record.threat_categories.map((category, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {category.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(record.created_at)}
                        </div>

                        <div className="flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          Scanner v{record.scanner_version}
                        </div>

                        {record.ipfs_hash && (
                          <div className="flex items-center">
                            <Database className="w-3 h-3 mr-1" />
                            IPFS: {formatHash(record.ipfs_hash)}
                          </div>
                        )}

                        <div className="flex items-center">
                          👍 {record.community_votes_up} 👎{" "}
                          {record.community_votes_down}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div
                        className={`text-right ${getRiskColor(record.risk_score)}`}
                      >
                        <div className="text-2xl font-bold">
                          {record.risk_score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Risk Score
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadScanData(record.id)}
                          className="border-cyber-green text-cyber-green"
                        >
                          <Download className="w-3 h-3" />
                        </Button>

                        {record.signature && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyScanSignature(record.id)}
                            className="border-cyber-orange text-cyber-orange"
                          >
                            <Shield className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ipfs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">IPFS Storage Records</h3>
                <Badge
                  variant="outline"
                  className="border-cyber-blue text-cyber-blue"
                >
                  {displayIpfsEntries.length} Files
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayIpfsEntries.map((entry) => (
                  <div
                    key={entry.hash}
                    className="border border-cyber-grid rounded-lg p-4 bg-card/30 backdrop-blur"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Database className="w-4 h-4 text-cyber-blue" />
                          <span className="font-semibold">IPFS File</span>
                          {entry.verified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>

                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Hash:{" "}
                            </span>
                            <code
                              className="text-xs bg-muted px-1 py-0.5 rounded cursor-pointer hover:bg-muted/80"
                              onClick={() => copyToClipboard(entry.hash)}
                            >
                              {formatHash(entry.hash)}
                            </code>
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Scan ID:{" "}
                            </span>
                            <code className="text-xs">{entry.scan_id}</code>
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Size:{" "}
                            </span>
                            {(entry.size / 1024).toFixed(2)} KB
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Uploaded:{" "}
                            </span>
                            {getTimeAgo(entry.created_at)}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://ipfs.io/ipfs/${entry.hash}`,
                            "_blank",
                          )
                        }
                        className="border-cyber-blue text-cyber-blue"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Cryptographic Verification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Signature Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        Every scan result is cryptographically signed to ensure
                        integrity.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>SHA-256 hashing of scan data</li>
                        <li>Digital signatures prevent tampering</li>
                        <li>Public key verification available</li>
                        <li>Immutable audit trail</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-cyber-grid bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      IPFS Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        All scan results are stored on IPFS for decentralized
                        access.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Content-addressed storage</li>
                        <li>Distributed across nodes</li>
                        <li>Censorship-resistant</li>
                        <li>Permanent preservation</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-card/30 p-6 rounded-lg border border-cyber-grid">
                <h4 className="font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Transparency Guarantees
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h5 className="font-semibold text-cyber-green mb-2">
                      Immutable Records
                    </h5>
                    <p className="text-muted-foreground">
                      Once published, scan results cannot be modified or
                      deleted. All historical data remains accessible forever.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-cyber-blue mb-2">
                      Public Verification
                    </h5>
                    <p className="text-muted-foreground">
                      Anyone can verify the authenticity of scan results using
                      cryptographic signatures and IPFS hashes.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-cyber-orange mb-2">
                      Community Oversight
                    </h5>
                    <p className="text-muted-foreground">
                      The community can vote on scan accuracy and report false
                      positives to improve the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
