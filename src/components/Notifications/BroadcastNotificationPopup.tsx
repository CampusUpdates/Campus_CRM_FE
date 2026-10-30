import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Megaphone,
  X,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { ROUTES } from "../../app/router/routes";

export const BroadcastNotificationPopup = () => {
  const navigate = useNavigate();
  const {
    pendingBroadcasts,
    dismissedPopupBroadcastIds,
    acknowledgeBroadcastItem,
    dismissPopupBroadcast,
  } = useNotification();

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pick the first pending broadcast that hasn't been closed in this active display cycle
  const activeBroadcast = pendingBroadcasts.find(
    (b) => !dismissedPopupBroadcastIds.includes(b.id)
  );

  if (!activeBroadcast) {
    return null;
  }

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg(null);
    setAcknowledgingId(activeBroadcast.id);

    try {
      await acknowledgeBroadcastItem(activeBroadcast.id);
      // On success, the NotificationContext optimistically removes it from pendingBroadcasts.
      // If another eligible pending broadcast exists, it will render automatically.
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to acknowledge. Please retry.");
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissPopupBroadcast(activeBroadcast.id);
  };

  const handleOpenInNotifications = () => {
    navigate(ROUTES.NOTIFICATIONS);
  };

  const senderName = activeBroadcast.createdBy
    ? `${activeBroadcast.createdBy.firstName} ${activeBroadcast.createdBy.lastName || ""}`.trim()
    : "Super Admin";

  const formattedDate = new Date(activeBroadcast.sentAt || activeBroadcast.deliveredAt).toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <aside
      aria-label="Pending Broadcast Announcement"
      className="
        fixed z-50
        bottom-6 left-6 lg:left-72
        w-[calc(100vw-3rem)] sm:w-96
        max-w-md
        rounded-2xl
        border border-blue-900/60
        bg-[#0b1120]
        p-4 sm:p-5
        shadow-2xl shadow-black/80
        animate-in fade-in slide-in-from-bottom-5 duration-300
        text-white
      "
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 border-b border-blue-950/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-950 border border-blue-800/60 text-blue-400">
            <Megaphone size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              Company Announcement
            </span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300 text-[10px] font-medium ml-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Acknowledgement Required
            </div>
          </div>
        </div>

        {/* × Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close notification"
          title="Close notification"
          className="
            -mr-1 -mt-1 p-1.5 rounded-lg
            text-slate-400 hover:text-white
            hover:border hover:border-emerald-500/60
            transition-all duration-200 cursor-pointer
            focus-visible:outline focus-visible:outline-1 focus-visible:outline-emerald-500
          "
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Area */}
      <div className="py-3 space-y-2">
        <h4 className="text-sm font-bold text-white line-clamp-1 leading-snug">
          {activeBroadcast.title}
        </h4>

        {/* Truncated message preview */}
        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
          {activeBroadcast.body}
        </p>

        {/* Sender & Timestamp */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1 truncate max-w-[170px]" title={senderName}>
            <User size={12} className="text-blue-400 shrink-0" />
            <span className="truncate">From: {senderName}</span>
          </span>

          <span className="flex items-center gap-1 shrink-0 text-slate-400">
            <Clock size={11} />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Error state if acknowledgement fails */}
      {errorMsg && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-950/60 border border-rose-900/80 p-2 text-xs text-rose-300">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-blue-950/80">
        <button
          type="button"
          onClick={handleOpenInNotifications}
          className="
            flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-emerald-400
            transition-all duration-200 underline-offset-4 hover:underline cursor-pointer
            focus-visible:outline focus-visible:outline-1 focus-visible:outline-emerald-500
          "
        >
          <span>Open Full Message</span>
          <ExternalLink size={12} />
        </button>

        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={acknowledgingId === activeBroadcast.id}
          className="
            flex items-center justify-center gap-1.5
            px-4 py-2 rounded-xl
            bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
            text-xs font-semibold text-white
            shadow-md shadow-emerald-950/40
            transition transform active:scale-95
            disabled:opacity-50 cursor-pointer
          "
        >
          {acknowledgingId === activeBroadcast.id ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Acknowledging...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              <span>Acknowledge</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
