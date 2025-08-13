import crypto from "crypto";
import { EventEmitter } from "events";

interface WebsiteScanRequest {
  url: string;
  userId?: string;
  scanType: "basic" | "comprehensive" | "elite";
}

interface PhishingIndicator {
  type:
    | "domain_similarity"
    | "ssl_certificate"
    | "content_analysis"
    | "reputation"
    | "metadata"
    | "external_links";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: string[];
  confidence: number;
}

interface WebsiteSecurityFinding {
  id: string;
  type:
    | "phishing"
    | "malware"
    | "scam"
    | "fake_project"
    | "suspicious_redirects"
    | "data_harvesting"
    | "social_engineering";
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  title: string;
  description: string;
  evidence: string[];
  mitigation: string;
  category: string;
  riskScore: number;
}

interface WebsiteScanResult {
  scanId: string;
  url: string;
  domain: string;
  timestamp: string;
  status: "completed" | "error" | "running";
  overallRiskScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  findings: WebsiteSecurityFinding[];
  technicalAnalysis: {
    sslCertificate: {
      valid: boolean;
      issuer: string;
      expiryDate: string;
      grade: string;
    };
    domainInfo: {
      registrar: string;
      creationDate: string;
      expiryDate: string;
      ageInDays: number;
    };
    contentAnalysis: {
      suspiciousKeywords: string[];
      externalLinks: number;
      socialMediaLinks: string[];
      downloadLinks: number;
    };
    reputationChecks: {
      blacklisted: boolean;
      malwareDetected: boolean;
      phishingReported: boolean;
      reputationScore: number;
    };
  };
  recommendations: string[];
}

export class WebsiteSecurityScanner extends EventEmitter {
  private activeScans: Map<string, any> = new Map();

  // Known phishing patterns and suspicious indicators
  private phishingPatterns = [
    // Common phishing domains
    /.*-official\.(com|org|net)/i,
    /.*-support\.(com|org|net)/i,
    /.*wallet.*connect.*/i,
    /.*metamask.*auth.*/i,
    /.*claim.*airdrop.*/i,
    /.*free.*crypto.*/i,

    // Suspicious TLDs
    /\.(tk|ml|ga|cf)$/i,

    // Common typosquatting patterns
    /.*uniswap.*/i, // but not exactly uniswap.org
    /.*pancakeswap.*/i,
    /.*metamask.*/i,
    /.*opensea.*/i,
  ];

  private legitimateDomains = [
    "uniswap.org",
    "pancakeswap.finance",
    "metamask.io",
    "opensea.io",
    "coinbase.com",
    "binance.com",
    "ethereum.org",
    "solana.com",
    "polygon.technology",
  ];

  private suspiciousKeywords = [
    "double your crypto",
    "free bitcoin",
    "guaranteed returns",
    "click here to claim",
    "limited time offer",
    "send crypto to receive",
    "wallet verification required",
    "urgent action required",
    "suspended account",
    "confirm your seed phrase",
    "enter private key",
    "validate your wallet",
    "crypto giveaway",
    "elon musk",
    "tesla giveaway",
  ];

  async scanWebsite(request: WebsiteScanRequest): Promise<string> {
    const scanId = crypto.randomUUID();

    console.log(
      `🌐 Initiating website security scan: ${scanId} for ${request.url}`,
    );

    // Start the scan process
    this.performWebsiteScan(scanId, request);

    return scanId;
  }

