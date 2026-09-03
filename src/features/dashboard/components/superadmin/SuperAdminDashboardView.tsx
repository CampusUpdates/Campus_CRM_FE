import { useEffect, useState, useCallback } from "react";
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
  AlertTriangle,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
import { useAuth } from "../../../../context/AuthContext";
import { ROUTES } from "../../../../app/router/routes";
import {
  fetchSuperAdminDashboardStats,
  type SuperAdminDashboardData,
} from "../../../../services/superAdminDashboardService";

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

const SuperAdminDashboardView = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 5;

  const loadDashboard = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSuperAdminDashboardStats(accessToken);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load Super Admin dashboard:", err);
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-28 w-full bg-neutral-200/60 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-neutral-200/60 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-72 bg-neutral-200/60 rounded-2xl"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-rose-200 bg-rose-50 text-center">
        <AlertTriangle size={36} className="text-rose-600 mb-3" />
        <h3 className="text-base font-bold text-rose-900">Failed to Load Super Admin Dashboard</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
        >
          <RefreshCw size={14} /> Retry Loading
        </button>
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
      expiredDataCount: 0,
      activeAssignmentsCount: 0,
    },
    dailyTeamReport = [],
    advisorPerformance = [],
    leadPipeline = [],

    attentionRequired = {
      admissionsDueTodayCount: 0,
      overdueAdmissionsCount: 0,
      pendingTpcsCount: 0,
      unassignedDataCount: 0,
      zeroCallAdvisorsCount: 0,
    },
    recentActivity = [],
  } = data || {};

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
    <div className="space-y-8 pb-8">
      {/* Super Admin Top Control & Sync Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-primary-300" size={24} />
            <h2 className="text-xl font-bold tracking-tight">Super Admin Executive Dashboard</h2>
          </div>
          <p className="text-xs text-primary-200 mt-1 max-w-xl">
            Live interactive entry point to all CRM records. Click any metric or table row to drill down into source CRM records.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white border border-white/20 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Dashboard Data
        </button>
      </div>

      {/* 1. TOP INTERACTIVE KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* 1. LEADS TODAY KPI CARD */}
        <div
          onClick={() => navigate(`${ROUTES.LEADS}?date=today`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(`${ROUTES.LEADS}?date=today`)}
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-primary-400 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Leads Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-text-primary group-hover:text-primary-600 transition">
              {kpis.leadsTodayCount}
            </p>
            <span className="text-xs font-semibold text-primary-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              View Leads <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Created today • Click to view records
          </p>
        </div>

        {/* 2. CALLS TODAY KPI CARD */}
        <div
          onClick={() => navigate(`${ROUTES.CALLS}?date=today`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(`${ROUTES.CALLS}?date=today`)}
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Calls Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-emerald-700">
              {kpis.callsTodayCount}
            </p>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              View Calls <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Persisted call & interaction logs today
          </p>
        </div>

        {/* 3. ATTENDANCE TODAY KPI CARD */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-3 hover:border-indigo-400 transition-all duration-200">
          <div
            onClick={() => navigate(`${ROUTES.ATTENDANCE}?date=today`)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Attendance Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <UserCheck size={18} />
            </div>
          </div>

          <div
            onClick={() => navigate(`${ROUTES.ATTENDANCE}?date=today`)}
            className="cursor-pointer group flex items-baseline justify-between"
          >
            <p className="text-3xl font-bold text-indigo-700">
              {kpis.attendancePresent} / {kpis.attendanceTotal}
            </p>
            <span className="text-[11px] text-text-muted group-hover:text-indigo-600 font-semibold transition">
              Click total →
            </span>
          </div>

          {/* Sub-values Drill-Down */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-border text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.ATTENDANCE}?date=today&status=PRESENT`);
              }}
              className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 transition"
              title="Filter today's Present employees"
            >
              Present: {kpis.attendancePresent}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.ATTENDANCE}?date=today&status=ABSENT`);
              }}
              className="px-2 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold hover:bg-rose-100 transition"
              title="Filter today's Absent employees"
            >
              Absent: {kpis.attendanceAbsent}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.ATTENDANCE}?date=today&status=LEAVE`);
              }}
              className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold hover:bg-amber-100 transition"
              title="Filter today's Leave employees"
            >
              Leave: {kpis.attendanceLeave}
            </button>
          </div>
        </div>

        {/* 4. INTERVIEWS TODAY KPI CARD */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-3 hover:border-purple-400 transition-all duration-200">
          <div
            onClick={() => navigate(`${ROUTES.RECRUITMENT}?tab=interviews&date=today`)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Interviews Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <CalendarCheck size={18} />
            </div>
          </div>

          <div
            onClick={() => navigate(`${ROUTES.RECRUITMENT}?tab=interviews&date=today`)}
            className="cursor-pointer group flex items-baseline justify-between"
          >
            <p className="text-3xl font-bold text-purple-700">
              {kpis.interviewsTodayCount}
            </p>
            <span className="text-[11px] text-text-muted group-hover:text-purple-600 font-semibold transition">
              Click total →
            </span>
          </div>

          {/* Sub-values Drill-Down */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-border text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.RECRUITMENT}?tab=interviews&date=today&status=SCHEDULED`);
              }}
              className="px-2 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold hover:bg-purple-100 transition"
            >
              Sch: {kpis.interviewsScheduledCount}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.RECRUITMENT}?tab=interviews&date=today&status=COMPLETED`);
              }}
              className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 transition"
            >
              Done: {kpis.interviewsCompletedCount}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${ROUTES.RECRUITMENT}?tab=interviews&date=today&status=PENDING`);
              }}
              className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold hover:bg-amber-100 transition"
            >
              Pend: {kpis.interviewsPendingCount}
            </button>
          </div>
        </div>

        {/* 5. SELECTION LETTERS TODAY CARD */}
        <div
          onClick={() => navigate(`${ROUTES.LEADS}?status=LETTER_OUT&date=today`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(`${ROUTES.LEADS}?status=LETTER_OUT&date=today`)}
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Selection Letters Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-amber-700">
              {kpis.selectionLettersTodayCount}
            </p>
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              View Letters <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Selection letters issued today
          </p>
        </div>

        {/* 6. ADMISSIONS DUE TODAY CARD */}
        <div
          onClick={() => navigate(`${ROUTES.LEADS}?admissionDueDate=today`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(`${ROUTES.LEADS}?admissionDueDate=today`)}
          className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-rose-400 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Admissions Due Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-rose-700">
              {kpis.admissionsDueTodayCount}
            </p>
            <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              View Admissions <ChevronRight size={14} />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Leads needing attention today
          </p>
        </div>

        {/* 7. AVAILABLE DATA DATASETS CARD */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-3 hover:border-cyan-400 transition-all duration-200">
          <div
            onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?status=AVAILABLE`)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Available Data
            </p>
            <div className="h-9 w-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition">
              <Database size={18} />
            </div>
          </div>

          <div
            onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?status=AVAILABLE`)}
            className="cursor-pointer group flex items-baseline justify-between"
          >
            <p className="text-3xl font-bold text-cyan-700">
              {kpis.availableDataCount}
            </p>
            <span className="text-[11px] text-text-muted group-hover:text-cyan-600 font-semibold transition">
              Data Workspace →
            </span>
          </div>

          <div className="flex items-center justify-between gap-1 pt-2 border-t border-border text-xs">
            <button
              onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?status=EXPIRED`)}
              className="px-2 py-1 rounded-md bg-neutral-100 text-text-secondary hover:bg-neutral-200 font-semibold transition"
            >
              Expired: {kpis.expiredDataCount}
            </button>
            <button
              onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?status=ACTIVE`)}
              className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition"
            >
              Active: {kpis.activeAssignmentsCount}
            </button>
          </div>
        </div>

        {/* 8. QUICK LINK TO ALL LEADS PIPELINE CARD */}
        <div
          onClick={() => navigate(`${ROUTES.LEADS}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(`${ROUTES.LEADS}`)}
          className="group cursor-pointer rounded-2xl border border-border bg-gradient-to-br from-neutral-50 to-primary-50/30 p-5 shadow-2xs hover:shadow-md hover:border-primary-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-900">
              All CRM Leads
            </p>
            <div className="h-9 w-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm font-semibold text-text-primary">
              Full Master Lead Pipeline
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Access all student leads, status stages, & filter options
            </p>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 group-hover:translate-x-1 transition-transform">
            Open Leads Module <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* 2. ATTENTION REQUIRED ALERTS SECTION */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="text-rose-600" size={20} />
              Attention Required
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Operational bottlenecks requiring executive attention.
            </p>
          </div>
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
            System Alerts Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">

          {/* Alert 1: Admissions Due Today */}
          <div
            onClick={() => navigate(`${ROUTES.LEADS}?admissionDueDate=today`)}
            className="cursor-pointer p-4 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900">🔴 Admissions Due</span>
              <span className="text-xs font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                {attentionRequired.admissionsDueTodayCount}
              </span>
            </div>
            <p className="text-[11px] text-rose-800">Due today for follow-up</p>
            <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1 pt-1 group-hover:underline">
              Inspect →
            </span>
          </div>

          {/* Alert 2: Overdue Admissions */}
          <div
            onClick={() => navigate(`${ROUTES.LEADS}?admissionOverdue=true`)}
            className="cursor-pointer p-4 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900">🔴 Overdue</span>
              <span className="text-xs font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                {attentionRequired.overdueAdmissionsCount}
              </span>
            </div>
            <p className="text-[11px] text-rose-800">Passed admission date</p>
            <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1 pt-1 group-hover:underline">
              Inspect →
            </span>
          </div>

          {/* Alert 3: Pending TPCs */}
          <div
            onClick={() => navigate(`${ROUTES.TPC}?status=PENDING`)}
            className="cursor-pointer p-4 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">🟠 Pending TPCs</span>
              <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {attentionRequired.pendingTpcsCount}
              </span>
            </div>
            <p className="text-[11px] text-amber-800">Telephonic pitch calls</p>
            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1 pt-1 group-hover:underline">
              Inspect →
            </span>
          </div>

          {/* Alert 4: Unassigned Data Records */}
          <div
            onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?status=AVAILABLE`)}
            className="cursor-pointer p-4 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">🟠 Unassigned Data</span>
              <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {attentionRequired.unassignedDataCount}
              </span>
            </div>
            <p className="text-[11px] text-amber-800">Available data pool</p>
            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1 pt-1 group-hover:underline">
              Inspect →
            </span>
          </div>

          {/* Alert 5: Advisors with Zero Calls Today */}
          <div
            onClick={() => navigate(`${ROUTES.USERS}?noCallsToday=true`)}
            className="cursor-pointer p-4 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900">🔴 Zero Calls</span>
              <span className="text-xs font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                {attentionRequired.zeroCallAdvisorsCount}
              </span>
            </div>
            <p className="text-[11px] text-rose-800">Advisors with no calls today</p>
            <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1 pt-1 group-hover:underline">
              Inspect →
            </span>
          </div>
        </div>
      </div>

      {/* 3. DAILY TEAM REPORT SECTION */}
      <div className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Shield className="text-primary-600" size={18} />
              Daily Team Report
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click team row for Team Details workspace. Click individual cell numbers to drill down into records.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">
            {dailyTeamReport.length} Active Team(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Team</th>
                <th className="px-6 py-3.5">Manager</th>
                <th className="px-6 py-3.5">Members</th>
                <th className="px-6 py-3.5">Leads Today</th>
                <th className="px-6 py-3.5">Calls Today</th>
                <th className="px-6 py-3.5">Admissions</th>
                <th className="px-6 py-3.5 text-right">Attendance Today</th>
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
                    className="hover:bg-neutral-50/80 transition cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-text-primary group-hover:text-primary-600 transition flex items-center gap-1.5">
                      {team.teamName}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition" />
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-medium">
                      {team.managerName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {team.membersCount}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.LEADS}?teamId=${team.teamId}&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-bold hover:bg-blue-100 hover:underline transition"
                      >
                        {team.leadsTodayCount}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.CALLS}?teamId=${team.teamId}&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 hover:underline transition"
                      >
                        {team.callsTodayCount}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.LEADS}?teamId=${team.teamId}&status=ADMISSION_DONE&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 font-bold hover:bg-purple-100 hover:underline transition"
                      >
                        {team.admissionsTodayCount}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.ATTENDANCE}?teamId=${team.teamId}&date=today`);
                        }}
                        className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold hover:bg-indigo-100 hover:underline transition"
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

      {/* 4. PROGRAM ADVISOR PERFORMANCE SECTION */}
      <div className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <UserCheck className="text-emerald-600" size={18} />
              Program Advisor Performance
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click advisor name to inspect user profile context. Click individual metrics to view filtered records.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
            {advisorPerformance.length} Advisor(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Advisor</th>
                <th className="px-6 py-3.5">Team</th>
                <th className="px-6 py-3.5">Assigned Data</th>
                <th className="px-6 py-3.5">Calls Today</th>
                <th className="px-6 py-3.5">Leads Today</th>
                <th className="px-6 py-3.5 text-right">Admissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {advisorPerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    No active program advisors found.
                  </td>
                </tr>
              ) : (
                advisorPerformance.map((adv) => (
                  <tr key={adv.userId} className="hover:bg-neutral-50/80 transition">
                    <td className="px-6 py-4 font-bold text-text-primary">
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.USERS}?search=${encodeURIComponent(adv.advisorName)}`)}
                        className="hover:text-primary-600 hover:underline text-left"
                      >
                        {adv.advisorName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-medium">
                      {adv.teamName}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.DATA_ASSIGNMENT}?assignedTo=${adv.userId}`)}
                        className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold hover:bg-cyan-100 hover:underline transition"
                      >
                        {adv.assignedDataCount}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.CALLS}?advisorId=${adv.userId}&date=today`)}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 hover:underline transition"
                      >
                        {adv.callsCount}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.LEADS}?assignedToId=${adv.userId}`)}
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold hover:bg-blue-100 hover:underline transition"
                      >
                        {adv.leadsCount}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.LEADS}?assignedToId=${adv.userId}&status=ADMISSION_DONE`)}
                        className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold hover:bg-purple-100 hover:underline transition"
                      >
                        {adv.admissionsCount}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. LEAD PIPELINE STAGE BREAKDOWN */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Lead Pipeline Stages</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click any pipeline stage segment to inspect filtered leads in the Lead Management module.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">
            Dynamic LeadStatus Config
          </span>
        </div>

        {leadPipeline.length > 0 && (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadPipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Leads`, "Count"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(entry) => navigate(`${ROUTES.LEADS}?status=${entry.name}`)}
                  className="cursor-pointer"
                >
                  {leadPipeline.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#6366F1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
          {leadPipeline.map((stage) => (
            <div
              key={stage.id}
              onClick={() => navigate(`${ROUTES.LEADS}?status=${stage.name}`)}
              className="cursor-pointer p-3.5 rounded-xl border border-border bg-neutral-50/50 hover:bg-neutral-100 transition space-y-2 group"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color || "#6366F1" }}
                ></span>
                <span className="text-xs font-semibold text-text-secondary truncate group-hover:text-primary-600 transition">
                  {stage.name}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-text-primary">{stage.count}</span>
                <span className="text-[11px] font-semibold text-text-muted">{stage.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. RECENT ACTIVITY LOG SECTION */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Activity className="text-primary-600" size={18} />
              Recent System Activity Log
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click activity log rows to navigate directly to the target record.
            </p>
          </div>
          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-lg">
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

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={currentActivityPage <= 1}
                onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalActivityPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setActivityPage(pageNum)}
                  className={`flex h-8 min-w-[2rem] items-center justify-center px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    pageNum === currentActivityPage
                      ? "bg-primary-600 text-white shadow-xs"
                      : "border border-border text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentActivityPage >= totalActivityPages}
                onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboardView;
