import { useEffect, useState, useCallback, useRef } from "react";
import {
  X,
  ArrowLeft,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Phone,
  User,
  MapPin,
  Clock,
  MessageSquare,
  History,
  ChevronRight,
  Download,
  Filter,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchFilteredStudentData,
  exportDatasetResponseHistory,
  fetchDatasetCallers,
  type DataUploadItem,
  type StudentDataRecord,
  type DatasetCallerItem,
} from "../../../services/dataManagementService";
import {
  fetchCallHistory,
  type CallRecordItem,
} from "../../../services/mockCallService";

const DISPOSITION_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "No Call Yet", value: "NO_CALL_YET" },
  { label: "No Answer", value: "NO_ANSWER" },
  { label: "Follow Up", value: "FOLLOW_UP" },
  { label: "Interested", value: "INTERESTED" },
  { label: "Not Interested", value: "NOT_INTERESTED" },
  { label: "Call Back Later", value: "CALL_BACK_LATER" },
  { label: "Wrong Number", value: "WRONG_NUMBER" },
  { label: "Disconnected", value: "DISCONNECTED" },
];

interface DatasetHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  upload: DataUploadItem | null;
}

export const DatasetHistoryDrawer = ({
  isOpen,
  onClose,
  upload,
}: DatasetHistoryDrawerProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [view, setView] = useState<"list" | "studentHistory">("list");
  const [students, setStudents] = useState<StudentDataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisposition, setSelectedDisposition] = useState<string>("ALL");
  const [selectedCalledById, setSelectedCalledById] = useState<string>("ALL");
  const [callerOptions, setCallerOptions] = useState<DatasetCallerItem[]>([]);
  const [matchingTotalCount, setMatchingTotalCount] = useState<number | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<StudentDataRecord | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecordItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input inside drawer
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset drawer state when dataset upload changes or opens
  useEffect(() => {
    if (isOpen && upload) {
      setView("list");
      setSelectedStudent(null);
      setStudents([]);
      setPage(1);
      setHasMore(true);
      setSearch("");
      setSearchQuery("");
      setSelectedDisposition("ALL");
      setSelectedCalledById("ALL");
      setMatchingTotalCount(null);

      if (accessToken) {
        fetchDatasetCallers(accessToken, upload.id).then((callers) => {
          setCallerOptions(callers || []);
        });
      }
    }
  }, [isOpen, upload, accessToken]);

  // Fetch paginated student list for current dataset upload
  const loadStudents = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      dispFilter: string,
      callerFilter: string,
      isReset: boolean
    ) => {
      if (!accessToken || !upload) return;
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetchFilteredStudentData(accessToken, {
          uploadIds: [upload.id],
          search: searchVal || undefined,
          disposition: dispFilter !== "ALL" ? dispFilter : undefined,
          calledById: callerFilter !== "ALL" ? callerFilter : undefined,
          page: pageNum,
          limit: 25,
        });

        const fetchedData = res.data || [];
        setStudents((prev) => (isReset ? fetchedData : [...prev, ...fetchedData]));
        setMatchingTotalCount(res.meta?.total ?? null);
        setHasMore(pageNum < (res.meta?.totalPages || 1));
      } catch (err) {
        console.error("Failed to load dataset students:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken, upload]
  );

  useEffect(() => {
    if (isOpen && upload) {
      loadStudents(
        page,
        searchQuery,
        selectedDisposition,
        selectedCalledById,
        page === 1
      );
    }
  }, [isOpen, upload, page, searchQuery, selectedDisposition, selectedCalledById, loadStudents]);

  const handleDispositionChange = (newDisposition: string) => {
    setSelectedDisposition(newDisposition);
    setPage(1);
  };

  const handleCalledByChange = (newCallerId: string) => {
    setSelectedCalledById(newCallerId);
    setPage(1);
  };

  // Infinite Scroll Handler inside drawer list
  const handleScroll = () => {
    if (!scrollContainerRef.current || loading || loadingMore || !hasMore) return;
    const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      setPage((prev) => prev + 1);
    }
  };

  // Open complete call history for a selected student inside the drawer
  const handleSelectStudent = async (student: StudentDataRecord) => {
    setSelectedStudent(student);
    setView("studentHistory");
    setHistoryLoading(true);
    try {
      if (accessToken) {
        const history = await fetchCallHistory(accessToken, student.id);
        setCallHistory(history || []);
      }
    } catch (err) {
      console.error("Failed to load student call history:", err);
      setCallHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Return from Student History to Student List (Preserving Scroll Position)
  const handleBackToList = () => {
    setView("list");
    setSelectedStudent(null);
  };

  const handleExportExcel = async () => {
    if (!accessToken || !upload || exporting) return;
    setExporting(true);
    try {
      await exportDatasetResponseHistory(
        accessToken,
        upload.id,
        upload.fileName,
        selectedDisposition,
        selectedCalledById
      );
      toast.success("Dataset response history exported successfully.");
    } catch (err: any) {
      console.error("Failed to export dataset response history:", err);
      toast.error(err.message || "Failed to export dataset response history.");
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen || !upload) return null;

  const totalRecordCount = upload.totalRecords || upload._count?.studentData || students.length;

  const renderOutcomeBadge = (outcome?: string | null) => {
    if (!outcome) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-text-muted border border-border">
          No Call Yet
        </span>
      );
    }

    const cleanOutcome = outcome.replace(/_/g, " ");

    switch (outcome) {
      case "INTERESTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            {cleanOutcome}
          </span>
        );
      case "FOLLOW_UP":
      case "CALL_BACK_LATER":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-300">
            {cleanOutcome}
          </span>
        );
      case "DISCONNECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-800 border border-orange-300">
            {cleanOutcome}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 border border-neutral-300">
            {cleanOutcome}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Right-Side Slider Drawer */}
        <div className="w-screen max-w-xl sm:max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col z-50 transform transition duration-300 ease-in-out">
          
          {/* DRAWER VIEW A: DATASET STUDENT LIST */}
          <div className={`flex flex-col h-full ${view === "list" ? "block" : "hidden"}`}>
            {/* Header */}
            <div className="p-5 border-b border-border bg-neutral-50/70 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-primary-600 shrink-0" />
                  <h2 className="text-lg font-bold text-text-primary truncate max-w-[220px] sm:max-w-[280px]" title={upload.fileName}>
                    {upload.fileName}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700 border border-primary-200 font-mono">
                    {matchingTotalCount !== null && (selectedDisposition !== "ALL" || selectedCalledById !== "ALL" || searchQuery)
                      ? `${matchingTotalCount} matching records`
                      : `${totalRecordCount} records`}
                  </span>
                  <span className="text-xs text-text-muted">
                    Uploaded {new Date(upload.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-2xs disabled:opacity-60 cursor-pointer"
                  title="Export complete dataset with latest responses to Excel"
                >
                  {exporting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Export Excel</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-text-secondary hover:bg-neutral-200 transition cursor-pointer"
                  title="Close drawer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Search Input Box & Disposition & Called By Filters inside drawer */}
            <div className="p-4 border-b border-border bg-surface space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students by name, phone..."
                    className="w-full h-9.5 rounded-xl border border-border bg-neutral-50/50 pl-9.5 pr-8 text-xs text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Disposition Filter */}
                  <div className="relative">
                    <select
                      value={selectedDisposition}
                      onChange={(e) => handleDispositionChange(e.target.value)}
                      className="h-9.5 rounded-xl border border-border bg-neutral-50 px-3 pr-8 text-xs font-bold text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 cursor-pointer appearance-none max-w-[170px] truncate"
                    >
                      {DISPOSITION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value === "ALL" ? "Disposition: All" : `Disposition: ${opt.label}`}
                        </option>
                      ))}
                    </select>
                    <Filter size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>

                  {/* Called By Filter */}
                  <div className="relative">
                    <select
                      value={selectedCalledById}
                      onChange={(e) => handleCalledByChange(e.target.value)}
                      className="h-9.5 rounded-xl border border-border bg-neutral-50 px-3 pr-8 text-xs font-bold text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 cursor-pointer appearance-none max-w-[170px] truncate"
                    >
                      <option value="ALL">Called By: All</option>
                      {callerOptions.map((caller) => (
                        <option key={caller.id} value={caller.id}>
                          Called By: {caller.name}
                        </option>
                      ))}
                    </select>
                    <Filter size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>
              </div>

              {(selectedDisposition !== "ALL" || selectedCalledById !== "ALL" || searchQuery) && (
                <div className="flex items-center justify-between text-xs text-text-secondary pt-0.5">
                  <span className="font-medium">
                    Showing{" "}
                    <strong className="text-primary-700 font-bold">
                      {matchingTotalCount ?? students.length}
                    </strong>{" "}
                    matching records
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedDisposition("ALL");
                      setSelectedCalledById("ALL");
                    }}
                    className="text-[11px] font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Infinite Scroll Student List */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border/60"
            >
              {loading && page === 1 ? (
                <div className="p-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-primary-600" />
                  Loading dataset records...
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center text-xs text-text-muted space-y-2">
                  <User size={32} className="mx-auto text-text-muted opacity-50" />
                  <p className="font-bold text-text-secondary text-sm">No student records found</p>
                  <p>
                    {selectedDisposition !== "ALL" || selectedCalledById !== "ALL"
                      ? "No students match the current filter criteria."
                      : "Try matching student name or phone number."}
                  </p>
                </div>
              ) : (
                students.map((student) => {
                  const fullName = [student.firstName, student.middleName, student.lastName]
                    .filter(Boolean)
                    .join(" ");
                  
                  const latestCall = student.callRecords?.[0];
                  const latestOutcome = latestCall?.outcome || null;
                  const latestDate = latestCall?.createdAt
                    ? new Date(latestCall.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null;

                  const calledByName = latestCall?.createdBy
                    ? `${latestCall.createdBy.firstName} ${latestCall.createdBy.lastName || ""}`.trim()
                    : latestCall
                    ? "System / Advisor"
                    : "No Caller";

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="pt-3 first:pt-0 group p-3.5 rounded-xl border border-border/80 bg-surface hover:bg-neutral-50/80 hover:border-primary-300 transition cursor-pointer flex items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1.5 overflow-hidden flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-primary-600 transition truncate">
                            {fullName}
                          </h4>
                          {renderOutcomeBadge(latestOutcome)}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text-secondary font-mono">
                          <span className="flex items-center gap-1 text-text-primary font-semibold">
                            <Phone size={13} className="text-primary-600 shrink-0" />
                            {student.phone}
                          </span>
                          {(student.city || student.state) && (
                            <span className="flex items-center gap-1 text-text-muted truncate">
                              <MapPin size={13} className="shrink-0" />
                              {[student.city, student.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1 border-t border-border/40">
                          <span>
                            Called By: <strong className="text-text-secondary font-semibold">{calledByName}</strong>
                          </span>
                          {latestDate && <span>Latest activity: {latestDate}</span>}
                        </div>
                      </div>

                      <div className="shrink-0 text-text-muted group-hover:text-primary-600 transition">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  );
                })
              )}

              {loadingMore && (
                <div className="p-3 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-primary-600" />
                  Loading more students...
                </div>
              )}
            </div>
          </div>

          {/* DRAWER VIEW B: STUDENT RESPONSE HISTORY */}
          {view === "studentHistory" && selectedStudent && (
            <div className="flex flex-col h-full bg-surface">
              {/* Header with Back Button */}
              <div className="p-5 border-b border-border bg-neutral-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="p-2 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                    title="Return to dataset student list"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <div className="overflow-hidden">
                    <h3 className="text-base font-bold text-text-primary truncate">
                      {[selectedStudent.firstName, selectedStudent.middleName, selectedStudent.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </h3>
                    <p className="text-xs font-mono text-text-secondary flex items-center gap-1">
                      <Phone size={12} className="text-primary-600" />
                      {selectedStudent.phone}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-text-secondary hover:bg-neutral-200 transition cursor-pointer"
                  title="Close drawer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Student Response History List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h4 className="text-xs font-bold uppercase text-text-secondary tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-primary-600" />
                    Complete Call Response History
                  </h4>
                  <span className="text-xs text-text-muted font-mono font-bold">
                    {callHistory.length} responses
                  </span>
                </div>

                {historyLoading ? (
                  <div className="p-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-primary-600" />
                    Loading response history...
                  </div>
                ) : callHistory.length === 0 ? (
                  <div className="p-10 text-center text-xs text-text-muted space-y-2 bg-neutral-50 rounded-2xl border border-border">
                    <Clock size={28} className="mx-auto text-text-muted opacity-50" />
                    <p className="font-bold text-text-secondary text-sm">No call response history</p>
                    <p>No phone call outcomes have been logged for this prospect yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 relative pl-4 border-l-2 border-primary-200">
                    {callHistory.map((rec) => {
                      const recordDate = new Date(rec.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const callerName = rec.createdBy
                        ? `${rec.createdBy.firstName} ${rec.createdBy.lastName || ""}`.trim()
                        : "Program Advisor";

                      return (
                        <div
                          key={rec.id}
                          className="relative p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-2"
                        >
                          <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-primary-600 ring-4 ring-surface" />

                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {renderOutcomeBadge(rec.outcome)}
                            <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                              <Clock size={12} />
                              {recordDate}
                            </span>
                          </div>

                          {rec.notes ? (
                            <div className="p-2.5 rounded-lg bg-neutral-50 border border-border text-xs text-text-primary space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-text-muted block flex items-center gap-1">
                                <MessageSquare size={10} /> Notes
                              </span>
                              <p className="text-xs whitespace-pre-wrap">{rec.notes}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted italic">No notes added for this call outcome.</p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/60">
                            <span>Logged by: <strong>{callerName}</strong></span>
                            {rec.durationSeconds ? <span>Duration: {rec.durationSeconds}s</span> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