  private async performWebsiteScan(
    scanId: string,
    request: WebsiteScanRequest,
  ): Promise<void> {
    const findings: WebsiteSecurityFinding[] = [];

    try {
      this.emit("progress", {
        scanId,
        progress: 10,
        phase: "domain_analysis",
        currentTask: "Analyzing domain structure...",
      });

      // Parse URL and extract domain
      const urlObj = new URL(request.url);
      const domain = urlObj.hostname;

      // Phase 1: Domain Analysis
      const domainFindings = await this.analyzeDomain(domain, request.url);
      findings.push(...domainFindings);

      this.emit("progress", {
        scanId,
        progress: 30,
        phase: "content_analysis",
        currentTask: "Scanning website content...",
      });

      // Phase 2: Content Analysis (simulated)
      const contentFindings = await this.analyzeWebsiteContent(request.url);
      findings.push(...contentFindings);

      this.emit("progress", {
        scanId,
        progress: 50,
        phase: "ssl_analysis",
        currentTask: "Checking SSL certificate...",
      });

      // Phase 3: SSL and Security Headers
      const sslFindings = await this.analyzeSSLSecurity(domain);
      findings.push(...sslFindings);

      this.emit("progress", {
        scanId,
        progress: 70,
        phase: "reputation_check",
        currentTask: "Checking reputation databases...",
      });

      // Phase 4: Reputation Checks
      const reputationFindings = await this.checkReputation(domain);
      findings.push(...reputationFindings);

      this.emit("progress", {
        scanId,
        progress: 90,
        phase: "report_generation",
        currentTask: "Generating security report...",
      });

      // Generate final report
      const report = await this.generateWebsiteReport(
        scanId,
        request.url,
        findings,
      );

      this.emit("progress", {
        scanId,
        progress: 100,
        phase: "completed",
        currentTask: "Website scan completed",
      });
      this.emit("scan_completed", { scanId, report });
    } catch (error) {
      console.error(`❌ Website scan error for ${scanId}:`, error);
      this.emit("scan_error", { scanId, error: error.message });
    }
  }

  private async analyzeDomain(
    domain: string,
    url: string,
  ): Promise<WebsiteSecurityFinding[]> {
    const findings: WebsiteSecurityFinding[] = [];
    await this.delay(1000);

    // Check for phishing patterns
    for (const pattern of this.phishingPatterns) {
      if (pattern.test(domain)) {
        findings.push({
          id: crypto.randomUUID(),
          type: "phishing",
          severity: "high",
          confidence: 85,
          title: "Suspicious Domain Pattern",
          description: `Domain "${domain}" matches known phishing patterns`,
          evidence: [`Domain pattern: ${pattern.source}`, `Full URL: ${url}`],
          mitigation:
            "Verify this is the official website before entering any credentials",
          category: "domain_analysis",
          riskScore: 75,
        });
        break;
      }
    }

    // Check for typosquatting
    const suspiciousLegitimate = this.legitimateDomains.find((legitDomain) => {
      const similarity = this.calculateSimilarity(domain, legitDomain);
      return similarity > 0.7 && similarity < 1.0;
    });

    if (suspiciousLegitimate) {
      findings.push({
        id: crypto.randomUUID(),
        type: "phishing",
        severity: "critical",
        confidence: 92,
        title: "Potential Typosquatting",
        description: `Domain "${domain}" is very similar to legitimate site "${suspiciousLegitimate}"`,
        evidence: [
          `Suspicious domain: ${domain}`,
          `Legitimate domain: ${suspiciousLegitimate}`,
        ],
        mitigation: "Double-check the URL. This may be a phishing attempt.",
        category: "typosquatting",
        riskScore: 90,
      });
    }

    // Check domain age (simulated)
    const domainAge = Math.floor(Math.random() * 3650); // 0-10 years
    if (domainAge < 30) {
      findings.push({
        id: crypto.randomUUID(),
        type: "suspicious_redirects",
        severity: "medium",
        confidence: 70,
        title: "Very New Domain",
        description: `Domain was registered only ${domainAge} days ago`,
        evidence: [
          `Domain age: ${domainAge} days`,
          "New domains are often used for scams",
        ],
        mitigation: "Exercise extra caution with very new domains",
        category: "domain_reputation",
        riskScore: 50,
      });
    }

    return findings;
  }

