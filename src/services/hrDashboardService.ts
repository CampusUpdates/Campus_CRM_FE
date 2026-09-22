import { API_URL } from "../config/api";
import type { Candidate } from "./candidateService";
import type { Interview } from "./interviewService";

export interface HRKpiStats {
  totalEmployees: number;
  openPositions: number;
  totalVacancies: number;
  totalCandidates: number;
  scheduledInterviews: number;
  hiredCount: number;
  hiringRate: number;
}

export interface CandidatePipelineStage {
  status: string;
  label: string;
  count: number;
}

export interface DepartmentStat {
  department: string;
  openPositions: number;
  vacancies: number;
  applicants: number;
}

export interface InterviewResultStat {
  result: string;
  count: number;
}

export interface WorkforceRoleStat {
  role: string;
  count: number;
}

export interface HRDashboardData {
  kpis: HRKpiStats;
  candidatePipeline: CandidatePipelineStage[];
  departmentStats: DepartmentStat[];
  interviewResults: InterviewResultStat[];
  workforceRoles: WorkforceRoleStat[];
  recentCandidates: Candidate[];
  upcomingInterviews: Interview[];
}

export async function fetchHRDashboardStats(token?: string): Promise<HRDashboardData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/dashboard/hr`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch HR dashboard metrics");
  }

  return response.json();
}
