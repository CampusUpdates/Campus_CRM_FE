import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Plus,

  Search,
  RefreshCw,
  Users,
  Pencil,
  Tag,
  Headphones,
  UserCheck,
  Clock,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  ChevronDown,
  Building2,
  UserCircle,
  Download,
  Copy,
  Share2,
  CheckCircle2,
  Check
} from "lucide-react";

import { ROUTES } from "../../../app/router/routes";
import { Tooltip } from "../../../components/Tooltip";
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

import CreateLeadModal from "../components/CreateLeadModal";
import EditLeadModal from "../components/EditLeadModal";
import ChangeStatusModal from "../components/ChangeStatusModal";
import TPCModal from "../components/TPCModal";
import ShareLeadModal from "../components/ShareLeadModal";
import ShareHistoryDrawer from "../components/ShareHistoryDrawer";
import { CollegesPitchedCell } from "../components/CollegesPitchedCell";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useNotification } from "../../../context/NotificationContext";
import {
  fetchLeads,
  fetchLeadStatuses,
  createLeadClaimRequest,
  exportLeadsExcel,
  acknowledgeLead,
  type LeadItem,
  type LeadStatusItem,
  type LeadAcknowledgementItem,
} from "../../../services/leadService";
import { fetchActiveColleges, type College } from "../../../services/collegeService";
import { fetchUsers, type UserItem } from "../../../services/userService";

export type StatusTabType = "ALL" | "LEAD" | "INTERESTED" | "ADMISSION" | "CLOSED";


function getRoleDisplay(ackBy?: LeadAcknowledgementItem["acknowledgedBy"]): "Manager" | "Team Lead" {
  if (!ackBy) return "Manager";
  const roleObj = typeof ackBy.role === "object" ? ackBy.role : null;
  const roleStr = typeof ackBy.role === "string" ? ackBy.role : roleObj?.name || "";
  const upper = roleStr.toUpperCase();
  if (
    upper.includes("TEAM_LEAD") ||
    upper.includes("TEAM LEAD") ||
    (ackBy.teamLeads && ackBy.teamLeads.length > 0)
  ) {
    return "Team Lead";
  }
  return "Manager";
}

