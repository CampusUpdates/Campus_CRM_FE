import { API_URL } from "../config/api";

export interface College {
  id: string;
  name: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  admissionProcess?: string;
  hasTieUp?: boolean;
  isActive?: boolean;
  requiresApproval?: boolean;
}

export interface CreateCollegePayload {
  name: string;
  description: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  admissionProcess?: string;
  hasTieUp?: boolean;
  isActive?: boolean;
  requiresApproval?: boolean;
}

export interface UpdateCollegePayload {
  name?: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  admissionProcess?: string;
  hasTieUp?: boolean;
  isActive?: boolean;
  requiresApproval?: boolean;
}

export async function fetchActiveColleges(token: string, search?: string): Promise<College[]> {
  const url = search ? `${API_URL}/colleges?search=${encodeURIComponent(search)}` : `${API_URL}/colleges`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch colleges");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createCollege(
  token: string,
  payload: CreateCollegePayload
): Promise<College> {
  const response = await fetch(`${API_URL}/colleges`, {
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
      : data.message || "Failed to create college";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateCollege(
  token: string,
  id: string,
  payload: UpdateCollegePayload
): Promise<College> {
  const response = await fetch(`${API_URL}/colleges/${id}`, {
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
      : data.message || "Failed to update college";
    throw new Error(errorMsg);
  }

  return data;
}

export async function deleteCollege(
  token: string,
  id: string
): Promise<College> {
  const response = await fetch(`${API_URL}/colleges/${id}`, {
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
      : data.message || "Failed to remove college";
    throw new Error(errorMsg);
  }

  return data;
}
