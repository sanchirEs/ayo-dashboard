import { getBackendUrl } from "./env";
import getToken from "@/lib/GetTokenServer";

export interface TagGroup {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  modifiedAt: string;
  options?: TagOption[];
  _count?: {
    options: number;
  };
  totalProducts?: number;
}

export interface TagOption {
  id: number;
  groupId: number;
  name: string;
  value: string;
  createdAt: string;
  modifiedAt: string;
  group?: {
    id: number;
    name: string;
  };
  _count?: {
    productTags: number;
  };
}

export interface ProductTagsResponse {
  productId: number;
  tagGroups: {
    groupId: number;
    groupName: string;
    options: {
      id: number;
      name: string;
      value: string;
    }[];
  }[];
  totalTags: number;
}

// ==================== TAG GROUPS ====================

export async function getTagGroups(): Promise<TagGroup[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching tag groups", e);
    return [];
  }
}

export async function getTagGroupsWithStats(tokenOverride?: string | null): Promise<TagGroup[]> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return [];
    
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching tag groups with stats", e);
    return [];
  }
}

export async function getTagGroup(id: number): Promise<TagGroup | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (e) {
    console.error("Error fetching tag group", e);
    return null;
  }
}

export async function createTagGroup(
  payload: { name: string; description?: string },
  tokenOverride?: string | null
): Promise<TagGroup | null> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return null;
    
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return json.data as TagGroup;
  } catch (e) {
    console.error("Error creating tag group", e);
    return null;
  }
}

export async function updateTagGroup(
  id: number,
  payload: Partial<{ name: string; description: string }>,
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error updating tag group", e);
    return false;
  }
}

export async function deleteTagGroup(id: number, tokenOverride?: string | null): Promise<{ ok: boolean; message?: string }> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return { ok: false, message: "Not authenticated" };
    
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: json.message };
  } catch (e) {
    console.error("Error deleting tag group", e);
    return { ok: false, message: "Network error" };
  }
}

// ==================== TAG OPTIONS ====================

export async function getTagOptions(groupId: number): Promise<TagOption[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups/${groupId}/options`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching tag options", e);
    return [];
  }
}

export async function getTagOption(id: number): Promise<TagOption | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-options/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (e) {
    console.error("Error fetching tag option", e);
    return null;
  }
}

export async function createTagOption(
  groupId: number,
  payload: { name: string; value?: string },
  tokenOverride?: string | null
): Promise<TagOption | null> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return null;
    
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups/${groupId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return json.data as TagOption;
  } catch (e) {
    console.error("Error creating tag option", e);
    return null;
  }
}

export async function updateTagOption(
  id: number,
  payload: Partial<{ name: string; value: string }>,
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-options/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error updating tag option", e);
    return false;
  }
}

export async function deleteTagOption(id: number, tokenOverride?: string | null): Promise<{ ok: boolean; message?: string }> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return { ok: false, message: "Not authenticated" };
    
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-options/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: json.message };
  } catch (e) {
    console.error("Error deleting tag option", e);
    return { ok: false, message: "Network error" };
  }
}

export async function searchTagOptions(query: string): Promise<TagOption[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-options/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Error searching tag options", e);
    return [];
  }
}

// ==================== PRODUCT TAG MANAGEMENT ====================

export async function getProductHierarchicalTags(productId: number): Promise<ProductTagsResponse | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/products/${productId}/hierarchical-tags`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (e) {
    console.error("Error fetching product hierarchical tags", e);
    return null;
  }
}

export async function addProductHierarchicalTags(
  productId: number,
  payload: { tagOptionIds: number[] },
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    
    const res = await fetch(`${getBackendUrl()}/api/v1/products/${productId}/hierarchical-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error adding product hierarchical tags", e);
    return false;
  }
}

export async function replaceProductHierarchicalTags(
  productId: number,
  payload: { tagOptionIds: number[] },
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    
    const res = await fetch(`${getBackendUrl()}/api/v1/products/${productId}/hierarchical-tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error replacing product hierarchical tags", e);
    return false;
  }
}

export async function removeProductHierarchicalTag(
  productId: number,
  tagOptionId: number,
  tokenOverride?: string | null
): Promise<boolean> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return false;
    
    const res = await fetch(`${getBackendUrl()}/api/v1/products/${productId}/hierarchical-tags/${tagOptionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (e) {
    console.error("Error removing product hierarchical tag", e);
    return false;
  }
}
