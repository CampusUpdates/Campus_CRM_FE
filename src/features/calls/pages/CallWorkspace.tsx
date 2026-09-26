import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  History,
  Search,
  Bookmark,
  Plus,
  ExternalLink,
  Layers,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchMockCallQueue,
  fetchAssignedStudentDataOne,
  fetchCallLogs,
  initiateMockCall,
  endMockCall,
  type MockCallQueueStudentItem,
  type MockCallSession,
  type CallLogItem,
} from "../../../services/mockCallService";
import StudentDetailsCard from "../components/StudentDetailsCard";
import MockCallPanel from "../components/MockCallPanel";
import CallOutcomePanel from "../components/CallOutcomePanel";
import { SuperAdminCallReportView } from "../components/SuperAdminCallReportView";
import { CallHistoryDrawer } from "../components/CallHistoryDrawer";
import AddDispositionModal from "../components/AddDispositionModal";
import { BookmarksDrawer } from "../components/BookmarksDrawer";
import {
  getAssignmentRecordIndex,
  setAssignmentRecordIndex,
  getLastActiveAssignmentId,
  saveLastActiveAssignmentId,
  getRecordPhonePosition,
  setRecordPhonePosition,
} from "../../../utils/callPositionStorage";
import { getCompactPageNumbers } from "../../../utils/paginationUtils";

interface AssignmentBatch {
  assignmentId: string;
  datasetName: string;
  fileName: string;
  assignedAt?: string;
  items: MockCallQueueStudentItem[];
  totalRecords: number;
  completedCount: number;
}

function computeAssignmentBatches(queue: MockCallQueueStudentItem[]): AssignmentBatch[] {
  const batchMap = new Map<string, AssignmentBatch>();
  const batchOrder: string[] = [];

  for (const item of queue) {
    const assignmentId = item.assignment?.id || item.upload?.id || "default_batch";
    const rawFileName = item.upload?.fileName || "Assigned Dataset";
    let datasetName = rawFileName;
    if (datasetName.includes(".")) {
      datasetName = datasetName.replace(/\.[^/.]+$/, "");
    }
    const assignedAt = item.assignment?.assignedAt || item.upload?.uploadedAt || item.createdAt;

    if (!batchMap.has(assignmentId)) {
      batchMap.set(assignmentId, {
        assignmentId,
        datasetName,
        fileName: rawFileName,
        assignedAt,
        items: [item],
        totalRecords: 1,
        completedCount: item.isCompleted ? 1 : 0,
      });
      batchOrder.push(assignmentId);
    } else {
      const existing = batchMap.get(assignmentId)!;
      existing.items.push(item);
      existing.totalRecords += 1;
      if (item.isCompleted) {
        existing.completedCount += 1;
      }
    }
  }

  return batchOrder.map((id) => batchMap.get(id)!);
}

function getStartingIndexForBatch(
  batch: AssignmentBatch,
  mode: "all" | "uncompleted",
  savedOffset?: number
): number {
  if (mode === "uncompleted") {
    const uncompletedItems = batch.items.filter((item) => !item.isCompleted);
    if (uncompletedItems.length === 0) return 0;
    return typeof savedOffset === "number"
      ? Math.min(Math.max(0, savedOffset), uncompletedItems.length - 1)
      : 0;
  }

  // mode === "all":
  // Total records remain intact in batch.items.
  // Dynamically determine starting position at first uncompleted record.
  const firstUncompletedIdx = batch.items.findIndex((item) => !item.isCompleted);

  if (
    typeof savedOffset === "number" &&
    savedOffset >= 0 &&
    savedOffset < batch.items.length &&
    !batch.items[savedOffset]?.isCompleted
  ) {
    return savedOffset;
  }

  return firstUncompletedIdx !== -1 ? firstUncompletedIdx : 0;
}

