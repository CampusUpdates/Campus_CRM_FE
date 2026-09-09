import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  type NotificationItem,
} from "../services/notificationService";

interface NotificationContextType {
  unreadCount: number;
  notifications: NotificationItem[];
  recentNotifications: NotificationItem[];
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAuth();
  const { info } = useToast();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef<boolean>(false);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;

    try {
      const [count, res] = await Promise.all([
        fetchUnreadCount(accessToken),
        fetchNotifications(accessToken, { page: 1, limit: 30 }),
      ]);

      setUnreadCount(count);
      setNotifications(res.data);

      // Check for newly arrived unread notifications to show toast
      if (initialLoadDone.current) {
        res.data.forEach((item) => {
          if (!item.isRead && !knownIdsRef.current.has(item.id)) {
            info(`🔔 ${item.title}: ${item.message}`);
          }
        });
      }

      // Update set of known IDs
      const newKnownSet = new Set<string>();
      res.data.forEach((item) => newKnownSet.add(item.id));
      knownIdsRef.current = newKnownSet;
      initialLoadDone.current = true;
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [accessToken, info]);

  useEffect(() => {
    if (!accessToken) {
      setUnreadCount(0);
      setNotifications([]);
      initialLoadDone.current = false;
      return;
    }

    setIsLoading(true);
    loadNotifications().finally(() => setIsLoading(false));

    // Controlled polling every 15 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [accessToken, loadNotifications]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const markAsRead = async (id: string) => {
    if (!accessToken) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(accessToken, id);
    } catch (err) {
      console.error("Failed to mark as read:", err);
      // Re-sync on failure
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!accessToken) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead(accessToken);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      loadNotifications();
    }
  };

  const clearAll = async () => {
    if (!accessToken) return;
    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotifications(accessToken);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      loadNotifications();
    }
  };

  const deleteItem = async (id: string) => {
    if (!accessToken) return;
    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteNotification(accessToken, id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      loadNotifications();
    }
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        recentNotifications,
        isLoading,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        refreshNotifications: loadNotifications,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteItem,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
