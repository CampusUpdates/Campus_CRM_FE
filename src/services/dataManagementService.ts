import { API_URL } from "../config/api";

export interface StudentDataItemPayload {
  firstName: string;
  middleName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
}

export interface DataUploadItem {
  id: string;
  fileName: string;
  fileUrl?: string;
  totalRecords: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  uploadedAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
  _count?: {
    studentData?: number;
  };
}

export interface StudentDataRecord {
  id: string;
  uploadId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  createdAt: string;
  isAvailable?: boolean;
  activeAssignment?: {
    id: string;
    assignedTo?: {
      firstName: string;
      lastName?: string;
    };
  };
  upload?: {
    id: string;
    fileName: string;
    uploadedAt: string;
  };
}

export interface FilterStudentDataParams {
  states?: string[];
  cities?: string[];
  uploadIds?: string[];
  assignmentStatus?: "AVAILABLE" | "ASSIGNED" | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}

export interface FilteredStudentDataResponse {
  data: StudentDataRecord[];
  meta: {
    total: number;
    availableCount: number;
    assignedCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  distribution: Record<string, number>;
  filterOptions: {
    states: string[];
    cities: string[];
    uploads: { id: string; fileName: string }[];
  };
}

export interface EligibleProgramAdvisor {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  username: string;
  team?: {
    id: number;
    name: string;
  };
}

export interface CreateDataAssignmentPayload {
  assignedToId: string;
  selectionMode?: "EXPLICIT" | "ALL_MATCHING";
  studentDataIds?: string[];
  quantity?: number;
  filters?: FilterStudentDataParams;
  expiryDays?: number;
}

export interface DataAssignmentRecord {
  id: string;
  assignedToId?: string;
  assignedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "RECLAIMED";
  assignedTo?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    email?: string;
    team?: {
      name: string;
    };
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
  };
  _count?: {
    items: number;
  };
}

export interface RecentCallRecord {
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
    email?: string | null;
  } | null;
}

export interface DataAssignmentItemDetail {
  id: number;
  studentDataId: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: string;
  recentCall?: RecentCallRecord | null;
}

export interface DataAssignmentDetailsResponse {
  id: string;
  assignedToId: string;
  assignedById: string;
  assignedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "RECLAIMED";
  reclaimedAt?: string | null;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    role?: { id: number; name: string } | null;
    team?: { id: number; name: string } | null;
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
  };
  totalRecords: number;
  items: DataAssignmentItemDetail[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchDataUploads(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<DataUploadItem>> {
  const response = await fetch(`${API_URL}/uploads?page=${page}&limit=${limit}`, {
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
      : data.message || "Failed to fetch data uploads";
    throw new Error(errorMsg);
  }

  if (Array.isArray(data)) {
    return {
      data,
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    };
  }

  return data;
}

export async function createDataUpload(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to upload student dataset file.";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchUploadDetails(
  token: string,
  uploadId: string
): Promise<DataUploadItem & { studentData: StudentDataRecord[] }> {
  const response = await fetch(`${API_URL}/uploads/${uploadId}`, {
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
      : data.message || "Failed to fetch upload details";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchFilteredStudentData(
  token: string,
  params: FilterStudentDataParams
): Promise<FilteredStudentDataResponse> {
  const query = new URLSearchParams();
  if (params.states && params.states.length > 0) {
    query.set("states", params.states.join(","));
  }
  if (params.cities && params.cities.length > 0) {
    query.set("cities", params.cities.join(","));
  }
  if (params.uploadIds && params.uploadIds.length > 0) {
    query.set("uploadIds", params.uploadIds.join(","));
  }
  if (params.assignmentStatus) {
    query.set("assignmentStatus", params.assignmentStatus);
  }
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const response = await fetch(`${API_URL}/uploads/student-data?${query.toString()}`, {
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
      : data.message || "Failed to fetch filtered student data";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchEligibleProgramAdvisors(
  token: string
): Promise<EligibleProgramAdvisor[]> {
  const response = await fetch(`${API_URL}/uploads/eligible-assignees`, {
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
      : data.message || "Failed to fetch eligible program advisors";
    throw new Error(errorMsg);
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchUnassignedStudentData(
  token: string
): Promise<StudentDataRecord[]> {
  const response = await fetch(`${API_URL}/uploads/unassigned-students`, {
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
      : data.message || "Failed to fetch unassigned student records";
    throw new Error(errorMsg);
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchDataAssignments(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<DataAssignmentRecord>> {
  const response = await fetch(
    `${API_URL}/uploads/data-assignments?page=${page}&limit=${limit}`,
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
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to fetch data assignments";
    throw new Error(errorMsg);
  }

  if (Array.isArray(data)) {
    return {
      data,
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    };
  }

  return data;
}

export async function fetchDataAssignmentDetails(
  token: string,
  assignmentId: string,
): Promise<DataAssignmentDetailsResponse> {
  const response = await fetch(
    `${API_URL}/uploads/data-assignments/${assignmentId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to fetch data assignment details";
    throw new Error(errorMsg);
  }

  return data;
}

export async function createDataAssignment(
  token: string,
  payload: CreateDataAssignmentPayload
) {
  const response = await fetch(`${API_URL}/uploads/assign-data`, {
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
      : data.message || "Failed to create data assignment";
    throw new Error(errorMsg);
  }

  return data;
}

export async function reclaimAdvisorData(
  token: string,
  advisorId: string
) {
  const response = await fetch(`${API_URL}/uploads/reclaim-advisor-data/${advisorId}`, {
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
      : data.message || "Failed to reclaim advisor data";
    throw new Error(errorMsg);
  }

  return data;
}

export async function reclaimAllAdvisorData(token: string) {
  const response = await fetch(`${API_URL}/uploads/reclaim-all-advisor-data`, {
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
      : data.message || "Failed to reclaim all advisor data";
    throw new Error(errorMsg);
  }

  return data;
}


