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
  callRecords?: Array<{
    id: string;
    outcome: string;
    notes?: string | null;
    createdAt: string;
    durationSeconds?: number | null;
    createdBy?: {
      id: string;
      firstName: string;
      lastName?: string | null;
    } | null;
  }>;
}

export interface FilterStudentDataParams {
  states?: string[];
  cities?: string[];
  uploadIds?: string[];
  assignmentStatus?: "AVAILABLE" | "ASSIGNED" | "ALL";
  search?: string;
  disposition?: string;
  dispositions?: string[];
  calledById?: string;
  notCalledByUserIds?: string[];
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
  role?: {
    id: number;
    name: string;
  };
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
  if (params.dispositions && params.dispositions.length > 0) {
    query.set("dispositions", params.dispositions.join(","));
  } else if (params.disposition) {
    query.set("disposition", params.disposition);
  }
  if (params.calledById) {
    query.set("calledById", params.calledById);
  }
  if (params.notCalledByUserIds && params.notCalledByUserIds.length > 0) {
    query.set("notCalledByUserIds", params.notCalledByUserIds.join(","));
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

export interface AssigneeSummaryRecord {
  assignee: {
    id: string;
    firstName: string;
    lastName?: string | null;
    fullName: string;
    email: string;
    roleName: string;
    teamName?: string | null;
  };
  datasetsCount: number;
  datasetsList: string[];
  totalAssignedRecords: number;
  activeRecordsCount: number;
  earliestAssignedAt: string | null;
  latestAssignedAt: string | null;
  firstCallMadeAt: string | null;
  activeAssignmentsCount: number;
  totalAssignmentsCount: number;
}

export interface AssigneeAssignmentItem {
  id: string;
  fileName: string;
  recordsCount: number;
  assignedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "RECLAIMED";
  reclaimedAt?: string | null;
  assignedBy: string;
}

export interface AssigneeDetailsResponse {
  assignee: {
    id: string;
    firstName: string;
    lastName?: string | null;
    fullName: string;
    email: string;
    roleName: string;
    teamName?: string | null;
  };
  datasetsCount: number;
  totalAssignedRecords: number;
  assignments: AssigneeAssignmentItem[];
}

export async function fetchAssigneeDetails(
  token: string,
  assigneeId: string
): Promise<AssigneeDetailsResponse> {
  const response = await fetch(
    `${API_URL}/uploads/data-assignments/assignee/${assigneeId}`,
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
      : data.message || "Failed to fetch assignee details";
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchDataAssignments(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<AssigneeSummaryRecord>> {
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

export async function reclaimAssignmentById(token: string, assignmentId: string) {
  const response = await fetch(`${API_URL}/uploads/reclaim-assignment/${assignmentId}`, {
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
      : data.message || "Failed to reclaim assignment";
    throw new Error(errorMsg);
  }

  return data;
}

export interface DatasetCallerItem {
  id: string;
  name: string;
}

export async function fetchDatasetCallers(
  token: string,
  uploadId: string
): Promise<DatasetCallerItem[]> {
  const response = await fetch(`${API_URL}/uploads/${uploadId}/callers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function exportDatasetResponseHistory(
  token: string,
  uploadId: string,
  fileName: string,
  disposition?: string,
  calledById?: string
): Promise<void> {
  const queryParams = new URLSearchParams();
  if (disposition && disposition !== "ALL") queryParams.set("disposition", disposition);
  if (calledById && calledById !== "ALL") queryParams.set("calledById", calledById);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const response = await fetch(`${API_URL}/uploads/${uploadId}/export-response${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMsg = "Failed to export dataset response history.";
    try {
      const data = await response.json();
      errorMsg = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const cleanBaseName = fileName.replace(/\.(xlsx|xls|csv)$/i, "");
  const downloadFileName = `${cleanBaseName} (response).xlsx`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", downloadFileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}



