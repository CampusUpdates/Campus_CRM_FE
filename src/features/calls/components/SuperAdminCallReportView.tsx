import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PhoneCall,
  Users,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  PhoneOff,
  History,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchSuperAdminDashboardStats,
  type SuperAdminDashboardData,
} from "../../../services/superAdminDashboardService";
import { CallHistoryDrawer } from "./CallHistoryDrawer";
import type { MockCallQueueStudentItem } from "../../../services/mockCallService";
import { getCompactPageNumbers } from "../../../utils/paginationUtils";
import { DashboardDropdown, PageLoadingState, PageErrorState, PageEmptyState } from "../../../components/common";

type SortField = "advisorName" | "assignedDataCount" | "callsCount" | "answeredCallsCount" | "notAnsweredCallsCount";
type DatePeriod = "today" | "yesterday" | "7days" | "30days" | "all" | "custom";

function getDateRangeForPeriod(period: DatePeriod): { startDate?: string; endDate?: string } {
  const now = new Date();
  if (period === "all") {
    return { startDate: "all" };
  }
  if (period === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const dateStr = y.toISOString().split("T")[0];
    return { startDate: dateStr, endDate: dateStr };
  }
  if (period === "7days") {
    const past = new Date(now);
    past.setDate(past.getDate() - 6);
    return {
      startDate: past.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    };
  }
  if (period === "30days") {
    const past = new Date(now);
    past.setDate(past.getDate() - 29);
    return {
      startDate: past.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    };
  }
  const todayStr = now.toISOString().split("T")[0];
  return { startDate: todayStr, endDate: todayStr };
}

