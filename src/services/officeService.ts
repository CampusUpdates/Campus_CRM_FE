import { API_URL } from "../config/api";

export interface OfficeItem {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOfficePayload {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number;
  isActive?: boolean;
}

export interface UpdateOfficePayload {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number;
  isActive?: boolean;
}

export async function fetchOffices(token: string): Promise<OfficeItem[]> {
  const response = await fetch(`${API_URL}/office`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch office locations.");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchOffice(token: string, id: number): Promise<OfficeItem> {
  const response = await fetch(`${API_URL}/office/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch office details.");
  }

  return data;
}

export async function createOffice(
  token: string,
  payload: CreateOfficePayload
): Promise<OfficeItem> {
  const response = await fetch(`${API_URL}/office`, {
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
      : data.message || "Failed to create office location.";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateOffice(
  token: string,
  id: number,
  payload: UpdateOfficePayload
): Promise<OfficeItem> {
  const response = await fetch(`${API_URL}/office/${id}`, {
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
      : data.message || "Failed to update office location.";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateOfficeStatus(
  token: string,
  id: number,
  isActive: boolean
): Promise<OfficeItem> {
  const response = await fetch(`${API_URL}/office/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update office active status.";
    throw new Error(errorMsg);
  }

  return data;
}
