import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  UserCheck,
  Database,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchLeadsForReallocation, reallocateLead, fetchLeadStatuses, type LeadStatusItem } from "../../../services/leadService";
import { fetchEligibleProgramAdvisors, type EligibleProgramAdvisor } from "../../../services/dataManagementService";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

// Helper for formatting time
function formatExpiryTime(expiresAtStr?: string): string {
  if (!expiresAtStr) return "";
  const expiry = new Date(expiresAtStr).getTime();
  const now = Date.now();
  const diffMs = expiry - now;
  if (diffMs <= 0) return "Expired";
  const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
  if (hoursLeft < 24) return `${hoursLeft}h left`;
  const daysLeft = Math.floor(hoursLeft / 24);
  return `${daysLeft}d ${hoursLeft % 24}h left`;
}

const DEFAULT_LEAD_STATUSES: LeadStatusItem[] = [
  { id: 1, name: "LEAD", color: "blue" },
  { id: 2, name: "APPLICATION", color: "yellow" },
  { id: 3, name: "INTERVIEW_SCHEDULED", color: "orange" },
  { id: 4, name: "INTERVIEW_DONE", color: "purple" },
  { id: 5, name: "LETTER_OUT", color: "pink" },
  { id: 6, name: "ADMISSION_DONE", color: "green" },
  { id: 7, name: "CANCELLED", color: "red" },
];