const CallWorkspace = () => {
  const { user, accessToken } = useAuth();
  const toast = useToast();

  const isSuperAdmin = user?.roleCode === "SUPER_ADMIN" || user?.roleId === 1;

  if (isSuperAdmin) {
    return <SuperAdminCallReportView />;
  }

  const [searchParams, setSearchParams] = useSearchParams();

  const paramStudentDataId = searchParams.get("studentDataId");
  const paramDate = searchParams.get("date");
  const paramTeamId = searchParams.get("teamId");
  const paramAdvisorId = searchParams.get("advisorId");

  const [activeTab, setActiveTab] = useState<"dialer" | "logs">(
    paramStudentDataId ? "dialer" : (paramDate || paramTeamId || paramAdvisorId ? "logs" : "dialer")
  );

  // Dialer state
  const [queue, setQueue] = useState<MockCallQueueStudentItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Call Logs state
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);

  // Active call session
  const [callSession, setCallSession] = useState<MockCallSession | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal & Drawer State
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [selectedStudentForDisposition, setSelectedStudentForDisposition] = useState<CallLogItem | null>(null);
  const [isAddDispositionModalOpen, setIsAddDispositionModalOpen] = useState(false);

  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);

  // 1. Derived Assignment Batches
  const batches = useMemo(() => computeAssignmentBatches(queue), [queue]);

  // 2. Explicit Active Assignment ID State (Source of Truth)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  // 3. Active Assignment Batch derived object
  const activeBatch = useMemo(() => {
    if (!batches.length) return null;
    return batches.find((b) => b.assignmentId === selectedAssignmentId) || batches[0];
  }, [batches, selectedAssignmentId]);

  // 4. Working Queue Filter Mode: "all" or "uncompleted"
  const [filterMode, setFilterMode] = useState<"all" | "uncompleted">(() => {
    try {
      const saved = localStorage.getItem(`call-filter-mode:${user?.sub}`);
      return saved === "uncompleted" ? "uncompleted" : "all";
    } catch {
      return "all";
    }
  });

  // 5. Active Queue Items for the Selected Assignment (filtered by mode)
  const activeBatchQueue = useMemo(() => {
    if (!activeBatch) return [];
    if (filterMode === "uncompleted") {
      return activeBatch.items.filter((item) => !item.isCompleted);
    }
    return activeBatch.items;
  }, [activeBatch, filterMode]);

  // 6. Record Position Index within Active Assignment Queue
  const [batchRecordIndex, setBatchRecordIndex] = useState<number>(0);

  // Sync selectedAssignmentId & batchRecordIndex when queue/batches load or change
  useEffect(() => {
    if (!batches.length) return;

    const exists = batches.some((b) => b.assignmentId === selectedAssignmentId);
    if (!exists) {
      const lastAssId = getLastActiveAssignmentId(user?.sub);
      const targetBatch = batches.find((b) => b.assignmentId === lastAssId) || batches[0];
      setSelectedAssignmentId(targetBatch.assignmentId);

      const savedOffset = getAssignmentRecordIndex(user?.sub, targetBatch.assignmentId);
      const targetIndex = getStartingIndexForBatch(targetBatch, filterMode, savedOffset);
      setBatchRecordIndex(targetIndex);
    }
  }, [batches, selectedAssignmentId, user?.sub, filterMode]);

  // 7. Derived Current Student (Guaranteed to belong to activeBatch!)
  const currentStudent = useMemo(() => {
    if (!activeBatchQueue || activeBatchQueue.length === 0) return null;
    const clampedIndex = Math.min(Math.max(0, batchRecordIndex), activeBatchQueue.length - 1);
    return activeBatchQueue[clampedIndex] || null;
  }, [activeBatchQueue, batchRecordIndex]);

  // Reset call session whenever current student changes
  useEffect(() => {
    setCallSession(null);
  }, [currentStudent?.studentDataId]);

  const batchTotalRecords = activeBatch?.totalRecords || 0;
  const batchUncompletedCount = (activeBatch?.totalRecords || 0) - (activeBatch?.completedCount || 0);

  // Per-record phone position state
  const [phonePosition, setPhonePositionState] = useState<number>(1);

  // Sync phone position whenever current student changes
  useEffect(() => {
    if (currentStudent && user?.sub) {
      const pos = getRecordPhonePosition(user.sub, currentStudent.studentDataId);
      setPhonePositionState(pos);
    } else {
      setPhonePositionState(1);
    }
  }, [currentStudent?.studentDataId, user?.sub]);

  // Persist current record position within active assignment batch
  useEffect(() => {
    if (!user?.sub || !activeBatch || queue.length === 0) return;
    setAssignmentRecordIndex(user.sub, activeBatch.assignmentId, batchRecordIndex);
    saveLastActiveAssignmentId(user.sub, activeBatch.assignmentId);
  }, [user?.sub, batchRecordIndex, activeBatch, queue.length]);

  const handleToggleFilterMode = (mode: "all" | "uncompleted") => {
    setFilterMode(mode);
    try {
      if (user?.sub) {
        localStorage.setItem(`call-filter-mode:${user.sub}`, mode);
      }
    } catch {
      // ignore
    }
    if (activeBatch) {
      const savedOffset = getAssignmentRecordIndex(user?.sub, activeBatch.assignmentId);
      const targetIndex = getStartingIndexForBatch(activeBatch, mode, savedOffset);
      setBatchRecordIndex(targetIndex);
    } else {
      setBatchRecordIndex(0);
    }
    setCallSession(null);
  };

  const handlePhonePositionChange = (newPos: number) => {
    if (!currentStudent || !user?.sub) return;
    const clampedPos = Math.max(1, newPos);
    setPhonePositionState(clampedPos);
    setRecordPhonePosition(user.sub, currentStudent.studentDataId, clampedPos);
  };

  // Immediate Data Set / Assignment Batch Jumper (Updates active workspace synchronously!)
  const handleJumpToAssignmentBatch = (targetAssignmentId: string) => {
    const targetBatch = batches.find((b) => b.assignmentId === targetAssignmentId);
    if (!targetBatch) return;

    // 1. Immediately change active assignment ID (source of truth!)
    setSelectedAssignmentId(targetAssignmentId);

    // 2. Load starting index for target assignment
    const savedOffset = getAssignmentRecordIndex(user?.sub, targetAssignmentId);
    const targetIndex = getStartingIndexForBatch(targetBatch, filterMode, savedOffset);

    // 3. Set batch record index
    setBatchRecordIndex(targetIndex);
    setCallSession(null);

    // 4. Save last active assignment ID
    saveLastActiveAssignmentId(user?.sub, targetAssignmentId);
  };

  // Load Dialer Queue
  const loadQueue = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetchMockCallQueue(accessToken);
      let items = res.items || [];

      const computed = computeAssignmentBatches(items);

      if (paramStudentDataId) {
        const ownerBatch = computed.find((b) => b.items.some((i) => i.studentDataId === paramStudentDataId));
        if (ownerBatch) {
          setSelectedAssignmentId(ownerBatch.assignmentId);
          const foundIdx = ownerBatch.items.findIndex((i) => i.studentDataId === paramStudentDataId);
          setBatchRecordIndex(foundIdx !== -1 ? foundIdx : 0);
        } else {
          try {
            const singleStudent = await fetchAssignedStudentDataOne(accessToken, paramStudentDataId);
            if (singleStudent) {
              items = [singleStudent, ...items];
              const updatedBatches = computeAssignmentBatches(items);
              const newOwnerBatch = updatedBatches.find((b) => b.items.some((i) => i.studentDataId === paramStudentDataId));
              if (newOwnerBatch) {
                setSelectedAssignmentId(newOwnerBatch.assignmentId);
                const foundIdx = newOwnerBatch.items.findIndex((i) => i.studentDataId === paramStudentDataId);
                setBatchRecordIndex(foundIdx !== -1 ? foundIdx : 0);
              }
            }
          } catch {
            // ignore
          }
        }
      } else if (computed.length > 0) {
        const lastAssId = getLastActiveAssignmentId(user?.sub);
        const targetBatch = computed.find((b) => b.assignmentId === lastAssId) || computed[0];
        setSelectedAssignmentId(targetBatch.assignmentId);

        const savedOffset = getAssignmentRecordIndex(user?.sub, targetBatch.assignmentId);
        const targetIndex = getStartingIndexForBatch(targetBatch, filterMode, savedOffset);
        setBatchRecordIndex(targetIndex);
      }

      setQueue(items);
      setCompletedCount(res.completedCount || 0);
      setCallSession(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assigned call queue.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterMode, paramStudentDataId, toast, user?.sub]);

  // Load Call Logs (Server-side search & pagination)
  const loadLogs = useCallback(async () => {
    if (!accessToken) return;
    setLogsLoading(true);
    try {
      const res = await fetchCallLogs(accessToken, {
        page: logsPage,
        limit: 10,
        search: searchQuery,
      });
      setCallLogs(res.data || []);
      setLogsTotal(res.total || 0);
      setLogsTotalPages(res.totalPages || 1);
      setBookmarkedCount(res.bookmarkedCount || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load call logs.");
    } finally {
      setLogsLoading(false);
    }
  }, [accessToken, logsPage, searchQuery, toast]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setLogsPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    if (activeTab === "dialer") {
      loadQueue();
    } else {
      loadLogs();
    }
  }, [activeTab, loadQueue, loadLogs]);

  // Navigate to dialer tab for a specific student
  const handleOpenStudentInDialer = (studentDataId: string) => {
    setSearchParams({ studentDataId });
    setActiveTab("dialer");
  };

  const handleInitiateCall = async () => {
    if (!accessToken || !currentStudent || actionLoading) return;
    if (
      !currentStudent.phone ||
      currentStudent.phone.trim() === "" ||
      currentStudent.phone === "undefined" ||
      currentStudent.phone === "null"
    ) {
      toast.error("Selected contact has no valid phone number.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await initiateMockCall(accessToken, currentStudent.studentDataId);
      if (!res?.session || !res.session.phoneNumber) {
        throw new Error("Invalid call session returned by telephony provider.");
      }
      setCallSession(res.session);
      toast.success(`Calling ${currentStudent.firstName} (${res.session.phoneNumber})...`);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate call.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!accessToken || !callSession || actionLoading) return;
    setActionLoading(true);
    try {
      const endedSession = await endMockCall(accessToken, callSession.callId);
      setCallSession(endedSession);
      toast.info("Mock call disconnected.");
    } catch (err: any) {
      toast.error(err.message || "Failed to end call.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextContact = () => {
    if (!activeBatchQueue || activeBatchQueue.length === 0) return;
    if (batchRecordIndex < activeBatchQueue.length - 1) {
      const nextIdx = batchRecordIndex + 1;
      setBatchRecordIndex(nextIdx);
      setCallSession(null);
      if (activeBatch && user?.sub) {
        setAssignmentRecordIndex(user.sub, activeBatch.assignmentId, nextIdx);
      }
    } else {
      toast.info(`You have reached the end of ${activeBatch?.datasetName || "this dataset"} records.`);
    }
  };

  const handlePreviousContact = () => {
    if (!activeBatchQueue || activeBatchQueue.length === 0) return;
    if (batchRecordIndex > 0) {
      const prevIdx = batchRecordIndex - 1;
      setBatchRecordIndex(prevIdx);
      setCallSession(null);
      if (activeBatch && user?.sub) {
        setAssignmentRecordIndex(user.sub, activeBatch.assignmentId, prevIdx);
      }
    }
  };

  const handleOutcomeComplete = () => {
    setCallSession(null);
    setCompletedCount((prev) => prev + 1);
    setHistoryRefreshKey((prev) => prev + 1);

    if (currentStudent) {
      setQueue((prevQueue) =>
        prevQueue.map((item) =>
          item.studentDataId === currentStudent.studentDataId ? { ...item, isCompleted: true } : item
        )
      );
    }

    if (filterMode === "uncompleted") {
      const currentUncompletedCount = activeBatchQueue.length;
      if (batchRecordIndex >= currentUncompletedCount - 1) {
        setBatchRecordIndex(Math.max(0, currentUncompletedCount - 2));
      }
    } else {
      if (batchRecordIndex < activeBatchQueue.length - 1) {
        const nextIdx = batchRecordIndex + 1;
        setBatchRecordIndex(nextIdx);
        if (activeBatch && user?.sub) {
          setAssignmentRecordIndex(user.sub, activeBatch.assignmentId, nextIdx);
        }
      } else {
        toast.success(`Dataset ${activeBatch?.datasetName || ""} Completed! You have processed all records.`);
      }
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Workspace Top Header & Mode Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <PhoneCall className="text-primary-600" size={26} />
            Call Workspace & Call Logs
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Actionable call log history, dispositioning, and live dialer calling queue.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-2xs">
            <button
              onClick={() => setActiveTab("dialer")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${activeTab === "dialer"
                ? "bg-primary-600 text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
                }`}
            >
              <PhoneCall size={14} /> Live Dialer Queue
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${activeTab === "logs"
                ? "bg-primary-600 text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
                }`}
            >
              <History size={14} /> Call Logs ({logsTotal})
            </button>
          </div>

          {activeTab === "dialer" ? (
            <button
              type="button"
              onClick={loadQueue}
              title="Refresh queue"
              className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          ) : (
            <button
              type="button"
              onClick={loadLogs}
              title="Refresh call logs"
              className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw size={18} className={logsLoading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {activeTab === "logs" ? (
        /* ACTIONABLE CALL LOGS INTERFACE */
        <div className="space-y-4">
          {/* Top Search Box & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-surface shadow-2xs">
            {/* Search Input Box */}
            <div className="relative w-full sm:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by student name, phone, email, city, state..."
                className="w-full h-10 rounded-xl border border-border bg-neutral-50/50 pl-10 pr-4 text-xs text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-text-secondary w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setIsBookmarksDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50/90 hover:bg-blue-100 text-blue-800 px-3.5 py-2 font-bold transition shadow-2xs cursor-pointer"
                title="Open active 24h bookmarks slider"
              >
                <Bookmark size={14} className="fill-blue-600 text-blue-600" />
                <span>Bookmarks</span>
                {bookmarkedCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-2 py-0.5 text-[10px] font-bold">
                    {bookmarkedCount}
                  </span>
                )}
              </button>
              <span>Showing <strong>{callLogs.length}</strong> of <strong>{logsTotal}</strong> student call records</span>
            </div>
          </div>

          {/* Call Logs Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs">
            {logsLoading ? (
              <div className="p-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-primary-600" />
                Loading searchable call logs...
              </div>
            ) : callLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted space-y-2">
                <p className="font-bold text-text-secondary text-sm">No call log records found</p>
                <p>Try clearing your search criteria or requesting dataset assignments from your Manager.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                        <th className="px-5 py-4">Student Name</th>
                        <th className="px-5 py-4">Phone / Email</th>
                        <th className="px-5 py-4">City / State</th>
                        <th className="px-5 py-4">Dataset File</th>
                        <th className="px-5 py-4">Latest Outcome</th>
                        <th className="px-5 py-4">24h Bookmark</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {callLogs.map((item) => {
                        const latestOutcome = item.latestCall?.outcome;
                        const latestOutcomeLabel = latestOutcome ? latestOutcome.replace(/_/g, " ") : "No Call Yet";
                        const isBookmarkActive = item.isBookmarked;

                        return (
                          <tr key={item.studentDataId} className="hover:bg-neutral-50/60 transition">
                            {/* Clickable Student Name -> Deep-links to Live Dialer Queue */}
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => handleOpenStudentInDialer(item.studentDataId)}
                                title="Click to open in Live Dialer Queue"
                                className="group font-bold text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                              >
                                <span>{item.fullName}</span>
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition shrink-0 text-primary-500" />
                              </button>
                            </td>

                            {/* Contact Details */}
                            <td className="px-5 py-4 space-y-0.5">
                              <div className="font-mono text-text-primary font-medium">{item.phone}</div>
                              {item.email && <div className="text-[11px] text-text-muted truncate max-w-[180px]">{item.email}</div>}
                            </td>

                            {/* Location */}
                            <td className="px-5 py-4 text-text-secondary">
                              {[item.city, item.state].filter(Boolean).join(", ") || "—"}
                            </td>

                            {/* Dataset File Name */}
                            <td className="px-5 py-4 text-text-secondary font-medium">
                              <span className="truncate max-w-[150px] inline-block" title={item.uploadFileName}>
                                {item.uploadFileName}
                              </span>
                            </td>

                            {/* Latest Call Outcome & Timestamp */}
                            <td className="px-5 py-4 space-y-1">
                              {item.latestCall ? (
                                <div>
                                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${latestOutcome === "INTERESTED"
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : latestOutcome === "FOLLOW_UP" || latestOutcome === "CALL_BACK_LATER"
                                      ? "border-blue-300 bg-blue-50 text-blue-800"
                                      : latestOutcome === "DISCONNECTED"
                                        ? "border-orange-300 bg-orange-50 text-orange-800"
                                        : "border-neutral-300 bg-neutral-50 text-neutral-700"
                                    }`}>
                                    {latestOutcomeLabel}
                                  </span>
                                  <div className="text-[10px] text-text-muted mt-0.5 font-mono">
                                    {new Date(item.latestCall.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} • {new Date(item.latestCall.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    {item.latestCall.durationSeconds ? ` (${item.latestCall.durationSeconds}s)` : ""}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-text-muted italic text-[11px]">No call activity yet</span>
                              )}
                            </td>

                            {/* 24-Hour Bookmark Status */}
                            <td className="px-5 py-4">
                              {isBookmarkActive ? (
                                <button
                                  type="button"
                                  onClick={() => setIsBookmarksDrawerOpen(true)}
                                  className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 px-2.5 py-1 text-[11px] font-bold shadow-2xs cursor-pointer transition"
                                  title="Click to view all bookmarks in right slider"
                                >
                                  <Bookmark size={12} className="fill-blue-600 text-blue-600 shrink-0" />
                                  Active 24h
                                </button>
                              ) : (
                                <span className="text-text-muted text-[11px]">—</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* View History Drawer Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentForHistory(item);
                                    setIsHistoryDrawerOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition cursor-pointer"
                                  title="View full call history"
                                >
                                  <History size={13} />
                                  History
                                </button>

                                {/* Add Disposition Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentForDisposition(item);
                                    setIsAddDispositionModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700 transition shadow-2xs cursor-pointer"
                                  title="Add new call disposition"
                                >
                                  <Plus size={13} />
                                  Add Disposition
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Server-Side Pagination Controls */}
                {logsTotalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border p-4 bg-surface">
                    <div className="text-xs text-text-muted">
                      Showing <span className="font-semibold text-text-primary">{Math.min((logsPage - 1) * 10 + 1, logsTotal)}</span> to{" "}
                      <span className="font-semibold text-text-primary">{Math.min(logsPage * 10, logsTotal)}</span> of{" "}
                      <span className="font-semibold text-text-primary">{logsTotal}</span> entries
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 self-center sm:self-auto flex-wrap justify-center">
                      <button
                        type="button"
                        disabled={logsPage <= 1 || logsLoading}
                        onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                        className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Previous page"
                      >
                        <ChevronLeft size={15} />
                      </button>

                      {getCompactPageNumbers(logsPage, logsTotalPages).map((page, idx) => {
                        if (page === "...") {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 text-xs text-text-muted font-bold select-none"
                            >
                              ...
                            </span>
                          );
                        }
                        const pageNum = page as number;
                        const isActive = logsPage === pageNum;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setLogsPage(pageNum)}
                            className={`flex h-7 min-w-[28px] sm:h-7.5 sm:min-w-[30px] px-1.5 items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isActive
                                ? "bg-primary-600 text-white shadow-xs"
                                : "border border-border text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        disabled={logsPage >= logsTotalPages || logsLoading}
                        onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                        className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Next page"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIVE DIALER QUEUE WORKSPACE */
        <div>
          {loading ? (
            <div className="flex items-center justify-center p-16 text-sm text-text-secondary">
              <RefreshCw className="animate-spin mr-2" size={20} />
              Loading your assigned student call queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-surface border border-border rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-text-muted">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">No assigned contacts found</h3>
              <p className="text-sm text-text-secondary mt-1 max-w-md">
                You do not currently have active student dataset assignments. Please request dataset assignments from your Manager.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Live Queue Header Bar with Data-Set Jump Dropdown & Uncompleted Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface p-3.5 rounded-xl border border-border gap-3">
                {/* Completed Session Count, Data-Set Select, & Uncompleted Filter Toggle */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-text-secondary">
                    <span>Completed in Session:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold">
                      {completedCount} / {queue.length}
                    </span>
                  </div>

                  {batches.length > 0 && (
                    <>
                      <div className="h-4 w-px bg-border hidden sm:block" />

                      {/* Jump to Data Set Selector */}
                      <div className="flex items-center gap-2">
                        <label htmlFor="dataset-jump-select" className="font-bold text-text-secondary whitespace-nowrap flex items-center gap-1">
                          <Layers size={14} className="text-primary-600" />
                          <span>Data Set:</span>
                        </label>
                        <select
                          id="dataset-jump-select"
                          value={selectedAssignmentId}
                          onChange={(e) => handleJumpToAssignmentBatch(e.target.value)}
                          className="h-8 rounded-lg border border-border bg-neutral-50 px-2.5 text-xs font-semibold text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition cursor-pointer max-w-[220px] sm:max-w-[300px] truncate"
                          title="Select an assignment batch to jump to its saved calling position"
                        >
                          {batches.map((batch) => {
                            const dateStr = batch.assignedAt
                              ? new Date(batch.assignedAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "";
                            return (
                              <option key={batch.assignmentId} value={batch.assignmentId}>
                                {batch.datasetName} — {batch.totalRecords} records ({batch.completedCount} completed)
                                {dateStr ? ` • ${dateStr}` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Working Queue Filter Toggle: All Records vs Uncompleted Only */}
                      <div className="inline-flex items-center rounded-lg border border-border bg-neutral-100/90 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleToggleFilterMode("all")}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                            filterMode === "all"
                              ? "bg-surface text-primary-700 shadow-xs border border-border/60"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                          title="Show all records in the selected Data Set"
                        >
                          All ({batchTotalRecords})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFilterMode("uncompleted")}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                            filterMode === "uncompleted"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                          title="Show only uncompleted records in the selected Data Set"
                        >
                          <span>Uncompleted Only</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                              filterMode === "uncompleted" ? "bg-amber-600 text-white" : "bg-neutral-200 text-text-secondary"
                            }`}
                          >
                            {batchUncompletedCount}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Queue Navigation & Position Counter */}
                <div className="flex items-center gap-3 text-xs self-end sm:self-auto">
                  {activeBatch && activeBatchQueue.length > 0 && (
                    <span className="text-text-muted text-[11px] hidden lg:inline font-medium">
                      {filterMode === "uncompleted" ? (
                        <>
                          Uncompleted Record <strong>{Math.max(0, batchRecordIndex) + 1}</strong> of{" "}
                          <strong>{batchUncompletedCount}</strong>
                        </>
                      ) : (
                        <>
                          Batch Record <strong>{batchRecordIndex + 1}</strong> of{" "}
                          <strong>{batchTotalRecords}</strong>
                        </>
                      )}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePreviousContact}
                      disabled={batchRecordIndex <= 0 || loading || activeBatchQueue.length === 0}
                      className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition disabled:opacity-40 cursor-pointer"
                      title="Previous contact in queue"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-mono font-bold text-text-primary px-2">
                      {activeBatchQueue.length === 0
                        ? "0 / 0"
                        : filterMode === "uncompleted"
                        ? `Uncompleted ${Math.max(1, batchRecordIndex + 1)} / ${activeBatchQueue.length}`
                        : `Contact ${batchRecordIndex + 1} of ${activeBatchQueue.length}`}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextContact}
                      disabled={batchRecordIndex >= activeBatchQueue.length - 1 || loading || activeBatchQueue.length === 0}
                      className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition disabled:opacity-40 cursor-pointer"
                      title="Next contact in queue"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Area: Active Student Workspace or Batch Completion Card */}
              {activeBatchQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-emerald-200 rounded-2xl bg-emerald-50/30 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <PhoneCall size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900">
                    {filterMode === "uncompleted"
                      ? `No Uncompleted Records in "${activeBatch?.datasetName || "Data Set"}"`
                      : `Data Set "${activeBatch?.datasetName || ""}" Completed!`}
                  </h3>
                  <p className="text-xs text-emerald-700 max-w-md">
                    {filterMode === "uncompleted"
                      ? "All records in this dataset have been dispositioned. Switch to 'All' or select another Data Set from the dropdown above."
                      : "You have processed all assigned student dataset contacts for this dataset."}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    {filterMode === "uncompleted" && (
                      <button
                        type="button"
                        onClick={() => handleToggleFilterMode("all")}
                        className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition cursor-pointer"
                      >
                        Show All ({batchTotalRecords}) Records
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={loadQueue}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-300 bg-surface text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      Refresh Queue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Student Details + Outcome Panel */}
                  <div className="lg:col-span-7 space-y-6">
                    <StudentDetailsCard
                      student={currentStudent}
                      totalAssigned={activeBatchQueue.length}
                      currentIndex={batchRecordIndex}
                      phonePosition={phonePosition}
                      onOpenHistory={() => {
                        setSelectedStudentForHistory(currentStudent);
                        setIsHistoryDrawerOpen(true);
                      }}
                    />

                    <CallOutcomePanel
                      student={currentStudent}
                      callSession={callSession}
                      onOutcomeComplete={handleOutcomeComplete}
                    />
                  </div>

                  {/* Right Column: Mock Dialer Console */}
                  <div className="lg:col-span-5">
                    <MockCallPanel
                      student={currentStudent}
                      callSession={callSession}
                      onInitiateCall={handleInitiateCall}
                      onEndCall={handleEndCall}
                      loading={actionLoading}
                      phonePosition={phonePosition}
                      onPhonePositionChange={handlePhonePositionChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Call History Slide-in Drawer */}
      <CallHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        student={selectedStudentForHistory}
        refreshKey={historyRefreshKey}
      />

      {/* Bookmarks Right-Side Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksDrawerOpen}
        onClose={() => setIsBookmarksDrawerOpen(false)}
        onOpenDialer={(studentDataId) => handleOpenStudentInDialer(studentDataId)}
        onOpenDisposition={(student) => {
          setSelectedStudentForDisposition(student);
          setIsAddDispositionModalOpen(true);
        }}
        onOpenHistory={(student) => {
          setSelectedStudentForHistory(student);
          setIsHistoryDrawerOpen(true);
        }}
        refreshKey={historyRefreshKey}
      />

      {/* Add Disposition Modal */}
      {isAddDispositionModalOpen && selectedStudentForDisposition && (
        <AddDispositionModal
          student={selectedStudentForDisposition}
          onClose={() => {
            setIsAddDispositionModalOpen(false);
            setSelectedStudentForDisposition(null);
          }}
          onSuccess={() => {
            setIsAddDispositionModalOpen(false);
            setSelectedStudentForDisposition(null);
            setHistoryRefreshKey((prev) => prev + 1);
            loadLogs();
          }}
        />
      )}
    </div>
  );
};

export default CallWorkspace;
