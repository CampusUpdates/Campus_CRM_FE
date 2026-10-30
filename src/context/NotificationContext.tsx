import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { API_URL } from "../config/api";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  fetchSidebarIndicators,
  markModuleSeen as markModuleSeenApi,
  type NotificationItem,
  type SidebarIndicators,
} from "../services/notificationService";
import {
  fetchBroadcasts,
  acknowledgeBroadcast,
  type EmployeeBroadcastItem,
} from "../services/broadcastService";

interface NotificationContextType {
  unreadCount: number;
  pendingBroadcastCount: number;
  pendingBroadcasts: EmployeeBroadcastItem[];
  dismissedPopupBroadcastIds: string[];
  notifications: NotificationItem[];
  recentNotifications: NotificationItem[];
  sidebarIndicators: SidebarIndicators;
  realtimeAlerts: NotificationItem[];
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
  acknowledgeBroadcastItem: (broadcastId: string) => Promise<void>;
  dismissPopupBroadcast: (broadcastId: string) => void;
  markModuleSeen: (module: 'COLLEGE_COUNSELLING' | 'COLLEGES' | 'LEADS') => Promise<void>;
  dismissRealtimeAlert: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const isRealtimeAlertEvent = (title: string): boolean => {
  const t = (title || "").toLowerCase();
  return (
    title === "New Lead Created" ||
    title === "New Lead Assigned" ||
    title === "Lead Reallocated to You" ||
    t.includes("lead assigned") ||
    t.includes("lead reallocated") ||
    title === "Counselling Requested" ||
    title === "Counselling Completed"
  );
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAuth();
  const { info, success, error: toastError } = useToast();

  const infoRef = useRef(info);
  useEffect(() => {
    infoRef.current = info;
  }, [info]);

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [sidebarIndicators, setSidebarIndicators] = useState<SidebarIndicators>({
    leadsUnread: 0,
    counsellingUnread: 0,
    collegesUnread: 0,
    notificationsUnread: 0,
  });

  const dismissedPopupNotificationIdsRef = useRef<string[]>(
    (() => {
      try {
        const stored = sessionStorage.getItem("crm_dismissed_popups");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })()
  );

  const lastSeenModuleTimestampsRef = useRef<Map<string, number>>(new Map());

  const [realtimeAlerts, setRealtimeAlerts] = useState<NotificationItem[]>([]);
  const [pendingBroadcasts, setPendingBroadcasts] = useState<EmployeeBroadcastItem[]>([]);
  const [pendingBroadcastCount, setPendingBroadcastCount] = useState<number>(0);
  const [dismissedPopupBroadcastIds, setDismissedPopupBroadcastIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef<boolean>(false);

  // Helper to only update sidebarIndicators state if values actually changed
  const updateIndicatorsIfChanged = useCallback((indicators: SidebarIndicators) => {
    setSidebarIndicators((prev) => {
      if (
        prev.leadsUnread === (indicators.leadsUnread || 0) &&
        prev.counsellingUnread === indicators.counsellingUnread &&
        prev.collegesUnread === indicators.collegesUnread &&
        prev.notificationsUnread === indicators.notificationsUnread
      ) {
        return prev;
      }
      return {
        leadsUnread: indicators.leadsUnread || 0,
        counsellingUnread: indicators.counsellingUnread,
        collegesUnread: indicators.collegesUnread,
        notificationsUnread: indicators.notificationsUnread,
      };
    });
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;

    try {
      const [count, res, broadcastRes, indicators] = await Promise.all([
        fetchUnreadCount(accessToken),
        fetchNotifications(accessToken, { page: 1, limit: 30 }),
        fetchBroadcasts(accessToken, { limit: 50, inbox: true }).catch((err) => {
          console.warn("Could not fetch broadcasts for user inbox:", err);
          return { data: [], meta: { total: 0 } };
        }),
        fetchSidebarIndicators(accessToken).catch((err) => {
          console.warn("Could not fetch sidebar indicators:", err);
          return null;
        }),
      ]);

      setUnreadCount(count);
      setNotifications(res.data);
      if (indicators) {
        updateIndicatorsIfChanged(indicators);
      }

      // Separate and extract pending acknowledgement broadcasts
      const allBroadcasts: EmployeeBroadcastItem[] = broadcastRes.data || [];
      const pending = allBroadcasts.filter((b) => !b.isAcknowledged);
      setPendingBroadcasts(pending);
      setPendingBroadcastCount(pending.length);

      // Check for newly arrived unread notifications
      if (initialLoadDone.current) {
        res.data.forEach((item) => {
          if (!knownIdsRef.current.has(item.id)) {
            knownIdsRef.current.add(item.id);
            if (!item.isRead) {
              infoRef.current(`🔔 ${item.title}: ${item.message.split("\n")[0]}`);

              const dismissed = dismissedPopupNotificationIdsRef.current;
              if (isRealtimeAlertEvent(item.title) && !dismissed.includes(item.id)) {
                setRealtimeAlerts((prev) => {
                  if (prev.some((a) => a.id === item.id)) return prev;
                  return [item, ...prev];
                });
              }
            }
          }
        });
      } else {
        // Record all existing notification IDs so historical unread items do NOT trigger popups on initial load
        res.data.forEach((item) => knownIdsRef.current.add(item.id));
        initialLoadDone.current = true;
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [accessToken, updateIndicatorsIfChanged]);

  // Initial load and fallback periodic polling (every 30s)
  useEffect(() => {
    if (!accessToken) {
      setUnreadCount(0);
      setNotifications([]);
      setPendingBroadcasts([]);
      setPendingBroadcastCount(0);
      setDismissedPopupBroadcastIds([]);
      setRealtimeAlerts([]);
      setSidebarIndicators({ leadsUnread: 0, counsellingUnread: 0, collegesUnread: 0, notificationsUnread: 0 });
      initialLoadDone.current = false;
      knownIdsRef.current = new Set();
      return;
    }

    setIsLoading(true);
    loadNotifications().finally(() => setIsLoading(false));

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [accessToken, loadNotifications]);

  // Real-time EventSource (SSE) connection for instant push notifications
  useEffect(() => {
    if (!accessToken) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isCleanedUp = false;

    const connectSse = () => {
      if (isCleanedUp) return;
      try {
        const streamUrl = `${API_URL}/notifications/stream?token=${encodeURIComponent(accessToken)}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          if (isCleanedUp) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "NOTIFICATION" && payload.notification) {
              const raw = payload.notification;
              const newItem: NotificationItem = {
                id: raw.id,
                notificationId: raw.id,
                title: raw.title,
                message: raw.message,
                type: raw.type,
                isRead: raw.isRead || false,
                readAt: null,
                createdAt: raw.createdAt || new Date().toISOString(),
              };

              // Add to notifications array if not present
              setNotifications((prev) => {
                if (prev.some((n) => n.id === newItem.id)) return prev;
                return [newItem, ...prev];
              });

              if (!newItem.isRead) {
                setUnreadCount((prev) => prev + 1);

                // Immediate toast popup using existing toast notification UI
                infoRef.current(`🔔 ${newItem.title}: ${newItem.message.split("\n")[0]}`);

                const dismissed = dismissedPopupNotificationIdsRef.current;
                if (isRealtimeAlertEvent(newItem.title) && !dismissed.includes(newItem.id)) {
                  setRealtimeAlerts((prev) => {
                    if (prev.some((a) => a.id === newItem.id)) return prev;
                    return [newItem, ...prev];
                  });
                }
              }

              knownIdsRef.current.add(newItem.id);

              if (
                newItem.title === "Counselling Completed" ||
                newItem.title === "Counselling Requested" ||
                newItem.title.toLowerCase().includes("counselling")
              ) {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("crm:counselling-updated", { detail: newItem }));
                }
              }

              // Update sidebar unread counters
              fetchSidebarIndicators(accessToken)
                .then((indicators) => {
                  if (indicators && !isCleanedUp) updateIndicatorsIfChanged(indicators);
                })
                .catch(() => {});
            }
          } catch (e) {
            console.error("Failed to parse incoming SSE notification payload:", e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isCleanedUp && !reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              if (!isCleanedUp && accessToken) connectSse();
            }, 5000);
          }
        };
      } catch (err) {
        console.error("Error establishing SSE connection:", err);
      }
    };

    connectSse();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [accessToken, updateIndicatorsIfChanged]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const markAsRead = useCallback(async (id: string) => {
    if (!accessToken) return;
    const target = notifications.find((n) => n.id === id);
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )
    );
    setRealtimeAlerts((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (target && !target.isRead) {
      const isLead = target.type === "LEAD" || target.title.includes("Lead");
      const isCounselling =
        target.title.includes("Counselling") || target.message.includes("/counselling");
      if (isLead || isCounselling) {
        setSidebarIndicators((prev) => ({
          ...prev,
          leadsUnread: isLead ? Math.max(0, (prev.leadsUnread || 0) - 1) : prev.leadsUnread,
          counsellingUnread: isCounselling
            ? Math.max(0, prev.counsellingUnread - 1)
            : prev.counsellingUnread,
        }));
      }
    }

    try {
      await markNotificationAsRead(accessToken, id);
      const indicators = await fetchSidebarIndicators(accessToken);
      if (indicators) updateIndicatorsIfChanged(indicators);
    } catch (err) {
      console.error("Failed to mark as read:", err);
      loadNotifications();
    }
  }, [accessToken, notifications, loadNotifications, updateIndicatorsIfChanged]);

  const markAllAsRead = useCallback(async () => {
    if (!accessToken) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setRealtimeAlerts([]);
    setUnreadCount(0);
    setSidebarIndicators((prev) => ({
      ...prev,
      leadsUnread: 0,
      counsellingUnread: 0,
      notificationsUnread: 0,
    }));

    try {
      await markAllNotificationsAsRead(accessToken);
      const indicators = await fetchSidebarIndicators(accessToken);
      if (indicators) updateIndicatorsIfChanged(indicators);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      loadNotifications();
    }
  }, [accessToken, loadNotifications, updateIndicatorsIfChanged]);

  const clearAll = useCallback(async () => {
    if (!accessToken) return;
    setNotifications([]);
    setRealtimeAlerts([]);
    setUnreadCount(0);

    try {
      await clearAllNotifications(accessToken);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      loadNotifications();
    }
  }, [accessToken, loadNotifications]);

  const deleteItem = useCallback(async (id: string) => {
    if (!accessToken) return;
    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const isLead = target.type === "LEAD" || target.title.includes("Lead");
      const isCounselling =
        target.title.includes("Counselling") || target.message.includes("/counselling");
      if (isLead || isCounselling) {
        setSidebarIndicators((prev) => ({
          ...prev,
          leadsUnread: isLead ? Math.max(0, (prev.leadsUnread || 0) - 1) : prev.leadsUnread,
          counsellingUnread: isCounselling
            ? Math.max(0, prev.counsellingUnread - 1)
            : prev.counsellingUnread,
        }));
      }
    }
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setRealtimeAlerts((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteNotification(accessToken, id);
      const indicators = await fetchSidebarIndicators(accessToken);
      if (indicators) updateIndicatorsIfChanged(indicators);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      loadNotifications();
    }
  }, [accessToken, notifications, loadNotifications, updateIndicatorsIfChanged]);

  // Acknowledge broadcast with backend persistence and synchronous state sync
  const acknowledgeBroadcastItem = useCallback(async (broadcastId: string) => {
    if (!accessToken) return;

    try {
      await acknowledgeBroadcast(accessToken, broadcastId);
      success("Broadcast successfully acknowledged.");

      setPendingBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
      setPendingBroadcastCount((prev) => Math.max(0, prev - 1));
      setDismissedPopupBroadcastIds((prev) => prev.filter((id) => id !== broadcastId));

      loadNotifications();
    } catch (err: any) {
      console.error("Failed to acknowledge broadcast:", err);
      toastError(err.message || "Failed to acknowledge broadcast. Please try again.");
      throw err;
    }
  }, [accessToken, success, toastError, loadNotifications]);

  // Dismiss popup for current session cycle without acknowledging or reducing pending count
  const dismissPopupBroadcast = useCallback((broadcastId: string) => {
    setDismissedPopupBroadcastIds((prev) => {
      if (prev.includes(broadcastId)) return prev;
      return [...prev, broadcastId];
    });
  }, []);

  // Module-seen handler: clears module notifications and refreshes sidebar indicators
  const markModuleSeen = useCallback(
    async (module: 'COLLEGE_COUNSELLING' | 'COLLEGES' | 'LEADS') => {
      if (!accessToken) return;

      // Optimistic updates for module indicators and total unread counts
      if (module === 'COLLEGES') {
        setSidebarIndicators((prev) => {
          if (prev.collegesUnread === 0) return prev;
          return {
            ...prev,
            collegesUnread: 0,
          };
        });
      } else if (module === 'LEADS') {
        setSidebarIndicators((prev) => {
          const leadsCount = prev.leadsUnread || 0;
          if (leadsCount === 0) return prev;
          const currentTotal =
            typeof prev.notificationsUnread === 'number'
              ? prev.notificationsUnread
              : (prev.notificationsUnread as any)?.count || 0;
          return {
            ...prev,
            leadsUnread: 0,
            notificationsUnread: Math.max(0, currentTotal - leadsCount),
          };
        });
        setUnreadCount((prev) => Math.max(0, prev - (sidebarIndicators.leadsUnread || 0)));
        setNotifications((prev) =>
          prev.map((item) =>
            item.type === 'LEAD' || item.title.includes('Lead')
              ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
              : item
          )
        );
      } else if (module === 'COLLEGE_COUNSELLING') {
        setSidebarIndicators((prev) => {
          const counsellingCount = prev.counsellingUnread || 0;
          if (counsellingCount === 0) return prev;
          const currentTotal =
            typeof prev.notificationsUnread === 'number'
              ? prev.notificationsUnread
              : (prev.notificationsUnread as any)?.count || 0;
          return {
            ...prev,
            counsellingUnread: 0,
            notificationsUnread: Math.max(0, currentTotal - counsellingCount),
          };
        });
        setUnreadCount((prev) => Math.max(0, prev - (sidebarIndicators.counsellingUnread || 0)));
        setNotifications((prev) =>
          prev.map((item) =>
            item.title.includes('Counselling') || item.message.includes('/counselling')
              ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
              : item
          )
        );
      }

      // Throttle API calls: skip duplicate requests within 5s unless unread items need clearing
      const now = Date.now();
      const lastCall = lastSeenModuleTimestampsRef.current.get(module) || 0;
      const hasUnread =
        module === 'LEADS'
          ? (sidebarIndicators.leadsUnread || 0) > 0
          : module === 'COLLEGE_COUNSELLING'
          ? (sidebarIndicators.counsellingUnread || 0) > 0
          : (sidebarIndicators.collegesUnread || 0) > 0;

      if (!hasUnread && now - lastCall < 5000) {
        return;
      }
      lastSeenModuleTimestampsRef.current.set(module, now);

      try {
        await markModuleSeenApi(accessToken, module);
        const [indicators, count] = await Promise.all([
          fetchSidebarIndicators(accessToken).catch(() => null),
          fetchUnreadCount(accessToken).catch(() => null),
        ]);
        if (indicators) updateIndicatorsIfChanged(indicators);
        if (count !== null) setUnreadCount(count);
      } catch (err) {
        console.error("Failed to mark module seen:", err);
        loadNotifications();
      }
    },
    [accessToken, sidebarIndicators, updateIndicatorsIfChanged, loadNotifications]
  );

  // Dismiss popup from view without deleting or marking notification as read in database
  const dismissRealtimeAlert = useCallback((id: string) => {
    const next = Array.from(new Set([...dismissedPopupNotificationIdsRef.current, id]));
    dismissedPopupNotificationIdsRef.current = next;
    try {
      sessionStorage.setItem("crm_dismissed_popups", JSON.stringify(next));
    } catch {}
    setRealtimeAlerts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const recentNotifications = useMemo(() => notifications.slice(0, 10), [notifications]);

  const contextValue = useMemo<NotificationContextType>(
    () => ({
      unreadCount,
      pendingBroadcastCount,
      pendingBroadcasts,
      dismissedPopupBroadcastIds,
      notifications,
      recentNotifications,
      sidebarIndicators,
      realtimeAlerts,
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
      acknowledgeBroadcastItem,
      dismissPopupBroadcast,
      markModuleSeen,
      dismissRealtimeAlert,
    }),
    [
      unreadCount,
      pendingBroadcastCount,
      pendingBroadcasts,
      dismissedPopupBroadcastIds,
      notifications,
      recentNotifications,
      sidebarIndicators,
      realtimeAlerts,
      isLoading,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      clearAll,
      deleteItem,
      acknowledgeBroadcastItem,
      dismissPopupBroadcast,
      markModuleSeen,
      dismissRealtimeAlert,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
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
