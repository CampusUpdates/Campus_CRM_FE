import { API_URL } from "../config/api";

export interface PitchApprovalItem {
  id: string;
  leadId: string;
  collegeId: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  coursePitched?: string | null;
  specializationPitched?: string | null;
  feePitched?: number | null;
  createdAt: string;
  updatedAt: string;
  lead: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
    email?: string | null;
    city?: string | null;
    state?: string | null;
  };
  college: {
    id: string;
    name: string;
  };
  pitchedBy: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  };
  processedBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  } | null;
}

export async function fetchPitchApprovals(
  token: string,
  status?: string
): Promise<PitchApprovalItem[]> {
  const queryParams = new URLSearchParams();
  if (status) {
    queryParams.append("status", status);
  }
  const queryString = queryParams.toString();
  const url = `${API_URL}/leads/pitches/approvals${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to fetch college approvals";
    throw new Error(errorMsg);
  }

  return data;
}

export async function processPitchApproval(
  token: string,
  pitchId: string,
  status: "APPROVED" | "REJECTED"
): Promise<PitchApprovalItem> {
  const url = `${API_URL}/leads/pitches/${pitchId}/approval`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to process college approval";
    throw new Error(errorMsg);
  }

  return data;
}
