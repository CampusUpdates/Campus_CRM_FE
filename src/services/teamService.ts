import { API_URL } from "../config/api";

export interface TeamManager {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
}

export interface TeamItem {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  managerId: string;
  manager?: TeamManager;
  memberCount?: number;
  createdAt: string;
}

export interface TeamLeadAdvisorAssignment {
  teamLeadId: string;
  advisorIds: string[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  managerId: string;
  memberIds: string[];
  teamLeadIds?: string[];
  teamLeadAdvisorAssignments?: TeamLeadAdvisorAssignment[];
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  managerId?: string;
  memberIds?: string[];
  teamLeadIds?: string[];
  teamLeadAdvisorAssignments?: TeamLeadAdvisorAssignment[];
}

export interface EligibleManager {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role?: {
    id: number;
    name: string;
  };
}

export interface EligibleMember {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  status?: string;
  role?: {
    id: number;
    name: string;
  };
  teamId?: number | null;
  team?: {
    id: number;
    name: string;
  } | null;
}

export async function fetchTeams(token: string): Promise<TeamItem[]> {
  const response = await fetch(`${API_URL}/teams`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch teams");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchEligibleManagers(token: string): Promise<EligibleManager[]> {
  const response = await fetch(`${API_URL}/teams/eligible-managers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch eligible managers");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchEligibleMembers(token: string): Promise<EligibleMember[]> {
  const response = await fetch(`${API_URL}/teams/eligible-members`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch eligible members");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamById(
  token: string,
  teamId: number | string
): Promise<TeamItem> {
  const response = await fetch(`${API_URL}/teams/${teamId}`, {
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
      : data.message || "Failed to fetch team details";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchTeamMembers(
  token: string,
  teamId: number | string
): Promise<EligibleMember[]> {
  const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
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
      : data.message || "Failed to fetch team members";
    throw new Error(errorMsg);
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchTeamLeads(
  token: string,
  teamId: number | string
): Promise<EligibleMember[]> {
  const response = await fetch(`${API_URL}/teams/${teamId}/team-leads`, {
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
      : data.message || "Failed to fetch team leads";
    throw new Error(errorMsg);
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchTeamLeadAdvisors(
  token: string,
  teamId: number | string,
  teamLeadId: string
): Promise<EligibleMember[]> {
  const response = await fetch(
    `${API_URL}/teams/${teamId}/team-leads/${teamLeadId}/advisors`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to fetch team lead advisors";
    throw new Error(errorMsg);
  }

  return Array.isArray(data) ? data : [];
}

export async function createTeam(
  token: string,
  payload: CreateTeamPayload
): Promise<TeamItem> {
  const response = await fetch(`${API_URL}/teams`, {
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
      : data.message || "Failed to create team";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateTeam(
  token: string,
  teamId: number | string,
  payload: UpdateTeamPayload
): Promise<TeamItem> {
  const response = await fetch(`${API_URL}/teams/${teamId}`, {
    method: "PATCH",
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
      : data.message || "Failed to update team";
    throw new Error(errorMsg);
  }

  return data;
}

export async function deleteTeam(
  token: string,
  teamId: number | string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/teams/${teamId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to delete team";
    throw new Error(errorMsg);
  }

  return data;
}
