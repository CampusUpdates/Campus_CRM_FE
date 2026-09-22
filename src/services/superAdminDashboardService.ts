import { API_URL } from "../config/api";

export interface SuperAdminDashboardData {
  kpis: {
    leadsTodayCount: number;
    callsTodayCount: number;
    attendanceTotal: number;
    attendancePresent: number;
    attendanceAbsent: number;
    attendanceLeave: number;
    interviewsTodayCount: number;
    interviewsScheduledCount: number;
    interviewsCompletedCount: number;
    interviewsPendingCount: number;
    selectionLettersTodayCount: number;
    admissionsDueTodayCount: number;
    availableDataCount: number;
    expiredDataCount: number;
    activeAssignmentsCount: number;
  };
  leadsTodayList: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    college: string;
    createdAt: string;
    createdBy: string;
    createdById: string;
    status: string;
    assignedAdvisor: string;
    assignedAdvisorId: string | null;
    team: string;
    teamId: number | null;
    manager: string;
    lastActivity: string;
  }>;
  callsTodayList: Array<{
    id: string;
    student: string;
    leadId: string | null;
    phone: string;
    advisor: string;
    advisorId: string;
    team: string;
    teamId: number | null;
    manager: string;
    callTime: string;
    duration: string;
    callOutcome: string;
    leadStatus: string;
  }>;
  attendanceList: Array<{
    id: string;
    userId: string;
    employee: string;
    role: string;
    team: string;
    teamId: number | null;
    manager: string;
    status: string;
    checkIn: string;
    checkOut: string;
    workingHours: string;
  }>;
  interviewsList: Array<{
    id: string;
    candidateName: string;
    candidateId: string;
    interviewTime: string;
    college: string;
    course: string;
    status: string;
    result: string;
    advisor: string;
    advisorId: string;
    team: string;
    teamId: number | null;
    manager: string;
  }>;
  lettersOutList: Array<{
    id: string;
    student: string;
    college: string;
    course: string;
    letterStatus: string;
    issuedTime: string;
    advisor: string;
    advisorId: string | null;
    team: string;
    teamId: number | null;
    manager: string;
  }>;
  admissionsDueList: Array<{
    id: string;
    student: string;
    college: string;
    course: string;
    admissionLastDate: string;
    status: string;
    advisor: string;
    advisorId: string | null;
    team: string;
    teamId: number | null;
    manager: string;
    lastActivity: string;
  }>;
  dailyTeamReport: Array<{
    teamId: number;
    teamName: string;
    managerName: string;
    managerId: string | null;
    membersCount: number;
    leadsTodayCount: number;
    callsTodayCount: number;
    admissionsTodayCount: number;
    attendancePresentCount: number;
    attendanceTotalCount: number;
  }>;
  advisorPerformance: Array<{
    userId: string;
    advisorName: string;
    teamName: string;
    teamId: number | null;
    assignedDataCount: number;
    callsCount: number;
    leadsCount: number;
    admissionsCount: number;
  }>;
  leadPipeline: Array<{
    id: number;
    name: string;
    color: string;
    description: string;
    count: number;
    percentage: number;
  }>;
  attentionRequired: {
    admissionsDueTodayCount: number;
    overdueAdmissionsCount: number;
    pendingTpcsCount: number;
    unassignedDataCount: number;
    zeroCallAdvisorsCount: number;
  };
  recentActivity: Array<{
    id: string;
    userId: string;
    actor: string;
    description: string;
    activity: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
}

export async function fetchSuperAdminDashboardStats(
  token?: string
): Promise<SuperAdminDashboardData> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/dashboard/super-admin`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Super Admin dashboard metrics");
  }

  return response.json();
}
