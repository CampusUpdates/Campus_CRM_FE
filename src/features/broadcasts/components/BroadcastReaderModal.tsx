import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  User,
  Calendar,
  Loader2,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  acknowledgeBroadcast,
  type EmployeeBroadcastItem,
} from "../../../services/broadcastService";

export interface BroadcastReaderDrawerProps {
  broadcast: EmployeeBroadcastItem | null;
  onClose: () => void;
  onAcknowledged: (updatedBroadcastId: string) => void;
}

export const BroadcastReaderDrawer = ({
  broadcast,
  onClose,
  onAcknowledged,
}: BroadcastReaderDrawerProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [acknowledging, setAcknowledging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!broadcast) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleInitiateClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [broadcast]);

  if (!broadcast) return null;

  const handleInitiateClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleAcknowledge = async () => {
    if (!accessToken || acknowledging || broadcast.isAcknowledged) return;
    setAcknowledging(true);
    try {
      await acknowledgeBroadcast(accessToken, broadcast.id);
      toast.success("Broadcast announcement acknowledged.");
      onAcknowledged(broadcast.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to acknowledge announcement");
    } finally {
      setAcknowledging(false);
    }
  };

  const senderName = broadcast.createdBy
    ? `${broadcast.createdBy.firstName} ${broadcast.createdBy.lastName || ""}`.trim()
    : "Super Admin";

  const formattedDate = new Date(broadcast.sentAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Subtle Backdrop */}
      <div
        onClick={handleInitiateClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Right-Hand Drawer Container */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`relative h-[100dvh] w-full sm:w-[500px] md:w-[540px] max-w-[100vw] bg-surface text-text-primary shadow-2xl border-l border-border flex flex-col z-10 ${
          isClosing ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-start justify-between px-6 py-5 border-b border-border bg-surface">
          <div className="space-y-2 min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-primary-500 shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Company Announcement
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-text-primary leading-snug break-words">
              {broadcast.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5 min-w-0">
                <User size={13} className="text-primary-500 shrink-0" />
                <span className="truncate">
                  From: <strong className="font-medium text-text-primary">{senderName}</strong>
                </span>
              </span>

              <span className="flex items-center gap-1.5 text-text-muted">
                <Calendar size={13} className="shrink-0" />
                <span>{formattedDate}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInitiateClose}
            aria-label="Close drawer"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body - Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar bg-surface">
          {/* Announcement Message Body */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Message Content
            </h3>
            <div className="text-sm text-text-primary whitespace-pre-line leading-relaxed font-normal bg-surface break-words">
              {broadcast.body}
            </div>
          </div>

          {/* Acknowledgement Status Callout */}
          <div className="p-4 rounded-xl border border-border bg-surface transition-all">
            {broadcast.isAcknowledged ? (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Acknowledged
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {broadcast.acknowledgedAt
                      ? `Confirmed on ${new Date(broadcast.acknowledgedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Confirmed in previous session"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      Acknowledgement Pending
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-xs leading-normal">
                      Please confirm that you have read and understood this announcement.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={acknowledging}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-xs font-semibold text-white shadow-2xs transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {acknowledging ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Acknowledging...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Acknowledge</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4 border-t border-border bg-surface">
          <div className="text-xs text-text-muted">
            {broadcast.readAt && (
              <span>
                Read:{" "}
                {new Date(broadcast.readAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!broadcast.isAcknowledged && (
              <button
                type="button"
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-xs font-semibold text-white shadow-2xs transition disabled:opacity-50 cursor-pointer"
              >
                {acknowledging ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Acknowledging...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Acknowledge</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleInitiateClose}
              className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backwards-compatible export alias for any components importing BroadcastReaderModal
export const BroadcastReaderModal = BroadcastReaderDrawer;
export default BroadcastReaderDrawer;
