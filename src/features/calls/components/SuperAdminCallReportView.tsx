import React, { useEffect, useState, useCallback } from "react";
import {
  PhoneCall,
  Users,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Layers,
  PhoneOff,
  Activity,
  History,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchSuperAdminDashboardStats,
  type SuperAdminDashboardData,
} from "../../../services/superAdminDashboardService";
import { CallHistoryDrawer } from "./CallHistoryDrawer";
import type { MockCallQueueStudentItem } from "../../../services/mockCallService";

type SortField = "advisorName" | "assignedDataCount" | "callsCount" | "admissionsCount";

export const SuperAdminCallReportView: React.FC = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call history drawer state
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<MockCallQueueStudentItem | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [callingFilter, setCallingFilter] = useState<"ALL" | "CALLED" | "ZERO_CALLS">("ALL");

  // Sorting for Advisor table
  const [sortField, setSortField] = useState<SortField>("callsCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const loadReport = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSuperAdminDashboardStats(accessToken);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load Super Admin Call Report:", err);
      setError(err.message || "Failed to load call monitoring metrics.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-24 w-full bg-surface rounded-2xl border border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-2xl border border-border" />
          ))}
        </div>
        <div className="h-80 bg-surface rounded-2xl border border-border" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-center">
        <AlertCircle size={36} className="text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-text-primary">Failed to Load Program Advisor Calling Report</h3>
        <p className="text-xs text-text-secondary mt-1 max-w-md">{error}</p>
        <button
          type="button"
          onClick={loadReport}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Loading
        </button>
      </div>
    );
  }

  const {
    kpis = {
      callsTodayCount: 0,
      availableDataCount: 0,
      activeAssignmentsCount: 0,
    },
    advisorPerformance = [],
    dailyTeamReport = [],
    callsTodayList = [],
    attentionRequired = {
      zeroCallAdvisorsCount: 0,
    },
  } = data || {};

  // Extract distinct teams for filter dropdown
  const teamsList = Array.from(
    new Set(advisorPerformance.map((a) => a.teamName).filter(Boolean))
  ).sort();

  // Filter advisors
  const filteredAdvisors = advisorPerformance.filter((adv) => {
    const matchesSearch =
      adv.advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.teamName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTeam = selectedTeam === "ALL" || adv.teamName === selectedTeam;

    let matchesCallingStatus = true;
    if (callingFilter === "CALLED") {
      matchesCallingStatus = adv.callsCount > 0;
    } else if (callingFilter === "ZERO_CALLS") {
      matchesCallingStatus = adv.callsCount === 0;
    }

    return matchesSearch && matchesTeam && matchesCallingStatus;
  });

  // Sort advisors
  const sortedAdvisors = [...filteredAdvisors].sort((a, b) => {
    const valA = a[sortField] || 0;
    const valB = b[sortField] || 0;
    if (typeof valA === "string" && typeof valB === "string") {
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === "asc"
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  // Total metrics calculations from existing data
  const totalAssignedData = advisorPerformance.reduce((acc, a) => acc + (a.assignedDataCount || 0), 0);
  const totalCallsLogged = kpis.callsTodayCount || callsTodayList.length;
  const zeroCallCount = attentionRequired.zeroCallAdvisorsCount || advisorPerformance.filter((a) => a.callsCount === 0).length;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <PhoneCall size={26} className="text-primary-500" />
            Program Advisor Calling Report
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monitor calling activity, advisor performance, and assigned lead tracking across teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Activity size={14} /> Telephony Tracking: Standby Mode
          </span>
          <button
            type="button"
            onClick={loadReport}
            title="Refresh Report"
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-surface-hover transition cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Assigned Data */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Assigned Data
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Layers size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-text-primary tracking-tight">
            {totalAssignedData.toLocaleString()}
          </div>
          <p className="text-xs text-text-secondary">
            Active dataset allocations across advisors
          </p>
        </div>

        {/* Card 2: Calls Logged Today */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Calls Logged Today
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <PhoneCall size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-text-primary tracking-tight">
            {totalCallsLogged.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Recorded advisor call interactions
          </p>
        </div>

        {/* Card 3: Zero-Call Advisors */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Zero-Call Advisors
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <PhoneOff size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-text-primary tracking-tight">
            {zeroCallCount}
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            Advisors with no logged calls today
          </p>
        </div>

        {/* Card 4: Total Advisors Monitored */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Advisors Monitored
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-text-primary tracking-tight">
            {advisorPerformance.length}
          </div>
          <p className="text-xs text-text-secondary">
            Across {dailyTeamReport.length} active teams
          </p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <Filter size={14} className="text-primary-500" />
            <span>Calling Report Filters</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search advisor or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Team Dropdown Filter */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="ALL">All Teams ({teamsList.length})</option>
              {teamsList.map((tm) => (
                <option key={tm} value={tm}>
                  {tm}
                </option>
              ))}
            </select>
          </div>

          {/* Calling Activity Filter */}
          <div>
            <select
              value={callingFilter}
              onChange={(e) => setCallingFilter(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="ALL">All Calling Statuses</option>
              <option value="CALLED">Advisors With Logged Calls</option>
              <option value="ZERO_CALLS">Zero Call Advisors</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Employee Calling Performance Table */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-500">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Program Advisor Calling Performance</h3>
              <p className="text-[11px] text-text-muted">Breakdown of assigned leads vs actual call activity per advisor</p>
            </div>
          </div>

          <div className="text-xs font-medium text-text-muted">
            Showing <span className="font-bold text-text-primary">{sortedAdvisors.length}</span> of{" "}
            <span className="font-bold text-text-primary">{advisorPerformance.length}</span> advisors
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-muted">
                <th
                  onClick={() => handleSort("advisorName")}
                  className="px-4 py-3 cursor-pointer hover:text-text-primary transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Program Advisor</span>
                    {sortField === "advisorName" ? (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3">Team</th>
                <th
                  onClick={() => handleSort("assignedDataCount")}
                  className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Assigned Data</span>
                    {sortField === "assignedDataCount" ? (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("callsCount")}
                  className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Calls Made</span>
                    {sortField === "callsCount" ? (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("admissionsCount")}
                  className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Admissions</span>
                    {sortField === "admissionsCount" ? (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Calling Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedAdvisors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-text-muted">
                    No program advisors match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedAdvisors.map((adv) => {
                  const hasCalls = adv.callsCount > 0;
                  return (
                    <tr key={adv.userId} className="hover:bg-surface-hover/50 transition">
                      <td className="px-4 py-3 font-semibold text-text-primary text-xs">
                        {adv.advisorName}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {adv.teamName || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-text-primary">
                        {adv.assignedDataCount}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {adv.callsCount}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-primary-500">
                        {adv.admissionsCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasCalls ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> Active Calling
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            <PhoneOff size={12} /> 0 Calls Logged
                          </span>
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

      {/* 5. Persisted Calls & Interaction Log Activity */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Recent Call & Interaction Activity Log</h3>
              <p className="text-[11px] text-text-muted">Persisted call records and disposition outcomes</p>
            </div>
          </div>
          <span className="text-xs text-text-muted font-medium">
            Telephony Analytics Sync
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-background/50 text-text-muted font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">Student / Lead</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Advisor</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Call Time</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Call Outcome</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {callsTodayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-text-muted">
                    No recent call activity logged today.
                  </td>
                </tr>
              ) : (
                callsTodayList.map((call) => (
                  <tr key={call.id} className="hover:bg-surface-hover/50 transition">
                    <td className="px-4 py-3 font-semibold text-text-primary">{call.student}</td>
                    <td className="px-4 py-3 text-text-secondary font-mono">{call.phone}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{call.advisor}</td>
                    <td className="px-4 py-3 text-text-muted">{call.team}</td>
                    <td className="px-4 py-3 text-text-muted font-mono">
                      {new Date(call.callTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-text-muted font-mono">{call.duration}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {call.callOutcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {call.studentDataId ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudentForHistory({
                              studentDataId: call.studentDataId!,
                              firstName: call.student,
                              phone: call.phone,
                            } as any)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-primary hover:bg-neutral-100 transition shadow-2xs"
                          title="View complete call history"
                        >
                          <History size={13} className="text-primary-600" />
                          History
                        </button>
                      ) : (
                        <span className="text-[11px] text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super Admin Call History Drawer */}
      <CallHistoryDrawer
        isOpen={!!selectedStudentForHistory}
        onClose={() => setSelectedStudentForHistory(null)}
        student={selectedStudentForHistory}
      />
    </div>
  );
};
