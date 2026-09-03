import { useEffect, useState } from "react";
import { X, Tag, Check, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchLeadStatuses,
  updateLead,
  type LeadItem,
  type LeadStatusItem,
} from "../../../services/leadService";
import LeadPipelineDrawer from "./LeadPipelineDrawer";

type ChangeStatusModalProps = {
  lead: LeadItem;
  onClose: () => void;
  onSuccess: () => void;
};

const getStatusBadgeStyle = (statusName?: string, color?: string) => {
  const name = (statusName || "LEAD").toUpperCase();
  const c = (color || "").toLowerCase();

  if (name === "ADMISSION_DONE" || c === "green" || name.includes("ADMISSION")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (name === "LETTER_OUT" || c === "pink") {
    return "bg-pink-100 text-pink-800 border-pink-300";
  }
  if (name === "INTERVIEW_DONE" || c === "purple") {
    return "bg-purple-100 text-purple-800 border-purple-300";
  }
  if (name === "INTERVIEW_SCHEDULED" || c === "orange") {
    return "bg-orange-100 text-orange-800 border-orange-300";
  }
  if (name === "APPLICATION" || c === "yellow") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }
  if (name === "CANCELLED" || c === "red" || name.includes("CANCEL")) {
    return "bg-rose-100 text-rose-800 border-rose-300";
  }
  return "bg-blue-100 text-blue-800 border-blue-300";
};

const ChangeStatusModal = ({ lead, onClose, onSuccess }: ChangeStatusModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [statuses, setStatuses] = useState<LeadStatusItem[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number>(
    lead.statusId || lead.status?.id || 1
  );
  const [loading, setLoading] = useState(false);
  const [fetchingStatuses, setFetchingStatuses] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [activePipelineStatus, setActivePipelineStatus] = useState<LeadStatusItem | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchLeadStatuses(accessToken)
        .then((data) => setStatuses(data))
        .catch((err) => console.error("Failed to load lead statuses:", err))
        .finally(() => setFetchingStatuses(false));
    }
  }, [accessToken]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const targetStatus = statuses.find((s) => s.id === Number(selectedStatusId));
    const statusName = (targetStatus?.name || "").toUpperCase();

    const PIPELINE_STATUSES = [
      "APPLICATION",
      "INTERVIEW_SCHEDULED",
      "INTERVIEW_DONE",
      "LETTER_OUT",
      "ADMISSION_DONE",
      "CANCELLED",
    ];

    if (targetStatus && PIPELINE_STATUSES.includes(statusName)) {
      setActivePipelineStatus(targetStatus);
      return;
    }

    setLoading(true);
    try {
      await updateLead(accessToken, lead.id, { statusId: Number(selectedStatusId) });
      toast.showToast("Lead status updated successfully!", "success");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();
  const currentStatusObj = statuses.find((s) => s.id === Number(selectedStatusId)) || lead.status;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Right-Side Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-[42vw]
          min-w-[450px]
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
              <Tag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-text-primary">
                  Update Lead Status
                </h2>
                {currentStatusObj && (
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeStyle(currentStatusObj.name, currentStatusObj.color)}`}>
                    {currentStatusObj.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {fullName} (#{lead.id.slice(0, 6).toUpperCase()})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-text-secondary transition hover:bg-neutral-100 hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Select Pipeline Status Stage
              </label>

              {fetchingStatuses ? (
                <div className="flex items-center justify-center py-10 text-sm text-text-muted">
                  <RefreshCw size={18} className="animate-spin mr-2" /> Loading pipeline statuses...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {statuses.map((st) => {
                    const isSelected = Number(selectedStatusId) === st.id;
                    const badgeClass = getStatusBadgeStyle(st.name, st.color);

                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStatusId(st.id)}
                        className={`
                          flex items-center justify-between p-4 rounded-xl border cursor-pointer transition
                          ${
                            isSelected
                              ? "border-amber-500 bg-amber-50/70 text-amber-900 shadow-xs"
                              : "border-border bg-surface text-text-primary hover:bg-neutral-50"
                          }
                        `}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                              {st.name}
                            </span>
                          </div>
                          {st.description && (
                            <p className="text-xs text-text-secondary pl-0.5">{st.description}</p>
                          )}
                        </div>

                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-neutral-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingStatuses}
                className="px-5 py-2.5 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Lead Pipeline Drawer for stage transition */}
      {activePipelineStatus && (
        <LeadPipelineDrawer
          lead={lead}
          targetStatus={activePipelineStatus}
          onClose={() => setActivePipelineStatus(null)}
          onSuccess={() => {
            onSuccess();
            handleClose();
          }}
        />
      )}
    </div>
  );
};

export default ChangeStatusModal;
