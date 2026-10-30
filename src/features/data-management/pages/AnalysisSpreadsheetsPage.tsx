import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  X,
  UserPlus,
  UserCheck,
  History,
  Phone,
  Mail,
  User,
  Clock,
  PhoneCall,
  CheckSquare,
  Square,
  FileSpreadsheet,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchFilteredStudentData,
  fetchEligibleProgramAdvisors,
  createDataAssignment,
  type StudentDataRecord,
  type EligibleProgramAdvisor,
  type FilterStudentDataParams,
} from "../../../services/dataManagementService";
import AssignmentReviewModal from "../components/AssignmentReviewModal";
import PaginationControls from "../components/PaginationControls";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const DISPOSITION_OPTIONS: { label: string; value: string }[] = [
  { label: "Call Disposition: All", value: "ALL" },
  { label: "No Call Yet", value: "NO_CALL_YET" },
  { label: "No Answer", value: "NO_ANSWER" },
  { label: "Follow Up", value: "FOLLOW_UP" },
  { label: "Interested", value: "INTERESTED" },
  { label: "Not Interested", value: "NOT_INTERESTED" },
  { label: "Call Back Later", value: "CALL_BACK_LATER" },
  { label: "Wrong Number", value: "WRONG_NUMBER" },
  { label: "Disconnected", value: "DISCONNECTED" },
  { label: "Other", value: "OTHER" },
];

// Helper for formatting date-time
function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " •");
}

function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const OUTCOME_LABEL_MAP: Record<string, string> = {
  NO_ANSWER: "No Answer",
  WRONG_NUMBER: "Wrong Number",
  NOT_INTERESTED: "Not Interested",
  FOLLOW_UP: "Follow Up",
  CALL_BACK_LATER: "Call Back Later",
  INTERESTED: "Interested",
  DISCONNECTED: "Disconnected",
  DROP: "Drop",
  OTHER: "Other",
};

const OUTCOME_STYLE_MAP: Record<string, { bg: string; text: string; border: string }> = {
  NO_ANSWER: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  WRONG_NUMBER: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  NOT_INTERESTED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  FOLLOW_UP: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  CALL_BACK_LATER: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  INTERESTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  DISCONNECTED: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  DROP: { bg: "bg-neutral-500/10", text: "text-neutral-400", border: "border-neutral-500/20" },
  OTHER: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
};

