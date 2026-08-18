import { API_URL } from "../config/api";

export interface CreateLeadDto {
  firstName: string;
  lastName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  city?: string;
  state?: string;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  graduationPercentage?: number;
  graduationCourse?: string;
  graduationSpecialization?: string;
  courseInterested?: "MBA" | "PGDM" | "MCA" | "BBA";
  specializationInterested?: string;
  passingYear?: number;
  collegeIds?: string[];
  source: "WEBSITE" | "FACEBOOK" | "INSTAGRAM" | "GOOGLE" | "REFERRAL" | "DATA_UPLOAD" | "COLLEGE_EVENT" | "OTHER";
}

export interface CollegeItem {
  id: string;
  name: string;
  city?: string;
  state?: string;
  isActive: boolean;
}

export async function getColleges(isActive = true): Promise<CollegeItem[]> {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${API_URL}/colleges?isActive=${isActive}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Failed to fetch colleges";
    throw new Error(errorMessage);
  }

  return data;
}

export default async function createLead(payload: CreateLeadDto) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${API_URL}/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Failed to create lead";
    throw new Error(errorMessage);
  }

  return data;
}
