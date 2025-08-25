import getToken from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
}

export interface CategoryNode {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  createdAt?: string;
  _count?: { products?: number; children?: number };
  children?: CategoryNode[];
}

export async function getCategories(all: boolean = false): Promise<Category[]> {
  try {
    const token = await getToken();
    const url = new URL(`${getBackendUrl()}/api/v1/categories/`);
    if (all) {
      url.searchParams.set('all', 'true');
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  try {
    const token = await getToken();
    const response = await fetch(
      `${getBackendUrl()}/api/v1/categories/tree/all`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        cache: "no-store",
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch category tree: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching category tree:", error);
    return [];
  }
}

export async function getCategoryTreePublic(): Promise<CategoryNode[]> {
  try {
    const response = await fetch(
      `${getBackendUrl()}/api/v1/categories/tree/all`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch category tree: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching category tree:", error);
    return [];
  }
}

export async function getCategoriesClient(token: string, all: boolean = false): Promise<Category[]> {
  try {
    const url = new URL(`${getBackendUrl()}/api/v1/categories/`);
    if (all) {
      url.searchParams.set('all', 'true');
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}