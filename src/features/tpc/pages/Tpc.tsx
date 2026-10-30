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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <PhoneCall className="text-primary-600 h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
            <span className="truncate">{activeTab === "MY_TPCS" ? "My TPCs" : "Assigned TPCs"}</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">
            {activeTab === "MY_TPCS"
              ? "View and manage TPC calls created by you or linked to your leads."
              : "View and execute TPC call assignments assigned to you by team members."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh TPC List"
            className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => handleOpenAssignModal()}
            className="
              inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5
              text-sm font-medium text-white shadow-sm hover:bg-primary-700
              transition shrink-0
            "
          >
            <Plus size={18} />
            Assign TPC
          </button>
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full min-w-0">

        {/* Search Input */}
        <div className="relative flex-1 w-full min-w-0">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search lead name, phone, assigned user..."
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
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md"
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatusType)}
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
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Time Filter Dropdown */}
        <div className="relative w-full sm:w-auto sm:min-w-[150px]">
          <div className="relative">
            <Clock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
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
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="CUSTOM">Custom Date</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>

          {dateFilter === "CUSTOM" && (
            <div className="absolute top-12 left-0 right-0 z-10 bg-surface border border-border p-2 rounded-xl shadow-lg">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full h-10 border border-border rounded-lg px-3 text-sm text-text-primary focus:outline-none focus:border-primary-500"
              />
            </div>
          )}
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