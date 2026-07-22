import getToken from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";

export interface StoreLocation {
  id: number;
  name: string;
  district: string;
  address: string;
  hours: string;
  lunchBreak?: string | null;
  phone: string;
  closedDay?: string | null;
  image?: string | null;
  googleMapLink?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export async function getStoreLocations(): Promise<StoreLocation[]> {
  try {
    const token = await getToken();
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/store-locations`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      "getStoreLocations"
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getStoreLocationById(id: number): Promise<StoreLocation | null> {
  try {
    const token = await getToken();
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/store-locations/${id}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      "getStoreLocationById"
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}

export type StoreLocationPayload = {
  name: string;
  district: string;
  address: string;
  hours: string;
  lunchBreak?: string;
  phone: string;
  closedDay?: string;
  googleMapLink?: string;
  sortOrder?: number;
  image?: File;
};

function buildFormData(payload: StoreLocationPayload): FormData {
  const fd = new FormData();
  fd.append("name", payload.name);
  fd.append("district", payload.district);
  fd.append("address", payload.address);
  fd.append("hours", payload.hours);
  fd.append("phone", payload.phone);
  if (payload.lunchBreak !== undefined) fd.append("lunchBreak", payload.lunchBreak);
  if (payload.closedDay !== undefined) fd.append("closedDay", payload.closedDay);
  if (payload.googleMapLink !== undefined) fd.append("googleMapLink", payload.googleMapLink);
  if (payload.sortOrder !== undefined) fd.append("sortOrder", String(payload.sortOrder));
  if (payload.image) fd.append("image", payload.image);
  return fd;
}

export async function createStoreLocation(
  payload: StoreLocationPayload,
  token: string | null
): Promise<{ success: boolean; message?: string; data?: StoreLocation }> {
  try {
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/store-locations`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData(payload),
      },
      "createStoreLocation"
    );
    const data = await response.json();
    if (!response.ok) return { success: false, message: data.message || "Failed to create" };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { success: false, message: "Network error" };
  }
}

export async function updateStoreLocation(
  id: number,
  payload: StoreLocationPayload,
  token: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/store-locations/${id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData(payload),
      },
      "updateStoreLocation"
    );
    const data = await response.json();
    if (!response.ok) return { success: false, message: data.message || "Failed to update" };
    return { success: true, message: data.message };
  } catch {
    return { success: false, message: "Network error" };
  }
}

export async function deleteStoreLocation(
  id: number,
  token: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/store-locations/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      "deleteStoreLocation"
    );
    const data = await response.json();
    if (!response.ok) return { success: false, message: data.message || "Failed to delete" };
    return { success: true, message: data.message };
  } catch {
    return { success: false, message: "Network error" };
  }
}
