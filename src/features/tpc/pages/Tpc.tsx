import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PhoneCall,
  Plus,
  Search,
  RefreshCw,

  Filter,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchMyTpcs,
  fetchAssignedTpcs,
  deleteTpcAssignment,
  type TPCUserItem,
} from "../../../services/tpcService";
import TPCModal from "../../leads/components/TPCModal";
import TpcCallModal from "../components/TpcCallModal";
import AddNoteModal from "../components/AddNoteModal";
import InteractionHistoryModal from "../components/InteractionHistoryModal";
import TpcCard from "../components/TpcCard";
import { type LeadItem } from "../../../services/leadService";
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

type TabType = "MY_TPCS" | "ASSIGNED_TPCS";
type FilterStatusType = "ALL" | "PENDING" | "COMPLETED";
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
  const [error, setError] = useState<string | null>(null);

  const statusParam = searchParams.get("status");
  const initialStatusFilter: FilterStatusType =
    statusParam?.toUpperCase() === "COMPLETED"
      ? "COMPLETED"
      : statusParam?.toUpperCase() === "ALL"
        ? "ALL"
        : "PENDING";

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatusType>(initialStatusFilter);

  const [dateFilter, setDateFilter] = useState<DateFilterType>("ALL");
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
    setError(null);
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
      const msg = err.message || "Failed to load TPC records";
      setError(msg);
      toast.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);



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


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4 sm:pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Row 1 on mobile: Title + Phone Icon */}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-text-primary flex items-center gap-2 sm:gap-2.5 min-w-0">
              <PhoneCall className="text-primary-600 h-5 w-5 sm:h-7 sm:w-7 shrink-0" />
              <span className="truncate">{activeTab === "MY_TPCS" ? "My TPCs" : "Assigned TPCs"}</span>
            </h1>
            <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal hidden sm:block">
              {activeTab === "MY_TPCS"
                ? "View and manage TPC calls created by you or linked to your leads."
                : "View and execute TPC call assignments assigned to you by team members."}
            </p>
          </div>

          {/* Row 2 on mobile, right aligned on desktop: [Refresh] and [Assign TPC] */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh TPC List"
              aria-label="Refresh TPC List"
              className="inline-flex items-center justify-center h-8 sm:h-10 px-2.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50 shrink-0 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={15} className={`sm:w-[18px] sm:h-[18px] ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => handleOpenAssignModal()}
              className="
                inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-primary-600
                h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white shadow-2xs sm:shadow-sm
                hover:bg-primary-700 transition shrink-0 cursor-pointer
              "
            >
              <Plus size={15} className="sm:w-[18px] sm:h-[18px]" />
              <span>Assign TPC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full min-w-0">

        {/* Search Input */}
        <div className="relative flex-1 w-full min-w-0">
          <Search
            size={16}
            className="sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search lead name, phone, assigned user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              h-9 sm:h-11
              w-full
              rounded-lg sm:rounded-xl
              border
              border-border
              bg-surface
              pl-9 sm:pl-11
              pr-9 sm:pr-10
              text-xs sm:text-sm
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
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Dropdowns Container: 2-column grid on mobile (equal widths), flex row on desktop */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full sm:w-auto sm:flex sm:items-center min-w-0">
          {/* Status Filter Dropdown */}
          <div className="relative w-full sm:w-auto sm:min-w-[150px] min-w-0">
            <div className="relative">
              <Filter
                size={14}
                className="sm:w-[15px] sm:h-[15px] absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatusType)}
                className="
                  h-9 sm:h-11
                  w-full
                  rounded-lg sm:rounded-xl
                  border
                  border-border
                  bg-surface
                  pl-8 sm:pl-10
                  pr-7 sm:pr-9
                  text-xs sm:text-sm
                  font-medium
                  text-text-primary
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-2
                  focus:ring-primary-100
                  appearance-none
                  cursor-pointer
                  truncate
                "
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <ChevronDown
                size={14}
                className="sm:w-[15px] sm:h-[15px] absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0"
              />
            </div>
          </div>

          {/* Time Filter Dropdown */}
          <div className="relative w-full sm:w-auto sm:min-w-[150px] min-w-0">
            <div className="relative">
              <Clock
                size={14}
                className="sm:w-[15px] sm:h-[15px] absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0"
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                className="
                  h-9 sm:h-11
                  w-full
                  rounded-lg sm:rounded-xl
                  border
                  border-border
                  bg-surface
                  pl-8 sm:pl-10
                  pr-7 sm:pr-9
                  text-xs sm:text-sm
                  font-medium
                  text-text-primary
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-2
                  focus:ring-primary-100
                  appearance-none
                  cursor-pointer
                  truncate
                "
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="CUSTOM">Custom Date</option>
              </select>
              <ChevronDown
                size={14}
                className="sm:w-[15px] sm:h-[15px] absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0"
              />
            </div>

            {dateFilter === "CUSTOM" && (
              <div className="absolute top-10 sm:top-12 left-auto right-0 w-[200px] sm:w-[220px] z-20 bg-surface border border-border p-2 rounded-xl shadow-lg">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full h-8 sm:h-10 border border-border rounded-lg px-2 sm:px-3 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-primary-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <PageLoadingState
          message={activeTab === "MY_TPCS" ? "Loading your TPC assignments..." : "Loading assigned TPCs..."}
          description="Fetching counseling assignments, notes, and call history"
        />
      ) : error ? (
        <PageErrorState
          title="Unable to load TPC assignments"
          message={error}
          onRetry={loadData}
        />
      ) : filteredList.length === 0 ? (
        <PageEmptyState
          icon={PhoneCall}
          title={
            activeList.length === 0
              ? activeTab === "MY_TPCS"
                ? "No TPCs assigned by you yet."
                : "No TPCs assigned to you."
              : "No TPC records found"
          }
          description={
            activeList.length === 0
              ? activeTab === "MY_TPCS"
                ? "Assign a TPC to start tracking counseling calls."
                : "Assigned counseling calls will appear here."
              : "No TPC records match your current search or filter criteria."
          }
          actionText={activeTab === "MY_TPCS" && activeList.length === 0 ? "Assign TPC" : undefined}
          onAction={activeTab === "MY_TPCS" && activeList.length === 0 ? () => handleOpenAssignModal() : undefined}
          minHeight="min-h-[240px] sm:min-h-[380px]"
          className="p-4 sm:p-6 mx-auto w-full"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((assignment) => {
            const lead = assignment.tpc?.lead;
            const isUpdating = updatingAssignmentId === assignment.id;

            const targetUser = activeTab === "MY_TPCS" ? assignment.assignedTo : assignment.assignedBy;
            const targetUserName = `${targetUser?.firstName || "User"} ${targetUser?.lastName || ""}`.trim();
            const targetUserRole = targetUser?.role?.name || "Member";

            return (
              <TpcCard
                key={assignment.id}
                assignment={assignment}
                targetUserLabel={activeTab === "MY_TPCS" ? "Assigned To" : "Assigned By"}
                targetUserName={targetUserName}
                targetUserRole={targetUserRole}
                isUpdating={isUpdating}
                onAddNote={activeTab === "ASSIGNED_TPCS" ? () => setNoteModalAssignment(assignment) : undefined}
                onViewHistory={() => setHistoryModalAssignment(assignment)}
                onReassign={activeTab === "MY_TPCS" && lead ? () => handleOpenAssignModal(lead) : undefined}
                onDelete={activeTab === "MY_TPCS" ? () => handleDeleteAssignment(assignment.id, targetUserName) : undefined}
              />
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
          calls={callModalAssignment.calls}
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
          calls={noteModalAssignment.calls}
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
          assignmentId={historyModalAssignment.id}
          leadName={`${historyModalAssignment.tpc?.lead?.firstName || "Lead"} ${historyModalAssignment.tpc?.lead?.lastName || ""
            }`.trim()}
          onClose={() => setHistoryModalAssignment(null)}
        />
      )}
    </div>
  );
};

export default Tpc;