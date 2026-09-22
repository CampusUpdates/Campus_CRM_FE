import { API_URL } from "../config/api";

export interface ActivityLogUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  role?: {
    name: string;
  };
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  activity: string;
  entityType: string;
  entityId: string;
  description?: string;
  createdAt: string;
  user?: ActivityLogUser;
}

export interface ActivityLogResponse {
  data: ActivityLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface FetchActivityLogParams {
  page?: number;
  limit?: number;
  activity?: string;
  entityType?: string;
  userId?: string;
  search?: string;
}

export async function fetchActivityLogs(
  token: string,
  paramsOrPage: FetchActivityLogParams | number = 1,
  limit: number = 20
): Promise<ActivityLogResponse> {
  const query = new URLSearchParams();

  if (typeof paramsOrPage === "object") {
    if (paramsOrPage.page) query.set("page", String(paramsOrPage.page));
    if (paramsOrPage.limit) query.set("limit", String(paramsOrPage.limit));
    if (paramsOrPage.activity) query.set("activity", paramsOrPage.activity);
    if (paramsOrPage.entityType) query.set("entityType", paramsOrPage.entityType);
    if (paramsOrPage.userId) query.set("userId", paramsOrPage.userId);
    if (paramsOrPage.search) query.set("search", paramsOrPage.search);
  } else {
    query.set("page", String(paramsOrPage));
    query.set("limit", String(limit));
  }

  const response = await fetch(
    `${API_URL}/activity-logs?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch activity logs");
  }

  return response.json();
}

