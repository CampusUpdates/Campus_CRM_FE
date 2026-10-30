import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  Clock,
  Database,
  ArrowRight,
  RefreshCw,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileCheck,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { getCompactPageNumbers } from "../../../../utils/paginationUtils";
import { useAuth } from "../../../../context/AuthContext";
import { ROUTES } from "../../../../app/router/routes";
import {
  fetchSuperAdminDashboardStats,
  type SuperAdminDashboardData,
} from "../../../../services/superAdminDashboardService";
import StudentMetricDrawer from "../StudentMetricDrawer";
import TeamMemberCallPerformanceTable from "../TeamMemberCallPerformanceTable";
import { PageLoadingState, PageErrorState } from "../../../../components/common";

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "Not Available";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Not Available";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isTodayDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const SuperAdminDashboardView = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);

  // Right-Side Student Details Drawer State
  const [selectedDrawerMetric, setSelectedDrawerMetric] = useState<{
    metric: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
  } | null>(null);
  const ACTIVITY_PAGE_SIZE = 5;

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!accessToken) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await fetchSuperAdminDashboardStats(accessToken);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load Super Admin dashboard:", err);
      if (!isSilent) setError(err.message || "Failed to load dashboard metrics");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadDashboard(false);
    const timer = setInterval(() => {
      loadDashboard(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  // Dynamic Retained stage calculation for Lead Pipeline Stages chart: Retained = Admission Done - Cancelled
  // Declared at top level above any early returns to satisfy React Rules of Hooks
  const chartPipeline = useMemo(() => {
    const leadPipeline = data?.leadPipeline || [];
    if (!leadPipeline || leadPipeline.length === 0) return [];

    const admissionDoneStage = leadPipeline.find(
      (s) =>
        s.name?.toUpperCase() === "ADMISSION_DONE" ||
        s.name?.toUpperCase() === "ADMISSION DONE" ||
        s.name?.toUpperCase() === "ADMISSION"
    );
    const cancelledStage = leadPipeline.find(
      (s) =>
        s.name?.toUpperCase() === "CANCELLED" ||
        s.name?.toUpperCase() === "CANCELED"
    );

    const admissionDoneCount = admissionDoneStage?.count || 0;
    const cancelledCount = cancelledStage?.count || 0;
    const retainedCount = Math.max(0, admissionDoneCount - cancelledCount);

    const totalLeads = leadPipeline.reduce((sum, s) => sum + (s.count || 0), 0);
    const percentage = totalLeads > 0 ? Math.round((retainedCount / totalLeads) * 100) : 0;

    const retainedStage = {
      id: "retained" as any,
      name: "Retained",
      color: "#0D9488",
      description: "Admissions retained after cancellations",
      count: retainedCount,
      percentage,
    };

    return [...leadPipeline, retainedStage];
  }, [data?.leadPipeline]);


  if (loading && !data) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-8">
        <PageLoadingState
          message="Loading Super Admin Dashboard..."
          description="Gathering live metrics across leads, calls, attendance, and admissions"
          minHeight="min-h-[420px]"
        />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-8">
        <PageErrorState
          title="Failed to Load Super Admin Dashboard"
          message={error}
          onRetry={() => loadDashboard()}
          minHeight="min-h-[380px]"
        />
      </div>
    );
  }

  const {
    kpis = {
      leadsTodayCount: 0,
      callsTodayCount: 0,
      attendanceTotal: 0,
      attendancePresent: 0,
      attendanceAbsent: 0,
      attendanceLeave: 0,
      interviewsTodayCount: 0,
      interviewsScheduledCount: 0,
      interviewsCompletedCount: 0,
      interviewsPendingCount: 0,
      selectionLettersTodayCount: 0,
      admissionsDueTodayCount: 0,
      availableDataCount: 0,
      dataUploadedTodayCount: 0,
      expiredDataCount: 0,
      activeAssignmentsCount: 0,
    },
    dailyTeamReport = [],
    advisorPerformance = [],
    leadPipeline = [],
    interviewsList = [],
    recentActivity = [],
  } = data || {};

  // Strictly filter interviewsList to only students with interviews scheduled for today's calendar date
  const todaysInterviewsList = interviewsList.filter((i) => isTodayDate(i.interviewTime));
  const todaysInterviewsCount = todaysInterviewsList.length || kpis.interviewsTodayCount || 0;
  const todaysSchCount = todaysInterviewsList.filter((i) => i.status === "SCHEDULED").length;
  const todaysDoneCount = todaysInterviewsList.filter((i) => i.status === "COMPLETED" || i.result === "PASSED" || i.result === "FAILED").length;
  const todaysPendCount = todaysInterviewsList.filter((i) => i.result === "PENDING" || i.status === "PENDING").length;

  const totalActivityPages = Math.ceil(recentActivity.length / ACTIVITY_PAGE_SIZE) || 1;
  const currentActivityPage = Math.min(activityPage, totalActivityPages);
  const paginatedActivity = recentActivity.slice(
    (currentActivityPage - 1) * ACTIVITY_PAGE_SIZE,
    currentActivityPage * ACTIVITY_PAGE_SIZE
  );

  const handleActivityRowClick = (item: { entityType?: string; entityId?: string }) => {
    const type = (item.entityType || "").toUpperCase();
    if (type.includes("LEAD")) {
      navigate(`${ROUTES.LEADS}`);
    } else if (type.includes("ATTENDANCE")) {
      navigate(`${ROUTES.ATTENDANCE}`);
    } else if (type.includes("DATA")) {
      navigate(`${ROUTES.DATA_ASSIGNMENT}`);
    } else if (type.includes("TPC")) {
      navigate(`${ROUTES.TPC}`);
    } else if (type.includes("INTERVIEW") || type.includes("CANDIDATE")) {
      navigate(`${ROUTES.RECRUITMENT}`);
    } else {
      navigate(`${ROUTES.LEADS}`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Dashboard Page Header */}
      <div className="border-b border-border pb-4 sm:pb-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-text-primary">
              Dashboard
            </h1>
            <button
              onClick={() => loadDashboard()}
              disabled={loading}
              title="Refresh dashboard data"
              aria-label="Refresh dashboard data"
              className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
            Overview of team performance, metrics, call activity, and lead status.
          </p>
        </div>
      </div>

      {/* 1. TOP INTERACTIVE KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">

        {/* 1. LEADS TODAY KPI CARD */}
        <div
          onClick={() =>
            setSelectedDrawerMetric({
              metric: "LEADS_TODAY",
              title: "Leads Today",
              description: "All leads created today across the CRM",
              icon: <TrendingUp size={20} />,
            })
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            setSelectedDrawerMetric({
              metric: "LEADS_TODAY",
              title: "Leads Today",
              description: "All leads created today across the CRM",
              icon: <TrendingUp size={20} />,
            })
          }
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary truncate">
              Leads Today
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center group-hover:text-white transition shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
            <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-text-primary group-hover:text-primary-600 transition">
              {kpis.leadsTodayCount}
            </p>
            <span className="text-[11px] sm:text-xs font-semibold text-primary-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              View Students <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">
            Created today • Click to view records
          </p>
        </div>

        {/* 2. CALLS TODAY KPI CARD */}
        <div
          onClick={() => navigate(`${ROUTES.CALLS}?date=today`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && navigate(`${ROUTES.CALLS}?date=today`)
          }
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary truncate">
              Calls Today
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
              <PhoneCall size={16} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
            <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-emerald-700">
              {kpis.callsTodayCount}
            </p>
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              View Calls <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">
            Persisted call & interaction logs today
          </p>
        </div>

        {/* 3. ATTENDANCE TODAY KPI CARD */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:border-indigo-400 transition-all duration-200 w-full min-w-0 flex flex-col justify-between space-y-2.5 sm:space-y-3">
          <div
            onClick={() => navigate(`${ROUTES.ATTENDANCE}?date=today`)}
            className="flex items-center justify-between cursor-pointer group gap-2"
          >
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary truncate">
              Attendance Today
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
              <UserCheck size={16} />
            </div>
          </div>

          <div
            onClick={() => navigate(`${ROUTES.ATTENDANCE}?date=today`)}
            className="cursor-pointer group flex items-baseline justify-between gap-2"
          >
            <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-indigo-700">
              {kpis.attendancePresent} / {kpis.attendanceTotal}
            </p>
            <span className="text-[10px] sm:text-[11px] text-text-muted group-hover:text-indigo-600 font-semibold transition shrink-0">
              Click total →
            </span>
          </div>

          {/* Sub-values Drill-Down */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-border text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.ATTENDANCE}?date=today&status=PRESENT`);
              }}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] sm:text-[11px] font-semibold sm:font-bold hover:bg-emerald-100 transition shrink-0 cursor-pointer"
              title="Filter today's Present employees"
            >
              Present: {kpis.attendancePresent}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.ATTENDANCE}?date=today&status=ABSENT`);
              }}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] sm:text-[11px] font-semibold sm:font-bold hover:bg-rose-100 transition shrink-0 cursor-pointer"
              title="Filter today's Absent employees"
            >
              Absent: {kpis.attendanceAbsent}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.ATTENDANCE}?date=today&status=LEAVE`);
              }}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] sm:text-[11px] font-semibold sm:font-bold hover:bg-amber-100 transition shrink-0 cursor-pointer"
              title="Filter today's Leave employees"
            >
              Leave: {kpis.attendanceLeave}
            </button>
          </div>
        </div>

        {/* 4. INTERVIEWS TODAY KPI CARD */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between space-y-2.5 sm:space-y-3">
          <div
            onClick={() =>
              setSelectedDrawerMetric({
                metric: "INTERVIEWS_TODAY",
                title: "Interviews Scheduled — Today",
                description: "Students with interview scheduled for today",
                icon: <CalendarCheck size={20} />,
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              setSelectedDrawerMetric({
                metric: "INTERVIEWS_TODAY",
                title: "Interviews Scheduled — Today",
                description: "Students with interview scheduled for today",
                icon: <CalendarCheck size={20} />,
              })
            }
            className="flex items-center justify-between cursor-pointer group gap-2"
          >
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-purple-600 transition truncate">
              Interviews Today
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
              <CalendarCheck size={16} />
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedDrawerMetric({
                metric: "INTERVIEWS_TODAY",
                title: "Interviews Scheduled — Today",
                description: "Students with interview scheduled for today",
                icon: <CalendarCheck size={20} />,
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              setSelectedDrawerMetric({
                metric: "INTERVIEWS_TODAY",
                title: "Interviews Scheduled — Today",
                description: "Students with interview scheduled for today",
                icon: <CalendarCheck size={20} />,
              })
            }
            className="cursor-pointer group flex items-baseline justify-between gap-2"
          >
            <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-purple-700">
              {todaysInterviewsCount}
            </p>
            <span className="text-[10px] sm:text-[11px] text-purple-600 font-semibold transition flex items-center gap-1 shrink-0">
              View Students <ChevronRight size={14} />
            </span>
          </div>

          {/* Sub-values Drill-Down */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-border text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDrawerMetric({
                  metric: "INTERVIEWS_TODAY",
                  title: "Scheduled Interviews — Today",
                  description: "Interviews scheduled for today",
                  icon: <CalendarCheck size={20} />,
                });
              }}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] sm:text-[11px] font-semibold sm:font-bold hover:bg-purple-100 transition cursor-pointer shrink-0"
              title="Open scheduled interviews drawer"
            >
              Sch: {todaysSchCount}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDrawerMetric({
                  metric: "INTERVIEWS_TODAY",
                  title: "Completed Interviews — Today",
                  description: "Interviews completed today",
                  icon: <CalendarCheck size={20} />,
                });
              }}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] sm:text-[11px] font-semibold sm:font-bold hover:bg-emerald-100 transition cursor-pointer shrink-0"
              title="Open completed interviews drawer"
            >
              Done: {todaysDoneCount}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDrawerMetric({
                  metric: "INTERVIEWS_TODAY",
                  title: "Pending Interviews — Today",
                  description: "Pending interview decisions today",
                  icon: <CalendarCheck size={20} />,
                });
              }}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] sm:text-[11px] font-semibold sm:font-bold hover:bg-amber-100 transition cursor-pointer shrink-0"
              title="Open pending interviews drawer"
            >
              Pend: {todaysPendCount}
            </button>
          </div>
        </div>

        {/* 5. SELECTION LETTERS TODAY CARD */}
        <div
          onClick={() =>
            setSelectedDrawerMetric({
              metric: "SELECTION_LETTERS_TODAY",
              title: "Selection Letters Today",
              description: "Selection letters issued today",
              icon: <FileCheck size={20} />,
            })
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            setSelectedDrawerMetric({
              metric: "SELECTION_LETTERS_TODAY",
              title: "Selection Letters Today",
              description: "Selection letters issued today",
              icon: <FileCheck size={20} />,
            })
          }
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-amber-600 transition truncate">
              Selection Letters Today
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
              <FileCheck size={16} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
            <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-amber-700">
              {kpis.selectionLettersTodayCount}
            </p>
            <span className="text-[11px] sm:text-xs font-semibold text-amber-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              View Students <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">
            Selection letters issued today • Click to view records
          </p>
        </div>

        {/* 6. ADMISSIONS DUE TODAY CARD */}
        <div
          onClick={() =>
            setSelectedDrawerMetric({
              metric: "ADMISSIONS_DUE_TODAY",
              title: "Admissions Due Today",
              description: "Leads with admission attention due today",
              icon: <Clock size={20} />,
            })
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            setSelectedDrawerMetric({
              metric: "ADMISSIONS_DUE_TODAY",
              title: "Admissions Due Today",
              description: "Leads with admission attention due today",
              icon: <Clock size={20} />,
            })
          }
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-rose-600 transition truncate">
              Admissions Due Today
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition shrink-0">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
            <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-rose-700">
              {kpis.admissionsDueTodayCount}
            </p>
            <span className="text-[11px] sm:text-xs font-semibold text-rose-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              View Students <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted leading-tight">
            Leads needing attention today • Click to view records
          </p>
        </div>

        {/* 7. DATA UPLOADED TODAY CARD */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all duration-200 w-full min-w-0 flex flex-col justify-between space-y-2.5 sm:space-y-3">
          <div
            onClick={() =>
              setSelectedDrawerMetric({
                metric: "DATA_UPLOADED_TODAY",
                title: "Data Uploaded Today",
                description: "Raw student data records uploaded today",
                icon: <Database size={20} />,
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              setSelectedDrawerMetric({
                metric: "DATA_UPLOADED_TODAY",
                title: "Data Uploaded Today",
                description: "Raw student data records uploaded today",
                icon: <Database size={20} />,
              })
            }
            className="flex items-center justify-between cursor-pointer group gap-2"
          >
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-text-secondary group-hover:text-cyan-600 transition truncate">
              Data Uploaded Today
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition shrink-0">
              <Database size={16} />
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedDrawerMetric({
                metric: "DATA_UPLOADED_TODAY",
                title: "Data Uploaded Today",
                description: "Raw student data records uploaded today",
                icon: <Database size={20} />,
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              setSelectedDrawerMetric({
                metric: "DATA_UPLOADED_TODAY",
                title: "Data Uploaded Today",
                description: "Raw student data records uploaded today",
                icon: <Database size={20} />,
              })
            }
            className="cursor-pointer group flex items-baseline justify-between gap-2"
          >
            <p className="text-xl sm:text-3xl font-semibold sm:font-bold text-cyan-700">
              {kpis.dataUploadedTodayCount ?? 0}
            </p>
            <span className="text-[10px] sm:text-[11px] text-text-muted group-hover:text-cyan-600 font-semibold transition shrink-0">
              View Students →
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-border text-xs">
            <button
              onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?status=AVAILABLE`)}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-neutral-100 text-text-secondary hover:bg-neutral-200 text-[10px] sm:text-[11px] font-semibold transition cursor-pointer shrink-0"
            >
              Available: {kpis.availableDataCount}
            </button>
            <button
              onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?status=ACTIVE`)}
              className="px-2 py-0.5 sm:py-1 rounded-md bg-emerald-50 text-emerald-800 text-[10px] sm:text-[11px] font-semibold hover:bg-emerald-100 transition cursor-pointer shrink-0"
            >
              Active: {kpis.activeAssignmentsCount}
            </button>
          </div>
        </div>

        {/* 8. LEADS TODAY OVERVIEW CARD */}
        <div
          onClick={() => navigate(`${ROUTES.LEADS}?date=today`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(`${ROUTES.LEADS}?date=today`)}
          className="group cursor-pointer rounded-2xl border border-border bg-gradient-to-br from-neutral-50 to-primary-50/30 dark:from-neutral-900 dark:to-primary-950/30 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-primary-300 transition-all duration-200 flex flex-col justify-between w-full min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold sm:font-bold uppercase tracking-normal sm:tracking-wider text-primary-900 dark:text-primary-300 truncate">
              Leads Today Overview
            </p>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition shrink-0">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">
              Today's Lead Pipeline ({kpis.leadsTodayCount})
            </p>
            <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 leading-snug">
              Access student leads created or updated today
            </p>
          </div>
          <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold sm:font-bold text-primary-700 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
            Open Today's Leads <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* 2. DAILY TEAM REPORT SECTION */}
      <div className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
        <div className="border-b border-border px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Shield className="text-primary-600 shrink-0" size={18} />
              <span>Daily Team Report</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click team row for Team Details workspace. Click individual cell numbers to drill down into records.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-300 px-3 py-1 rounded-lg shrink-0 self-start sm:self-auto">
            {dailyTeamReport.length} Active Team(s)
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-neutral-50/80 dark:bg-slate-800/60 text-text-secondary font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 sm:px-6 py-3.5">Team</th>
                <th className="px-4 sm:px-6 py-3.5">Manager</th>
                <th className="px-4 sm:px-6 py-3.5">Members</th>
                <th className="px-4 sm:px-6 py-3.5">Leads Today</th>
                <th className="px-4 sm:px-6 py-3.5">Calls Today</th>
                <th className="px-4 sm:px-6 py-3.5">Admissions</th>
                <th className="px-4 sm:px-6 py-3.5 text-right">Attendance Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dailyTeamReport.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    No active teams found.
                  </td>
                </tr>
              ) : (
                dailyTeamReport.map((team) => (
                  <tr
                    key={team.teamId}
                    onClick={() => navigate(`/teams/${team.teamId}`)}
                    className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 font-bold text-text-primary">
                      <button
                        type="button"
                        onClick={() => navigate(`/teams/${team.teamId}`)}
                        className="hover:text-primary-600 hover:underline text-left block truncate max-w-[170px]"
                        title={team.teamName}
                      >
                        {team.teamName}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-text-secondary font-medium">
                      <span className="block truncate max-w-[140px]" title={team.managerName}>
                        {team.managerName}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-semibold text-text-primary">
                      {team.membersCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.LEADS}?teamId=${team.teamId}&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md font-bold hover:underline transition"
                      >
                        {team.leadsTodayCount}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.CALLS}?teamId=${team.teamId}&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md font-bold hover:underline transition"
                      >
                        {team.callsTodayCount}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.LEADS}?teamId=${team.teamId}&status=ADMISSION_DONE&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md font-bold hover:underline transition text-text-primary"
                      >
                        {team.admissionsTodayCount}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.ATTENDANCE}?teamId=${team.teamId}&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md font-bold hover:underline transition text-text-primary"
                      >
                        {team.attendancePresentCount} / {team.attendanceTotalCount}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TEAM MEMBER CALL PERFORMANCE SECTION */}
      <TeamMemberCallPerformanceTable data={advisorPerformance} />

      {/* 5. LEAD PIPELINE STAGE BREAKDOWN */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2 sm:gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Lead Pipeline Stages</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click any pipeline stage segment to inspect filtered leads in the Lead Management module.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-300 px-3 py-1 rounded-lg shrink-0 self-start sm:self-auto">
            Dynamic LeadStatus Config
          </span>
        </div>

        {chartPipeline.length > 0 && (
          <div className="h-56 sm:h-64 w-full pt-2 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Leads`, "Count"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(entry) => {
                    if (entry?.name && entry.name !== "Retained") {
                      navigate(`${ROUTES.LEADS}?status=${entry.name}`);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {chartPipeline.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#6366F1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
          {leadPipeline.map((stage) => (
            <div
              key={stage.id}
              onClick={() => navigate(`${ROUTES.LEADS}?status=${stage.name}`)}
              className="cursor-pointer p-3 sm:p-3.5 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition space-y-2 group min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color || "#6366F1" }}
                ></span>
                <span className="text-xs font-semibold text-text-secondary truncate group-hover:text-primary-600 transition">
                  {stage.name}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg sm:text-xl font-bold text-text-primary">{stage.count}</span>
                <span className="text-[11px] font-semibold text-text-muted">{stage.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. RECENT ACTIVITY LOG SECTION */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2 sm:gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Activity className="text-primary-600 shrink-0" size={18} />
              <span>Recent System Activity Log</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click activity log rows to navigate directly to the target record.
            </p>
          </div>
          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 px-3 py-1 rounded-lg shrink-0 self-start sm:self-auto">
            Real ActivityLog Entries
          </span>
        </div>

        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {paginatedActivity.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No recent activity log entries found.
            </div>
          ) : (
            paginatedActivity.map((act) => (
              <div
                key={act.id}
                onClick={() => handleActivityRowClick(act)}
                className="p-4 hover:bg-neutral-50/80 transition cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {act.actor.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-primary-600 transition">
                      {act.description}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Actor: <strong className="text-text-secondary">{act.actor}</strong> • Entity: {act.entityType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right shrink-0">
                  <span className="text-[11px] text-text-muted">{formatRelativeTime(act.createdAt)}</span>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-primary-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Activity Log Pagination Controls */}
        {totalActivityPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
            <div className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{(currentActivityPage - 1) * ACTIVITY_PAGE_SIZE + 1}</span> to{" "}
              <span className="font-semibold text-text-primary">{Math.min(currentActivityPage * ACTIVITY_PAGE_SIZE, recentActivity.length)}</span> of{" "}
              <span className="font-semibold text-text-primary">{recentActivity.length}</span> entries
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 self-center sm:self-auto flex-wrap justify-center">
              <button
                type="button"
                disabled={currentActivityPage <= 1}
                onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft size={15} />
              </button>

              {getCompactPageNumbers(currentActivityPage, totalActivityPages).map((page, idx) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-xs text-text-muted font-bold select-none"
                    >
                      ...
                    </span>
                  );
                }
                const pageNum = page as number;
                const isActive = pageNum === currentActivityPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setActivityPage(pageNum)}
                    className={`flex h-7 min-w-[28px] sm:h-7.5 sm:min-w-[30px] px-1.5 items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${isActive
                      ? "bg-primary-600 text-white shadow-xs"
                      : "border border-border text-text-secondary hover:bg-surface-hover"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentActivityPage >= totalActivityPages}
                onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right-Side Student Details Drawer */}
      <StudentMetricDrawer
        isOpen={Boolean(selectedDrawerMetric)}
        onClose={() => setSelectedDrawerMetric(null)}
        metric={selectedDrawerMetric?.metric || null}
        metricTitle={selectedDrawerMetric?.title || ""}
        metricDescription={selectedDrawerMetric?.description}
        metricIcon={selectedDrawerMetric?.icon}
        token={accessToken}
      />
    </div>
  );
};

export default SuperAdminDashboardView;
