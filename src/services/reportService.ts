import { API_URL } from "../config/api";
import { type LeadItem } from "./leadService";

export interface CRMReportFilterParams {
  period?: string;
  startDate?: string;
  endDate?: string;
  collegeId?: string;
  memberId?: string;
  statusId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SummaryMetrics {
  total: number;
  applications: number;
  interviewScheduled: number;
  interviewDone: number;
  selected: number;
  letterOut: number;
  admissionsDone: number;
  cancelled: number;
}

export interface PerformanceItem {
  id: string;
  name: string;
  leads: number;
  apps: number;
  interviews?: number;
  admissions: number;
}

export interface CRMReportResponse {
  summaryMetrics: SummaryMetrics;
  collegeWiseData: PerformanceItem[];
  memberWiseData: PerformanceItem[];
  leadDataset: LeadItem[];
  totalFilteredCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CRMReportExportResponse {
  leads: LeadItem[];
  totalCount: number;
}

export const fetchCRMReport = async (
  token: string,
  params: CRMReportFilterParams = {}
): Promise<CRMReportResponse> => {
  const query = new URLSearchParams();
  if (params.period) query.append("period", params.period);
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.collegeId) query.append("collegeId", params.collegeId);
  if (params.memberId) query.append("memberId", params.memberId);
  if (params.statusId) query.append("statusId", params.statusId);
  if (params.search) query.append("search", params.search);
  if (params.page) query.append("page", params.page.toString());
  if (params.pageSize) query.append("pageSize", params.pageSize.toString());

  const response = await fetch(`${API_URL}/reports/crm?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch CRM report");
  }

  return response.json();
};

export const fetchCRMReportExport = async (
  token: string,
  params: CRMReportFilterParams = {}
): Promise<CRMReportExportResponse> => {
  const query = new URLSearchParams();
  if (params.period) query.append("period", params.period);
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.collegeId) query.append("collegeId", params.collegeId);
  if (params.memberId) query.append("memberId", params.memberId);
  if (params.statusId) query.append("statusId", params.statusId);
  if (params.search) query.append("search", params.search);

  const response = await fetch(`${API_URL}/reports/crm/export?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export CRM report dataset");
  }

  return response.json();
};
