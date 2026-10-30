import { API_URL } from "../config/api";

export type NotificationType = "LEAD" | "TPC" | "DATA_ASSIGNMENT" | "INTERVIEW" | "SYSTEM";

export interface NotificationItem {
  id: string; // recipientId
  notificationId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
  search?: string;
}

export async function fetchNotifications(
  token: string,
  params: FetchNotificationsParams = {}
): Promise<NotificationsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.type) query.set("type", params.type);
  if (params.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params.search) query.set("search", params.search);

  const res = await fetch(`${API_URL}/notifications?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch notifications");
  }

  return res.json();
}

export async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_URL}/notifications/unread-count`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch unread count");
  }

  const data = await res.json();
  return data.count || 0;
}

export async function markNotificationAsRead(
  token: string,
  recipientId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/${recipientId}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

export async function markAllNotificationsAsRead(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
}

export async function deleteNotification(
  token: string,
  recipientId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/${recipientId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete notification");
  }
}

export async function clearAllNotifications(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/clear-all`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to clear notifications");
  }
}

export interface SidebarIndicators {
  leadsUnread?: number;
  counsellingUnread: number;
  collegesUnread: number;
  notificationsUnread: number;
}

export async function fetchSidebarIndicators(token: string): Promise<SidebarIndicators> {
  const res = await fetch(`${API_URL}/notifications/sidebar-indicators`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return { leadsUnread: 0, counsellingUnread: 0, collegesUnread: 0, notificationsUnread: 0 };
  }

  return res.json();
}

export async function markModuleSeen(
  token: string,
  module: 'COLLEGE_COUNSELLING' | 'COLLEGES' | 'LEADS'
): Promise<void> {
  await fetch(`${API_URL}/notifications/module-seen`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ module }),
  }).catch(() => {});
}
