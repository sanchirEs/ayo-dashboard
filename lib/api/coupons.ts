const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  minPurchase?: number;
  maxDiscount?: number;
  isActive?: boolean;
  usageCount?: number;
  maxUsage?: number;
  createdAt?: string;
  modifiedAt?: string;
}

export interface CreateCouponData {
  code: string;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  minPurchase?: number;
  maxDiscount?: number;
  maxUsage?: number;
}

export interface CouponResponse {
  success: boolean;
  data: Coupon | Coupon[];
  message?: string;
}

export async function getCoupons(token: string): Promise<Coupon[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/coupons/`, {
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

    const result: CouponResponse = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else if (result.success && result.data) {
      return [result.data] as Coupon[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
}

export async function createCoupon(data: CreateCouponData, token: string): Promise<Coupon> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/coupons/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: CouponResponse = await response.json();
    
    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

export async function updateCoupon(id: number, data: Partial<CreateCouponData>, token: string): Promise<Coupon> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/coupons/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: CouponResponse = await response.json();
    
    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
}

export async function deleteCoupon(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/coupons/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
}
