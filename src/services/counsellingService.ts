import { API_URL } from "../config/api";

export interface CollegeCounsellingItem {
  id: string;
  leadId: string;
  collegeId: string;
  leadCollegeId?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  preferredTiming?: string | null;
  purpose?: string | null;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED";
  counsellingDate?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  counsellingNotes?: string | null;
  completionRemark?: string | null;
  requestedById: string;
  requestedAt: string;
  scheduledById?: string | null;
  scheduledAt?: string | null;
  completedById?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  college?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  };
  requestedBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  };
  scheduledBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  };
  completedBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  };
  lead?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    courseInterested?: string | null;
    courseInterestedOther?: string | null;
  };
}

export function broadcastCounsellingUpdate(updated?: CollegeCounsellingItem) {
  try {
    const channel = new BroadcastChannel("crm_counselling_sync");
    channel.postMessage({ type: "COUNSELLING_UPDATED", payload: updated });
    channel.close();
  } catch {}

  try {
    localStorage.setItem("crm_counselling_last_update", Date.now().toString());
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("crm:counselling-updated", { detail: updated })
    );
  }
}

export async function fetchPendingCounselling(
  token: string
): Promise<CollegeCounsellingItem[]> {
  const res = await fetch(`${API_URL}/counselling/pending?_t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch pending counselling requests");
  }
  return res.json();
}

export interface FetchCounsellingParams {
  status?: string;
  time?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCounsellingResponse {
  data: CollegeCounsellingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchAllCounselling(
  token: string,
  paramsOrStatus?: string | FetchCounsellingParams,
  pageArg?: number,
  limitArg?: number
): Promise<PaginatedCounsellingResponse> {
  const baseUrl = `${API_URL}/counselling`;
  const urlParams = new URLSearchParams();

  if (typeof paramsOrStatus === "string") {
    if (paramsOrStatus && paramsOrStatus !== "ALL") {
      urlParams.set("status", paramsOrStatus);
    }
    if (pageArg !== undefined) urlParams.set("page", pageArg.toString());
    if (limitArg !== undefined) urlParams.set("limit", limitArg.toString());
  } else if (paramsOrStatus && typeof paramsOrStatus === "object") {
    if (paramsOrStatus.status && paramsOrStatus.status !== "ALL") {
      urlParams.set("status", paramsOrStatus.status);
    }
    if (paramsOrStatus.time && paramsOrStatus.time !== "ALL") {
      urlParams.set("time", paramsOrStatus.time.toLowerCase());
    }
    if (paramsOrStatus.fromDate) {
      urlParams.set("fromDate", paramsOrStatus.fromDate);
    }
    if (paramsOrStatus.toDate) {
      urlParams.set("toDate", paramsOrStatus.toDate);
    }
    if (paramsOrStatus.page !== undefined) {
      urlParams.set("page", paramsOrStatus.page.toString());
    }
    if (paramsOrStatus.limit !== undefined) {
      urlParams.set("limit", paramsOrStatus.limit.toString());
    }
  }

  urlParams.set("_t", Date.now().toString());
  const url = `${baseUrl}?${urlParams.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch counselling requests");
  }
  const json = await res.json();
  if (Array.isArray(json)) {
    return {
      data: json,
      total: json.length,
      page: 1,
      limit: json.length,
      totalPages: 1,
    };
  }
  return json;
}

export async function fetchCounsellingByLead(
  token: string,
  leadId: string
): Promise<CollegeCounsellingItem[]> {
  const res = await fetch(`${API_URL}/leads/${leadId}/counselling?_t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch college counselling requests");
  }
  return res.json();
}

export async function createCounsellingRequests(
  token: string,
  leadId: string,
  requests: Array<{
    collegeId: string;
    preferredDate?: string;
    preferredTime?: string;
    preferredTiming?: string;
    purpose?: string;
  }>
): Promise<CollegeCounsellingItem[]> {
  const res = await fetch(`${API_URL}/leads/${leadId}/counselling`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requests }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create counselling requests");
  }
  const data = await res.json();
  broadcastCounsellingUpdate();
  return data;
}

export async function scheduleCounsellingRequest(
  token: string,
  requestId: string,
  params: {
    scheduledDate: string;
    scheduledTime?: string;
    counsellingNotes: string;
  }
): Promise<CollegeCounsellingItem> {
  const res = await fetch(`${API_URL}/counselling/${requestId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to schedule counselling request");
  }
  const data = await res.json();
  broadcastCounsellingUpdate(data);
  return data;
}

export async function completeCounsellingRequest(
  token: string,
  requestId: string,
  remark: string,
  counsellingDate?: string
): Promise<CollegeCounsellingItem> {
  const res = await fetch(`${API_URL}/counselling/${requestId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      remark,
      revert: remark,
      ...(counsellingDate ? { counsellingDate } : {}),
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to complete counselling request");
  }
  const data = await res.json();
  broadcastCounsellingUpdate(data);
  return data;
}
