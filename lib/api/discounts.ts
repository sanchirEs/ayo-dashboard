import { getBackendUrl } from "@/lib/api/env";

// Discount interfaces (extending existing product model)
export interface ProductDiscount {
  id: number;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  flashSale: boolean;
  flashSaleEndDate?: string;
  categoryId: number;
  category?: {
    name: string;
  };
  images?: Array<{
    url: string;
  }>;
}

export interface FlashSaleUpdate {
  flashSale: boolean;
  flashSaleEndDate?: string;
  price?: number; // New discounted price
}

export interface DiscountResponse {
  success: boolean;
  data: ProductDiscount | ProductDiscount[];
  message?: string;
}

// Get products that are currently on sale or can be put on sale
export async function getDiscountableProducts(token: string): Promise<ProductDiscount[]> {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/v1/products/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && Array.isArray(result.data.products)) {
      return result.data.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        flashSale: product.flashSale || false,
        flashSaleEndDate: product.flashSaleEndDate,
        categoryId: product.categoryId,
        category: product.category,
        images: product.images,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching products for discounts:', error);
    throw error;
  }
}

// Get products currently on flash sale
export async function getFlashSaleProducts(token: string): Promise<ProductDiscount[]> {
  try {
    const products = await getDiscountableProducts(token);
    return products.filter(product => product.flashSale);
  } catch (error) {
    console.error('Error fetching flash sale products:', error);
    throw error;
  }
}

// Update product flash sale status
export async function updateProductFlashSale(
  productId: number, 
  flashSaleData: FlashSaleUpdate, 
  token: string
): Promise<ProductDiscount> {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/v1/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flashSaleData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle permission-specific errors with more helpful messages
      if (response.status === 403 || errorData.message?.includes('permission has been denied')) {
        throw new Error('PERMISSION_DENIED: Only VENDOR and SUPERADMIN users can update product flash sales. Please contact a SUPERADMIN to modify flash sale settings, or ensure you have VENDOR/SUPERADMIN role.');
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: DiscountResponse = await response.json();
    
    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error updating flash sale:', error);
    throw error;
  }
}

// Bulk update flash sale for multiple products
export async function bulkUpdateFlashSale(
  productIds: number[], 
  flashSaleData: FlashSaleUpdate, 
  token: string
): Promise<void> {
  try {
    const promises = productIds.map(id => 
      updateProductFlashSale(id, flashSaleData, token)
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error bulk updating flash sale:', error);
    throw error;
  }
}

// Helper functions
export function calculateDiscountPercent(originalPrice: number, discountedPrice: number): number {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function isFlashSaleActive(flashSaleEndDate?: string): boolean {
  if (!flashSaleEndDate) return false;
  return new Date() < new Date(flashSaleEndDate);
}
