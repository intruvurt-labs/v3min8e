import { TwitterApi } from 'twitter-api-v2';

interface TwitterAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface TwitterUserData {
  id: string;
  username: string;
  name: string;
  followers_count: number;
  following_count: number;
  verified: boolean;
}

interface FollowVerificationResult {
  isFollowing: boolean;
  userData: TwitterUserData | null;
  error?: string;
}

export class TwitterAuthService {
  private config: TwitterAuthConfig;
  private twitterClient: TwitterApi | null = null;

  constructor() {
    this.config = {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      callbackUrl: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/auth/twitter/callback'
    };
  }

  private getAppClient(): TwitterApi {
    if (!this.twitterClient) {
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Twitter API credentials not configured');
      }
      this.twitterClient = new TwitterApi({
        appKey: this.config.clientId,
        appSecret: this.config.clientSecret,
      });
    }
    return this.twitterClient;
  }

  /**
   * Generate OAuth authorization URL for Twitter login
   */
  async generateAuthUrl(state?: string): Promise<{ url: string; oauth_token: string; oauth_token_secret: string }> {
    try {
      const authLink = await this.twitterClient.generateAuthLink(this.config.callbackUrl, { 
        linkMode: 'authorize',
        forceLogin: false 
      });

      return {
        url: authLink.url,
        oauth_token: authLink.oauth_token,
        oauth_token_secret: authLink.oauth_token_secret
      };
    } catch (error) {
      console.error('Failed to generate Twitter auth URL:', error);
      throw new Error('Failed to generate Twitter authorization URL');
    }
  }

  /**
   * Handle OAuth callback and get user access tokens
   */
  async handleCallback(
    oauth_token: string, 
    oauth_verifier: string, 
    oauth_token_secret: string
  ): Promise<{ accessToken: string; accessSecret: string; user: TwitterUserData }> {
    try {
      const loginResult = await this.twitterClient.login(oauth_verifier);
      
      const user = await loginResult.client.v2.me({
        'user.fields': ['public_metrics', 'verified']
      });

      const userData: TwitterUserData = {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
        followers_count: user.data.public_metrics?.followers_count || 0,
        following_count: user.data.public_metrics?.following_count || 0,
        verified: user.data.verified || false
      };

      return {
        accessToken: loginResult.accessToken,
        accessSecret: loginResult.accessSecret,
        user: userData
      };
    } catch (error) {
      console.error('Twitter OAuth callback error:', error);
      throw new Error('Failed to complete Twitter authentication');
    }
  }

  /**
   * Verify if user follows a specific Twitter account
   */
  async verifyFollowing(
    userAccessToken: string,
    userAccessSecret: string,
    targetUsername: string = 'nimrevxyz'
  ): Promise<FollowVerificationResult> {
    try {
      // Create authenticated client for the user
      const userClient = new TwitterApi({
        appKey: this.config.clientId,
        appSecret: this.config.clientSecret,
        accessToken: userAccessToken,
        accessSecret: userAccessSecret
      });

      // Get target user ID
      const targetUser = await userClient.v2.userByUsername(targetUsername);
      if (!targetUser.data) {
        return {
          isFollowing: false,
          userData: null,
          error: `Target user @${targetUsername} not found`
        };
      }

      // Get current user data
      const currentUser = await userClient.v2.me({
        'user.fields': ['public_metrics', 'verified']
      });

      const userData: TwitterUserData = {
        id: currentUser.data.id,
        username: currentUser.data.username,
        name: currentUser.data.name,
        followers_count: currentUser.data.public_metrics?.followers_count || 0,
        following_count: currentUser.data.public_metrics?.following_count || 0,
        verified: currentUser.data.verified || false
      };

      // Check if user follows target
      const followingResponse = await userClient.v2.following(currentUser.data.id, {
        max_results: 1000
      });

      const isFollowing = followingResponse.data?.some(
        followedUser => followedUser.id === targetUser.data.id
      ) || false;

      return {
        isFollowing,
        userData,
        error: undefined
      };

    } catch (error) {
      console.error('Twitter follow verification error:', error);
      return {
        isFollowing: false,
        userData: null,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Verify user engagement (likes, retweets, etc.)
   */
  async verifyEngagement(
    userAccessToken: string,
    userAccessSecret: string,
    tweetId: string
  ): Promise<{ liked: boolean; retweeted: boolean; error?: string }> {
    try {
      const userClient = new TwitterApi({
        appKey: this.config.clientId,
        appSecret: this.config.clientSecret,
        accessToken: userAccessToken,
        accessSecret: userAccessSecret
      });

      const user = await userClient.v2.me();
      
      // Check if user liked the tweet
      const likedTweets = await userClient.v2.userLikedTweets(user.data.id, {
        max_results: 100
      });

      const liked = likedTweets.data?.some(tweet => tweet.id === tweetId) || false;

      // Note: Retweet checking requires additional API calls and permissions
      // For now, we'll focus on follow verification
      return {
        liked,
        retweeted: false, // Placeholder - requires additional implementation
        error: undefined
      };

    } catch (error) {
      console.error('Twitter engagement verification error:', error);
      return {
        liked: false,
        retweeted: false,
        error: error instanceof Error ? error.message : 'Engagement verification failed'
      };
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(
    userAccessToken: string,
    userAccessSecret: string
  ): Promise<TwitterUserData | null> {
    try {
      const userClient = new TwitterApi({
        appKey: this.config.clientId,
        appSecret: this.config.clientSecret,
        accessToken: userAccessToken,
        accessSecret: userAccessSecret
      });

      const user = await userClient.v2.me({
        'user.fields': ['public_metrics', 'verified']
      });

      return {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
        followers_count: user.data.public_metrics?.followers_count || 0,
        following_count: user.data.public_metrics?.following_count || 0,
        verified: user.data.verified || false
      };

    } catch (error) {
      console.error('Failed to get Twitter user profile:', error);
      return null;
    }
  }

  /**
   * Validate Twitter credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      if (!this.config.clientId || !this.config.clientSecret) {
        console.error('Twitter API credentials not configured');
        return false;
      }

      // Test API connection
      await this.twitterClient.v2.me();
      return true;
    } catch (error) {
      console.error('Twitter API validation failed:', error);
      return false;
    }
  }
}

export const twitterAuthService = new TwitterAuthService();
export default TwitterAuthService;
