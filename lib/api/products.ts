import getToken from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";

export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  categoryId: number;
  vendorId: number;
  stock?: number;
  images?: Array<{
    id: number;
    url: string;
    productId: number;
  }>;
  category?: {
    id: number;
    name: string;
  };
  vendor?: {
    id: number;
    businessName: string;
  };
  tags?: string[];
  createdAt: string;
  modifiedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getProductById(productId: number, tokenOverride?: string | null): Promise<Product | null> {
  try {
    const token = tokenOverride ?? null;
    const response = await fetch(
      `${getBackendUrl()}/api/v1/products/${productId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      }
    );
    if (!response.ok) throw new Error(`Failed to fetch product: ${response.status}`);
    const data = await response.json();
    const p = data.data;
    if (!p) return null;
    // Normalize shape similar to list endpoint
    const images = (p.ProductImages || []).map((img: any) => ({ id: img.id, url: img.imageUrl, productId: p.id }));
    const stock = p.inventory?.quantity ?? 0;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      sku: p.sku,
      price: Number(p.price),
      categoryId: p.categoryId,
      vendorId: p.vendorId,
      stock,
      images,
      createdAt: p.createdAt,
      modifiedAt: p.modifiedAt,
    } as Product;
  } catch (e) {
    console.error('Error fetching product by id', e);
    return null;
  }
}

export type UpdateProductPayload = Omit<Partial<Product>, 'images'> & {
  quantity?: number;
  removeImageIds?: number[];
  tags?: string[];
  images?: (File | Blob)[];
};

export async function updateProduct(
  productId: number,
  payload: UpdateProductPayload,
  tokenOverride?: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) return { success: false, message: 'Not authenticated' };

    const formData = new FormData();
    if (typeof payload.name !== 'undefined') formData.append('name', String(payload.name));
    if (typeof payload.description !== 'undefined') formData.append('description', String(payload.description));
    if (typeof payload.price !== 'undefined') formData.append('price', String(payload.price));
    if (typeof payload.categoryId !== 'undefined') formData.append('categoryId', String(payload.categoryId));
    if (typeof payload.sku !== 'undefined') formData.append('sku', String(payload.sku));
    if (typeof payload.quantity !== 'undefined') formData.append('quantity', String(payload.quantity));
    if (Array.isArray(payload.removeImageIds)) formData.append('removeImageIds', JSON.stringify(payload.removeImageIds));
    if (Array.isArray(payload.images)) {
      payload.images.forEach((file) => {
        // Backend expects field name "images" because we use upload.array('images')
        if (file instanceof Blob) {
          formData.append('images', file);
        }
      });
    }

    const res = await fetch(`${getBackendUrl()}/api/v1/products/${productId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: json.message || `Failed: ${res.status}` };
    return { success: true, message: json.message || 'Updated' };
  } catch (e) {
    console.error('Error updating product', e);
    return { success: false, message: 'Unexpected error' };
  }
}

export async function getProducts(searchParams: Record<string, string> = {}): Promise<ProductsResponse> {
  try {
    const token = await getToken();
    const params = new URLSearchParams(searchParams);
    
    const response = await fetch(
      `${getBackendUrl()}/api/v1/products?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // Always fetch fresh data for admin dashboard
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    // Ensure tags array exists
    const products = (data.data?.products || []).map((p: any) => ({
      ...p,
      tags: Array.isArray(p.tags) ? p.tags : [],
    }));
    return {
      products,
      pagination: data.data?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    };
  }
}

export async function deleteProduct(productId: number): Promise<boolean> {
  try {
    const token = await getToken();
    
    const response = await fetch(
      `${getBackendUrl()}/api/v1/products/${productId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}