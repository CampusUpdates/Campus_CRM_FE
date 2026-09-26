import { API_URL } from "../config/api";

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

export async function fetchAdvisorDashboardStats(token?: string): Promise<AdvisorDashboardData> {
  const response = await fetch(`${API_URL}/dashboard/advisor`, {
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
