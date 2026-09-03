import { API_URL } from "../config/api";

export interface CreateInteractionPayload {
  leadId: string;
  title?: string;
  description: string;
}

export interface InteractionItem {
  id: string;
  leadId: string;
  createdById: string;
  title?: string;
  description: string;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    email?: string;
    role?: {
      name: string;
    };
  };
}

export async function createInteraction(
  token: string,
  payload: CreateInteractionPayload
): Promise<InteractionItem> {
  const response = await fetch(`${API_URL}/interactions`, {
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
      : data.message || "Failed to create interaction";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchLeadInteractions(
  token: string,
  leadId: string
): Promise<InteractionItem[]> {
  const response = await fetch(`${API_URL}/interactions/lead/${leadId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch lead interactions");
  }

  return response.json();
}
