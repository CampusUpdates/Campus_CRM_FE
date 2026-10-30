import { useState } from "react";
import { X, FileText, Loader2, Clock, XCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { createInteraction } from "../../../services/interactionService";
import { updateTpcAssignmentStatus, type TPCStatus, type TPCCall } from "../../../services/tpcService";

interface AddNoteModalProps {
  assignmentId?: string;
  leadId: string;
  leadName: string;
  calls?: TPCCall[];
  onClose: () => void;
  onSuccess: () => void;
}

type OutcomeType = "NOT_INTERESTED" | "NO_REPLY" | "CONNECTED" | "OTHER" | null;

const AddNoteModal = ({
  assignmentId,
  leadId,
  leadName,
  calls = [],
  onClose,
  onSuccess,
}: AddNoteModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [outcome, setOutcome] = useState<OutcomeType>(null);
  const [note, setNote] = useState("");
  const existingCallsCount = calls.length;
  const canComplete = existingCallsCount + 1 >= 3;
  const [markCompleted, setMarkCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleSelectOutcome = (selected: OutcomeType) => {
    setOutcome((prev) => (prev === selected ? null : selected));
  };

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!note.trim() && !outcome) {
      toast.showToast("Please enter notes or select a call outcome", "error");
      return;
    }

    setLoading(true);
    try {
      let callOutcome: string;
      if (outcome === "NOT_INTERESTED") {
        callOutcome = "NOT_INTERESTED";
      } else if (outcome === "NO_REPLY") {
        callOutcome = "NO_ANSWER";
      } else if (outcome === "CONNECTED") {
        callOutcome = "INTERESTED";
      } else {
        callOutcome = "OTHER";
      }

      let statusToUpdate: TPCStatus | undefined;
      if (markCompleted && canComplete) {
        statusToUpdate = "COMPLETED";
      } else if (outcome === "NOT_INTERESTED") {
        statusToUpdate = "NOT_INTERESTED";
      } else if (outcome === "NO_REPLY") {
        statusToUpdate = "NO_REPLY";
      } else {
        statusToUpdate = "PENDING";
      }

      if (assignmentId) {
        await updateTpcAssignmentStatus(
          accessToken,
          assignmentId,
          statusToUpdate,
          note.trim() || undefined,
          callOutcome
        );
      }

      let outcomeLabel =
        outcome === "NOT_INTERESTED"
          ? "Not Interested"
          : outcome === "NO_REPLY"
            ? "No Response"
            : outcome === "CONNECTED"
              ? "Connected"
              : "Other";

      await createInteraction(accessToken, {
        leadId,
        title: `TPC Note (${outcomeLabel})`,
        description: note.trim() || `Call logged with outcome: ${outcomeLabel}`,
      });

      toast.showToast(
        markCompleted && canComplete
          ? "TPC marked as Completed and call logged!"
          : "TPC call and note saved successfully",
        "success"
      );
      onSuccess();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to save note", "error");
    } finally {
      setLoading(false);
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
          fixed right-0 top-0 h-[100dvh] w-full sm:w-[480px] md:max-w-md max-w-full bg-surface shadow-2xl border-l border-border flex flex-col z-50
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/40">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Add TPC Note & Outcome</h2>
              <p className="text-xs text-text-secondary">Lead: {leadName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-5 flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-4">
            {/* Outcome Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Select Call / TPC Outcome <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectOutcome("NOT_INTERESTED")}
                  className={`flex items-center justify-center sm:justify-start gap-2 p-2.5 sm:p-3 rounded-lg border text-xs font-medium transition ${
                    outcome === "NOT_INTERESTED"
                      ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200 font-semibold dark:bg-red-950/40 dark:text-red-300"
                      : "border-border text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <XCircle size={16} className="text-red-600 shrink-0" />
                  Not Interested
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectOutcome("NO_REPLY")}
                  className={`flex items-center justify-center sm:justify-start gap-2 p-2.5 sm:p-3 rounded-lg border text-xs font-medium transition ${
                    outcome === "NO_REPLY"
                      ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200 font-semibold dark:bg-amber-950/40 dark:text-amber-300"
                      : "border-border text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Clock size={16} className="text-amber-600 shrink-0" />
                  No Response
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectOutcome("CONNECTED")}
                  className={`flex items-center justify-center sm:justify-start gap-2 p-2.5 sm:p-3 rounded-lg border text-xs font-medium transition ${
                    outcome === "CONNECTED"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 font-semibold dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-border text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  Connected
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectOutcome("OTHER")}
                  className={`flex items-center justify-center sm:justify-start gap-2 p-2.5 sm:p-3 rounded-lg border text-xs font-medium transition ${
                    outcome === "OTHER"
                      ? "border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200 font-semibold dark:bg-primary-950/40 dark:text-primary-300"
                      : "border-border text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <HelpCircle size={16} className="text-primary-600 shrink-0" />
                  Other
                </button>
              </div>
            </div>

            {/* Custom Input / Note Textarea */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Custom Notes & Feedback
              </label>
              <textarea
                rows={5}
                placeholder="Type call notes and discussion details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="
                  w-full rounded-lg border border-border bg-background p-3
                  text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
                "
              />
            </div>

            {/* Mark as Completed Checkbox */}
            <div
              className={`rounded-lg p-3 border flex flex-col gap-1.5 transition ${
                canComplete
                  ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "bg-neutral-50 border-neutral-200 dark:bg-neutral-800/40 dark:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="markCompleted"
                    disabled={!canComplete}
                    checked={markCompleted && canComplete}
                    onChange={(e) => setMarkCompleted(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="markCompleted"
                    className={`text-xs font-semibold ${
                      canComplete
                        ? "text-emerald-900 dark:text-emerald-300 cursor-pointer"
                        : "text-text-muted cursor-not-allowed"
                    }`}
                  >
                    Mark TPC as Completed
                  </label>
                </div>
                <span className="text-[11px] font-medium text-text-secondary">
                  Attempts: {existingCallsCount} / 3
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                {canComplete
                  ? "Eligible for completion (3+ call attempts recorded)."
                  : `Requires at least 3 persisted call attempts to complete (${existingCallsCount} recorded so far).`}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-border mt-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!note.trim() && !outcome)}
              className="
                w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-xs font-medium text-white
                shadow-sm hover:bg-emerald-700 transition disabled:opacity-50
              "
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <CheckCircle2 size={15} />
              {markCompleted && canComplete ? "Save & Mark Completed" : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
