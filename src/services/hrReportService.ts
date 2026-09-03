import { API_URL } from "../config/api";

export interface HRReportSummary {
  totalApplications: number;
  hiredCount: number;
  selectedCount: number;
  selectionRate: number;
  activePositions: number;
  totalVacancies: number;
  vacanciesFillRate: number;
  totalInterviews: number;
  passedInterviews: number;
  interviewPassRate: number;
}

export interface MonthlyTrendItem {
  month: string;
  applications: number;
  hired: number;
}

export interface DepartmentVelocityItem {
  department: string;
  openPositions: number;
  vacancies: number;
  applicants: number;
  hired: number;
  fillRate: number;
}

export interface InterviewerPerformanceItem {
  interviewerId: string;
  interviewerName: string;
  totalConducted: number;
  passedCount: number;
  failedCount: number;
  holdCount: number;
  passRate: number;
}

export interface StageBreakdownItem {
  stage: string;
  count: number;
}

export interface HRReportData {
  summary: HRReportSummary;
  monthlyTrends: MonthlyTrendItem[];
  departmentVelocity: DepartmentVelocityItem[];
  interviewerPerformance: InterviewerPerformanceItem[];
  stageBreakdown: StageBreakdownItem[];
  allDepartments: string[];
}

export interface HRReportFilterParams {
  startDate?: string;
  endDate?: string;
  department?: string;
}

export async function fetchHRReport(
  token?: string,
  filters?: HRReportFilterParams
): Promise<HRReportData> {
  const query = new URLSearchParams();
  if (filters?.startDate) query.append("startDate", filters.startDate);
  if (filters?.endDate) query.append("endDate", filters.endDate);
  if (filters?.department) query.append("department", filters.department);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}/reports/hr${query.toString() ? `?${query.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch HR reports");
  }

  return response.json();
}
