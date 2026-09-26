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
    dataUploadedTodayCount?: number;
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
  callsTodayList: {
    data: Array<{
      id: string;
      student: string;
      leadId: string | null;
      studentDataId?: string | null;
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
      notes?: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
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
    phone?: string;
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
    answeredCallsCount: number;
    notAnsweredCallsCount: number;
    leadsCount: number;
    admissionsCount?: number;
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
  token?: string,
  startDate?: string,
  endDate?: string,
  page?: number,
  limit?: number,
  callTime?: string
): Promise<SuperAdminDashboardData> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (page) queryParams.set("page", page.toString());
  if (limit) queryParams.set("limit", limit.toString());
  if (callTime && callTime !== "ALL") queryParams.set("callTime", callTime);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const response = await fetch(`${API_URL}/dashboard/super-admin${queryString}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Super Admin dashboard metrics");
  }

  return response.json();
}

