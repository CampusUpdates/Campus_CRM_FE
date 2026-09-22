import { API_URL } from "../config/api";

export interface MockCallQueueStudentItem {
  studentDataId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  createdAt: string;
  upload?: {
    id: string;
    fileName: string;
    uploadedAt: string;
  };
  assignment?: {
    id: string;
    assignedAt: string;
    expiresAt: string;
    status: string;
  };
}

export interface MockCallQueueResponse {
  items: MockCallQueueStudentItem[];
  totalAssigned: number;
}

export interface MockCallSession {
  callId: string;
  phoneNumber: string;
  status: "READY" | "CALLING" | "CONNECTED" | "ENDED" | "FAILED";
  startedAt?: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export async function fetchMockCallQueue(token: string): Promise<MockCallQueueResponse> {
  const response = await fetch(`${API_URL}/calls/queue`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch call queue");
  }
  return data;
}

export async function fetchAssignedStudentDataOne(
  token: string,
  studentDataId: string
): Promise<MockCallQueueStudentItem> {
  const response = await fetch(`${API_URL}/calls/student-data/${studentDataId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch student details");
  }
  return data;
}

export async function initiateMockCall(
  token: string,
  studentDataId: string
): Promise<{ session: MockCallSession; student: MockCallQueueStudentItem }> {
  const response = await fetch(`${API_URL}/calls/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ studentDataId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to initiate call");
  }
  return data;
}

export async function endMockCall(
  token: string,
  callId: string
): Promise<MockCallSession> {
  const response = await fetch(`${API_URL}/calls/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ callId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to end call");
  }
  return data;
}

export async function getMockCallStatus(
  token: string,
  callId: string
): Promise<MockCallSession> {
  const response = await fetch(`${API_URL}/calls/status/${callId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch call status");
  }
  return data;
}
