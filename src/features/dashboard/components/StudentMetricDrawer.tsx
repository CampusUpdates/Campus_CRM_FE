import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  User,
  Building2,
  GraduationCap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  fetchMetricStudents,
  type MetricStudentItem,
} from "../../../services/metricDrawerService";

export interface StudentMetricDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metric: string | null;
  metricTitle: string;
  metricDescription?: string;
  metricIcon?: React.ReactNode;
  token?: string | null;
  teamId?: string;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "Not provided";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBadgeStyle(statusName?: string, customColor?: string): string {
  const name = (statusName || "").toUpperCase();
  if (customColor === "emerald" || name.includes("ADMISSION") || name.includes("ENROLLED") || name.includes("DONE") || name.includes("PASSED")) {
    return "bg-emerald-950/80 text-emerald-300 border-emerald-700/80";
  }
  if (customColor === "pink" || name.includes("LETTER_OUT") || name.includes("OFFER")) {
    return "bg-pink-950/80 text-pink-300 border-pink-700/80";
  }
  if (customColor === "purple" || name.includes("INTERVIEW_DONE") || name.includes("PROCESS")) {
    return "bg-purple-950/80 text-purple-300 border-purple-700/80";
  }
  if (customColor === "orange" || name.includes("INTERVIEW") || name.includes("SCHEDULED")) {
    return "bg-orange-950/80 text-orange-300 border-orange-700/80";
  }
  if (customColor === "amber" || name.includes("APPLICATION") || name.includes("PENDING")) {
    return "bg-amber-950/80 text-amber-300 border-amber-700/80";
  }
  if (customColor === "rose" || name.includes("CANCEL") || name.includes("REJECT") || name.includes("DUE")) {
    return "bg-rose-950/80 text-rose-300 border-rose-700/80";
  }
  if (customColor === "cyan" || name.includes("UPLOAD")) {
    return "bg-cyan-950/80 text-cyan-300 border-cyan-700/80";
  }
  return "bg-blue-950/80 text-blue-300 border-blue-700/80";
}

