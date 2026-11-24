export interface CategoryNode {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  createdAt?: string;
  /** false = archived: hidden from the storefront, kept so products keep their links. */
  isActive?: boolean;
  /** Set when the storefront redirects /shop/<id> elsewhere (an archived brand category). */
  redirectPath?: string | null;
  _count?: { products?: number; children?: number };
  children?: CategoryNode[];
}

export async function getCategoryTreePublic(): Promise<CategoryNode[]> {
  try {
    const response = await fetch(
      `${require("@/lib/api/env").getBackendUrl()}/api/v1/categories/tree/all`,
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