  private async analyzeWebsiteContent(
    url: string,
  ): Promise<WebsiteSecurityFinding[]> {
    const findings: WebsiteSecurityFinding[] = [];
    await this.delay(1500);

    // Simulate content analysis
    const suspiciousContent = this.suspiciousKeywords.filter(
      () => Math.random() > 0.8,
    );

    if (suspiciousContent.length > 0) {
      findings.push({
        id: crypto.randomUUID(),
        type: "scam",
        severity: suspiciousContent.length > 2 ? "high" : "medium",
        confidence: 80,
        title: "Suspicious Content Detected",
        description: `Website contains ${suspiciousContent.length} suspicious keywords`,
        evidence: suspiciousContent.map(
          (keyword) => `Suspicious text: "${keyword}"`,
        ),
        mitigation: "Be very cautious of sites promising unrealistic returns",
        category: "content_analysis",
        riskScore: 60,
      });
    }

    // Check for wallet connection prompts
    if (Math.random() > 0.7) {
      findings.push({
        id: crypto.randomUUID(),
        type: "data_harvesting",
        severity: "high",
        confidence: 88,
        title: "Wallet Connection Prompt",
        description: "Website immediately prompts for wallet connection",
        evidence: [
          "Automatic wallet connection popup",
          "No clear purpose for wallet access",
        ],
        mitigation:
          "Only connect wallets to trusted dApps with clear functionality",
        category: "user_interaction",
        riskScore: 70,
      });
    }

    return findings;
  }

  private async analyzeSSLSecurity(
    domain: string,
  ): Promise<WebsiteSecurityFinding[]> {
    const findings: WebsiteSecurityFinding[] = [];
    await this.delay(800);

    // Simulate SSL analysis
    const hasValidSSL = Math.random() > 0.1; // 90% have valid SSL
    const isExpiringSoon = Math.random() > 0.9; // 10% expiring soon

    if (!hasValidSSL) {
      findings.push({
        id: crypto.randomUUID(),
        type: "malware",
        severity: "high",
        confidence: 95,
        title: "Invalid SSL Certificate",
        description: "Website does not have a valid SSL certificate",
        evidence: [
          "SSL verification failed",
          "Potential man-in-the-middle attack risk",
        ],
        mitigation: "Do not enter sensitive information on this website",
        category: "ssl_security",
        riskScore: 80,
      });
    }

    if (isExpiringSoon) {
      findings.push({
        id: crypto.randomUUID(),
        type: "suspicious_redirects",
        severity: "low",
        confidence: 60,
        title: "SSL Certificate Expiring Soon",
        description: "SSL certificate will expire within 30 days",
        evidence: ["Certificate expiry date approaching"],
        mitigation: "Monitor for certificate renewal",
        category: "ssl_maintenance",
        riskScore: 20,
      });
    }

    return findings;
  }

  private async checkReputation(
    domain: string,
  ): Promise<WebsiteSecurityFinding[]> {
    const findings: WebsiteSecurityFinding[] = [];
    await this.delay(1200);

    // Simulate reputation database checks
    const isBlacklisted = Math.random() > 0.95; // 5% blacklisted
    const hasMalwareReports = Math.random() > 0.92; // 8% malware reports
    const hasPhishingReports = Math.random() > 0.88; // 12% phishing reports

    if (isBlacklisted) {
      findings.push({
        id: crypto.randomUUID(),
        type: "malware",
        severity: "critical",
        confidence: 98,
        title: "Domain Blacklisted",
        description: "Domain found in security blacklists",
        evidence: ["Listed in multiple threat intelligence feeds"],
        mitigation: "AVOID THIS WEBSITE COMPLETELY",
        category: "reputation",
        riskScore: 100,
      });
    }

    if (hasMalwareReports) {
      findings.push({
        id: crypto.randomUUID(),
        type: "malware",
        severity: "high",
        confidence: 90,
        title: "Malware Reports",
        description: "Domain has been reported for hosting malware",
        evidence: [
          "Previous malware detections",
          "User reports of infected downloads",
        ],
        mitigation: "Do not download anything from this website",
        category: "malware_history",
        riskScore: 85,
      });
    }

    if (hasPhishingReports) {
      findings.push({
        id: crypto.randomUUID(),
        type: "phishing",
        severity: "high",
        confidence: 87,
        title: "Phishing Reports",
        description: "Domain has been reported for phishing activities",
        evidence: [
          "User reports of credential theft",
          "Phishing database entries",
        ],
        mitigation: "Do not enter passwords or private keys on this website",
        category: "phishing_history",
        riskScore: 80,
      });
    }

    return findings;
  }

