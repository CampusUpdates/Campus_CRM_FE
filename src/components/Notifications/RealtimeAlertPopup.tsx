import { useNavigate } from "react-router-dom";
import { UserPlus, GraduationCap, X, ExternalLink, Clock } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { ROUTES } from "../../app/router/routes";

export const RealtimeAlertPopup = () => {
  const navigate = useNavigate();
  const { realtimeAlerts, dismissRealtimeAlert } = useNotification();

  // Pick the latest active realtime alert
  const activeAlert = realtimeAlerts[0];

  if (!activeAlert) {
    return null;
  }

  const isLeadCreated = activeAlert.title === "New Lead Created";
  const isLeadAssigned =
    activeAlert.title === "New Lead Assigned" ||
    activeAlert.title === "Lead Reallocated to You" ||
    activeAlert.title.toLowerCase().includes("lead assigned") ||
    activeAlert.title.toLowerCase().includes("lead reallocated");
  const isLeadRelated = isLeadCreated || isLeadAssigned;
  const isCounselling =
    activeAlert.title === "Counselling Requested" ||
    activeAlert.title === "Counselling Completed" ||
    activeAlert.title.toLowerCase().includes("counselling");

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dismiss popup from UI without marking notification as read in database
    dismissRealtimeAlert(activeAlert.id);
  };

  const handleNavigate = () => {
    const linkMatch = activeAlert.message.match(/Link:\s*(\/[^\s\n]+)/);
    if (linkMatch && linkMatch[1]) {
      navigate(linkMatch[1]);
    } else if (isLeadRelated) {
      navigate(ROUTES.LEADS);
    } else if (isCounselling) {
      navigate(ROUTES.COLLEGE_COUNSELLING);
    } else {
      navigate(ROUTES.NOTIFICATIONS);
    }
    // Also dismiss popup after explicit user click to view
    dismissRealtimeAlert(activeAlert.id);
  };

  const formattedDate = new Date(activeAlert.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Extract structured lines excluding raw internal links
  const messageLines = activeAlert.message
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith("Link:") &&
        !l.startsWith("Lead Details:")
    );

  const introText = messageLines.length > 0 && !messageLines[0].includes(":")
    ? messageLines[0]
    : null;

  const detailLines = messageLines.filter((l) => l !== introText && l.includes(":"));

  return (
    <aside
      aria-label="Real-time Alert Notification"
      className="
        fixed z-50
        bottom-6 right-6
        w-[calc(100vw-3rem)] sm:w-96
        max-w-md
        rounded-2xl
        border border-emerald-900/60
        bg-[#091512]
        p-4 sm:p-5
        shadow-2xl shadow-black/80
        animate-in fade-in slide-in-from-bottom-5 duration-300
        text-white
      "
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 border-b border-emerald-950/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800/60 text-emerald-400">
            {isLeadRelated ? <UserPlus size={16} /> : <GraduationCap size={16} />}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              {isLeadRelated ? "Lead Activity" : "Counselling Workflow"}
            </span>
            <h4 className="text-sm font-bold text-white line-clamp-1 leading-snug">
              {activeAlert.title}
            </h4>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          title="Dismiss alert (stays unread in notifications)"
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
        {introText && (
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {introText}
          </p>
        )}

        {detailLines.length > 0 && (
          <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/40 p-2.5 space-y-1 text-xs">
            {detailLines.map((line, idx) => {
              const colonIndex = line.indexOf(":");
              const key = line.slice(0, colonIndex).trim();
              const val = line.slice(colonIndex + 1).trim();
              return (
                <div key={idx} className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 font-normal shrink-0">{key}:</span>
                  <span className="text-white font-medium text-right line-clamp-2">{val}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-emerald-400" />
            {formattedDate}
          </span>
          <span className="text-[10px] text-slate-400 italic">
            Dismissing keeps item in notifications
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-950/80">
        <button
          type="button"
          onClick={handleNavigate}
          className="
            flex items-center justify-center gap-1.5
            px-3.5 py-1.5 rounded-xl
            bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
            text-xs font-semibold text-white
            shadow-md shadow-emerald-950/40
            transition transform active:scale-95 cursor-pointer
          "
        >
          <span>{isLeadRelated ? "View Lead" : "View Counselling"}</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </aside>
  );
};
export default RealtimeAlertPopup;
