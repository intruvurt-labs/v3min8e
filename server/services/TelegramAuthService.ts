interface TelegramBotConfig {
  botToken: string;
  groupId: string; // Chat ID of the main Telegram group
  channelId?: string; // Chat ID of the announcement channel
}

interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  is_bot: boolean;
  language_code?: string;
}

interface TelegramChatMember {
  user: TelegramUser;
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  until_date?: number;
  can_be_edited?: boolean;
  can_manage_chat?: boolean;
  can_change_info?: boolean;
  can_delete_messages?: boolean;
  can_invite_users?: boolean;
  can_restrict_members?: boolean;
  can_pin_messages?: boolean;
  can_promote_members?: boolean;
  can_manage_voice_chats?: boolean;
  can_manage_video_chats?: boolean;
  is_anonymous?: boolean;
}

interface MembershipVerificationResult {
  isMember: boolean;
  memberStatus?: string;
  joinedDate?: number;
  userData?: TelegramUser;
  error?: string;
}

interface BotVerificationResult {
  isValid: boolean;
  botInfo?: {
    id: number;
    username: string;
    first_name: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
  };
  error?: string;
}

export class TelegramAuthService {
  private config: TelegramBotConfig;

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      groupId: process.env.TELEGRAM_GROUP_ID || '@nimrevxyz', // Can be @username or chat_id
      channelId: process.env.TELEGRAM_CHANNEL_ID || '@nimrevxyz_announcements'
    };
  }

  /**
   * Make API call to Telegram Bot API
   */
  private async telegramApiCall(method: string, params: any = {}): Promise<any> {
    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/${method}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.description || 'Telegram API error');
      }

      return data.result;
    } catch (error) {
      console.error(`Telegram API call failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Verify bot token and get bot information
   */
  async verifyBotToken(token: string): Promise<BotVerificationResult> {
    try {
      // Validate token format
      const botTokenRegex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
      if (!botTokenRegex.test(token)) {
        return {
          isValid: false,
          error: 'Invalid bot token format'
        };
      }

      // Test bot token by calling getMe
      const url = `https://api.telegram.org/bot${token}/getMe`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.ok) {
        return {
          isValid: false,
          error: data.description || 'Bot token verification failed'
        };
      }

      const botInfo = data.result;

      return {
        isValid: true,
        botInfo: {
          id: botInfo.id,
          username: botInfo.username,
          first_name: botInfo.first_name,
          can_join_groups: botInfo.can_join_groups,
          can_read_all_group_messages: botInfo.can_read_all_group_messages,
          supports_inline_queries: botInfo.supports_inline_queries
        }
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Bot verification failed'
      };
    }
  }

  /**
   * Verify if user is a member of the main Telegram group
   */
  async verifyGroupMembership(userId: number): Promise<MembershipVerificationResult> {
    try {
      if (!this.config.botToken) {
        return {
          isMember: false,
          error: 'Telegram bot token not configured'
        };
      }

      // Get chat member information
      const memberData: TelegramChatMember = await this.telegramApiCall('getChatMember', {
        chat_id: this.config.groupId,
        user_id: userId
      });

      // Check membership status
      const activeMemberStatuses = ['creator', 'administrator', 'member'];
      const isMember = activeMemberStatuses.includes(memberData.status);

      return {
        isMember,
        memberStatus: memberData.status,
        userData: memberData.user,
        error: undefined
      };

    } catch (error) {
      // Handle specific Telegram errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('user not found') || errorMessage.includes('Bad Request: user not found')) {
        return {
          isMember: false,
          error: 'User not found in group'
        };
      }

      if (errorMessage.includes('chat not found')) {
        return {
          isMember: false,
          error: 'Telegram group not found or bot not added to group'
        };
      }

      console.error('Telegram group membership verification error:', error);
      return {
        isMember: false,
        error: errorMessage
      };
    }
  }

  /**
   * Verify if user is subscribed to the announcement channel
   */
  async verifyChannelSubscription(userId: number): Promise<MembershipVerificationResult> {
    try {
      if (!this.config.channelId) {
        return {
          isMember: false,
          error: 'Telegram channel not configured'
        };
      }

      const memberData: TelegramChatMember = await this.telegramApiCall('getChatMember', {
        chat_id: this.config.channelId,
        user_id: userId
      });

      const subscriberStatuses = ['creator', 'administrator', 'member'];
      const isSubscribed = subscriberStatuses.includes(memberData.status);

      return {
        isMember: isSubscribed,
        memberStatus: memberData.status,
        userData: memberData.user,
        error: undefined
      };

    } catch (error) {
      console.error('Telegram channel subscription verification error:', error);
      return {
        isMember: false,
        error: error instanceof Error ? error.message : 'Channel verification failed'
      };
    }
  }

  /**
   * Get user information from Telegram
   */
  async getUserInfo(userId: number): Promise<TelegramUser | null> {
    try {
      // Get user info through chat member API (requires the user to be in a chat with the bot)
      const memberData: TelegramChatMember = await this.telegramApiCall('getChatMember', {
        chat_id: this.config.groupId,
        user_id: userId
      });

      return memberData.user;

    } catch (error) {
      console.error('Failed to get Telegram user info:', error);
      return null;
    }
  }

  /**
   * Send verification message to user
   */
  async sendVerificationMessage(
    userId: number, 
    message: string, 
    replyMarkup?: any
  ): Promise<boolean> {
    try {
      await this.telegramApiCall('sendMessage', {
        chat_id: userId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      });

      return true;
    } catch (error) {
      console.error('Failed to send Telegram verification message:', error);
      return false;
    }
  }

  /**
   * Generate verification link for Telegram authentication
   */
  generateVerificationLink(botUsername: string, startParameter?: string): string {
    const baseUrl = `https://t.me/${botUsername}`;
    return startParameter ? `${baseUrl}?start=${startParameter}` : baseUrl;
  }

  /**
   * Verify telegram authentication data (from Telegram Login Widget)
   */
  verifyTelegramAuth(authData: any, botToken: string): boolean {
    try {
      const { hash, ...dataToCheck } = authData;
      
      // Create data check string
      const dataCheckArr = Object.keys(dataToCheck)
        .sort()
        .map(key => `${key}=${dataToCheck[key]}`);
      const dataCheckString = dataCheckArr.join('\n');

      // Create secret key
      const crypto = require('crypto');
      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      
      // Calculate hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Compare hashes
      return calculatedHash === hash;
    } catch (error) {
      console.error('Telegram auth verification error:', error);
      return false;
    }
  }

  /**
   * Get chat information
   */
  async getChatInfo(chatId: string): Promise<any> {
    try {
      return await this.telegramApiCall('getChat', {
        chat_id: chatId
      });
    } catch (error) {
      console.error('Failed to get chat info:', error);
      return null;
    }
  }

  /**
   * Get chat member count
   */
  async getChatMemberCount(chatId: string): Promise<number> {
    try {
      const count = await this.telegramApiCall('getChatMemberCount', {
        chat_id: chatId
      });
      return count;
    } catch (error) {
      console.error('Failed to get chat member count:', error);
      return 0;
    }
  }

  /**
   * Validate service configuration
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.config.botToken) {
        return { valid: false, error: 'Bot token not configured' };
      }

      // Test bot token
      const botVerification = await this.verifyBotToken(this.config.botToken);
      if (!botVerification.isValid) {
        return { valid: false, error: botVerification.error };
      }

      // Test group access
      if (this.config.groupId) {
        try {
          await this.getChatInfo(this.config.groupId);
        } catch (error) {
          return { 
            valid: false, 
            error: 'Bot cannot access the configured group. Make sure bot is added as admin.' 
          };
        }
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Configuration validation failed'
      };
    }
  }

  /**
   * Generate deep link for joining group
   */
  generateGroupJoinLink(): string {
    // Remove @ symbol if present
    const groupId = this.config.groupId.replace('@', '');
    return `https://t.me/${groupId}`;
  }

  /**
   * Generate invite link for the group (requires admin permissions)
   */
  async createGroupInviteLink(expireDate?: number, memberLimit?: number): Promise<string | null> {
    try {
      const params: any = { chat_id: this.config.groupId };
      
      if (expireDate) params.expire_date = expireDate;
      if (memberLimit) params.member_limit = memberLimit;

      const result = await this.telegramApiCall('createChatInviteLink', params);
      return result.invite_link;

    } catch (error) {
      console.error('Failed to create group invite link:', error);
      return null;
    }
  }
}

export const telegramAuthService = new TelegramAuthService();
export default TelegramAuthService;
