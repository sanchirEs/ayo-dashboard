import { getBackendUrl } from "@/lib/api/env";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";
import { type UserRole } from "@/types/next-auth";

export type CreateUserPayload = {
  username: string;
  telephone: string;
  password: string;
  role: UserRole;
};

// Support unlock: sets a password on a customer who can't use the storefront's
// self-service claim flow (they have order history) while SMS-based password
// reset is unavailable.
export async function setUserPassword(
  userId: number,
  password: string,
  token: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/auth/users/${userId}/password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      },
      "setUserPassword"
    );
    const data = await response.json();
    if (!response.ok)
      return { success: false, message: data.message || "Failed to set password" };
    return { success: true, message: data.message };
  } catch {
    return { success: false, message: "Network error" };
  }
}

export async function createUserByAdmin(
  payload: CreateUserPayload,
  token: string | null
): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/auth/admin/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      "createUserByAdmin"
    );
    const data = await response.json();
    if (!response.ok)
      return { success: false, message: data.message || "Failed to create user" };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { success: false, message: "Network error" };
  }
}
