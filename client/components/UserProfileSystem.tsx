import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit,
  Camera,
  Shield,
  Crown,
  Star,
  Zap,
  Target,
  Skull,
  Bot,
  Ghost,
  Diamond,
  Settings,
  Save,
  X,
  Upload,
  Palette,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: {
    type: "generated" | "uploaded" | "nft";
    data: string; // base64 or URL
    style: "cyberpunk" | "abstract" | "geometric" | "pixel";
    colors: string[];
  };
  level: number;
  xp: number;
  rank: "Ghost" | "Scanner" | "Guardian" | "Elite" | "Legend";
  badges: string[];
  stats: {
    scansCompleted: number;
    threatsDetected: number;
    chatMessages: number;
    rewardsEarned: number;
    dayStreak: number;
  };
  preferences: {
    isPublic: boolean;
    showStats: boolean;
    allowMessages: boolean;
    encryptionLevel: "basic" | "advanced" | "military";
  };
  reputation: number;
  joinDate: string;
  lastActive: string;
}

interface ProfileContextType {
  currentProfile: UserProfile | null;
  isProfileRequired: boolean;
  createProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  setProfileRequired: (required: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isProfileRequired, setIsProfileRequired] = useState(false);

  useEffect(() => {
    // Check for existing profile in localStorage
    const savedProfile = localStorage.getItem("nimrev_user_profile");
    if (savedProfile) {
      try {
        setCurrentProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }
  }, []);

  const createProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      const newProfile: UserProfile = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: data.username || `ghost_${Math.random().toString(36).substr(2, 6)}`,
        displayName: data.displayName || data.username || "Anonymous Ghost",
        avatar: data.avatar || {
          type: "generated",
          data: generateAvatar(data.username || "ghost"),
          style: "cyberpunk",
          colors: ["#00ff88", "#0066ff", "#ff6b00"],
        },
        level: 1,
        xp: 0,
        rank: "Ghost",
        badges: ["newcomer"],
        stats: {
          scansCompleted: 0,
          threatsDetected: 0,
          chatMessages: 0,
          rewardsEarned: 0,
          dayStreak: 0,
        },
        preferences: {
          isPublic: true,
          showStats: true,
          allowMessages: true,
          encryptionLevel: "advanced",
        },
        reputation: 100,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        ...data,
      };

