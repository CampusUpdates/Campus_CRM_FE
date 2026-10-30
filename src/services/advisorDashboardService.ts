import { API_URL } from "../config/api";

export type AdvisorDatePeriod = "today" | "this_week" | "this_month" | "custom";

export interface AdvisorDateFilter {
  period: AdvisorDatePeriod;
  startDate?: string; // ISO date string YYYY-MM-DD, used for "custom" only
  endDate?: string;   // ISO date string YYYY-MM-DD, used for "custom" only
}

export interface AdvisorKPIs {
  totalLeads: number;
  admissionsDone: number;
  callsTodayCount?: number;
  inProgressApplications: number;
  conversionRate: number;
  pitchesTotal: number;
  pitchesApproved: number;
  tpcsTotal: number;
  tpcsCompleted: number;
}

export interface PipelineStageBreakdown {
  id: number;
  name: string;
  color?: string;
  description?: string;
  count: number;
  percentage: number;
}

export interface OutcomeBreakdown {
  status: string;
  count: number;
  color: string;
}

export interface MonthlyTrendItem {
  month: string;
  leads: number;
  admissions: number;
}

export interface RecentAdvisorLead {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  courseInterested?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
  status?: {
    id: number;
    name: string;
    color?: string;
  };
  collegeApplications?: Array<{
    id: string;
    college?: {
      name: string;
    };
  }>;
}

export interface AdvisorDashboardData {
  kpis: AdvisorKPIs;
  pipelineBreakdown: PipelineStageBreakdown[];
  pitchOutcomes: OutcomeBreakdown[];
  tpcBreakdown: OutcomeBreakdown[];
  monthlyTrend: MonthlyTrendItem[];
  recentLeads: RecentAdvisorLead[];
}

export async function fetchAdvisorDashboardStats(
  token?: string,
  filter?: AdvisorDateFilter,
): Promise<AdvisorDashboardData> {
  const params = new URLSearchParams();
  if (filter) {
    params.set("period", filter.period);
    if (filter.period === "custom" && filter.startDate) {
      params.set("startDate", filter.startDate);
    }
    if (filter.period === "custom" && filter.endDate) {
      params.set("endDate", filter.endDate);
    }
  }

  const queryString = params.toString();
  const url = `${API_URL}/dashboard/advisor${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Program Advisor dashboard statistics");
  }

  return response.json();
}
