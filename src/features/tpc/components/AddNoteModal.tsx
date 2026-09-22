import { useState } from "react";
import { X, FileText, Loader2, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { createInteraction } from "../../../services/interactionService";
import { updateTpcAssignmentStatus, type TPCStatus } from "../../../services/tpcService";

interface AddNoteModalProps {
  assignmentId?: string;
  leadId: string;
  leadName: string;
  onClose: () => void;
  onSuccess: () => void;
}

type OutcomeType = "NOT_INTERESTED" | "NO_REPLY" | null;

const AddNoteModal = ({
  assignmentId,
  leadId,
  leadName,
  onClose,
  onSuccess,
}: AddNoteModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [outcome, setOutcome] = useState<OutcomeType>(null);
  const [note, setNote] = useState("");
  const [markCompleted, setMarkCompleted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleSelectOutcome = (selected: OutcomeType) => {
    setOutcome(selected);
    const prefix = selected === "NOT_INTERESTED" ? "Not Interested: " : "No Response: ";
    if (!note || note.startsWith("Not Interested: ") || note.startsWith("No Response: ")) {
      setNote(prefix);
    } else {
      setNote(`${prefix}${note}`);
    }
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

    if (!note.trim()) {
      toast.showToast("Please enter note details", "error");
      return;
    }

    setLoading(true);
    try {
      let outcomeLabel =
        outcome === "NOT_INTERESTED"
          ? "Not Interested"
          : outcome === "NO_REPLY"
            ? "No Response"
            : "TPC Note";

      let statusToUpdate: TPCStatus = markCompleted
        ? "COMPLETED"
        : outcome === "NOT_INTERESTED"
          ? "NOT_INTERESTED"
          : outcome === "NO_REPLY"
            ? "NO_REPLY"
            : "COMPLETED";

      if (assignmentId && statusToUpdate) {
        await updateTpcAssignmentStatus(accessToken, assignmentId, statusToUpdate);
      }

      await createInteraction(accessToken, {
        leadId,
        title: `TPC Note (${outcomeLabel})`,
        description: note.trim(),
      });

      toast.showToast(
        markCompleted
          ? "TPC marked as Completed and interaction logged!"
          : "Note and interaction saved successfully",
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
          fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-surface shadow-2xl border-l border-border flex flex-col z-50
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Add TPC Note & Outcome</h2>
              <p className="text-xs text-text-secondary">Lead: {leadName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-text-muted hover:bg-neutral-100 hover:text-text-primary transition"
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
                Select Call / TPC Outcome
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectOutcome("NOT_INTERESTED")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${outcome === "NOT_INTERESTED"
                      ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200 font-semibold"
                      : "border-border text-text-secondary hover:bg-neutral-50"
                    }`}
                >
                  <XCircle size={16} className="text-red-600 shrink-0" />
                  Not Interested
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectOutcome("NO_REPLY")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${outcome === "NO_REPLY"
                      ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200 font-semibold"
                      : "border-border text-text-secondary hover:bg-neutral-50"
                    }`}
                >
                  <Clock size={16} className="text-amber-600 shrink-0" />
                  No Response
                </button>
              </div>
            </div>

            {/* Custom Input / Note Textarea */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Custom Notes & Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Click an outcome above or type custom feedback/notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="
                  w-full rounded-lg border border-border bg-background p-3
                  text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
                "
                required
              />
            </div>

            {/* Mark as Completed Checkbox */}
            <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="markCompleted"
                  checked={markCompleted}
                  onChange={(e) => setMarkCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="markCompleted" className="text-xs font-semibold text-emerald-900 cursor-pointer">
                  Mark TPC as Completed
                </label>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                Moves to Completed section
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="
                inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-xs font-medium text-white
                shadow-sm hover:bg-emerald-700 transition disabled:opacity-50
              "
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <CheckCircle2 size={15} />
              {markCompleted ? "Save & Mark Completed" : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
