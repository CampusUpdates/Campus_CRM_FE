import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  CheckSquare,
  Clock,
  Info,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  AlertTriangle,
  Megaphone,
  Check,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";
import { ROUTES } from "../../../app/router/routes";
import { type NotificationType } from "../../../services/notificationService";
import {
  fetchBroadcasts,
  markBroadcastRead,
  type EmployeeBroadcastItem,
} from "../../../services/broadcastService";
import { BroadcastReaderModal } from "../../broadcasts/components/BroadcastReaderModal";
import {
  PageLoadingState,
  PageEmptyState,
} from "../../../components/common";

export type NotificationCategory = "RECRUITMENT" | "LEADS" | "INTERVIEW" | "SYSTEM" | "APPROVAL";
export type NotificationTab = "ALL" | "UNREAD" | "PENDING_ACK" | "ACKNOWLEDGED" | "BROADCASTS" | NotificationCategory;

const mapTypeToCategory = (type: NotificationType): NotificationCategory => {
  switch (type) {
    case "LEAD":
    case "TPC":
      return "LEADS";
    case "INTERVIEW":
      return "INTERVIEW";
    case "SYSTEM":
    case "DATA_ASSIGNMENT":
      return "SYSTEM";
    default:
      return "SYSTEM";
  }
};

const getTargetRouteForType = (
  type: NotificationType,
  title?: string,
  message?: string
): string => {
  const linkMatch = (message || "").match(/Link:\s*(\/[^\s\n]+)/);
  if (linkMatch && linkMatch[1]) {
    return linkMatch[1];
  }

  const titleLower = (title || "").toLowerCase();
  const msgLower = (message || "").toLowerCase();

  if (
    titleLower.includes("announcement:") ||
    titleLower.includes("broadcast") ||
    msgLower.includes("broadcast") ||
    msgLower.includes("announcement")
  ) {
    return ROUTES.BROADCASTS;
  }

  if (
    type === "DATA_ASSIGNMENT" ||
    titleLower.includes("student data") ||
    titleLower.includes("data assignment") ||
    titleLower.includes("data reclaimed") ||
    msgLower.includes("student data") ||
    msgLower.includes("assigned to you by your manager") ||
    msgLower.includes("reclaimed")
  ) {
    return ROUTES.CALLS;
  }

  switch (type) {
    case "LEAD":
      return ROUTES.LEADS;
    case "TPC":
      return ROUTES.TPC;
    case "SYSTEM":
      if (titleLower.includes("counselling") || msgLower.includes("counselling")) {
        return ROUTES.COLLEGE_COUNSELLING;
      }
      if (titleLower.includes("college") || msgLower.includes("college")) {
        return ROUTES.COLLEGES;
      }
      return ROUTES.CALLS;
    case "INTERVIEW":
      return ROUTES.RECRUITMENT;
    default:
      return ROUTES.NOTIFICATIONS;
  }
};

