import axios from "axios";
import * as cheerio from "cheerio";
import { BlockchainType, SocialAnalysis } from "../../shared/nimrev-types";

export class SocialFootprintAnalyzer {
  private twitterBearerToken?: string;

  constructor() {
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
  }

  public async analyzeSocialFootprint(
    tokenAddress: string,
    blockchain: BlockchainType,
    tokenSymbol?: string,
    creatorAddress?: string,
  ): Promise<SocialAnalysis> {
    console.log(
      `🔍 Analyzing social footprint for ${tokenSymbol || tokenAddress}`,
    );

    const analysis: SocialAnalysis = {
      twitter_created: new Date().toISOString(),
      twitter_followers: 0,
      twitter_verified: false,
      telegram_members: 0,
      github_commits: 0,
      github_contributors: 0,
      domain_age_days: 0,
      social_red_flags: [],
      community_sentiment: "neutral",
      influencer_mentions: 0,
    };

    try {
      // 1. Search for Twitter presence
      await this.analyzeTwitterPresence(tokenSymbol, analysis);

      // 2. Search for Telegram groups
      await this.analyzeTelegramPresence(tokenSymbol, analysis);

      // 3. Search for GitHub repositories
      await this.analyzeGitHubPresence(tokenSymbol, creatorAddress, analysis);

      // 4. Search for website/domain
      await this.analyzeWebsitePresence(tokenSymbol, analysis);

      // 5. Analyze community sentiment
      await this.analyzeCommunutySentiment(tokenSymbol, analysis);

      // 6. Check for red flags
      this.identifyRedFlags(analysis);

      console.log(
        `✅ Social analysis completed for ${tokenSymbol}: ${analysis.social_red_flags.length} red flags`,
      );
      return analysis;
    } catch (error) {
      console.error("Social footprint analysis failed:", error);
      return analysis;
    }
  }

  private async analyzeTwitterPresence(
    tokenSymbol?: string,
    analysis: SocialAnalysis,
  ) {
    if (!tokenSymbol) return;

    try {
      // Search for Twitter account using multiple methods
      const queries = [
        `$${tokenSymbol}`,
        tokenSymbol,
        `${tokenSymbol} token`,
        `${tokenSymbol} crypto`,
      ];

      for (const query of queries) {
        const twitterData = await this.searchTwitter(query);
        if (twitterData) {
          analysis.twitter_handle = twitterData.username;
          analysis.twitter_followers = twitterData.followers;
          analysis.twitter_verified = twitterData.verified;
          analysis.twitter_created = twitterData.created;
          break;
        }
      }

      // If we found a Twitter account, analyze recent tweets
      if (analysis.twitter_handle) {
        const recentTweets = await this.getRecentTweets(
          analysis.twitter_handle,
        );
        this.analyzeTweetContent(recentTweets, analysis);
      }
    } catch (error) {
      console.error("Twitter analysis failed:", error);
    }
  }

  private async searchTwitter(query: string): Promise<any | null> {
    try {
      if (!this.twitterBearerToken) {
        return await this.scrapeTwitterSearch(query);
      }

      const response = await axios.get(
        "https://api.twitter.com/2/tweets/search/recent",
        {
          headers: {
            Authorization: `Bearer ${this.twitterBearerToken}`,
          },
          params: {
            query,
            "user.fields": "created_at,verified,public_metrics",
            "tweet.fields": "created_at,public_metrics",
          },
          timeout: 10000,
        },
      );

      if (response.data.data && response.data.includes?.users) {
        const user = response.data.includes.users[0];
        return {
          username: user.username,
          followers: user.public_metrics?.followers_count || 0,
          verified: user.verified || false,
          created: user.created_at,
        };
      }

      return null;
    } catch (error) {
      console.error("Twitter API search failed:", error);
      return null;
    }
  }

