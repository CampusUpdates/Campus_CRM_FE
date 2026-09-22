import { useEffect, useState } from "react";
import { X, Clock, FileText, PhoneCall, User, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { fetchLeadInteractions, type InteractionItem } from "../../../services/interactionService";

interface InteractionHistoryModalProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
}

const InteractionHistoryModal = ({
  leadId,
  leadName,
  onClose,
}: InteractionHistoryModalProps) => {
  const { accessToken } = useAuth();
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
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

  const loadInteractions = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeadInteractions(accessToken, leadId);
      setInteractions(data);
    } catch (err: any) {
      console.error("Failed to load interactions:", err);
      setError(err.message || "Failed to load interaction history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, [accessToken, leadId]);

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
          fixed right-0 top-0 h-[100dvh] w-full max-w-lg bg-surface shadow-2xl border-l border-border flex flex-col z-50
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">TPC Activity History</h2>
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

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <RefreshCw size={22} className="animate-spin text-primary-600 mb-2" />
              <p className="text-xs font-medium">Loading activity history...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs text-center">
              {error}
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <FileText size={32} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-xs font-medium">No activity or notes recorded yet</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Call logs and notes added for this lead will appear here chronologically.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {interactions.map((item) => {
                const authorName = `${item.createdBy?.firstName || "User"} ${
                  item.createdBy?.lastName || ""
                }`.trim();
                const roleName = item.createdBy?.role?.name || "Member";
                const isCall = (item.title || "").toLowerCase().includes("call");

                return (
                  <div key={item.id} className="relative">
                    {/* Icon Dot */}
                    <div
                      className={`
                        absolute -left-6 top-0.5 h-5 w-5 rounded-full border-2 border-surface flex items-center justify-center text-[10px] shadow-xs
                        ${isCall ? "bg-emerald-500 text-white" : "bg-primary-600 text-white"}
                      `}
                    >
                      {isCall ? <PhoneCall size={10} /> : <FileText size={10} />}
                    </div>

                    {/* Activity Content Card */}
                    <div className="rounded-lg border border-border bg-neutral-50/60 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                          <User size={13} className="text-text-muted" />
                          <span>{authorName}</span>
                          <span className="text-[10px] font-normal text-text-muted bg-white border border-border px-1.5 py-0.2 rounded">
                            {roleName}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted shrink-0">
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {item.title && (
                        <p className="text-xs font-semibold text-primary-700">{item.title}</p>
                      )}

                      <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-border bg-neutral-50/50 flex items-center justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-neutral-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractionHistoryModal;
