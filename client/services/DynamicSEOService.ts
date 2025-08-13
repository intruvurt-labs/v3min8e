/**
 * Dynamic SEO Service
 * Automatically updates meta tags, keywords, and structured data based on user search patterns
 */

interface SEOKeyword {
  keyword: string;
  count: number;
  lastUsed: Date;
  category:
    | "security"
    | "blockchain"
    | "crypto"
    | "defi"
    | "audit"
    | "analysis";
  priority: number;
}

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  structuredData?: any;
}

export class DynamicSEOService {
  private static instance: DynamicSEOService;
  private keywords: Map<string, SEOKeyword> = new Map();
  private searchPatterns: string[] = [];
  private baseKeywords = [
    "blockchain security",
    "smart contract audit",
    "crypto security",
    "rug pull detection",
    "defi analysis",
    "solana security",
    "ethereum audit",
    "cryptocurrency scanner",
    "threat intelligence",
    "web3 security",
  ];

  private constructor() {
    this.initializeKeywords();
    this.loadSearchHistory();
  }

  static getInstance(): DynamicSEOService {
    if (!DynamicSEOService.instance) {
      DynamicSEOService.instance = new DynamicSEOService();
    }
    return DynamicSEOService.instance;
  }

  private initializeKeywords() {
    this.baseKeywords.forEach((keyword) => {
      this.keywords.set(keyword, {
        keyword,
        count: 10, // Base priority
        lastUsed: new Date(),
        category: this.categorizeKeyword(keyword),
        priority: 10,
      });
    });
  }

  private categorizeKeyword(keyword: string): SEOKeyword["category"] {
    if (keyword.includes("security") || keyword.includes("audit"))
      return "security";
    if (
      keyword.includes("blockchain") ||
      keyword.includes("solana") ||
      keyword.includes("ethereum")
    )
      return "blockchain";
    if (keyword.includes("crypto") || keyword.includes("cryptocurrency"))
      return "crypto";
    if (keyword.includes("defi")) return "defi";
    if (keyword.includes("audit")) return "audit";
    return "analysis";
  }

  private loadSearchHistory() {
    try {
      const stored = localStorage.getItem("nimrev_search_patterns");
      if (stored) {
        this.searchPatterns = JSON.parse(stored);
        this.updateKeywordsFromPatterns();
      }
    } catch (error) {
      console.warn("Failed to load search history:", error);
    }
  }

  private saveSearchHistory() {
    try {
      localStorage.setItem(
        "nimrev_search_patterns",
        JSON.stringify(this.searchPatterns.slice(-100)),
      );
    } catch (error) {
      console.warn("Failed to save search history:", error);
    }
  }

  private updateKeywordsFromPatterns() {
    this.searchPatterns.forEach((pattern) => {
      const words = this.extractKeywords(pattern);
      words.forEach((word) => {
        const existing = this.keywords.get(word);
        if (existing) {
          existing.count += 1;
          existing.lastUsed = new Date();
          existing.priority = Math.min(existing.priority + 0.5, 100);
        } else {
          this.keywords.set(word, {
            keyword: word,
            count: 1,
            lastUsed: new Date(),
            category: this.categorizeKeyword(word),
            priority: 1,
          });
        }
      });
    });
  }