const MultiSelectDropdown = ({
  icon: Icon,
  label,
  options,
  selected,
  onChange
}: {
  icon: any,
  label: string,
  options: { id: string, label: string }[],
  selected: string[],
  onChange: (val: string[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleSelection = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(i => i !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-between w-full sm:w-auto min-w-[140px] h-11 px-3.5
          rounded-xl border border-border bg-surface text-sm font-medium text-text-primary
          hover:bg-neutral-50 transition focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500
        "
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-text-muted" />
          <span className="truncate max-w-[100px]">
            {selected.length === 0 ? label : `${selected.length} Selected`}
          </span>
        </div>
        <ChevronDown size={16} className="text-text-muted ml-2 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[220px] bg-surface rounded-xl shadow-lg border border-border z-50 max-h-[300px] overflow-y-auto py-1 crm-dropdown-menu" role="listbox">
          {options.length === 0 && <div className="p-3 text-xs text-text-muted text-center">No options available</div>}
          {options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover crm-dropdown-item cursor-pointer text-text-primary transition" role="option">
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggleSelection(opt.id)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary truncate">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const LeadPage = () => {
  const { accessToken, user } = useAuth();
  const { markModuleSeen } = useNotification();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    markModuleSeen("LEADS");
  }, [markModuleSeen]);

  const isSuperAdmin =
    user?.roleCode === "SUPER_ADMIN" ||
    user?.roleId === 1 ||
    (user as any)?.roleName?.toUpperCase() === "SUPER_ADMIN" ||
    (user as any)?.role?.name?.toUpperCase() === "SUPER_ADMIN";

  const isManager =
    user?.roleCode === "MANAGER" ||
    (user as any)?.roleName?.toUpperCase() === "MANAGER" ||
    (user as any)?.role?.name?.toUpperCase() === "MANAGER";

  const isTeamLead =
    user?.roleCode === "TEAM_LEAD" ||
    (user as any)?.roleName?.toUpperCase() === "TEAM_LEAD" ||
    (user as any)?.roleName?.toUpperCase() === "TEAM LEAD" ||
    (user as any)?.role?.name?.toUpperCase() === "TEAM_LEAD" ||
    (user as any)?.role?.name?.toUpperCase() === "TEAM LEAD";

  const isProgramAdvisor =
    user?.roleCode === "PROGRAM_ADVISOR" ||
    (user as any)?.roleName?.toUpperCase() === "PA" ||
    (user as any)?.roleName?.toUpperCase() === "PROGRAM_ADVISOR" ||
    (user as any)?.roleName?.toUpperCase() === "PROGRAM ADVISOR" ||
    (user as any)?.role?.name?.toUpperCase() === "PROGRAM_ADVISOR" ||
    (user as any)?.role?.name?.toUpperCase() === "PROGRAM ADVISOR" ||
    (!isSuperAdmin && !isManager && !isTeamLead && user?.roleCode !== "HR");

  const isSuperAdminOrManager = isSuperAdmin || isManager || isTeamLead;

  const isAuthorizedToAcknowledge =
    !isProgramAdvisor && (isSuperAdmin || isManager || isTeamLead);

  const canFilterByOwner =
    !isProgramAdvisor &&
    (isSuperAdmin || isManager || isTeamLead || user?.roleCode === "HR");

  const paramDate = searchParams.get("date");
  const paramStatus = searchParams.get("status");
  const paramTeamId = searchParams.get("teamId");
  const paramAssignedToId = searchParams.get("assignedToId");
  const paramAdmissionDueDate = searchParams.get("admissionDueDate");
  const paramAdmissionOverdue = searchParams.get("admissionOverdue");
  const paramTime = searchParams.get("time");
  const paramFromDate = searchParams.get("fromDate");
  const paramToDate = searchParams.get("toDate");

  const hasActiveUrlFilters = Boolean(
    paramDate ||
    paramStatus ||
    paramTeamId ||
    (canFilterByOwner && paramAssignedToId) ||
    paramAdmissionDueDate ||
    paramAdmissionOverdue ||
    paramTime ||
    paramFromDate ||
    paramToDate
  );

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [dbStatuses, setDbStatuses] = useState<LeadStatusItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    const param = searchParams.get("status") || searchParams.get("statusGroup");
    return param ? param.toUpperCase() : "LEAD";
  });

  const [selectedTime, setSelectedTime] = useState<string>(() => {
    const param = searchParams.get("time");
    return param ? param.toLowerCase() : "all";
  });

  const [fromDate, setFromDate] = useState<string>(() => searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState<string>(() => searchParams.get("toDate") || "");

  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [collegesList, setCollegesList] = useState<College[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Custom Range Modal state
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [pickerFromDate, setPickerFromDate] = useState<string>(fromDate);
  const [pickerToDate, setPickerToDate] = useState<string>(toDate);

  useEffect(() => {
    async function loadFilterData() {
      if (!accessToken) return;
      try {
        const [statusesData, collegesData, usersData] = await Promise.all([
          fetchLeadStatuses(accessToken),
          fetchActiveColleges(accessToken),
          canFilterByOwner ? fetchUsers(accessToken) : Promise.resolve([]),
        ]);
        setDbStatuses(statusesData);
        setCollegesList(collegesData);
        if (canFilterByOwner) {
          setUsersList(usersData);
        } else {
          setUsersList([]);
        }
      } catch (err) {
        console.error("Failed to fetch filter data", err);
      }
    }
    loadFilterData();
  }, [accessToken, canFilterByOwner]);

  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);

  // Request sequencing and in-flight cancellation guards against stale API responses
  const latestRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Unmount cleanup: cancel any pending request
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Debounce search term changes by 250ms and synchronize page reset
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setDebouncedSearch("");
      setCurrentPage(1);
    }
  };

  const handleClearSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus === "ALL") {
        next.set("status", "ALL");
        next.delete("statusGroup");
      } else {
        next.set("status", newStatus);
        next.delete("statusGroup");
      }
      return next;
    });
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newTime === "all") {
        next.delete("time");
      } else {
        next.set("time", newTime);
      }
      next.delete("fromDate");
      next.delete("toDate");
      return next;
    });
  };

  const handleApplyCustomRange = () => {
    if (pickerFromDate && pickerToDate && pickerFromDate > pickerToDate) {
      toast.error("From date cannot be after To date");
      return;
    }
    setSelectedTime("custom");
    setFromDate(pickerFromDate);
    setToDate(pickerToDate);
    setIsCustomRangeOpen(false);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("time", "custom");
      if (pickerFromDate) next.set("fromDate", pickerFromDate);
      else next.delete("fromDate");
      if (pickerToDate) next.set("toDate", pickerToDate);
      else next.delete("toDate");
      return next;
    });
  };

  const handleCancelCustomRange = () => {
    setPickerFromDate(fromDate);
    setPickerToDate(toDate);
    setIsCustomRangeOpen(false);
  };

  const handleClearAllFilters = () => {
    setSearchParams({});
    setSelectedStatus("LEAD");
    setSelectedTime("all");
    setFromDate("");
    setToDate("");
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedColleges([]);
    setSelectedOwners([]);
    setCurrentPage(1);
  };

  // Active Lead Action States
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [changingStatusLead, setChangingStatusLead] = useState<LeadItem | null>(null);
  const [tpcLead, setTpcLead] = useState<LeadItem | null>(null);
  const [claimingLeadId, setClaimingLeadId] = useState<string | null>(null);
  const [pendingClaimLeadIds, setPendingClaimLeadIds] = useState<Set<string>>(new Set());

  // Lead Sharing Workflow States
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [acknowledgingLeadId, setAcknowledgingLeadId] = useState<string | null>(null);
  const [sharingLead, setSharingLead] = useState<LeadItem | null>(null);
  const [shareHistoryLead, setShareHistoryLead] = useState<LeadItem | null>(null);

  const handleCopyLead = async (lead: LeadItem) => {
    const studentName = `${lead.firstName} ${lead.lastName || ""}`.trim();
    const phone = lead.phone || "N/A";
    const email = lead.email || "N/A";
    const course = lead.courseInterested || (lead as any).courseInterestedOther || "N/A";
    const location = [lead.city, lead.state].filter(Boolean).join(", ") || "N/A";

    const pitchedColleges = (lead.collegeApplications || [])
      .filter((ca: any) => ca.approvalStatus !== "REJECTED" && ca.cancellationReason == null)
      .map((ca: any) => ca.college?.name)
      .filter(Boolean);
    const collegeInfo = pitchedColleges.length > 0 ? pitchedColleges.join(", ") : "None";
    const prefLocation = [lead.preferredCity, lead.preferredState].filter(Boolean).join(", ");
    const budget = lead.preferredBudget != null ? `₹${Number(lead.preferredBudget).toLocaleString("en-IN")}` : null;
    const sourceInfo = lead.source === "REFERENCE"
      ? `Reference${lead.referredBy ? ` (by ${lead.referredBy})` : ""}`
      : lead.source;

    const textToCopy = [
      `Campus CRM — Lead Details`,
      `Student Name: ${studentName}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Course Interested: ${course}`,
      `Location: ${location}`,
      prefLocation ? `Preferred Location: ${prefLocation}` : null,
      budget ? `Preferred Budget: ${budget}` : null,
      sourceInfo ? `Lead Source: ${sourceInfo}` : null,
      `Colleges Pitched: ${collegeInfo}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedLeadId(lead.id);
      toast.success(`Copied details for ${studentName} to clipboard`);
      setTimeout(() => {
        setCopiedLeadId((prev) => (prev === lead.id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
      toast.error("Failed to copy lead details to clipboard");
    }
  };

  const handleShareSuccess = (newShare: LeadAcknowledgementItem) => {
    setLeads((prevLeads) =>
      prevLeads.map((l) => {
        if (l.id !== newShare.leadId) return l;
        const existingAcks = l.acknowledgements || [];
        return {
          ...l,
          acknowledgements: [newShare, ...existingAcks],
        };
      })
    );
  };

  const handleAcknowledgeSuccess = (updatedAck: LeadAcknowledgementItem) => {
    setLeads((prevLeads) =>
      prevLeads.map((l) => {
        if (l.id !== updatedAck.leadId) return l;
        const existingAcks = l.acknowledgements || [];
        const exists = existingAcks.some((a) => a.id === updatedAck.id);
        const updated = exists
          ? existingAcks.map((a) => (a.id === updatedAck.id ? { ...a, ...updatedAck } : a))
          : [updatedAck, ...existingAcks];
        return {
          ...l,
          acknowledgements: updated,
        };
      })
    );
  };

  const handleAcknowledge = async (leadId: string) => {
    if (!accessToken || !isAuthorizedToAcknowledge) return;
    setAcknowledgingLeadId(leadId);
    try {
      const res = await acknowledgeLead(accessToken, leadId);
      toast.success("Lead receipt acknowledged successfully");
      handleAcknowledgeSuccess(res.acknowledgement);
    } catch (err: any) {
      toast.error(err.message || "Failed to acknowledge lead receipt");
    } finally {
      setAcknowledgingLeadId(null);
    }
  };

  const handleClaimLead = async (leadId: string) => {
    if (!accessToken) return;
    setClaimingLeadId(leadId);
    try {
      await createLeadClaimRequest(accessToken, leadId);
      toast.success("Claim request submitted! Awaiting Super Admin approval.");
      setPendingClaimLeadIds((prev) => new Set(prev).add(leadId));
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        setPendingClaimLeadIds((prev) => new Set(prev).add(leadId));
      }
      toast.error(err.message || "Failed to submit claim request");
    } finally {
      setClaimingLeadId(null);
    }
  };

  const loadLeads = useCallback(async () => {
    if (!accessToken) return;

    // Abort any pending in-flight request before dispatching a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentRequestId = ++latestRequestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchLeads(
        accessToken,
        {
          search: debouncedSearch,
          status: selectedStatus,
          time: selectedTime,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          colleges: selectedColleges.length > 0 ? selectedColleges : undefined,
          ownerId: (canFilterByOwner && selectedOwners.length > 0) ? selectedOwners : undefined,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          date: paramDate || undefined,
          teamId: paramTeamId || undefined,
          assignedToId: (canFilterByOwner && paramAssignedToId) ? paramAssignedToId : undefined,
          admissionDueDate: paramAdmissionDueDate || undefined,
          admissionOverdue: paramAdmissionOverdue || undefined,
        },
        controller.signal
      );

      // Stale response guard: ignore if a newer request has already been initiated
      if (currentRequestId !== latestRequestIdRef.current) {
        return;
      }

      if (Array.isArray(res)) {
        setLeads(res);
        setTotalLeads(res.length);
        setTotalPages(Math.ceil(res.length / ITEMS_PER_PAGE) || 1);
      } else {
        setLeads(res.data || []);
        setTotalLeads(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }
      if (currentRequestId === latestRequestIdRef.current) {
        console.error("Failed to load leads:", err);
        setError(err.message || "Failed to load lead pipeline records.");
      }
    } finally {
      if (currentRequestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    accessToken,
    debouncedSearch,
    selectedStatus,
    selectedTime,
    fromDate,
    toDate,
    selectedColleges,
    selectedOwners,
    currentPage,
    paramDate,
    paramTeamId,
    paramAssignedToId,
    paramAdmissionDueDate,
    paramAdmissionOverdue,
  ]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleExportExcel = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      await exportLeadsExcel(accessToken, {
        search: debouncedSearch,
        status: selectedStatus,
        time: selectedTime,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        colleges: selectedColleges.length > 0 ? selectedColleges : undefined,
        ownerId: (canFilterByOwner && selectedOwners.length > 0) ? selectedOwners : undefined,
        date: paramDate || undefined,
        teamId: paramTeamId || undefined,
        assignedToId: (canFilterByOwner && paramAssignedToId) ? paramAssignedToId : undefined,
        admissionDueDate: paramAdmissionDueDate || undefined,
        admissionOverdue: paramAdmissionOverdue || undefined,
      });
      toast.success("Export successful!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export leads.");
    } finally {
      setIsExporting(false);
    }
  };

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + leads.length, totalLeads);
  const paginatedLeads = leads;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Lead Management
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Track student leads, manage pipeline status stages, pitch college courses, and log TPC calls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLeads}
            title="Refresh leads"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setIsCreateLeadOpen(true)}
            className="
              flex items-center gap-2
              rounded-lg
              bg-primary-500
              px-4 py-2.5
              text-sm font-medium
              text-white
              transition
              hover:bg-primary-600
              shadow-sm
            "
          >
            <Plus size={18} />
            Create Lead
          </button>
        </div>
      </div>

      {/* Active URL Filter Banner */}
      {hasActiveUrlFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50/80 p-3.5 text-xs text-primary-900 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap font-medium">
            <Filter size={15} className="text-primary-600 shrink-0" />
            <span className="font-bold">Active Drill-Down Filter:</span>
            {paramDate && (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-primary-200 font-semibold text-primary-800">
                Created: {paramDate}
              </span>
            )}
            {paramStatus && (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-primary-200 font-semibold text-primary-800">
                Status: {paramStatus}
              </span>
            )}
            {paramTeamId && (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-primary-200 font-semibold text-primary-800">
                Team #{paramTeamId}
              </span>
            )}
            {paramAssignedToId && canFilterByOwner && (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-primary-200 font-semibold text-primary-800">
                Advisor #{paramAssignedToId}
              </span>
            )}
            <span className="ml-1 font-semibold text-primary-700">
              (Showing {leads.length} of {totalLeads} matching database leads)
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="flex items-center gap-1.5 rounded-lg border border-primary-300 bg-surface px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 hover:text-primary-900 transition shadow-2xs"
          >
            <X size={14} />
            Clear Filters & Show All {totalLeads} Leads
          </button>
        </div>
      )}

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full min-w-0">
        {/* Search Input */}
        <div className="relative flex-1 w-full min-w-0">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search leads by name, email, phone number, course interested, or city..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="
              h-11
              w-full
              rounded-xl
              border
              border-border
              bg-surface
              pl-11
              pr-10
              text-sm
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
            "
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative w-full sm:w-auto sm:min-w-[150px]">
          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="
                h-11
                w-full
                rounded-xl
                border
                border-border
                bg-surface
                pl-10
                pr-9
                text-sm
                font-medium
                text-text-primary
                outline-none
                transition
                focus:border-primary-500
                focus:ring-2
                focus:ring-primary-100
                appearance-none
                cursor-pointer
              "
            >
              <option value="ALL">All</option>
              {dbStatuses.length > 0 ? (
                dbStatuses.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name === "LEAD" ? "Active Leads" : st.name}
                  </option>
                ))
              ) : (
                <option value="LEAD">Active Leads</option>
              )}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Time Filter Dropdown */}
        <div className="relative w-full sm:w-auto sm:min-w-[140px]">
          <div className="relative">
            <Clock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <select
              value={selectedTime}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "custom") {
                  setPickerFromDate(fromDate);
                  setPickerToDate(toDate);
                  setIsCustomRangeOpen(true);
                } else {
                  handleTimeChange(val);
                }
              }}
              className="
                h-11
                w-full
                rounded-xl
                border
                border-border
                bg-surface
                pl-10
                pr-9
                text-sm
                font-medium
                text-text-primary
                outline-none
                transition
                focus:border-primary-500
                focus:ring-2
                focus:ring-primary-100
                appearance-none
                cursor-pointer
              "
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">
                {selectedTime === "custom" && (fromDate || toDate)
                  ? `${fromDate || "Start"} to ${toDate || "End"}`
                  : "Custom Range"}
              </option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        <MultiSelectDropdown
          icon={Building2}
          label="College"
          options={collegesList.map(c => ({ id: c.id, label: c.name }))}
          selected={selectedColleges}
          onChange={(val) => {
            setSelectedColleges(val);
            setCurrentPage(1);
          }}
        />

        {canFilterByOwner && (
          <MultiSelectDropdown
            icon={UserCircle}
            label="Owner"
            options={[
              { id: "UNASSIGNED", label: "Unassigned" },
              ...usersList.map(u => ({ id: u.id, label: u.firstName + (u.lastName ? ` ${u.lastName}` : "") }))
            ]}
            selected={selectedOwners}
            onChange={(val) => {
              setSelectedOwners(val);
              setCurrentPage(1);
            }}
          />
        )}

        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="
            flex items-center justify-center gap-2
            w-full sm:w-auto h-11
            rounded-xl
            border border-primary-500
            bg-primary-50 text-primary-700
            px-4
            text-sm font-bold
            transition
            hover:bg-primary-100
            shadow-sm
            disabled:opacity-50
          "
        >
          <Download size={16} className={isExporting ? "animate-bounce" : ""} />
          <span className="whitespace-nowrap">{isExporting ? "Exporting..." : "Export Excel"}</span>
        </button>
      </div>

      {/* Custom Date Range Picker Modal */}
      {isCustomRangeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Clock size={18} className="text-primary-500" />
                Select Custom Date Range
              </h3>
              <button
                type="button"
                onClick={handleCancelCustomRange}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={pickerFromDate}
                  onChange={(e) => setPickerFromDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={pickerToDate}
                  onChange={(e) => setPickerToDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelCustomRange}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-500 text-white hover:bg-primary-600 shadow-sm transition"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        {loading ? (
          <PageLoadingState
            message="Loading lead pipeline records..."
            description="Fetching leads, applications, and assignment details"
            minHeight="min-h-[360px]"
          />
        ) : error ? (
          <PageErrorState
            title="Unable to load leads"
            message={error}
            onRetry={loadLeads}
            minHeight="min-h-[360px]"
          />
        ) : leads.length === 0 ? (
          <PageEmptyState
            icon={Users}
            title={searchTerm ? "No matching leads found" : "No leads found"}
            description={
              searchTerm
                ? `No leads matched your search query "${searchTerm}".`
                : "No lead records match this status pipeline tab."
            }
            actionText={searchTerm ? "Clear Search" : undefined}
            onAction={searchTerm ? handleClearSearch : undefined}
            minHeight="min-h-[360px]"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-neutral-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Lead Name
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Phone
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Email
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Course & Location
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary min-w-[200px] max-w-[280px]">
                      Colleges Pitched
                    </th>
                    {isSuperAdminOrManager && (
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                        Current Owner / Claimed By
                      </th>
                    )}

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLeads.map((lead) => {
                    const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();

                    const acknowledgedAck = lead.acknowledgements?.find((ack) => Boolean(ack.acknowledgedAt));
                    const isAcknowledged = Boolean(acknowledgedAck);

                    let acknowledgedByName = "Authorized User";
                    let acknowledgedRole: "Manager" | "Team Lead" = "Manager";
                    let acknowledgedDateFormatted = "";

                    if (acknowledgedAck) {
                      if (acknowledgedAck.acknowledgedBy) {
                        const fn = acknowledgedAck.acknowledgedBy.firstName || "";
                        const ln = acknowledgedAck.acknowledgedBy.lastName || "";
                        acknowledgedByName = `${fn} ${ln}`.trim() || "Authorized User";
                        acknowledgedRole = getRoleDisplay(acknowledgedAck.acknowledgedBy);
                      } else if (acknowledgedAck.recipient) {
                        const fn = acknowledgedAck.recipient.firstName || "";
                        const ln = acknowledgedAck.recipient.lastName || "";
                        acknowledgedByName = `${fn} ${ln}`.trim() || "Recipient";
                        acknowledgedRole = "Manager";
                      }

                      if (acknowledgedAck.acknowledgedAt) {
                        acknowledgedDateFormatted = new Date(acknowledgedAck.acknowledgedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        });
                      }
                    }

                    const createdDateFormatted = lead.createdAt
                      ? new Date(lead.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "";

                    const statusName = lead.status?.name || "LEAD";
                    const isAdmissionDone = statusName === "ADMISSION_DONE";

                    const activeAssignment = lead.assignments?.find(
                      (a) =>
                        a.status === "ACTIVE" &&
                        a.expiresAt &&
                        new Date(a.expiresAt).getTime() > Date.now()
                    );
                    const hasActiveWindow = Boolean(activeAssignment);

                    const isProtected = [
                      "APPLICATION",
                      "INTERVIEW_SCHEDULED",
                      "INTERVIEW_DONE",
                      "LETTER_OUT",
                    ].includes(statusName);

                    const isClaimRequestPending =
                      pendingClaimLeadIds.has(lead.id) ||
                      Boolean((lead as any).claimRequests?.some((r: any) => r.status === "PENDING"));

                    const isClaimable =
                      !isAdmissionDone &&
                      !hasActiveWindow &&
                      !isProtected &&
                      !isClaimRequestPending &&
                      ["LEAD", "CANCELLED"].includes(statusName);

                    const isAssignmentExpired =
                      !hasActiveWindow &&
                      lead.assignments &&
                      lead.assignments.length > 0;

                    const actionsDisabled =
                      isAssignmentExpired && !isSuperAdminOrManager;

                    const isSuperAdminUser = user?.roleCode === "SUPER_ADMIN";

                    return (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition">
                        <td className="px-5 py-4">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isSuperAdminUser ? (
                                <Link
                                  to={`/leads/${lead.id}`}
                                  className="text-sm font-semibold text-primary-700 hover:text-primary-900 hover:underline transition cursor-pointer"
                                  title="View Super Admin Lead 360 Profile"
                                >
                                  {fullName}
                                </Link>
                              ) : (
                                <span className="text-sm font-semibold text-text-primary">
                                  {fullName}
                                </span>
                              )}

                              {isAcknowledged && (
                                <Tooltip
                                  className="w-max max-w-[280px] bg-neutral-900 border border-neutral-700 text-neutral-100 p-2.5 rounded-lg text-xs shadow-xl cursor-auto"
                                  content={
                                    <div className="flex flex-col gap-1 text-left">
                                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                                        <CheckCircle2 size={13} className="shrink-0" />
                                        <span>Acknowledged</span>
                                      </div>
                                      <div className="text-[11px] text-neutral-200">
                                        <span className="text-neutral-400">By: </span>
                                        <span className="font-medium text-white">{acknowledgedByName}</span>
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-medium text-emerald-300">
                                          {acknowledgedRole}
                                        </span>
                                      </div>
                                      {acknowledgedDateFormatted && (
                                        <div className="text-[10px] text-neutral-400">
                                          <span>{acknowledgedDateFormatted}</span>
                                        </div>
                                      )}
                                    </div>
                                  }
                                >
                                  <button
                                    type="button"
                                    aria-label={`Acknowledged by ${acknowledgedByName} (${acknowledgedRole})${acknowledgedDateFormatted ? ` on ${acknowledgedDateFormatted}` : ""}`}
                                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer focus:outline-none"
                                  >
                                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                                  </button>
                                </Tooltip>
                              )}
                            </div>

                            {createdDateFormatted && (
                              <p className="text-xs text-text-muted mt-0.5">
                                {createdDateFormatted}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-text-secondary">
                          {lead.phone}
                        </td>

                        <td className="px-5 py-4 text-sm text-text-secondary">
                          {lead.email || "N/A"}
                        </td>

                        <td className="px-5 py-4 text-sm text-text-secondary">
                          <div>
                            <p className="font-medium text-text-primary">
                              {lead.courseInterested || "N/A"}
                            </p>
                            {lead.city && (
                              <p className="text-xs text-text-muted">
                                {lead.city}{lead.state ? `, ${lead.state}` : ""}
                              </p>
                            )}
                            {(lead.preferredCity || lead.preferredState) && (
                              <p className="text-[11px] text-text-muted/80">
                                Pref: {[lead.preferredCity, lead.preferredState].filter(Boolean).join(", ")}
                                {lead.preferredBudget != null && ` • ₹${Number(lead.preferredBudget).toLocaleString("en-IN")}`}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-text-secondary min-w-[200px] max-w-[280px]">
                          <CollegesPitchedCell
                            collegeApplications={lead.collegeApplications}
                            negativeColleges={lead.negativeColleges}
                          />
                        </td>

                        {isSuperAdminOrManager && (
                          <td className="px-5 py-4 text-sm text-text-secondary">
                            {(() => {
                              const assignedUser = activeAssignment?.user || (lead.assignments && lead.assignments[0]?.user);
                              const ownerName = assignedUser
                                ? `${assignedUser.firstName} ${assignedUser.lastName || ""}`.trim()
                                : lead.createdBy
                                  ? `${lead.createdBy.firstName} ${lead.createdBy.lastName || ""}`.trim()
                                  : null;

                              const ownerTeamName = (assignedUser as any)?.team?.name;

                              if (ownerName) {
                                return (
                                  <div className="flex flex-col gap-1 items-start">
                                    <div className="flex items-center gap-1.5 font-semibold text-text-primary text-xs">
                                      <UserCheck size={14} className="text-primary-600 shrink-0" />
                                      <span>{ownerName}</span>
                                    </div>
                                    {ownerTeamName && (
                                      <span className="text-[11px] text-text-muted">
                                        Team: {ownerTeamName}
                                      </span>
                                    )}
                                    {hasActiveWindow ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                        Claimed & Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-muted bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
                                        Assigned / Created
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                                  Unclaimed / Pool
                                </span>
                              );
                            })()}
                          </td>
                        )}

                        {/* Actions Column */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Role-based Lead Acknowledgement (Managers, Team Leads, Super Admin only - never PA) */}
                            {isAuthorizedToAcknowledge && !isAcknowledged && (
                              <button
                                type="button"
                                onClick={() => handleAcknowledge(lead.id)}
                                disabled={acknowledgingLeadId === lead.id}
                                title={acknowledgingLeadId === lead.id ? "Acknowledging lead..." : "Acknowledge Lead"}
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition shrink-0 cursor-pointer disabled:opacity-50"
                                aria-label="Acknowledge Lead"
                              >
                                <CheckCircle2 size={16} className={acknowledgingLeadId === lead.id ? "animate-spin text-emerald-600" : "text-emerald-600"} />
                              </button>
                            )}

                            {/* Share on WhatsApp (Authorized Managers / Team Leads only) */}
                            {isAuthorizedToAcknowledge && (
                              <button
                                type="button"
                                onClick={() => setSharingLead(lead)}
                                title="Share on WhatsApp"
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition shrink-0 cursor-pointer"
                                aria-label="Share on WhatsApp"
                              >
                                <Share2 size={16} className="text-emerald-600" />
                              </button>
                            )}

                            {/* Share & Acknowledgement History (Authorized Managers / Team Leads only) */}
                            {isAuthorizedToAcknowledge && (
                              <button
                                type="button"
                                onClick={() => setShareHistoryLead(lead)}
                                title="View Share & Acknowledgement History"
                                className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition shrink-0 cursor-pointer"
                                aria-label="View Share & Acknowledgement History"
                              >
                                <Clock size={16} className="text-text-muted" />
                              </button>
                            )}

                            {/* Copy Lead details (Authorized Managers / Team Leads only) */}
                            {isAuthorizedToAcknowledge && (
                              <button
                                type="button"
                                onClick={() => handleCopyLead(lead)}
                                title={copiedLeadId === lead.id ? "Copied to clipboard!" : "Copy lead details"}
                                className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition shrink-0 cursor-pointer"
                                aria-label="Copy lead details"
                              >
                                {copiedLeadId === lead.id ? (
                                  <Check size={16} className="text-emerald-600" />
                                ) : (
                                  <Copy size={16} className="text-text-muted" />
                                )}
                              </button>
                            )}

                            {/* Claim Lead / View Request */}
                            {isClaimRequestPending ? (
                              isSuperAdminUser ? (
                                <Link
                                  to={ROUTES.CLAIM_REQUESTS}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200/80 bg-amber-50/80 text-amber-800 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 text-xs font-medium transition shrink-0"
                                  title="View claim requests awaiting approval"
                                >
                                  <Eye size={13} className="shrink-0" />
                                  <span>View Request</span>
                                </Link>
                              ) : null
                            ) : (
                              <button
                                onClick={() => isClaimable && handleClaimLead(lead.id)}
                                disabled={!isClaimable || claimingLeadId === lead.id}
                                title={
                                  isAdmissionDone
                                    ? "Leads with completed admission cannot be assigned or reassigned."
                                    : hasActiveWindow
                                      ? "This lead is currently inside an active 4-day assignment window and cannot be reassigned."
                                      : isProtected
                                        ? "This lead has progressed in the pipeline and cannot be reassigned."
                                        : "Submit claim request to Super Admin"
                                }
                                className="p-1.5 rounded-lg border border-border text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border"
                              >
                                <UserCheck size={16} className={claimingLeadId === lead.id ? "animate-spin" : ""} />
                              </button>
                            )}

                            {/* Edit Lead */}
                            <button
                              onClick={() => !actionsDisabled && setEditingLead(lead)}
                              disabled={actionsDisabled}
                              title={actionsDisabled ? "Lead assignment has expired. Actions are disabled." : "Edit Lead Details"}
                              className="p-1.5 rounded-lg border border-border text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* Change Status */}
                            <button
                              onClick={() => !actionsDisabled && setChangingStatusLead(lead)}
                              disabled={actionsDisabled}
                              title={actionsDisabled ? "Lead assignment has expired. Actions are disabled." : "Change Lead Status Stage"}
                              className="p-1.5 rounded-lg border border-border text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border"
                            >
                              <Tag size={16} />
                            </button>

                            {/* TPC (Third Party Calling) */}
                            <button
                              onClick={() => !actionsDisabled && setTpcLead(lead)}
                              disabled={actionsDisabled}
                              title={actionsDisabled ? "Lead assignment has expired. Actions are disabled." : "Third Party Calling (TPC)"}
                              className="p-1.5 rounded-lg border border-border text-purple-600 hover:bg-purple-50 hover:border-purple-200 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border"
                            >
                              <Headphones size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>

            {/* Pagination Footer Bar */}
            {leads.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border px-6 py-4 bg-surface rounded-b-2xl">
                <div className="text-xs text-text-muted font-medium">
                  Showing <span className="font-bold text-text-primary">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-text-primary">{endIndex}</span> of{" "}
                  <span className="font-bold text-text-primary">{totalLeads}</span> leads
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-neutral-50 hover:text-text-primary transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition cursor-pointer ${safeCurrentPage === pageNum
                          ? "bg-primary-500 text-white shadow-2xs"
                          : "border border-border text-text-secondary hover:bg-neutral-50 hover:text-text-primary"
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={safeCurrentPage >= totalPages}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-neutral-50 hover:text-text-primary transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Lead Modal */}
      {isCreateLeadOpen && (
        <CreateLeadModal
          onClose={() => {
            setIsCreateLeadOpen(false);
            loadLeads();
          }}
        />
      )}

      {/* 1. Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSuccess={loadLeads}
        />
      )}

      {/* 2. Change Status Modal */}
      {changingStatusLead && (
        <ChangeStatusModal
          lead={changingStatusLead}
          onClose={() => setChangingStatusLead(null)}
          onSuccess={loadLeads}
        />
      )}

      {/* 3. TPC Modal */}
      {tpcLead && (
        <TPCModal
          lead={tpcLead}
          onClose={() => setTpcLead(null)}
          onSuccess={loadLeads}
        />
      )}

      {/* 4. Share Lead via WhatsApp Modal */}
      {sharingLead && (
        <ShareLeadModal
          lead={sharingLead}
          users={usersList}
          onClose={() => setSharingLead(null)}
          onSuccess={handleShareSuccess}
        />
      )}

      {/* 5. Share & Acknowledgement History Drawer */}
      {shareHistoryLead && (
        <ShareHistoryDrawer
          lead={shareHistoryLead}
          currentUserId={user?.sub || (user as any)?.id}
          onClose={() => setShareHistoryLead(null)}
          onOpenNewShare={() => {
            const targetLead = shareHistoryLead;
            setShareHistoryLead(null);
            setSharingLead(targetLead);
          }}
          onAcknowledgeSuccess={handleAcknowledgeSuccess}
        />
      )}
    </div>
  );
};

export default LeadPage;