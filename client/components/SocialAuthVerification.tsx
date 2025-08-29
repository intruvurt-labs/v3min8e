import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Twitter,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Shield,
  Users,
  Bot,
  ArrowRight,
  Copy
} from 'lucide-react';

interface SocialAuthVerificationProps {
  userId: string;
  taskId: string;
  platform: 'twitter' | 'telegram';
  onVerificationComplete: (success: boolean, data?: any) => void;
  onVerificationStart?: () => void;
}

interface VerificationState {
  status: 'idle' | 'authenticating' | 'verifying' | 'completed' | 'failed';
  data?: any;
  error?: string;
}

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function SocialAuthVerification({
  userId,
  taskId,
  platform,
  onVerificationComplete,
  onVerificationStart
}: SocialAuthVerificationProps) {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'idle'
  });
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const [telegramUserId, setTelegramUserId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Handle Twitter OAuth flow
  const handleTwitterAuth = async () => {
    try {
      setVerificationState({ status: 'authenticating' });
      onVerificationStart?.();

      // Request Twitter OAuth URL
      const response = await fetch('/api/auth/twitter/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          taskId
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to initiate Twitter authentication');
      }

      // Open Twitter auth in popup
      const popup = window.open(
        result.data.authUrl,
        'twitter-auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      setAuthWindow(popup);

      // Listen for auth completion
      const checkAuth = setInterval(() => {
        try {
          if (popup?.closed) {
            clearInterval(checkAuth);
            setVerificationState({ status: 'idle' });
            return;
          }

          // Check for auth completion in URL params
          const urlParams = new URLSearchParams(window.location.search);
          const twitterAuth = urlParams.get('twitter_auth');
          const token = urlParams.get('token');

          if (twitterAuth === 'success' && token) {
            clearInterval(checkAuth);
            popup?.close();
            
            // Decode verification data
            const verificationData = JSON.parse(atob(token));
            
            setVerificationState({
              status: 'completed',
              data: verificationData
            });

            onVerificationComplete(verificationData.followVerification.isFollowing, verificationData);
            
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (error) {
          console.error('Auth check error:', error);
        }
      }, 1000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(checkAuth);
        popup?.close();
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Twitter auth error:', error);
      setVerificationState({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
      onVerificationComplete(false);
    }
  };

  // Handle Telegram verification
  const handleTelegramVerification = async () => {
    try {
      setVerificationState({ status: 'verifying' });

      if (!telegramUserId) {
        throw new Error('Please enter your Telegram User ID');
      }

      const response = await fetch('/api/auth/telegram/verify-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramUserId: parseInt(telegramUserId),
          userId
        })
      });

      const result = await response.json();

      if (result.success && result.data.isMember) {
        setVerificationState({
          status: 'completed',
          data: result.data
        });
        onVerificationComplete(true, result.data);
      } else {
        throw new Error(result.data.error || 'Telegram membership verification failed');
      }

    } catch (error) {
      console.error('Telegram verification error:', error);
      setVerificationState({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Verification failed'
      });
      onVerificationComplete(false);
    }
  };

  // Handle Telegram Widget auth (if implemented)
  const handleTelegramWidget = () => {
    // This would integrate with Telegram Login Widget
    // For now, show manual input option
    setShowManualInput(true);
  };

  // Get Telegram User ID instructions
  const getTelegramIdInstructions = () => {
    return [
      "1. Open Telegram and search for @userinfobot",
      "2. Start a chat with the bot",
      "3. Send any message to get your User ID",
      "4. Copy the number and paste it below"
    ];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (platform === 'twitter') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Twitter className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Twitter Verification</h3>
            <p className="text-sm text-gray-300">Verify you follow @nimrevxyz</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {verificationState.status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-gray-300 mb-4">
                Click below to authenticate with Twitter and verify you follow our official account.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.open('https://twitter.com/nimrevxyz', '_blank')}
                  className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Follow @nimrevxyz
                </button>
                
                <button
                  onClick={handleTwitterAuth}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Verify Follow
                </button>
              </div>
            </motion.div>
          )}

          {verificationState.status === 'authenticating' && (
            <motion.div
              key="authenticating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-blue-400 font-mono">Authenticating with Twitter...</p>
              <p className="text-sm text-gray-400 mt-2">
                Complete the authentication in the popup window
              </p>
            </motion.div>
          )}

          {verificationState.status === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-green-400 font-bold mb-2">Verification Successful!</h4>
              <p className="text-gray-300">
                Thanks for following @nimrevxyz! Your reward has been added to your account.
              </p>
              {verificationState.data?.followVerification?.userData && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    Verified: @{verificationState.data.followVerification.userData.username}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {verificationState.status === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-red-400 font-bold mb-2">Verification Failed</h4>
              <p className="text-gray-300 mb-4">{verificationState.error}</p>
              <button
                onClick={() => setVerificationState({ status: 'idle' })}
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (platform === 'telegram') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Telegram Verification</h3>
            <p className="text-sm text-gray-300">Verify your group membership</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {verificationState.status === 'idle' && !showManualInput && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-gray-300 mb-4">
                Join our Telegram group and verify your membership to earn rewards.
              </p>
              
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => window.open('https://t.me/nimrevxyz', '_blank')}
                  className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Join Group
                </button>
              </div>

              <button
                onClick={handleTelegramWidget}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Verify Membership
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {showManualInput && verificationState.status === 'idle' && (
            <motion.div
              key="manual-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4">
                <h4 className="text-white font-bold mb-2">Get Your Telegram User ID</h4>
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4">
                  {getTelegramIdInstructions().map((instruction, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                      <span className="text-cyan-400 font-bold">{index + 1}.</span>
                      <span>{instruction.substring(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => copyToClipboard('@userinfobot')}
                    className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded text-xs hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Bot Username
                  </button>
                  <button
                    onClick={() => window.open('https://t.me/userinfobot', '_blank')}
                    className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded text-xs hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Bot
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-cyan-400 mb-2">
                  Your Telegram User ID
                </label>
                <input
                  type="number"
                  value={telegramUserId}
                  onChange={(e) => setTelegramUserId(e.target.value)}
                  placeholder="Enter your Telegram User ID"
                  className="w-full bg-dark-bg border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualInput(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-600/20 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleTelegramVerification}
                  disabled={!telegramUserId.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify Membership
                </button>
              </div>
            </motion.div>
          )}

          {verificationState.status === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
              <p className="text-cyan-400 font-mono">Verifying membership...</p>
              <p className="text-sm text-gray-400 mt-2">
                Checking if you're a member of @nimrevxyz
              </p>
            </motion.div>
          )}

          {verificationState.status === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-green-400 font-bold mb-2">Membership Verified!</h4>
              <p className="text-gray-300">
                Welcome to the NimRev community! Your reward has been added to your account.
              </p>
              {verificationState.data?.userData && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    Verified: {verificationState.data.userData.first_name}
                    {verificationState.data.userData.username && ` (@${verificationState.data.userData.username})`}
                  </p>
                  <p className="text-xs text-gray-400">
                    Status: {verificationState.data.memberStatus}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {verificationState.status === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-red-400 font-bold mb-2">Verification Failed</h4>
              <p className="text-gray-300 mb-4">{verificationState.error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setVerificationState({ status: 'idle' });
                    setShowManualInput(false);
                  }}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Try Again
                </button>
                {!showManualInput && (
                  <button
                    onClick={() => window.open('https://t.me/nimrevxyz', '_blank')}
                    className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                  >
                    Join Group First
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
}
