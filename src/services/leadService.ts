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
  status?: {
    id: number;
    name: string;
    color?: string;
  };
}

export interface UpdateLeadPipelinePayload {
  statusId: number;
  collegeId?: string;
  applicationId?: string;
  interview?: {
    scheduledAt?: string;
    interviewerId?: string;
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

export async function fetchLeads(token: string): Promise<LeadItem[]> {
  const response = await fetch(`${API_URL}/leads`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
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

