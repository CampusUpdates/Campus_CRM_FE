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

export interface FetchSuperAdminDashboardOptions {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  callTime?: string;
  callTiming?: string;
  pipelinePeriod?: string;
  pipelineStartDate?: string;
  pipelineEndDate?: string;
  signal?: AbortSignal;
}

export async function fetchSuperAdminDashboardStats(
  token?: string,
  startDateOrOptions?: string | FetchSuperAdminDashboardOptions,
  endDate?: string,
  page?: number,
  limit?: number,
  callTime?: string,
  callTiming?: string,
  pipelinePeriodOrSignal?: string | AbortSignal,
  pipelineStartDate?: string,
  pipelineEndDate?: string,
  signal?: AbortSignal
): Promise<SuperAdminDashboardData> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams();
  let effectiveSignal = signal;
  let effectivePipelinePeriod: string | undefined = undefined;

  if (pipelinePeriodOrSignal instanceof AbortSignal) {
    effectiveSignal = pipelinePeriodOrSignal;
  } else if (typeof pipelinePeriodOrSignal === "string") {
    effectivePipelinePeriod = pipelinePeriodOrSignal;
  }

  if (typeof startDateOrOptions === "object" && startDateOrOptions !== null) {
    const opts = startDateOrOptions;
    if (opts.startDate) queryParams.set("startDate", opts.startDate);
    if (opts.endDate) queryParams.set("endDate", opts.endDate);
    if (opts.page) queryParams.set("page", opts.page.toString());
    if (opts.limit) queryParams.set("limit", opts.limit.toString());
    if (opts.callTime && opts.callTime !== "ALL") queryParams.set("callTime", opts.callTime);
    if (opts.callTiming && opts.callTiming !== "ALL") queryParams.set("callTiming", opts.callTiming);
    if (opts.pipelinePeriod) queryParams.set("pipelinePeriod", opts.pipelinePeriod);
    if (opts.pipelineStartDate) queryParams.set("pipelineStartDate", opts.pipelineStartDate);
    if (opts.pipelineEndDate) queryParams.set("pipelineEndDate", opts.pipelineEndDate);
    if (opts.signal) effectiveSignal = opts.signal;
  } else {
    if (startDateOrOptions) queryParams.set("startDate", startDateOrOptions);
    if (endDate) queryParams.set("endDate", endDate);
    if (page) queryParams.set("page", page.toString());
    if (limit) queryParams.set("limit", limit.toString());
    if (callTime && callTime !== "ALL") queryParams.set("callTime", callTime);
    if (callTiming && callTiming !== "ALL") queryParams.set("callTiming", callTiming);
    if (effectivePipelinePeriod) queryParams.set("pipelinePeriod", effectivePipelinePeriod);
    if (pipelineStartDate) queryParams.set("pipelineStartDate", pipelineStartDate);
    if (pipelineEndDate) queryParams.set("pipelineEndDate", pipelineEndDate);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const response = await fetch(`${API_URL}/dashboard/super-admin${queryString}`, {
    method: "GET",
    headers,
    signal: effectiveSignal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Super Admin dashboard metrics");
  }

  return response.json();
}

