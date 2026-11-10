import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  Building2,
  BookOpen,
  IndianRupee,
  Send,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchPitchApprovals,
  processPitchApproval,
  type PitchApprovalItem,
} from "../../../services/pitchApprovalService";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const PitchApprovalsPage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [approvals, setApprovals] = useState<PitchApprovalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadApprovals = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPitchApprovals(
        accessToken,
        statusFilter === "ALL" ? undefined : statusFilter
      );
      setApprovals(data);
    } catch (err: any) {
      const msg = err.message || "Failed to load college approvals";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [accessToken, statusFilter]);

  const handleAction = async (
    pitchId: string,
    action: "APPROVED" | "REJECTED"
  ) => {
    if (!accessToken) return;
    try {
      setProcessingId(pitchId);
      await processPitchApproval(accessToken, pitchId, action);
      toast.success(
        `College pitch request ${action === "APPROVED" ? "approved" : "rejected"} successfully.`
      );
      await loadApprovals();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action.toLowerCase()} college approval`);
    } finally {
      setProcessingId(null);
    }
  };

  const renderBadge = (status: "PENDING" | "APPROVED" | "REJECTED") => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            <Clock size={13} />
            PENDING APPROVAL
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={13} />
            APPROVED
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">
            <XCircle size={13} />
            REJECTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-5">
        <div className="min-w-0">
          <h1 className="text-[19px] sm:text-2xl font-bold sm:font-semibold text-text-primary leading-tight tracking-tight sm:tracking-normal truncate sm:whitespace-normal">
            College Approvals
          </h1>
          <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
            Review college applications submitted by advisors.
          </p>
        </div>

        {/* Refresh Action & Status Filter Dropdown */}
        <div className="flex items-center justify-start gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={loadApprovals}
            disabled={loading}
            title="Refresh college approvals"
            aria-label="Refresh"
            className="w-[38px] h-[38px] rounded-full sm:rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs inline-flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={`shrink-0 ${loading ? "animate-spin text-primary-600" : ""}`} />
          </button>

          <div className="relative flex-[0_0_120px] max-w-[120px] sm:flex-initial sm:max-w-none sm:w-36">
            <select
              id="pitch-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[120px] sm:w-36 h-[38px] appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-xs font-semibold text-text-primary shadow-2xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40 cursor-pointer transition"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Approvals Content Container */}
      {loading ? (
        <SectionLoadingState
          message="Loading college approvals..."
          description="Retrieving pending and processed approval requests"
          minHeight="min-h-[280px]"
        />
      ) : error ? (
        <PageErrorState
          title="Unable to load college approvals"
          message={error}
          onRetry={loadApprovals}
          minHeight="min-h-[280px]"
        />
      ) : approvals.length === 0 ? (
        <PageEmptyState
          icon={Clock}
          title="No college approvals found"
          description={`No college pitch approvals found for filter "${statusFilter}".`}
          minHeight="min-h-[280px]"
        />
      ) : (
        <>
          {/* Mobile Card Layout (sm:hidden) */}
          <div className="space-y-3 sm:hidden">
            {approvals.map((item) => {
              const studentName = [item.lead?.firstName, item.lead?.lastName]
                .filter(Boolean)
                .join(" ");
              const location = [item.lead?.city, item.lead?.state]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-2xs space-y-3.5 transition"
                >
                  {/* Card Top: Student Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-border/70 pb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text-primary flex items-center gap-1.5 break-words">
                        <User size={14} className="text-primary-600 shrink-0 mt-0.5" />
                        <span className="truncate">{studentName || "N/A"}</span>
                      </p>
                      {location && (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                          <MapPin size={11} className="text-primary-500 shrink-0" />
                          <span className="truncate">{location}</span>
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">{renderBadge(item.approvalStatus)}</div>
                  </div>

                  {/* Student Contact Info */}
                  {(item.lead?.phone || item.lead?.email) && (
                    <div className="flex flex-col gap-1 text-xs text-text-secondary bg-neutral-50/80 dark:bg-neutral-800/40 rounded-lg p-2.5 border border-border/50">
                      {item.lead?.phone && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Phone size={12} className="text-text-muted shrink-0" />
                          <span className="font-mono">{item.lead.phone}</span>
                        </p>
                      )}
                      {item.lead?.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-text-muted shrink-0" />
                          <span className="truncate">{item.lead.email}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* College & Pitch Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Building2 size={12} className="text-primary-600 shrink-0" />
                      <span className="font-semibold text-text-primary truncate">
                        {item.college?.name || "Unknown College"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-0.5">
                      <p className="font-semibold text-primary-700 dark:text-emerald-400 flex items-center gap-1">
                        <IndianRupee size={12} className="shrink-0" />
                        {item.feePitched !== null && item.feePitched !== undefined
                          ? `₹ ${Number(item.feePitched).toLocaleString("en-IN")}`
                          : "N/A"}
                      </p>
                      {item.coursePitched && (
                        <p className="text-text-secondary flex items-center gap-1 truncate">
                          <BookOpen size={12} className="text-text-muted shrink-0" />
                          <span className="truncate">{item.coursePitched}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submitted By */}
                  <div className="text-xs text-text-secondary pt-1 border-t border-border/70 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-1.5 text-text-muted">
                      <Send size={11} className="shrink-0 text-text-muted" />
                      <span className="truncate">
                        By{" "}
                        <strong className="font-medium text-text-primary">
                          {item.pitchedBy?.firstName} {item.pitchedBy?.lastName || ""}
                        </strong>
                      </span>
                    </div>
                    {item.pitchedBy?.email && (
                      <span className="text-[11px] text-text-muted truncate max-w-[130px]">
                        {item.pitchedBy.email}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons or Status Footer */}
                  <div className="pt-1">
                    {item.approvalStatus === "PENDING" ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={processingId === item.id}
                          onClick={() => handleAction(item.id, "APPROVED")}
                          className="h-9 w-full rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>{processingId === item.id ? "Processing..." : "Approve"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={processingId === item.id}
                          onClick={() => handleAction(item.id, "REJECTED")}
                          className="h-9 w-full rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle size={13} className="shrink-0" />
                          <span>{processingId === item.id ? "Processing..." : "Reject"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-1 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-xs text-text-muted italic">
                        Processed by {item.processedBy?.firstName || "Manager"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (hidden sm:block) */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-800/40">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Student Information
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      College & Pitch Info
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Submitted By
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((item) => {
                    const studentName = [item.lead?.firstName, item.lead?.lastName]
                      .filter(Boolean)
                      .join(" ");
                    const location = [item.lead?.city, item.lead?.state]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition align-top"
                      >
                        {/* Student Information Column */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                              <User size={14} className="text-primary-600 shrink-0" />
                              {studentName || "N/A"}
                            </p>
                            {item.lead?.phone && (
                              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                                <Phone size={12} className="text-text-muted shrink-0" />
                                {item.lead.phone}
                              </p>
                            )}
                            {item.lead?.email && (
                              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                                <Mail size={12} className="text-text-muted shrink-0" />
                                {item.lead.email}
                              </p>
                            )}
                            {location && (
                              <p className="text-xs text-text-muted flex items-center gap-1.5">
                                <MapPin size={12} className="text-primary-500 shrink-0" />
                                {location}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* College & Pitch Info Column */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {item.college?.name || "Unknown College"}
                            </p>
                            <p className="text-xs font-semibold text-primary-700 dark:text-emerald-400 mt-1">
                              {item.feePitched !== null && item.feePitched !== undefined
                                ? `Fee: ₹ ${Number(item.feePitched).toLocaleString("en-IN")}`
                                : "Fee: N/A"}
                            </p>
                            {item.coursePitched && (
                              <p className="text-xs text-text-secondary mt-0.5">
                                Course: {item.coursePitched}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Submitted By Column */}
                        <td className="px-5 py-4 text-sm text-text-secondary">
                          <div>
                            <p className="font-medium text-text-primary">
                              {item.pitchedBy?.firstName} {item.pitchedBy?.lastName || ""}
                            </p>
                            <p className="text-xs text-text-muted">{item.pitchedBy?.email}</p>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="px-5 py-4">{renderBadge(item.approvalStatus)}</td>

                        {/* Actions Column */}
                        <td className="px-5 py-4 text-right space-x-2">
                          {item.approvalStatus === "PENDING" ? (
                            <>
                              <button
                                disabled={processingId === item.id}
                                onClick={() => handleAction(item.id, "APPROVED")}
                                className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                              >
                                {processingId === item.id ? "Processing..." : "Approve"}
                              </button>
                              <button
                                disabled={processingId === item.id}
                                onClick={() => handleAction(item.id, "REJECTED")}
                                className="rounded-md bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                              >
                                {processingId === item.id ? "Processing..." : "Reject"}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-text-muted italic">
                              Processed by {item.processedBy?.firstName || "Manager"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PitchApprovalsPage;