const AnalysisSpreadsheetsPage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const paramStatus = searchParams.get("status");

  // Server data state
  const [allStudents, setAllStudents] = useState<StudentDataRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    states: string[];
    cities: string[];
    cityOptionsWithState?: { city: string; state: string | null }[];
    uploads: { id: string; fileName: string }[];
  }>({ states: [], cities: [], uploads: [] });
  const [eligibleAdvisors, setEligibleAdvisors] = useState<EligibleProgramAdvisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state (10 records per page as standard spreadsheet table)
  const pageSize = 10;
  const [page, setPage] = useState<number>(1);

  // Search input state
  const [searchTerm, setSearchTerm] = useState("");

  // 1. State filter (default: All States)
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  // 2. City filter (default: All Cities)
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // 3. Dataset filter (default: All Datasets)
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);

  // 4. Status filter (default: Available (Unassigned))
  const [assignmentStatus, setAssignmentStatus] = useState<"AVAILABLE" | "ASSIGNED" | "ALL">(
    paramStatus === "ASSIGNED" || paramStatus === "ACTIVE"
      ? "ASSIGNED"
      : paramStatus === "EXPIRED"
      ? "ALL"
      : "AVAILABLE"
  );

  // 5. Disposition filter (default: All)
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>([]);
  const [isDispositionDropdownOpen, setIsDispositionDropdownOpen] = useState(false);

  // 6. Not Called By filter (default: All)
  const [selectedNotCalledByUserIds, setSelectedNotCalledByUserIds] = useState<string[]>([]);
  const [isNotCalledByDropdownOpen, setIsNotCalledByDropdownOpen] = useState(false);
  const [callerSearchTerm, setCallerSearchTerm] = useState<string>("");

  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Assignment Review Modal (reusing exact Data Assignment drawer)
  const [isAssignmentDrawerOpen, setIsAssignmentDrawerOpen] = useState(false);
  const [assignmentDrawerError, setAssignmentDrawerError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Complete Remark History Drawer
  const [drawerStudent, setDrawerStudent] = useState<StudentDataRecord | null>(null);
  const [drawerAdvisorId, setDrawerAdvisorId] = useState<string>("");
  const [isDrawerReassigning, setIsDrawerReassigning] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".filter-dropdown-container")) {
        setIsStateDropdownOpen(false);
        setIsCityDropdownOpen(false);
        setIsUploadDropdownOpen(false);
        setIsDispositionDropdownOpen(false);
        setIsNotCalledByDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch eligible advisors once
  useEffect(() => {
    if (accessToken) {
      fetchEligibleProgramAdvisors(accessToken)
        .then((res) => setEligibleAdvisors(res))
        .catch(console.error);
    }
  }, [accessToken]);

  // Load filtered student data
  const loadFilteredData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const filterParams: FilterStudentDataParams = {
        states: selectedStates.length > 0 ? selectedStates : undefined,
        cities: selectedCities.length > 0 ? selectedCities : undefined,
        uploadIds: selectedUploadIds.length > 0 ? selectedUploadIds : undefined,
        assignmentStatus,
        search: searchTerm.trim() || undefined,
        dispositions: selectedDispositions.length > 0 ? selectedDispositions : undefined,
        notCalledByUserIds: selectedNotCalledByUserIds.length > 0 ? selectedNotCalledByUserIds : undefined,
        page: 1,
        limit: 5000,
      };

      const filteredRes = await fetchFilteredStudentData(accessToken, filterParams);
      setAllStudents(filteredRes.data || []);
      setFilterOptions(filteredRes.filterOptions || { states: [], cities: [], uploads: [] });
    } catch (err: any) {
      console.error("Failed to load spreadsheet records:", err);
      const errMsg = err.message || "Failed to load spreadsheet records";
      setError(errMsg);
      toast.showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    selectedStates,
    selectedCities,
    selectedUploadIds,
    assignmentStatus,
    selectedDispositions,
    selectedNotCalledByUserIds,
    searchTerm,
    toast,
  ]);

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]);

  // Keep drawer student updated if data refreshes
  useEffect(() => {
    if (drawerStudent) {
      const updated = allStudents.find((s) => s.id === drawerStudent.id);
      if (updated) {
        setDrawerStudent(updated);
      }
    }
  }, [allStudents, drawerStudent]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(allStudents.length / pageSize));
  const displayedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allStudents.slice(start, start + pageSize);
  }, [allStudents, page, pageSize]);

  // State-constrained city options
  const availableCityOptions = useMemo(() => {
    if (selectedStates.length === 0) {
      return filterOptions.cities;
    }
    if (filterOptions.cityOptionsWithState && filterOptions.cityOptionsWithState.length > 0) {
      const selectedStatesSet = new Set(selectedStates);
      const filtered = filterOptions.cityOptionsWithState
        .filter((item) => item.state && selectedStatesSet.has(item.state))
        .map((item) => item.city);
      return Array.from(new Set(filtered));
    }
    return filterOptions.cities;
  }, [selectedStates, filterOptions.cities, filterOptions.cityOptionsWithState]);

  // Filter handlers
  const handleStateToggle = (st: string) => {
    setSelectedStates((prev) => {
      const next = prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st];
      return next;
    });
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleCityToggle = (ct: string) => {
    setSelectedCities((prev) =>
      prev.includes(ct) ? prev.filter((c) => c !== ct) : [...prev, ct]
    );
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleUploadToggle = (upId: string) => {
    setSelectedUploadIds((prev) =>
      prev.includes(upId) ? prev.filter((id) => id !== upId) : [...prev, upId]
    );
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleStatusChange = (status: "AVAILABLE" | "ASSIGNED" | "ALL") => {
    setAssignmentStatus(status);
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleDispositionToggle = (dispValue: string) => {
    setSelectedDispositions((prev) =>
      prev.includes(dispValue) ? prev.filter((d) => d !== dispValue) : [...prev, dispValue]
    );
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleSelectAllDispositions = () => {
    setSelectedDispositions([]);
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleNotCalledByUserToggle = (userId: string) => {
    setSelectedNotCalledByUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const handleSelectAllNotCalledBy = () => {
    setSelectedNotCalledByUserIds([]);
    setPage(1);
    setSelectedStudentIds(new Set());
  };

  const filteredEligibleAdvisors = useMemo(() => {
    if (!callerSearchTerm.trim()) return eligibleAdvisors;
    const term = callerSearchTerm.toLowerCase().trim();
    return eligibleAdvisors.filter((adv) => {
      const fullName = `${adv.firstName} ${adv.lastName || ""}`.toLowerCase();
      const email = (adv.email || "").toLowerCase();
      const username = (adv.username || "").toLowerCase();
      return fullName.includes(term) || email.includes(term) || username.includes(term);
    });
  }, [eligibleAdvisors, callerSearchTerm]);

  // Selection handlers
  const handleSelectAllCurrentPage = () => {
    if (
      displayedStudents.length > 0 &&
      displayedStudents.every((s) => selectedStudentIds.has(s.id))
    ) {
      // Unselect all on current page
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        displayedStudents.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        displayedStudents.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const isAllCurrentPageSelected = useMemo(() => {
    return (
      displayedStudents.length > 0 &&
      displayedStudents.every((s) => selectedStudentIds.has(s.id))
    );
  }, [displayedStudents, selectedStudentIds]);

  const isSomeCurrentPageSelected = useMemo(() => {
    return (
      displayedStudents.some((s) => selectedStudentIds.has(s.id)) &&
      !displayedStudents.every((s) => selectedStudentIds.has(s.id))
    );
  }, [displayedStudents, selectedStudentIds]);

  // Compute geographic distribution of selected records
  const selectedDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    const selectedSet = selectedStudentIds;
    allStudents.forEach((s) => {
      if (selectedSet.has(s.id)) {
        const stateKey = s.state || "Unspecified";
        dist[stateKey] = (dist[stateKey] || 0) + 1;
      }
    });
    return dist;
  }, [allStudents, selectedStudentIds]);

  // Bulk Reassignment execution via shared AssignmentReviewModal
  const handleConfirmAssignmentFromDrawer = async ({
    assignedToId,
  }: {
    assignedToId: string;
  }) => {
    if (!accessToken || !assignedToId || selectedStudentIds.size === 0) return;
    setIsAssigning(true);
    setAssignmentDrawerError(null);
    try {
      const studentIdList = Array.from(selectedStudentIds);
      const activeFiltersPayload: FilterStudentDataParams = {
        states: selectedStates.length > 0 ? selectedStates : undefined,
        cities: selectedCities.length > 0 ? selectedCities : undefined,
        uploadIds: selectedUploadIds.length > 0 ? selectedUploadIds : undefined,
        assignmentStatus,
        search: searchTerm.trim() || undefined,
        dispositions: selectedDispositions.length > 0 ? selectedDispositions : undefined,
        notCalledByUserIds: selectedNotCalledByUserIds.length > 0 ? selectedNotCalledByUserIds : undefined,
      };

      const res = await createDataAssignment(accessToken, {
        assignedToId,
        selectionMode: "EXPLICIT",
        studentDataIds: studentIdList,
        filters: activeFiltersPayload,
      });

      toast.showToast(res.message || `Successfully assigned ${studentIdList.length} records!`, "success");
      setIsAssignmentDrawerOpen(false);
      setSelectedStudentIds(new Set());
      await loadFilteredData();
    } catch (err: any) {
      const msg = err.message || "Failed to execute data assignment";
      setAssignmentDrawerError(msg);
      toast.showToast(msg, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  // Single-record assignment from secondary drawer
  const executeDrawerReallocation = async () => {
    if (!accessToken || !drawerAdvisorId || !drawerStudent) return;
    setIsDrawerReassigning(true);
    try {
      const res = await createDataAssignment(accessToken, {
        assignedToId: drawerAdvisorId,
        selectionMode: "EXPLICIT",
        studentDataIds: [drawerStudent.id],
      });
      toast.showToast(res.message || "Record successfully assigned!", "success");
      setDrawerAdvisorId("");
      await loadFilteredData();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to assign record", "error");
    } finally {
      setIsDrawerReassigning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                Analysis Spreadsheets
              </h1>
              <p className="mt-0.5 text-xs text-text-secondary">
                Spreadsheet-style student data viewing, sequential remark history, and multi-filter bulk assignment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadFilteredData()}
            title="Refresh spreadsheet data"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs text-xs font-semibold"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Control Panel */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs filter-dropdown-container">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search student by name, contact number, email, city, state..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-text-primary outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40"
          />
        </div>

        {/* 6 Filter Dropdowns in Data Assignment Workspace Order */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* 1. State Multi-Select Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsStateDropdownOpen(!isStateDropdownOpen);
                setIsCityDropdownOpen(false);
                setIsUploadDropdownOpen(false);
                setIsDispositionDropdownOpen(false);
                setIsNotCalledByDropdownOpen(false);
              }}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface flex items-center justify-between text-xs font-semibold text-text-primary shadow-2xs hover:border-primary-300 transition"
            >
              <span className="truncate">
                State: {selectedStates.length > 0 ? `${selectedStates.length} selected` : "All States"}
              </span>
              <ChevronDown size={16} className="text-text-muted shrink-0" />
            </button>

            {isStateDropdownOpen && (
              <div className="absolute left-0 top-12 z-40 w-64 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl space-y-1">
                {filterOptions.states.length === 0 ? (
                  <p className="p-2 text-xs text-text-muted">No state options available</p>
                ) : (
                  filterOptions.states.map((st) => (
                    <label
                      key={st}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs text-text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(st)}
                        onChange={() => handleStateToggle(st)}
                        className="rounded border-border text-primary-600 focus:ring-primary-400"
                      />
                      <span>{st}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 2. City Multi-Select Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsCityDropdownOpen(!isCityDropdownOpen);
                setIsStateDropdownOpen(false);
                setIsUploadDropdownOpen(false);
                setIsDispositionDropdownOpen(false);
                setIsNotCalledByDropdownOpen(false);
              }}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface flex items-center justify-between text-xs font-semibold text-text-primary shadow-2xs hover:border-primary-300 transition"
            >
              <span className="truncate">
                City: {selectedCities.length > 0 ? `${selectedCities.length} selected` : "All Cities"}
              </span>
              <ChevronDown size={16} className="text-text-muted shrink-0" />
            </button>

            {isCityDropdownOpen && (
              <div className="absolute left-0 top-12 z-40 w-64 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl space-y-1">
                {availableCityOptions.length === 0 ? (
                  <p className="p-2 text-xs text-text-muted">No city options available</p>
                ) : (
                  availableCityOptions.map((ct) => (
                    <label
                      key={ct}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs text-text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(ct)}
                        onChange={() => handleCityToggle(ct)}
                        className="rounded border-border text-primary-600 focus:ring-primary-400"
                      />
                      <span>{ct}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 3. Dataset Multi-Select Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUploadDropdownOpen(!isUploadDropdownOpen);
                setIsStateDropdownOpen(false);
                setIsCityDropdownOpen(false);
                setIsDispositionDropdownOpen(false);
                setIsNotCalledByDropdownOpen(false);
              }}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface flex items-center justify-between text-xs font-semibold text-text-primary shadow-2xs hover:border-primary-300 transition"
            >
              <span className="truncate">
                Dataset: {selectedUploadIds.length > 0 ? `${selectedUploadIds.length} selected` : "All Datasets"}
              </span>
              <ChevronDown size={16} className="text-text-muted shrink-0" />
            </button>

            {isUploadDropdownOpen && (
              <div className="absolute left-0 top-12 z-40 w-64 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl space-y-1">
                {filterOptions.uploads.length === 0 ? (
                  <p className="p-2 text-xs text-text-muted">No dataset files available</p>
                ) : (
                  filterOptions.uploads.map((up) => (
                    <label
                      key={up.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs text-text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUploadIds.includes(up.id)}
                        onChange={() => handleUploadToggle(up.id)}
                        className="rounded border-border text-primary-600 focus:ring-primary-400"
                      />
                      <span className="truncate">{up.fileName}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 4. Assignment Status Select */}
          <div>
            <select
              value={assignmentStatus}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary shadow-2xs outline-none transition focus:border-primary-500"
            >
              <option value="AVAILABLE">Status: Available (Unassigned)</option>
              <option value="ASSIGNED">Status: Assigned</option>
              <option value="ALL">Status: All Records</option>
            </select>
          </div>

          {/* 5. Call Disposition Multi-Select Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDispositionDropdownOpen(!isDispositionDropdownOpen);
                setIsStateDropdownOpen(false);
                setIsCityDropdownOpen(false);
                setIsUploadDropdownOpen(false);
                setIsNotCalledByDropdownOpen(false);
              }}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface flex items-center justify-between text-xs font-semibold text-text-primary shadow-2xs hover:border-primary-300 transition"
            >
              <span className="truncate">
                Disposition: {selectedDispositions.length > 0 ? `${selectedDispositions.length} selected` : "All"}
              </span>
              <ChevronDown size={16} className="text-text-muted shrink-0" />
            </button>

            {isDispositionDropdownOpen && (
              <div className="absolute right-0 sm:right-auto left-0 top-12 z-40 w-64 max-h-72 flex flex-col rounded-xl border border-border bg-surface p-2 shadow-xl space-y-1">
                {/* All Option */}
                <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs font-medium text-text-primary">
                  <input
                    type="checkbox"
                    checked={selectedDispositions.length === 0}
                    onChange={handleSelectAllDispositions}
                    className="rounded border-border text-primary-600 focus:ring-primary-400"
                  />
                  <span>Call Disposition: All</span>
                </label>

                <div className="h-px bg-border my-1" />

                <div className="overflow-y-auto space-y-1 max-h-52 pr-1">
                  {DISPOSITION_OPTIONS.filter((opt) => opt.value !== "ALL").map((opt) => {
                    const isChecked = selectedDispositions.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs text-text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDispositionToggle(opt.value)}
                          className="rounded border-border text-primary-600 focus:ring-primary-400"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-border flex items-center justify-between text-xs text-text-muted px-1 shrink-0">
                  <span>{selectedDispositions.length > 0 ? `${selectedDispositions.length} selected` : "All"}</span>
                  {selectedDispositions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllDispositions}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 6. Not Called By Multi-Select Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotCalledByDropdownOpen(!isNotCalledByDropdownOpen);
                setIsStateDropdownOpen(false);
                setIsCityDropdownOpen(false);
                setIsUploadDropdownOpen(false);
                setIsDispositionDropdownOpen(false);
              }}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface flex items-center justify-between text-xs font-semibold text-text-primary shadow-2xs hover:border-primary-300 transition"
            >
              <span className="truncate">
                Not Called By: {selectedNotCalledByUserIds.length > 0 ? `${selectedNotCalledByUserIds.length} selected` : "All"}
              </span>
              <ChevronDown size={16} className="text-text-muted shrink-0" />
            </button>

            {isNotCalledByDropdownOpen && (
              <div className="absolute right-0 sm:right-auto left-0 top-12 z-40 w-72 max-h-72 flex flex-col rounded-xl border border-border bg-surface p-2 shadow-xl">
                {/* Search Bar inside Caller Dropdown */}
                <div className="relative mb-2 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search callers..."
                    value={callerSearchTerm}
                    onChange={(e) => setCallerSearchTerm(e.target.value)}
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-neutral-50 dark:bg-neutral-900 text-xs text-text-primary outline-none focus:border-primary-500"
                  />
                </div>

                <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                  {/* All Option */}
                  <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs font-medium text-text-primary">
                    <input
                      type="checkbox"
                      checked={selectedNotCalledByUserIds.length === 0}
                      onChange={handleSelectAllNotCalledBy}
                      className="rounded border-border text-primary-600 focus:ring-primary-400"
                    />
                    <span>All Callers (No Exclusion)</span>
                  </label>

                  <div className="h-px bg-border my-1" />

                  {/* List of Callers */}
                  {filteredEligibleAdvisors.length === 0 ? (
                    <p className="p-2 text-xs text-text-muted text-center">No callers found</p>
                  ) : (
                    filteredEligibleAdvisors.map((advisor) => {
                      const fullName = `${advisor.firstName} ${advisor.lastName || ""}`.trim();
                      const isChecked = selectedNotCalledByUserIds.includes(advisor.id);
                      return (
                        <label
                          key={advisor.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs text-text-primary"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleNotCalledByUserToggle(advisor.id)}
                            className="rounded border-border text-primary-600 focus:ring-primary-400"
                          />
                          <span className="truncate">{fullName}</span>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 mt-1 border-t border-border flex items-center justify-between text-xs text-text-muted px-1 shrink-0">
                  <span>
                    {selectedNotCalledByUserIds.length > 0 ? `${selectedNotCalledByUserIds.length} selected` : "All"}
                  </span>
                  {selectedNotCalledByUserIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllNotCalledBy}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Removable Active Filter Chips */}
        {(selectedStates.length > 0 ||
          selectedCities.length > 0 ||
          selectedUploadIds.length > 0 ||
          assignmentStatus !== "AVAILABLE" ||
          selectedDispositions.length > 0 ||
          selectedNotCalledByUserIds.length > 0 ||
          searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-text-secondary uppercase flex items-center gap-1">
              <Filter size={12} /> Active Filters:
            </span>

            {selectedStates.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-50 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800 px-2.5 py-0.5 text-xs font-semibold"
              >
                State: {st}
                <button
                  type="button"
                  onClick={() => handleStateToggle(st)}
                  className="hover:text-primary-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {selectedCities.map((ct) => (
              <span
                key={ct}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary-50 text-secondary-800 dark:bg-neutral-800 dark:text-neutral-200 border border-secondary-200 dark:border-neutral-700 px-2.5 py-0.5 text-xs font-semibold"
              >
                City: {ct}
                <button
                  type="button"
                  onClick={() => handleCityToggle(ct)}
                  className="hover:text-secondary-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {selectedUploadIds.map((id) => {
              const up = filterOptions.uploads.find((u) => u.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 text-xs font-semibold"
                >
                  Dataset: {up ? up.fileName : id.slice(0, 8)}
                  <button
                    type="button"
                    onClick={() => handleUploadToggle(id)}
                    className="hover:text-purple-900 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

            {assignmentStatus !== "AVAILABLE" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 text-text-primary dark:bg-neutral-800 border border-border px-2.5 py-0.5 text-xs font-semibold">
                Status: {assignmentStatus === "ASSIGNED" ? "Assigned" : "All Records"}
                <button
                  type="button"
                  onClick={() => handleStatusChange("AVAILABLE")}
                  className="hover:text-text-primary cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedDispositions.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold">
                Disposition: {
                  selectedDispositions.length === 1
                    ? DISPOSITION_OPTIONS.find((o) => o.value === selectedDispositions[0])?.label || selectedDispositions[0]
                    : `${selectedDispositions.length} selected`
                }
                <button
                  type="button"
                  onClick={handleSelectAllDispositions}
                  className="hover:text-emerald-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedNotCalledByUserIds.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-semibold">
                Not Called By: {
                  selectedNotCalledByUserIds.length === 1
                    ? (() => {
                        const adv = eligibleAdvisors.find((a) => a.id === selectedNotCalledByUserIds[0]);
                        return adv ? `${adv.firstName} ${adv.lastName || ""}`.trim() : "1 caller";
                      })()
                    : `${selectedNotCalledByUserIds.length} callers`
                }
                <button
                  type="button"
                  onClick={handleSelectAllNotCalledBy}
                  className="hover:text-amber-950 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Clear All Filters Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedStates([]);
                setSelectedCities([]);
                setSelectedUploadIds([]);
                setAssignmentStatus("AVAILABLE");
                setSelectedDispositions([]);
                setSelectedNotCalledByUserIds([]);
                setCallerSearchTerm("");
                setSearchTerm("");
                setPage(1);
                setSelectedStudentIds(new Set());
              }}
              className="text-xs text-text-muted hover:text-rose-500 font-semibold underline underline-offset-2 ml-auto cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Selection & Bulk Assignment Bar */}
        {selectedStudentIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/25 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white font-bold text-xs">
                {selectedStudentIds.size}
              </span>
              <div className="text-xs font-semibold text-text-primary">
                {selectedStudentIds.size} {selectedStudentIds.size === 1 ? "record" : "records"} selected
              </div>
              <button
                onClick={() => setSelectedStudentIds(new Set())}
                className="text-[11px] font-semibold text-text-muted hover:text-rose-500 transition underline underline-offset-2 ml-1 cursor-pointer"
              >
                Clear selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAssignmentDrawerError(null);
                  setIsAssignmentDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <UserCheck size={14} />
                Assign Selected Data ({selectedStudentIds.size})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Excel-like Spreadsheet Data Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col">
        {/* Horizontal scroll container with sticky column header */}
        <div className="overflow-x-auto max-w-full max-h-[70vh] relative border-b border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-neutral-100/90 dark:bg-slate-900/95 backdrop-blur-md z-20 border-b border-border shadow-2xs text-text-secondary select-none font-semibold">
              <tr>
                {/* 0. Selection Checkbox */}
                <th className="sticky left-0 bg-neutral-100/90 dark:bg-slate-900/95 z-30 px-3 py-3 w-10 text-center border-r border-border/60">
                  <button
                    type="button"
                    onClick={handleSelectAllCurrentPage}
                    className="flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
                    title={isAllCurrentPageSelected ? "Unselect all" : "Select all on page"}
                  >
                    {isAllCurrentPageSelected ? (
                      <CheckSquare size={16} className="text-primary-600" />
                    ) : isSomeCurrentPageSelected ? (
                      <div className="w-4 h-4 rounded border border-primary-600 bg-primary-100 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-primary-600" />
                      </div>
                    ) : (
                      <Square size={16} className="text-text-muted" />
                    )}
                  </button>
                </th>

                {/* 1. Student Name */}
                <th className="px-4 py-3 min-w-[180px] border-r border-border/60">
                  Student Name
                </th>

                {/* 2. Contact Number */}
                <th className="px-4 py-3 min-w-[130px] border-r border-border/60">
                  Contact Number
                </th>

                {/* 3. Email */}
                <th className="px-4 py-3 min-w-[180px] border-r border-border/60">
                  Email
                </th>

                {/* 4. Remark 1 */}
                <th className="px-4 py-3 min-w-[220px] border-r border-border/60 bg-primary-500/5">
                  Remark 1
                </th>
                {/* 5. Remark 1 Added By */}
                <th className="px-4 py-3 min-w-[140px] border-r border-border/60 bg-primary-500/5">
                  Remark 1 Added By
                </th>
                {/* 6. Remark 1 Date */}
                <th className="px-4 py-3 min-w-[130px] border-r border-border/60 bg-primary-500/5">
                  Remark 1 Date
                </th>

                {/* 7. Remark 2 */}
                <th className="px-4 py-3 min-w-[220px] border-r border-border/60 bg-indigo-500/5">
                  Remark 2
                </th>
                {/* 8. Remark 2 Added By */}
                <th className="px-4 py-3 min-w-[140px] border-r border-border/60 bg-indigo-500/5">
                  Remark 2 Added By
                </th>
                {/* 9. Remark 2 Date */}
                <th className="px-4 py-3 min-w-[130px] border-r border-border/60 bg-indigo-500/5">
                  Remark 2 Date
                </th>

                {/* 10. Remark 3 */}
                <th className="px-4 py-3 min-w-[220px] border-r border-border/60 bg-blue-500/5">
                  Remark 3
                </th>
                {/* 11. Remark 3 Added By */}
                <th className="px-4 py-3 min-w-[140px] border-r border-border/60 bg-blue-500/5">
                  Remark 3 Added By
                </th>
                {/* 12. Remark 3 Date */}
                <th className="px-4 py-3 min-w-[130px] border-r border-border/60 bg-blue-500/5">
                  Remark 3 Date
                </th>

                {/* 13. Total Remarks */}
                <th className="px-4 py-3 min-w-[130px] border-r border-border/60 text-center">
                  Total Remarks
                </th>

                {/* 14. Current Assigned Employee */}
                <th className="px-4 py-3 min-w-[160px] border-r border-border/60">
                  Current Assigned Employee
                </th>

                {/* 15. Assignment Status */}
                <th className="px-4 py-3 min-w-[140px] border-r border-border/60 text-center">
                  Assignment Status
                </th>

                {/* Actions */}
                <th className="px-4 py-3 min-w-[150px] text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border font-normal">
              {loading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={17}
                  message="Loading spreadsheet records..."
                />
              ) : error ? (
                <PageErrorState
                  isTableRow
                  colSpan={17}
                  title="Failed to load records"
                  message={error}
                  onRetry={loadFilteredData}
                />
              ) : displayedStudents.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={17}
                  title="No records found matching filters."
                  message="Try adjusting your search query or filter options."
                />
              ) : (
                displayedStudents.map((student) => {
                  const isSelected = selectedStudentIds.has(student.id);
                  const sortedRemarks = (student.callRecords || []).slice(); // chronological order
                  const r1 = sortedRemarks[0];
                  const r2 = sortedRemarks[1];
                  const r3 = sortedRemarks[2];
                  const additionalCount = Math.max(0, sortedRemarks.length - 3);

                  const assignedAdvisorName = student.activeAssignment?.assignedTo
                    ? `${student.activeAssignment.assignedTo.firstName} ${student.activeAssignment.assignedTo.lastName || ""}`.trim()
                    : null;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-primary-500/5 dark:bg-primary-500/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="sticky left-0 bg-surface z-10 px-3 py-3 w-10 text-center border-r border-border/60">
                        <button
                          type="button"
                          onClick={() => handleToggleStudent(student.id)}
                          className="flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-primary-600" />
                          ) : (
                            <Square size={16} className="text-text-muted" />
                          )}
                        </button>
                      </td>

                      {/* Student Name */}
                      <td className="px-4 py-3 border-r border-border/60">
                        <div className="font-semibold text-text-primary">
                          {student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName || ""}
                        </div>
                        {(student.city || student.state) && (
                          <div className="mt-0.5 text-[11px] text-text-muted">
                            {[student.city, student.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </td>

                      {/* Contact Number */}
                      <td className="px-4 py-3 font-medium text-text-secondary border-r border-border/60">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone size={12} className="text-text-muted shrink-0" />
                          <span>{student.phone || "—"}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-text-secondary border-r border-border/60">
                        <div className="flex items-center gap-1.5 max-w-[180px] truncate" title={student.email || ""}>
                          <Mail size={12} className="text-text-muted shrink-0" />
                          <span className="truncate">{student.email || "—"}</span>
                        </div>
                      </td>

                      {/* Remark 1 Text */}
                      <td className="px-4 py-3 border-r border-border/60 max-w-[220px] bg-primary-500/[0.02]">
                        {r1 ? (
                          <div className="space-y-1">
                            {r1.outcome && (
                              <span
                                className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  OUTCOME_STYLE_MAP[r1.outcome]?.bg || "bg-neutral-100"
                                } ${OUTCOME_STYLE_MAP[r1.outcome]?.text || "text-neutral-700"} ${
                                  OUTCOME_STYLE_MAP[r1.outcome]?.border || "border-neutral-200"
                                }`}
                              >
                                {OUTCOME_LABEL_MAP[r1.outcome] || r1.outcome}
                              </span>
                            )}
                            <p
                              className="text-xs text-text-primary line-clamp-2 leading-relaxed"
                              title={r1.notes || ""}
                            >
                              {r1.notes ? `"${r1.notes}"` : <span className="text-text-muted italic">No text recorded</span>}
                            </p>
                          </div>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 1 Added By */}
                      <td className="px-4 py-3 border-r border-border/60 text-text-secondary bg-primary-500/[0.02]">
                        {r1 ? (
                          <span className="font-medium text-text-primary text-xs">
                            {r1.createdBy ? `${r1.createdBy.firstName} ${r1.createdBy.lastName || ""}`.trim() : "System"}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 1 Date */}
                      <td className="px-4 py-3 border-r border-border/60 text-text-secondary bg-primary-500/[0.02]">
                        {r1 ? (
                          <div className="text-[11px]" title={formatDateTime(r1.createdAt)}>
                            {formatDateShort(r1.createdAt)}
                          </div>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 2 Text */}
                      <td className="px-4 py-3 border-r border-border/60 max-w-[220px] bg-indigo-500/[0.02]">
                        {r2 ? (
                          <div className="space-y-1">
                            {r2.outcome && (
                              <span
                                className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  OUTCOME_STYLE_MAP[r2.outcome]?.bg || "bg-neutral-100"
                                } ${OUTCOME_STYLE_MAP[r2.outcome]?.text || "text-neutral-700"} ${
                                  OUTCOME_STYLE_MAP[r2.outcome]?.border || "border-neutral-200"
                                }`}
                              >
                                {OUTCOME_LABEL_MAP[r2.outcome] || r2.outcome}
                              </span>
                            )}
                            <p
                              className="text-xs text-text-primary line-clamp-2 leading-relaxed"
                              title={r2.notes || ""}
                            >
                              {r2.notes ? `"${r2.notes}"` : <span className="text-text-muted italic">No text recorded</span>}
                            </p>
                          </div>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 2 Added By */}
                      <td className="px-4 py-3 border-r border-border/60 text-text-secondary bg-indigo-500/[0.02]">
                        {r2 ? (
                          <span className="font-medium text-text-primary text-xs">
                            {r2.createdBy ? `${r2.createdBy.firstName} ${r2.createdBy.lastName || ""}`.trim() : "System"}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 2 Date */}
                      <td className="px-4 py-3 border-r border-border/60 text-text-secondary bg-indigo-500/[0.02]">
                        {r2 ? (
                          <div className="text-[11px]" title={formatDateTime(r2.createdAt)}>
                            {formatDateShort(r2.createdAt)}
                          </div>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 3 Text */}
                      <td className="px-4 py-3 border-r border-border/60 max-w-[220px] bg-blue-500/[0.02]">
                        {r3 ? (
                          <div className="space-y-1">
                            {r3.outcome && (
                              <span
                                className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  OUTCOME_STYLE_MAP[r3.outcome]?.bg || "bg-neutral-100"
                                } ${OUTCOME_STYLE_MAP[r3.outcome]?.text || "text-neutral-700"} ${
                                  OUTCOME_STYLE_MAP[r3.outcome]?.border || "border-neutral-200"
                                }`}
                              >
                                {OUTCOME_LABEL_MAP[r3.outcome] || r3.outcome}
                              </span>
                            )}
                            <p
                              className="text-xs text-text-primary line-clamp-2 leading-relaxed"
                              title={r3.notes || ""}
                            >
                              {r3.notes ? `"${r3.notes}"` : <span className="text-text-muted italic">No text recorded</span>}
                            </p>
                          </div>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 3 Added By */}
                      <td className="px-4 py-3 border-r border-border/60 text-text-secondary bg-blue-500/[0.02]">
                        {r3 ? (
                          <span className="font-medium text-text-primary text-xs">
                            {r3.createdBy ? `${r3.createdBy.firstName} ${r3.createdBy.lastName || ""}`.trim() : "System"}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Remark 3 Date */}
                      <td className="px-4 py-3 border-r border-border/60 text-text-secondary bg-blue-500/[0.02]">
                        {r3 ? (
                          <div className="text-[11px]" title={formatDateTime(r3.createdAt)}>
                            {formatDateShort(r3.createdAt)}
                          </div>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Total Remarks Counter Button */}
                      <td className="px-4 py-3 border-r border-border/60 text-center">
                        <button
                          type="button"
                          onClick={() => setDrawerStudent(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-text-secondary hover:text-text-primary border border-border transition text-xs font-semibold cursor-pointer"
                          title="View all remarks in chronological drawer"
                        >
                          <History size={12} className="text-primary-500" />
                          <span>{sortedRemarks.length}</span>
                          {additionalCount > 0 && (
                            <span className="ml-0.5 px-1 rounded bg-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                              +{additionalCount}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Current Assigned Employee */}
                      <td className="px-4 py-3 border-r border-border/60 font-medium text-text-primary">
                        {assignedAdvisorName ? (
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="text-primary-500 shrink-0" />
                            <span>{assignedAdvisorName}</span>
                          </div>
                        ) : (
                          <span className="text-text-muted italic">Unassigned</span>
                        )}
                      </td>

                      {/* Assignment Status */}
                      <td className="px-4 py-3 border-r border-border/60 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            student.isAvailable
                              ? "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {student.isAvailable ? "Available" : "Assigned"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentIds(new Set([student.id]));
                              setAssignmentDrawerError(null);
                              setIsAssignmentDrawerOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-lg text-xs font-semibold transition border border-primary-200 dark:border-primary-800 shadow-2xs cursor-pointer"
                            title="Assign to Program Advisor"
                          >
                            <UserPlus size={13} />
                            Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrawerStudent(student)}
                            className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs cursor-pointer"
                            title="Inspect full remark history in drawer"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Spreadsheet Footer / Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={allStudents.length}
          onPageChange={(p) => setPage(p)}
          itemLabel="records"
        />
      </div>

      {/* Complete Remark History & Reassign Secondary Drawer */}
      {drawerStudent && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isDrawerReassigning && setDrawerStudent(null)}
        >
          <div
            className="bg-surface w-full max-w-lg h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-neutral-50/60 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Student Remark History
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Complete chronological history of remarks & call logs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrawerStudent(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Student Overview Card */}
              <div className="bg-neutral-50 dark:bg-slate-900/60 p-4 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-text-primary">
                    {drawerStudent.firstName} {drawerStudent.middleName ? `${drawerStudent.middleName} ` : ""}{drawerStudent.lastName || ""}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      drawerStudent.isAvailable
                        ? "bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    }`}
                  >
                    {drawerStudent.isAvailable ? "Available" : "Assigned"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-text-muted shrink-0" />
                    <span>{drawerStudent.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={12} className="text-text-muted shrink-0" />
                    <span className="truncate">{drawerStudent.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-border/60">
                    <User size={12} className="text-text-muted shrink-0" />
                    <span>
                      Current Owner:{" "}
                      <strong className="text-text-primary font-semibold">
                        {drawerStudent.activeAssignment?.assignedTo
                          ? `${drawerStudent.activeAssignment.assignedTo.firstName} ${drawerStudent.activeAssignment.assignedTo.lastName || ""}`.trim()
                          : "Unassigned"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Action Card inside Drawer */}
              <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <UserCheck size={14} className="text-primary-500" />
                    Assign Record
                  </span>
                </div>

                <div className="space-y-2">
                  <select
                    value={drawerAdvisorId}
                    onChange={(e) => setDrawerAdvisorId(e.target.value)}
                    disabled={isDrawerReassigning}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary outline-none focus:border-primary-500 disabled:opacity-50"
                  >
                    <option value="">Select destination Program Advisor...</option>
                    {eligibleAdvisors.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.firstName} {adv.lastName}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={executeDrawerReallocation}
                    disabled={!drawerAdvisorId || isDrawerReassigning}
                    className="w-full h-9 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isDrawerReassigning && <RefreshCw size={14} className="animate-spin" />}
                    Confirm Assignment
                  </button>
                </div>
              </div>

              {/* Complete Chronological Remarks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <PhoneCall size={13} className="text-indigo-500" />
                    Chronological Remark History ({drawerStudent.callRecords?.length || 0})
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Oldest to newest
                  </span>
                </div>

                {drawerStudent.callRecords && drawerStudent.callRecords.length > 0 ? (
                  <div className="space-y-3">
                    {drawerStudent.callRecords.map((remark, idx) => {
                      const outcomeStyle = OUTCOME_STYLE_MAP[remark.outcome] || {
                        bg: "bg-neutral-500/10",
                        text: "text-neutral-400",
                        border: "border-neutral-500/20",
                      };
                      const outcomeLabel = OUTCOME_LABEL_MAP[remark.outcome] || remark.outcome;

                      return (
                        <div
                          key={remark.id || idx}
                          className="rounded-xl border border-border bg-neutral-50/50 dark:bg-slate-900/50 p-3.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary">
                                #{idx + 1}
                              </span>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${outcomeStyle.bg} ${outcomeStyle.text} ${outcomeStyle.border}`}
                              >
                                {outcomeLabel}
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                              <Clock size={11} />
                              {formatDateTime(remark.createdAt)}
                            </span>
                          </div>

                          <div className="pt-1 border-t border-border/60 flex items-center justify-between text-xs text-text-secondary">
                            <span>
                              Added By:{" "}
                              <strong className="text-text-primary font-semibold">
                                {remark.createdBy ? `${remark.createdBy.firstName} ${remark.createdBy.lastName || ""}`.trim() : "System"}
                              </strong>
                            </span>
                          </div>

                          {remark.notes ? (
                            <div className="rounded-lg bg-surface p-2.5 text-xs text-text-primary border border-border italic leading-relaxed">
                              "{remark.notes}"
                            </div>
                          ) : (
                            <p className="text-[11px] text-text-muted italic">
                              No written notes for this entry.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl border border-border bg-neutral-50/50 dark:bg-slate-900/50 text-text-muted text-xs space-y-1">
                    <p className="font-semibold text-text-secondary">No remarks recorded yet</p>
                    <p>When advisors contact this student, historical remarks will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusing exact existing Data Assignment right-side drawer */}
      {isAssignmentDrawerOpen && (
        <AssignmentReviewModal
          selectionCount={selectedStudentIds.size}
          selectionMode="EXPLICIT"
          quantity={null}
          distribution={selectedDistribution}
          activeFilters={{
            states: selectedStates,
            cities: selectedCities,
            uploadIds: selectedUploadIds,
            assignmentStatus,
            search: searchTerm,
            dispositions: selectedDispositions,
            notCalledByUserIds: selectedNotCalledByUserIds,
          }}
          eligibleAdvisors={eligibleAdvisors}
          onClose={() => {
            setIsAssignmentDrawerOpen(false);
            setAssignmentDrawerError(null);
          }}
          onConfirm={handleConfirmAssignmentFromDrawer}
          submitting={isAssigning}
          error={assignmentDrawerError}
          title="Assign Selected Data"
          subtitle="Select recipient user & confirm working-hours assignment"
        />
      )}
    </div>
  );
};

export default AnalysisSpreadsheetsPage;
