import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  RefreshCw,
  Building2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchAttendanceRecords,
  type AttendanceRecordItem,
  type AttendanceSummary,
  type AttendanceStatusType,
} from "../../../services/attendanceService";
import { fetchTeams, type TeamItem } from "../../../services/teamService";
import { fetchRoles, type UserRole } from "../../../services/userService";
import EmployeeAttendanceDrawer from "../components/EmployeeAttendanceDrawer";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";
import { Tooltip } from "../../../components/Tooltip";

const formatTimeString = (isoStr?: string | null) => {
  if (!isoStr) return "—";
  if (isoStr.includes("AM") || isoStr.includes("PM")) return isoStr;
  const dt = new Date(isoStr);
  if (isNaN(dt.getTime())) return isoStr;
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const renderCircularStatusPill = (status: AttendanceStatusType) => {
  switch (status) {
    case "PRESENT":
      return (
        <span
          title="Present"
          className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          P
        </span>
      );
    case "ABSENT":
      return (
        <span
          title="Absent"
          className="h-7 w-7 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          A
        </span>
      );
    case "HALF_DAY":
      return (
        <span
          title="Half Day"
          className="h-7 w-7 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          HD
        </span>
      );
    case "LEAVE":
    case "CASUAL_LEAVE":
    default:
      return (
        <span
          title={status === "CASUAL_LEAVE" ? "Casual Leave" : "On Leave"}
          className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          L
        </span>
      );
  }
};

const AttendancePage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  // Filter States
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Options Data States
  const [teamsList, setTeamsList] = useState<TeamItem[]>([]);
  const [rolesList, setRolesList] = useState<UserRole[]>([]);

  // Response Data States
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    casualLeave: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Employee for Drawer
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordItem | null>(null);

  // Fetch Teams & Roles for Dropdowns
  useEffect(() => {
    if (!accessToken) return;
    Promise.all([fetchTeams(accessToken), fetchRoles(accessToken)])
      .then(([teamsData, rolesData]) => {
        setTeamsList(teamsData);
        setRolesList(rolesData);
      })
      .catch((err) => console.error("Failed to fetch filter options:", err));
  }, [accessToken]);

  // Fetch Attendance Records from Backend
  const loadAttendance = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    const activeDateParam =
      dateFilter === "custom" && customDate ? customDate : dateFilter;

    try {
      const res = await fetchAttendanceRecords(accessToken, {
        date: activeDateParam,
        status: statusFilter,
        teamId: teamFilter,
        roleId: roleFilter,
        search: searchTerm,
        page,
        limit,
      });

      setRecords(res.records);
      setSummary(res.summary);
    } catch (err: any) {
      console.error("Attendance API fetch error:", err);
      const msg = err.message || "Failed to load attendance records";
      setError(msg);
      toast.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, dateFilter, customDate, statusFilter, teamFilter, roleFilter, searchTerm, page, limit, toast]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Reset page when filters change
  const handleFilterChange = (
    setter: (val: string) => void,
    val: string
  ) => {
    setter(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setDateFilter("today");
    setCustomDate("");
    setStatusFilter("ALL");
    setTeamFilter("all");
    setRoleFilter("all");
    setSearchTerm("");
    setPage(1);
  };

  const hasActiveFilters =
    dateFilter !== "today" ||
    statusFilter !== "ALL" ||
    teamFilter !== "all" ||
    roleFilter !== "all" ||
    searchTerm.trim().length > 0;

  const totalPages = Math.ceil(summary.total / limit) || 1;
  const startItem = summary.total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, summary.total);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4 sm:pb-5">
        <div className="min-w-0 pr-2">
          <h1 className="text-xl sm:text-2xl font-bold sm:font-semibold text-text-primary truncate sm:whitespace-normal">
            Attendance Records
          </h1>
          <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
            Super Admin monitor daily workforce check-ins, working hours, teams, and monthly logs.
          </p>
        </div>

        <div className="shrink-0 self-center">
          <Tooltip content="Refresh attendance" className="px-2.5 py-1 text-xs font-medium rounded-md shadow-lg bg-neutral-900 text-neutral-100 border border-neutral-700 whitespace-nowrap pointer-events-none">
            <button
              onClick={loadAttendance}
              disabled={loading}
              aria-label="Refresh attendance"
              title="Refresh attendance"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface p-2 sm:px-4 sm:py-2.5 text-xs font-semibold text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-primary-600" : "text-text-muted"} />
              <span className="hidden sm:inline">Refresh Attendance</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="space-y-2.5 sm:space-y-3 p-0 sm:p-4 sm:rounded-2xl sm:border sm:border-border sm:bg-surface sm:shadow-2xs">
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
            >
              <X size={13} /> Clear Filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Date Filter */}
          <div className="col-span-1 min-w-0">
            <select
              value={dateFilter}
              onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
              className="w-full h-10 rounded-lg sm:rounded-xl border border-border bg-surface sm:bg-background px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Date</option>
            </select>
            {dateFilter === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full h-10 rounded-lg sm:rounded-xl border border-border bg-surface sm:bg-background px-3 text-xs text-text-primary focus:outline-none"
              />
            )}
          </div>

          {/* Status Filter */}
          <div className="col-span-1 min-w-0">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="w-full h-10 rounded-lg sm:rounded-xl border border-border bg-surface sm:bg-background px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present (P)</option>
              <option value="ABSENT">Absent (A)</option>
              <option value="HALF_DAY">Half Day (HD)</option>
              <option value="LEAVE">On Leave (L)</option>
              <option value="CASUAL_LEAVE">Casual Leave</option>
            </select>
          </div>

          {/* Team Filter */}
          <div className="col-span-1 min-w-0">
            <select
              value={teamFilter}
              onChange={(e) => handleFilterChange(setTeamFilter, e.target.value)}
              className="w-full h-10 rounded-lg sm:rounded-xl border border-border bg-surface sm:bg-background px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
            >
              <option value="all">All Teams</option>
              {teamsList.map((tm) => (
                <option key={tm.id} value={String(tm.id)}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="col-span-1 min-w-0">
            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange(setRoleFilter, e.target.value)}
              className="w-full h-10 rounded-lg sm:rounded-xl border border-border bg-surface sm:bg-background px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
            >
              <option value="all">All Roles</option>
              {rolesList.map((rl) => (
                <option key={rl.id} value={String(rl.id)}>
                  {rl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="col-span-2 lg:col-span-1 min-w-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search name, email..."
                value={searchTerm}
                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                className="w-full h-10 rounded-lg sm:rounded-xl border border-border bg-surface sm:bg-background pl-8 pr-3 text-xs text-text-primary focus:outline-none focus:border-primary-500 placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real Summary Cards (5 Cards) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* TOTAL RECORDS */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "ALL")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFilterChange(setStatusFilter, "ALL")}
          className={`cursor-pointer rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between h-full bg-surface ${statusFilter === "ALL"
            ? "border-primary-500 ring-2 ring-primary-500/20"
            : "border-border hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40"
            }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">
              Total Records
            </span>
            <span className="h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3">
            {loading ? (
              <div className="h-7 sm:h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {summary.total}
              </p>
            )}
            <p className="mt-1 text-[10px] sm:text-[11px] text-text-muted truncate">
              All active records
            </p>
          </div>
        </div>

        {/* PRESENT */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "PRESENT")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFilterChange(setStatusFilter, "PRESENT")}
          className={`cursor-pointer rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between h-full bg-surface ${statusFilter === "PRESENT"
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : "border-border hover:border-emerald-300 dark:hover:border-emerald-800/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40"
            }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">
              Present
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3">
            {loading ? (
              <div className="h-7 sm:h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {summary.present}
              </p>
            )}
            <p className="mt-1 text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
              Checked in
            </p>
          </div>
        </div>

        {/* ABSENT */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "ABSENT")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFilterChange(setStatusFilter, "ABSENT")}
          className={`cursor-pointer rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between h-full bg-surface ${statusFilter === "ABSENT"
            ? "border-rose-500 ring-2 ring-rose-500/20"
            : "border-border hover:border-rose-300 dark:hover:border-rose-800/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40"
            }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">
              Absent
            </span>
            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3">
            {loading ? (
              <div className="h-7 sm:h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {summary.absent}
              </p>
            )}
            <p className="mt-1 text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-medium truncate">
              Unchecked
            </p>
          </div>
        </div>

        {/* HALF DAY */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "HALF_DAY")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFilterChange(setStatusFilter, "HALF_DAY")}
          className={`cursor-pointer rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between h-full bg-surface ${statusFilter === "HALF_DAY"
            ? "border-amber-500 ring-2 ring-amber-500/20"
            : "border-border hover:border-amber-300 dark:hover:border-amber-800/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40"
            }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">
              Half Day
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3">
            {loading ? (
              <div className="h-7 sm:h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {summary.halfDay}
              </p>
            )}
            <p className="mt-1 text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">
              Late check-in
            </p>
          </div>
        </div>

        {/* ON LEAVE */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "LEAVE")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFilterChange(setStatusFilter, "LEAVE")}
          className={`cursor-pointer col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between h-full bg-surface ${statusFilter === "LEAVE" || statusFilter === "CASUAL_LEAVE"
            ? "border-purple-500 ring-2 ring-purple-500/20"
            : "border-border hover:border-purple-300 dark:hover:border-purple-800/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40"
            }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">
              On Leave
            </span>
            <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3">
            {loading ? (
              <div className="h-7 sm:h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {summary.leave + summary.casualLeave}
              </p>
            )}
            <p className="mt-1 text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate">
              Approved leave
            </p>
          </div>
        </div>
      </div>

      {/* Main Attendance Table Card */}
      <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-neutral-50/80 dark:bg-neutral-800/50 text-text-secondary font-semibold uppercase tracking-wider">
                <th className="px-4 sm:px-5 py-3 sm:py-4">Employee</th>
                <th className="px-4 sm:px-5 py-3 sm:py-4">Role</th>
                <th className="px-4 sm:px-5 py-3 sm:py-4">Team</th>
                <th className="px-4 sm:px-5 py-3 sm:py-4">Manager</th>
                <th className="px-4 sm:px-5 py-3 sm:py-4 text-center">Status</th>
                <th className="px-4 sm:px-5 py-3 sm:py-4">Check-In</th>
                <th className="px-4 sm:px-5 py-3 sm:py-4">Check-Out</th>
                <th className="px-4 sm:px-5 py-3 sm:py-4 text-right">Working Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={8}
                  message="Loading attendance records..."
                />
              ) : error ? (
                <PageErrorState
                  isTableRow
                  colSpan={8}
                  title="Failed to load attendance records"
                  message={error}
                  onRetry={loadAttendance}
                />
              ) : records.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={8}
                  icon={UserCheck}
                  title="No attendance records found"
                  message="No database records match your active filters or search term."
                />
              ) : (
                records.map((rec) => {
                  const empUser = rec.user;
                  const empName = empUser
                    ? `${empUser.firstName || ""} ${empUser.lastName || ""}`.trim()
                    : "Employee";
                  const empRole = empUser?.role?.name || "Member";
                  const teamName = empUser?.team?.name || "Unassigned";
                  const mgrUser = empUser?.team?.manager;
                  const mgrName = mgrUser
                    ? `${mgrUser.firstName} ${mgrUser.lastName || ""}`.trim()
                    : "Unassigned";

                  const isSelected = selectedRecord?.id === rec.id;

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className={`cursor-pointer transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${isSelected
                        ? "bg-primary-50/60 dark:bg-primary-950/40 font-medium border-l-4 border-l-primary-500"
                        : ""
                        }`}
                    >
                      <td className="px-5 py-4 font-bold text-text-primary flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/80 dark:text-primary-300 dark:border dark:border-primary-800/60 flex items-center justify-center font-bold text-xs shrink-0">
                          {empName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="leading-tight">{empName}</p>
                          {empUser?.email && (
                            <p className="text-[11px] font-normal text-text-muted truncate mt-0.5">
                              {empUser.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-text-secondary font-medium">{empRole}</td>

                      <td className="px-5 py-4 text-text-secondary font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Building2 size={13} className="text-text-muted" />
                          {teamName}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-text-secondary font-medium">{mgrName}</td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          {renderCircularStatusPill(rec.status)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-text-secondary font-mono">
                        {formatTimeString(rec.checkIn)}
                      </td>

                      <td className="px-5 py-4 text-text-secondary font-mono">
                        {formatTimeString(rec.checkOut)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-text-primary">
                        {rec.workingHours || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
        {summary.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-neutral-50/50 dark:bg-neutral-900/50 text-xs">
            <span className="text-text-secondary">
              Showing <strong className="text-text-primary">{startItem}</strong>–
              <strong className="text-text-primary">{endItem}</strong> of{" "}
              <strong className="text-text-primary">{summary.total}</strong> workforce records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 font-semibold text-text-primary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary disabled:opacity-40 transition flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Employee Right-Side Drawer */}
      {selectedRecord && (
        <EmployeeAttendanceDrawer
          userId={selectedRecord.userId}
          employeeName={
            selectedRecord.user
              ? `${selectedRecord.user.firstName || ""} ${selectedRecord.user.lastName || ""}`.trim()
              : "Employee"
          }
          roleName={selectedRecord.user?.role?.name || "Member"}
          teamName={selectedRecord.user?.team?.name || "Unassigned"}
          managerName={
            selectedRecord.user?.team?.manager
              ? `${selectedRecord.user.team.manager.firstName} ${selectedRecord.user.team.manager.lastName || ""}`.trim()
              : "Unassigned"
          }
          email={selectedRecord.user?.email}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default AttendancePage;