export const SuperAdminCallReportView: React.FC = () => {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDateParam = (searchParams.get("date") as DatePeriod) || "today";

  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePeriod, setDatePeriod] = useState<DatePeriod>(initialDateParam);

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedCustomStartDate, setAppliedCustomStartDate] = useState("");
  const [appliedCustomEndDate, setAppliedCustomEndDate] = useState("");

  // Call history drawer state
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<MockCallQueueStudentItem | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [callingFilter, setCallingFilter] = useState<"ALL" | "CALLED" | "ZERO_CALLS">("ALL");
  const [callTimingFilter, setCallTimingFilter] = useState<string>(
    searchParams.get("callTiming") || "ALL"
  );
  const [callTimeFilter, setCallTimeFilter] = useState<string>("ALL");

  // Sorting for Advisor table
  const [sortField, setSortField] = useState<SortField>("callsCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Call Logs Pagination
  const CALLS_PER_PAGE = 10;
  const [callLogsPage, setCallLogsPage] = useState(1);

  const loadReport = useCallback(async (targetPage = callLogsPage, isSilent = false, signal?: AbortSignal) => {
    if (!accessToken) return;

    let startDate, endDate;
    if (datePeriod === "custom") {
      if (!appliedCustomStartDate || !appliedCustomEndDate) {
        return; // wait until custom dates are applied
      }
      startDate = appliedCustomStartDate;
      endDate = appliedCustomEndDate;
    } else {
      const range = getDateRangeForPeriod(datePeriod);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await fetchSuperAdminDashboardStats(
        accessToken,
        startDate,
        endDate,
        targetPage,
        CALLS_PER_PAGE,
        callTimeFilter,
        callTimingFilter,
        signal
      );
      if (signal?.aborted) return;
      setData(res);
    } catch (err: any) {
      if (signal?.aborted || err.name === "AbortError") return;
      console.error("Failed to load Super Admin Call Report:", err);
      if (!isSilent) setError(err.message || "Failed to load call monitoring metrics.");
    } finally {
      if (!isSilent && !signal?.aborted) setLoading(false);
    }
  }, [accessToken, datePeriod, callLogsPage, callTimeFilter, callTimingFilter, appliedCustomStartDate, appliedCustomEndDate]);

  // Handle Call Timing change (All Day / Pre-Lunch / Post-Lunch)
  const handleCallTimingChange = (newTiming: string) => {
    setCallTimingFilter(newTiming);
    setCallTimeFilter("ALL");
    setCallLogsPage(1);
    setSearchParams((prev) => {
      if (newTiming === "ALL") {
        prev.delete("callTiming");
      } else {
        prev.set("callTiming", newTiming);
      }
      return prev;
    });
  };

  // Handle period change
  const handlePeriodChange = (period: DatePeriod) => {
    if (period === datePeriod) return;
    if (period !== "custom") {
      setLoading(true);
    }
    setDatePeriod(period);
    setCallLogsPage(1);
    setSearchParams((prev) => {
      prev.set("date", period);
      return prev;
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCallLogsPage(newPage);
    loadReport(newPage, false);
  };

  // Initial load & real-time background polling every 5 seconds
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    const abortController = new AbortController();

    const pollData = async () => {
      if (!isMounted) return;

      try {
        await loadReport(callLogsPage, true, abortController.signal);
      } catch (e) {
        // Handle gracefully, retry on next poll if not aborted
      }

      if (isMounted) {
        timeoutId = setTimeout(pollData, 5000);
      }
    };

    // Initial load
    loadReport(callLogsPage, false, abortController.signal).then(() => {
      if (isMounted) {
        timeoutId = setTimeout(pollData, 5000);
      }
    });

    return () => {
      isMounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [loadReport, callLogsPage, callTimeFilter, callTimingFilter]);


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
      <div className="w-full max-w-full space-y-6 pb-12">
        <PageLoadingState
          message="Loading Team Member Call Performance..."
          description="Aggregating calling metrics, response times, and team performance data"
          minHeight="min-h-[420px]"
        />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full max-w-full space-y-6 pb-12">
        <PageErrorState
          title="Failed to Load Team Member Call Performance Report"
          message={error}
          onRetry={() => loadReport(1, false)}
          minHeight="min-h-[380px]"
        />
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
    callsTodayList: rawCallsList,
    attentionRequired = {
      zeroCallAdvisorsCount: 0,
    },
  } = data || {};

  const callsList = Array.isArray(rawCallsList) ? rawCallsList : rawCallsList?.data || [];
  const callsPagination = !Array.isArray(rawCallsList)
    ? rawCallsList?.pagination
    : { page: callLogsPage, limit: CALLS_PER_PAGE, total: callsList.length, totalPages: Math.ceil(callsList.length / CALLS_PER_PAGE) || 1 };

  const currentCallLogsPage = callsPagination?.page || callLogsPage;
  const totalCallLogsPages = callsPagination?.totalPages || 1;
  const totalCallsCount = callsPagination?.total || callsList.length;

  const startRecord = totalCallsCount === 0 ? 0 : (currentCallLogsPage - 1) * CALLS_PER_PAGE + 1;
  const endRecord = Math.min(currentCallLogsPage * CALLS_PER_PAGE, totalCallsCount);
  const paginatedCallsTodayList = callsList;

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
  const totalCallsLogged = kpis.callsTodayCount || totalCallsCount;
  const zeroCallCount =
    attentionRequired.zeroCallAdvisorsCount !== undefined
      ? attentionRequired.zeroCallAdvisorsCount
      : advisorPerformance.filter((a) => a.callsCount === 0).length;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <PhoneCall size={26} className="text-primary-500" />
            Team Member Call Performance
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monitor calling activity, team member performance, and assigned lead tracking across teams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Period Filter Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <DashboardDropdown
              value={datePeriod}
              onChange={(val) => handlePeriodChange(val as DatePeriod)}
              options={[
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "7days", label: "Last 7 Days" },
                { value: "30days", label: "Last 30 Days" },
                { value: "all", label: "All Time" },
                { value: "custom", label: "Custom Date Range" },
              ]}
              minWidth="150px"
            />

            {datePeriod === "custom" && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1 shadow-xs text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || undefined}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 focus:border-primary-500 focus:outline-none cursor-text"
                />
                <span className="text-text-muted font-medium">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate || undefined}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 focus:border-primary-500 focus:outline-none cursor-text"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customStartDate && customEndDate && customStartDate <= customEndDate) {
                      setLoading(true);
                      if (customStartDate === appliedCustomStartDate && customEndDate === appliedCustomEndDate) {
                        loadReport(1, false);
                      } else {
                        setAppliedCustomStartDate(customStartDate);
                        setAppliedCustomEndDate(customEndDate);
                      }
                    }
                  }}
                  disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
                  className="rounded-md bg-primary-600 px-3 py-1 font-semibold text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate("");
                    setCustomEndDate("");
                    setAppliedCustomStartDate("");
                    setAppliedCustomEndDate("");
                    handlePeriodChange("today");
                  }}
                  className="rounded-md border border-border bg-background px-3 py-1 font-semibold text-text-primary hover:bg-surface-hover transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Real-Time Live
          </span>

          <button
            type="button"
            onClick={() => loadReport(1, false)}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            <DashboardDropdown
              value={selectedTeam}
              onChange={(val) => setSelectedTeam(val)}
              options={[
                { value: "ALL", label: `All Teams (${teamsList.length})` },
                ...teamsList.map((tm) => ({ value: tm, label: tm })),
              ]}
              minWidth="160px"
            />
          </div>

          {/* Calling Activity Filter */}
          <div>
            <DashboardDropdown
              value={callingFilter}
              onChange={(val) => setCallingFilter(val as any)}
              options={[
                { value: "ALL", label: "All Calling Statuses" },
                { value: "CALLED", label: "Advisors With Logged Calls" },
                { value: "ZERO_CALLS", label: "Zero Call Advisors" },
              ]}
              minWidth="175px"
            />
          </div>

          {/* Call Timing Filter */}
          <div>
            <DashboardDropdown
              id="call-timing-filter"
              aria-label="Call Timing"
              value={callTimingFilter}
              onChange={handleCallTimingChange}
              options={[
                { value: "ALL", label: "All Day — 10:00 AM to 7:00 PM" },
                { value: "PRE_LUNCH", label: "Pre-Lunch Calls — 10:00 AM to 2:00 PM" },
                { value: "POST_LUNCH", label: "Post-Lunch Calls — 2:30 PM to 7:00 PM" },
              ]}
              minWidth="200px"
            />
          </div>

          {/* Call Time (Hourly) Filter */}
          <div>
            <DashboardDropdown
              id="hourly-call-time-filter"
              aria-label="Working Hours"
              value={callTimeFilter}
              onChange={(val) => {
                setCallTimeFilter(val);
                setCallLogsPage(1);
              }}
              options={[
                { value: "ALL", label: "All Hours (10:00 AM - 07:00 PM)" },
                { value: "10:00-11:00", label: "10:00 AM – 11:00 AM" },
                { value: "11:00-12:00", label: "11:00 AM – 12:00 PM" },
                { value: "12:00-13:00", label: "12:00 PM – 01:00 PM" },
                { value: "13:00-14:00", label: "01:00 PM – 02:00 PM" },
                { value: "14:00-15:00", label: "02:00 PM – 03:00 PM" },
                { value: "15:00-16:00", label: "03:00 PM – 04:00 PM" },
                { value: "16:00-17:00", label: "04:00 PM – 05:00 PM" },
                { value: "17:00-18:00", label: "05:00 PM – 06:00 PM" },
                { value: "18:00-19:00", label: "06:00 PM – 07:00 PM" },
              ]}
              minWidth="190px"
            />
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
              <h3 className="text-sm font-bold text-text-primary">Team Member Call Performance</h3>
              <p className="text-[11px] text-text-muted">Breakdown of assigned data vs actual call activity per team member</p>
            </div>
          </div>

          <div className="text-xs font-medium text-text-muted">
            Showing <span className="font-bold text-text-primary">{sortedAdvisors.length}</span> of{" "}
            <span className="font-bold text-text-primary">{advisorPerformance.length}</span> team members
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-muted">
                <th
                  onClick={() => handleSort("advisorName")}
                  className="px-4 py-3 cursor-pointer hover:text-text-primary transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Advisor</span>
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
                    <span>Calls Today</span>
                    {sortField === "callsCount" ? (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("answeredCallsCount")}
                  className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Answered Calls</span>
                    {sortField === "answeredCallsCount" ? (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("notAnsweredCallsCount")}
                  className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Not Answered</span>
                    {sortField === "notAnsweredCallsCount" ? (
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
                <PageEmptyState
                  isTableRow
                  colSpan={7}
                  icon={Users}
                  title="No team members match the selected filters"
                  description="Try adjusting your team or calling status filters."
                />
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
                      <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">
                        {adv.assignedDataCount}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">
                        {adv.callsCount}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">
                        {adv.answeredCallsCount || 0}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">
                        {adv.notAnsweredCallsCount || 0}
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
              {paginatedCallsTodayList.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={8}
                  icon={PhoneCall}
                  title="No recent call activity logged"
                  description="No calls have been recorded for the selected period and timing filters."
                />
              ) : (
                paginatedCallsTodayList.map((call) => (
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

        {/* Call Logs Pagination Controls */}
        {totalCallsCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
            <div className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{startRecord}</span> to{" "}
              <span className="font-semibold text-text-primary">{endRecord}</span> of{" "}
              <span className="font-semibold text-text-primary">{totalCallsCount}</span> entries
            </div>

            {totalCallLogsPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-1.5 self-center sm:self-auto flex-wrap justify-center">
                <button
                  type="button"
                  disabled={currentCallLogsPage <= 1}
                  onClick={() => handlePageChange(Math.max(1, currentCallLogsPage - 1))}
                  className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>

                {getCompactPageNumbers(currentCallLogsPage, totalCallLogsPages).map((page, idx) => {
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
                  const isActive = currentCallLogsPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`flex h-7 min-w-[28px] sm:h-7.5 sm:min-w-[30px] px-1.5 items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-primary-600 text-white shadow-xs"
                          : "border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentCallLogsPage >= totalCallLogsPages}
                  onClick={() => handlePageChange(Math.min(totalCallLogsPages, currentCallLogsPage + 1))}
                  className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}
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
