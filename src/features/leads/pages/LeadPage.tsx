import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Plus,

  Search,
  RefreshCw,
  Users,
  Pencil,
  Tag,
  Headphones,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  XCircle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import CreateLeadModal from "../components/CreateLeadModal";
import EditLeadModal from "../components/EditLeadModal";
import ChangeStatusModal from "../components/ChangeStatusModal";
import TPCModal from "../components/TPCModal";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchLeads, createLeadClaimRequest, type LeadItem } from "../../../services/leadService";

export type StatusTabType = "ALL" | "LEAD" | "INTERESTED" | "ADMISSION" | "CLOSED";

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

const LeadPage = () => {
  const { accessToken, user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSuperAdminOrManager = user?.roleCode === "SUPER_ADMIN" || user?.roleCode === "MANAGER";


  const paramDate = searchParams.get("date");
  const paramStatus = searchParams.get("status");
  const paramTeamId = searchParams.get("teamId");
  const paramAssignedToId = searchParams.get("assignedToId");
  const paramAdmissionDueDate = searchParams.get("admissionDueDate");
  const paramAdmissionOverdue = searchParams.get("admissionOverdue");

  const hasActiveUrlFilters = Boolean(
    paramDate || paramStatus || paramTeamId || paramAssignedToId || paramAdmissionDueDate || paramAdmissionOverdue
  );

  const handleClearAllFilters = () => {
    setSearchParams({});
    setActiveStatusTab("ALL");
    setSearchTerm("");
  };

  const handleTabClick = (tab: StatusTabType) => {
    setActiveStatusTab(tab);
    if (tab === "ALL") {
      setSearchParams({});
    }
  };


  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTabType>("ALL");
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeStatusTab, searchParams]);

  // Active Lead Action States
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [changingStatusLead, setChangingStatusLead] = useState<LeadItem | null>(null);
  const [tpcLead, setTpcLead] = useState<LeadItem | null>(null);
  const [claimingLeadId, setClaimingLeadId] = useState<string | null>(null);
  const [pendingClaimLeadIds, setPendingClaimLeadIds] = useState<Set<string>>(new Set());

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
    setLoading(true);
    try {
      const data = await fetchLeads(accessToken);
      setLeads(data);
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${lead.firstName} ${lead.lastName || ""}`.toLowerCase();
    const phone = lead.phone.toLowerCase();
    const email = (lead.email || "").toLowerCase();
    const course = (lead.courseInterested || "").toLowerCase();
    const city = (lead.city || "").toLowerCase();

    const matchesSearch =
      fullName.includes(term) ||
      phone.includes(term) ||
      email.includes(term) ||
      course.includes(term) ||
      city.includes(term);

    if (!matchesSearch) return false;

    // Filter by URL query parameters if present
    if (paramDate === "today") {
      const leadDate = new Date(lead.createdAt).toDateString();
      const todayDate = new Date().toDateString();
      if (leadDate !== todayDate) return false;
    }

    if (paramTeamId && paramTeamId !== "all") {
      const activeAssign = lead.assignments?.[0];
      const teamId = (activeAssign?.user as any)?.teamId || (activeAssign?.user as any)?.team?.id;
      if (teamId?.toString() !== paramTeamId) return false;
    }

    if (paramAssignedToId) {
      const assignedUserId = lead.assignments?.[0]?.user?.id;
      if (assignedUserId !== paramAssignedToId) return false;
    }


    const statusName = (lead.status?.name || "LEAD").toUpperCase();

    if (paramStatus && paramStatus.toUpperCase() !== "ALL") {
      if (statusName !== paramStatus.toUpperCase()) return false;
    }

    if (paramAdmissionDueDate === "today") {
      const leadDate = new Date(lead.createdAt).toDateString();
      const todayDate = new Date().toDateString();
      if (leadDate !== todayDate && !["APPLICATION", "INTERVIEW_SCHEDULED", "LETTER_OUT"].includes(statusName)) {
        return false;
      }
    }

    if (paramAdmissionOverdue === "true") {
      if (!["APPLICATION", "INTERVIEW_SCHEDULED", "LETTER_OUT"].includes(statusName)) return false;
    }

    if (activeStatusTab === "ALL") return true;
    if (activeStatusTab === "LEAD") return statusName === "LEAD" || statusName === "NEW" || statusName === "CONNECTED";
    if (activeStatusTab === "INTERESTED")
      return (
        ["APPLICATION", "INTERVIEW_SCHEDULED", "INTERVIEW_DONE", "LETTER_OUT"].includes(statusName) ||
        statusName.includes("INTEREST") ||
        statusName.includes("PITCH") ||
        statusName.includes("FOLLOWER")
      );
    if (activeStatusTab === "ADMISSION") return statusName.includes("ADMISSION") || statusName.includes("HIRED") || statusName.includes("ENROLLED");
    if (activeStatusTab === "CLOSED") return statusName.includes("CLOSE") || statusName.includes("CANCEL") || statusName.includes("REJECT");

    return true;
  });

  // Dynamic counts for each status pipeline tab
  const tabCounts = useMemo(() => {
    let leadCount = 0;
    let interestedCount = 0;
    let admissionCount = 0;
    let closedCount = 0;

    leads.forEach((lead) => {
      const statusName = (lead.status?.name || "LEAD").toUpperCase();
      if (statusName === "LEAD" || statusName === "NEW" || statusName === "CONNECTED") {
        leadCount++;
      } else if (
        ["APPLICATION", "INTERVIEW_SCHEDULED", "INTERVIEW_DONE", "LETTER_OUT"].includes(statusName) ||
        statusName.includes("INTEREST") ||
        statusName.includes("PITCH") ||
        statusName.includes("FOLLOWER")
      ) {
        interestedCount++;
      } else if (statusName.includes("ADMISSION") || statusName.includes("HIRED") || statusName.includes("ENROLLED")) {
        admissionCount++;
      } else if (statusName.includes("CLOSE") || statusName.includes("CANCEL") || statusName.includes("REJECT")) {
        closedCount++;
      }
    });

    return {
      all: leads.length,
      lead: leadCount,
      interested: interestedCount,
      admission: admissionCount,
      closed: closedCount,
    };
  }, [leads]);

  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalLeads);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);


  const getStatusBadgeStyle = (statusName?: string) => {
    const name = (statusName || "LEAD").toUpperCase();
    if (name.includes("ADMISSION") || name.includes("ENROLLED") || name.includes("HIRED")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
    if (name.includes("LETTER_OUT") || name.includes("OFFER")) {
      return "bg-pink-100 text-pink-800 border-pink-300";
    }
    if (name.includes("INTERVIEW_DONE") || name.includes("PASSED")) {
      return "bg-purple-100 text-purple-800 border-purple-300";
    }
    if (name.includes("INTERVIEW_SCHEDULED") || name.includes("SCHEDULED")) {
      return "bg-orange-100 text-orange-800 border-orange-300";
    }
    if (name.includes("APPLICATION") || name.includes("APPLIED")) {
      return "bg-amber-100 text-amber-800 border-amber-300";
    }
    if (name.includes("CLOSE") || name.includes("CANCEL") || name.includes("REJECT")) {
      return "bg-rose-100 text-rose-800 border-rose-300";
    }
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

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
            {paramAssignedToId && (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-primary-200 font-semibold text-primary-800">
                Advisor #{paramAssignedToId}
              </span>
            )}
            <span className="ml-1 font-semibold text-primary-700">
              (Showing {filteredLeads.length} of {leads.length} total database leads)
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="flex items-center gap-1.5 rounded-lg border border-primary-300 bg-surface px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 hover:text-primary-900 transition shadow-2xs"
          >
            <X size={14} />
            Clear Filters & Show All {leads.length} Leads
          </button>
        </div>
      )}

      {/* Status Pipeline Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => handleTabClick("ALL")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${activeStatusTab === "ALL"
              ? "bg-primary-500 text-white shadow-xs"
              : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <Users size={14} />
          All Leads ({tabCounts.all})
        </button>

        <button
          onClick={() => handleTabClick("LEAD")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${activeStatusTab === "LEAD"
              ? "bg-primary-500 text-white shadow-xs"
              : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <Clock size={14} />
          New / Active Leads ({tabCounts.lead})
        </button>

        <button
          onClick={() => handleTabClick("INTERESTED")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${activeStatusTab === "INTERESTED"
              ? "bg-primary-500 text-white shadow-xs"
              : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <Briefcase size={14} />
          Application Done ({tabCounts.interested})
        </button>

        <button
          onClick={() => handleTabClick("ADMISSION")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${activeStatusTab === "ADMISSION"
              ? "bg-primary-500 text-white shadow-xs"
              : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <CheckCircle2 size={14} />
          Admissions Confirmed ({tabCounts.admission})
        </button>

        <button
          onClick={() => handleTabClick("CLOSED")}
          className={`
            flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition
            ${activeStatusTab === "CLOSED"
              ? "bg-primary-500 text-white shadow-xs"
              : "bg-surface text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
            }
          `}
        >
          <XCircle size={14} />
          Closed / Cancelled ({tabCounts.closed})
        </button>
      </div>


      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />

        <input
          type="text"
          placeholder="Search leads by name, email, phone number, course interested, or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            h-11
            w-full
            rounded-xl
            border
            border-border
            bg-surface
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-primary-500
            focus:ring-2
            focus:ring-primary-100
          "
        />
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-text-secondary">
            <RefreshCw className="animate-spin mr-2" size={18} />
            Loading lead pipeline records...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
              <Users size={24} />
            </div>
            <h3 className="text-base font-semibold text-text-primary">No leads found</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              {searchTerm
                ? "No leads matched your search query."
                : "No lead records match this status pipeline tab."}
            </p>
          </div>
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
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Colleges Pitched
                    </th>
                    {isSuperAdminOrManager && (
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                        Current Owner / Claimed By
                      </th>
                    )}

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLeads.map((lead) => {
                    const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();
                    const shortId = `LD${lead.id.slice(0, 4).toUpperCase()}`;

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
                      isAssignmentExpired && user?.roleCode !== "SUPER_ADMIN";

                    const isSuperAdminUser = user?.roleCode === "SUPER_ADMIN";

                    return (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition">
                        <td className="px-5 py-4">
                          <div>
                            {isSuperAdminUser ? (
                              <Link
                                to={`/leads/${lead.id}`}
                                className="text-sm font-semibold text-primary-700 hover:text-primary-900 hover:underline transition cursor-pointer"
                                title="View Super Admin Lead 360 Profile"
                              >
                                {fullName}
                              </Link>
                            ) : (
                              <p className="text-sm font-semibold text-text-primary">
                                {fullName}
                              </p>
                            )}
                            <p className="text-xs text-text-muted font-mono">
                              #{shortId}
                            </p>
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
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-text-secondary">
                          {lead.collegeApplications && lead.collegeApplications.length > 0 ? (
                            <div className="flex flex-col gap-1.5 items-start max-w-[240px]">
                              {lead.collegeApplications.map((app) => {
                                const rawColor = app.status?.color || "#3b82f6";
                                return (
                                  <span
                                    key={app.id}
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium max-w-full transition-all"
                                    style={{
                                      backgroundColor: `color-mix(in srgb, ${rawColor} 12%, transparent)`,
                                      borderColor: `color-mix(in srgb, ${rawColor} 30%, transparent)`,
                                      color: `color-mix(in srgb, ${rawColor} 90%, #ffffff)`,
                                    }}
                                    title={`${app.college?.name || "College"}${app.status?.name ? ` (${app.status.name})` : ""}`}
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: rawColor }}
                                    />
                                    <span className="truncate">
                                      {app.college?.name || "College"}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">None</span>
                          )}
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



                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeStyle(statusName)}`}>
                              {statusName.replace(/_/g, " ")}
                            </span>

                            {isAdmissionDone ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-300 px-2 py-0.5 text-[10px] font-semibold">
                                Admission Done (Locked)
                              </span>
                            ) : hasActiveWindow ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold"
                                title={`Active 4-day window assigned to ${activeAssignment?.user?.firstName || 'User'}`}
                              >
                                <Clock size={10} />
                                Active ({formatExpiryTime(activeAssignment?.expiresAt)})
                              </span>
                            ) : isClaimRequestPending ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                                <Clock size={10} />
                                Claim Request Pending
                              </span>
                            ) : isProtected ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold">
                                Pipeline Protected
                              </span>
                            ) : isClaimable ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                                Claimable
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                Expired
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions Column: 1. Claim Lead, 2. Edit Lead, 3. Change Status, 4. TPC */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Claim Lead Button */}
                            {isClaimRequestPending ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg"
                                title="Claim request is currently pending Super Admin approval"
                              >
                                <Clock size={13} className="shrink-0" />
                                Request Pending
                              </span>
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
            {filteredLeads.length > 0 && (
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
    </div>
  );
};

export default LeadPage;