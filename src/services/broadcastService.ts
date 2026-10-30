import { API_URL } from "../config/api";

export interface RecipientUser {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  roleId: number;
  teamId?: number | null;
  role?: { id: number; name: string };
  team?: { id: number; name: string };
}

export interface PreviewRecipientsResponse {
  count: number;
  recipients: RecipientUser[];
}

export interface CreateBroadcastPayload {
  title: string;
  body: string;
  targetAll?: boolean;
  targetRoles?: number[];
  targetTeams?: number[];
  targetUserIds?: string[];
}

export interface BroadcastSummaryItem {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  sentAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    role?: {
      id: number;
      name: string;
    };
  };
  targetAll?: boolean;
  targetRoles?: number[];
  targetTeams?: number[];
  targetUserIds?: string[];
  targetAudience?: string;
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
  acknowledgedCount: number;
  pendingAckCount: number;
}

export interface EmployeeBroadcastItem {
  id: string;
  recipientRecordId: string;
  title: string;
  body: string;
  sentAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    role?: {
      id: number;
      name: string;
    };
  };
  deliveredAt: string;
  readAt?: string | null;
  acknowledgedAt?: string | null;
  isRead: boolean;
  isAcknowledged: boolean;
}

export interface BroadcastDetailResponse {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  sentAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    role?: {
      id: number;
      name: string;
    };
  };
  targetAudience?: string;
  recipientStatus?: {
    isRead: boolean;
    readAt?: string | null;
    isAcknowledged: boolean;
    acknowledgedAt?: string | null;
  } | null;
  metrics?: {
    totalRecipients: number;
    deliveredCount: number;
    readCount: number;
    unreadCount: number;
    acknowledgedCount: number;
    pendingAckCount: number;
  };
}

export interface RecipientTrackingItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  team: string;
  deliveredAt?: string;
  readAt?: string | null;
  acknowledgedAt?: string | null;
  isRead: boolean;
  isAcknowledged: boolean;
}

export interface RecipientsReportResponse {
  broadcast: {
    id: string;
    title: string;
    body?: string;
    createdAt: string;
    sentAt: string;
    createdBy?: {
      id: string;
      firstName: string;
      lastName?: string | null;
      email: string;
      role?: {
        id: number;
        name: string;
      };
    };
    targetAll?: boolean;
    targetRoles?: number[];
    targetTeams?: number[];
    targetUserIds?: string[];
    targetAudience?: string;
  };
  metrics: {
    totalRecipients: number;
    deliveredCount: number;
    readCount: number;
    unreadCount: number;
    acknowledgedCount: number;
    pendingAckCount: number;
  };
  data: RecipientTrackingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RecipientFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  teamId?: string;
  roleId?: string;
  readStatus?: "ALL" | "READ" | "UNREAD";
  ackStatus?: "ALL" | "ACKNOWLEDGED" | "PENDING";
}

export interface FetchBroadcastsParams {
  page?: number;
  limit?: number;
  search?: string;
  ackStatus?: 'ALL' | 'ACKNOWLEDGED' | 'PENDING';
  readStatus?: 'ALL' | 'READ' | 'UNREAD';
  inbox?: boolean;
  senderRole?: string;
  senderId?: string;
  teamId?: string;
  time?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Preview resolved recipients given target filters
 */
export async function previewBroadcastRecipients(
  token: string,
  payload: {
    targetAll?: boolean;
    targetRoles?: number[];
    targetTeams?: number[];
    targetUserIds?: string[];
  }
): Promise<PreviewRecipientsResponse> {
  const res = await fetch(`${API_URL}/broadcasts/recipients/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to preview recipients");
  }

  return res.json();
}

/**
 * Send a new broadcast message
 */
export async function sendBroadcast(
  token: string,
  payload: CreateBroadcastPayload
): Promise<any> {
  const res = await fetch(`${API_URL}/broadcasts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to send broadcast");
  }

  return res.json();
}

export async function fetchBroadcasts(
  token: string,
  params: FetchBroadcastsParams = {}
): Promise<{ data: any[]; meta: any }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.ackStatus && params.ackStatus !== 'ALL') query.set("ackStatus", params.ackStatus);
  if (params.readStatus && params.readStatus !== 'ALL') query.set("readStatus", params.readStatus);
  if (params.inbox) query.set("inbox", "true");
  if (params.senderRole && params.senderRole !== 'ALL') query.set("senderRole", params.senderRole);
  if (params.senderId && params.senderId !== 'ALL') query.set("senderId", params.senderId);
  if (params.teamId && params.teamId !== 'ALL') query.set("teamId", params.teamId);
  if (params.time && params.time !== 'ALL') query.set("time", params.time);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);

  const res = await fetch(`${API_URL}/broadcasts?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch broadcasts");
  }

  return res.json();
}

/**
 * Fetch broadcast details by ID
 */
export async function fetchBroadcastById(
  token: string,
  id: string
): Promise<BroadcastDetailResponse> {
  const res = await fetch(`${API_URL}/broadcasts/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch broadcast details");
  }

  return res.json();
}

/**
 * Mark a broadcast as read for current user
 */
export async function markBroadcastRead(
  token: string,
  id: string
): Promise<any> {
  const res = await fetch(`${API_URL}/broadcasts/${id}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to mark broadcast as read");
  }

  return res.json();
}

/**
 * Explicitly acknowledge broadcast ("I Acknowledge")
 */
export async function acknowledgeBroadcast(
  token: string,
  id: string
): Promise<any> {
  const res = await fetch(`${API_URL}/broadcasts/${id}/acknowledge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to acknowledge broadcast");
  }

  return res.json();
}

/**
 * Fetch recipient tracking report for admin
 */
export async function fetchRecipientsReport(
  token: string,
  broadcastId: string,
  params: RecipientFilterParams = {}
): Promise<RecipientsReportResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.teamId) query.set("teamId", params.teamId);
  if (params.roleId) query.set("roleId", params.roleId);
  if (params.readStatus) query.set("readStatus", params.readStatus);
  if (params.ackStatus) query.set("ackStatus", params.ackStatus);

  const res = await fetch(
    `${API_URL}/broadcasts/${broadcastId}/recipients?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch recipients report");
  }

  return res.json();
}

/**
 * Export recipients report as CSV
 */
export async function exportRecipientsReportCsv(
  token: string,
  broadcastId: string,
  params: RecipientFilterParams = {}
): Promise<Blob> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.teamId) query.set("teamId", params.teamId);
  if (params.roleId) query.set("roleId", params.roleId);
  if (params.readStatus) query.set("readStatus", params.readStatus);
  if (params.ackStatus) query.set("ackStatus", params.ackStatus);

  const res = await fetch(
    `${API_URL}/broadcasts/${broadcastId}/recipients/export?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to export acknowledgement report");
  }

  return res.blob();
}
