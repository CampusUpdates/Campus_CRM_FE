import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  CalendarCheck,
  Search,
  Clock,
  User,
  Building2,
  Briefcase,
  Phone,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from "lucide-react";
import { ROUTES } from "../../../../app/router/routes";
import type { SuperAdminDashboardData } from "../../../../services/superAdminDashboardService";

type InterviewItem = SuperAdminDashboardData["interviewsList"][number];

function isToday(dateInput?: string): boolean {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

interface TodayInterviewsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  interviews: InterviewItem[];
  initialStatusFilter?: string;
}

const TodayInterviewsDrawer = ({
  isOpen,
  onClose,
  interviews = [],
  initialStatusFilter = "ALL",
}: TodayInterviewsDrawerProps) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  };

  // Strictly filter interviews to only those scheduled for today's calendar date
  const todayOnlyInterviews = interviews.filter((item) => isToday(item.interviewTime));

  // Filter today's interviews by search term and status tab
  const filteredInterviews = todayOnlyInterviews.filter((item) => {
    // Status tab filter logic
    if (statusFilter === "SCHEDULED" && item.status !== "SCHEDULED") return false;
    if (
      statusFilter === "COMPLETED" &&
      item.status !== "COMPLETED" &&
      item.result !== "PASSED" &&
      item.result !== "FAILED"
    )
      return false;
    if (
      statusFilter === "PENDING" &&
      item.result !== "PENDING" &&
      item.status !== "PENDING"
    )
      return false;

    // Search term filter logic
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.candidateName?.toLowerCase().includes(term) ||
      item.college?.toLowerCase().includes(term) ||
      item.course?.toLowerCase().includes(term) ||
      item.advisor?.toLowerCase().includes(term) ||
      item.team?.toLowerCase().includes(term) ||
      item.phone?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string, result: string) => {
    if (result === "PASSED" || status === "COMPLETED") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shrink-0">
          <CheckCircle2 size={13} /> Completed
        </span>
      );
    }
    if (result === "FAILED") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1 shrink-0">
          <AlertCircle size={13} /> Rejected / Failed
        </span>
      );
    }
    if (status === "SCHEDULED") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700 flex items-center gap-1 shrink-0">
          <Clock3 size={13} /> Scheduled
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shrink-0">
        <Clock size={13} /> Pending
      </span>
    );
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "Today";
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return "Today";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Right Slide-over Panel */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`fixed right-0 top-0 h-[100dvh] w-full max-w-xl bg-surface shadow-2xl border-l border-border flex flex-col z-50 ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border p-5 shrink-0 bg-neutral-50/70 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
              <CalendarCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">
                  Today's Scheduled Interviews
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200">
                  {todayOnlyInterviews.length} Total
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Students whose interviews are scheduled or conducted today
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-text-muted hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-text-primary transition"
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="p-4 border-b border-border bg-surface space-y-3 shrink-0">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === "ALL"
                  ? "bg-surface text-text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              All ({todayOnlyInterviews.length})
            </button>
            <button
              onClick={() => setStatusFilter("SCHEDULED")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === "SCHEDULED"
                  ? "bg-surface text-purple-700 dark:text-purple-300 shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Scheduled (
              {todayOnlyInterviews.filter((i) => i.status === "SCHEDULED").length})
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === "COMPLETED"
                  ? "bg-surface text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Done (
              {
                todayOnlyInterviews.filter(
                  (i) =>
                    i.status === "COMPLETED" ||
                    i.result === "PASSED" ||
                    i.result === "FAILED"
                ).length
              }
              )
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === "PENDING"
                  ? "bg-surface text-amber-700 dark:text-amber-300 shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Pending (
              {
                todayOnlyInterviews.filter(
                  (i) => i.result === "PENDING" || i.status === "PENDING"
                ).length
              }
              )
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search by student name, advisor, college, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-500 transition"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {filteredInterviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted space-y-3">
              <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <CalendarCheck size={32} className="text-text-muted" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  No Interviews Scheduled Today
                </h3>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">
                  {searchTerm
                    ? "No student matches your current search filters."
                    : "There are no student lead interviews scheduled for today's date."}
                </p>
              </div>
            </div>
          ) : (
            filteredInterviews.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all duration-200 space-y-3"
              >
                {/* Header Row: Student Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-bold text-sm flex items-center justify-center shrink-0">
                      {item.candidateName?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary group-hover:text-purple-600 transition">
                        {item.candidateName}
                      </h3>
                      {item.phone && (
                        <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-text-muted" />
                          {item.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {getStatusBadge(item.status, item.result)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50/70 dark:bg-neutral-800/40 p-3 rounded-xl border border-border/50">
                  <div>
                    <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
                      <Clock size={12} /> Scheduled Time:
                    </span>
                    <span className="font-semibold text-text-primary mt-0.5 block">
                      {formatTime(item.interviewTime)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
                      <GraduationCap size={12} /> College:
                    </span>
                    <span className="font-semibold text-text-primary mt-0.5 block truncate" title={item.college}>
                      {item.college}
                    </span>
                  </div>

                  <div className="col-span-2 pt-1 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
                      <Briefcase size={12} /> Course Pitched:
                    </span>
                    <span className="font-semibold text-purple-700 dark:text-purple-300 truncate max-w-[240px]">
                      {item.course}
                    </span>
                  </div>
                </div>

                {/* Footer Meta Row: Advisor & Manager Info + Action Button */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-3 text-text-secondary text-[11px]">
                    <span className="flex items-center gap-1" title="Assigned Advisor">
                      <User size={12} className="text-text-muted" />
                      {item.advisor}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1" title="Team & Manager">
                      <Building2 size={12} className="text-text-muted" />
                      {item.team} ({item.manager})
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      handleClose();
                      navigate(`${ROUTES.LEADS}?search=${encodeURIComponent(item.candidateName)}`);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 transition"
                  >
                    View Lead <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-neutral-50/70 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-text-secondary shrink-0">
          <span>Showing {filteredInterviews.length} student interview(s)</span>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-text-primary font-semibold hover:bg-neutral-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodayInterviewsDrawer;
