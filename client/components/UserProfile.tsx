import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  Camera,
  Edit3,
  Save,
  X,
  Activity,
  Clock,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

interface UserProfile {
  wallet: string;
  name: string;
  bio: string;
  avatar: string;
  joinDate: Date;
  totalScans: number;
  successfulScans: number;
  threatsDetected: number;
  alphaSignalsFound: number;
  lastAction: {
    type: "scan" | "stake" | "claim" | "profile_update";
    target?: string;
    timestamp: Date;
    network?: string;
  };
  preferences: {
    scanShutdownTimes: {
      enabled: boolean;
      startTime: string; // HH:MM format
      endTime: string;
      timezone: string;
    };
    notifications: {
      threats: boolean;
      alphaSignals: boolean;
      staking: boolean;
    };
    privacy: {
      showActivity: boolean;
      showStats: boolean;
    };
  };
  reputation: {
    level: number;
    xp: number;
    nextLevelXp: number;
    badges: string[];
  };
  vermHoldings: {
    total: number;
    staked: number;
    tier: "demo" | "holder" | "whale" | "legend";
    qualified: boolean;
  };
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { connected, publicKey } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (connected && publicKey && isOpen) {
      loadUserProfile();
    }
  }, [connected, publicKey, isOpen]);

  const loadUserProfile = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else {
        // Create new profile for first-time users
        await createDefaultProfile();
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultProfile = async () => {
    if (!publicKey) return;

    const defaultProfile: UserProfile = {
      wallet: publicKey,
      name: `Vermin_${publicKey.slice(0, 6)}`,
      bio: "New to the NimRev network. Ready to hunt threats.",
      avatar: generateRandomAvatar(publicKey),
      joinDate: new Date(),
      totalScans: 0,
      successfulScans: 0,
      threatsDetected: 0,
      alphaSignalsFound: 0,
      lastAction: {
        type: "profile_update",
        timestamp: new Date(),
      },
      preferences: {
        scanShutdownTimes: {
          enabled: false,
          startTime: "02:00",
          endTime: "06:00",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        notifications: {
          threats: true,
          alphaSignals: true,
          staking: true,
        },
        privacy: {
          showActivity: true,
          showStats: true,
        },
      },
      reputation: {
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        badges: ["rookie_hunter"],
      },
      vermHoldings: {
        total: 0,
        staked: 0,
        tier: "demo",
        qualified: false,
      },
    };

    setProfile(defaultProfile);
    await saveProfile(defaultProfile);
  };

  const generateRandomAvatar = (seed: string): string => {
    // Generate deterministic avatar based on wallet address
    const colors = [
      "cyber-green",
      "cyber-blue",
      "cyber-orange",
      "cyber-purple",
      "cyber-pink",
    ];
    const seedNum = seed
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = seedNum % colors.length;

    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${colors[colorIndex]}`;
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Avatar image must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
      setEditedProfile((prev) => ({ ...prev, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (profileData: UserProfile) => {
    try {
      const response = await fetch("/api/user/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileData }),
      });

      if (response.ok) {
        setProfile(profileData);
        setIsEditing(false);
        setEditedProfile({});
        setAvatarPreview("");
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      ...editedProfile,
      lastAction: {
        type: "profile_update" as const,
        timestamp: new Date(),
      },
    };

    await saveProfile(updatedProfile);
  };

  const formatLastAction = (action: UserProfile["lastAction"]) => {
    const timeAgo = formatTimeAgo(action.timestamp);

    switch (action.type) {
      case "scan":
        return `Scanned ${action.target?.slice(0, 8)}...${action.target?.slice(-4)} on ${action.network} ${timeAgo}`;
      case "stake":
        return `Staked VERM tokens ${timeAgo}`;
      case "claim":
        return `Claimed rewards ${timeAgo}`;
      case "profile_update":
        return `Updated profile ${timeAgo}`;
      default:
        return `Last active ${timeAgo}`;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "legend":
        return "text-cyber-purple";
      case "whale":
        return "text-cyber-orange";
      case "holder":
        return "text-cyber-green";
      default:
        return "text-gray-400";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "legend":
        return "👑";
      case "whale":
        return "🐋";
      case "holder":
        return "💎";
      default:
        return "🐭";
    }
  };

  if (!isOpen || !connected) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-bg border border-cyber-green/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-cyber-green/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-cyber font-bold text-cyber-green">
              USER PROFILE MATRIX
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 border border-red-400/30 text-red-400 hover:bg-red-400/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-cyber-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyber-blue font-mono">
              Loading profile matrix...
            </p>
          </div>
        ) : profile ? (
          <div className="p-6 space-y-8">
            {/* Profile Header */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Avatar & Basic Info */}
              <div className="space-y-6">
                <div className="relative">
                  <img
                    src={avatarPreview || profile.avatar}
                    alt="Profile Avatar"
                    className="w-32 h-32 rounded-full border-2 border-cyber-green/50 mx-auto"
                  />
                  {isEditing && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 p-2 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded-full hover:bg-cyber-blue/40"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                {/* Name & Bio */}
                <div className="text-center space-y-4">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editedProfile.name || profile.name}
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-dark-bg border border-cyber-green/30 text-center text-xl font-bold text-cyber-green"
                        placeholder="Display Name"
                      />
                      <textarea
                        value={editedProfile.bio || profile.bio}
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-dark-bg border border-cyber-green/30 text-center text-sm text-gray-300 resize-none"
                        rows={3}
                        placeholder="Short bio..."
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-cyber-green">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-gray-300">{profile.bio}</p>
                    </>
                  )}

                  <div className="text-xs text-gray-400 font-mono">
                    {profile.wallet.slice(0, 8)}...{profile.wallet.slice(-8)}
                  </div>

                  <div
                    className={`text-sm font-bold ${getTierColor(profile.vermHoldings.tier)}`}
                  >
                    {getTierIcon(profile.vermHoldings.tier)}{" "}
                    {profile.vermHoldings.tier.toUpperCase()} TIER
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="space-y-4">
                <h4 className="text-lg font-cyber font-bold text-cyber-blue">
                  ACTIVITY STATS
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-cyber-green/20 bg-cyber-green/5 text-center">
                    <div className="text-2xl font-bold text-cyber-green">
                      {profile.totalScans}
                    </div>
                    <div className="text-xs text-gray-400">Total Scans</div>
                  </div>
                  <div className="p-4 border border-cyber-orange/20 bg-cyber-orange/5 text-center">
                    <div className="text-2xl font-bold text-cyber-orange">
                      {profile.threatsDetected}
                    </div>
                    <div className="text-xs text-gray-400">Threats Found</div>
                  </div>
                  <div className="p-4 border border-cyber-purple/20 bg-cyber-purple/5 text-center">
                    <div className="text-2xl font-bold text-cyber-purple">
                      {profile.alphaSignalsFound}
                    </div>
                    <div className="text-xs text-gray-400">Alpha Signals</div>
                  </div>
                  <div className="p-4 border border-cyber-blue/20 bg-cyber-blue/5 text-center">
                    <div className="text-2xl font-bold text-cyber-blue">
                      {profile.successfulScans > 0
                        ? Math.round(
                            (profile.successfulScans / profile.totalScans) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-gray-400">Success Rate</div>
                  </div>
                </div>

                {/* Reputation */}
                <div className="p-4 border border-cyber-purple/30 bg-cyber-purple/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-cyber-purple font-bold">
                      Level {profile.reputation.level}
                    </span>
                    <span className="text-xs text-gray-400">
                      {profile.reputation.xp}/{profile.reputation.nextLevelXp}{" "}
                      XP
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded">
                    <div
                      className="bg-cyber-purple h-2 rounded transition-all duration-300"
                      style={{
                        width: `${(profile.reputation.xp / profile.reputation.nextLevelXp) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.reputation.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-cyber-orange/20 text-cyber-orange rounded"
                      >
                        {badge.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* VERM Holdings */}
              <div className="space-y-4">
                <h4 className="text-lg font-cyber font-bold text-cyber-orange">
                  VERM HOLDINGS
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total VERM:</span>
                    <span className="text-cyber-orange font-bold">
                      {profile.vermHoldings.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Staked:</span>
                    <span className="text-cyber-green font-bold">
                      {profile.vermHoldings.staked.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`font-bold ${profile.vermHoldings.qualified ? "text-cyber-green" : "text-red-400"}`}
                    >
                      {profile.vermHoldings.qualified
                        ? "✓ QUALIFIED"
                        : "✗ INSUFFICIENT"}
                    </span>
                  </div>
                </div>

                {/* Last Action */}
                <div className="p-4 border border-cyber-blue/30 bg-cyber-blue/5">
                  <h5 className="text-cyber-blue font-bold text-sm mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    LAST ACTION
                  </h5>
                  <p className="text-xs text-gray-300 font-mono">
                    {formatLastAction(profile.lastAction)}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button className="w-full p-3 border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/20 transition-colors flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    VIEW FULL ANALYTICS
                  </button>
                  <button className="w-full p-3 border border-cyber-orange/30 text-cyber-orange hover:bg-cyber-orange/20 transition-colors flex items-center justify-center">
                    <Shield className="w-4 h-4 mr-2" />
                    SECURITY REPORT
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="border-t border-cyber-green/20 pt-6">
              <h4 className="text-lg font-cyber font-bold text-cyber-green mb-6">
                SCAN PREFERENCES
              </h4>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Scan Shutdown Times */}
                <div className="space-y-4">
                  <h5 className="text-cyber-blue font-bold flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    SHUTDOWN SCHEDULE
                  </h5>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={
                          editedProfile.preferences?.scanShutdownTimes
                            ?.enabled ??
                          profile.preferences.scanShutdownTimes.enabled
                        }
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              scanShutdownTimes: {
                                ...profile.preferences.scanShutdownTimes,
                                ...prev.preferences?.scanShutdownTimes,
                                enabled: e.target.checked,
                              },
                            },
                          }))
                        }
                        className="form-checkbox text-cyber-green"
                        disabled={!isEditing}
                      />
                      <span className="text-gray-300">
                        Enable auto-shutdown
                      </span>
                    </label>

                    {(editedProfile.preferences?.scanShutdownTimes?.enabled ??
                      profile.preferences.scanShutdownTimes.enabled) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={
                              editedProfile.preferences?.scanShutdownTimes
                                ?.startTime ??
                              profile.preferences.scanShutdownTimes.startTime
                            }
                            onChange={(e) =>
                              setEditedProfile((prev) => ({
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  scanShutdownTimes: {
                                    ...profile.preferences.scanShutdownTimes,
                                    ...prev.preferences?.scanShutdownTimes,
                                    startTime: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-2 py-1 bg-dark-bg border border-cyber-green/30 text-cyber-green text-sm"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={
                              editedProfile.preferences?.scanShutdownTimes
                                ?.endTime ??
                              profile.preferences.scanShutdownTimes.endTime
                            }
                            onChange={(e) =>
                              setEditedProfile((prev) => ({
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  scanShutdownTimes: {
                                    ...profile.preferences.scanShutdownTimes,
                                    ...prev.preferences?.scanShutdownTimes,
                                    endTime: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-2 py-1 bg-dark-bg border border-cyber-green/30 text-cyber-green text-sm"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4">
                  <h5 className="text-cyber-orange font-bold flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    NOTIFICATIONS
                  </h5>

                  <div className="space-y-3">
                    {Object.entries(profile.preferences.notifications).map(
                      ([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-3"
                        >
                          <input
                            type="checkbox"
                            checked={
                              editedProfile.preferences?.notifications?.[
                                key as keyof typeof profile.preferences.notifications
                              ] ?? value
                            }
                            onChange={(e) =>
                              setEditedProfile((prev) => ({
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  notifications: {
                                    ...profile.preferences.notifications,
                                    ...prev.preferences?.notifications,
                                    [key]: e.target.checked,
                                  },
                                },
                              }))
                            }
                            className="form-checkbox text-cyber-orange"
                            disabled={!isEditing}
                          />
                          <span className="text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="border-t border-cyber-green/20 pt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile({});
                    setAvatarPreview("");
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-400 hover:bg-gray-600/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-dark-bg transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-red-400 font-mono">
              Failed to load profile data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
