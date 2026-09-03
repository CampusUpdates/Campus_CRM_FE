import { API_URL } from "../config/api";
import type { Position } from "./positionService";

export type GenderType = "MALE" | "FEMALE" | "OTHER";

export type CandidateStatusType =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEWED"
  | "SELECTED"
  | "REJECTED"
  | "HIRED";

export interface Candidate {
  id: string;
  positionId: number;
  firstName: string;
  lastName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gender?: GenderType;
  dateOfBirth?: string;
  resumeUrl?: string;
  experience?: number;
  currentCompany?: string;
  status: CandidateStatusType;
  createdAt: string;
  updatedAt: string;
  position?: Position;
}

export interface CreateCandidatePayload {
  positionId: number;
  firstName: string;
  lastName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gender?: GenderType;
  dateOfBirth?: string;
  resumeUrl?: string;
  experience?: number;
  currentCompany?: string;
  status?: CandidateStatusType;
}

export async function fetchCandidates(token?: string): Promise<Candidate[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/candidates`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch candidates");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createCandidate(
  token: string | null,
  payload: CreateCandidatePayload
): Promise<Candidate> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/candidates`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to create candidate";
    throw new Error(errorMsg);
  }

  return data;
}
