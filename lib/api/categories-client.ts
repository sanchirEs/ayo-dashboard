export interface CategoryNode {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  createdAt?: string;
  _count?: { products?: number; children?: number };
  children?: CategoryNode[];
}

export async function getCategoryTreePublic(): Promise<CategoryNode[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/tree/all`,
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


