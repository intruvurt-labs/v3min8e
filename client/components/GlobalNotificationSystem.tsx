import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Target,
  Shield,
  TrendingUp,
  Gift,
  Users,
  MessageSquare,
  Star,
  Crown,
  X,
  Settings,
} from "lucide-react";

interface Notification {
  id: string;
  type:
    | "scan"
    | "reward"
    | "achievement"
    | "trade"
    | "social"
    | "system"
    | "milestone";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: "low" | "medium" | "high" | "critical";
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize with some demo notifications
  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: "1",
        type: "scan",
        title: "Threat Detected",
        message: "High-risk address detected in your recent scan",
        timestamp: Date.now() - 300000,
        read: false,
        priority: "high",
        actionUrl: "/security-audit",
        actionLabel: "View Details",
      },
      {
        id: "2",
        type: "reward",
        title: "Daily Reward Available",
        message: "Claim your Day 4 reward: 2x Scan Multiplier",
        timestamp: Date.now() - 600000,
        read: false,
        priority: "medium",
        actionUrl: "/dashboard",
        actionLabel: "Claim Now",
      },
      {
        id: "3",
        type: "achievement",
        title: "Level Up!",
        message: "Congratulations! You've reached Level 5",
        timestamp: Date.now() - 1200000,
        read: true,
        priority: "medium",
      },
    ];
    setNotifications(demoNotifications);
  }, []);

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Auto-remove low priority notifications after 10 seconds
    if (notification.priority === "low") {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 10000);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Notification Bell Component
export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "scan":
        return <Shield className="w-4 h-4" />;
      case "reward":
        return <Gift className="w-4 h-4" />;
      case "achievement":
        return <Star className="w-4 h-4" />;
      case "trade":
        return <TrendingUp className="w-4 h-4" />;
      case "social":
        return <Users className="w-4 h-4" />;
      case "system":
        return <Info className="w-4 h-4" />;
      case "milestone":
        return <Target className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-500/10 text-red-400";
      case "high":
        return "border-cyber-orange bg-cyber-orange/10 text-cyber-orange";
      case "medium":
        return "border-cyber-blue bg-cyber-blue/10 text-cyber-blue";
      case "low":
        return "border-gray-500 bg-gray-500/10 text-gray-400";
      default:
        return "border-gray-500 bg-gray-500/10 text-gray-400";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-cyber-green/30 bg-dark-bg/60 hover:bg-cyber-green/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-cyber-green" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyber-orange rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 max-h-96 bg-dark-bg border border-cyber-green/30 rounded-lg shadow-2xl z-50 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyber-green/20">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyber-green" />
                <span className="font-cyber font-bold text-cyber-green">
                  NOTIFICATIONS
                </span>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-cyber-blue hover:text-cyber-green transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-cyber-green/20 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? "bg-white/5" : "opacity-75"
                      } hover:bg-white/5 cursor-pointer`}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 ${
                            notification.priority === "critical"
                              ? "text-red-400"
                              : notification.priority === "high"
                                ? "text-cyber-orange"
                                : notification.priority === "medium"
                                  ? "text-cyber-blue"
                                  : "text-gray-400"
                          }`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white truncate">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-400 ml-2">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-gray-300 mt-1">
                            {notification.message}
                          </p>

                          {notification.actionLabel && (
                            <div className="mt-2">
                              <span className="text-xs text-cyber-blue hover:text-cyber-green">
                                {notification.actionLabel} →
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="p-1 hover:bg-red-500/20 rounded"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Toast Notification Component for immediate alerts
export function ToastNotification({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getToastIcon = () => {
    switch (notification.priority) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "high":
        return <Zap className="w-5 h-5 text-cyber-orange" />;
      case "medium":
        return <Info className="w-5 h-5 text-cyber-blue" />;
      default:
        return <CheckCircle className="w-5 h-5 text-cyber-green" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.priority) {
      case "critical":
        return "border-red-500";
      case "high":
        return "border-cyber-orange";
      case "medium":
        return "border-cyber-blue";
      default:
        return "border-cyber-green";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`relative bg-dark-bg/95 backdrop-blur-xl border ${getBorderColor()} rounded-lg p-4 shadow-2xl max-w-sm`}
    >
      <div className="flex items-start gap-3">
        {getToastIcon()}

        <div className="flex-1">
          <h4 className="font-bold text-white text-sm">{notification.title}</h4>
          <p className="text-gray-300 text-xs mt-1">{notification.message}</p>

          {notification.actionLabel && (
            <button className="text-xs text-cyber-blue hover:text-cyber-green mt-2">
              {notification.actionLabel} →
            </button>
          )}
        </div>

        <button onClick={onDismiss} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}

// Real-time notification hook for automatic updates
export function useRealTimeNotifications() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Simulate real-time notifications
    const generateRandomNotification = () => {
      const notifications = [
        {
          type: "scan" as const,
          title: "New Scan Complete",
          message: `Address scan completed with risk score: ${Math.floor(Math.random() * 100)}`,
          priority: "medium" as const,
        },
        {
          type: "achievement" as const,
          title: "Milestone Reached",
          message: "You've completed 50 scans! Keep going!",
          priority: "medium" as const,
        },
        {
          type: "social" as const,
          title: "New Chat Message",
          message: "Someone mentioned you in the community chat",
          priority: "low" as const,
        },
        {
          type: "system" as const,
          title: "System Update",
          message: "Scanner algorithms updated for better accuracy",
          priority: "low" as const,
        },
      ];

      const randomNotif =
        notifications[Math.floor(Math.random() * notifications.length)];
      addNotification(randomNotif);
    };

    // Generate notifications every 30-60 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance
        generateRandomNotification();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [addNotification]);
}
