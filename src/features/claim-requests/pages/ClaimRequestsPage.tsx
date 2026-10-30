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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Claim Requests
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review lead reclaim requests submitted by advisors.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-1">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${statusFilter === st
                  ? "bg-white text-text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Claim Requests Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
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
              {loading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={5}
                  message="Loading claim requests..."
                />
              ) : error ? (
                <PageErrorState
                  isTableRow
                  colSpan={5}
                  title="Failed to load claim requests"
                  message={error}
                  onRetry={loadRequests}
                />
              ) : requests.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={5}
                  title="No claim requests found"
                  message={`No claim requests found for filter "${statusFilter.toLowerCase()}".`}
                />
              ) : (
                requests.map((item) => {
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
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition align-top"
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
                            <p className="text-xs text-text-secondary bg-neutral-100 border border-neutral-200 rounded-md p-2 flex items-start gap-1.5 mt-1">
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
                              className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(item, "REJECTED")}
                              className="rounded-md bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition shadow-xs"
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
