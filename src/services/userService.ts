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
  teamId?: number;
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
  teamId?: number;
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
