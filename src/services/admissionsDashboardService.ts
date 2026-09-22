import { API_URL } from "../config/api";

export interface AdmissionsFilterParams {
  startDate?: string;
  endDate?: string;
  collegeId?: string;
  course?: string;
  teamId?: string;
  employeeId?: string;
  source?: string;
  statusId?: string;
  page?: number;
  limit?: number;
}

export interface RecentAdmissionRecord {
  id: string;
  leadId: string;
  studentName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  collegeName: string;
  coursePitched: string;
  feePitched: number;
  counselorName: string;
  teamName: string;
  admissionDate: string;
  statusName: string;
  statusColor: string;
  source: string;
  createdAt: string;
}

export interface AdmissionsDashboardData {
  kpis: {
    totalAdmissions: number;
    admissionsThisMonth: number;
    totalLeads: number;
    overallConversionRate: number;
    topCounselor: { name: string; admissions: number; team: string } | null;
    topConverter: { name: string; conversionRate: number; team: string } | null;
  };
  filtersMeta: {
    colleges: Array<{ id: string; name: string }>;
    courses: string[];
    teams: Array<{ id: number; name: string }>;
    employees: Array<{ id: string; name: string; teamId?: number }>;
    sources: string[];
    statuses: Array<{ id: number; name: string; code: string; color: string }>;
  };
  admissionTrend: Array<{ month: string; leads: number; admissions: number }>;
  collegeDistribution: Array<{
    collegeId: string;
    collegeName: string;
    applications: number;
    admissions: number;
    conversionRate: number;
  }>;
  employeePerformance: Array<{
    employeeId: string;
    employeeName: string;
    teamName: string;
    leadsHandled: number;
    admissions: number;
    conversionRate: number;
  }>;
  teamPerformance: Array<{
    teamId: number;
    teamName: string;
    managerName: string;
    memberCount: number;
    leadsHandled: number;
    admissions: number;
    conversionRate: number;
  }>;
  admissionFunnel: Array<{
    stageId: number;
    stageName: string;
    code: string;
    displayOrder: number;
    color: string;
    count: number;
    conversionFromPrevious: number;
  }>;
  sourceConversion: Array<{
    source: string;
    leads: number;
    admissions: number;
    conversionRate: number;
  }>;
  geographicDistribution: Array<{
    state: string;
    admissionsCount: number;
    totalLeads: number;
  }>;
  statusDistribution: Array<{
    statusId: number;
    statusName: string;
    code: string;
    color: string;
    count: number;
    percentage: number;
  }>;
  recentAdmissions: {
    data: RecentAdmissionRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchAdmissionsDashboard(
  token?: string,
  params: AdmissionsFilterParams = {},
  signal?: AbortSignal
): Promise<AdmissionsDashboardData> {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.collegeId) queryParams.append("collegeId", params.collegeId);
  if (params.course) queryParams.append("course", params.course);
  if (params.teamId) queryParams.append("teamId", params.teamId);
  if (params.employeeId) queryParams.append("employeeId", params.employeeId);
  if (params.source) queryParams.append("source", params.source);
  if (params.statusId) queryParams.append("statusId", params.statusId);
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));

  const url = `${API_URL}/dashboard/admissions?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch admissions dashboard metrics");
  }

  return response.json();
}