  private extractKeywords(text: string): string[] {
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = cleanText.split(" ");
    const keywords: string[] = [];

    // Single words
    words.forEach((word) => {
      if (word.length > 3 && this.isRelevantKeyword(word)) {
        keywords.push(word);
      }
    });

    // Two-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (this.isRelevantKeyword(phrase)) {
        keywords.push(phrase);
      }
    }

    return [...new Set(keywords)];
  }

  private isRelevantKeyword(keyword: string): boolean {
    const relevantTerms = [
      "security",
      "audit",
      "blockchain",
      "crypto",
      "defi",
      "smart",
      "contract",
      "solana",
      "ethereum",
      "rug",
      "pull",
      "honeypot",
      "scanner",
      "analysis",
      "threat",
      "intelligence",
      "verification",
      "token",
      "vulnerability",
      "exploit",
      "hack",
      "scam",
      "safety",
      "check",
      "verify",
      "legitimate",
    ];

    return relevantTerms.some((term) => keyword.includes(term));
  }

  /**
   * Track user search/interaction patterns
   */
  trackSearchPattern(query: string) {
    if (query && query.length > 2) {
      this.searchPatterns.push(query);
      this.updateKeywordsFromPatterns();
      this.saveSearchHistory();
    }
  }

  /**
   * Get top keywords based on usage and recency
   */
  getTopKeywords(limit: number = 20): string[] {
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;

    return Array.from(this.keywords.values())
      .map((keyword) => ({
        ...keyword,
        // Boost score for recent usage
        score:
          keyword.priority +
          keyword.count * 0.5 +
          ((dayInMs - (now.getTime() - keyword.lastUsed.getTime())) / dayInMs) *
            10,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((k) => k.keyword);
  }

  /**
   * Generate dynamic SEO data for a page
   */
  generateSEOData(pageName: string, context?: any): SEOData {
    const topKeywords = this.getTopKeywords(15);
    const pageKeywords = this.getPageSpecificKeywords(pageName);
    const allKeywords = [...new Set([...pageKeywords, ...topKeywords])];

    const baseData = this.getBasePageData(pageName);

    return {
      ...baseData,
      keywords: allKeywords,
      structuredData: this.generateStructuredData(pageName, context),
    };
  }

  private getPageSpecificKeywords(pageName: string): string[] {
    const pageKeywordMap: Record<string, string[]> = {
      index: [
        "blockchain security platform",
        "crypto audit tool",
        "web3 safety",
      ],
      grid: ["threat scanner", "blockchain monitor", "security analysis"],
      audit: ["smart contract audit", "security review", "code analysis"],
      staking: ["token staking", "defi rewards", "yield farming"],
      blogs: ["security research", "threat intelligence", "crypto analysis"],
      technology: [
        "blockchain technology",
        "security innovation",
        "crypto tech",
      ],
      community: ["crypto community", "blockchain users", "web3 network"],
    };

    return pageKeywordMap[pageName] || [];
  }

  private getBasePageData(
    pageName: string,
  ): Omit<SEOData, "keywords" | "structuredData"> {
    const baseDataMap: Record<string, any> = {
      index: {
        title:
          "NimRev - Advanced Blockchain Security | Real-Time Threat Detection",
        description:
          "Advanced blockchain security platform with real-time threat detection, smart contract auditing, and transparent intelligence. Protect your crypto investments with NimRev.",
        ogTitle: "NimRev - Advanced Blockchain Security Platform",
        ogDescription:
          "Real-time blockchain threat detection and smart contract security auditing",
        ogImage: "https://nimrev.xyz/og-image.png",
      },
      grid: {
        title: "NimRev Grid - Real-Time Blockchain Security Scanner",
        description:
          "Scan blockchain transactions, detect threats, and verify smart contracts in real-time with NimRev Grid security platform.",
        ogTitle: "NimRev Grid - Blockchain Security Scanner",
        ogDescription:
          "Real-time blockchain security scanning and threat detection",
      },
      audit: {
        title: "Smart Contract Security Audit | NimRev AI Analysis",
        description:
          "Professional smart contract security audits powered by AI. Comprehensive vulnerability analysis for Solana, Ethereum, and other blockchains.",
        ogTitle: "Smart Contract Security Audit Service",
        ogDescription:
          "AI-powered smart contract security audits and vulnerability analysis",
      },
      blogs: {
        title: "Blockchain Security Intelligence | NimRev Research",
        description:
          "Latest blockchain security research, threat analysis, and crypto safety insights from NimRev security experts.",
        ogTitle: "Blockchain Security Research & Intelligence",
        ogDescription:
          "Latest security research and threat intelligence for blockchain and crypto",
      },
    };

    return (
      baseDataMap[pageName] || {
        title: "NimRev - Blockchain Security Platform",
        description:
          "Advanced blockchain security tools and threat detection for the crypto ecosystem.",
        ogTitle: "NimRev Security Platform",
        ogDescription: "Blockchain security and threat detection tools",
      }
    );
  }

  private generateStructuredData(pageName: string, context?: any) {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "NimRev",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "1247",
      },
    };

    if (pageName === "blogs") {
      return {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "NimRev Security Intelligence",
        description: "Blockchain security research and threat intelligence",
        publisher: {
          "@type": "Organization",
          name: "NimRev",
          logo: "https://nimrev.xyz/logo.png",
        },
      };
    }

    return baseSchema;
  }

  /**
   * Update page meta tags dynamically
   */
  updatePageMeta(seoData: SEOData) {
    // Update title
    document.title = seoData.title;

    // Update meta description
    this.updateMetaTag("description", seoData.description);

    // Update keywords
    this.updateMetaTag("keywords", seoData.keywords.join(", "));

    // Update Open Graph tags
    if (seoData.ogTitle) {
      this.updateMetaTag("og:title", seoData.ogTitle, "property");
    }
    if (seoData.ogDescription) {
      this.updateMetaTag("og:description", seoData.ogDescription, "property");
    }
    if (seoData.ogImage) {
      this.updateMetaTag("og:image", seoData.ogImage, "property");
    }

    // Update structured data
    if (seoData.structuredData) {
      this.updateStructuredData(seoData.structuredData);
    }
  }

  private updateMetaTag(
    name: string,
    content: string,
    attribute: string = "name",
  ) {
    let meta = document.querySelector(
      `meta[${attribute}="${name}"]`,
    ) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }

    meta.content = content;
  }

  private updateStructuredData(data: any) {
    // Remove existing structured data
    const existing = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (existing) {
      existing.remove();
    }

    // Add new structured data
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Initialize SEO for a page
   */
  initializePageSEO(pageName: string, context?: any) {
    const seoData = this.generateSEOData(pageName, context);
    this.updatePageMeta(seoData);
  }

  /**
   * Get analytics data about keyword performance
   */
  getKeywordAnalytics() {
    const keywords = Array.from(this.keywords.values());
    const totalSearches = this.searchPatterns.length;

    return {
      totalKeywords: keywords.length,
      totalSearches,
      topKeywords: keywords
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((k) => ({
          keyword: k.keyword,
          count: k.count,
          category: k.category,
        })),
      categoryBreakdown: keywords.reduce(
        (acc, k) => {
          acc[k.category] = (acc[k.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}

// Export singleton instance
export const dynamicSEO = DynamicSEOService.getInstance();
