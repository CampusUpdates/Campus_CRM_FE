import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <UserCheck className="text-primary-600 h-7 w-7" />
            Workforce Attendance Records
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Super Admin monitor daily workforce check-ins, working hours, teams, and monthly logs.
          </p>
        </div>

        <button
          onClick={loadAttendance}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
          Refresh Attendance
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-primary-600 dark:text-primary-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Filters & Search
            </h3>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500"
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
                className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-xs text-text-primary focus:outline-none"
              />
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500"
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
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Building2 size={12} /> Team
            </label>
            <select
              value={teamFilter}
              onChange={(e) => handleFilterChange(setTeamFilter, e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500"
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
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Briefcase size={12} /> Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange(setRoleFilter, e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500"
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
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Search Employee
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search name, email..."
                value={searchTerm}
                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-8 pr-3 p-2 text-xs text-text-primary focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real Summary Cards (5 Cards) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* TOTAL RECORDS */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "ALL")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition flex flex-col justify-between ${
            statusFilter === "ALL"
              ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/20"
              : "border-border bg-surface hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Total Records
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
              All
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="text-2xl font-black text-text-primary">{summary.total}</p>
            )}
            <p className="text-[10px] text-text-muted mt-0.5">Matching active scope</p>
          </div>
        </div>

        {/* PRESENT */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "PRESENT")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition flex flex-col justify-between ${
            statusFilter === "PRESENT"
              ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
              : "border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">
              Present
            </span>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800/80">
              P
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-emerald-200/50 dark:bg-emerald-900/50" />
            ) : (
              <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                {summary.present}
              </p>
            )}
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Checked In</p>
          </div>
        </div>

        {/* ABSENT */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "ABSENT")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition flex flex-col justify-between ${
            statusFilter === "ABSENT"
              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-2 ring-rose-500/20"
              : "border-rose-200/80 dark:border-rose-800/60 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900 dark:text-rose-400">
              Absent
            </span>
            <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center justify-center border border-rose-300 dark:border-rose-800/80">
              A
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-rose-200/50 dark:bg-rose-900/50" />
            ) : (
              <p className="text-2xl font-black text-rose-800 dark:text-rose-300">
                {summary.absent}
              </p>
            )}
            <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5">Unchecked workforce</p>
          </div>
        </div>

        {/* HALF DAY */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "HALF_DAY")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition flex flex-col justify-between ${
            statusFilter === "HALF_DAY"
              ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20"
              : "border-amber-200/80 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
              Half Day
            </span>
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-300 dark:border-amber-800/80">
              HD
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-amber-200/50 dark:bg-amber-900/50" />
            ) : (
              <p className="text-2xl font-black text-amber-800 dark:text-amber-300">
                {summary.halfDay}
              </p>
            )}
            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">Late check-in</p>
          </div>
        </div>

        {/* ON LEAVE */}
        <div
          onClick={() => handleFilterChange(setStatusFilter, "LEAVE")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition flex flex-col justify-between ${
            statusFilter === "LEAVE" || statusFilter === "CASUAL_LEAVE"
              ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
              : "border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-400">
              On Leave
            </span>
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-300 dark:border-indigo-800/80">
              L
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-indigo-200/50 dark:bg-indigo-900/50" />
            ) : (
              <p className="text-2xl font-black text-indigo-800 dark:text-indigo-300">
                {summary.leave + summary.casualLeave}
              </p>
            )}
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5">Approved leave</p>
          </div>
        </div>
      </div>

      {/* Main Attendance Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-primary-600" />
            <p className="font-semibold text-text-primary">Loading real database workforce records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} />
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadAttendance}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-neutral-50/80 dark:bg-neutral-800/50 text-text-secondary font-semibold uppercase tracking-wider">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Team</th>
                    <th className="px-5 py-4">Manager</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4">Check-In</th>
                    <th className="px-5 py-4">Check-Out</th>
                    <th className="px-5 py-4 text-right">Working Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-text-muted">
                        <UserCheck size={36} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                        <p className="text-sm font-semibold text-text-primary">No attendance records found.</p>
                        <p className="text-xs text-text-secondary mt-1">
                          No database records match your active filters or search term.
                        </p>
                      </td>
                    </tr>
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
                          className={`cursor-pointer transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                            isSelected
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
          </>
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
