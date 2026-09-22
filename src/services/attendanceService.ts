import { API_URL } from "../config/api";

export type AttendanceStatusType = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "CASUAL_LEAVE";

export interface AttendanceUserTeamManager {
  id: string;
  firstName: string;
  lastName?: string;
}

export interface AttendanceUserTeam {
  id: number;
  name: string;
  manager?: AttendanceUserTeamManager | null;
}

export interface AttendanceUserRole {
  id: number;
  name: string;
}

export interface AttendanceUser {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: AttendanceUserRole;
  team?: AttendanceUserTeam;
}

export interface AttendanceOffice {
  id: number;
  name: string;
}

export interface AttendanceRecordItem {
  id: string;
  userId: string;
  officeId?: number;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatusType;
  workingHours?: string | null;
  user: AttendanceUser;
  office?: AttendanceOffice | null;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  casualLeave: number;
}

export interface AttendanceResponse {
  records: AttendanceRecordItem[];
  summary: AttendanceSummary;
}

export interface FetchAttendanceFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  search?: string;
  status?: string;
  teamId?: string;
  roleId?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export async function fetchAttendanceRecords(
  token: string,
  filters: FetchAttendanceFilters = {}
): Promise<AttendanceResponse> {
  const url = new URL(`${API_URL}/attendance`);

  if (filters.date) url.searchParams.set("date", filters.date);
  if (filters.startDate) url.searchParams.set("startDate", filters.startDate);
  if (filters.endDate) url.searchParams.set("endDate", filters.endDate);
  if (filters.userId) url.searchParams.set("userId", filters.userId);
  if (filters.search && filters.search.trim()) url.searchParams.set("search", filters.search.trim());
  if (filters.status && filters.status !== "ALL") url.searchParams.set("status", filters.status);
  if (filters.teamId && filters.teamId !== "all") url.searchParams.set("teamId", filters.teamId);
  if (filters.roleId && filters.roleId !== "all") url.searchParams.set("roleId", filters.roleId);
  if (filters.role && filters.role !== "all") url.searchParams.set("role", filters.role);
  if (filters.page) url.searchParams.set("page", String(filters.page));
  if (filters.limit) url.searchParams.set("limit", String(filters.limit));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || "Failed to fetch attendance records");
  }

  const data = await response.json();
  return {
    records: Array.isArray(data.records) ? data.records : [],
    summary: data.summary || {
      total: 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      casualLeave: 0,
    },
  };
}
