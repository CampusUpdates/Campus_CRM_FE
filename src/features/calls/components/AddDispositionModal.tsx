import { useState } from "react";
import { X, FileText, CheckCircle2, RefreshCw, AlertCircle, Bookmark } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  recordCallOutcome,
  type CallLogItem,
} from "../../../services/mockCallService";

export type CallOutcomeType =
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "NOT_INTERESTED"
  | "FOLLOW_UP"
  | "CALL_BACK_LATER"
  | "INTERESTED"
  | "DISCONNECTED";

interface AddDispositionModalProps {
  student: CallLogItem;
  onClose: () => void;
  onSuccess: () => void;
}

const OUTCOME_OPTIONS: { label: string; value: CallOutcomeType; color: string; desc: string }[] = [
  { label: "No Answer", value: "NO_ANSWER", color: "border-neutral-300 text-neutral-700 bg-neutral-50 hover:bg-neutral-100", desc: "Phone rang with no response" },
  { label: "Wrong Number", value: "WRONG_NUMBER", color: "border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100", desc: "Number does not belong to student" },
  { label: "Not Interested", value: "NOT_INTERESTED", color: "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100", desc: "Student declined program offering" },
  { label: "Follow Up Required", value: "FOLLOW_UP", color: "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100", desc: "Creates 24-hr active bookmark" },
  { label: "Call Back Later", value: "CALL_BACK_LATER", color: "border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100", desc: "Creates 24-hr active bookmark" },
  { label: "Interested / Lead", value: "INTERESTED", color: "border-emerald-500 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold", desc: "Student interested in admission" },
  { label: "Disconnected", value: "DISCONNECTED", color: "border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100", desc: "Call got disconnected prematurely" },
];

const AddDispositionModal = ({
  student,
  onClose,
  onSuccess,
}: AddDispositionModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcomeType>("FOLLOW_UP");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedOutcome) return;

    setSubmitting(true);
    setError(null);

    try {
      await recordCallOutcome(accessToken, {
        studentDataId: student.studentDataId,
        outcome: selectedOutcome,
        notes: notes.trim() || undefined,
      });

      const isBookmark = selectedOutcome === "FOLLOW_UP" || selectedOutcome === "CALL_BACK_LATER";
      toast.success(
        `Call disposition added: ${selectedOutcome.replace(/_/g, " ")}${isBookmark ? " (24-hour bookmark created)" : ""}`
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add call disposition.");
    } finally {
      setSubmitting(false);
    }
  };

  const isBookmarkOutcome = selectedOutcome === "FOLLOW_UP" || selectedOutcome === "CALL_BACK_LATER";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Right-Side Drawer Panel */}
      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
        <div className="pointer-events-auto w-screen max-w-md sm:w-[460px] bg-surface border-l border-border shadow-2xl flex flex-col justify-between h-full transform transition-transform duration-300 animate-in slide-in-from-right">
          <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border p-5 bg-background/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Add Call Disposition
                  </h3>
                  <p className="text-xs text-text-muted">
                    Record new call outcome for {student.fullName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Student Info Card */}
              <div className="rounded-xl border border-border bg-neutral-50/60 dark:bg-neutral-900/40 p-3.5 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text-primary text-sm">{student.fullName}</span>
                  <span className="font-mono text-text-muted font-medium">{student.phone}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Dataset: <strong>{student.uploadFileName}</strong></span>
                </div>
              </div>

              {/* Outcome Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase text-text-secondary">
                  Select Call Disposition *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OUTCOME_OPTIONS.map((opt) => {
                    const isSelected = selectedOutcome === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedOutcome(opt.value)}
                        className={`p-3 rounded-xl border text-xs text-left transition flex flex-col justify-between space-y-1 cursor-pointer ${
                          isSelected
                            ? "border-primary-600 bg-primary-50/70 text-primary-950 ring-2 ring-primary-200 font-bold"
                            : opt.color
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{opt.label}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-primary-600 shrink-0" />}
                        </div>
                        <span className="text-[10px] opacity-80 leading-tight">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 24-hr Bookmark Notice */}
              {isBookmarkOutcome && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 dark:bg-blue-950/40 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Bookmark size={16} className="text-blue-600 shrink-0" />
                  <span>
                    Saving <strong>{selectedOutcome.replace(/_/g, " ")}</strong> will activate/refresh a 24-hour priority bookmark on this contact.
                  </span>
                </div>
              )}

              {/* Call Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-text-secondary">
                  Call Discussion Notes
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter call discussion summary, student preferences, or follow-up details..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                />
              </div>
            </div>

            {/* Drawer Footer (Fixed at Bottom) */}
            <div className="border-t border-border p-5 bg-background/50 shrink-0 flex items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted">
                {!selectedOutcome ? "Select an outcome to enable" : "Ready to save"}
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text-secondary hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedOutcome}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving Disposition...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Save Disposition
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDispositionModal;
