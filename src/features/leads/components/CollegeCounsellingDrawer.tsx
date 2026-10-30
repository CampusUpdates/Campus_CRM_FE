import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  Clock,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  completeCounsellingRequest,
  scheduleCounsellingRequest,
  type CollegeCounsellingItem,
} from "../../../services/counsellingService";

type CollegeCounsellingDrawerProps = {
  request: CollegeCounsellingItem;
  student: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    courseInterested?: string | null;
    courseInterestedOther?: string | null;
  };
  canComplete: boolean;
  initialMode?: "SCHEDULE" | "COMPLETE" | "VIEW";
  onClose: () => void;
  onSuccess: (updated: CollegeCounsellingItem) => void;
};

export default function CollegeCounsellingDrawer({
  request,
  student,
  canComplete,
  initialMode,
  onClose,
  onSuccess,
}: CollegeCounsellingDrawerProps) {
  const { accessToken } = useAuth();
  const toast = useToast();

  const getInitialScheduleDate = () => {
    if (request.scheduledDate) {
      return request.scheduledDate.includes("T")
        ? request.scheduledDate.split("T")[0]
        : request.scheduledDate;
    }
    if (request.counsellingDate) {
      return request.counsellingDate.includes("T")
        ? request.counsellingDate.split("T")[0]
        : request.counsellingDate;
    }
    if (request.preferredDate) {
      return request.preferredDate.includes("T")
        ? request.preferredDate.split("T")[0]
        : request.preferredDate;
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isCompleted = String(request.status || "").toUpperCase() === "COMPLETED";
  const isScheduled = String(request.status || "").toUpperCase() === "SCHEDULED";

  // Action mode: "SCHEDULE" | "COMPLETE"
  const determineInitialActionMode = () => {
    if (initialMode === "COMPLETE") return "COMPLETE";
    if (initialMode === "SCHEDULE") return "SCHEDULE";
    return isScheduled ? "COMPLETE" : "SCHEDULE";
  };

  const [actionMode, setActionMode] = useState<"SCHEDULE" | "COMPLETE">(determineInitialActionMode);

  // Schedule form state
  const [scheduledDate, setScheduledDate] = useState<string>(getInitialScheduleDate);
  const [scheduledTime, setScheduledTime] = useState<string>(
    request.scheduledTime || request.preferredTime || ""
  );
  const [scheduledNotes, setScheduledNotes] = useState<string>(
    request.counsellingNotes || ""
  );

  // Complete form state
  const [revert, setRevert] = useState(request.completionRemark || "");
  const [counsellingDate, setCounsellingDate] = useState<string>(getInitialScheduleDate);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const scheduleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const completeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  // Schedule Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedDate = scheduledDate.trim();
    if (!trimmedDate) {
      setErrorMsg("Please select the scheduled counselling date.");
      return;
    }

    const trimmedNotes = scheduledNotes.trim();
    if (!trimmedNotes) {
      setErrorMsg("Counselling notes are required and cannot be empty.");
      return;
    }

    if (!accessToken) {
      setErrorMsg("Authentication token not found.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const updated = await scheduleCounsellingRequest(
        accessToken,
        request.id,
        {
          scheduledDate: trimmedDate,
          scheduledTime: scheduledTime.trim() || undefined,
          counsellingNotes: trimmedNotes,
        }
      );
      toast.showToast("Counselling scheduled successfully.", "success");
      onSuccess(updated);
      handleClose();
    } catch (err: any) {
      const msg = err.message || "Failed to schedule counselling request.";
      setErrorMsg(msg);
      toast.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Complete Submit
  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = revert.trim();
    if (!trimmed) {
      setErrorMsg("Counselling Revert / Notes cannot be empty.");
      return;
    }
    if (!accessToken) {
      setErrorMsg("Authentication token not found.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const updated = await completeCounsellingRequest(
        accessToken,
        request.id,
        trimmed,
        counsellingDate || undefined
      );
      toast.showToast("Counselling marked as done and revert saved.", "success");
      onSuccess(updated);
      handleClose();
    } catch (err: any) {
      const msg = err.message || "Failed to complete counselling request.";
      setErrorMsg(msg);
      toast.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const studentFullName =
    [student.firstName, student.lastName].filter(Boolean).join(" ") || "Student";
  const collegeName = request.college?.name || "College";
  const collegeLocation = [request.college?.city, request.college?.state].filter(Boolean).join(", ");
  const studentLocation = [student.city, student.state].filter(Boolean).join(", ");
  const course =
    student.courseInterested === "OTHER"
      ? student.courseInterestedOther || "Other"
      : student.courseInterested || "—";

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        ", " +
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch {
      return isoString;
    }
  };

  const formatPreferredDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
      const parts = clean.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPreferredTime = (timeStr?: string | null) => {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  const requesterName =
    [request.requestedBy?.firstName, request.requestedBy?.lastName].filter(Boolean).join(" ") ||
    "Program Advisor";
  const scheduledByName =
    [request.scheduledBy?.firstName, request.scheduledBy?.lastName].filter(Boolean).join(" ") ||
    "Manager / Super Admin";
  const completedByName =
    [request.completedBy?.firstName, request.completedBy?.lastName].filter(Boolean).join(" ") ||
    "Manager / Team Lead";

  // Effective counselling date for display
  const displayCounsellingDate =
    formatPreferredDate(request.counsellingDate) ||
    formatPreferredDate(request.scheduledDate) ||
    formatPreferredDate(request.preferredDate);

  const scheduledDateTimeDisplay = [
    formatPreferredDate(request.scheduledDate || request.counsellingDate),
    formatPreferredTime(request.scheduledTime),
  ]
    .filter(Boolean)
    .join(" at ");

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 z-[100] ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Right-side Drawer Sliding in from the RIGHT */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-full sm:w-[500px]
          max-w-full
          bg-surface dark:bg-slate-900
          border-l border-border dark:border-slate-800
          shadow-2xl
          flex flex-col
          z-[101]
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border dark:border-slate-800 px-5 py-4">
          <div className="min-w-0 pr-2 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-text-primary dark:text-slate-100 truncate">
                {studentFullName}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50"
                    : isScheduled
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/40 dark:border-blue-700/50"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/50"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={12} />
                ) : isScheduled ? (
                  <Calendar size={12} />
                ) : (
                  <Clock size={12} />
                )}
                {isCompleted ? "COMPLETED" : isScheduled ? "SCHEDULED" : "PENDING"}
              </span>
            </div>
            <p className="text-xs text-text-muted dark:text-slate-400 flex items-center gap-1.5 truncate">
              <Building2 size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-text-secondary dark:text-slate-300">{collegeName}</span>
              {collegeLocation && <span>({collegeLocation})</span>}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-text-primary dark:hover:text-slate-100 transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/40 p-3 text-xs text-danger-700 dark:text-danger-300">
              {errorMsg}
            </div>
          )}

          {/* Student Details Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-slate-400 flex items-center gap-1.5">
              <User size={13} className="text-primary-600 dark:text-emerald-400" />
              Student Details
            </h3>
            <div className="rounded-lg border border-border dark:border-slate-800 bg-neutral-50/60 dark:bg-slate-800/40 p-3">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-text-muted dark:text-slate-400">Phone</dt>
                  <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <Phone size={11} className="text-text-muted shrink-0" />
                    {student.phone || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted dark:text-slate-400">Email</dt>
                  <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5 truncate flex items-center gap-1">
                    <Mail size={11} className="text-text-muted shrink-0" />
                    {student.email || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted dark:text-slate-400">City / State</dt>
                  <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <MapPin size={11} className="text-text-muted shrink-0" />
                    {studentLocation || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted dark:text-slate-400">Preferred Course</dt>
                  <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5">
                    {course}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Counselling Request Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-slate-400 flex items-center gap-1.5">
              <Building2 size={13} className="text-primary-600 dark:text-emerald-400" />
              Counselling Request Details
            </h3>
            <div className="rounded-lg border border-border dark:border-slate-800 bg-neutral-50/60 dark:bg-slate-800/40 p-3 space-y-2.5 text-xs">
              <div>
                <dt className="text-text-muted dark:text-slate-400">Target College</dt>
                <dd className="font-semibold text-text-primary dark:text-slate-100 mt-0.5">
                  {collegeName} {collegeLocation ? `(${collegeLocation})` : ""}
                </dd>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t border-border/60 dark:border-slate-800">
                <div>
                  <dt className="text-text-muted dark:text-slate-400">Preferred Schedule (Requested)</dt>
                  <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <Calendar size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {[
                        formatPreferredDate(request.preferredDate),
                        formatPreferredTime(request.preferredTime),
                      ]
                        .filter(Boolean)
                        .join(" at ") || request.preferredTiming || "Not specified"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted dark:text-slate-400">Requested By</dt>
                  <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5">
                    {requesterName}
                  </dd>
                </div>
              </div>

              <div className="pt-1 border-t border-border/60 dark:border-slate-800">
                <dt className="text-text-muted dark:text-slate-400">Counselling Purpose</dt>
                <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5 whitespace-pre-wrap leading-relaxed">
                  {request.purpose || "General guidance"}
                </dd>
              </div>
            </div>
          </div>

          {/* Scheduled Counselling Details - Visible to Program Advisor (PA) and Managers */}
          {(isScheduled || Boolean(request.scheduledDate || request.counsellingNotes)) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Calendar size={13} />
                Scheduled Counselling Details
              </h3>
              <div className="rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Scheduled Date & Time</dt>
                    <dd className="font-semibold text-blue-800 dark:text-blue-300 mt-0.5 flex items-center gap-1.5">
                      <Calendar size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{scheduledDateTimeDisplay || "Not specified"}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Scheduled By</dt>
                    <dd className="font-semibold text-text-primary dark:text-slate-100 mt-0.5">
                      {scheduledByName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Scheduled On</dt>
                    <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5">
                      {formatDate(request.scheduledAt || request.updatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Current Status</dt>
                    <dd className="font-semibold text-blue-700 dark:text-blue-400 mt-0.5">
                      {isCompleted ? "Completed" : "Scheduled"}
                    </dd>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-blue-200/60 dark:border-blue-800/40">
                  <dt className="text-xs font-semibold text-text-primary dark:text-slate-200 flex items-center gap-1.5">
                    <FileText size={13} className="text-blue-600 dark:text-blue-400" />
                    Counselling Notes
                  </dt>
                  <dd className="mt-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 text-xs text-text-primary dark:text-slate-100 whitespace-pre-wrap leading-relaxed shadow-2xs">
                    {request.counsellingNotes || request.completionRemark || "No notes entered."}
                  </dd>
                </div>
              </div>
            </div>
          )}

          {/* Completed Request Details - Visible to Program Advisor (PA) and Managers */}
          {isCompleted && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Completion & Revert Details
              </h3>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Lead Valid Till</dt>
                    <dd className="font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5 flex items-center gap-1.5">
                      <Calendar size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{displayCounsellingDate || "Not recorded"}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Completed By</dt>
                    <dd className="font-semibold text-text-primary dark:text-slate-100 mt-0.5">
                      {completedByName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Marked Completed On</dt>
                    <dd className="font-medium text-text-primary dark:text-slate-200 mt-0.5">
                      {formatDate(request.completedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted dark:text-slate-400">Status</dt>
                    <dd className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Completed
                    </dd>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <dt className="text-xs font-semibold text-text-primary dark:text-slate-200 flex items-center gap-1.5">
                    <FileText size={13} className="text-emerald-600 dark:text-emerald-400" />
                    Counselling Revert / Notes
                  </dt>
                  <dd className="mt-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-xs text-text-primary dark:text-slate-100 whitespace-pre-wrap leading-relaxed shadow-2xs">
                    {request.completionRemark || "No revert entered."}
                  </dd>
                </div>
              </div>
            </div>
          )}

          {/* Action Section for Authorized Managers / Super Admins / Team Leads */}
          {!isCompleted && canComplete && (
            <div className="space-y-4 pt-3 border-t border-border dark:border-slate-800">
              {/* Action Mode Toggle */}
              <div className="flex rounded-lg bg-neutral-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActionMode("SCHEDULE");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    actionMode === "SCHEDULE"
                      ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs"
                      : "text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Calendar size={13} />
                  {isScheduled ? "Update Schedule" : "Schedule Counselling"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionMode("COMPLETE");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    actionMode === "COMPLETE"
                      ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  Mark as Done
                </button>
              </div>

              {/* SCHEDULE COUNSELLING FORM */}
              {actionMode === "SCHEDULE" && (
                <form id="schedule-counselling-form" onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Scheduled Date Picker */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scheduled-date"
                        className="block text-xs font-semibold text-text-primary dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
                        Counselling Date <span className="text-danger-600 dark:text-danger-400">*</span>
                      </label>
                      <input
                        type="date"
                        id="scheduled-date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="
                          w-full rounded-lg border border-border dark:border-slate-700
                          bg-surface dark:bg-slate-900
                          px-3 py-2 text-xs text-text-primary dark:text-slate-100
                          focus:border-blue-500 dark:focus:border-blue-500
                          focus:ring-1 focus:ring-blue-500
                          focus:outline-none transition cursor-pointer
                        "
                      />
                    </div>

                    {/* Scheduled Time Input */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scheduled-time"
                        className="block text-xs font-semibold text-text-primary dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <Clock size={13} className="text-blue-600 dark:text-blue-400" />
                        Counselling Time
                      </label>
                      <input
                        type="time"
                        id="scheduled-time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="
                          w-full rounded-lg border border-border dark:border-slate-700
                          bg-surface dark:bg-slate-900
                          px-3 py-2 text-xs text-text-primary dark:text-slate-100
                          focus:border-blue-500 dark:focus:border-blue-500
                          focus:ring-1 focus:ring-blue-500
                          focus:outline-none transition cursor-pointer
                        "
                      />
                    </div>
                  </div>

                  {/* Counselling Notes Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="scheduled-notes"
                        className="block text-xs font-semibold text-text-primary dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <FileText size={13} className="text-blue-600 dark:text-blue-400" />
                        Counselling Notes <span className="text-danger-600 dark:text-danger-400">*</span>
                      </label>
                      <span className="text-[11px] text-text-muted dark:text-slate-400">
                        Required
                      </span>
                    </div>
                    <textarea
                      id="scheduled-notes"
                      ref={scheduleTextareaRef}
                      rows={4}
                      required
                      value={scheduledNotes}
                      onChange={(e) => {
                        setScheduledNotes(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Enter counselling schedule details, meeting link/location, coordination instructions, or notes for the Program Advisor..."
                      className="
                        w-full rounded-lg border border-border dark:border-slate-700
                        bg-surface dark:bg-slate-900
                        px-3 py-2.5 text-xs text-text-primary dark:text-slate-100
                        placeholder:text-text-muted dark:placeholder:text-slate-500
                        focus:border-blue-500 dark:focus:border-blue-500
                        focus:ring-1 focus:ring-blue-500
                        focus:outline-none transition leading-relaxed
                      "
                    />
                    <p className="text-[11px] text-text-muted dark:text-slate-400">
                      Scheduled date, time, and notes will be saved and visible to the Program Advisor.
                    </p>
                  </div>
                </form>
              )}

              {/* MARK AS DONE (COMPLETE) FORM */}
              {actionMode === "COMPLETE" && (
                <form id="complete-counselling-form" onSubmit={handleCompleteSubmit} className="space-y-4">
                  {/* Lead Valid Till Date Picker */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="counselling-date"
                        className="block text-xs font-semibold text-text-primary dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
                        Lead Valid Till
                      </label>
                      <span className="text-[11px] text-text-muted dark:text-slate-400">
                        Date only (no time)
                      </span>
                    </div>
                    <input
                      type="date"
                      id="counselling-date"
                      value={counsellingDate}
                      onChange={(e) => setCounsellingDate(e.target.value)}
                      className="
                        w-full rounded-lg border border-border dark:border-slate-700
                        bg-surface dark:bg-slate-900
                        px-3 py-2 text-xs text-text-primary dark:text-slate-100
                        focus:border-emerald-500 dark:focus:border-emerald-500
                        focus:ring-1 focus:ring-emerald-500
                        focus:outline-none transition cursor-pointer
                      "
                    />
                    <p className="text-[11px] text-text-muted dark:text-slate-400">
                      The date until which this lead counselling remains valid.
                    </p>
                  </div>

                  {/* Counselling Revert / Notes Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="counselling-revert"
                        className="block text-xs font-semibold text-text-primary dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <FileText size={13} className="text-emerald-600 dark:text-emerald-400" />
                        Counselling Revert / Notes <span className="text-danger-600 dark:text-danger-400">*</span>
                      </label>
                      <span className="text-[11px] text-text-muted dark:text-slate-400">
                        Required
                      </span>
                    </div>
                    <textarea
                      id="counselling-revert"
                      ref={completeTextareaRef}
                      rows={4}
                      required
                      value={revert}
                      onChange={(e) => {
                        setRevert(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Enter student guidance remarks, final counselling notes, or revert instructions for the Program Advisor..."
                      className="
                        w-full rounded-lg border border-border dark:border-slate-700
                        bg-surface dark:bg-slate-900
                        px-3 py-2.5 text-xs text-text-primary dark:text-slate-100
                        placeholder:text-text-muted dark:placeholder:text-slate-500
                        focus:border-emerald-500 dark:focus:border-emerald-500
                        focus:ring-1 focus:ring-emerald-500
                        focus:outline-none transition leading-relaxed
                      "
                    />
                    <p className="text-[11px] text-text-muted dark:text-slate-400">
                      Notes will be visible to the Program Advisor in their counselling details view.
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border dark:border-slate-800 px-5 py-3.5 flex items-center justify-end gap-2.5 bg-surface dark:bg-slate-900">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border dark:border-slate-700 px-4 py-2 text-xs font-medium text-text-secondary dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          {!isCompleted && canComplete && actionMode === "SCHEDULE" && (
            <button
              type="submit"
              form="schedule-counselling-form"
              disabled={loading || !scheduledDate.trim() || !scheduledNotes.trim()}
              className="
                inline-flex items-center gap-1.5 rounded-lg
                bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                px-4 py-2 text-xs font-semibold text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition shadow-sm cursor-pointer
              "
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save & Mark Scheduled"
              )}
            </button>
          )}

          {!isCompleted && canComplete && actionMode === "COMPLETE" && (
            <button
              type="submit"
              form="complete-counselling-form"
              disabled={loading || !revert.trim()}
              className="
                inline-flex items-center gap-1.5 rounded-lg
                bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                px-4 py-2 text-xs font-semibold text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition shadow-sm cursor-pointer
              "
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save & Mark Done"
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
