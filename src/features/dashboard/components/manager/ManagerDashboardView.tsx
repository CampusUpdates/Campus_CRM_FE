import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Users,
  UserCheck,
  PhoneCall,
  AlertCircle,
  RefreshCw,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
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
import ActivityList from "../ActivityList";


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
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-full bg-neutral-200/60 rounded-xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-200/60 rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-neutral-200/60 rounded-xl"></div>
        <div className="h-72 bg-neutral-200/60 rounded-xl"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-rose-200 bg-rose-50 text-center">
        <AlertCircle size={36} className="text-rose-600 mb-3" />
        <h3 className="text-base font-semibold text-rose-900">Failed to Load Dashboard</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition"
        >
          <RefreshCw size={14} />
          Retry Request
        </button>
      </div>
    );
  }

  const {
    managedTeams = [],
    overview,
    leadsTodayList = [],
    leadPipeline = [],
    memberPerformance = [],
    tpcOverview,
    attentionRequired,
    attendance,
    recentActivity = [],
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
    <div className="space-y-8">
      {/* Dynamic Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Team Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary-600 shrink-0" />
            <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
              Team:
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={loading || isNoTeams}
              className="h-9 rounded-lg border border-border bg-white dark:bg-neutral-800 px-3 text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 cursor-pointer"
            >
              <option value="all" className="text-neutral-900 bg-white dark:text-neutral-100 dark:bg-neutral-800 font-medium">
                {isTL ? "All Assigned Teams" : "All Managed Teams"} ({managedTeams.length})
              </option>
              {managedTeams.map((t) => (
                <option
                  key={t.id}
                  value={t.id.toString()}
                  className="text-neutral-900 bg-white dark:text-neutral-100 dark:bg-neutral-800 font-medium"
                >
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset Selector */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary-600 shrink-0" />
            <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
              Period:
            </label>
            <div className="flex items-center rounded-lg border border-border bg-neutral-100 dark:bg-neutral-800 p-0.5">
              {(["all", "today", "week", "month", "custom"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDateRangePreset(preset)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${dateRangePreset === preset
                      ? "bg-primary-500 text-white shadow-2xs font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                    }`}
                >
                  {preset === "all"
                    ? "All Time"
                    : preset === "today"
                      ? "Today"
                      : preset === "week"
                        ? "7 Days"
                        : preset === "month"
                          ? "This Month"
                          : "Custom"}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          {dateRangePreset === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 rounded-md border border-border bg-white dark:bg-neutral-800 px-2 text-xs text-neutral-900 dark:text-neutral-100 font-medium"
              />
              <span className="text-xs text-text-muted">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 rounded-md border border-border bg-white dark:bg-neutral-800 px-2 text-xs text-neutral-900 dark:text-neutral-100 font-medium"
              />
            </div>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-neutral-50 hover:text-text-primary transition shadow-2xs disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* 1. Leads Today Card */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Leads Today
                </p>
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-text-primary">
                {overview?.leadsToday ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Leads created/added today</p>
            </div>

            {/* 2. Monthly Conversions Card */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Monthly Conversions
                </p>
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-emerald-700">
                {overview?.monthlyConversions ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Admissions done this month</p>
            </div>

            {/* 3. Today's Applications Card */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Today's Applications
                </p>
                <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Activity size={18} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-text-primary">
                {overview?.todaysApplications ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Pitched applications today</p>
            </div>

            {/* 4. Ongoing Processes Card */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Ongoing Processes
                </p>
                <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers size={18} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-purple-700">
                {overview?.ongoingProcesses ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Leads in application to pre-admission stage</p>
            </div>

            {/* 5. LETTER OUT — LAST DATE TODAY */}
            <Link
              to={`${ROUTES.LEADS}?status=LETTER_OUT&date=today`}
              className="rounded-xl border border-border bg-surface p-5 shadow-2xs hover:shadow-xs transition group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary group-hover:text-primary-600 transition">
                  Letter Out — Last Date Today
                </p>
                <div className="h-9 w-9 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-pink-700">
                {overview?.letterOutToday ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-text-muted flex items-center gap-1">
                <span>Leads whose letter-out deadline is today</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0 text-pink-600 shrink-0" />
              </p>
            </Link>

            {/* 6. INTERVIEW SCHEDULED — TODAY */}
            <Link
              to={`${ROUTES.LEADS}?status=INTERVIEW_SCHEDULED&date=today`}
              className="rounded-xl border border-border bg-surface p-5 shadow-2xs hover:shadow-xs transition group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary group-hover:text-primary-600 transition">
                  Interview Scheduled — Today
                </p>
                <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-orange-700">
                {overview?.interviewScheduledToday ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-text-muted flex items-center gap-1">
                <span>Leads with an interview scheduled today</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0 text-orange-600 shrink-0" />
              </p>
            </Link>

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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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
                  <div className="flex items-center rounded-lg border border-border bg-neutral-100 dark:bg-neutral-800 p-0.5">
                    {(["today", "week", "month", "all"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setPipelinePeriod(period)}
                        disabled={pipelineLoading}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${pipelinePeriod === period
                            ? "bg-primary-500 text-white shadow-2xs font-semibold"
                            : "text-text-secondary hover:text-text-primary"
                          }`}
                      >
                        {period === "today"
                          ? "Today"
                          : period === "week"
                            ? "This Week"
                            : period === "month"
                              ? "This Month"
                              : "All Time"}
                      </button>
                    ))}
                  </div>

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
                  <PhoneCall size={16} className="text-purple-600 shrink-0" />
                  <select
                    value={tpcPeriod}
                    onChange={(e) => setTpcPeriod(e.target.value as "today" | "week" | "month" | "all")}
                    disabled={tpcLoading}
                    className="h-8 rounded-lg border border-border bg-white dark:bg-neutral-800 px-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <option value="today" className="text-neutral-900 bg-white dark:text-neutral-100 dark:bg-neutral-800 font-medium">Today</option>
                    <option value="week" className="text-neutral-900 bg-white dark:text-neutral-100 dark:bg-neutral-800 font-medium">This Week</option>
                    <option value="month" className="text-neutral-900 bg-white dark:text-neutral-100 dark:bg-neutral-800 font-medium">This Month</option>
                    <option value="all" className="text-neutral-900 bg-white dark:text-neutral-100 dark:bg-neutral-800 font-medium">All Time</option>
                  </select>
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
                  <label htmlFor="member-period-select" className="text-xs font-semibold text-text-secondary">
                    Period:
                  </label>
                  <select
                    id="member-period-select"
                    value={memberPeriod}
                    onChange={(e) => setMemberPeriod(e.target.value as "today" | "week" | "month" | "all")}
                    disabled={memberLoading || loading}
                    className="h-8 rounded-lg border border-border bg-white dark:bg-neutral-800 px-3 text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {memberPerformance.length} Member(s)
                </span>
              </div>
            </div>

            <div className="relative overflow-x-auto min-h-[160px]">
              {(memberLoading || loading) && (
                <div className="absolute inset-0 bg-surface/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 bg-surface px-3 py-1.5 rounded-md border border-border shadow-xs">
                    <RefreshCw size={14} className="animate-spin text-primary-600" />
                    Updating performance metrics...
                  </div>
                </div>
              )}

              <table className="w-full text-left text-xs">
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

          {/* SECTION 7 & 8 — ATTENTION REQUIRED & TODAY'S ATTENDANCE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* SECTION 8 — ATTENTION REQUIRED CARDS */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Attention Required</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Real database records requiring managerial follow-up.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                  <AlertTriangle size={15} />
                  <span>
                    {(attentionRequired?.uncontactedLeadsCount || 0) +
                      (attentionRequired?.pendingTpcsCount || 0) +
                      (attentionRequired?.pendingPitchesCount || 0) +
                      (attentionRequired?.inactiveMembersCount || 0)}{" "}
                    Alerts
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Uncontacted Leads Card */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Uncontacted Leads
                    </span>
                    <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                      {attentionRequired?.uncontactedLeadsCount || 0}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">Assigned leads with zero logged interactions.</p>
                  <div className="space-y-1 pt-1">
                    {(attentionRequired?.uncontactedLeads || []).map((l) => (
                      <div key={l.id} className="text-xs text-amber-950 flex justify-between font-medium">
                        <span className="truncate max-w-[140px]">{l.name}</span>
                        <span className="text-amber-700 text-[11px] truncate">({l.assignedTo})</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={ROUTES.LEADS}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline"
                  >
                    View Leads <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Pending TPCs Card */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      Pending TPCs
                    </span>
                    <span className="text-xs font-bold bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full">
                      {attentionRequired?.pendingTpcsCount || 0}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-800">Telephonic pitch calls awaiting action.</p>
                  <div className="space-y-1 pt-1">
                    {(attentionRequired?.pendingTpcs || []).map((t) => (
                      <div key={t.id} className="text-xs text-indigo-950 flex justify-between font-medium">
                        <span className="truncate max-w-[140px]">{t.leadName}</span>
                        <span className="text-indigo-700 text-[11px] truncate">({t.assignedTo})</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={ROUTES.TPC}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-900 hover:underline"
                  >
                    View TPCs <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Pending Pitches Card */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                      Pending College Approvals
                    </span>
                    <span className="text-xs font-bold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full">
                      {attentionRequired?.pendingPitchesCount || 0}
                    </span>
                  </div>
                  <p className="text-xs text-purple-800">College pitches awaiting manager review.</p>
                  <div className="space-y-1 pt-1">
                    {(attentionRequired?.pendingPitches || []).map((p) => (
                      <div key={p.id} className="text-xs text-purple-950 flex justify-between font-medium">
                        <span className="truncate max-w-[140px]">{p.leadName}</span>
                        <span className="text-purple-700 text-[11px] truncate">({p.collegeName})</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={ROUTES.PITCH_APPROVALS}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-900 hover:underline"
                  >
                    Review Pitches <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Inactive Members Card */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Inactive Members (7 Days)
                    </span>
                    <span className="text-xs font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full">
                      {attentionRequired?.inactiveMembersCount || 0}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800">Team members with no logged activity past 7 days.</p>
                  <div className="space-y-1 pt-1">
                    {(attentionRequired?.inactiveMembers || []).map((m) => (
                      <div key={m.id} className="text-xs text-rose-950 flex justify-between font-medium">
                        <span>{m.name}</span>
                        <span className="text-rose-700 text-[11px]">No recent log</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 9 — TODAY'S ATTENDANCE SUMMARY */}
            <div className="lg:col-span-1 rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Today's Attendance</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Team members' check-in status.</p>
                </div>
                <Calendar size={16} className="text-emerald-600" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 text-emerald-900">
                  <span className="text-xs font-semibold">Present</span>
                  <span className="text-base font-bold">{attendance?.present ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 text-rose-900">
                  <span className="text-xs font-semibold">Absent</span>
                  <span className="text-base font-bold">{attendance?.absent ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 text-amber-900">
                  <span className="text-xs font-semibold">Half Day</span>
                  <span className="text-base font-bold">{attendance?.halfDay ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 text-indigo-900">
                  <span className="text-xs font-semibold">On Leave</span>
                  <span className="text-base font-bold">{attendance?.leave ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-100 text-neutral-800">
                  <span className="text-xs font-semibold">Unmarked</span>
                  <span className="text-base font-bold">{attendance?.unmarked ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT TEAM ACTIVITY */}
          <div>
            <ActivityList
              title="Recent Team Activity"
              subtitle="Real-time activity logs and logged interactions for managed team members"
              items={recentActivity}
              onRefresh={loadDashboard}
              isLoading={loading}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerDashboardView;
