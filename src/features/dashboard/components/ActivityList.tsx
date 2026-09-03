import { useEffect, useState, useCallback } from "react";
import { Clock3, RefreshCw, Search, Filter } from "lucide-react";
import ActivityItem from "./ActivityItem";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchActivityLogs,
  type ActivityLogItem,
} from "../../../services/activityLogService";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(date.getTime())) return "Recently";
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString();
}

export interface ReusableActivityItem {
  id: string;
  actor?: string;
  description?: string;
  createdAt: string;
  type?: string;
  activity?: string;
  entityType?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    username?: string;
  };
}

interface ActivityListProps {
  title?: string;
  subtitle?: string;
  items?: ReusableActivityItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const ACTIVITY_TYPE_OPTIONS = [
  { label: "All Activity Types", value: "" },
  { label: "Lead Updates", value: "LEAD" },
  { label: "Data Uploads", value: "DATA_UPLOAD" },
  { label: "Data Assignments", value: "DATA_ASSIGNMENT" },
  { label: "TPC Interactions", value: "TPC" },
  { label: "User Management", value: "USER" },
  { label: "Attendance", value: "ATTENDANCE" },
  { label: "Recruitment", value: "RECRUITMENT" },
  { label: "System Actions", value: "SYSTEM" },
];

const ActivityList = ({
  title,
  subtitle,
  items,
  onRefresh,
  isLoading,
}: ActivityListProps) => {
  const { accessToken, user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  const isExternalData = items !== undefined;

  // Determine Role-Based Title & Subtitle
  const roleCode = (user?.roleCode || (user as any)?.role?.name || "").toUpperCase();
  const isProgramAdvisor = roleCode.includes("ADVISOR") || roleCode.includes("PROGRAM");

  const isManager = roleCode.includes("MANAGER");
  const isHR = roleCode.includes("HR") || roleCode.includes("HUMAN");
  const isSuperAdmin = roleCode.includes("SUPER_ADMIN");

  const computedTitle =
    title ||
    (isProgramAdvisor
      ? "My Activity"
      : isManager
      ? "Team Activity"
      : isHR
      ? "HR Activity"
      : isSuperAdmin
      ? "System Activity"
      : "Recent Activities");

  const computedSubtitle =
    subtitle ||
    (isProgramAdvisor
      ? "Latest updates from your personal account"
      : isManager
      ? "Latest activity from your managed team members & account"
      : isHR
      ? "Latest HR and workforce operations logs"
      : isSuperAdmin
      ? "System-wide activity log across all departments"
      : "Latest updates from your account");

  const loadActivities = useCallback(
    async (targetPage: number, isInitial = false) => {
      if (!accessToken || isExternalData) return;

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetchActivityLogs(accessToken, {
          page: targetPage,
          limit: 15,
          search: searchTerm.trim() || undefined,
          activity: selectedActivity || undefined,
        });

        const newLogs = Array.isArray(response?.data) ? response.data : [];
        setActivities((prev) =>
          targetPage === 1 ? newLogs : [...prev, ...newLogs]
        );
        setHasMore(response?.meta?.hasMore ?? false);
        setPage(targetPage);
      } catch (err) {
        console.error("Failed to load activity logs:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken, isExternalData, searchTerm, selectedActivity]
  );

  useEffect(() => {
    if (!isExternalData) {
      loadActivities(1, true);
    }
  }, [loadActivities, isExternalData]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadActivities(page + 1);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      loadActivities(1, true);
    }
  };

  const currentLoading = isExternalData ? (isLoading ?? false) : loading;

  const displayList: ReusableActivityItem[] = isExternalData
    ? items || []
    : activities;

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm h-[42rem] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {computedTitle}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {computedSubtitle}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            title="Refresh activities"
            className="p-2 text-text-muted hover:text-primary-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={currentLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Filter Bar (Only shown when viewing backend activity logs) */}
        {!isExternalData && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-border rounded-lg bg-neutral-50/50 outline-none focus:border-primary-500 transition"
              />
            </div>

            <div className="flex items-center gap-1 min-w-[140px]">
              <Filter size={14} className="text-text-muted shrink-0" />
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-border rounded-lg bg-neutral-50/50 outline-none focus:border-primary-500 transition text-text-secondary"
              >
                {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {currentLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <RefreshCw className="animate-spin" size={18} />
            Loading activities...
          </div>
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <Clock3 className="w-8 h-8 text-text-muted" />
          </div>

          <h3 className="font-semibold text-text-primary">
            No activities found
          </h3>

          <p className="text-sm text-text-secondary text-center mt-2 max-w-sm">
            {searchTerm || selectedActivity
              ? "No activities matched your search filters."
              : "Activities matching your role permissions will appear here automatically."}
          </p>
        </div>
      ) : (
        <>
          {/* Scrollable Activities */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="divide-y divide-border">
              {displayList.map((activity) => {
                const userFullName = activity.actor
                  ? activity.actor
                  : activity.user
                  ? [activity.user.firstName, activity.user.lastName]
                      .filter(Boolean)
                      .join(" ") || activity.user.username
                  : "System";

                const titleText = activity.description || `${activity.activity || "System"} update`;
                const descriptionText = activity.actor
                  ? `${activity.actor}`
                  : `Action performed by ${userFullName}${activity.entityType ? ` (${activity.entityType})` : ""}`;
                const itemType = activity.type || activity.activity || "LEAD";

                return (
                  <ActivityItem
                    key={activity.id}
                    title={titleText}
                    description={descriptionText}
                    time={formatRelativeTime(activity.createdAt)}
                    type={itemType}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer */}
          {!isExternalData && hasMore && (
            <div className="border-t border-border p-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityList;