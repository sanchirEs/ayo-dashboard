import { apiFetch } from "@/lib/api-fetch";

export interface ProductTag {
  id: number;
  tag: string;
  productId: number;
  createdAt?: string;
}

export interface GetTagsResponse {
  productId: number;
  tags: ProductTag[];
}

export interface TagPreset {
  id: number;
  name: string;
  type: string;
}

export async function getTags(productId: number): Promise<GetTagsResponse | null> {
  try {
    const response = await apiFetch(`/api/v1/tags/${productId}`, { 
      cache: "no-store" 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.status}`);
    }

    const data = await response.json();
    const payload = data.data as { productId: number; tags: ProductTag[] };
    return { productId: payload.productId, tags: payload.tags || [] };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return null;
  }
}

export async function createTags(
  productId: number,
  tags: string[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiFetch(`/api/v1/tags/${productId}`, {
      method: "POST",
      body: JSON.stringify({ tags }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, message: json.message || `Failed: ${response.status}` };
    }
    return { success: true, message: json.message };
  } catch (error) {
    console.error("Error creating tags:", error);
    return { success: false, message: "Unexpected error" };
  }
}

export async function getTagPresets(): Promise<TagPreset[]> {
  try {
    const res = await apiFetch(`/api/v1/tags/presets`, { 
      cache: "no-store" 
    });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching tag presets", e);
    return [];
  }
}

export async function createTagPreset(
  payload: { name: string; type: string }
): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/v1/tags/presets`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error creating tag preset", e);
    return false;
  }
}

export async function updateTagPreset(
  id: number,
  payload: Partial<{ name: string; type: string }>
): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/v1/tags/presets/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Error updating tag preset", e);
    return false;
  }
}

export async function deleteTagPreset(id: number): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/v1/tags/presets/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (e) {
    console.error("Error deleting tag preset", e);
    return false;
  }
}


