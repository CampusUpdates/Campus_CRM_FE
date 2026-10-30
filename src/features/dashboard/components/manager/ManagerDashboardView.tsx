import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Users,
  UserCheck,
  PhoneCall,
  RefreshCw,
  Calendar,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Activity,
  Layers,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchManagerDashboardStats,
  type ManagerDashboardData,
} from "../../../../services/managerDashboardService";
import { ROUTES } from "../../../../app/router/routes";
import { DashboardDropdown, PageLoadingState, PageErrorState } from "../../../../components/common";
import StudentMetricDrawer from "../StudentMetricDrawer";
import TeamMemberCallPerformanceTable from "../TeamMemberCallPerformanceTable";


// Utility function for relative time string
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getStatusBadgeStyle(statusName?: string): string {
  const name = (statusName || "LEAD").toUpperCase();
  if (name.includes("ADMISSION") || name.includes("ENROLLED") || name.includes("HIRED")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (name.includes("LETTER_OUT") || name.includes("OFFER")) {
    return "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800";
  }
  if (name.includes("INTERVIEW_DONE") || name.includes("PASSED")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
  }
  if (name.includes("INTERVIEW_SCHEDULED") || name.includes("SCHEDULED")) {
    return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
  }
  if (name.includes("APPLICATION") || name.includes("APPLIED")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }
  if (name.includes("CLOSE") || name.includes("CANCEL") || name.includes("REJECT")) {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
  }
  return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
}

type ManagerDashboardViewProps = {
  isTeamLeadView?: boolean;
};

const ManagerDashboardView = ({ isTeamLeadView }: ManagerDashboardViewProps) => {
  const { accessToken, user } = useAuth();
  const isTL = isTeamLeadView || user?.roleCode === "TEAM_LEAD";


  // Filters State
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [dateRangePreset, setDateRangePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Pipeline Specific Period Filter State (Default: Today)
  const [pipelinePeriod, setPipelinePeriod] = useState<"today" | "week" | "month" | "all">("today");
  const [pipelineLoading, setPipelineLoading] = useState<boolean>(false);

  // TPC Specific Period Filter State (Default: Today)
  const [tpcPeriod, setTpcPeriod] = useState<"today" | "week" | "month" | "all">("today");
  const [tpcLoading, setTpcLoading] = useState<boolean>(false);

  // Member Performance Specific Period Filter State (Default: Today)
  const [memberPeriod, setMemberPeriod] = useState<"today" | "week" | "month" | "all">("today");
  const [memberLoading, setMemberLoading] = useState<boolean>(false);

  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Right-Side Student Metric Drawer State
  const [selectedDrawerMetric, setSelectedDrawerMetric] = useState<{
    metric: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
  } | null>(null);

  // Compute startDate & endDate strings based on preset
  const getFilterDates = useCallback(() => {
    if (dateRangePreset === "custom") {
      return { startDate: customStartDate || undefined, endDate: customEndDate || undefined };
    }
    const now = new Date();
    if (dateRangePreset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      return { startDate: todayStr, endDate: todayStr };
    }
    if (dateRangePreset === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      return { startDate: startOfWeek.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
    }
    if (dateRangePreset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateRangePreset, customStartDate, customEndDate]);

  const loadDashboard = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setPipelineLoading(true);
    setTpcLoading(true);
    setMemberLoading(true);
    setError(null);
    try {
      const dates = getFilterDates();
      const res = await fetchManagerDashboardStats(accessToken, {
        teamId: selectedTeamId,
        startDate: dates.startDate,
        endDate: dates.endDate,
        pipelinePeriod: pipelinePeriod,
        tpcPeriod: tpcPeriod,
        memberPeriod: memberPeriod,
      });
      setData(res);
    } catch (err: unknown) {
      console.error("Failed to load manager dashboard:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load manager dashboard metrics.");
      }
    } finally {
      setLoading(false);
      setPipelineLoading(false);
      setTpcLoading(false);
      setMemberLoading(false);
    }
  }, [accessToken, selectedTeamId, getFilterDates, pipelinePeriod, tpcPeriod, memberPeriod]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-8">
        <PageLoadingState
          message="Loading Manager Dashboard..."
          description="Gathering team performance, lead pipeline, and assignment metrics"
          minHeight="min-h-[420px]"
        />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-8">
        <PageErrorState
          title="Failed to Load Manager Dashboard"
          message={error}
          onRetry={loadDashboard}
          minHeight="min-h-[380px]"
        />
      </div>
    );
  }

  const {
    managedTeams = [],
    overview,
    leadsTodayList = [],
    leadPipeline = [],
    memberPerformance = [],
    advisorPerformance = [],
    tpcOverview,
  } = data || {};

  const isNoTeams = managedTeams.length === 0;

  // Pie chart and status breakdown data for TPC
  const allTpcStatuses = [
    { name: "Pending", value: tpcOverview?.byStatus.PENDING || 0, color: "#6366F1" },
    { name: "Completed", value: tpcOverview?.byStatus.COMPLETED || 0, color: "#10B981" },
    { name: "No Reply", value: tpcOverview?.byStatus.NO_REPLY || 0, color: "#F59E0B" },
    { name: "Not Interested", value: tpcOverview?.byStatus.NOT_INTERESTED || 0, color: "#EF4444" },
    { name: "Cancelled", value: tpcOverview?.byStatus.CANCELLED || 0, color: "#9CA3AF" },
  ];
  const tpcPieData = allTpcStatuses.filter((item) => item.value > 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Dashboard Page Header */}
      <div className="border-b border-border pb-4 sm:pb-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-text-primary">
              Dashboard
            </h1>
            <button
              onClick={loadDashboard}
              disabled={loading}
              title="Refresh dashboard data"
              aria-label="Refresh dashboard data"
              className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
            {isTL
              ? "Team Lead overview of assigned program advisors, team performance, and call activity."
              : "Manager overview of managed teams, member performance, and call activity."}
          </p>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-border bg-surface shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
          {/* Team Filter Dropdown */}
          <div className="flex items-center gap-2">
            <DashboardDropdown
              label="Team:"
              icon={Shield}
              value={selectedTeamId}
              onChange={(val) => setSelectedTeamId(val)}
              disabled={loading || isNoTeams}
              options={[
                {
                  value: "all",
                  label: `${isTL ? "All Assigned Teams" : "All Managed Teams"} (${managedTeams.length})`,
                },
                ...managedTeams.map((t) => ({
                  value: t.id.toString(),
                  label: t.name,
                })),
              ]}
              minWidth="180px"
            />
          </div>

          {/* Date Range Preset Selector */}
          <div className="flex items-center gap-2">
            <DashboardDropdown
              label="Period:"
              icon={Calendar}
              value={dateRangePreset}
              onChange={(val) => setDateRangePreset(val as "all" | "today" | "week" | "month" | "custom")}
              disabled={loading}
              options={[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "week", label: "7 Days" },
                { value: "month", label: "This Month" },
                { value: "custom", label: "Custom" },
              ]}
              minWidth="140px"
            />
          </div>

          {/* Custom Date Inputs */}
          {dateRangePreset === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium cursor-pointer"
              />
              <span className="text-xs text-text-muted font-medium">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 h-9 text-xs font-semibold text-text-primary hover:bg-surface-hover hover:border-neutral-300 dark:hover:border-slate-600 transition shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : "text-primary-600"} />
          Refresh
        </button>
      </div>

      {/* Empty State when manager has no teams */}
      {isNoTeams ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-dashed border-border bg-surface text-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4 text-primary-600">
            <Shield size={28} />
          </div>
          <h3 className="text-lg font-bold text-text-primary">No Managed Teams Found</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-md">
            You are not currently assigned as manager for any active team. Contact HR to be assigned as team manager.
          </p>
          <Link
            to={ROUTES.TEAMS}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-600 transition shadow-sm"
          >
            Go to Teams Management
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          {/* TOP SECTION — OVERVIEW / STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">

            {/* 1. Leads Today Card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedDrawerMetric({
                  metric: "LEADS_TODAY",
                  title: "Leads Today",
                  description: "Leads created/posted today by team members",
                  icon: <TrendingUp size={20} />,
                })
              }
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                setSelectedDrawerMetric({
                  metric: "LEADS_TODAY",
                  title: "Leads Today",
                  description: "Leads created/posted today by team members",
                  icon: <TrendingUp size={20} />,
                })
              }
              className="group cursor-pointer rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-blue-600 transition truncate">
                  Leads Today
                </p>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
                <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-text-primary group-hover:text-blue-600 transition">
                  {overview?.leadsToday ?? 0}
                </p>
                <span className="text-[11px] sm:text-xs font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  View Students <ArrowRight size={12} className="-translate-x-1 group-hover:translate-x-0 transition" />
                </span>
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">Leads created/added today • Click to view records</p>
            </div>

            {/* 2. Monthly Conversions Card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedDrawerMetric({
                  metric: "MONTHLY_CONVERSIONS",
                  title: "Monthly Conversions",
                  description: "Admissions completed this month",
                  icon: <UserCheck size={20} />,
                })
              }
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                setSelectedDrawerMetric({
                  metric: "MONTHLY_CONVERSIONS",
                  title: "Monthly Conversions",
                  description: "Admissions completed this month",
                  icon: <UserCheck size={20} />,
                })
              }
              className="group cursor-pointer rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-emerald-600 transition truncate">
                  Monthly Conversions
                </p>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                  <UserCheck size={16} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
                <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-emerald-700">
                  {overview?.monthlyConversions ?? 0}
                </p>
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  View Students <ArrowRight size={12} className="-translate-x-1 group-hover:translate-x-0 transition" />
                </span>
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">Admissions done this month • Click to view records</p>
            </div>

            {/* 3. Today's Applications Card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedDrawerMetric({
                  metric: "TODAYS_APPLICATIONS",
                  title: "Today's Applications",
                  description: "Applications pitched today",
                  icon: <Activity size={20} />,
                })
              }
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                setSelectedDrawerMetric({
                  metric: "TODAYS_APPLICATIONS",
                  title: "Today's Applications",
                  description: "Applications pitched today",
                  icon: <Activity size={20} />,
                })
              }
              className="group cursor-pointer rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-amber-600 transition truncate">
                  Today's Applications
                </p>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                  <Activity size={16} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
                <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-text-primary group-hover:text-amber-600 transition">
                  {overview?.todaysApplications ?? 0}
                </p>
                <span className="text-[11px] sm:text-xs font-semibold text-amber-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  View Students <ArrowRight size={12} className="-translate-x-1 group-hover:translate-x-0 transition" />
                </span>
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">Pitched applications today • Click to view records</p>
            </div>

            {/* 4. Ongoing Processes Card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedDrawerMetric({
                  metric: "ONGOING_PROCESSES",
                  title: "Ongoing Processes",
                  description: "Leads in application to pre-admission stage",
                  icon: <Layers size={20} />,
                })
              }
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                setSelectedDrawerMetric({
                  metric: "ONGOING_PROCESSES",
                  title: "Ongoing Processes",
                  description: "Leads in application to pre-admission stage",
                  icon: <Layers size={20} />,
                })
              }
              className="group cursor-pointer rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-purple-600 transition truncate">
                  Ongoing Processes
                </p>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                  <Layers size={16} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
                <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-purple-700">
                  {overview?.ongoingProcesses ?? 0}
                </p>
                <span className="text-[11px] sm:text-xs font-semibold text-purple-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  View Students <ArrowRight size={12} className="-translate-x-1 group-hover:translate-x-0 transition" />
                </span>
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">Leads in application to pre-admission stage • Click to view records</p>
            </div>

            {/* 5. LETTER OUT — LAST DATE TODAY */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedDrawerMetric({
                  metric: "LETTER_OUT_TODAY",
                  title: "Letter Out — Last Date Today",
                  description: "Leads whose letter-out deadline is today",
                  icon: <FileText size={20} />,
                })
              }
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                setSelectedDrawerMetric({
                  metric: "LETTER_OUT_TODAY",
                  title: "Letter Out — Last Date Today",
                  description: "Leads whose letter-out deadline is today",
                  icon: <FileText size={20} />,
                })
              }
              className="group cursor-pointer rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-pink-600 transition truncate">
                  Letter Out — Last Date Today
                </p>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                  <FileText size={16} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
                <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-pink-700">
                  {overview?.letterOutToday ?? 0}
                </p>
                <span className="text-[11px] sm:text-xs font-semibold text-pink-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  View Students <ArrowRight size={12} className="-translate-x-1 group-hover:translate-x-0 transition" />
                </span>
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">
                Leads whose letter-out deadline is today • Click to view records
              </p>
            </div>

            {/* 6. INTERVIEW SCHEDULED — TODAY */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedDrawerMetric({
                  metric: "INTERVIEW_SCHEDULED_TODAY",
                  title: "Interview Scheduled — Today",
                  description: "Leads with an interview scheduled today",
                  icon: <Calendar size={20} />,
                })
              }
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                setSelectedDrawerMetric({
                  metric: "INTERVIEW_SCHEDULED_TODAY",
                  title: "Interview Scheduled — Today",
                  description: "Leads with an interview scheduled today",
                  icon: <Calendar size={20} />,
                })
              }
              className="group cursor-pointer rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-orange-600 transition truncate">
                  Interview Scheduled — Today
                </p>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
                <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-orange-700">
                  {overview?.interviewScheduledToday ?? 0}
                </p>
                <span className="text-[11px] sm:text-xs font-semibold text-orange-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  View Students <ArrowRight size={12} className="-translate-x-1 group-hover:translate-x-0 transition" />
                </span>
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">
                Leads with an interview scheduled today • Click to view records
              </p>
            </div>

          </div>

          {/* SECTION FOLLOWING STAT CARDS — LEADS TODAY LIST */}
          <div className="rounded-xl border border-border bg-surface shadow-2xs overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary">Leads Today</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  All leads posted and created today by your team members.
                </p>
              </div>
              <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-md">
                {leadsTodayList.length} Lead(s) Posted Today
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Lead Name</th>
                    <th className="px-6 py-3.5">Contact Info</th>
                    <th className="px-6 py-3.5">Source / Course</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Posted By</th>
                    <th className="px-6 py-3.5">Time Posted</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leadsTodayList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-text-muted">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users size={32} className="text-neutral-300" />
                          <p className="font-semibold text-text-secondary">No leads posted today</p>
                          <p className="text-[11px] text-text-muted">No new leads have been created or posted by team members today yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leadsTodayList.map((lead) => {
                      const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();
                      return (
                        <tr key={lead.id} className="hover:bg-neutral-50/50 transition">
                          <td className="px-6 py-4 font-semibold text-text-primary">
                            <Link to={`/leads/${lead.id}`} className="hover:text-primary-600 transition">
                              {fullName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            <div>{lead.phone}</div>
                            {lead.email && <div className="text-[11px] text-text-muted truncate max-w-[180px]">{lead.email}</div>}
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            <div className="font-medium text-text-primary">{lead.source}</div>
                            {lead.courseInterested && (
                              <span className="text-[11px] text-text-muted font-normal">
                                {lead.courseInterested}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusBadgeStyle(lead.statusName)}`}>
                              {lead.statusName.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-text-primary">
                            {lead.postedBy}
                          </td>
                          <td className="px-6 py-4 text-text-muted">
                            {formatRelativeTime(lead.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/leads/${lead.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition"
                            >
                              View Lead →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>



          {/* SECTION 3 — LEAD PIPELINE STAGES & CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Lead Pipeline Stages</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Real-time distribution of leads across database status pipeline.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Period Filter for Lead Pipeline */}
                  <DashboardDropdown
                    value={pipelinePeriod}
                    onChange={(val) => setPipelinePeriod(val as "today" | "week" | "month" | "all")}
                    disabled={pipelineLoading}
                    options={[
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                      { value: "all", label: "All Time" },
                    ]}
                    minWidth="120px"
                  />

                  <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium bg-neutral-50 dark:bg-neutral-800/60 px-2.5 py-1 rounded-md border border-border">
                    <BarChart2 size={16} className="text-primary-600" />
                    <span>{leadPipeline.reduce((sum, stage) => sum + (stage.count || 0), 0)} Total Leads</span>
                  </div>
                </div>
              </div>

              {/* Chart & Stage Cards Container with Loading Overlay */}
              <div className="relative min-h-[280px]">
                {pipelineLoading && (
                  <div className="absolute inset-0 bg-surface/70 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 bg-surface px-3 py-1.5 rounded-md border border-border shadow-xs">
                      <RefreshCw size={14} className="animate-spin text-primary-600" />
                      Updating pipeline data...
                    </div>
                  </div>
                )}

                {/* Recharts Bar Chart */}
                {leadPipeline.length > 0 && (
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadPipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: any) => [`${value} Leads`, "Count"]}
                          contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {leadPipeline.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || "#6366F1"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Grid of Stage Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {leadPipeline.map((stage) => (
                    <div
                      key={stage.id}
                      className="p-3 rounded-lg border border-border bg-neutral-50/50 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: stage.color || "#6366F1" }}
                        ></span>
                        <span className="text-xs font-medium text-text-secondary truncate">
                          {stage.name}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-bold text-text-primary">{stage.count}</span>
                        <span className="text-[11px] font-semibold text-text-muted">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 6 — TPC OVERVIEW CHART & SUMMARY */}
            <div className="lg:col-span-1 rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4 gap-2">
                <h2 className="text-base font-bold text-text-primary">TPC Status Distribution</h2>
                <div className="flex items-center gap-2">
                  <DashboardDropdown
                    icon={PhoneCall}
                    value={tpcPeriod}
                    onChange={(val) => setTpcPeriod(val as "today" | "week" | "month" | "all")}
                    disabled={tpcLoading}
                    options={[
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                      { value: "all", label: "All Time" },
                    ]}
                    minWidth="120px"
                  />
                </div>
              </div>

              <div className="relative min-h-[220px]">
                {tpcLoading && (
                  <div className="absolute inset-0 bg-surface/70 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 bg-surface px-3 py-1.5 rounded-md border border-border shadow-xs">
                      <RefreshCw size={14} className="animate-spin text-primary-600" />
                      Updating TPCs...
                    </div>
                  </div>
                )}

                {tpcPieData.length > 0 ? (
                  <div className="h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tpcPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {tpcPieData.map((entry, index) => (
                            <Cell key={`cell-tpc-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any) => [`${val} Calls`, "Count"]}
                          contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-text-muted text-center px-4">
                    No TPC records found for the selected period.
                  </div>
                )}

                {/* TPC Legend List */}
                <div className="space-y-2 pt-2 border-t border-border">
                  {allTpcStatuses.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-text-secondary font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TEAM MEMBER CALL PERFORMANCE SECTION */}
          <TeamMemberCallPerformanceTable data={advisorPerformance} />

          {/* SECTION 4 & 5 — MEMBER PERFORMANCE & DISTRIBUTION TABLE */}
          <div className="rounded-xl border border-border bg-surface shadow-2xs overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Member Performance & Distribution</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Detailed activity and performance for your team members.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Single Period Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <DashboardDropdown
                    label="Period:"
                    id="member-period-select"
                    value={memberPeriod}
                    onChange={(val) => setMemberPeriod(val as "today" | "week" | "month" | "all")}
                    disabled={memberLoading || loading}
                    options={[
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                      { value: "all", label: "All Time" },
                    ]}
                    minWidth="125px"
                  />
                </div>

                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {memberPerformance.length} Member(s)
                </span>
              </div>
            </div>

            <div className="relative overflow-x-auto custom-scrollbar min-h-[160px]">
              {(memberLoading || loading) && (
                <div className="absolute inset-0 bg-surface/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 bg-surface px-3 py-1.5 rounded-md border border-border shadow-xs">
                    <RefreshCw size={14} className="animate-spin text-primary-600" />
                    Updating performance metrics...
                  </div>
                </div>
              )}

              <table className="w-full min-w-[700px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-neutral-50/80 dark:bg-neutral-800/50 text-text-secondary font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-3.5">Member</th>
                    <th className="px-6 py-3.5">Leads</th>
                    <th className="px-6 py-3.5">Conversions</th>
                    <th className="px-6 py-3.5">TPC Assigned</th>
                    <th className="px-6 py-3.5">TPC Attempted</th>
                    <th className="px-6 py-3.5">Total Calls</th>
                    <th className="px-6 py-3.5">Last Activity</th>
                    <th className="px-6 py-3.5 text-center">Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {memberPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-text-muted">
                        No team members found for this selection.
                      </td>
                    </tr>
                  ) : (
                    memberPerformance.map((m) => {
                      const fullName = `${m.firstName} ${m.lastName || ""}`.trim();
                      const lastActivityStr = m.lastActivityAt
                        ? formatRelativeTime(m.lastActivityAt)
                        : "No activity";

                      return (
                        <tr key={m.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition">
                          <td className="px-6 py-4 font-semibold text-text-primary">
                            <div>
                              <p className="font-semibold text-text-primary">{fullName}</p>
                              <p className="text-[11px] text-text-muted font-normal">{m.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-text-primary">
                            {m.assignedLeadsCount}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {m.convertedLeadsCount}
                          </td>
                          <td className="px-6 py-4 font-medium text-purple-700 dark:text-purple-400">
                            {m.tpcAssignedCount ?? m.tpcsCount}
                          </td>
                          <td className="px-6 py-4 font-medium text-blue-700 dark:text-blue-400">
                            {m.tpcAttemptedCount ?? 0}
                          </td>
                          <td className="px-6 py-4 font-bold text-text-primary">
                            {m.totalCallsCount ?? m.interactionsCount}
                          </td>
                          <td className="px-6 py-4 text-text-muted">
                            {lastActivityStr}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {m.isDone ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs shadow-2xs">
                                ✓
                              </span>
                            ) : (
                              <span className="text-text-muted text-xs font-medium">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

      {/* Right-Side Student Details Drawer */}
      <StudentMetricDrawer
        isOpen={Boolean(selectedDrawerMetric)}
        onClose={() => setSelectedDrawerMetric(null)}
        metric={selectedDrawerMetric?.metric || null}
        metricTitle={selectedDrawerMetric?.title || ""}
        metricDescription={selectedDrawerMetric?.description}
        metricIcon={selectedDrawerMetric?.icon}
        token={accessToken}
        teamId={selectedTeamId}
      />
    </div>
  );
};

export default ManagerDashboardView;