  private async scrapeTwitterSearch(query: string): Promise<any | null> {
    try {
      // Fallback scraping method (simplified)
      const searchUrl = `https://nitter.net/search?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const firstResult = $(".timeline-item").first();

      if (firstResult.length > 0) {
        const username = firstResult.find(".username").text().replace("@", "");
        const followers = this.parseFollowerCount(
          firstResult.find(".profile-stat").text(),
        );

        return {
          username,
          followers,
          verified: firstResult.find(".icon-ok").length > 0,
          created: new Date().toISOString(), // Approximate
        };
      }

      return null;
    } catch (error) {
      console.error("Twitter scraping failed:", error);
      return null;
    }
  }

  private async getRecentTweets(username: string): Promise<string[]> {
    try {
      if (!this.twitterBearerToken) {
        return [];
      }

      const response = await axios.get(
        `https://api.twitter.com/2/users/by/username/${username}/tweets`,
        {
          headers: {
            Authorization: `Bearer ${this.twitterBearerToken}`,
          },
          params: {
            max_results: 10,
            "tweet.fields": "created_at,text",
          },
          timeout: 10000,
        },
      );

      if (response.data.data) {
        return response.data.data.map((tweet: any) => tweet.text);
      }

      return [];
    } catch (error) {
      console.error("Failed to get recent tweets:", error);
      return [];
    }
  }

  private analyzeTweetContent(tweets: string[], analysis: SocialAnalysis) {
    const redFlagKeywords = [
      "moon",
      "lambo",
      "diamond hands",
      "ape",
      "fomo",
      "pump",
      "rocket",
      "millionaire",
      "easy money",
      "get rich",
      "guaranteed",
      "insider",
      "whale alert",
    ];

    const positiveKeywords = [
      "development",
      "roadmap",
      "partnership",
      "audit",
      "whitepaper",
      "utility",
      "use case",
      "team",
    ];

    let redFlagCount = 0;
    let positiveCount = 0;

    for (const tweet of tweets) {
      const lowerTweet = tweet.toLowerCase();

      for (const keyword of redFlagKeywords) {
        if (lowerTweet.includes(keyword)) {
          redFlagCount++;
        }
      }

      for (const keyword of positiveKeywords) {
        if (lowerTweet.includes(keyword)) {
          positiveCount++;
        }
      }
    }

    if (redFlagCount > positiveCount) {
      analysis.social_red_flags.push("excessive_hype_tweets");
    }

    if (tweets.length < 3) {
      analysis.social_red_flags.push("minimal_twitter_activity");
    }
  }

  private async analyzeTelegramPresence(
    tokenSymbol?: string,
    analysis: SocialAnalysis,
  ) {
    if (!tokenSymbol) return;

    try {
      // Search for Telegram groups (simplified)
      const telegramData = await this.searchTelegramGroups(tokenSymbol);

      if (telegramData) {
        analysis.telegram_group = telegramData.groupName;
        analysis.telegram_members = telegramData.memberCount;
      }
    } catch (error) {
      console.error("Telegram analysis failed:", error);
    }
  }

  private async searchTelegramGroups(tokenSymbol: string): Promise<any | null> {
    try {
      // Use Telegram group search APIs or scraping
      // This is a simplified implementation
      const searchQueries = [
        `${tokenSymbol} official`,
        `${tokenSymbol} token`,
        `${tokenSymbol} community`,
      ];

      // Mock implementation - in reality would search actual Telegram groups
      return {
        groupName: `${tokenSymbol} Official`,
        memberCount: Math.floor(Math.random() * 10000), // Placeholder
      };
    } catch (error) {
      console.error("Telegram search failed:", error);
      return null;
    }
  }

  private async analyzeGitHubPresence(
    tokenSymbol?: string,
    creatorAddress?: string,
    analysis: SocialAnalysis,
  ) {
    try {
      const searchQueries = [];

      if (tokenSymbol) {
        searchQueries.push(
          tokenSymbol,
          `${tokenSymbol}-token`,
          `${tokenSymbol}-contract`,
        );
      }

      if (creatorAddress) {
        searchQueries.push(creatorAddress);
      }

      for (const query of searchQueries) {
        const githubData = await this.searchGitHub(query);
        if (githubData) {
          analysis.github_repo = githubData.repoUrl;
          analysis.github_commits = githubData.commits;
          analysis.github_contributors = githubData.contributors;
          break;
        }
      }
    } catch (error) {
      console.error("GitHub analysis failed:", error);
    }
  }

  private async searchGitHub(query: string): Promise<any | null> {
    try {
      const response = await axios.get(
        "https://api.github.com/search/repositories",
        {
          params: {
            q: query,
            sort: "updated",
            order: "desc",
          },
          timeout: 10000,
        },
      );

      if (response.data.items && response.data.items.length > 0) {
        const repo = response.data.items[0];

        // Get detailed repo info
        const repoResponse = await axios.get(repo.url, { timeout: 5000 });
        const contributorsResponse = await axios.get(
          `${repo.url}/contributors`,
          { timeout: 5000 },
        );

        return {
          repoUrl: repo.html_url,
          commits: repoResponse.data.size || 0, // Approximate
          contributors: contributorsResponse.data
            ? contributorsResponse.data.length
            : 0,
        };
      }

      return null;
    } catch (error) {
      console.error("GitHub search failed:", error);
      return null;
    }
  }

  private async analyzeWebsitePresence(
    tokenSymbol?: string,
    analysis: SocialAnalysis,
  ) {
    if (!tokenSymbol) return;

    try {
      // Search for official website
      const websiteUrl = await this.findOfficialWebsite(tokenSymbol);

      if (websiteUrl) {
        analysis.website_domain = websiteUrl;
        analysis.domain_age_days = await this.getDomainAge(websiteUrl);
      }
    } catch (error) {
      console.error("Website analysis failed:", error);
    }
  }

  private async findOfficialWebsite(
    tokenSymbol: string,
  ): Promise<string | undefined> {
    try {
      // Common website patterns
      const possibleDomains = [
        `${tokenSymbol.toLowerCase()}.com`,
        `${tokenSymbol.toLowerCase()}.io`,
        `${tokenSymbol.toLowerCase()}.org`,
        `${tokenSymbol.toLowerCase()}token.com`,
        `${tokenSymbol.toLowerCase()}coin.com`,
      ];

      for (const domain of possibleDomains) {
        try {
          const response = await axios.head(`https://${domain}`, {
            timeout: 5000,
            maxRedirects: 5,
          });

          if (response.status === 200) {
            return domain;
          }
        } catch {
          // Domain doesn't exist or not accessible
        }
      }

      return undefined;
    } catch (error) {
      console.error("Website search failed:", error);
      return undefined;
    }
  }

  private async getDomainAge(domain: string): Promise<number> {
    try {
      // Use WHOIS API to get domain registration date
      const response = await axios.get(`https://api.whois.vu/?q=${domain}`, {
        timeout: 10000,
      });

      if (response.data && response.data.created_date) {
        const createdDate = new Date(response.data.created_date);
        const now = new Date();
        return Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      return 0;
    } catch (error) {
      console.error("Domain age lookup failed:", error);
      return 0;
    }
  }

  private async analyzeCommunutySentiment(
    tokenSymbol?: string,
    analysis: SocialAnalysis,
  ) {
    if (!tokenSymbol) return;

    try {
      // Analyze sentiment from various sources
      const sentimentSources = [
        await this.analyzeRedditSentiment(tokenSymbol),
        await this.analyzeCoinGeckoSentiment(tokenSymbol),
        await this.analyzeCryptoTwitterSentiment(tokenSymbol),
      ];

      const validSentiments = sentimentSources.filter((s) => s !== null);

      if (validSentiments.length > 0) {
        const avgSentiment =
          validSentiments.reduce((sum, s) => sum + s!, 0) /
          validSentiments.length;

        if (avgSentiment > 0.6) {
          analysis.community_sentiment = "positive";
        } else if (avgSentiment < 0.4) {
          analysis.community_sentiment = "negative";
        } else {
          analysis.community_sentiment = "neutral";
        }
      }
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
    }
  }

  private async analyzeRedditSentiment(
    tokenSymbol: string,
  ): Promise<number | null> {
    try {
      const response = await axios.get(
        `https://www.reddit.com/search.json?q=${tokenSymbol}&sort=relevance&t=week`,
        {
          timeout: 10000,
          headers: {
            "User-Agent": "NimRevScanner/1.0",
          },
        },
      );

      if (response.data.data?.children) {
        const posts = response.data.data.children;
        let positiveCount = 0;
        let negativeCount = 0;

        for (const post of posts.slice(0, 10)) {
          const title = post.data.title.toLowerCase();
          const score = post.data.score;

          if (
            score > 10 &&
            (title.includes("bullish") ||
              title.includes("good") ||
              title.includes("pump"))
          ) {
            positiveCount++;
          } else if (
            score < -5 ||
            title.includes("scam") ||
            title.includes("rug") ||
            title.includes("dump")
          ) {
            negativeCount++;
          }
        }

        if (positiveCount + negativeCount === 0) return null;
        return positiveCount / (positiveCount + negativeCount);
      }

      return null;
    } catch (error) {
      console.error("Reddit sentiment analysis failed:", error);
      return null;
    }
  }

  private async analyzeCoinGeckoSentiment(
    tokenSymbol: string,
  ): Promise<number | null> {
    try {
      // Search CoinGecko for token and get sentiment data
      // This is simplified - would use actual CoinGecko API
      return 0.5; // Neutral sentiment placeholder
    } catch (error) {
      console.error("CoinGecko sentiment analysis failed:", error);
      return null;
    }
  }

  private async analyzeCryptoTwitterSentiment(
    tokenSymbol: string,
  ): Promise<number | null> {
    try {
      // Analyze crypto Twitter sentiment using AI/ML models
      // This would integrate with sentiment analysis services
      return 0.5; // Neutral sentiment placeholder
    } catch (error) {
      console.error("Crypto Twitter sentiment analysis failed:", error);
      return null;
    }
  }

  private identifyRedFlags(analysis: SocialAnalysis) {
    // Check for burner/throwaway accounts
    if (analysis.twitter_handle) {
      const accountAgeMonths =
        (Date.now() - new Date(analysis.twitter_created).getTime()) /
        (1000 * 60 * 60 * 24 * 30);

      if (accountAgeMonths < 1) {
        analysis.social_red_flags.push("new_twitter_account");
      }

      if (analysis.twitter_followers < 100) {
        analysis.social_red_flags.push("low_twitter_followers");
      }

      if (!analysis.twitter_verified && analysis.twitter_followers > 10000) {
        analysis.social_red_flags.push("unverified_large_account");
      }
    } else {
      analysis.social_red_flags.push("no_twitter_presence");
    }

    // Check GitHub presence
    if (!analysis.github_repo) {
      analysis.social_red_flags.push("no_github_repository");
    } else if (analysis.github_commits < 10) {
      analysis.social_red_flags.push("minimal_development_activity");
    }

    // Check website
    if (!analysis.website_domain) {
      analysis.social_red_flags.push("no_official_website");
    } else if (analysis.domain_age_days < 30) {
      analysis.social_red_flags.push("very_new_domain");
    }

    // Check Telegram community
    if (analysis.telegram_members < 100) {
      analysis.social_red_flags.push("small_community");
    }

    // Check overall social presence
    const socialPresenceCount = [
      analysis.twitter_handle,
      analysis.github_repo,
      analysis.website_domain,
      analysis.telegram_group,
    ].filter(Boolean).length;

    if (socialPresenceCount < 2) {
      analysis.social_red_flags.push("minimal_social_presence");
    }
  }

  private parseFollowerCount(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)\s*([kmb]?)/i);
    if (!match) return 0;

    const number = parseFloat(match[1]);
    const suffix = match[2].toLowerCase();

    switch (suffix) {
      case "k":
        return Math.floor(number * 1000);
      case "m":
        return Math.floor(number * 1000000);
      case "b":
        return Math.floor(number * 1000000000);
      default:
        return Math.floor(number);
    }
  }
}
