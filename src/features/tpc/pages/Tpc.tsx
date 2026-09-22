import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PhoneCall,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Trash2,
  GraduationCap,
  Calendar,
  Phone,
  FileText,
  XCircle,
  HelpCircle,
  History,
  User,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchMyTpcs,
  fetchAssignedTpcs,
  updateTpcAssignmentStatus,
  deleteTpcAssignment,
  type TPCUserItem,
  type TPCStatus,
} from "../../../services/tpcService";
import TPCModal from "../../leads/components/TPCModal";
import TpcCallModal from "../components/TpcCallModal";
import AddNoteModal from "../components/AddNoteModal";
import InteractionHistoryModal from "../components/InteractionHistoryModal";
import { type LeadItem } from "../../../services/leadService";

type TabType = "MY_TPCS" | "ASSIGNED_TPCS";
type FilterStatusType = "ALL" | "PENDING" | "COMPLETED" | "NO_REPLY" | "NOT_INTERESTED";
type DateFilterType = "ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "CUSTOM";

const Tpc = () => {
  const { accessToken, user } = useAuth();
  const toast = useToast();
  const currentUserId = user?.sub;

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabType = tabParam === "assigned" ? "ASSIGNED_TPCS" : "MY_TPCS";

  // Data states
  const [myTpcs, setMyTpcs] = useState<TPCUserItem[]>([]);
  const [assignedTpcs, setAssignedTpcs] = useState<TPCUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const statusParam = searchParams.get("status");
  const initialStatusFilter: FilterStatusType =
    statusParam === "PENDING"
      ? "PENDING"
      : statusParam === "COMPLETED"
        ? "COMPLETED"
        : "ALL";

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatusType>(initialStatusFilter);

  const [dateFilter, setDateFilter] = useState<DateFilterType>("TODAY");
  const [customDate, setCustomDate] = useState<string>("");

  // Global Assign TPC Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<LeadItem | undefined>(undefined);

  // Call Modal State
  const [callModalAssignment, setCallModalAssignment] = useState<TPCUserItem | null>(null);

  // Add Note Modal State
  const [noteModalAssignment, setNoteModalAssignment] = useState<TPCUserItem | null>(null);

  // History Modal State
  const [historyModalAssignment, setHistoryModalAssignment] = useState<TPCUserItem | null>(null);

  // Updating assignment state tracker
  const [updatingAssignmentId, setUpdatingAssignmentId] = useState<string | null>(null);

  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [myRes, assignedRes] = await Promise.all([
        fetchMyTpcs(accessToken),
        fetchAssignedTpcs(accessToken),
      ]);
      setMyTpcs(
        currentUserId ? myRes.filter((item) => item.assignedById === currentUserId) : myRes
      );
      setAssignedTpcs(
        currentUserId ? assignedRes.filter((item) => item.assignedToId === currentUserId) : assignedRes
      );
    } catch (err: any) {
      console.error("Error loading TPC data:", err);
      toast.showToast(err.message || "Failed to load TPC records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  // Handle Quick Status Update
  const handleUpdateStatus = async (assignment: TPCUserItem, newStatus: TPCStatus) => {
    if (!accessToken) return;
    setUpdatingAssignmentId(assignment.id);

    try {
      await updateTpcAssignmentStatus(accessToken, assignment.id, newStatus);
      toast.showToast(`Updated status to ${newStatus.replace("_", " ")}`, "success");
      loadData();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to update status", "error");
    } finally {
      setUpdatingAssignmentId(null);
    }
  };

  // Handle Remove Assignment
  const handleDeleteAssignment = async (assignmentId: string, userName: string) => {
    if (!accessToken) return;
    if (!window.confirm(`Are you sure you want to remove ${userName} from this TPC assignment?`)) {
      return;
    }

    setUpdatingAssignmentId(assignmentId);
    try {
      await deleteTpcAssignment(accessToken, assignmentId);
      toast.showToast(`Removed assignment for ${userName}`, "success");
      loadData();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to remove assignment", "error");
    } finally {
      setUpdatingAssignmentId(null);
    }
  };

  const handleOpenAssignModal = (lead?: LeadItem) => {
    setSelectedLeadForAssign(lead);
    setIsAssignModalOpen(true);
  };

  // Select active data list based on tab
  const activeList = activeTab === "MY_TPCS" ? myTpcs : assignedTpcs;

  // Filter Active List
  const filteredList = activeList.filter((item) => {
    const lead = item.tpc?.lead;
    const leadName = `${lead?.firstName || ""} ${lead?.lastName || ""}`.toLowerCase();
    const phone = (lead?.phone || "").toLowerCase();
    const email = (lead?.email || "").toLowerCase();
    const course = (lead?.courseInterested || "").toLowerCase();

    const assignedToName = `${item.assignedTo?.firstName || ""} ${item.assignedTo?.lastName || ""}`.toLowerCase();
    const assignedByName = `${item.assignedBy?.firstName || ""} ${item.assignedBy?.lastName || ""}`.toLowerCase();

    const collegeNames = (lead?.collegeApplications || [])
      .map((app) => app.college?.name || "")
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      leadName.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      course.includes(searchTerm.toLowerCase()) ||
      assignedToName.includes(searchTerm.toLowerCase()) ||
      assignedByName.includes(searchTerm.toLowerCase()) ||
      collegeNames.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter !== "ALL" && item.status !== statusFilter) {
      return false;
    }

    if (dateFilter !== "ALL") {
      const assignedAtDate = item.assignedAt;
      if (!assignedAtDate) return false;

      const date = new Date(assignedAtDate);
      const now = new Date();

      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      if (dateFilter === "TODAY") {
        if (!isSameDay(date, now)) return false;
      } else if (dateFilter === "YESTERDAY") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (!isSameDay(date, yesterday)) return false;
      } else if (dateFilter === "LAST_7_DAYS") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        if (date < sevenDaysAgo || date > now) return false;
      } else if (dateFilter === "LAST_30_DAYS") {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (date < thirtyDaysAgo || date > now) return false;
      } else if (dateFilter === "CUSTOM" && customDate) {
        const selectedDate = new Date(customDate);
        if (!isSameDay(date, selectedDate)) return false;
      }
    }

    return true;
  });

  // Render Status Badge Component
  const renderStatusBadge = (status: TPCStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-200 dark:border-emerald-700 flex items-center gap-1 shrink-0">
            <CheckCircle2 size={13} /> Completed
          </span>
        );
      case "NO_REPLY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/80 dark:text-amber-200 dark:border-amber-700 flex items-center gap-1 shrink-0">
            <HelpCircle size={13} /> No Reply
          </span>
        );
      case "NOT_INTERESTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/80 dark:text-red-200 dark:border-red-700 flex items-center gap-1 shrink-0">
            <XCircle size={13} /> Not Interested
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/80 dark:text-blue-200 dark:border-blue-700 flex items-center gap-1 shrink-0">
            <Clock size={13} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <PhoneCall className="text-primary-600 h-7 w-7" />
            {activeTab === "MY_TPCS" ? "My TPCs" : "Assigned TPCs"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {activeTab === "MY_TPCS"
              ? "View and manage TPC calls created by you or linked to your leads."
              : "View and execute TPC call assignments assigned to you by team members."}
          </p>
        </div>

        <button
          onClick={() => handleOpenAssignModal()}
          className="
            inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5
            text-sm font-medium text-white shadow-sm hover:bg-primary-700
            transition shrink-0 self-start sm:self-auto
          "
        >
          <Plus size={18} />
          Assign TPC
        </button>
      </div>

      {/* Controls Bar (Filter Tabs & Search & Refresh) */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${statusFilter === "ALL"
              ? "bg-surface text-text-primary shadow-xs font-semibold"
              : "text-text-secondary hover:text-text-primary"
              }`}
          >
            All ({activeList.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${statusFilter === "PENDING"
              ? "bg-surface text-blue-700 shadow-xs font-semibold"
              : "text-text-secondary hover:text-text-primary"
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${statusFilter === "COMPLETED"
              ? "bg-surface text-emerald-700 shadow-xs font-semibold"
              : "text-text-secondary hover:text-text-primary"
              }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter("NO_REPLY")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${statusFilter === "NO_REPLY"
              ? "bg-surface text-amber-700 shadow-xs font-semibold"
              : "text-text-secondary hover:text-text-primary"
              }`}
          >
            No Reply
          </button>
          <button
            onClick={() => setStatusFilter("NOT_INTERESTED")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${statusFilter === "NOT_INTERESTED"
              ? "bg-surface text-red-700 shadow-xs font-semibold"
              : "text-text-secondary hover:text-text-primary"
              }`}
          >
            Not Interested
          </button>
        </div>

        {/* Search Input, Date Filter & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg border border-border/60">
            <Calendar size={14} className="text-text-muted ml-1.5" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="bg-transparent text-xs font-medium text-text-primary focus:outline-none pr-1 py-1 cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="CUSTOM">Custom Date</option>
            </select>

            {dateFilter === "CUSTOM" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-surface border border-border rounded px-1.5 py-0.5 text-xs text-text-primary focus:outline-none"
              />
            )}
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search lead name, phone, assigned user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2
                text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
              "
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh TPC List"
            className="rounded-lg border border-border p-2 text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-surface shadow-sm text-text-muted">
          <RefreshCw size={24} className="animate-spin text-primary-600 mb-3" />
          <p className="text-sm font-medium">Loading TPC assignments...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-surface shadow-sm text-center px-4">
          <PhoneCall size={36} className="text-neutral-300 mb-3" />
          <h3 className="text-base font-semibold text-text-primary">
            {activeTab === "MY_TPCS" ? "No TPCs assigned by you yet." : "No TPCs assigned to you."}
          </h3>
          <p className="mt-1 text-xs text-text-secondary max-w-sm">
            {searchTerm || statusFilter !== "ALL"
              ? "No TPC records match your current search or filter criteria."
              : activeTab === "MY_TPCS"
                ? "Assign a TPC to start tracking counseling calls."
                : "Assigned counseling calls will appear here."}
          </p>
          {activeTab === "MY_TPCS" && !searchTerm && statusFilter === "ALL" && (
            <button
              onClick={() => handleOpenAssignModal()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 transition shadow-sm"
            >
              <Plus size={14} /> Assign TPC
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((assignment) => {
            const lead = assignment.tpc?.lead;
            const leadName = `${lead?.firstName || "Lead"} ${lead?.lastName || ""}`.trim();
            const isUpdating = updatingAssignmentId === assignment.id;

            const targetUser = activeTab === "MY_TPCS" ? assignment.assignedTo : assignment.assignedBy;
            const targetUserName = `${targetUser?.firstName || "User"} ${targetUser?.lastName || ""}`.trim();
            const targetUserRole = targetUser?.role?.name || "Member";

            return (
              <div
                key={assignment.id}
                className="rounded-xl border border-border bg-surface shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {/* Card Content Top */}
                <div className="p-4 space-y-3">
                  {/* Lead Info Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {leadName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary text-base leading-tight">
                          {leadName}
                        </h3>
                        {lead?.courseInterested && (
                          <p className="text-xs text-primary-700 font-medium flex items-center gap-1 mt-0.5">
                            <GraduationCap size={13} /> {lead.courseInterested}
                          </p>
                        )}
                      </div>
                    </div>

                    {renderStatusBadge(assignment.status)}
                  </div>

                  {/* Contact Info */}
                  <div className="rounded-lg bg-neutral-50 p-2.5 border border-border/70 text-xs space-y-1">
                    {lead?.phone && (
                      <div className="flex items-center gap-2 font-mono text-text-primary font-medium">
                        <Phone size={13} className="text-primary-600 shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead?.email && (
                      <div className="text-text-secondary truncate">
                        {lead.email}
                      </div>
                    )}
                  </div>

                  {/* Associated Colleges */}
                  {lead?.collegeApplications && lead.collegeApplications.length > 0 && (
                    <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-2.5 border border-border/70 text-xs space-y-1.5">
                      <p className="text-[11px] font-semibold text-text-muted dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 size={13} className="text-primary-600 dark:text-primary-400 shrink-0" />
                        Associated Colleges ({lead.collegeApplications.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.collegeApplications.map((app) => (
                          <span
                            key={app.id || app.collegeId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-900 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 shadow-2xs"
                          >
                            <span>{app.college?.name || "College"}</span>
                            {app.approvalStatus && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${app.approvalStatus === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/90 dark:text-emerald-200 dark:border-emerald-700"
                                  : app.approvalStatus === "REJECTED"
                                    ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/90 dark:text-rose-200 dark:border-rose-700"
                                    : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/90 dark:text-amber-200 dark:border-amber-700"
                                  }`}
                              >
                                {app.approvalStatus}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignment Detail (Assignee or Assigner) */}
                  <div className="text-xs border-t border-border/60 pt-2.5 space-y-1">
                    <p className="text-[11px] font-semibold text-text-muted dark:text-neutral-400 uppercase tracking-wider">
                      {activeTab === "MY_TPCS" ? "Assigned to" : "Assigned by"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary dark:text-neutral-100 flex items-center gap-1.5">
                        <User size={13} className="text-text-muted dark:text-neutral-400" />
                        {targetUserName}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-text-secondary border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700">
                        {targetUserRole}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md bg-primary-50 text-primary-900 border border-primary-200 dark:bg-primary-950/70 dark:text-primary-200 dark:border-primary-800">
                        <Calendar size={12} className="text-primary-600 dark:text-primary-400 shrink-0" />
                        <span>Assigned: {new Date(assignment.assignedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="border-t border-border bg-neutral-50/70 dark:bg-neutral-900/60 p-3 space-y-2">
                  {/* Actions for Assigned TPCs */}
                  {activeTab === "ASSIGNED_TPCS" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setCallModalAssignment(assignment)}
                          className="
                            inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                            bg-emerald-600 text-white text-xs font-medium shadow-xs hover:bg-emerald-700 transition
                          "
                        >
                          <PhoneCall size={14} /> Call
                        </button>
                        <button
                          onClick={() => setNoteModalAssignment(assignment)}
                          className="
                            inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                            bg-primary-600 text-white text-xs font-medium shadow-xs hover:bg-primary-700 transition
                          "
                        >
                          <FileText size={14} /> Add Note
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateStatus(assignment, "COMPLETED")}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition font-medium"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(assignment, "NO_REPLY")}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 transition font-medium"
                          >
                            No Reply
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(assignment, "NOT_INTERESTED")}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded-md bg-red-50 text-red-800 border border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition font-medium"
                          >
                            Not Interested
                          </button>
                        </div>

                        <button
                          onClick={() => setHistoryModalAssignment(assignment)}
                          title="View Interaction History"
                          className="p-1 rounded text-text-secondary hover:bg-neutral-200 transition"
                        >
                          <History size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions for My TPCs */}
                  {activeTab === "MY_TPCS" && (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setHistoryModalAssignment(assignment)}
                        className="
                          inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface
                          text-xs font-medium text-text-primary hover:bg-neutral-100 transition
                        "
                      >
                        <History size={14} className="text-text-muted" /> Activity History
                      </button>

                      <div className="flex items-center gap-1.5">
                        {lead && (
                          <button
                            onClick={() => handleOpenAssignModal(lead)}
                            className="px-2.5 py-1.5 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 transition"
                          >
                            Reassign
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id, targetUserName)}
                          disabled={isUpdating}
                          title="Remove Assignment"
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Assign TPC Modal */}
      {isAssignModalOpen && (
        <TPCModal
          lead={selectedLeadForAssign}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedLeadForAssign(undefined);
          }}
          onSuccess={() => {
            setIsAssignModalOpen(false);
            setSelectedLeadForAssign(undefined);
            loadData();
          }}
        />
      )}

      {/* TPC Call Modal */}
      {callModalAssignment && (
        <TpcCallModal
          assignmentId={callModalAssignment.id}
          leadId={callModalAssignment.tpc?.leadId || ""}
          leadName={`${callModalAssignment.tpc?.lead?.firstName || "Lead"} ${callModalAssignment.tpc?.lead?.lastName || ""
            }`.trim()}
          leadPhone={callModalAssignment.tpc?.lead?.phone}
          onClose={() => setCallModalAssignment(null)}
          onSuccess={() => {
            setCallModalAssignment(null);
            loadData();
          }}
        />
      )}

      {/* Add Note Modal */}
      {noteModalAssignment && (
        <AddNoteModal
          assignmentId={noteModalAssignment.id}
          leadId={noteModalAssignment.tpc?.leadId || ""}
          leadName={`${noteModalAssignment.tpc?.lead?.firstName || "Lead"} ${noteModalAssignment.tpc?.lead?.lastName || ""
            }`.trim()}
          onClose={() => setNoteModalAssignment(null)}
          onSuccess={() => {
            setNoteModalAssignment(null);
            loadData();
          }}
        />
      )}

      {/* Interaction History Modal */}
      {historyModalAssignment && (
        <InteractionHistoryModal
          leadId={historyModalAssignment.tpc?.leadId || ""}
          leadName={`${historyModalAssignment.tpc?.lead?.firstName || "Lead"} ${historyModalAssignment.tpc?.lead?.lastName || ""
            }`.trim()}
          onClose={() => setHistoryModalAssignment(null)}
        />
      )}
    </div>
  );
};

export default Tpc;