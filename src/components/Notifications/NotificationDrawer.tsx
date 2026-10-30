import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckSquare,
  Clock,
  Trash2,
  X,
  Users,
  CalendarCheck,
  ShieldCheck,
  Info,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { ROUTES } from "../../app/router/routes";
import { type NotificationItem, type NotificationType } from "../../services/notificationService";

const getIconForType = (type: NotificationType) => {
  switch (type) {
    case "LEAD":
      return <Users size={16} className="text-indigo-600 dark:text-indigo-400" />;
    case "TPC":
      return <Users size={16} className="text-blue-600 dark:text-blue-400" />;
    case "INTERVIEW":
      return <CalendarCheck size={16} className="text-amber-600 dark:text-amber-400" />;
    case "SYSTEM":
      return <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400" />;
    case "DATA_ASSIGNMENT":
      return <Info size={16} className="text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Info size={16} className="text-text-muted" />;
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

const NotificationDrawer = () => {
  const navigate = useNavigate();
  const {
    isDrawerOpen,
    closeDrawer,
    unreadCount,
    pendingBroadcastCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
    deleteItem,
    isLoading,
  } = useNotification();

  const [shouldRender, setShouldRender] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Smooth slide-in / slide-out lifecycle
  useEffect(() => {
    if (isDrawerOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsMounted(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsMounted(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen]);

  const handleClose = (onComplete?: () => void) => {
    setIsMounted(false);
    setTimeout(() => {
      setShouldRender(false);
      closeDrawer();
      if (onComplete) onComplete();
    }, 300);
  };

  const handleToggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleViewDetails = async (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    const targetRoute = getTargetRouteForType(item.type, item.title, item.message);
    handleClose(() => {
      navigate(targetRoute);
    });
  };

  const handleViewAllPage = () => {
    handleClose(() => {
      navigate(ROUTES.NOTIFICATIONS);
    });
  };

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
      {/* Backdrop with fade animation */}
      <div
        onClick={() => handleClose()}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isMounted ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sliding Panel with smooth right-to-left translate animation */}
      <div
        className={`relative z-10 w-full max-w-md h-full bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMounted ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
                {pendingBroadcastCount > 0 && (
                  <span
                    title={`${pendingBroadcastCount} broadcast(s) awaiting acknowledgement`}
                    className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white"
                  >
                    {pendingBroadcastCount} pending ack
                  </span>
                )}
              </h2>
              <p className="text-xs text-text-secondary">Recent activities & alerts</p>
            </div>
          </div>

          <button
            onClick={() => handleClose()}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:border hover:border-emerald-500/60 transition-all duration-200"
            title="Close notifications"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Toolbar */}
        {recentNotifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/60 border-b border-border text-xs shrink-0">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 font-medium text-text-secondary hover:text-emerald-400 disabled:opacity-40 transition"
            >
              <CheckSquare size={14} />
              Mark All Read
            </button>

            <button
              onClick={handleViewAllPage}
              className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              View All Page
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && recentNotifications.length === 0 ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl border border-border bg-neutral-800/40 animate-pulse"
                />
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8">
              <div className="p-4 rounded-full bg-neutral-800 text-text-muted mb-3">
                <Bell size={28} />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">No Notifications</h4>
              <p className="text-xs text-text-muted max-w-xs mt-1">
                You are all caught up! No recent notifications to show.
              </p>
            </div>
          ) : (
            recentNotifications.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={(e) => handleToggleExpand(item.id, e)}
                  className={`
                    group relative flex flex-col rounded-xl border p-4 transition-all duration-200 cursor-pointer
                    ${
                      !item.isRead
                        ? "border-primary-200 bg-primary-950/30 dark:border-primary-900/50 hover:border-emerald-500/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.12)]"
                        : "border-border bg-surface hover:border-emerald-500/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.12)]"
                    }
                  `}
                >
                  {/* Card Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-2xs mt-0.5">
                        {getIconForType(item.type)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!item.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                          )}
                          <h5
                            className={`text-xs font-semibold ${
                              !item.isRead ? "text-text-primary font-bold" : "text-text-secondary"
                            }`}
                          >
                            {item.title}
                          </h5>
                        </div>

                        {!isExpanded && (
                          <p className="text-xs text-text-secondary line-clamp-2 leading-snug">
                            {item.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action controls: Chevron & Delete */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleExpand(item.id, e)}
                        title={isExpanded ? "Collapse notification" : "Expand notification"}
                        className="p-1 rounded-md text-text-muted hover:text-white hover:border hover:border-emerald-500/60 transition-all duration-200"
                      >
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-emerald-400" />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-rose-400 rounded transition"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Collapsed Timestamp */}
                  {!isExpanded && (
                    <div className="text-[10px] text-text-muted flex items-center gap-1 pt-2 pl-12">
                      <Clock size={10} />
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}

                  {/* Expanded Content Area */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/60 space-y-3 animate-in fade-in duration-200">
                      <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleViewDetails(item, e)}
                          className="
                            inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold
                            bg-primary-500 text-white hover:bg-primary-600 shadow-2xs transition transform active:scale-95
                          "
                        >
                          View Details
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface shrink-0">
          <button
            onClick={handleViewAllPage}
            className="w-full py-2 px-3 rounded-lg border border-border text-xs font-semibold text-text-primary hover:border-emerald-500/60 hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            Go to Notifications Page
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationDrawer;