const formatTimestamp = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const {
    notifications,
    unreadCount,
    pendingBroadcastCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteItem,
    refreshNotifications,
    acknowledgeBroadcastItem,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<NotificationTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState<EmployeeBroadcastItem[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState<boolean>(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<EmployeeBroadcastItem | null>(null);
  const [acknowledgingBroadcastId, setAcknowledgingBroadcastId] = useState<string | null>(null);

  const loadBroadcasts = useCallback(async () => {
    if (!accessToken) return;
    setLoadingBroadcasts(true);
    try {
      const res = await fetchBroadcasts(accessToken, { limit: 50, inbox: true });
      setBroadcasts(res.data || []);
    } catch (err: any) {
      console.error("Failed to load employee broadcasts:", err);
    } finally {
      setLoadingBroadcasts(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadBroadcasts();
  }, [loadBroadcasts]);

  const handleToggleRead = async (
    id: string,
    type: NotificationType,
    isRead: boolean,
    title?: string,
    message?: string
  ) => {
    if (!isRead) {
      await markAsRead(id);
    }
    const targetRoute = getTargetRouteForType(type, title, message);
    if (targetRoute !== ROUTES.NOTIFICATIONS) {
      navigate(targetRoute);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteItem(id);
  };

  const handleAcknowledgeBroadcast = async (broadcastId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAcknowledgingBroadcastId(broadcastId);
    try {
      await acknowledgeBroadcastItem(broadcastId);
      // Update local state immediately
      setBroadcasts((prev) =>
        prev.map((b) =>
          b.id === broadcastId
            ? {
                ...b,
                isAcknowledged: true,
                isRead: true,
                acknowledgedAt: new Date().toISOString(),
              }
            : b
        )
      );
      if (selectedBroadcast && selectedBroadcast.id === broadcastId) {
        setSelectedBroadcast((prev) =>
          prev
            ? {
                ...prev,
                isAcknowledged: true,
                isRead: true,
                acknowledgedAt: new Date().toISOString(),
              }
            : null
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to acknowledge broadcast. Please retry.");
    } finally {
      setAcknowledgingBroadcastId(null);
    }
  };

  const handleOpenBroadcastReader = async (item: EmployeeBroadcastItem) => {
    setSelectedBroadcast(item);
    if (!item.isRead && accessToken) {
      try {
        await markBroadcastRead(accessToken, item.id);
        setBroadcasts((prev) =>
          prev.map((b) =>
            b.id === item.id ? { ...b, isRead: true, readAt: new Date().toISOString() } : b
          )
        );
      } catch (err) {
        console.error("Failed to mark broadcast as read:", err);
      }
    }
  };

  const pendingBroadcastsList = useMemo(
    () => broadcasts.filter((b) => !b.isAcknowledged),
    [broadcasts]
  );
  const acknowledgedBroadcastsList = useMemo(
    () => broadcasts.filter((b) => b.isAcknowledged),
    [broadcasts]
  );

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "RECRUITMENT":
        return <UserPlus size={18} className="text-blue-500" />;
      case "INTERVIEW":
        return <CalendarCheck size={18} className="text-amber-500" />;
      case "LEADS":
        return <Users size={18} className="text-primary-500" />;
      case "APPROVAL":
        return <CheckCircle2 size={18} className="text-emerald-500" />;
      case "SYSTEM":
        return <ShieldCheck size={18} className="text-purple-500" />;
      default:
        return <Info size={18} className="text-text-muted" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationCategory) => {
    switch (category) {
      case "RECRUITMENT":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "INTERVIEW":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "LEADS":
        return "bg-primary-500/15 text-primary-600 dark:text-primary-400 border-primary-500/30";
      case "APPROVAL":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "SYSTEM":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-neutral-500/15 text-text-secondary border-border";
    }
  };

  const showBroadcastTab =
    activeTab === "BROADCASTS" ||
    activeTab === "PENDING_ACK" ||
    activeTab === "ACKNOWLEDGED";

  // Filter regular notifications by category & search query
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const category = mapTypeToCategory(item.type);
      let matchesCategory = true;
      if (activeTab === "ALL") matchesCategory = true;
      else if (activeTab === "UNREAD") matchesCategory = !item.isRead;
      else matchesCategory = category === activeTab;

      if (!matchesCategory) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesMsg = item.message?.toLowerCase().includes(query);
        return matchesTitle || matchesMsg;
      }

      return true;
    });
  }, [notifications, activeTab, searchTerm]);

  // Filter broadcasts by tab & search query
  const displayedBroadcasts = useMemo(() => {
    const baseList =
      activeTab === "PENDING_ACK"
        ? pendingBroadcastsList
        : activeTab === "ACKNOWLEDGED"
        ? acknowledgedBroadcastsList
        : broadcasts;

    if (!searchTerm.trim()) return baseList;
    const query = searchTerm.toLowerCase();
    return baseList.filter((b) => {
      const sender = b.createdBy
        ? `${b.createdBy.firstName} ${b.createdBy.lastName || ""}`.toLowerCase()
        : "super admin";
      return (
        b.title.toLowerCase().includes(query) ||
        b.body.toLowerCase().includes(query) ||
        sender.includes(query)
      );
    });
  }, [activeTab, pendingBroadcastsList, acknowledgedBroadcastsList, broadcasts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
              <Bell className="text-primary-600 h-7 w-7 shrink-0" />
              <span>Notifications & Alerts</span>
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-2xs">
                {unreadCount} Unread
              </span>
            )}
            {pendingBroadcastCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {pendingBroadcastCount} Awaiting Acknowledgement
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Stay updated on broadcast announcements, lead assignments, TPC tasks, approvals, and notices.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="
              flex items-center gap-1.5 rounded-lg border border-border
              bg-surface px-3.5 py-2 text-xs font-medium text-text-primary
              transition-all duration-200 hover:border-primary-500/40 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 cursor-pointer shadow-2xs
            "
          >
            <CheckSquare size={15} />
            <span>Mark All as Read</span>
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="
              flex items-center gap-1.5 rounded-lg border border-rose-500/30
              bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-300
              transition-all duration-200 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer shadow-2xs
            "
          >
            <Trash2 size={15} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              refreshNotifications();
              loadBroadcasts();
            }}
            className="font-semibold underline hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
        {/* Search Field */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search notifications and announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              h-11
              w-full
              rounded-xl
              border border-border
              bg-surface
              pl-11 pr-10
              text-sm text-text-primary
              placeholder:text-text-muted
              outline-none
              focus:border-primary-500
              focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950
              transition
            "
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Dropdown Filter */}
        <div className="relative w-full sm:w-auto sm:min-w-[220px] shrink-0">
          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as NotificationTab)}
              aria-label="Filter notifications by category"
              className="
                h-11
                w-full
                rounded-xl
                border
                border-border
                bg-surface
                pl-10
                pr-9
                text-sm
                font-medium
                text-text-primary
                outline-none
                transition
                focus:border-primary-500
                focus:ring-2
                focus:ring-primary-100 dark:focus:ring-primary-950
                appearance-none
                cursor-pointer
              "
            >
              <option value="ALL">All Notifications ({notifications.length})</option>
              <option value="UNREAD">Unread ({unreadCount})</option>
              <option value="BROADCASTS">Broadcasts ({broadcasts.length})</option>
              <option value="PENDING_ACK">
                Pending Acknowledgement ({pendingBroadcastsList.length})
              </option>
              <option value="ACKNOWLEDGED">
                Acknowledged ({acknowledgedBroadcastsList.length})
              </option>
              <option value="LEADS">Leads</option>
              <option value="INTERVIEW">Interviews</option>
              <option value="RECRUITMENT">Recruitment</option>
              <option value="SYSTEM">System</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Broadcasts View */}
      {showBroadcastTab ? (
        <div className="space-y-3">
          {loadingBroadcasts && broadcasts.length === 0 ? (
            <PageLoadingState message="Loading broadcast announcements..." />
          ) : displayedBroadcasts.length === 0 ? (
            <PageEmptyState
              icon={Megaphone}
              title="No Broadcasts Found"
              message="There are no broadcast announcements matching this selection right now."
            />
          ) : (
            displayedBroadcasts.map((item) => {
              const sender = item.createdBy
                ? `${item.createdBy.firstName} ${item.createdBy.lastName || ""}`.trim()
                : "Super Admin";

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenBroadcastReader(item)}
                  className={`
                    group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4.5 gap-4 transition-all duration-200 cursor-pointer shadow-xs bg-surface
                    ${
                      !item.isRead
                        ? "border-primary-500/40 hover:border-primary-500 hover:shadow-md"
                        : "border-border hover:border-neutral-300 dark:hover:border-neutral-700"
                    }
                  `}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${
                        !item.isRead
                          ? "border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400"
                          : "border-border bg-neutral-100 dark:bg-neutral-800 text-text-muted"
                      }`}
                    >
                      <Megaphone size={18} />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!item.isRead && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white font-semibold text-[10px] uppercase tracking-wider">
                            New
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                          {item.title}
                        </h4>

                        {/* Status Badge */}
                        {item.isAcknowledged ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={11} />
                            Acknowledged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={11} />
                            Acknowledgement Required
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] font-medium text-text-muted pt-1 flex-wrap">
                        <span>From: <strong className="text-text-primary font-medium">{sender}</strong></span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTimestamp(item.sentAt || item.deliveredAt)}
                        </span>
                        {item.isAcknowledged && item.acknowledgedAt && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Acked: {formatTimestamp(item.acknowledgedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!item.isAcknowledged && (
                      <button
                        type="button"
                        onClick={(e) => handleAcknowledgeBroadcast(item.id, e)}
                        disabled={acknowledgingBroadcastId === item.id}
                        className="
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                          bg-primary-500 hover:bg-primary-600 text-white
                          text-xs font-semibold transition transform active:scale-95
                          disabled:opacity-50 cursor-pointer shadow-2xs
                        "
                      >
                        {acknowledgingBroadcastId === item.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        <span>Acknowledge</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenBroadcastReader(item)}
                      className="
                        flex items-center gap-1 px-3 py-1.5 rounded-lg
                        border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer
                      "
                    >
                      <span>View Full</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Regular Notifications List */
        <div className="space-y-3">
          {isLoading && notifications.length === 0 ? (
            <PageLoadingState message="Loading notifications..." />
          ) : filteredNotifications.length === 0 ? (
            <PageEmptyState
              icon={Bell}
              title="No Notifications Found"
              message="You are all caught up! There are no notifications in this filter category right now."
            />
          ) : (
            filteredNotifications.map((item) => {
              const category = mapTypeToCategory(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() =>
                    handleToggleRead(item.id, item.type, item.isRead, item.title, item.message)
                  }
                  className={`
                    group relative flex items-start justify-between rounded-xl border p-4.5 transition-all duration-200 cursor-pointer shadow-xs bg-surface
                    ${
                      !item.isRead
                        ? "border-primary-500/40 hover:border-primary-500 hover:shadow-md"
                        : "border-border hover:border-neutral-300 dark:hover:border-neutral-700"
                    }
                  `}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Category Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-neutral-50 dark:bg-neutral-800/80 shadow-2xs mt-0.5">
                      {getCategoryIcon(category)}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Unread indicator */}
                        {!item.isRead && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white font-semibold text-[10px] uppercase tracking-wider">
                            New
                          </span>
                        )}

                        <h4
                          className={`text-sm ${
                            !item.isRead ? "text-text-primary font-bold" : "text-text-primary font-semibold"
                          } truncate`}
                        >
                          {item.title}
                        </h4>

                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getCategoryBadgeClass(
                            category
                          )}`}
                        >
                          {category}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed w-full whitespace-pre-line">
                        {item.message}
                      </p>

                      <p className="text-[11px] font-medium text-text-muted pt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {formatTimestamp(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Remove notification"
                      className="
                        opacity-0 group-hover:opacity-100 transition rounded-lg p-1.5
                        text-text-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer
                      "
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Full Message Reader Modal */}
      {selectedBroadcast && (
        <BroadcastReaderModal
          broadcast={selectedBroadcast}
          onClose={() => setSelectedBroadcast(null)}
          onAcknowledged={(acknowledgedId) => {
            handleAcknowledgeBroadcast(acknowledgedId);
          }}
        />
      )}
    </div>
  );
};

export default Notifications;