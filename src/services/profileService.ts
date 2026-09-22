import { API_URL } from "../config/api";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  dob?: string | null;
  username: string;
  status: "ACTIVE" | "INACTIVE";
  roleId: number;
  teamId?: number | null;
  managerId?: string | null;
  createdAt: string;
  updatedAt: string;
  role?: {
    id: number;
    name: string;
    description?: string;
  };
  team?: {
    id: number;
    name: string;
    code?: string;
  } | null;
  manager?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  } | null;
  _count?: {
    createdLeads?: number;
    conductedInterviews?: number;
    attendance?: number;
  };
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  alternatePhone?: string;
  dob?: string;
}

export async function fetchUserProfile(token?: string): Promise<UserProfile> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}

export async function updateUserProfile(
  token: string | null,
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update profile";
    throw new Error(errorMsg);
  }

  return data;
}
