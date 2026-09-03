import { API_URL } from "../config/api";

export interface ManagedTeamOption {
  id: number;
  name: string;
  description?: string;
}

export interface ManagerOverviewKPIs {
  totalTeams: number;
  totalMembers: number;
  totalLeads: number;
  totalTpcs: number;
  pendingActions: number;
  leadsToday: number;
  monthlyConversions: number;
  todaysApplications: number;
  ongoingProcesses: number;
}

export interface TeamPerformanceItem {
  teamId: number;
  teamName: string;
  description?: string;
  memberCount: number;
  assignedLeadsCount: number;
  contactedLeadsCount: number;
  convertedLeadsCount: number;
  pendingTpcsCount: number;
  completedTpcsCount: number;
}

export interface LeadPipelineStage {
  id: number;
  name: string;
  color: string;
  description: string;
  count: number;
  percentage: number;
}

export interface MemberPerformanceItem {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  teamName: string;
  assignedLeadsCount: number;
  contactedLeadsCount: number;
  convertedLeadsCount: number;
  tpcsCount: number;
  interactionsCount: number;
  lastActivityAt: string | null;
}

export interface TpcStatusCounts {
  PENDING: number;
  COMPLETED: number;
  NO_REPLY: number;
  NOT_INTERESTED: number;
  CANCELLED: number;
}

export interface TpcMemberItem {
  memberId: string;
  name: string;
  pendingCount: number;
  completedCount: number;
}

export interface UncontactedLeadAlert {
  id: string;
  name: string;
  assignedTo: string;
}

export interface PendingTpcAlert {
  id: string;
  leadName: string;
  assignedTo: string;
  assignedAt: string;
}

export interface PendingPitchAlert {
  id: string;
  leadName: string;
  collegeName: string;
  pitchedBy: string;
}

export interface InactiveMemberAlert {
  id: string;
  name: string;
  lastActivityAt: string | null;
}

export interface AttentionRequiredData {
  uncontactedLeadsCount: number;
  uncontactedLeads: UncontactedLeadAlert[];
  pendingTpcsCount: number;
  pendingTpcs: PendingTpcAlert[];
  pendingPitchesCount: number;
  pendingPitches: PendingPitchAlert[];
  inactiveMembersCount: number;
  inactiveMembers: InactiveMemberAlert[];
}

export interface AttendanceSummaryData {
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  unmarked: number;
}

export interface RecentActivityItem {
  id: string;
  type: "INTERACTION" | "ACTIVITY_LOG";
  actor: string;
  description: string;
  createdAt: string;
}

export interface ManagerNotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface LeadTodayItem {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  city?: string | null;
  source: string;
  courseInterested?: string | null;
  createdAt: string;
  statusName: string;
  statusColor: string;
  postedBy: string;
  assignedTo?: string | null;
}

export interface ManagerDashboardData {
  managedTeams: ManagedTeamOption[];
  selectedTeamId: string;
  overview: ManagerOverviewKPIs;
  leadsTodayList?: LeadTodayItem[];
  teamPerformance: TeamPerformanceItem[];
  leadPipeline: LeadPipelineStage[];
  memberPerformance: MemberPerformanceItem[];
  tpcOverview: {
    byStatus: TpcStatusCounts;
    byMember: TpcMemberItem[];
  };
  attentionRequired: AttentionRequiredData;
  attendance: AttendanceSummaryData;
  recentActivity: RecentActivityItem[];
  notifications: {
    unreadCount: number;
    items: ManagerNotificationItem[];
  };
}

export interface FetchManagerFilters {
  teamId?: string;
  startDate?: string;
  endDate?: string;
}

export async function fetchManagerDashboardStats(
  token: string,
  filters?: FetchManagerFilters
): Promise<ManagerDashboardData> {
  const queryParams = new URLSearchParams();
  if (filters?.teamId && filters.teamId !== "all") {
    queryParams.append("teamId", filters.teamId);
  }
  if (filters?.startDate) {
    queryParams.append("startDate", filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append("endDate", filters.endDate);
  }

  const queryString = queryParams.toString();
  const url = `${API_URL}/dashboard/manager${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to fetch manager dashboard metrics";
    throw new Error(errorMsg);
  }

  return data;
}
