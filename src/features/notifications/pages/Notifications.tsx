import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
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
} from "lucide-react";
import { useNotification } from "../../../context/NotificationContext";
import { ROUTES } from "../../../app/router/routes";
import { type NotificationType } from "../../../services/notificationService";

export type NotificationCategory = "RECRUITMENT" | "LEADS" | "INTERVIEW" | "SYSTEM" | "APPROVAL";

const mapTypeToCategory = (type: NotificationType): NotificationCategory => {
  switch (type) {
    case "LEAD":
    case "TPC":
      return "LEADS";
    case "INTERVIEW":
      return "INTERVIEW";
    case "SYSTEM":
      return "SYSTEM";
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
  const titleLower = (title || "").toLowerCase();
  const msgLower = (message || "").toLowerCase();

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
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteItem,
    refreshNotifications,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | NotificationCategory>("ALL");
  const [error, setError] = useState<string | null>(null);

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

  const filteredNotifications = notifications.filter((item) => {
    const category = mapTypeToCategory(item.type);
    if (activeTab === "ALL") return true;
    if (activeTab === "UNREAD") return !item.isRead;
    return category === activeTab;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "RECRUITMENT":
        return <UserPlus size={18} className="text-blue-600" />;
      case "INTERVIEW":
        return <CalendarCheck size={18} className="text-amber-600" />;
      case "LEADS":
        return <Users size={18} className="text-indigo-600" />;
      case "APPROVAL":
        return <CheckCircle2 size={18} className="text-emerald-600" />;
      case "SYSTEM":
        return <ShieldCheck size={18} className="text-purple-600" />;
      default:
        return <Info size={18} className="text-text-muted" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationCategory) => {
    switch (category) {
      case "RECRUITMENT":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      case "INTERVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "LEADS":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
      case "APPROVAL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "SYSTEM":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Stay updated on lead assignments, TPC tasks, claim requests, college approvals, and system notices.
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
              transition hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40
            "
          >
            <CheckSquare size={15} />
            Mark All as Read
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="
              flex items-center gap-1.5 rounded-lg border border-rose-200
              bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700
              dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900
              transition hover:bg-rose-100 disabled:opacity-40
            "
          >
            <Trash2 size={15} />
            Clear All
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              refreshNotifications();
            }}
            className="font-semibold underline hover:text-rose-900"
          >
            Try again
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "ALL"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
            }
          `}
        >
          <Bell size={14} />
          All ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("UNREAD")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "UNREAD"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
            }
          `}
        >
          <Clock size={14} />
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setActiveTab("LEADS")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "LEADS"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
            }
          `}
        >
          <Users size={14} />
          Leads
        </button>

        <button
          onClick={() => setActiveTab("INTERVIEW")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "INTERVIEW"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
            }
          `}
        >
          <CalendarCheck size={14} />
          Interviews
        </button>

        <button
          onClick={() => setActiveTab("RECRUITMENT")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "RECRUITMENT"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
            }
          `}
        >
          <Briefcase size={14} />
          Recruitment
        </button>

        <button
          onClick={() => setActiveTab("SYSTEM")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "SYSTEM"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
            }
          `}
        >
          <ShieldCheck size={14} />
          System
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-border bg-surface/50 animate-pulse p-4 flex items-center gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-text-muted mb-3">
              <Bell size={24} />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              No Notifications Found
            </h3>
            <p className="mt-1 text-xs text-text-muted max-w-sm">
              You are all caught up! There are no notifications in this filter category right now.
            </p>
          </div>
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
                  group relative flex items-start justify-between rounded-xl border p-4.5 transition cursor-pointer
                  ${
                    !item.isRead
                      ? "border-primary-200 bg-primary-50/30 dark:bg-primary-950/20 dark:border-primary-900/60 hover:border-primary-300"
                      : "border-border bg-surface hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40"
                  }
                `}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Category Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white dark:bg-neutral-800 shadow-xs">
                    {getCategoryIcon(category)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Unread indicator dot */}
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                      )}

                      <h4
                        className={`text-sm font-semibold ${
                          !item.isRead ? "text-text-primary font-bold" : "text-text-secondary"
                        }`}
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

                    <p className="text-xs text-text-secondary leading-relaxed w-full">
                      {item.message}
                    </p>

                    <p className="text-[11px] font-medium text-text-muted pt-1 flex items-center gap-1">
                      <Clock size={12} />
                      {formatTimestamp(item.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Dismiss Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Remove notification"
                    className="
                      opacity-0 group-hover:opacity-100 transition rounded-lg p-1.5
                      text-text-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40
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
    </div>
  );
};

export default Notifications;