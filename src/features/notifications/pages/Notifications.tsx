import { useState } from "react";
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
} from "lucide-react";

export type NotificationCategory = "RECRUITMENT" | "LEADS" | "INTERVIEW" | "SYSTEM" | "APPROVAL";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New Candidate Application Received",
    message: "Aarav Sharma submitted an application for Senior Software Engineer (Engineering).",
    category: "RECRUITMENT",
    timestamp: "10 mins ago",
    isRead: false,
  },
  {
    id: "notif-2",
    title: "Interview Scheduled for Today",
    message: "Technical Round scheduled with Priya Patel for Product Manager position at 3:30 PM.",
    category: "INTERVIEW",
    timestamp: "45 mins ago",
    isRead: false,
  },
  {
    id: "notif-3",
    title: "New Lead Assigned",
    message: "High-priority student lead 'Rohan Verma' assigned to your workspace by Manager.",
    category: "LEADS",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "notif-4",
    title: "Interview Evaluation Passed",
    message: "Interviewer submitted 'PASSED' evaluation for Candidate Vikram Singh (Data Analyst).",
    category: "RECRUITMENT",
    timestamp: "3 hours ago",
    isRead: true,
  },
  {
    id: "notif-5",
    title: "Pitch Approval Granted",
    message: "Super Admin approved pitch discount request for College Partnership 'IIT Delhi'.",
    category: "APPROVAL",
    timestamp: "5 hours ago",
    isRead: true,
  },
  {
    id: "notif-6",
    title: "System Maintenance Completed",
    message: "Campus CRM database index optimizations and backup cycle completed successfully.",
    category: "SYSTEM",
    timestamp: "Yesterday at 11:00 PM",
    isRead: true,
  },
  {
    id: "notif-7",
    title: "Follow-Up Reminder",
    message: "Scheduled follow-up phone call with Lead 'Ananya Reddy' regarding Course Admission.",
    category: "LEADS",
    timestamp: "Yesterday at 4:15 PM",
    isRead: true,
  },
  {
    id: "notif-8",
    title: "Job Position Published",
    message: "New position 'HR Operations Executive' (HR Department) was successfully published.",
    category: "RECRUITMENT",
    timestamp: "2 days ago",
    isRead: true,
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | NotificationCategory>("ALL");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: !item.isRead } : item))
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "UNREAD") return !item.isRead;
    return item.category === activeTab;
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
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "INTERVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "LEADS":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "APPROVAL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SYSTEM":
        return "bg-purple-50 text-purple-700 border-purple-200";
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
            Stay updated on recruitment applications, interview evaluations, lead activities, and system notices.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="
              flex items-center gap-1.5 rounded-lg border border-border
              bg-surface px-3.5 py-2 text-xs font-medium text-text-primary
              transition hover:bg-neutral-100 disabled:opacity-40
            "
          >
            <CheckSquare size={15} />
            Mark All as Read
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="
              flex items-center gap-1.5 rounded-lg border border-rose-200
              bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700
              transition hover:bg-rose-100 disabled:opacity-40
            "
          >
            <Trash2 size={15} />
            Clear All
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "ALL"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
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
                : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <Clock size={14} />
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setActiveTab("RECRUITMENT")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "RECRUITMENT"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <Briefcase size={14} />
          Recruitment
        </button>

        <button
          onClick={() => setActiveTab("INTERVIEW")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "INTERVIEW"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <CalendarCheck size={14} />
          Interviews
        </button>

        <button
          onClick={() => setActiveTab("LEADS")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "LEADS"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <Users size={14} />
          Leads
        </button>

        <button
          onClick={() => setActiveTab("SYSTEM")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${
              activeTab === "SYSTEM"
                ? "bg-primary-500 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <ShieldCheck size={14} />
          System
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-text-muted mb-3">
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
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleRead(item.id)}
              className={`
                group relative flex items-start justify-between rounded-xl border p-4.5 transition cursor-pointer
                ${
                  !item.isRead
                    ? "border-primary-200 bg-primary-50/30 hover:border-primary-300"
                    : "border-border bg-surface hover:border-neutral-300 hover:bg-neutral-50/50"
                }
              `}
            >
              <div className="flex items-start gap-3.5 flex-1">
                {/* Category Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white shadow-xs">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Unread indicator dot */}
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                    )}

                    <h4 className={`text-sm font-semibold ${!item.isRead ? "text-text-primary" : "text-text-secondary"}`}>
                      {item.title}
                    </h4>

                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed w-full">
                    {item.message}
                  </p>

                  <p className="text-[11px] font-medium text-text-muted pt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {item.timestamp}
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
                    text-text-muted hover:bg-rose-50 hover:text-rose-600
                  "
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;