import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  PhoneCall,
  RefreshCw,
  AlertCircle,
  Search,
  Users,
  Trophy,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Award,
  BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchTeamById,
  fetchTeamMembers,
  type TeamItem,
  type EligibleMember,
} from "../../../services/teamService";
import {
  fetchManagerDashboardStats,
  type ManagerDashboardData,
} from "../../../services/managerDashboardService";
import { ROUTES } from "../../../app/router/routes";

type PeriodOption = "daily" | "weekly" | "monthly" | "yearly" | "all_time";

const TeamDetailsPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "members">("overview");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("monthly");

  const [team, setTeam] = useState<TeamItem | null>(null);
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search member term for Members tab
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  const loadTeamData = useCallback(async () => {
    if (!accessToken || !teamId) return;
    setLoading(true);
    setError(null);

    const now = new Date();
    let filterParams: Record<string, string> = {};

    if (selectedPeriod === "daily") {
      filterParams = { memberPeriod: "today", tpcPeriod: "today", pipelinePeriod: "today" };
    } else if (selectedPeriod === "weekly") {
      filterParams = { memberPeriod: "week", tpcPeriod: "week", pipelinePeriod: "week" };
    } else if (selectedPeriod === "monthly") {
      filterParams = { memberPeriod: "month", tpcPeriod: "month", pipelinePeriod: "month" };
    } else if (selectedPeriod === "yearly") {
      const yearStr = now.getFullYear().toString();
      filterParams = { startDate: `${yearStr}-01-01`, endDate: `${yearStr}-12-31` };
    } else if (selectedPeriod === "all_time") {
      filterParams = { memberPeriod: "all", tpcPeriod: "all", pipelinePeriod: "all" };
    }

    try {
      const [teamRes, membersRes, dashRes] = await Promise.all([
        fetchTeamById(accessToken, teamId),
        fetchTeamMembers(accessToken, teamId),
        fetchManagerDashboardStats(accessToken, { teamId, ...filterParams }).catch(
          () => null
        ),
      ]);
      setTeam(teamRes);
      setMembers(membersRes);
      setDashboardData(dashRes);
    } catch (err: unknown) {
      console.error("Failed to load team workspace details:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load team details.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, teamId, selectedPeriod]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  if (loading && !team) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 w-48 bg-neutral-200 rounded-lg"></div>
        <div className="h-32 w-full bg-neutral-200 rounded-xl"></div>
        <div className="h-64 w-full bg-neutral-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-rose-200 bg-rose-50 text-center">
        <AlertCircle size={36} className="text-rose-600 mb-3" />
        <h3 className="text-base font-semibold text-rose-900">Team Workspace Error</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md">
          {error || "Team not found or access forbidden."}
        </p>
        <button
          onClick={() => navigate(ROUTES.TEAMS)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition"
        >
          <ArrowLeft size={14} />
          Back to Teams
        </button>
      </div>
    );
  }

  const managerName = team.manager
    ? `${team.manager.firstName} ${team.manager.lastName || ""}`.trim()
    : "Unassigned";

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName || ""}`.toLowerCase();
    const email = m.email.toLowerCase();
    const term = memberSearchTerm.toLowerCase().trim();
    return fullName.includes(term) || email.includes(term);
  });

  const memberPerf = dashboardData?.memberPerformance || [];
  const tpcOverview = dashboardData?.tpcOverview;
  const recentActivity = dashboardData?.recentActivity || [];

  /**
   * Member Performance Ranking Methodology:
   * Deterministic hierarchical sorting based on primary measurable metrics (no arbitrary composite score formula):
   * 1. Conversions count (`convertedLeadsCount`) - descending
   * 2. TPC Completed count (`tpcAttemptedCount` / `tpcsCount`) - descending
   * 3. Activities / Interactions count (`interactionsCount`) - descending
   */
  const sortedMembersByPerf = [...memberPerf].sort((a, b) => {
    if (b.convertedLeadsCount !== a.convertedLeadsCount) {
      return b.convertedLeadsCount - a.convertedLeadsCount;
    }
    const tpcA = a.tpcAttemptedCount ?? a.tpcsCount ?? 0;
    const tpcB = b.tpcAttemptedCount ?? b.tpcsCount ?? 0;
    if (tpcB !== tpcA) {
      return tpcB - tpcA;
    }
    const actA = a.interactionsCount ?? 0;
    const actB = b.interactionsCount ?? 0;
    return actB - actA;
  });

  const bestPerformer = sortedMembersByPerf.length > 0 ? sortedMembersByPerf[0] : null;

  const getBestPerformerLabel = () => {
    switch (selectedPeriod) {
      case "daily":
        return "Best Performer Today";
      case "weekly":
        return "Best Performer This Week";
      case "monthly":
        return "Employee of the Month";
      case "yearly":
        return "Best Performer This Year";
      case "all_time":
        return "Overall Best Performer";
    }
  };

  // Needs Attention Calculation from real member metrics & attention signals
  const attentionMember =
    memberPerf.find(
      (m) =>
        m.assignedLeadsCount >= 10 &&
        m.convertedLeadsCount <= 1 &&
        (m.tpcAttemptedCount || 0) < 5
    ) ||
    memberPerf.find(
      (m) => m.assignedLeadsCount > 15 && m.convertedLeadsCount === 0
    ) ||
    null;

  // Trend Data computed from recentActivity timestamps
  const trendDataMap = new Map<string, number>();
  recentActivity.forEach((act) => {
    const dateStr = new Date(act.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    trendDataMap.set(dateStr, (trendDataMap.get(dateStr) || 0) + 1);
  });
  const trendChartData = Array.from(trendDataMap.entries())
    .map(([date, count]) => ({ date, count }))
    .reverse();

  // Lead Distribution Data
  const leadDistributionData = memberPerf.map((mp) => ({
    name: `${mp.firstName} ${mp.lastName || ""}`.trim(),
    count: mp.assignedLeadsCount,
  }));

  // Conversions Data
  const conversionData = memberPerf.map((mp) => ({
    name: `${mp.firstName} ${mp.lastName || ""}`.trim(),
    count: mp.convertedLeadsCount,
  }));

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.TEAMS)}
          className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition"
        >
          <ArrowLeft size={16} />
          Back to Teams
        </button>
        <button
          onClick={loadTeamData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-neutral-50 transition shadow-2xs disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin text-primary-600" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Team Header Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-lg shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{team.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  team.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {team.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {team.description && (
              <p className="mt-1 text-xs text-text-secondary max-w-xl">
                {team.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span>
                Manager:{" "}
                <strong className="text-text-primary">{managerName}</strong> (
                {team.manager?.email})
              </span>
              <span>•</span>
              <span>
                Created:{" "}
                <strong className="text-text-primary">
                  {new Date(team.createdAt).toLocaleDateString()}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
          <div className="text-center px-3">
            <p className="text-xs text-text-muted uppercase font-semibold">
              Members
            </p>
            <p className="text-xl font-bold text-text-primary mt-0.5">
              {team.memberCount ?? members.length}
            </p>
          </div>
          <div className="text-center px-3 border-l border-border">
            <p className="text-xs text-text-muted uppercase font-semibold">Leads</p>
            <p className="text-xl font-bold text-primary-700 mt-0.5">
              {dashboardData?.overview.totalLeads ?? 0}
            </p>
          </div>
          <div className="text-center px-3 border-l border-border">
            <p className="text-xs text-text-muted uppercase font-semibold">TPCs</p>
            <p className="text-xl font-bold text-purple-700 mt-0.5">
              {dashboardData?.overview.totalTpcs ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-border flex items-center gap-6 text-xs font-semibold">
        {(["overview", "members"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition border-b-2 ${
              activeTab === tab
                ? "border-primary-500 text-primary-700 font-bold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB (TEAM PERFORMANCE ANALYTICS DASHBOARD) */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Overview Header & Global Period Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Team Performance Analytics
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Real-time performance metrics and insights for {team.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="period-select"
                className="text-xs font-semibold text-text-secondary flex items-center gap-1.5"
              >
                <Calendar size={14} className="text-primary-600" />
                Period:
              </label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) =>
                  setSelectedPeriod(e.target.value as PeriodOption)
                }
                className="h-9 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text-primary outline-none focus:border-primary-500 shadow-2xs transition"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="all_time">All Time</option>
              </select>
            </div>
          </div>

          {/* Top KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Team Members
                </p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {team.memberCount ?? members.length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Active Leads
                </p>
                <p className="text-2xl font-bold text-primary-700 mt-1">
                  {dashboardData?.overview.totalLeads ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Conversions
                </p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {dashboardData?.overview.monthlyConversions ??
                    memberPerf.reduce((acc, m) => acc + m.convertedLeadsCount, 0)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  TPC Completed
                </p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {tpcOverview?.byStatus.COMPLETED ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <PhoneCall size={20} />
              </div>
            </div>
          </div>

          {/* Member Performance & Lead Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 🏆 Member Performance Ranking */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Member Performance
                  </h3>
                </div>
                <span className="text-[11px] text-text-muted">
                  Conversions & TPC output
                </span>
              </div>

              {sortedMembersByPerf.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    const maxConvs = Math.max(
                      ...sortedMembersByPerf.map((m) => m.convertedLeadsCount),
                      0
                    );
                    const maxTpcs = Math.max(
                      ...sortedMembersByPerf.map(
                        (m) => m.tpcAttemptedCount ?? m.tpcsCount ?? 0
                      ),
                      1
                    );

                    return sortedMembersByPerf.map((mp, index) => {
                      const tpcVal = mp.tpcAttemptedCount ?? mp.tpcsCount ?? 0;
                      const pct =
                        maxConvs > 0
                          ? Math.round((mp.convertedLeadsCount / maxConvs) * 100)
                          : Math.round((tpcVal / maxTpcs) * 100);

                      return (
                        <div key={mp.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-text-primary">
                              #{index + 1} {mp.firstName} {mp.lastName || ""}
                            </span>
                            <span className="text-text-secondary font-medium">
                              {mp.convertedLeadsCount} Convs • {tpcVal} TPCs
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary-500 transition-all duration-300"
                              style={{ width: `${Math.max(pct, 8)}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-8">
                  No performance metrics recorded for this period.
                </p>
              )}
            </div>

            {/* 📊 Lead Distribution */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-primary-600" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Lead Distribution
                  </h3>
                </div>
                <span className="text-[11px] text-text-muted">
                  Active assigned leads
                </span>
              </div>

              {leadDistributionData.some((d) => d.count > 0) ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={leadDistributionData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip formatter={(val: any) => [`${val} Leads`, "Assigned"]} />
                      <Bar dataKey="count" fill="#2f5d50" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-12">
                  No lead distribution data available.
                </p>
              )}
            </div>
          </div>

          {/* Performance Trend & Conversions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 📈 Team Performance Trend */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Team Performance Trend
                  </h3>
                </div>
                <span className="text-[11px] text-text-muted">
                  Interactions logged over time
                </span>
              </div>

              {trendChartData.length > 0 ? (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => [`${val} Activities`, "Logs"]} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#10B981"
                        fill="#D1FAE5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-12">
                  No performance trend data available for this period.
                </p>
              )}
            </div>

            {/* 🎯 Conversions */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Conversions
                  </h3>
                </div>
                <span className="text-[11px] text-text-muted">
                  Confirmed Admissions
                </span>
              </div>

              {conversionData.some((d) => d.count > 0) ? (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={conversionData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip
                        formatter={(val: any) => [`${val} Conversions`, "Confirmed"]}
                      />
                      <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-12">
                  No conversions recorded for this period.
                </p>
              )}
            </div>
          </div>

          {/* TPC Performance & Team Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 🎯 TPC Performance Breakdown */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <PhoneCall size={18} className="text-purple-600" />
                  <h3 className="text-sm font-bold text-text-primary">
                    TPC Performance
                  </h3>
                </div>
                <span className="text-[11px] text-text-muted">
                  Pitch Call Breakdown
                </span>
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] uppercase font-bold text-emerald-800">
                    Completed
                  </p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">
                    {tpcOverview?.byStatus.COMPLETED ?? 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="text-[10px] uppercase font-bold text-indigo-800">
                    Pending
                  </p>
                  <p className="text-base font-bold text-indigo-700 mt-0.5">
                    {tpcOverview?.byStatus.PENDING ?? 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-[10px] uppercase font-bold text-amber-800">
                    No Reply
                  </p>
                  <p className="text-base font-bold text-amber-700 mt-0.5">
                    {tpcOverview?.byStatus.NO_REPLY ?? 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <p className="text-[10px] uppercase font-bold text-rose-800">
                    Not Int.
                  </p>
                  <p className="text-base font-bold text-rose-700 mt-0.5">
                    {tpcOverview?.byStatus.NOT_INTERESTED ?? 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100 border border-neutral-200">
                  <p className="text-[10px] uppercase font-bold text-neutral-700">
                    Cancelled
                  </p>
                  <p className="text-base font-bold text-neutral-800 mt-0.5">
                    {tpcOverview?.byStatus.CANCELLED ?? 0}
                  </p>
                </div>
              </div>

              {/* Member TPC breakdown */}
              {tpcOverview?.byMember && tpcOverview.byMember.length > 0 ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Member</th>
                        <th className="px-3 py-2 text-center">Pending</th>
                        <th className="px-3 py-2 text-right">Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tpcOverview.byMember.map((m) => (
                        <tr key={m.memberId} className="hover:bg-neutral-50/50">
                          <td className="px-3 py-2 font-medium text-text-primary">
                            {m.name}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-indigo-600">
                            {m.pendingCount}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                            {m.completedCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-4">
                  No TPC call records found for members.
                </p>
              )}
            </div>

            {/* 🏆 Team Insights (Best Performer & Needs Attention) */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Team Performance Insights
                  </h3>
                </div>
                <span className="text-[11px] text-text-muted">
                  Manager Highlights
                </span>
              </div>

              <div className="space-y-4">
                {/* Best Performer */}
                <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      🏆 {getBestPerformerLabel()}
                    </span>
                  </div>

                  {bestPerformer ? (
                    <div>
                      <h4 className="text-base font-bold text-text-primary">
                        {bestPerformer.firstName} {bestPerformer.lastName || ""}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                        <span className="font-semibold text-emerald-700">
                          {bestPerformer.convertedLeadsCount} Conversions
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-purple-700">
                          {bestPerformer.tpcsCount} TPC Completed
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1 font-medium">
                        Strongest performer in {team.name} for this period.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">
                      No best performer calculated yet for this period.
                    </p>
                  )}
                </div>

                {/* Needs Attention */}
                <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      ⚠ Needs Attention
                    </span>
                  </div>

                  {attentionMember ? (
                    <div>
                      <h4 className="text-base font-bold text-text-primary">
                        {attentionMember.firstName} {attentionMember.lastName || ""}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                        <span className="font-semibold text-primary-700">
                          {attentionMember.assignedLeadsCount} Active Leads
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-rose-700">
                          {attentionMember.convertedLeadsCount} Conversions
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-1 font-medium">
                        High lead workload with relatively low conversion performance.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>No members currently require attention.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="rounded-xl border border-border bg-surface shadow-2xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Team Members ({members.length})
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Active users currently assigned to this team.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search member name or email..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-text-muted"
                    >
                      No members match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-neutral-50/50 transition"
                    >
                      <td className="px-4 py-3.5 font-semibold text-text-primary">
                        {m.firstName} {m.lastName || ""}
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary">
                        {m.email}
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">
                        {(m as any).phone || "N/A"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
                          {(m as any).role?.name || "Member"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailsPage;
