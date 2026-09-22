import { API_URL } from "../config/api";

export interface UserRole {
  id: number;
  name: string;
  description?: string;
}

export interface UserTeam {
  id: number;
  name: string;
  description?: string;
}

export interface UserItem {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dob?: string;
  username: string;
  status: string;
  roleId: number;
  teamId?: number | null;
  role?: UserRole;
  team?: UserTeam;
  createdAt?: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dob?: string;
  roleId: number;
  teamId?: number | null;
}

export interface CreateUserResponse {
  id: string;
  username: string;
  temporaryPassword: string;
  temporaryToken: string;
}

export async function fetchUsers(token: string): Promise<UserItem[]> {
  const response = await fetch(`${API_URL}/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchRoles(token: string): Promise<UserRole[]> {
  const response = await fetch(`${API_URL}/roles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchTeams(token: string): Promise<UserTeam[]> {
  const response = await fetch(`${API_URL}/teams`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createUser(
  token: string,
  payload: CreateUserPayload
): Promise<CreateUserResponse> {
  const response = await fetch(`${API_URL}/users`, {
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
      : data.message || "Failed to create user";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateUser(
  token: string,
  id: string,
  payload: Partial<CreateUserPayload>
): Promise<UserItem> {
  const response = await fetch(`${API_URL}/users/${id}`, {
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
      : data.message || "Failed to update user";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateUserTeam(
  token: string,
  id: string,
  teamId: number | null
): Promise<UserItem> {
  const response = await fetch(`${API_URL}/users/${id}/team`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ teamId }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update team assignment";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateUserStatus(
  token: string,
  id: string,
  status: string
): Promise<UserItem> {
  const response = await fetch(`${API_URL}/users/${id}/status`, {
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
      : data.message || "Failed to update user status";
    throw new Error(errorMsg);
  }

  return data;
}

export async function replaceSuperAdmin(
  token: string,
  newSuperAdminId: string,
  newRoleForPreviousAdminId: number
): Promise<UserItem> {
  const response = await fetch(`${API_URL}/users/replace-super-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newSuperAdminId, newRoleForPreviousAdminId }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to replace Super Admin";
    throw new Error(errorMsg);
  }

  return data;
}



