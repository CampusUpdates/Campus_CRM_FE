import { API_URL } from "../config/api";
import type { Candidate } from "./candidateService";
import type { UserItem } from "./userService";

export type InterviewStatusType = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type InterviewResultType = "PENDING" | "PASSED" | "FAILED" | "ON_HOLD";

export interface Interview {
  id: string;
  candidateId: string;
  interviewerId: string;
  scheduledAt: string;
  status: InterviewStatusType;
  result: InterviewResultType;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  candidate?: Candidate;
  interviewer?: Partial<UserItem>;
}

export interface CreateInterviewPayload {
  candidateId: string;
  interviewerId: string;
  scheduledAt: string;
  status?: InterviewStatusType;
  result?: InterviewResultType;
  feedback?: string;
}

export interface UpdateInterviewPayload {
  interviewerId?: string;
  scheduledAt?: string;
  status?: InterviewStatusType;
  result?: InterviewResultType;
  feedback?: string;
}

export async function fetchInterviews(token?: string): Promise<Interview[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/interviews`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch interviews");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createInterview(
  token: string | null,
  payload: CreateInterviewPayload
): Promise<Interview> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/interviews`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to schedule interview";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateInterview(
  token: string | null,
  id: string,
  payload: UpdateInterviewPayload
): Promise<Interview> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/interviews/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update interview details";
    throw new Error(errorMsg);
  }

  return data;
}