const LeadReallocationPage = () => {
  const { accessToken, user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSuperAdmin =
    user?.roleCode === "SUPER_ADMIN" ||
    user?.roleId === 1 ||
    (user?.roleName || "").toUpperCase().replace(/[\s-]/g, "_").includes("SUPER_ADMIN");

  const urlSearch = searchParams.get("search") || "";
  const urlAssignmentStatus = searchParams.get("assignmentStatus") || "ALL";
  const urlLeadStatus = searchParams.get("leadStatus") || "ALL";
  const urlLeadId = searchParams.get("leadId") || "";

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [assignmentStatus, setAssignmentStatus] = useState<string>(urlAssignmentStatus);
  const [selectedStatus, setSelectedStatus] = useState<string>(urlLeadStatus);
  const [availableStatuses, setAvailableStatuses] = useState<LeadStatusItem[]>(DEFAULT_LEAD_STATUSES);

  const [advisors, setAdvisors] = useState<EligibleProgramAdvisor[]>([]);

  // Modals
  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [selectedLeadForReallocation, setSelectedLeadForReallocation] = useState<any | null>(null);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>("");
  const [isReallocating, setIsReallocating] = useState(false);

  // Sync state whenever URL query params change (e.g. from Global Search)
  useEffect(() => {
    setSearchTerm(urlSearch);
    setDebouncedSearch(urlSearch);
    setAssignmentStatus(urlAssignmentStatus);
    setSelectedStatus(urlLeadStatus);
    setCurrentPage(1);
  }, [urlSearch, urlAssignmentStatus, urlLeadStatus, urlLeadId]);

  useEffect(() => {
    if (accessToken) {
      fetchEligibleProgramAdvisors(accessToken)
        .then((res) => setAdvisors(res))
        .catch(console.error);

      fetchLeadStatuses(accessToken)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setAvailableStatuses(res);
          }
        })
        .catch(console.error);
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadLeads = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (urlLeadId) {
        params.append("leadId", urlLeadId);
      }
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      if (assignmentStatus && assignmentStatus !== "ALL") params.append("assignmentStatus", assignmentStatus);
      if (selectedStatus && selectedStatus !== "ALL") params.append("leadStatus", selectedStatus);
      params.append("page", currentPage.toString());
      params.append("limit", ITEMS_PER_PAGE.toString());

      const response = await fetchLeadsForReallocation(accessToken, params);
      setLeads(response.data);
      setTotalLeads(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      const msg = err.message || "Failed to load leads for reallocation";
      setError(msg);
      toast.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, urlLeadId, debouncedSearch, assignmentStatus, selectedStatus, currentPage, toast]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Auto-scroll to selected lead if initiated from search
  useEffect(() => {
    if (urlLeadId && leads.length > 0) {
      const targetRow = document.getElementById(`lead-row-${urlLeadId}`);
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [urlLeadId, leads]);

  const handleAssignmentStatusChange = (val: string) => {
    setAssignmentStatus(val);
    setCurrentPage(1);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set("assignmentStatus", val);
      return p;
    });
  };

  const handleLeadStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set("leadStatus", val);
      return p;
    });
  };

  const openReallocateModal = (lead: any) => {
    setSelectedLeadForReallocation(lead);
    setSelectedAdvisorId("");
    setReallocateModalOpen(true);
  };

  const submitReallocation = async () => {
    if (!selectedAdvisorId || !selectedLeadForReallocation || !accessToken) return;
    setIsReallocating(true);
    try {
      await reallocateLead(selectedLeadForReallocation.id, selectedAdvisorId, accessToken);
      toast.showToast("Lead successfully reallocated!", "success");
      setReallocateModalOpen(false);
      loadLeads();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to reallocate lead", "error");
    } finally {
      setIsReallocating(false);
    }
  };

  const selectedAdvisor = advisors.find((adv) => adv.id === selectedAdvisorId);

  const getLeadCurrentOwnerDisplay = (lead: any) => {
    if (lead?.computedCurrentOwner) {
      const owner = lead.computedCurrentOwner;
      const role = owner.role?.name ? ` (${owner.role.name})` : "";
      return `${owner.firstName} ${owner.lastName || ""}${role}`.trim();
    }
    if (lead?.latestAssignment?.user) {
      const prev = lead.latestAssignment.user;
      return `${prev.firstName} ${prev.lastName || ""} (Expired)`.trim();
    }
    return "Unassigned";
  };

  const handleSearchInputChange = (val: string) => {
    setSearchTerm(val);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val) {
        p.set("search", val);
      } else {
        p.delete("search");
      }
      p.delete("leadId");
      return p;
    });
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="text-primary-600" size={26} />
            Lead Reallocation Workspace
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isSuperAdmin
              ? "Reassign any lead across the organization to an eligible Program Advisor or Manager."
              : "Reassign leads that have expired or are unassigned to a Program Advisor."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLeads}
            title="Refresh lead data"
            className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Control Panel */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        {/* Active Selection / Direct Search Banner */}
        {urlLeadId && (
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200/80 dark:border-primary-800/80 rounded-xl text-xs text-text-primary">
            <span className="flex items-center gap-2 font-medium">
              <UserCheck size={15} className="text-primary-600 dark:text-primary-400 shrink-0" />
              <span>
                Filtered to lead selected from Global Search{" "}
                {leads.length === 1 && (
                  <strong className="text-text-primary">
                    ({leads[0].firstName} {leads[0].lastName || ""})
                  </strong>
                )}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.delete("leadId");
                  p.delete("search");
                  return p;
                });
                setSearchTerm("");
                setDebouncedSearch("");
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-300 hover:underline cursor-pointer ml-2 shrink-0"
            >
              <X size={13} />
              Show all leads
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by lead name, phone, email..."
            value={searchTerm}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-text-primary outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Assignment Status Select */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={assignmentStatus}
              onChange={(e) => handleAssignmentStatusChange(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary shadow-2xs outline-none transition focus:border-primary-500"
            >
              <option value="ALL">Assignment Status: All</option>
              <option value="ACTIVE">Assignment Status: Active</option>
              <option value="EXPIRED">Assignment Status: Expired</option>
              <option value="UNASSIGNED">Assignment Status: Unassigned</option>
            </select>
          </div>

          {/* Lead Status Select */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedStatus}
              onChange={(e) => handleLeadStatusChange(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary shadow-2xs outline-none transition focus:border-primary-500"
            >
              <option value="ALL">Lead Status: All</option>
              {availableStatuses.map((st) => (
                <option key={st.id || st.name} value={st.name}>
                  Lead Status: {st.name.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50/50 border-b border-border">
              <tr>
                <th className="px-5 py-4 font-semibold text-text-secondary">Name</th>
                <th className="px-5 py-4 font-semibold text-text-secondary">Phone</th>
                <th className="px-5 py-4 font-semibold text-text-secondary">Status</th>
                <th className="px-5 py-4 font-semibold text-text-secondary">Assignment Status</th>
                <th className="px-5 py-4 font-semibold text-text-secondary">Current Owner</th>
                <th className="px-5 py-4 font-semibold text-text-secondary">Expires At</th>
                <th className="px-5 py-4 font-semibold text-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={7}
                  message="Loading leads for reallocation..."
                  description="Retrieving current owners, assignments, and expiry timer data"
                />
              ) : error ? (
                <PageErrorState
                  isTableRow
                  colSpan={7}
                  title="Unable to load leads for reallocation"
                  message={error}
                  onRetry={loadLeads}
                />
              ) : leads.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={7}
                  icon={Database}
                  title="No eligible leads found"
                  description="No leads match the selected status or assignment filter."
                />
              ) : (
                leads.map((lead) => {
                  const isSelected = lead.id === urlLeadId;
                  const collegeName =
                    lead.finalCollege?.name ||
                    lead.collegeApplications?.[0]?.college?.name ||
                    lead.graduationCollegeName;

                  return (
                    <tr
                      key={lead.id}
                      id={`lead-row-${lead.id}`}
                      className={`transition-colors h-16 ${
                        isSelected
                          ? "bg-primary-50/70 dark:bg-primary-950/50 ring-2 ring-primary-500/60"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      <td className="px-5">
                        <div className="font-semibold text-text-primary flex items-center gap-2">
                          <span>
                            {lead.firstName} {lead.lastName || ""}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-primary-600 text-white shadow-2xs">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">{lead.email}</div>
                        {collegeName && (
                          <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
                            <Building2 size={11} className="shrink-0 text-primary-500" />
                            <span className="truncate max-w-[200px]">{collegeName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 font-medium text-text-secondary">{lead.phone}</td>
                      <td className="px-5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border"
                          style={{
                            backgroundColor: lead.status?.color ? `${lead.status.color}15` : "#e2e8f0",
                            color: lead.status?.color || "#475569",
                            borderColor: lead.status?.color ? `${lead.status.color}30` : "#cbd5e1",
                          }}
                        >
                          {lead.status?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                            lead.computedAssignmentStatus === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : lead.computedAssignmentStatus === "EXPIRED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                          }`}
                        >
                          {lead.computedAssignmentStatus}
                        </span>
                      </td>
                      <td className="px-5 text-sm font-medium text-text-secondary">
                        {lead.computedCurrentOwner
                          ? `${lead.computedCurrentOwner.firstName} ${lead.computedCurrentOwner.lastName || ""}`
                          : "—"}
                      </td>
                      <td className="px-5 text-sm font-medium text-text-secondary">
                        {lead.latestAssignment?.expiresAt ? (
                          <span
                            className={
                              lead.computedAssignmentStatus === "ACTIVE"
                                ? "text-emerald-600 font-semibold"
                                : ""
                            }
                          >
                            {formatExpiryTime(lead.latestAssignment.expiresAt)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 text-right">
                        <button
                          onClick={() => openReallocateModal(lead)}
                          disabled={
                            !isSuperAdmin &&
                            (lead.computedAssignmentStatus === "ACTIVE" ||
                              lead.status?.name === "ADMISSION_DONE")
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-semibold transition border border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                        >
                          <UserPlus size={14} />
                          Reallocate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && leads.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-neutral-50/50">
            <span className="text-xs font-medium text-text-secondary">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalLeads)} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalLeads)} of {totalLeads} leads
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-border hover:shadow-2xs disabled:opacity-50 text-text-secondary transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-text-primary min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-border hover:shadow-2xs disabled:opacity-50 text-text-secondary transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reallocate Lead Drawer */}
      {reallocateModalOpen && selectedLeadForReallocation && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isReallocating && setReallocateModalOpen(false)}
        >
          <div
            className="bg-surface w-full max-w-md h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-neutral-50/50 shrink-0">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <UserPlus size={20} className="text-primary-600" />
                Reallocate Lead
              </h3>
              <button
                onClick={() => setReallocateModalOpen(false)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-white border border-transparent hover:border-border transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Target Lead & Current Owner Card */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-border space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-text-secondary mb-1">Target Lead</p>
                  <p className="font-bold text-text-primary text-lg">
                    {selectedLeadForReallocation.firstName} {selectedLeadForReallocation.lastName || ""}
                  </p>
                  <p className="text-sm font-medium text-text-muted mt-0.5">
                    {selectedLeadForReallocation.phone} • {selectedLeadForReallocation.email || "No email"}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">Lead Status:</span>
                  <span className="font-semibold text-text-primary uppercase">
                    {selectedLeadForReallocation.status?.name || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">Assignment Status:</span>
                  <span className={`font-semibold uppercase ${
                    selectedLeadForReallocation.computedAssignmentStatus === "ACTIVE"
                      ? "text-emerald-600"
                      : selectedLeadForReallocation.computedAssignmentStatus === "EXPIRED"
                        ? "text-rose-600"
                        : "text-neutral-600"
                  }`}>
                    {selectedLeadForReallocation.computedAssignmentStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">Current Owner:</span>
                  <span className="font-semibold text-text-primary">
                    {getLeadCurrentOwnerDisplay(selectedLeadForReallocation)}
                  </span>
                </div>
              </div>

              {/* Recipient Selector */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  {isSuperAdmin
                    ? "Assign to Program Advisor or Manager"
                    : "Assign to Program Advisor"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedAdvisorId}
                  onChange={(e) => setSelectedAdvisorId(e.target.value)}
                  className="w-full h-12 bg-surface border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition shadow-2xs"
                >
                  <option value="">Select an Advisor or Manager...</option>
                  {advisors.map((adv) => {
                    const fullName = `${adv.firstName} ${adv.lastName || ""}`.trim();
                    const roleName = adv.role?.name || "Advisor";
                    const teamName = adv.team?.name ? ` • ${adv.team.name}` : "";
                    return (
                      <option key={adv.id} value={adv.id}>
                        {fullName} ({roleName}{teamName})
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-text-muted mt-1.5">
                  Eligible Program Advisors and Managers across teams.
                </p>
              </div>

              {/* Current Owner -> Selected Recipient Confirmation Preview */}
              {selectedAdvisor && (
                <div className="bg-primary-50/70 border border-primary-200 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold text-primary-900 uppercase tracking-wide">
                    Reallocation Preview
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-text-secondary font-medium min-w-[70px]">From:</span>
                    <span className="font-semibold text-text-primary">
                      {getLeadCurrentOwnerDisplay(selectedLeadForReallocation)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-primary-800 font-semibold min-w-[70px] flex items-center gap-1">
                      To <ArrowRight size={12} />
                    </span>
                    <span className="font-bold text-primary-950">
                      {selectedAdvisor.firstName} {selectedAdvisor.lastName || ""} ({selectedAdvisor.role?.name || "Advisor"}{selectedAdvisor.team?.name ? ` • ${selectedAdvisor.team.name}` : ""})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-neutral-50/50 shrink-0">
              <button
                onClick={() => setReallocateModalOpen(false)}
                disabled={isReallocating}
                className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary bg-surface border border-border rounded-xl transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                onClick={submitReallocation}
                disabled={!selectedAdvisorId || isReallocating}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isReallocating && <RefreshCw size={16} className="animate-spin" />}
                Confirm Reallocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadReallocationPage;
