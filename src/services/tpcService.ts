import { API_URL } from "../config/api";
import { type LeadItem } from "./leadService";
import { type UserItem } from "./userService";

export type TPCStatus = "PENDING" | "COMPLETED" | "NO_REPLY" | "NOT_INTERESTED" | "CANCELLED";

export interface AssignTpcPayload {
  leadId: string;
  assignedToIds: string[];
}

export interface TPCCall {
  id: string;
  tpcUserId: string;
  callerId: string;
  outcome: string;
  notes?: string;
  createdAt: string;
  caller?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    email?: string;
    role?: {
      name: string;
    };
  };
  tpcUser?: {
    id: string;
    status: string;
    assignedTo?: {
      id: string;
      firstName: string;
      lastName?: string;
      role?: {
        name: string;
      };
    };
  };
}

export interface TPCUserItem {
  id: string;
  tpcId: string;
  assignedById: string;
  assignedToId: string;
  completedById?: string;
  assignedAt: string;
  completedAt?: string;
  attempts: number;
  status: TPCStatus;
  tpc?: {
    id: string;
    leadId: string;
    lead?: LeadItem;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    email?: string;
    role?: {
      name: string;
    };
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    email?: string;
    role?: {
      name: string;
    };
  };
  completedBy?: {
    id: string;
    firstName: string;
    lastName?: string;
  };
  calls?: TPCCall[];
}

export interface TPCResponse {
  id: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
  lead?: LeadItem;
  assignments?: TPCUserItem[];
}

export async function fetchTpcUsers(token: string): Promise<UserItem[]> {
  const response = await fetch(`${API_URL}/tpc/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch TPC users");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}


export async function fetchAllTpcs(token: string): Promise<TPCResponse[]> {
  const response = await fetch(`${API_URL}/tpc`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch TPC records");
  }

  return response.json();
}

export async function fetchMyTpcs(token: string): Promise<TPCUserItem[]> {
  const response = await fetch(`${API_URL}/tpc/my`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch My TPCs");
  }

  return response.json();
}

export async function fetchAssignedTpcs(token: string): Promise<TPCUserItem[]> {
  const response = await fetch(`${API_URL}/tpc/assigned`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Assigned TPCs");
  }

  return response.json();
}

export async function assignTpc(token: string, payload: AssignTpcPayload): Promise<TPCResponse> {
  const response = await fetch(`${API_URL}/tpc/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to assign TPC";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchTpcsForLead(token: string, leadId: string): Promise<TPCResponse | null> {
  const response = await fetch(`${API_URL}/tpc/lead/${leadId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export async function updateTpcAssignmentStatus(
  token: string,
  assignmentId: string,
  status?: TPCStatus,
  notes?: string,
  outcome?: string
): Promise<TPCUserItem> {
  const response = await fetch(`${API_URL}/tpc/assignment/${assignmentId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, notes, outcome }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update TPC status";
    throw new Error(errorMsg);
  }

  return data;
}

export async function deleteTpcAssignment(
  token: string,
  assignmentId: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/tpc/assignment/${assignmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete TPC assignment");
  }

  return data;
}
export interface GetTpcReportParams {
  teamId?: string | number;
  userId?: string;
  status?: string;
  period?: string;
  search?: string;
}

export interface TpcReportsResponse {
  counts: {
    activeLeadsToday: number;
    tpcAssignedToday: number;
    tpcCompleted: number;
    notAssignedTpcs: number;
  };
  data: TPCResponse[];
}

export async function fetchTpcReports(
  token: string,
  params: GetTpcReportParams = {}
): Promise<TpcReportsResponse> {
  const query = new URLSearchParams();
  if (params.teamId && params.teamId !== "ALL") query.set("teamId", String(params.teamId));
  if (params.userId && params.userId !== "ALL") query.set("userId", params.userId);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.period && params.period !== "ALL") query.set("period", params.period);
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  const url = `${API_URL}/tpc/reports${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch TPC reports");
  }

  return response.json();
}

export async function fetchTpcHistory(
  token: string,
  leadId?: string,
  assignmentId?: string
): Promise<TPCCall[]> {
  const url = leadId
    ? `${API_URL}/tpc/history/lead/${leadId}`
    : `${API_URL}/tpc/history/assignment/${assignmentId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch TPC activity history");
  }

  return response.json();
}
