import { API_URL } from "../config/api";

export async function login(
  username: string,
  password: string,
  latitude?: number,
  longitude?: number
) {
  const payload: any = {
    username,
    password,
  };

  if (latitude !== undefined && longitude !== undefined) {
    payload.latitude = latitude;
    payload.longitude = longitude;
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Invalid login credentials";
    throw new Error(errorMsg);
  }

  return data;
}

export async function changePassword(
  passwordChangeToken: string,
  oldPassword: string,
  newPassword: string
) {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${passwordChangeToken}`,
    },
    body: JSON.stringify({
      oldPassword,
      newPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update password";
    throw new Error(errorMsg);
  }

  return data;
}

export default login;