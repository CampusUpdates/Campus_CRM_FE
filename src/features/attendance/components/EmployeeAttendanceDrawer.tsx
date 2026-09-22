import { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Clock,
  Briefcase,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchAttendanceRecords,
  type AttendanceRecordItem,
  type AttendanceStatusType,
} from "../../../services/attendanceService";

interface EmployeeAttendanceDrawerProps {
  userId: string;
  employeeName: string;
  roleName: string;
  teamName: string;
  managerName: string;
  email?: string;
  onClose: () => void;
}

const formatTimeString = (isoStr?: string | null) => {
  if (!isoStr) return "—";
  if (isoStr.includes("AM") || isoStr.includes("PM")) return isoStr;
  const dt = new Date(isoStr);
  if (isNaN(dt.getTime())) return isoStr;
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const renderCircularStatusPill = (status: AttendanceStatusType) => {
  switch (status) {
    case "PRESENT":
      return (
        <span
          title="Present"
          className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          P
        </span>
      );
    case "ABSENT":
      return (
        <span
          title="Absent"
          className="h-7 w-7 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          A
        </span>
      );
    case "HALF_DAY":
      return (
        <span
          title="Half Day"
          className="h-7 w-7 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          HD
        </span>
      );
    case "LEAVE":
    case "CASUAL_LEAVE":
    default:
      return (
        <span
          title={status === "CASUAL_LEAVE" ? "Casual Leave" : "On Leave"}
          className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800/80 flex items-center justify-center font-bold text-xs shrink-0"
        >
          L
        </span>
      );
  }
};

const EmployeeAttendanceDrawer = ({
  userId,
  employeeName,
  roleName,
  teamName,
  managerName,
  email,
  onClose,
}: EmployeeAttendanceDrawerProps) => {
  const { accessToken } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const loadMonthlyData = useCallback(async () => {
    if (!accessToken || !userId) return;
    setLoading(true);
    setError(null);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDateStr = firstDay.toISOString().slice(0, 10);
    const endDateStr = lastDay.toISOString().slice(0, 10);

    try {
      const res = await fetchAttendanceRecords(accessToken, {
        userId,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100,
      });
      setMonthlyRecords(res.records);
    } catch (err: any) {
      console.error("Error loading monthly attendance for drawer:", err);
      setError(err.message || "Failed to load monthly attendance");
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId, year, month]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  // Monthly summary calculations
  const presentCount = monthlyRecords.filter((r) => r.status === "PRESENT").length;
  const absentCount = monthlyRecords.filter((r) => r.status === "ABSENT").length;
  const halfDayCount = monthlyRecords.filter((r) => r.status === "HALF_DAY").length;
  const leaveCount = monthlyRecords.filter(
    (r) => r.status === "LEAVE" || r.status === "CASUAL_LEAVE"
  ).length;

  // Build calendar matrix for selected month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  // Create lookup for date YYYY-MM-DD -> record
  const recordsMap = new Map<string, AttendanceRecordItem>();
  monthlyRecords.forEach((rec) => {
    const dStr = new Date(rec.date).toISOString().slice(0, 10);
    recordsMap.set(dStr, rec);
  });

  const monthNameStr = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Slide-over Drawer Panel */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`fixed right-0 top-0 h-[100dvh] w-full max-w-xl bg-surface shadow-2xl border-l border-border flex flex-col z-50 ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/80 dark:text-primary-300 dark:border dark:border-primary-800/60 flex items-center justify-center font-bold text-lg shrink-0">
              {employeeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{employeeName}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mt-0.5">
                <span className="font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                  <Briefcase size={13} /> {roleName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 size={13} /> {teamName}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Employee Meta Info Card */}
          <div className="rounded-xl border border-border bg-neutral-50/60 dark:bg-neutral-800/40 p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-text-muted flex items-center gap-1.5 font-medium">
                <User size={14} /> Manager:
              </span>
              <span className="font-semibold text-text-primary">{managerName}</span>
            </div>
            {email && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-1.5 font-medium">
                  <Mail size={14} /> Email:
                </span>
                <span className="font-mono text-text-secondary truncate">{email}</span>
              </div>
            )}
          </div>

          {/* Month Navigation Control */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Monthly Attendance
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary hover:text-text-primary transition"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-text-primary min-w-[120px] text-center">
                {monthNameStr}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary hover:text-text-primary transition"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted space-y-2">
              <Loader2 size={24} className="animate-spin text-primary-600" />
              <p className="text-xs font-medium">Loading monthly attendance data...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs text-center flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : (
            <>
              {/* Monthly Summary Cards (2x2 Grid) */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center space-y-1">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    P
                  </div>
                  <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
                    {presentCount}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">
                    Present
                  </p>
                </div>

                <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 p-3 text-center space-y-1">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-xs">
                    A
                  </div>
                  <p className="text-lg font-extrabold text-rose-800 dark:text-rose-300">
                    {absentCount}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-900 dark:text-rose-400">
                    Absent
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 p-3 text-center space-y-1">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    HD
                  </div>
                  <p className="text-lg font-extrabold text-amber-800 dark:text-amber-300">
                    {halfDayCount}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-400">
                    Half Day
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 text-center space-y-1">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                    L
                  </div>
                  <p className="text-lg font-extrabold text-indigo-800 dark:text-indigo-300">
                    {leaveCount}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-900 dark:text-indigo-400">
                    Leave
                  </p>
                </div>
              </div>

              {/* Monthly Calendar Grid */}
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Attendance Calendar ({monthNameStr})
                </h4>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted pb-1 border-b border-border/60">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Empty offset cells for starting day */}
                  {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                    <div key={`blank-${idx}`} className="h-10 p-1" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dayStr = String(dayNum).padStart(2, "0");
                    const monthStr = String(month + 1).padStart(2, "0");
                    const dateKey = `${year}-${monthStr}-${dayStr}`;

                    const rec = recordsMap.get(dateKey);

                    return (
                      <div
                        key={`day-${dayNum}`}
                        className="h-11 flex flex-col items-center justify-between p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition"
                      >
                        <span className="text-[11px] font-medium text-text-muted">
                          {dayNum}
                        </span>
                        {rec ? (
                          renderCircularStatusPill(rec.status)
                        ) : (
                          <span className="text-[10px] text-text-muted/40 font-mono">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Attendance Log Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Attendance Log Breakdown ({monthlyRecords.length} Records)
                </h4>

                {monthlyRecords.length === 0 ? (
                  <div className="p-6 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/30 text-center text-xs text-text-muted">
                    No attendance records found for {monthNameStr}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {monthlyRecords.map((rec) => {
                      const recDateStr = new Date(rec.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border bg-neutral-50/60 dark:bg-neutral-800/40 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {renderCircularStatusPill(rec.status)}
                            <div>
                              <p className="font-bold text-text-primary">{recDateStr}</p>
                              <div className="flex items-center gap-3 text-[11px] text-text-secondary font-mono mt-0.5">
                                <span>In: {formatTimeString(rec.checkIn)}</span>
                                <span>Out: {formatTimeString(rec.checkOut)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-semibold text-text-primary flex items-center gap-1">
                              <Clock size={12} className="text-primary-600 dark:text-primary-400" />
                              {rec.workingHours || "—"}
                            </span>
                            {rec.office && (
                              <span className="text-[10px] text-text-muted block mt-0.5">
                                {rec.office.name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceDrawer;
