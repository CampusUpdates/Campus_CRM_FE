import { API_URL } from "../config/api";

export interface CreateLeadPayload {
  firstName: string;
  lastName?: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  gender?: string;
  city: string;
  state: string;
  dateOfBirth?: string;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  graduationPercentage?: number;
  graduationCourse?: string;
  graduationSpecialization?: string;
  courseInterested?: string;
  specializationInterested?: string;
  passingYear?: number;
  collegeIds: string[];
  source: string;
  statusId?: number;
}

export interface LeadCollegeApplication {
  id: string;
  collegeId?: string;
  college?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  applicationId?: string;
  statusId?: number;
  approvalStatus?: string;
  status?: {
    id: number;
    name: string;
    color?: string;
  };
}

export interface UpdateLeadPipelinePayload {
  statusId: number;
  collegeId?: string;
  leadCollegeId?: string;
  applicationId?: string;
  interview?: {
    scheduledAt?: string;
  };
  interviewResult?: {
    result?: string;
    feedback?: string;
    conductedAt?: string;
  };
  selectionLetter?: {
    issuedAt?: string;
    admissionLastDate?: string;
    letterUrl?: string;
  };
  admission?: {
    amount?: number;
    paymentMode?: string;
    transactionRef?: string;
    paidAt?: string;
  };
  cancellation?: {
    reason?: string;
  };
}

export interface LeadAssignmentItem {
  id: number;
  assignedAt: string;
  expiresAt: string;
  status: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
}

export interface LeadItem {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gender?: string;
  city?: string;
  state?: string;
  dateOfBirth?: string;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  graduationPercentage?: number;
  graduationCourse?: string;
  graduationSpecialization?: string;
  courseInterested?: string;
  specializationInterested?: string;
  passingYear?: number;
  source?: string;
  createdAt: string;
  statusId?: number;
  status?: {
    id: number;
    name: string;
    color?: string;
  };
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  assignments?: LeadAssignmentItem[];
  collegeApplications?: LeadCollegeApplication[];
}



export interface LeadStatusItem {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

export async function createLead(token: string, payload: CreateLeadPayload) {
  const response = await fetch(`${API_URL}/leads`, {
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
      : data.message || "Failed to create lead";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateLead(
  token: string,
  leadId: string,
  payload: Partial<CreateLeadPayload> & { statusId?: number }
) {
  const response = await fetch(`${API_URL}/leads/${leadId}`, {
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
      : data.message || "Failed to update lead";
    throw new Error(errorMsg);
  }

  return data;
}

export interface FetchLeadsParams {
  search?: string;
  statusGroup?: string;
  status?: string;
  time?: string;
  fromDate?: string;
  toDate?: string;
  date?: string;
  teamId?: string;
  assignedToId?: string;
  admissionDueDate?: string;
  admissionOverdue?: string;
  page?: number;
  limit?: number;
}

export interface FetchLeadsResponse {
  data: LeadItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  tabCounts: {
    all: number;
    lead: number;
    interested: number;
    admission: number;
    closed: number;
  };
}

export async function fetchLeads(
  token: string,
  params?: FetchLeadsParams
): Promise<FetchLeadsResponse> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, String(val));
      }
    });
  }
  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_URL}/leads${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }

  const res = await response.json();
  if (Array.isArray(res)) {
    return {
      data: res,
      total: res.length,
      page: 1,
      limit: res.length || 10,
      totalPages: 1,
      tabCounts: {
        all: res.length,
        lead: 0,
        interested: 0,
        admission: 0,
        closed: 0,
      },
    };
  }
  return res;
}

export async function fetchLeadById(token: string, leadId: string): Promise<LeadItem> {
  const response = await fetch(`${API_URL}/leads/${leadId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch lead details");
  }

  return response.json();
}

export async function fetchLeadStatuses(token: string): Promise<LeadStatusItem[]> {
  const response = await fetch(`${API_URL}/lead-status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export interface LeadEligibility {
  isEligible: boolean;
  reason?: string;
  errorCode?: "PERMANENT" | "ACTIVE_WINDOW" | "PROTECTED";
  expiresAt?: string;
}

export async function claimLead(token: string, leadId: string) {
  const response = await fetch(`${API_URL}/leads/${leadId}/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to claim lead";
    throw new Error(errorMsg);
  }

  return data;
}

export async function assignLead(
  token: string,
  leadId: string,
  targetUserId: string
) {
  const response = await fetch(`${API_URL}/leads/${leadId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetUserId }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to assign lead";
    throw new Error(errorMsg);
  }

  return data;
}

export async function assignBulkLeads(
  token: string,
  payload: { quantity: number; targetUserId: string; teamId?: number }
) {
  const response = await fetch(`${API_URL}/leads/bulk-assign`, {
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
      : data.message || "Failed to bulk assign leads";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchAssignableLeadsCount(
  token: string
): Promise<number> {
  const response = await fetch(`${API_URL}/leads/assignable-count`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return typeof data.assignableCount === "number" ? data.assignableCount : 0;
}

export interface PhoneSearchResult {
  exists: boolean;
  leadId?: string;
  firstName?: string;
  lastName?: string;
  status?: {
    id: number;
    name: string;
    color?: string;
  };
  activeAssignment?: {
    id: number;
    assignedAt: string;
    expiresAt: string;
    status: string;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
    };
  };
  collegeApplications?: any[];
}

export async function searchLeadByPhone(
  token: string,
  phone: string
): Promise<PhoneSearchResult> {
  const response = await fetch(
    `${API_URL}/leads/search?phone=${encodeURIComponent(phone)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return { exists: false };
  }

  return data;
}

export async function updateLeadPipeline(
  token: string,
  leadId: string,
  payload: UpdateLeadPipelinePayload
) {
  const response = await fetch(`${API_URL}/leads/${leadId}/pipeline`, {
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
      : data.message || "Failed to update lead pipeline";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchLead360Profile(token: string, leadId: string) {
  const response = await fetch(`${API_URL}/leads/${leadId}/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to fetch Lead 360 Profile";
    throw new Error(errorMsg);
  }

  return data;
}

export interface ClaimRequestItem {
  requestId: string;
  leadId: string;
  leadName: string;
  phone: string;
  email?: string;
  currentOwner?: {
    id?: string;
    name?: string;
    email?: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  processedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  processedAt?: string | null;
  remarks?: string | null;
}

export async function createLeadClaimRequest(token: string, leadId: string) {
  const response = await fetch(`${API_URL}/leads/${leadId}/claim-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to submit lead claim request";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchClaimRequests(
  token: string,
  status?: string
): Promise<ClaimRequestItem[]> {
  const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${API_URL}/leads/claim-requests${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to fetch claim requests";
    throw new Error(errorMsg);
  }

  return data;
}

export async function processClaimRequest(
  token: string,
  requestId: string,
  payload: { status: "APPROVED" | "REJECTED"; remarks?: string }
) {
  const response = await fetch(`${API_URL}/leads/claim-requests/${requestId}`, {
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
      : data.message || "Failed to process claim request";
    throw new Error(errorMsg);
  }

  return data;
}