export const StudentMetricDrawer = ({
  isOpen,
  onClose,
  metric,
  metricTitle,
  metricDescription,
  metricIcon,
  token,
  teamId,
}: StudentMetricDrawerProps) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const [students, setStudents] = useState<MetricStudentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleTriggerClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing]);

  // Fetch student records for selected metric
  const loadMetricStudents = useCallback(
    async (targetMetric: string, targetPage: number = 1, searchQuery: string = "") => {
      if (!token) return;

      // Abort any ongoing request to avoid race conditions when switching cards quickly
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const response = await fetchMetricStudents(
          token,
          {
            metric: targetMetric,
            teamId,
            search: searchQuery,
            page: targetPage,
            limit: 20,
          },
          abortControllerRef.current.signal
        );

        if (targetPage === 1) {
          setStudents(response.data);
        } else {
          setStudents((prev) => [...prev, ...response.data]);
        }
        setTotalRecords(response.total);
        setPage(response.page);
        setTotalPages(response.totalPages);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        console.error("Failed to load metric students:", err);
        setError(err instanceof Error ? err.message : "Failed to load student records");
      } finally {
        setLoading(false);
      }
    },
    [token, teamId]
  );

  // Trigger data fetch on metric or open change
  useEffect(() => {
    if (isOpen && metric) {
      setIsClosing(false);
      setSearchTerm("");
      setExpandedNotes({});
      loadMetricStudents(metric, 1, "");
    } else if (!isOpen) {
      setStudents([]);
      setError(null);
    }
  }, [isOpen, metric, loadMetricStudents]);

  // Handle Search Input with debounce
  useEffect(() => {
    if (!isOpen || !metric) return;
    const timer = setTimeout(() => {
      loadMetricStudents(metric, 1, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, metric, loadMetricStudents]);

  const handleTriggerClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLoadMore = () => {
    if (page < totalPages && metric) {
      loadMetricStudents(metric, page + 1, searchTerm);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="metric-drawer-title">
      {/* Semi-transparent Backdrop */}
      <div
        onClick={handleTriggerClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      />

      {/* Right Slide-in Drawer Panel */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`fixed right-0 top-0 h-[100dvh] w-[90vw] sm:w-[460px] max-w-[480px] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col z-50 text-slate-100 ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
      >
        {/* Sticky Header */}
        <div className="shrink-0 p-5 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
                {metricIcon || <TrendingUp size={20} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 id="metric-drawer-title" className="text-base font-bold text-slate-100 truncate">
                    {metricTitle}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shrink-0">
                    {totalRecords} {totalRecords === 1 ? "Record" : "Records"}
                  </span>
                </div>
                {metricDescription && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{metricDescription}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => metric && loadMetricStudents(metric, 1, searchTerm)}
                disabled={loading}
                title="Refresh student records"
                aria-label="Refresh student records"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-emerald-400" : ""} />
              </button>
              <button
                type="button"
                onClick={handleTriggerClose}
                title="Close drawer (Esc)"
                aria-label="Close drawer"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search Bar inside Drawer */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, phone, email, city..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-800/90 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Scrollable Student Cards Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {/* Loading Skeleton */}
          {loading && students.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-slate-700 rounded" />
                    <div className="h-5 w-16 bg-slate-700 rounded-full" />
                  </div>
                  <div className="h-3 w-44 bg-slate-700/60 rounded" />
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40">
                    <div className="h-3 w-28 bg-slate-700/40 rounded" />
                    <div className="h-3 w-28 bg-slate-700/40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-6 rounded-xl border border-rose-900/60 bg-rose-950/30 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-900/60 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={20} />
              </div>
              <h4 className="text-sm font-semibold text-rose-300">Unable to load records</h4>
              <p className="text-xs text-rose-400 max-w-xs mx-auto">{error}</p>
              <button
                onClick={() => metric && loadMetricStudents(metric, 1, searchTerm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && students.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto border border-slate-700">
                <Users size={24} />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">No student records found</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchTerm
                  ? `No matching records found for "${searchTerm}". Try a different keyword.`
                  : "No students currently match this specific metric under your active filters."}
              </p>
            </div>
          )}

          {/* Student Cards List */}
          {students.map((student) => {
            const isNoteLong = (student.notes || "").length > 90;
            const isExpanded = expandedNotes[student.id];

            return (
              <div
                key={student.id}
                className="group rounded-xl border border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-700 p-4 transition-all duration-150 space-y-3"
              >
                {/* Header: Student Name & Stage Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition">
                      {student.studentName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Calendar size={12} className="text-slate-500 shrink-0" />
                      <span>{student.dateLabel}: {formatDisplayDate(student.date)}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${getBadgeStyle(
                      student.status,
                      student.statusColor
                    )}`}
                  >
                    {student.status}
                  </span>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/50 text-slate-300">
                  {/* Phone */}
                  <div className="flex items-center gap-2 truncate">
                    <Phone size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">
                      {student.phone ? (
                        <a href={`tel:${student.phone}`} className="hover:text-emerald-400 transition">
                          {student.phone}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Not provided</span>
                      )}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate" title={student.email || undefined}>
                      {student.email ? (
                        <a href={`mailto:${student.email}`} className="hover:text-emerald-400 transition">
                          {student.email}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Not provided</span>
                      )}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 truncate">
                    <MapPin size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate" title={student.location || undefined}>
                      {student.location ? student.location : <span className="text-slate-500 italic">Not provided</span>}
                    </span>
                  </div>

                  {/* Assigned Advisor / Team */}
                  {(student.assignedAdvisor || student.team) && (
                    <div className="flex items-center gap-2 truncate">
                      <User size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate" title={`${student.assignedAdvisor || ""} (${student.team || ""})`}>
                        {student.assignedAdvisor || "Unassigned"}
                        {student.team && <span className="text-slate-500 text-[10px]"> • {student.team}</span>}
                      </span>
                    </div>
                  )}

                  {/* Course Interested */}
                  {student.course && (
                    <div className="flex items-center gap-2 truncate">
                      <GraduationCap size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate">{student.course}</span>
                    </div>
                  )}

                  {/* College */}
                  {student.college && (
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate" title={student.college}>{student.college}</span>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-start gap-2 text-xs">
                    <FileText size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      {student.notes ? (
                        <div>
                          <p className={`text-slate-300 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                            {student.notes}
                          </p>
                          {isNoteLong && (
                            <button
                              type="button"
                              onClick={() => toggleNotes(student.id)}
                              className="mt-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5"
                            >
                              {isExpanded ? (
                                <>Show less <ChevronUp size={12} /></>
                              ) : (
                                <>Show more <ChevronDown size={12} /></>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Notes: Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Link: Lead 360 Profile */}
                {student.leadId && (
                  <div className="pt-2 border-t border-slate-700/50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/leads/${student.leadId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-emerald-600/90 text-slate-200 hover:text-white text-xs font-semibold transition"
                    >
                      <span>Lead 360</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More Button */}
          {page < totalPages && !loading && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Load More Records ({totalRecords - students.length} remaining)</span>
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMetricDrawer;