      setCurrentProfile(newProfile);
      localStorage.setItem("nimrev_user_profile", JSON.stringify(newProfile));
      return true;
    } catch (error) {
      console.error("Failed to create profile:", error);
      return false;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!currentProfile) return false;

    try {
      const updatedProfile = {
        ...currentProfile,
        ...data,
        lastActive: new Date().toISOString(),
      };

      setCurrentProfile(updatedProfile);
      localStorage.setItem("nimrev_user_profile", JSON.stringify(updatedProfile));
      return true;
    } catch (error) {
      console.error("Failed to update profile:", error);
      return false;
    }
  };

  return (
    <ProfileContext.Provider value={{
      currentProfile,
      isProfileRequired,
      createProfile,
      updateProfile,
      setProfileRequired,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

// Avatar generation function
function generateAvatar(username: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  // Generate colors based on username
  const hash = username.split("").reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 120) % 360;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 100, 100);
  gradient.addColorStop(0, `hsl(${hue1}, 70%, 50%)`);
  gradient.addColorStop(1, `hsl(${hue2}, 70%, 30%)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 100, 100);

  // Add geometric pattern
  ctx.fillStyle = `hsl(${hue1}, 50%, 70%)`;
  for (let i = 0; i < 5; i++) {
    const x = (hash * (i + 1)) % 80 + 10;
    const y = (hash * (i + 2)) % 80 + 10;
    const size = (hash * (i + 3)) % 20 + 5;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL();
}

// Profile Creation Modal
export function ProfileCreationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { createProfile } = useProfile();
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    avatarStyle: "cyberpunk" as const,
    isPublic: true,
    encryptionLevel: "advanced" as const,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState("");

  useEffect(() => {
    if (formData.username) {
      setPreviewAvatar(generateAvatar(formData.username));
    }
  }, [formData.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) return;

    setIsCreating(true);
    
    const success = await createProfile({
      username: formData.username,
      displayName: formData.displayName || formData.username,
      avatar: {
        type: "generated",
        data: previewAvatar,
        style: formData.avatarStyle,
        colors: ["#00ff88", "#0066ff", "#ff6b00"],
      },
      preferences: {
        isPublic: formData.isPublic,
        showStats: true,
        allowMessages: true,
        encryptionLevel: formData.encryptionLevel,
      },
    });

    setIsCreating(false);
    
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-dark-bg border border-cyber-green/30 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-2">
            CREATE DATA GHOST PROFILE
          </h2>
          <p className="text-gray-300 text-sm">
            Required for chat and advanced features
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-2 border-2 border-cyber-green">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cyber-purple to-cyber-blue flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">Auto-generated from username</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-bold text-cyber-green mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="ghost_hunter_2024"
              className="w-full bg-dark-bg/50 border border-cyber-green/30 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyber-green"
              required
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-bold text-cyber-blue mb-2">
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Ghost Hunter"
              className="w-full bg-dark-bg/50 border border-cyber-blue/30 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyber-blue"
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Public Profile</label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isPublic ? "bg-cyber-green" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Encryption Level</label>
              <select
                value={formData.encryptionLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, encryptionLevel: e.target.value as any }))}
                className="w-full bg-dark-bg/50 border border-cyber-purple/30 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyber-purple"
              >
                <option value="basic">Basic (AES-128)</option>
                <option value="advanced">Advanced (AES-256)</option>
                <option value="military">Military (ChaCha20-Poly1305)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-600/20 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!formData.username.trim() || isCreating}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Profile
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Profile Card Component
export function ProfileCard({ profile, compact = false }: { 
  profile: UserProfile; 
  compact?: boolean; 
}) {
  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "Legend": return <Crown className="w-5 h-5 text-yellow-400" />;
      case "Elite": return <Diamond className="w-5 h-5 text-purple-400" />;
      case "Guardian": return <Shield className="w-5 h-5 text-blue-400" />;
      case "Scanner": return <Target className="w-5 h-5 text-green-400" />;
      default: return <Ghost className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Legend": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
      case "Elite": return "text-purple-400 border-purple-400/30 bg-purple-400/10";
      case "Guardian": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
      case "Scanner": return "text-green-400 border-green-400/30 bg-green-400/10";
      default: return "text-gray-400 border-gray-400/30 bg-gray-400/10";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-dark-bg/60 border border-cyber-green/30 rounded-lg p-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-cyber-green/50">
          <img src={profile.avatar.data} alt={profile.username} className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate">{profile.displayName}</span>
            {getRankIcon(profile.rank)}
          </div>
          <div className="text-xs text-gray-400">@{profile.username}</div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-bold text-cyber-green">Level {profile.level}</div>
          <div className="text-xs text-gray-400">{profile.reputation} rep</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg/80 border border-cyber-green/30 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyber-green">
            <img src={profile.avatar.data} alt={profile.username} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyber-blue rounded-full flex items-center justify-center text-xs font-bold text-white">
            {profile.level}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{profile.displayName}</h3>
          <p className="text-gray-400">@{profile.username}</p>
          
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold mt-2 ${getRankColor(profile.rank)}`}>
            {getRankIcon(profile.rank)}
            {profile.rank}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-cyber-green">{profile.stats.scansCompleted}</div>
          <div className="text-xs text-gray-400">Scans</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-cyber-orange">{profile.stats.threatsDetected}</div>
          <div className="text-xs text-gray-400">Threats</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-cyber-blue">{profile.stats.chatMessages}</div>
          <div className="text-xs text-gray-400">Messages</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-cyber-purple">{profile.stats.dayStreak}</div>
          <div className="text-xs text-gray-400">Day Streak</div>
        </div>
      </div>

      {/* Badges */}
      {profile.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.badges.map((badge, index) => (
            <div
              key={index}
              className="px-2 py-1 bg-cyber-green/20 border border-cyber-green/30 rounded text-xs text-cyber-green"
            >
              {badge}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Profile requirement hook
export function useProfileRequirement() {
  const { currentProfile, isProfileRequired, setProfileRequired } = useProfile();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Check if profile is required for current route
    const path = window.location.pathname;
    const profileRequiredRoutes = ["/community", "/chat"];
    
    if (profileRequiredRoutes.some(route => path.includes(route))) {
      setProfileRequired(true);
      if (!currentProfile) {
        setShowCreateModal(true);
      }
    }
  }, [currentProfile, setProfileRequired]);

  return {
    showCreateModal,
    setShowCreateModal,
    requiresProfile: isProfileRequired && !currentProfile,
  };
}
