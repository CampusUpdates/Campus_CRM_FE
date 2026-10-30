import { API_URL } from "../config/api";

export async function fetchLocationStatus(): Promise<{ locationValidationEnabled: boolean }> {
  try {
    const response = await fetch(`${API_URL}/auth/location-status`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve system location validation status.");
    }

    const data = await response.json();
    return {
      locationValidationEnabled: Boolean(data.locationValidationEnabled),
    };
  } catch (err: any) {
    throw new Error(err.message || "Network error while checking location validation status.");
  }
}

export async function login(
  username: string,
  password: string,
  latitude?: number,
  longitude?: number
) {
  const payload: Record<string, any> = {
    username,
    password,
  };

  if (latitude !== undefined && latitude !== null && typeof latitude === "number" && !isNaN(latitude)) {
    payload.latitude = latitude;
  }
  if (longitude !== undefined && longitude !== null && typeof longitude === "number" && !isNaN(longitude)) {
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
    const isLocationReq =
      data?.locationRequired === true ||
      data?.message?.locationRequired === true ||
      (typeof data?.message === "object" && data?.message !== null && data?.message?.locationRequired === true);

    const rawMessage = data?.message;
    let errorMsg = "Invalid login credentials";

    if (typeof rawMessage === "string") {
      errorMsg = rawMessage;
    } else if (Array.isArray(rawMessage)) {
      errorMsg = rawMessage.join(", ");
    } else if (typeof rawMessage === "object" && rawMessage !== null && typeof rawMessage.message === "string") {
      errorMsg = rawMessage.message;
    }

    const err = new Error(errorMsg) as Error & { locationRequired?: boolean };
    if (isLocationReq) {
      err.locationRequired = true;
    }
    throw err;
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

export async function forgotPassword(email: string) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to process request";
    throw new Error(errorMsg);
  }

  return data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to reset password";
    throw new Error(errorMsg);
  }

  return data;
}

export default login;