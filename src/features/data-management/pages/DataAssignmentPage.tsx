import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {

  UserCheck,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Database,
  X,
  MapPin,
  ChevronDown,
  Filter,
  Check,
  RotateCcw,
  AlertTriangle,
  Shuffle,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchDataAssignments,
  fetchFilteredStudentData,
  fetchEligibleProgramAdvisors,
  createDataAssignment,
  reclaimAdvisorData,
  reclaimAllAdvisorData,
  reclaimAssignmentById,
  type StudentDataRecord,
  type EligibleProgramAdvisor,
  type FilterStudentDataParams,
  type AssigneeSummaryRecord,
  type FilteredStudentDataResponse,
} from "../../../services/dataManagementService";
import { getIndianStates, getCitiesByState } from "../../../data/indianStatesCities";
import AssignmentReviewModal from "../components/AssignmentReviewModal";
import PaginationControls from "../components/PaginationControls";
import { AssigneeDetailsDrawer } from "../components/AssigneeDetailsDrawer";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const PREDEFINED_QUANTITIES = [20, 50, 100, 200, 500];

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

const DataAssignmentPage = () => {
  const { accessToken } = useAuth();
  const [searchParams] = useSearchParams();

  const paramStatus = searchParams.get("status");
  const paramAssignedTo = searchParams.get("assignedTo");

  // Data & Server State
  const [assignments, setAssignments] = useState<AssigneeSummaryRecord[]>([]);
  const [allStudents, setAllStudents] = useState<StudentDataRecord[]>([]);
  const [isMixing, setIsMixing] = useState<boolean>(false);
  const [eligibleAdvisors, setEligibleAdvisors] = useState<EligibleProgramAdvisor[]>([]);
  const [availableMatchingCount, setAvailableMatchingCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [serverDistribution, setServerDistribution] = useState<Record<string, number>>({});
  const [filterOptions, setFilterOptions] = useState<FilteredStudentDataResponse["filterOptions"]>({
    states: [],
    cities: [],
    cityOptionsWithState: [],
    uploads: [],
  });

  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [filterAlert, setFilterAlert] = useState<string | null>(
    paramAssignedTo ? `Filtered for Advisor ID #${paramAssignedTo}` : null
  );

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [stateSearchTerm, setStateSearchTerm] = useState<string>("");
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [assignmentStatus, setAssignmentStatus] = useState<"AVAILABLE" | "ASSIGNED" | "ALL">(
    paramStatus === "ASSIGNED" || paramStatus === "ACTIVE" ? "ASSIGNED" : paramStatus === "EXPIRED" ? "ALL" : "AVAILABLE"
  );
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>([]);
  const [isDispositionDropdownOpen, setIsDispositionDropdownOpen] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyTotalPages, setHistoryTotalPages] = useState<number>(1);
  const [historyTotalCount, setHistoryTotalCount] = useState<number>(0);
  const [selectedAssigneeIdForDrawer, setSelectedAssigneeIdForDrawer] = useState<string | null>(null);


  // Dropdown Open States
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [isNotCalledByDropdownOpen, setIsNotCalledByDropdownOpen] = useState(false);
  const [selectedNotCalledByUserIds, setSelectedNotCalledByUserIds] = useState<string[]>([]);
  const [callerSearchTerm, setCallerSearchTerm] = useState<string>("");

  // Selection State
  const [selectionMode, setSelectionMode] = useState<"EXPLICIT" | "ALL_MATCHING">("EXPLICIT");
  const [explicitSelectedIds, setExplicitSelectedIds] = useState<string[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantityInput, setCustomQuantityInput] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reclaim Modal State
  const [reclaimModalState, setReclaimModalState] = useState<{
    isOpen: boolean;
    type: "SINGLE" | "BULK" | "BY_ID";
    assignmentId?: string;
    advisorId?: string;
    advisorName?: string;
    recordCount?: number;
    submitting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    type: "SINGLE",
    submitting: false,
    error: null,
  });

  const handleOpenReclaimSingle = (
    advisorId: string,
    advisorName: string,
    recordCount: number,
    assignmentId?: string
  ) => {
    setReclaimModalState({
      isOpen: true,
      type: assignmentId ? "BY_ID" : "SINGLE",
      assignmentId,
      advisorId,
      advisorName,
      recordCount,
      submitting: false,
      error: null,
    });
  };

  const handleOpenReclaimBulk = () => {
    setReclaimModalState({
      isOpen: true,
      type: "BULK",
      submitting: false,
      error: null,
    });
  };

  const handleConfirmReclaim = async () => {
    if (!accessToken) return;
    setReclaimModalState((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      if (reclaimModalState.type === "BY_ID" && reclaimModalState.assignmentId) {
        const res = await reclaimAssignmentById(accessToken, reclaimModalState.assignmentId);
        setSuccessToast(res.message || "Data assignment successfully reclaimed.");
      } else if (reclaimModalState.type === "SINGLE" && reclaimModalState.advisorId) {
        const res = await reclaimAdvisorData(accessToken, reclaimModalState.advisorId);
        setSuccessToast(res.message || "Data assignment successfully reclaimed.");
      } else {
        const res = await reclaimAllAdvisorData(accessToken);
        setSuccessToast(res.message || "All advisor data assignments successfully reclaimed.");
      }

      setReclaimModalState((prev) => ({ ...prev, isOpen: false, submitting: false }));
      setTimeout(() => setSuccessToast(null), 5000);
      await Promise.all([loadFilteredData(), loadAssignmentsHistory()]);
    } catch (err: any) {
      setReclaimModalState((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || "Failed to reclaim advisor data.",
      }));
    }
  };

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
        .then((res) => setEligibleAdvisors(res || []))
        .catch(console.error);
    }
  }, [accessToken]);

  // Fisher-Yates Shuffle Algorithm (Unbiased Randomization)
  const fisherYatesShuffle = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch Filtered Data
  const loadFilteredData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setDataError(null);
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
      setAvailableMatchingCount(filteredRes.meta?.availableCount ?? 0);
      setTotalCount(filteredRes.meta?.total ?? 0);
      setServerDistribution(filteredRes.distribution || {});
      setFilterOptions(filteredRes.filterOptions || { states: [], cities: [], cityOptionsWithState: [], uploads: [] });
    } catch (err: any) {
      console.error("Failed to load data assignment records:", err);
      setDataError(err.message || "Failed to load student data. Please check your network or try again.");
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
  ]);

  // Fetch Data Assignments History
  const loadAssignmentsHistory = useCallback(async () => {
    if (!accessToken) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const assignmentsRes = await fetchDataAssignments(accessToken, historyPage, 10);
      setAssignments(assignmentsRes.data || []);
      setHistoryTotalPages(assignmentsRes.pagination?.totalPages || 1);
      setHistoryTotalCount(assignmentsRes.pagination?.total || assignmentsRes.data?.length || 0);
    } catch (err: any) {
      console.error("Failed to load data assignments history:", err);
      setHistoryError(err.message || "Failed to load assignment history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [accessToken, historyPage]);

  // Mix Data / Shuffle Action
  const handleMixData = () => {
    if (allStudents.length === 0) return;
    setIsMixing(true);

    setTimeout(() => {
      try {
        const shuffled = fisherYatesShuffle(allStudents);
        setAllStudents(shuffled);
        setPage(1);

        setSuccessToast("Data mixed successfully");
        setTimeout(() => setSuccessToast(null), 3000);
      } finally {
        setIsMixing(false);
      }
    }, 150);
  };

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(allStudents.length / pageSize));
  const students = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allStudents.slice(start, start + pageSize);
  }, [allStudents, page, pageSize]);

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]);

  useEffect(() => {
    loadAssignmentsHistory();
  }, [loadAssignmentsHistory]);

  // State-constrained city options reusing existing backend options with master dataset fallback
  const availableStateOptions = useMemo(() => {
    if (filterOptions.states && filterOptions.states.length > 0) {
      return filterOptions.states;
    }
    return getIndianStates();
  }, [filterOptions.states]);

  const availableCityOptions = useMemo(() => {
    if (selectedStates.length === 0) {
      return filterOptions.cities && filterOptions.cities.length > 0
        ? filterOptions.cities
        : [];
    }

    let cities: string[] = [];
    if (filterOptions.cityOptionsWithState && filterOptions.cityOptionsWithState.length > 0) {
      const selectedStatesLower = new Set(selectedStates.map((s) => s.toLowerCase()));
      cities = filterOptions.cityOptionsWithState
        .filter((item) => item.state && selectedStatesLower.has(item.state.toLowerCase()))
        .map((item) => item.city)
        .filter(Boolean);
    }

    if (cities.length === 0) {
      cities = selectedStates.flatMap((st) => getCitiesByState(st));
    }

    return Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));
  }, [selectedStates, filterOptions.cities, filterOptions.cityOptionsWithState]);

  const filteredStateOptions = useMemo(() => {
    if (!stateSearchTerm.trim()) return availableStateOptions;
    const term = stateSearchTerm.toLowerCase();
    return availableStateOptions.filter((st) => st.toLowerCase().includes(term));
  }, [availableStateOptions, stateSearchTerm]);

  const filteredCityOptions = useMemo(() => {
    if (!citySearchTerm.trim()) return availableCityOptions;
    const term = citySearchTerm.toLowerCase();
    return availableCityOptions.filter((ct) => ct.toLowerCase().includes(term));
  }, [availableCityOptions, citySearchTerm]);

  // Reset Selection When Filters Change
  const resetSelectionWithNotice = useCallback(() => {
    if (explicitSelectedIds.length > 0 || selectedQuantity !== null || selectionMode === "ALL_MATCHING") {
      setExplicitSelectedIds([]);
      setSelectedQuantity(null);
      setSelectionMode("EXPLICIT");
      setShowCustomInput(false);
      setFilterAlert("Filters changed. Previous selection was cleared.");
      setTimeout(() => setFilterAlert(null), 4000);
    }
  }, [explicitSelectedIds.length, selectedQuantity, selectionMode]);

  const handleStateToggle = (st: string) => {
    const nextStates = selectedStates.includes(st)
      ? selectedStates.filter((s) => s !== st)
      : [...selectedStates, st];
    setSelectedStates(nextStates);

    // Reset selected cities that are not valid for the newly selected states
    if (nextStates.length > 0) {
      const validCities = new Set<string>();
      if (filterOptions.cityOptionsWithState && filterOptions.cityOptionsWithState.length > 0) {
        const nextStatesLower = new Set(nextStates.map((s) => s.toLowerCase()));
        for (const item of filterOptions.cityOptionsWithState) {
          if (item.state && nextStatesLower.has(item.state.toLowerCase()) && item.city) {
            validCities.add(item.city.toLowerCase());
          }
        }
      }
      for (const s of nextStates) {
        for (const c of getCitiesByState(s)) {
          validCities.add(c.toLowerCase());
        }
      }

      setSelectedCities((prevCities) =>
        prevCities.filter((city) => validCities.has(city.toLowerCase()))
      );
    }

    setPage(1);
    resetSelectionWithNotice();
  };

  const handleSelectAllStates = () => {
    setSelectedStates([]);
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleCityToggle = (ct: string) => {
    setSelectedCities((prev) =>
      prev.includes(ct) ? prev.filter((c) => c !== ct) : [...prev, ct]
    );
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleSelectAllCities = () => {
    setSelectedCities([]);
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleUploadToggle = (upId: string) => {
    setSelectedUploadIds((prev) =>
      prev.includes(upId) ? prev.filter((id) => id !== upId) : [...prev, upId]
    );
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleStatusChange = (status: "AVAILABLE" | "ASSIGNED" | "ALL") => {
    setAssignmentStatus(status);
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleDispositionToggle = (dispValue: string) => {
    setSelectedDispositions((prev) =>
      prev.includes(dispValue) ? prev.filter((d) => d !== dispValue) : [...prev, dispValue]
    );
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleSelectAllDispositions = () => {
    setSelectedDispositions([]);
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleNotCalledByUserToggle = (userId: string) => {
    setSelectedNotCalledByUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setPage(1);
    resetSelectionWithNotice();
  };

  const handleSelectAllNotCalledBy = () => {
    setSelectedNotCalledByUserIds([]);
    setPage(1);
    resetSelectionWithNotice();
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

  const handleClearAllFilters = () => {
    setSelectedStates([]);
    setSelectedCities([]);
    setSelectedUploadIds([]);
    setAssignmentStatus("AVAILABLE");
    setSelectedDispositions([]);
    setSelectedNotCalledByUserIds([]);
    setCallerSearchTerm("");
    setStateSearchTerm("");
    setCitySearchTerm("");
    setSearchTerm("");
    setPage(1);
    resetSelectionWithNotice();
  };

  // Quantity Selection Actions
  const handleQuantitySelect = (q: number) => {
    setShowCustomInput(false);
    const actualSelectCount = Math.min(q, availableMatchingCount);
    setSelectedQuantity(actualSelectCount);
    setSelectionMode("ALL_MATCHING");
    setExplicitSelectedIds([]);
  };

  const handleCustomQuantitySubmit = () => {
    const val = parseInt(customQuantityInput) || 0;
    if (val <= 0) return;
    const actualSelectCount = Math.min(val, availableMatchingCount);
    setSelectedQuantity(actualSelectCount);
    setSelectionMode("ALL_MATCHING");
    setExplicitSelectedIds([]);
  };

  const handleSelectAllMatching = () => {
    setShowCustomInput(false);
    setSelectedQuantity(availableMatchingCount);
    setSelectionMode("ALL_MATCHING");
    setExplicitSelectedIds([]);
  };

  const handleSelectAllVisible = () => {
    setShowCustomInput(false);
    setSelectedQuantity(null);
    setSelectionMode("EXPLICIT");
    const visibleAvailableIds = students
      .filter((s) => s.isAvailable !== false)
      .map((s) => s.id);
    setExplicitSelectedIds(visibleAvailableIds);
  };

  const handleIndividualCheckToggle = (studentId: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setShowCustomInput(false);
    setSelectedQuantity(null);
    setSelectionMode("EXPLICIT");
    setExplicitSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Effective Selected Count & Distribution
  const effectiveSelectionCount = useMemo(() => {
    if (selectionMode === "ALL_MATCHING") {
      return selectedQuantity !== null ? selectedQuantity : availableMatchingCount;
    }
    return explicitSelectedIds.length;
  }, [selectionMode, selectedQuantity, availableMatchingCount, explicitSelectedIds.length]);

  const effectiveDistribution = useMemo(() => {
    const dist: Record<string, number> = {};

    if (selectionMode === "ALL_MATCHING" && selectedQuantity !== null) {
      const availableInOrder = allStudents.filter((s) => s.isAvailable !== false);
      const targetSlice = availableInOrder.slice(0, selectedQuantity);
      for (const s of targetSlice) {
        const st = s.state || "Unspecified";
        dist[st] = (dist[st] || 0) + 1;
      }
      return dist;
    }

    if (selectionMode === "ALL_MATCHING") {
      return serverDistribution;
    }

    const selectedSet = new Set(explicitSelectedIds);
    for (const s of allStudents) {
      if (selectedSet.has(s.id)) {
        const st = s.state || "Unspecified";
        dist[st] = (dist[st] || 0) + 1;
      }
    }
    return dist;
  }, [selectionMode, selectedQuantity, allStudents, serverDistribution, explicitSelectedIds]);

  // Execute Assignment Submission
  const handleConfirmAssignment = async ({
    assignedToId,
  }: {
    assignedToId: string;
  }) => {
    if (!accessToken) return;
    setSubmittingAssignment(true);
    setModalError(null);

    try {
      const activeFiltersPayload: FilterStudentDataParams = {
        states: selectedStates,
        cities: selectedCities,
        uploadIds: selectedUploadIds,
        assignmentStatus,
        search: searchTerm,
        dispositions: selectedDispositions.length > 0 ? selectedDispositions : undefined,
        notCalledByUserIds: selectedNotCalledByUserIds.length > 0 ? selectedNotCalledByUserIds : undefined,
      };

      let finalMode = selectionMode;
      let finalStudentDataIds = selectionMode === "EXPLICIT" ? explicitSelectedIds : undefined;

      if (selectionMode === "ALL_MATCHING" && selectedQuantity !== null) {
        const availableInCurrentOrder = allStudents.filter((s) => s.isAvailable !== false);
        const selectedSlice = availableInCurrentOrder.slice(0, selectedQuantity);
        finalStudentDataIds = selectedSlice.map((s) => s.id);
        finalMode = "EXPLICIT";
      }

      const res = await createDataAssignment(accessToken, {
        assignedToId,
        selectionMode: finalMode,
        studentDataIds: finalStudentDataIds,
        quantity: selectedQuantity || undefined,
        filters: activeFiltersPayload,
      });

      setSuccessToast(res.message || "Successfully assigned student data records.");
      setIsReviewModalOpen(false);
      setExplicitSelectedIds([]);
      setSelectedQuantity(null);
      setSelectionMode("EXPLICIT");
      loadFilteredData();
      loadAssignmentsHistory();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setModalError(err.message || "Failed to complete data assignment.");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const isAllVisibleSelected =
    students.length > 0 &&
    students
      .filter((s) => s.isAvailable !== false)
      .every((s) => explicitSelectedIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter Change Alert */}
      {filterAlert && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 shadow-xs animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>{filterAlert}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="text-primary-600" size={26} />
            Data Assignment Workspace
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Find student data using filters and assign it to a Program Advisor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenReclaimBulk}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition shadow-2xs"
          >
            <RotateCcw size={15} />
            Reclaim All Advisor Data
          </button>

          <button
            onClick={() => {
              loadFilteredData();
              loadAssignmentsHistory();
            }}
            title="Refresh student data"
            className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw size={18} className={loading || historyLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Control Panel */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by student name, phone, email, city, state..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-text-primary outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* State Multi-Select Dropdown */}
          <div className="relative filter-dropdown-container">
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
              <div className="absolute left-0 top-12 z-40 w-64 max-h-72 flex flex-col rounded-xl border border-border bg-surface p-2 shadow-xl space-y-1">
                {/* Search Bar if > 6 options */}
                {availableStateOptions.length > 6 && (
                  <div className="relative mb-1 shrink-0">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search states..."
                      value={stateSearchTerm}
                      onChange={(e) => setStateSearchTerm(e.target.value)}
                      className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-neutral-50 text-xs text-text-primary outline-none focus:border-primary-500"
                    />
                  </div>
                )}

                {/* All States Option */}
                <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs font-medium text-text-primary">
                  <input
                    type="checkbox"
                    checked={selectedStates.length === 0}
                    onChange={handleSelectAllStates}
                    className="rounded border-border text-primary-600 focus:ring-primary-400"
                  />
                  <span>All States</span>
                </label>

                <div className="h-px bg-border my-1" />

                <div className="overflow-y-auto space-y-1 max-h-48 pr-1">
                  {loading && availableStateOptions.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 p-3 text-xs text-text-muted">
                      <RefreshCw className="animate-spin text-primary-600" size={14} />
                      <span>Loading states...</span>
                    </div>
                  ) : filteredStateOptions.length === 0 ? (
                    <p className="p-2 text-xs text-text-muted">No state options available</p>
                  ) : (
                    filteredStateOptions.map((st) => (
                      <label
                        key={st}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs text-text-primary"
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

                <div className="pt-2 mt-1 border-t border-border flex items-center justify-between text-xs text-text-muted px-1 shrink-0">
                  <span>{selectedStates.length > 0 ? `${selectedStates.length} selected` : "All"}</span>
                  {selectedStates.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllStates}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* City Multi-Select Dropdown */}
          <div className="relative filter-dropdown-container">
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
              <div className="absolute left-0 top-12 z-40 w-64 max-h-72 flex flex-col rounded-xl border border-border bg-surface p-2 shadow-xl space-y-1">
                {/* Search Bar if > 6 options */}
                {availableCityOptions.length > 6 && (
                  <div className="relative mb-1 shrink-0">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search cities..."
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-neutral-50 text-xs text-text-primary outline-none focus:border-primary-500"
                    />
                  </div>
                )}

                {/* All Cities Option */}
                <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs font-medium text-text-primary">
                  <input
                    type="checkbox"
                    checked={selectedCities.length === 0}
                    onChange={handleSelectAllCities}
                    className="rounded border-border text-primary-600 focus:ring-primary-400"
                  />
                  <span>All Cities</span>
                </label>

                <div className="h-px bg-border my-1" />

                <div className="overflow-y-auto space-y-1 max-h-48 pr-1">
                  {loading && availableCityOptions.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 p-3 text-xs text-text-muted">
                      <RefreshCw className="animate-spin text-primary-600" size={14} />
                      <span>Loading cities...</span>
                    </div>
                  ) : filteredCityOptions.length === 0 ? (
                    <p className="p-2 text-xs text-text-muted">
                      {selectedStates.length > 0 ? "No cities found for selected state(s)" : "No city options available"}
                    </p>
                  ) : (
                    filteredCityOptions.map((ct) => (
                      <label
                        key={ct}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs text-text-primary"
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

                <div className="pt-2 mt-1 border-t border-border flex items-center justify-between text-xs text-text-muted px-1 shrink-0">
                  <span>{selectedCities.length > 0 ? `${selectedCities.length} selected` : "All"}</span>
                  {selectedCities.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllCities}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upload File Multi-Select Dropdown */}
          <div className="relative filter-dropdown-container">
            <button
              type="button"
              onClick={() => {
                setIsUploadDropdownOpen(!isUploadDropdownOpen);
                setIsStateDropdownOpen(false);
                setIsCityDropdownOpen(false);
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
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs text-text-primary"
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

          {/* Assignment Status Select */}
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

          {/* Call Disposition Multi-Select Dropdown */}
          <div className="relative filter-dropdown-container">
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
                <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs font-medium text-text-primary">
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
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs text-text-primary"
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

          {/* Not Called By Multi-Select Dropdown */}
          <div className="relative filter-dropdown-container">
            <button
              type="button"
              onClick={() => {
                setIsNotCalledByDropdownOpen(!isNotCalledByDropdownOpen);
                setIsStateDropdownOpen(false);
                setIsCityDropdownOpen(false);
                setIsUploadDropdownOpen(false);
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
                {/* Search Bar */}
                <div className="relative mb-2 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search callers..."
                    value={callerSearchTerm}
                    onChange={(e) => setCallerSearchTerm(e.target.value)}
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-neutral-50 text-xs text-text-primary outline-none focus:border-primary-500"
                  />
                </div>

                <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                  {/* All Option */}
                  <label
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs font-medium text-text-primary"
                  >
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
                      const fullName = `${advisor.firstName} ${advisor.lastName || ''}`.trim();
                      const isChecked = selectedNotCalledByUserIds.includes(advisor.id);
                      return (
                        <label
                          key={advisor.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer text-xs text-text-primary"
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
                  <span>{selectedNotCalledByUserIds.length > 0 ? `${selectedNotCalledByUserIds.length} selected` : "All"}</span>
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
                className="inline-flex items-center gap-1 rounded-lg bg-primary-50 text-primary-800 border border-primary-200 px-2.5 py-0.5 text-xs font-semibold"
              >
                State: {st}
                <button
                  type="button"
                  onClick={() => handleStateToggle(st)}
                  className="hover:text-primary-900"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {selectedCities.map((ct) => (
              <span
                key={ct}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary-50 text-secondary-800 border border-secondary-200 px-2.5 py-0.5 text-xs font-semibold"
              >
                City: {ct}
                <button
                  type="button"
                  onClick={() => handleCityToggle(ct)}
                  className="hover:text-secondary-900"
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
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 text-xs font-semibold"
                >
                  Dataset: {up ? up.fileName : id.slice(0, 8)}
                  <button
                    type="button"
                    onClick={() => handleUploadToggle(id)}
                    className="hover:text-purple-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

            {assignmentStatus !== "AVAILABLE" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 text-text-primary border border-border px-2.5 py-0.5 text-xs font-semibold">
                Status: {assignmentStatus}
                <button
                  type="button"
                  onClick={() => handleStatusChange("AVAILABLE")}
                  className="hover:text-text-primary"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedDispositions.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
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
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold">
                Not Called By: {
                  selectedNotCalledByUserIds.length === 1
                    ? (() => {
                        const adv = eligibleAdvisors.find((a) => a.id === selectedNotCalledByUserIds[0]);
                        return adv ? `${adv.firstName} ${adv.lastName || ''}`.trim() : "1 caller";
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

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Result Summary & Quantity Selection Control Bar */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold">
              <Database size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-text-secondary">
                Available Matching Data Pool
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {availableMatchingCount.toLocaleString()}{" "}
                <span className="text-xs font-normal text-text-muted">
                  (out of {totalCount.toLocaleString()} matching rows)
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMixData}
            disabled={isMixing || availableMatchingCount === 0}
            title="Randomize ordering of current matching records"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface text-text-primary hover:bg-neutral-100 font-semibold text-xs transition shadow-2xs disabled:opacity-50"
          >
            <Shuffle size={14} className={isMixing ? "animate-spin text-primary-600" : "text-primary-600"} />
            <span>{isMixing ? "Mixing..." : "Mix Data"}</span>
          </button>
        </div>
          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary uppercase">Select Quantity:</span>
            {PREDEFINED_QUANTITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuantitySelect(q)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  selectionMode === "ALL_MATCHING" && selectedQuantity === q
                    ? "bg-primary-500 text-white border-primary-500 shadow-xs"
                    : "bg-surface border-border text-text-primary hover:bg-neutral-100"
                }`}
              >
                {q}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showCustomInput
                  ? "bg-primary-500 text-white border-primary-500 shadow-xs"
                  : "bg-surface border-border text-text-primary hover:bg-neutral-100"
              }`}
            >
              Custom
            </button>

            <button
              type="button"
              onClick={handleSelectAllMatching}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                selectionMode === "ALL_MATCHING" && selectedQuantity === availableMatchingCount
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Select All Matching ({availableMatchingCount})
            </button>
          </div>

        {/* Custom Quantity Input Bar */}
        {showCustomInput && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-border animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-text-primary">Enter Custom Batch Quantity:</span>
            <input
              type="number"
              min={1}
              max={availableMatchingCount || 1}
              placeholder="e.g. 175"
              value={customQuantityInput}
              onChange={(e) => setCustomQuantityInput(e.target.value)}
              className="h-9 w-32 rounded-lg border border-border bg-surface px-3 text-xs outline-none focus:border-primary-500"
            />
            <button
              type="button"
              onClick={handleCustomQuantitySubmit}
              className="h-9 px-4 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition"
            >
              Apply Selection
            </button>
          </div>
        )}

        {/* Selection Status & Geographic Distribution Preview */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">
                Selected: <span className="text-primary-600">{effectiveSelectionCount.toLocaleString()}</span> records
              </span>
              <span className="text-xs text-text-muted">
                ({selectionMode === "ALL_MATCHING" ? "Server-side Quantity Selection" : "Explicit Row Selection"})
              </span>
            </div>

            {/* Geographic Distribution Breakdown */}
            {Object.keys(effectiveDistribution).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-text-secondary flex items-center gap-1 font-medium">
                  <MapPin size={12} /> Distribution:
                </span>
                {Object.entries(effectiveDistribution)
                  .filter(([, count]) => count > 0)
                  .slice(0, 6)
                  .map(([st, count]) => (
                    <span
                      key={st}
                      className="rounded-md bg-neutral-100 border border-border px-2 py-0.5 font-mono text-[11px]"
                    >
                      {st}: <strong>{count}</strong>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Assign Selected Data CTA Button */}
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            disabled={effectiveSelectionCount <= 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 shadow-md disabled:opacity-50"
          >
            <UserCheck size={18} />
            Assign Selected Data ({effectiveSelectionCount})
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-neutral-50 px-5 py-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="font-semibold text-primary-600 hover:underline flex items-center gap-1"
            >
              <Check size={14} /> Select All Visible Page ({students.filter((s) => s.isAvailable !== false).length})
            </button>
          </div>

          <span className="text-text-muted">
            Showing Page {page} of {totalPages} ({totalCount} total matching)
          </span>
        </div>

        {loading ? (
          <SectionLoadingState
            message="Loading student records..."
            description="Filtering datasets by assignment status, courses, and geographic location"
            minHeight="min-h-[300px]"
          />
        ) : dataError ? (
          <PageErrorState
            title="Failed to load student records"
            message={dataError}
            onRetry={loadFilteredData}
            minHeight="min-h-[300px]"
          />
        ) : students.length === 0 ? (
          <PageEmptyState
            icon={Users}
            title="No student records found"
            description="Try broadening your filter criteria or search query."
            minHeight="min-h-[300px]"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50/50">
                  <th className="w-12 px-5 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={handleSelectAllVisible}
                      className="rounded border-border text-primary-600 focus:ring-primary-400"
                    />
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Student Name
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Phone
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    City
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    State
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Dataset File
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Call Disposition
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const isAvailable = student.isAvailable !== false;
                  const isChecked = explicitSelectedIds.includes(student.id);
                  const fullName = [student.firstName, student.middleName, student.lastName]
                    .filter(Boolean)
                    .join(" ");

                  const latestCall = student.callRecords?.[0];

                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-border last:border-0 transition ${
                        isChecked ? "bg-primary-50/40" : "hover:bg-neutral-50/50"
                      }`}
                    >
                      <td className="w-12 px-5 py-4">
                        <input
                          type="checkbox"
                          disabled={!isAvailable}
                          checked={isChecked}
                          onChange={() => handleIndividualCheckToggle(student.id, isAvailable)}
                          className="rounded border-border text-primary-600 focus:ring-primary-400 disabled:opacity-30"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {fullName}
                          </p>
                          <p className="text-xs text-text-muted">{student.email || "No email"}</p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-mono text-text-secondary">
                        {student.phone}
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {student.city || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {student.state || "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-text-muted truncate max-w-[180px]">
                        {student.upload?.fileName || "Dataset"}
                      </td>

                      <td className="px-5 py-4">
                        {!latestCall ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-text-muted border border-border">
                            No Call Yet
                          </span>
                        ) : (() => {
                          const cleanOutcome = latestCall.outcome.replace(/_/g, " ");
                          switch (latestCall.outcome) {
                            case "INTERESTED":
                              return (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                                  {cleanOutcome}
                                </span>
                              );
                            case "FOLLOW_UP":
                            case "CALL_BACK_LATER":
                              return (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800 border border-blue-300">
                                  {cleanOutcome}
                                </span>
                              );
                            case "DISCONNECTED":
                              return (
                                <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-800 border border-orange-300">
                                  {cleanOutcome}
                                </span>
                              );
                            case "OTHER":
                              return (
                                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-800 border border-cyan-300">
                                  {cleanOutcome}
                                </span>
                              );
                            default:
                              return (
                                <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700 border border-neutral-300">
                                  {cleanOutcome}
                                </span>
                              );
                          }
                        })()}
                      </td>

                      <td className="px-5 py-4">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                            <CheckCircle2 size={12} /> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-text-secondary border border-border px-2.5 py-0.5 text-xs font-semibold">
                            <Clock size={12} /> Assigned (
                            {student.activeAssignment?.assignedTo?.firstName || "Advisor"})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={setPage}
          itemLabel="records"
        />
      </div>

      {/* Data Assignments History Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs space-y-3">
        <div className="border-b border-border bg-neutral-50 px-5 py-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Clock size={16} className="text-primary-600" />
            Recent Data Assignment Operations History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-neutral-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                  Assignee
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                  Datasets
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                  Total Assigned Records
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                  Assigned Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                  First Call Made At
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                  Latest Assignment
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {historyLoading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={7}
                  message="Loading assignment history..."
                  description="Retrieving batch assignments, expiration timers, and advisor tracking"
                />
              ) : historyError ? (
                <PageErrorState
                  isTableRow
                  colSpan={7}
                  title="Unable to load assignment history"
                  message={historyError}
                  onRetry={loadAssignmentsHistory}
                />
              ) : assignments.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={7}
                  icon={Clock}
                  title="No assignments recorded"
                  description="No data assignment operations have been recorded yet."
                />
              ) : (
                assignments.map((item) => {
                  const assigneeName = item.assignee.fullName || "Program Advisor";
                  const roleAndTeam = [item.assignee.roleName, item.assignee.teamName]
                    .filter(Boolean)
                    .join(" · ");

                  const formattedAssignedDate = item.earliestAssignedAt
                    ? new Date(item.earliestAssignedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  const formattedLatestDate = item.latestAssignedAt
                    ? new Date(item.latestAssignedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  const formattedFirstCallAt = item.firstCallMadeAt
                    ? new Date(item.firstCallMadeAt)
                        .toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                        .replace(",", " •")
                    : "—";

                  return (
                    <tr
                      key={item.assignee.id}
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition"
                    >
                      <td className="px-5 py-3">
                        <p className="text-xs font-semibold text-text-primary">{assigneeName}</p>
                        <p className="text-[11px] text-text-muted">{roleAndTeam || item.assignee.email}</p>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-text-primary">
                        {item.datasetsCount} dataset{item.datasetsCount === 1 ? "" : "s"}
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-text-primary">
                        {item.activeRecordsCount.toLocaleString()} records
                      </td>
                      <td className="px-5 py-3 text-xs text-text-secondary">
                        {formattedAssignedDate}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-text-secondary">
                        {formattedFirstCallAt}
                      </td>
                      <td className="px-5 py-3 text-xs text-text-secondary">
                        {formattedLatestDate}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAssigneeIdForDrawer(item.assignee.id)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition cursor-pointer"
                          >
                            View Details
                          </button>
                          {item.activeRecordsCount > 0 && (
                            <button
                              type="button"
                                onClick={() =>
                                  handleOpenReclaimSingle(
                                    item.assignee.id,
                                    assigneeName,
                                    item.activeRecordsCount
                                  )
                                }
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                              title="Reclaim active assignments for this advisor"
                            >
                              <RotateCcw size={12} /> Reclaim
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={historyPage}
          totalPages={historyTotalPages}
          totalItems={historyTotalCount}
          onPageChange={setHistoryPage}
          itemLabel="assignees"
        />
      </div>

      {/* Assignment Review Modal */}
      {isReviewModalOpen && (
        <AssignmentReviewModal
          selectionCount={effectiveSelectionCount}
          selectionMode={selectionMode}
          quantity={selectedQuantity}
          distribution={effectiveDistribution}
          activeFilters={{
            states: selectedStates,
            cities: selectedCities,
            search: searchTerm,
          }}
          eligibleAdvisors={eligibleAdvisors}
          onClose={() => setIsReviewModalOpen(false)}
          onConfirm={handleConfirmAssignment}
          submitting={submittingAssignment}
          error={modalError}
        />
      )}

      {/* Assignee Details Right-Side Drawer */}
      {selectedAssigneeIdForDrawer && accessToken && (
        <AssigneeDetailsDrawer
          assigneeId={selectedAssigneeIdForDrawer}
          token={accessToken}
          onClose={() => setSelectedAssigneeIdForDrawer(null)}
          onAssignmentReclaimed={() => {
            loadFilteredData();
            loadAssignmentsHistory();
          }}
        />
      )}

      {/* Reclaim Confirmation Modal Dialog */}
      {reclaimModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {reclaimModalState.type === "BY_ID"
                    ? `Reclaim Data Assignment?`
                    : reclaimModalState.type === "SINGLE"
                    ? `Reclaim Data for ${reclaimModalState.advisorName}?`
                    : "Reclaim All Advisor Data?"}
                </h3>
                <p className="text-xs text-text-muted">
                  {reclaimModalState.type === "BY_ID"
                    ? "Reclaim records from this active assignment"
                    : reclaimModalState.type === "SINGLE"
                    ? "Remove active data assignment for this Program Advisor"
                    : "Remove active data assignments across all managed Program Advisors"}
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-neutral-50 p-3.5 rounded-xl border border-border">
              {reclaimModalState.type === "BY_ID"
                ? `This will reclaim data access for this active assignment. The affected records will immediately become available for re-assignment. Assignment history will be preserved.`
                : reclaimModalState.type === "SINGLE"
                ? `This will reclaim active data access from ${reclaimModalState.advisorName} (${reclaimModalState.recordCount || "active"} records). The affected records will immediately become available for re-assignment. Assignment history will be preserved.`
                : "This will remove the current active data assignments from all Program Advisors under your management scope. All reclaimed records will immediately become available for re-assignment. Assignment history will be preserved."}
            </p>

            {reclaimModalState.error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {reclaimModalState.error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={reclaimModalState.submitting}
                onClick={() => setReclaimModalState((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reclaimModalState.submitting}
                onClick={handleConfirmReclaim}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
              >
                {reclaimModalState.submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Reclaiming...
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    Confirm Reclaim
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAssignmentPage;
