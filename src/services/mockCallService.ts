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
  isCompleted?: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
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
  completedCount?: number;
  initialIndex?: number;
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

export interface CreateCallOutcomePayload {
  studentDataId: string;
  leadId?: string;
  outcome: string;
  notes?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export async function recordCallOutcome(
  token: string,
  payload: CreateCallOutcomePayload
): Promise<any> {
  const response = await fetch(`${API_URL}/calls/outcome`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to record call outcome");
  }
  return data;
}

export interface CallRecordItem {
  id: string;
  studentDataId: string;
  leadId?: string | null;
  createdById: string;
  outcome: string;
  notes?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  };
  studentData?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
    category?: {
      id: string;
      name: string;
    } | null;
    upload?: {
      id: string;
      fileName: string;
    } | null;
  } | null;
}

export async function fetchCallHistory(
  token: string,
  studentDataId: string
): Promise<CallRecordItem[]> {
  const response = await fetch(`${API_URL}/calls/history/${studentDataId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch call history");
  }
  return data;
}

export interface CallLogItem {
  studentDataId: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  uploadFileName: string;
  totalCalls: number;
  latestCall?: {
    id: string;
    outcome: string;
    notes?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
    durationSeconds?: number | null;
    createdAt: string;
    createdBy?: {
      id: string;
      firstName: string;
      lastName?: string | null;
    };
  } | null;
  isBookmarked: boolean;
  bookmarkExpiresAt?: string | null;
}

export interface CallLogsResponse {
  data: CallLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  bookmarkedCount?: number;
}

export async function fetchCallLogs(
  token: string,
  params: { page?: number; limit?: number; search?: string; bookmarkedOnly?: boolean } = {}
): Promise<CallLogsResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.bookmarkedOnly) queryParams.append("bookmarkedOnly", "true");

  const response = await fetch(`${API_URL}/calls/logs?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch call logs");
  }
  return data;
}
