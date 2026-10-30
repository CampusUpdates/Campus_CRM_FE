import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, User, MapPin, Phone, Mail, ChevronDown } from "lucide-react";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            College Approvals
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review college applications submitted by advisors.
          </p>
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            id="pitch-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-slate-700/80 bg-slate-900/95 pl-3 pr-8 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All</option>
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* College Approvals Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
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
              {loading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={5}
                  message="Loading college approvals..."
                  description="Retrieving pending and processed approval requests"
                />
              ) : error ? (
                <PageErrorState
                  isTableRow
                  colSpan={5}
                  title="Unable to load college approvals"
                  message={error}
                  onRetry={loadApprovals}
                />
              ) : approvals.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={5}
                  icon={Clock}
                  title="No college approvals found"
                  description={`No college pitch approvals found for filter "${statusFilter}".`}
                />
              ) : (
                approvals.map((item) => {
                  const studentName = [item.lead?.firstName, item.lead?.lastName]
                    .filter(Boolean)
                    .join(" ");
                  const location = [item.lead?.city, item.lead?.state]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition align-top"
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
                          <p className="text-xs font-semibold text-primary-700 mt-1">
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
                              className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                            >
                              {processingId === item.id ? "Processing..." : "Approve"}
                            </button>
                            <button
                              disabled={processingId === item.id}
                              onClick={() => handleAction(item.id, "REJECTED")}
                              className="rounded-md bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PitchApprovalsPage;