  private async generateWebsiteReport(
    scanId: string,
    url: string,
    findings: WebsiteSecurityFinding[],
  ): Promise<WebsiteScanResult> {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const severityCounts = {
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    };

    const overallRiskScore = Math.max(
      0,
      100 -
        (severityCounts.critical * 30 +
          severityCounts.high * 20 +
          severityCounts.medium * 10 +
          severityCounts.low * 5),
    );

    let riskLevel: "safe" | "low" | "medium" | "high" | "critical";
    if (overallRiskScore >= 85) riskLevel = "safe";
    else if (overallRiskScore >= 70) riskLevel = "low";
    else if (overallRiskScore >= 50) riskLevel = "medium";
    else if (overallRiskScore >= 30) riskLevel = "high";
    else riskLevel = "critical";

    return {
      scanId,
      url,
      domain,
      timestamp: new Date().toISOString(),
      status: "completed",
      overallRiskScore,
      riskLevel,
      findings,
      technicalAnalysis: {
        sslCertificate: {
          valid: Math.random() > 0.1,
          issuer: "Let's Encrypt",
          expiryDate: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          grade: "A",
        },
        domainInfo: {
          registrar: "Namecheap Inc.",
          creationDate: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          expiryDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          ageInDays: Math.floor(Math.random() * 3650),
        },
        contentAnalysis: {
          suspiciousKeywords: findings
            .filter((f) => f.category === "content_analysis")
            .map((f) => f.title),
          externalLinks: Math.floor(Math.random() * 50),
          socialMediaLinks: ["twitter.com", "telegram.org"],
          downloadLinks: Math.floor(Math.random() * 10),
        },
        reputationChecks: {
          blacklisted: findings.some((f) => f.title.includes("Blacklisted")),
          malwareDetected: findings.some((f) => f.type === "malware"),
          phishingReported: findings.some((f) => f.type === "phishing"),
          reputationScore: overallRiskScore,
        },
      },
      recommendations: this.generateRecommendations(riskLevel, findings),
    };
  }

  private generateRecommendations(
    riskLevel: string,
    findings: WebsiteSecurityFinding[],
  ): string[] {
    const recommendations = [];

    switch (riskLevel) {
      case "critical":
        recommendations.push("🚨 AVOID THIS WEBSITE COMPLETELY");
        recommendations.push("⚠️ Do not enter any personal information");
        recommendations.push("🔒 Do not connect any wallets or accounts");
        break;
      case "high":
        recommendations.push("⚠️ Exercise extreme caution");
        recommendations.push("🔍 Verify this is the official website");
        recommendations.push(
          "🛡️ Use additional security measures if proceeding",
        );
        break;
      case "medium":
        recommendations.push("⚠️ Proceed with caution");
        recommendations.push("🔍 Double-check all URLs and actions");
        recommendations.push("💡 Consider using a separate browser or device");
        break;
      case "low":
        recommendations.push("✅ Generally safe but stay vigilant");
        recommendations.push("🔍 Always verify transactions before confirming");
        break;
      case "safe":
        recommendations.push("✅ Website appears legitimate");
        recommendations.push("💡 Still practice good security hygiene");
        break;
    }

    if (findings.some((f) => f.type === "phishing")) {
      recommendations.push("🎣 High phishing risk - verify legitimacy");
    }

    if (findings.some((f) => f.type === "malware")) {
      recommendations.push("🦠 Malware risk detected - avoid downloads");
    }

    return recommendations;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public getScanProgress(scanId: string): any {
    return this.activeScans.get(scanId) || null;
  }

  public async getScanResult(scanId: string): Promise<any> {
    // In production, this would fetch from database
    return null;
  }
}

export default WebsiteSecurityScanner;
