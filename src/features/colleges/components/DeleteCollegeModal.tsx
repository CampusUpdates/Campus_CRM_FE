import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import type { College } from "../../../services/collegeService";

interface DeleteCollegeModalProps {
  college: College;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteCollegeModal = ({ college, onClose, onConfirm }: DeleteCollegeModalProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.trim() === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || "Failed to delete college");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Delete College?</h2>
              <p className="text-xs text-text-secondary mt-0.5">Permanent action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 hover:text-text-primary transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-sm text-text-secondary">
          <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-3.5 text-rose-800 text-xs leading-relaxed">
            <p className="font-semibold text-rose-900">
              You are about to permanently delete:
            </p>
            <p className="text-sm font-bold text-rose-950 mt-1">{college.name}</p>
            <p className="mt-2">
              This action will permanently remove the college and its college-related records.
              This action cannot be undone.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Type <span className="font-mono font-bold text-rose-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              disabled={loading}
              className="
                w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm
                outline-none font-mono transition
                focus:border-rose-500 focus:ring-2 focus:ring-rose-100
                disabled:opacity-50
              "
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2 rounded-md">
              {error}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2 text-xs font-semibold rounded-lg border border-border
              text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="
              flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg
              bg-rose-600 text-white hover:bg-rose-700 transition
              disabled:opacity-40 disabled:cursor-not-allowed shadow-xs
            "
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCollegeModal;
