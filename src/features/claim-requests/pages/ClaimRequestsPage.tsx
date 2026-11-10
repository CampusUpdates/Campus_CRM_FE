import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  X,
  ChevronDown,
  RefreshCw,
  Send,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchClaimRequests,
  processClaimRequest,
  type ClaimRequestItem,
} from "../../../services/leadService";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const ClaimRequestsPage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState<ClaimRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Action Modal State
  const [selectedRequest, setSelectedRequest] = useState<{
    item: ClaimRequestItem;
    action: "APPROVED" | "REJECTED";
  } | null>(null);
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadRequests = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchClaimRequests(
        accessToken,
        statusFilter === "ALL" ? undefined : statusFilter
      );
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Failed to load lead claim requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [accessToken, statusFilter]);

  const openActionModal = (
    item: ClaimRequestItem,
    action: "APPROVED" | "REJECTED"
  ) => {
    setSelectedRequest({ item, action });
    setRemarksInput("");
  };

  const closeActionModal = () => {
    setSelectedRequest(null);
    setRemarksInput("");
  };

  const handleConfirmAction = async () => {
    if (!accessToken || !selectedRequest) return;
    const { item, action } = selectedRequest;

    try {
      setIsSubmitting(true);
      await processClaimRequest(accessToken, item.requestId, {
        status: action,
        remarks: remarksInput.trim() || undefined,
      });

      toast.success(
        `Claim request ${action === "APPROVED" ? "approved" : "rejected"} successfully!`
      );
      closeActionModal();
      await loadRequests();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action.toLowerCase()} claim request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBadge = (status: "PENDING" | "APPROVED" | "REJECTED") => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200">
            <Clock size={13} />
            PENDING APPROVAL
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} />
            APPROVED
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800 border border-rose-200">
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
            Claim Requests
          </h1>
          <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
            Review lead reclaim requests submitted by advisors.
          </p>
        </div>

        {/* Refresh Action & Status Filter Dropdown */}
        <div className="flex items-center justify-start gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            title="Refresh claim requests"
            aria-label="Refresh"
            className="w-[38px] h-[38px] rounded-full sm:rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs inline-flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={`shrink-0 ${loading ? "animate-spin text-primary-600" : ""}`} />
          </button>

          <div className="relative w-[140px] sm:w-[150px] shrink-0">
            <select
              id="claim-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[140px] sm:w-[150px] h-[38px] appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-xs font-semibold text-text-primary shadow-2xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40 cursor-pointer transition"
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

      {/* Content Container (Loading / Error / Empty / Data) */}
      {loading ? (
        <SectionLoadingState
          message="Loading claim requests..."
          description="Retrieving pending and processed reclaim requests"
          minHeight="min-h-[280px]"
        />
      ) : error ? (
        <PageErrorState
          title="Failed to load claim requests"
          message={error}
          onRetry={loadRequests}
          minHeight="min-h-[280px]"
        />
      ) : requests.length === 0 ? (
        <PageEmptyState
          icon={Clock}
          title="No claim requests found"
          message={`No claim requests found for filter "${statusFilter.toLowerCase()}".`}
          minHeight="min-h-[280px]"
        />
      ) : (
        <>
          {/* Mobile Stacked Card View (sm:hidden) */}
          <div className="space-y-3 sm:hidden">
            {requests.map((item) => {
              const reqDateFormatted = new Date(item.requestedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              });
              const procDateFormatted = item.processedAt
                ? new Date(item.processedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : null;

              return (
                <div
                  key={item.requestId}
                  className="rounded-xl border border-border bg-surface p-4 shadow-2xs space-y-3 transition"
                >
                  {/* Card Header: Lead Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-border/70 pb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text-primary flex items-center gap-1.5 break-words">
                        <User size={14} className="text-primary-600 shrink-0 mt-0.5" />
                        <span className="truncate">{item.leadName || "N/A"}</span>
                      </p>
                    </div>
                    <div className="shrink-0">{renderBadge(item.status)}</div>
                  </div>

                  {/* Student Contact Info (Phone & Email) */}
                  {(item.phone || item.email) && (
                    <div className="flex flex-col gap-1 text-xs text-text-secondary bg-neutral-50/80 dark:bg-neutral-800/40 rounded-lg p-2.5 border border-border/50">
                      {item.phone && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Phone size={12} className="text-text-muted shrink-0" />
                          <span className="font-mono">{item.phone}</span>
                        </p>
                      )}
                      {item.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-text-muted shrink-0" />
                          <span className="truncate">{item.email}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Ownership Metadata: Current Owner & Requested By */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
                        <UserCheck size={11} className="text-primary-500 shrink-0" />
                        Current Owner
                      </span>
                      {item.currentOwner?.name ? (
                        <div>
                          <p className="font-medium text-text-primary truncate">{item.currentOwner.name}</p>
                          {item.currentOwner.email && (
                            <p className="text-[11px] text-text-muted truncate">{item.currentOwner.email}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-text-muted italic">Unassigned</p>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
                        <Send size={11} className="text-primary-500 shrink-0" />
                        Requested By
                      </span>
                      <div>
                        <p className="font-medium text-text-primary truncate">{item.requester.name}</p>
                        {item.requester.email && (
                          <p className="text-[11px] text-text-muted truncate">{item.requester.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requested Date */}
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Calendar size={12} className="text-text-muted shrink-0" />
                    <span>Requested on {reqDateFormatted}</span>
                  </div>

                  {/* Reason for Claim / Remarks */}
                  {item.remarks && (
                    <div className="text-xs text-text-secondary bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 rounded-lg p-2.5 flex items-start gap-1.5">
                      <MessageSquare size={12} className="text-text-muted shrink-0 mt-0.5" />
                      <span className="break-words flex-1">
                        <strong className="text-text-primary font-medium">Reason: </strong>
                        {item.remarks}
                      </span>
                    </div>
                  )}

                  {/* Processed Details */}
                  {item.processedBy && (
                    <div className="text-[11px] text-text-muted italic bg-neutral-50/70 dark:bg-neutral-800/30 rounded p-1.5 text-center">
                      Processed by {item.processedBy.name}
                      {procDateFormatted && ` on ${procDateFormatted}`}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {item.status === "PENDING" && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => openActionModal(item, "APPROVED")}
                        className="h-9 w-full rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openActionModal(item, "REJECTED")}
                        className="h-9 w-full rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 active:bg-rose-800 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle size={13} className="shrink-0" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden sm:block) */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-800/40">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Lead Information
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Current Owner
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Requested By & Date
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Status & Details
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => {
                    const reqDateFormatted = new Date(item.requestedAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    });
                    const procDateFormatted = item.processedAt
                      ? new Date(item.processedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : null;

                    return (
                      <tr
                        key={item.requestId}
                        className="border-b border-border last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition align-top"
                      >
                        {/* Lead Information Column */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                              <User size={14} className="text-primary-600 shrink-0" />
                              {item.leadName || "N/A"}
                            </p>
                            {item.phone && (
                              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                                <Phone size={12} className="text-text-muted shrink-0" />
                                {item.phone}
                              </p>
                            )}
                            {item.email && (
                              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                                <Mail size={12} className="text-text-muted shrink-0" />
                                {item.email}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Current Owner Column */}
                        <td className="px-5 py-4">
                          {item.currentOwner?.name ? (
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {item.currentOwner.name}
                              </p>
                              {item.currentOwner.email && (
                                <p className="text-xs text-text-muted">
                                  {item.currentOwner.email}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic">Unassigned / Creator</span>
                          )}
                        </td>

                        {/* Requested By & Date Column */}
                        <td className="px-5 py-4 text-sm text-text-secondary">
                          <div>
                            <p className="font-medium text-text-primary">
                              {item.requester.name}
                            </p>
                            <p className="text-xs text-text-muted">{item.requester.email}</p>
                            <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                              <Calendar size={11} />
                              {reqDateFormatted}
                            </p>
                          </div>
                        </td>

                        {/* Status & Details Column */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <div>{renderBadge(item.status)}</div>
                            {item.processedBy && (
                              <p className="text-xs text-text-muted">
                                Processed by: <span className="font-medium text-text-primary">{item.processedBy.name}</span>
                                {procDateFormatted && ` on ${procDateFormatted}`}
                              </p>
                            )}
                            {item.remarks && (
                              <p className="text-xs text-text-secondary bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 rounded-md p-2 flex items-start gap-1.5 mt-1">
                                <MessageSquare size={12} className="text-text-muted shrink-0 mt-0.5" />
                                <span>{item.remarks}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="px-5 py-4 text-right space-x-2">
                          {item.status === "PENDING" ? (
                            <>
                              <button
                                onClick={() => openActionModal(item, "APPROVED")}
                                className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openActionModal(item, "REJECTED")}
                                className="rounded-md bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition shadow-xs cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-text-muted italic">
                              Completed
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

      {/* Action Modal (Approve / Reject) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                {selectedRequest.action === "APPROVED" ? (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                ) : (
                  <XCircle size={20} className="text-rose-600" />
                )}
                {selectedRequest.action === "APPROVED"
                  ? "Approve Claim Request"
                  : "Reject Claim Request"}
              </h3>
              <button
                onClick={closeActionModal}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-neutral-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-text-secondary">
              Are you sure you want to{" "}
              <strong className="text-text-primary">
                {selectedRequest.action.toLowerCase()}
              </strong>{" "}
              the claim request for{" "}
              <strong className="text-text-primary">
                {selectedRequest.item.leadName}
              </strong>{" "}
              submitted by{" "}
              <strong className="text-text-primary">
                {selectedRequest.item.requester.name}
              </strong>
              ?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Remarks / Notes (Optional)
              </label>
              <textarea
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Enter any optional remarks for this decision..."
                rows={3}
                className="w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={isSubmitting}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-xs transition flex items-center gap-2 ${selectedRequest.action === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                  }`}
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {selectedRequest.action === "APPROVED" ? "Approve Claim" : "Reject Claim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimRequestsPage;
