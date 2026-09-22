import { API_URL } from "../config/api";
import { type LeadItem } from "./leadService";
import { type UserItem } from "./userService";

export type TPCStatus = "PENDING" | "COMPLETED" | "NO_REPLY" | "NOT_INTERESTED" | "CANCELLED";

export interface AssignTpcPayload {
  leadId: string;
  assignedToIds: string[];
}

export interface TPCUserItem {
  id: string;
  tpcId: string;
  assignedById: string;
  assignedToId: string;
  completedById?: string;
  assignedAt: string;
  completedAt?: string;
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

  return response.json();
}

export async function updateTpcAssignmentStatus(
  token: string,
  assignmentId: string,
  status: TPCStatus
): Promise<TPCUserItem> {
  const response = await fetch(`${API_URL}/tpc/assignment/${assignmentId}/status`, {
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
