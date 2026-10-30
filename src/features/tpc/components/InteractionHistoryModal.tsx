import { useEffect, useState, useCallback } from "react";
import { X, Clock, FileText, PhoneCall, User, RefreshCw, XCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { fetchTpcHistory, type TPCCall } from "../../../services/tpcService";

interface InteractionHistoryModalProps {
  leadId?: string;
  assignmentId?: string;
  leadName: string;
  onClose: () => void;
}

const InteractionHistoryModal = ({
  leadId,
  assignmentId,
  leadName,
  onClose,
}: InteractionHistoryModalProps) => {
  const { accessToken } = useAuth();
  const [calls, setCalls] = useState<TPCCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const loadHistory = useCallback(async () => {
    if (!accessToken || (!leadId && !assignmentId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTpcHistory(accessToken, leadId, assignmentId);
      setCalls(data);
    } catch (err: any) {
      console.error("Failed to load TPC call history:", err);
      setError(err.message || "Failed to load TPC activity history");
    } finally {
      setLoading(false);
    }
  }, [accessToken, leadId, assignmentId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "NOT_INTERESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/60 dark:text-red-200 dark:border-red-700">
            <XCircle size={12} /> Not Interested
          </span>
        );
      case "NO_ANSWER":
      case "NO_REPLY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700">
            <Clock size={12} /> No Response
          </span>
        );
      case "INTERESTED":
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700">
            <CheckCircle2 size={12} /> Connected
          </span>
        );
      case "FOLLOW_UP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700">
            <Clock size={12} /> Follow Up
          </span>
        );
      case "CALL_BACK_LATER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-700">
            <Clock size={12} /> Call Back Later
          </span>
        );
      case "WRONG_NUMBER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700">
            <XCircle size={12} /> Wrong Number
          </span>
        );
      case "OTHER":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700">
            <HelpCircle size={12} /> {outcome === "OTHER" ? "Other" : outcome.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`
          fixed inset-0 bg-black/50 transition-opacity duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Drawer Panel Sliding from Right */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0 h-[100dvh] w-full sm:w-[500px] md:max-w-lg max-w-full bg-surface shadow-2xl border-l border-border flex flex-col z-50
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">TPC Activity History</h2>
              <p className="text-xs text-text-secondary">Lead: {leadName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
              className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary transition disabled:opacity-50"
              title="Refresh History"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <RefreshCw size={22} className="animate-spin text-primary-600 mb-2" />
              <p className="text-xs font-medium">Loading activity history...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs text-center dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <FileText size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-xs font-medium">No activity or notes recorded yet</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Call logs and notes added for this lead will appear here chronologically.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
              {calls.map((call) => {
                const authorName = `${call.caller?.firstName || "Member"} ${
                  call.caller?.lastName || ""
                }`.trim();
                const roleName = call.caller?.role?.name || "Member";

                return (
                  <div key={call.id} className="relative">
                    {/* Icon Dot */}
                    <div
                      className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-surface bg-primary-600 text-white flex items-center justify-center text-[10px] shadow-xs"
                    >
                      <PhoneCall size={10} />
                    </div>

                    {/* Activity Content Card */}
                    <div className="rounded-lg border border-border bg-neutral-50/70 dark:bg-neutral-800/40 p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Member & Role */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                          <User size={13} className="text-text-muted" />
                          <span>{authorName}</span>
                          <span className="text-[10px] font-semibold text-text-secondary dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 rounded-md">
                            {roleName}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span className="text-[11px] text-text-muted shrink-0">
                          {new Date(call.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {/* Call Outcome Badge */}
                      <div className="pt-0.5">
                        {renderOutcomeBadge(call.outcome)}
                      </div>

                      {/* Saved Notes */}
                      {call.notes && call.notes.trim() ? (
                        <p className="text-xs text-text-primary whitespace-pre-wrap break-words leading-relaxed pt-1 border-t border-border/50">
                          {call.notes.trim()}
                        </p>
                      ) : (
                        <p className="text-xs text-text-muted italic pt-1 border-t border-border/50">
                          No notes added
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-border bg-neutral-50/50 dark:bg-neutral-800/20 flex items-center justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractionHistoryModal;
