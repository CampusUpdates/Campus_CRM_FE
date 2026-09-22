import { API_URL } from "../config/api";

export interface Position {
  id: number;
  title: string;
  department: string;
  description?: string;
  vacancies: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    candidates: number;
  };
}

export interface CreatePositionPayload {
  title: string;
  department: string;
  description?: string;
  vacancies?: number;
  isActive?: boolean;
}

export async function fetchPositions(token?: string): Promise<Position[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/positions`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch positions");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createPosition(
  token: string | null,
  payload: CreatePositionPayload
): Promise<Position> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/positions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to create position";
    throw new Error(errorMsg);
  }

  return data;
}
