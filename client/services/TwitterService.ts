interface TwitterUser {
  id: string;
  username: string;
  name: string;
  verified: boolean;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author?: TwitterUser;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string }>;
    urls?: Array<{ expanded_url: string; display_url: string }>;
    mentions?: Array<{ username: string }>;
  };
  referenced_tweets?: Array<{
    type: "retweeted" | "quoted" | "replied_to";
    id: string;
  }>;
  context_annotations?: Array<{
    domain: { name: string };
    entity: { name: string };
  }>;
}

interface CryptoFeedItem {
  id: string;
  type:
    | "launch"
    | "ico"
    | "presale"
    | "airdrop"
    | "security_risk"
    | "hack"
    | "alpha"
    | "warning";
  content: string;
  author: {
    username: string;
    name: string;
    verified: boolean;
    avatar: string;
    credibilityScore: number;
  };
  timestamp: string;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
  relevanceScore: number;
  tags: string[];
  urls: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export class TwitterService {
  private apiKey: string;
  private baseUrl = "/api/twitter"; // Proxy through our backend

  // Verified crypto intelligence accounts
  private credibleSources = [
    {
      username: "DefiSafety",
      name: "DeFi Safety",
      credibilityScore: 95,
      category: "security",
    },
    {
      username: "PeckShieldAlert",
      name: "PeckShield Alert",
      credibilityScore: 98,
      category: "security",
    },
    {
      username: "CertiKAlert",
      name: "CertiK Alert",
      credibilityScore: 96,
      category: "security",
    },
    {
      username: "zachxbt",
      name: "ZachXBT",
      credibilityScore: 94,
      category: "investigations",
    },
    {
      username: "bantg",
      name: "banteg",
      credibilityScore: 92,
      category: "defi",
    },
    {
      username: "AndreCronjeTech",
      name: "Andre Cronje",
      credibilityScore: 90,
      category: "development",
    },
    {
      username: "RugDocIO",
      name: "RugDoc",
      credibilityScore: 93,
      category: "audits",
    },
    {
      username: "SlowMist_Team",
      name: "SlowMist",
      credibilityScore: 95,
      category: "security",
    },
    {
      username: "immunefi",
      name: "Immunefi",
      credibilityScore: 94,
      category: "bug_bounty",
    },
    {
      username: "Mudit__Gupta",
      name: "Mudit Gupta",
      credibilityScore: 91,
      category: "security",
    },
    {
      username: "samczsun",
      name: "samczsun",
      credibilityScore: 97,
      category: "security",
    },
    {
      username: "FrankResearcher",
      name: "Frank Researcher",
      credibilityScore: 89,
      category: "research",
    },
    {
      username: "officer_cia",
      name: "Officer CIA",
      credibilityScore: 88,
      category: "intelligence",
    },
    {
      username: "defiprime",
      name: "DeFi Prime",
      credibilityScore: 85,
      category: "news",
    },
    {
      username: "DeFiPulse",
      name: "DeFi Pulse",
      credibilityScore: 87,
      category: "analytics",
    },
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TWITTER_API_KEY || "";
  }

  async getCryptoIntelligenceFeed(
    limit: number = 50,
  ): Promise<CryptoFeedItem[]> {
    try {
      // In production, this would make actual Twitter API calls
      // For now, simulate realistic crypto intelligence feed
      return this.generateRealisticCryptoFeed(limit);
    } catch (error) {
      console.error("Failed to fetch Twitter crypto feed:", error);
      return this.generateRealisticCryptoFeed(Math.min(limit, 20));
    }
  }

  private async generateRealisticCryptoFeed(
    limit: number,
  ): Promise<CryptoFeedItem[]> {
    const feedItems: CryptoFeedItem[] = [];

    const contentTemplates = {
      security_risk: [
        "🚨 CRITICAL: {token} contract has unlimited mint function. Avoid immediately. Contract: {address}",
        "⚠️ WARNING: {protocol} shows signs of rugpull preparation. Liquidity not locked. BE CAREFUL.",
        "🔴 ALERT: Honeypot detected on {network}. Token {token} allows buys but blocks sells.",
        "🚨 EXPLOIT: {protocol} flash loan attack in progress. ${}M drained. Avoid all interactions.",
        "⚠️ PHISHING: Fake {protocol} website detected at {url}. DO NOT CONNECT WALLET.",
      ],
      hack: [
        "🔓 BREACH: {protocol} exploited for ${}M. Attacker used reentrancy vulnerability in contract {address}",
        "💥 HACK: {exchange} reports security incident. User funds may be at risk. Withdraw immediately.",
        "🏴‍☠️ EXPLOIT: {protocol} bridge hacked. ${}M stolen. Cross-chain transfers halted.",
        "🚨 URGENT: {protocol} governance attack. Malicious proposal executed. Funds at risk.",
      ],
      launch: [
        "🚀 NEW: {token} launching on {network}. Audited by {auditor}. Fair launch in {}h.",
        "📊 LAUNCH: {protocol} goes live on {network}. TVL already at ${}M. No VC backing.",
        "✨ ALPHA: {token} stealth launch detected. Low mcap, high potential. DYOR.",
        "🎯 CONFIRMED: {protocol} launching with {} tokenomics. Whitelist open.",
      ],
      ico: [
        "💰 ICO: {project} public sale starting {}. Hard cap ${}M. Vesting: {} months.",
        "🔥 PRESALE: {token} private round. ${}M raised. Public sale {}.",
        "💎 SEED: {protocol} raising ${}M at {} valuation. Tier 1 VCs involved.",
      ],
      airdrop: [
        "🪂 AIRDROP: {protocol} confirmed airdrop for early users. Snapshot {}.",
        "💸 CLAIM: {token} airdrop live. {} tokens per eligible wallet.",
        "🎁 SURPRISE: {protocol} retroactive airdrop. Check eligibility now.",
      ],
      alpha: [
        "💎 ALPHA: Whales accumulating {token}. {} wallets bought >${}k in 24h.",
        "📈 SIGNAL: {token} unusual volume spike. {} increase. Something brewing.",
        "🔍 INSIGHT: {protocol} partnership announcement incoming. Insider accumulation detected.",
        "⚡ MOMENTUM: {token} breaking key resistance. Next target ${}.",
      ],
    };

    const networks = [
      "Ethereum",
      "Solana",
      "BSC",
      "Polygon",
      "Arbitrum",
      "Avalanche",
      "Base",
    ];
    const tokens = [
      "ALPHA",
      "BETA",
      "GAMMA",
      "DELTA",
      "OMEGA",
      "SIGMA",
      "PHI",
      "PSI",
    ];
    const protocols = [
      "DexProtocol",
      "YieldFarm",
      "LendingDAO",
      "BridgeVault",
      "SwapRouter",
    ];

    for (let i = 0; i < limit; i++) {
      const source =
        this.credibleSources[
          Math.floor(Math.random() * this.credibleSources.length)
        ];
      const types = Object.keys(contentTemplates) as Array<
        keyof typeof contentTemplates
      >;
      const type = types[Math.floor(Math.random() * types.length)];

      const templates = contentTemplates[type];
      let content = templates[Math.floor(Math.random() * templates.length)];

      // Replace placeholders with realistic data
      content = content
        .replace(/{token}/g, tokens[Math.floor(Math.random() * tokens.length)])
        .replace(
          /{protocol}/g,
          protocols[Math.floor(Math.random() * protocols.length)],
        )
        .replace(
          /{network}/g,
          networks[Math.floor(Math.random() * networks.length)],
        )
        .replace(/{address}/g, this.generateEthAddress())
        .replace(
          /{url}/g,
          `fake-${protocols[Math.floor(Math.random() * protocols.length)].toLowerCase()}.com`,
        )
        .replace(/{auditor}/g, "CertiK")
        .replace(/{\}/g, () => String(Math.floor(Math.random() * 100) + 1));

      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(
        Date.now() - hoursAgo * 60 * 60 * 1000,
      ).toISOString();

      feedItems.push({
        id: `tweet_${Date.now()}_${i}`,
        type: type as CryptoFeedItem["type"],
        content,
        author: {
          username: source.username,
          name: source.name,
          verified: true,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${source.username}`,
          credibilityScore: source.credibilityScore,
        },
        timestamp,
        engagement: {
          likes: Math.floor(Math.random() * 1000) + 50,
          retweets: Math.floor(Math.random() * 500) + 10,
          replies: Math.floor(Math.random() * 200) + 5,
        },
        relevanceScore: Math.floor(Math.random() * 30) + 70,
        tags: this.extractTags(content),
        urls: this.extractUrls(content),
        riskLevel: this.determineRiskLevel(type, content),
      });
    }

    // Sort by timestamp (newest first) and relevance
    return feedItems.sort((a, b) => {
      const timeScore =
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      const relevanceScore = (b.relevanceScore - a.relevanceScore) * 1000;
      return timeScore + relevanceScore;
    });
  }

  private generateEthAddress(): string {
    return (
      "0x" +
      Array.from(
        { length: 40 },
        () => "0123456789abcdef"[Math.floor(Math.random() * 16)],
      ).join("")
    );
  }

  private extractTags(content: string): string[] {
    const tags = [];
    if (content.includes("CRITICAL") || content.includes("URGENT"))
      tags.push("critical");
    if (content.includes("HACK") || content.includes("EXPLOIT"))
      tags.push("security");
    if (content.includes("LAUNCH") || content.includes("NEW"))
      tags.push("launch");
    if (content.includes("ALPHA") || content.includes("SIGNAL"))
      tags.push("alpha");
    if (content.includes("AIRDROP")) tags.push("airdrop");
    if (content.includes("ICO") || content.includes("PRESALE"))
      tags.push("funding");
    return tags;
  }

  private extractUrls(content: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return content.match(urlRegex) || [];
  }

  private determineRiskLevel(
    type: string,
    content: string,
  ): "low" | "medium" | "high" | "critical" {
    if (type === "security_risk" || type === "hack") {
      if (content.includes("CRITICAL") || content.includes("EXPLOIT"))
        return "critical";
      if (content.includes("WARNING") || content.includes("BREACH"))
        return "high";
      return "medium";
    }
    if (type === "launch" || type === "ico") return "medium";
    if (type === "airdrop" || type === "alpha") return "low";
    return "low";
  }

  async getAccountCredibility(username: string): Promise<number> {
    const source = this.credibleSources.find((s) => s.username === username);
    return source?.credibilityScore || 0;
  }

  async isVerifiedSource(username: string): Promise<boolean> {
    return this.credibleSources.some((s) => s.username === username);
  }

  getCredibleSources(): typeof this.credibleSources {
    return this.credibleSources;
  }
}

export const twitterService = new TwitterService();
export default twitterService;
