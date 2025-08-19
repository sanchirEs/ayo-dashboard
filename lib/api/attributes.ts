import getToken from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";

export interface AttributeOption {
  id: number;
  attributeId: number;
  value: string;
}

export interface Attribute {
  id: number;
  name: string;
  type: string; // "select" | "text" or other strings as stored
  options?: AttributeOption[];
}

export async function getAttributes(): Promise<Attribute[]> {
  try {
    // Use server proxy when running in the browser to avoid build-time env inlining
    const isBrowser = typeof window !== 'undefined';
    const url = isBrowser ? `/api/attributes/list` : `${getBackendUrl()}/api/v1/attributes`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching attributes", e);
    return [];
  }
}

export async function getAttribute(id: number): Promise<Attribute | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (e) {
    console.error("Error fetching attribute", e);
    return null;
  }
}

export async function createAttribute(
  payload: { name: string; type: string },
  tokenOverride?: string | null
): Promise<Attribute | null> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return null;
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return json.data as Attribute;
  } catch (e) {
    console.error("Error creating attribute", e);
    return null;
  }
}

export async function updateAttribute(
  id: number,
  payload: Partial<{ name: string; type: string }>,
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error updating attribute", e);
    return false;
  }
}

export async function deleteAttribute(id: number, tokenOverride?: string | null): Promise<{ ok: boolean; message?: string }> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return { ok: false, message: "Not authenticated" };
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: json.message };
  } catch (e) {
    console.error("Error deleting attribute", e);
    return { ok: false, message: "Unexpected error" };
  }
}

export async function getAttributeOptions(attributeId: number): Promise<AttributeOption[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/${attributeId}/options`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching attribute options", e);
    return [];
  }
}

export async function createAttributeOption(
  attributeId: number,
  payload: { value: string },
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/${attributeId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error creating attribute option", e);
    return false;
  }
}

export async function updateAttributeOption(
  optionId: number,
  payload: { value: string },
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/options/${optionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error updating attribute option", e);
    return false;
  }
}

export async function deleteAttributeOption(optionId: number, tokenOverride?: string | null): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/options/${optionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (e) {
    console.error("Error deleting attribute option", e);
    return false;
  }
}

// Optional helper; backend may not implement this route. Return 0 when unavailable.
export async function getAttributeUsage(attributeId: number): Promise<number> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/attributes/usage/${attributeId}`, { cache: "no-store" });
    if (!res.ok) return 0;
    const json = await res.json();
    return Number(json.data?.usage || 0);
  } catch {
    return 0;
  }
}



