import getToken from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";

export interface ProductSpec {
  id?: number;
  type: string;
  value: string;
  productId?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  howToUse?: string;
  ingredients?: string;
  specs?: ProductSpec[];
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
  
  // Delivery fields
  isImportedProduct?: boolean;
  estimatedDeliveryDays?: number;
  deliveryNote?: string;
  delivery?: {
    isImported: boolean;
    estimatedDays: number;
    note?: string;
  };
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

export async function getProductById(productId: number, tokenOverride?: string | null): Promise<any> {
  try {
    const token = tokenOverride ?? null;
    // Include all necessary relations for editing
    const params = new URLSearchParams();
    params.set('include', 'categories,brand,variants,inventory,tags,specs');
    params.set('fields', 'detailed');
    
    const response = await fetch(
      `${getBackendUrl()}/api/v1/products/${productId}?${params.toString()}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      }
    );
    if (!response.ok) throw new Error(`Failed to fetch product: ${response.status}`);
    const data = await response.json();
    const p = data.data;
    if (!p) return null;
    
    // Return the full product data without normalization to preserve all fields
    return p;
  } catch (e) {
    console.error('Error fetching product by id', e);
    return null;
  }
}

export type UpdateProductPayload = Omit<Partial<Product>, 'images'> & {
  quantity?: number;
  removeImageIds?: number[];
  specs?: ProductSpec[];
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
    if (typeof payload.howToUse !== 'undefined') formData.append('howToUse', String(payload.howToUse));
    if (typeof payload.ingredients !== 'undefined') formData.append('ingredients', String(payload.ingredients));
    if (Array.isArray(payload.specs)) formData.append('specs', JSON.stringify(payload.specs));
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
    
    // Always include categories, brands, variants, and hierarchical tags for dashboard display
    params.set('include', 'categories,brand,variants,inventory');
    params.set('fields', 'detailed'); // Need detailed to get hierarchical tags
    
    // Set limit to maximum (100) if not already set, so we fetch all available products
    // Dashboard needs to show all products, not just the default 20
    if (!params.has('limit')) {
      params.set('limit', '100'); // Backend max is 100
    }
    
    // Fetch first page to get pagination info
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
    let allProducts = (data.data?.products || []).map((p: any) => ({
      ...p,
      tags: Array.isArray(p.tags) ? p.tags : [],
    }));
    
    const pagination = data.data?.pagination || {
      page: 1,
      limit: 100,
      total: 0,
      pages: 1
    };
    
    // If there are more pages, fetch them all
    const totalPages = pagination.pages || 1;
    
    if (totalPages > 1) {
      // Fetch remaining pages in parallel
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const pageParams = new URLSearchParams(params);
        pageParams.set('page', page.toString());
        
        pagePromises.push(
          fetch(
            `${getBackendUrl()}/api/v1/products?${pageParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }
          ).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch page ${page}: ${res.status}`);
            return res.json();
          }).then(data => 
            (data.data?.products || []).map((p: any) => ({
              ...p,
              tags: Array.isArray(p.tags) ? p.tags : [],
            }))
          )
        );
      }
      
      // Wait for all pages to be fetched
      const remainingProducts = await Promise.all(pagePromises);
      allProducts = allProducts.concat(...remainingProducts);
    }
    
    return {
      products: allProducts,
      pagination: {
        ...pagination,
        page: 1, // Reset to page 1 since we fetched all products
        limit: allProducts.length, // Update limit to total fetched products
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