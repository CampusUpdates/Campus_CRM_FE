import { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchTeams, type UserTeam } from "../../../services/userService";
import {
  fetchRecipientsReport,
  exportRecipientsReportCsv,
  type RecipientsReportResponse,
} from "../../../services/broadcastService";

interface BroadcastReportModalProps {
  broadcastId: string | null;
  onClose: () => void;
}

const ROLES = [
  { id: 1, name: "SUPER_ADMIN", label: "Super Admin" },
  { id: 2, name: "MANAGER", label: "Manager" },
  { id: 3, name: "TEAM_LEAD", label: "Team Lead" },
  { id: 4, name: "PROGRAM_ADVISOR", label: "Program Advisor" },
  { id: 5, name: "HR", label: "HR" },
];

export const BroadcastReportModal = ({
  broadcastId,
  onClose,
}: BroadcastReportModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [reportData, setReportData] = useState<RecipientsReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");
  const [ackFilter, setAckFilter] = useState<"ALL" | "ACKNOWLEDGED" | "PENDING">("ALL");
  const [page, setPage] = useState(1);
  const [teams, setTeams] = useState<UserTeam[]>([]);

  // Load teams for dropdown
  useEffect(() => {
    if (accessToken) {
      fetchTeams(accessToken)
        .then((t) => setTeams(t))
        .catch((e) => console.error("Error loading teams", e));
    }
  }, [accessToken]);

  const loadReport = useCallback(async () => {
    if (!broadcastId || !accessToken) return;
    setLoading(true);
    try {
      const data = await fetchRecipientsReport(accessToken, broadcastId, {
        page,
        limit: 25,
        search,
        teamId: teamFilter,
        roleId: roleFilter,
        readStatus: readFilter,
        ackStatus: ackFilter,
      });
      setReportData(data);
    } catch (err: any) {
      console.error("Failed to load report", err);
      toast.error(err.message || "Failed to load recipient tracking report");
    } finally {
      setLoading(false);
    }
  }, [
    broadcastId,
    accessToken,
    page,
    search,
    teamFilter,
    roleFilter,
    readFilter,
    ackFilter,
    toast,
  ]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCsv = async () => {
    if (!broadcastId || !accessToken) return;
    setExporting(true);
    try {
      const blob = await exportRecipientsReportCsv(accessToken, broadcastId, {
        search,
        teamId: teamFilter,
        roleId: roleFilter,
        readStatus: readFilter,
        ackStatus: ackFilter,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `broadcast_${broadcastId}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Acknowledgement report downloaded as CSV.");
    } catch (err: any) {
      toast.error("Failed to export CSV report");
    } finally {
      setExporting(false);
    }
  };

  if (!broadcastId) return null;

  const metrics = reportData?.metrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-500/15 border border-primary-500/30 text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                Acknowledgement Report
              </span>
              <span className="text-xs text-text-muted">
                {reportData?.broadcast?.sentAt
                  ? new Date(reportData.broadcast.sentAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : ""}
              </span>
            </div>
            <h2 className="text-lg font-bold text-text-primary mt-1 truncate max-w-xl">
              {reportData?.broadcast?.title || "Broadcast Report"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={exporting || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-neutral-200 dark:hover:bg-neutral-700 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-surface">
          {/* Message Context & Audience Card */}
          {reportData?.broadcast && (
            <div className="p-4 rounded-xl border border-border bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-secondary">
                    Sent by:{" "}
                    <strong className="text-text-primary">
                      {reportData.broadcast.createdBy
                        ? `${reportData.broadcast.createdBy.firstName} ${reportData.broadcast.createdBy.lastName || ""}`.trim()
                        : "System"}
                    </strong>
                  </span>
                  {reportData.broadcast.createdBy?.role?.name && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 uppercase">
                      {reportData.broadcast.createdBy.role.name.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="text-text-muted">Target Audience:</span>
                  <span className="font-medium px-2 py-0.5 rounded bg-surface border border-border text-text-primary">
                    {reportData.broadcast.targetAudience || "Targeted Recipients"}
                  </span>
                </div>
              </div>

              {reportData.broadcast.body && (
                <div className="p-3.5 rounded-lg bg-surface border border-border text-xs sm:text-sm text-text-primary whitespace-pre-line leading-relaxed shadow-2xs">
                  {reportData.broadcast.body}
                </div>
              )}
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Recipients */}
            <div className="p-3 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/40 shadow-2xs">
              <span className="text-[11px] font-medium text-text-secondary uppercase">
                Intended
              </span>
              <p className="text-xl font-bold text-text-primary mt-1">
                {metrics?.totalRecipients ?? "-"}
              </p>
              <span className="text-[10px] text-text-muted">Total targeted</span>
            </div>

            {/* Delivered */}
            <div className="p-3 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/40 shadow-2xs">
              <span className="text-[11px] font-medium text-text-secondary uppercase">
                Delivered
              </span>
              <p className="text-xl font-bold text-text-primary mt-1">
                {metrics?.deliveredCount ?? "-"}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100% in-app</span>
            </div>

            {/* Read Count */}
            <div className="p-3 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/40 shadow-2xs">
              <span className="text-[11px] font-medium text-text-secondary uppercase">
                Read
              </span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {metrics?.readCount ?? "-"}
              </p>
              <span className="text-[10px] text-text-muted">
                {metrics?.totalRecipients
                  ? `${Math.round((metrics.readCount / metrics.totalRecipients) * 100)}% read`
                  : "0%"}
              </span>
            </div>

            {/* Unread Count */}
            <div className="p-3 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/40 shadow-2xs">
              <span className="text-[11px] font-medium text-text-secondary uppercase">
                Unread
              </span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {metrics?.unreadCount ?? "-"}
              </p>
              <span className="text-[10px] text-text-muted">Not opened yet</span>
            </div>

            {/* Acknowledged Count */}
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 shadow-2xs">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 uppercase">
                Acknowledged
              </span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics?.acknowledgedCount ?? "-"}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-300/80 font-medium">
                {metrics?.totalRecipients
                  ? `${Math.round((metrics.acknowledgedCount / metrics.totalRecipients) * 100)}% signed`
                  : "0%"}
              </span>
            </div>

            {/* Pending Ack Count */}
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 shadow-2xs">
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 uppercase">
                Pending Ack
              </span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {metrics?.pendingAckCount ?? "-"}
              </p>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Needs follow-up</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search recipient by name, email, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500"
              >
                <option value="ALL">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* Team filter */}
              <select
                value={teamFilter}
                onChange={(e) => {
                  setTeamFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500"
              >
                <option value="ALL">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Read Status filter */}
              <select
                value={readFilter}
                onChange={(e) => {
                  setReadFilter(e.target.value as any);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500"
              >
                <option value="ALL">All Read States</option>
                <option value="READ">Read</option>
                <option value="UNREAD">Unread</option>
              </select>

              {/* Ack Status filter */}
              <select
                value={ackFilter}
                onChange={(e) => {
                  setAckFilter(e.target.value as any);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500"
              >
                <option value="ALL">All Ack States</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="PENDING">Pending Ack</option>
              </select>
            </div>
          </div>

          {/* Quick Filter: Show Unacknowledged Employees Only */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAckFilter(ackFilter === "PENDING" ? "ALL" : "PENDING");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${ackFilter === "PENDING"
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300"
                  : "bg-surface border-border text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
                }`}
            >
              <AlertCircle size={14} className="text-rose-500" />
              {ackFilter === "PENDING"
                ? "Showing Unacknowledged Only (Click to Reset)"
                : "View Who Has Not Acknowledged"}
            </button>
          </div>

          {/* Recipients Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
            {loading ? (
              <div className="p-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-primary-500" />
                Loading recipient tracking records...
              </div>
            ) : !reportData || reportData.data.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted">
                No recipient records matched your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-border text-text-secondary font-semibold uppercase">
                    <tr>
                      <th className="px-5 py-3.5 text-left">Employee</th>
                      <th className="px-5 py-3.5 text-left">Role / Team</th>
                      <th className="px-5 py-3.5 text-left">Read Status</th>
                      <th className="px-5 py-3.5 text-left">Read Timestamp</th>
                      <th className="px-5 py-3.5 text-left">Acknowledgement</th>
                      <th className="px-5 py-3.5 text-left">Ack Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reportData.data.map((rec) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition"
                      >
                        {/* Employee info */}
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-text-primary">{rec.name}</p>
                          <p className="text-[11px] text-text-muted">{rec.email}</p>
                        </td>

                        {/* Role & Team */}
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-border font-medium text-[11px] text-text-secondary">
                            {rec.role}
                          </span>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {rec.team}
                          </p>
                        </td>

                        {/* Read status */}
                        <td className="px-5 py-3.5">
                          {rec.isRead ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                              <Eye size={13} />
                              Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-text-muted">
                              Unread
                            </span>
                          )}
                        </td>

                        {/* Read Timestamp */}
                        <td className="px-5 py-3.5 text-text-secondary">
                          {rec.readAt ? (
                            new Date(rec.readAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        {/* Acknowledgement Status */}
                        <td className="px-5 py-3.5">
                          {rec.isAcknowledged ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-semibold text-[11px]">
                              <CheckCircle2 size={13} />
                              Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 font-semibold text-[11px]">
                              <Clock size={13} />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Ack Timestamp */}
                        <td className="px-5 py-3.5 text-text-secondary">
                          {rec.acknowledgedAt ? (
                            new Date(rec.acknowledgedAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {reportData && reportData.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-neutral-50/50 dark:bg-neutral-800/30">
                <span className="text-xs text-text-secondary">
                  Showing page {reportData.meta.page} of {reportData.meta.totalPages} (
                  {reportData.meta.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= reportData.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
