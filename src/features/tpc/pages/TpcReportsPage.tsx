import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchTpcReports, type TpcReportsResponse } from "../../../services/tpcService";
import { fetchTeams, fetchUsers, type UserTeam, type UserItem } from "../../../services/userService";
import {
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  History,
  PhoneCall,
  Search,
  X,
} from "lucide-react";
import InteractionHistoryModal from "../components/InteractionHistoryModal";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

interface FlattenedTpcRow {
  id: string; // unique key
  tpcId: string;
  leadId: string;
  leadName: string;
  assignedBy: string;
  assignedTo: string;
  currentOwner: string;
  assignedDate: string | null;
  completedDate: string | null;
  notes: string;
  status: string;
}

const TpcReportsPage = () => {
  const { accessToken, user } = useAuth();
  const toast = useToast();

  const isSuperAdmin = user?.roleCode === "SUPER_ADMIN";
  const isManager = user?.roleCode === "MANAGER";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<TpcReportsResponse | null>(null);

  // Scoped directory data for filters
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED" | "NOT_ASSIGNED">("ALL");
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "today" | "yesterday" | "7days" | "30days">("ALL");

  const [historyModalLeadId, setHistoryModalLeadId] = useState<string | null>(null);
  const [historyModalLeadName, setHistoryModalLeadName] = useState<string>("");

  // Load scoped teams and users for filter dropdowns
  useEffect(() => {
    if (!accessToken) return;
    Promise.all([fetchTeams(accessToken), fetchUsers(accessToken)])
      .then(([teamsData, usersData]) => {
        setTeams(teamsData);
        setUsers(usersData.filter((u) => u.status === "ACTIVE"));
      })
      .catch((err) => {
        console.error("Failed to load filter options", err);
      });
  }, [accessToken]);

  const loadReports = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTpcReports(accessToken, {
        teamId: teamFilter !== "ALL" ? teamFilter : undefined,
        userId: userFilter !== "ALL" ? userFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        period: periodFilter !== "ALL" ? periodFilter : undefined,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
      });
      setReports(data);
    } catch (err: any) {
      const msg = err.message || "Failed to load TPC reports";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, teamFilter, userFilter, statusFilter, periodFilter, searchTerm, toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const rows = useMemo(() => {
    if (!reports?.data) return [];

    const flattened: FlattenedTpcRow[] = [];

    reports.data.forEach((tpc: any) => {
      const lead = tpc.lead;
      const leadName = lead ? `${lead.firstName} ${lead.lastName || ""}`.trim() : "Unknown";

      const activeAssignments = lead?.assignments || [];
      const currentOwnerObj = activeAssignments.length > 0 ? activeAssignments[0].user : null;
      const currentOwner = currentOwnerObj
        ? `${currentOwnerObj.firstName} ${currentOwnerObj.lastName || ""}`.trim()
        : "Unassigned";

      const notes = lead?.notes || "";

      if (!tpc.assignments || tpc.assignments.length === 0) {
        flattened.push({
          id: `${tpc.id}-unassigned`,
          tpcId: tpc.id,
          leadId: lead?.id || "",
          leadName,
          assignedBy: "—",
          assignedTo: "—",
          currentOwner,
          assignedDate: null,
          completedDate: null,
          notes,
          status: "NOT_ASSIGNED",
        });
      } else {
        tpc.assignments.forEach((assign: any) => {
          const assignedBy = assign.assignedBy
            ? `${assign.assignedBy.firstName} ${assign.assignedBy.lastName || ""}`.trim()
            : "System";

          const assignedTo = assign.assignedTo
            ? `${assign.assignedTo.firstName} ${assign.assignedTo.lastName || ""}`.trim()
            : "Unknown";

          flattened.push({
            id: assign.id,
            tpcId: tpc.id,
            leadId: lead?.id || "",
            leadName,
            assignedBy,
            assignedTo,
            currentOwner,
            assignedDate: assign.assignedAt,
            completedDate: assign.completedAt,
            notes,
            status: assign.status,
          });
        });
      }
    });

    return flattened;
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            TPC Reports
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isSuperAdmin
              ? "Comprehensive Third Party Calling reports and lead activity across the CRM."
              : isManager
              ? "Third Party Calling reports and assignment activity for your authorized teams."
              : "Monitor Third Party Calling assignments and lead activity."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            <span className="text-xs sm:text-sm font-medium">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. ACTIVE LEADS TODAY */}
        <div className="group relative rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Active Leads Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-text-primary group-hover:text-blue-600 transition">
              {loading ? "—" : reports?.counts.activeLeadsToday ?? 0}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Leads currently within active assignment period
          </p>
        </div>

        {/* 2. TPC ASSIGNED TODAY */}
        <div className="group relative rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              TPC Assigned Today
            </p>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-text-primary group-hover:text-purple-600 transition">
              {loading ? "—" : reports?.counts.tpcAssignedToday ?? 0}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            TPC assignments created in selected period
          </p>
        </div>

        {/* 3. TPC COMPLETED */}
        <div className="group relative rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              TPC Completed
            </p>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-text-primary group-hover:text-emerald-600 transition">
              {loading ? "—" : reports?.counts.tpcCompleted ?? 0}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Total assigned TPCs marked completed
          </p>
        </div>

        {/* 4. NOT ASSIGNED TPCS */}
        <div className="group relative rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Not Assigned TPCs
            </p>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-text-primary group-hover:text-amber-600 transition">
              {loading ? "—" : reports?.counts.notAssignedTpcs ?? 0}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            TPC records awaiting assignment
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full min-w-0">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by student name, advisor, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              h-11
              w-full
              rounded-xl
              border border-border
              bg-surface
              pl-11 pr-10
              text-sm text-text-primary
              placeholder:text-text-muted
              outline-none
              focus:border-primary-500
              focus:ring-2 focus:ring-primary-100
              transition
            "
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Team Filter */}
          <div className="relative">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-11 px-3 pr-8 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="ALL">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div className="relative">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="h-11 px-3 pr-8 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="ALL">All Employees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName || ""} {u.role?.name ? `(${u.role.name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="NOT_ASSIGNED">Not Assigned</option>
          </select>

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="h-11 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Lead TPC Table Section */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-base font-bold text-text-primary">Lead TPCs</h2>
          <span className="text-xs font-semibold text-text-secondary">
            Showing {rows.length} Total Records
          </span>
        </div>

        <div className="w-full max-w-full min-w-0 overflow-x-auto">
          {loading ? (
            <SectionLoadingState
              message="Loading TPC reports..."
              description="Aggregating calling logs, assignment statuses, and history"
              minHeight="min-h-[280px]"
            />
          ) : error ? (
            <PageErrorState
              title="Unable to load TPC reports"
              message={error}
              onRetry={loadReports}
              minHeight="min-h-[280px]"
            />
          ) : rows.length === 0 ? (
            <PageEmptyState
              icon={Users}
              title="No TPC records found"
              description="No TPC assignments match your current filters."
              minHeight="min-h-[280px]"
            />
          ) : (
            <table className="w-max min-w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">Lead Name</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">Assigned By</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">Assigned To</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">Current Owner</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">Assigned Date</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">Completed Date</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">Notes</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary whitespace-nowrap">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="px-5 py-4 text-sm">
                      <div className="font-medium text-text-primary">{row.leadName}</div>
                      {row.status === "NOT_ASSIGNED" && (
                        <div className="mt-1">
                          <span className="inline-flex rounded-md bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:text-rose-300">
                            Not Assigned
                          </span>
                        </div>
                      )}
                      {row.status === "PENDING" && (
                        <div className="mt-1">
                          <span className="inline-flex rounded-md bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:text-blue-300">
                            Pending
                          </span>
                        </div>
                      )}
                      {row.status === "COMPLETED" && (
                        <div className="mt-1">
                          <span className="inline-flex rounded-md bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                            Completed
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {row.assignedBy}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary font-medium">
                      {row.assignedTo}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {row.currentOwner}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {row.assignedDate ? new Date(row.assignedDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {row.completedDate ? new Date(row.completedDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      <div className="relative group cursor-help max-w-[200px]">
                        <p className="truncate">
                          {row.notes || "—"}
                        </p>
                        {row.notes && (
                          <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-max max-w-xs rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-xl group-hover:block whitespace-pre-wrap">
                            {row.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setHistoryModalLeadId(row.leadId);
                          setHistoryModalLeadName(row.leadName);
                        }}
                        className="p-1.5 text-text-secondary hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/50 rounded-md transition inline-flex items-center justify-center cursor-pointer"
                        title="View History"
                      >
                        <History size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {historyModalLeadId && (
        <InteractionHistoryModal
          leadId={historyModalLeadId}
          leadName={historyModalLeadName}
          onClose={() => setHistoryModalLeadId(null)}
        />
      )}
    </div>
  );
};

export default TpcReportsPage;
