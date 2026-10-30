import { API_URL } from "../config/api";

export interface MetricStudentItem {
  id: string;
  leadId?: string | null;
  studentName: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  notes?: string | null;
  status: string;
  statusColor?: string;
  date: string;
  dateLabel: string;
  course?: string | null;
  college?: string | null;
  assignedAdvisor?: string | null;
  team?: string | null;
}

export interface MetricStudentsResponse {
  data: MetricStudentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchMetricStudentsParams {
  metric: string;
  teamId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchMetricStudents(
  token: string,
  params: FetchMetricStudentsParams,
  signal?: AbortSignal
): Promise<MetricStudentsResponse> {
  const query = new URLSearchParams();
  query.append("metric", params.metric);
  if (params.teamId && params.teamId !== "all") {
    query.append("teamId", params.teamId);
  }
  if (params.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }
  if (params.page) {
    query.append("page", String(params.page));
  }
  if (params.limit) {
    query.append("limit", String(params.limit));
  }

  const response = await fetch(`${API_URL}/dashboard/metric-students?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch student records for this metric");
  }

  return response.json();
}
