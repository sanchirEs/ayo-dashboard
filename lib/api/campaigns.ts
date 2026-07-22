import { getBackendUrl } from "@/lib/api/env";

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  campaignType: 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'GLOBAL';
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'FREE_SHIPPING' | 'BUNDLE';
  discountValue: number;
  priority: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountPercent?: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  modifiedAt: string;
  createdBy: number;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  isFlashSale?: boolean;
  products?: Array<{
    product: {
      id: number;
      name: string;
      sku: string;
      price: number | string;
      ProductImages?: Array<{ imageUrl: string }>;
    };
  }>;
  _count?: {
    products: number;
    categories: number;
    brands: number;
    usageHistory: number;
  };
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  campaignType: string;
  discountType: string;
  discountValue: number;
  priority?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountPercent?: number;
  startDate: string;
  endDate: string;
  productIds?: number[];
  categoryIds?: number[];
  brandIds?: number[];
}

export interface CampaignResponse {
  success: boolean;
  data: Campaign | Campaign[] | { campaigns: Campaign[]; pagination: any };
  message?: string;
}

export async function getCampaigns(token: string, params?: {
  page?: number;
  limit?: number;
  active?: boolean;
  campaignType?: string;
  search?: string;
}): Promise<{ campaigns: Campaign[]; pagination: any }> {
  try {
    const BACKEND_URL = getBackendUrl();
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.campaignType) queryParams.append('campaignType', params.campaignType);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(
      `${BACKEND_URL}/api/v1/admin/campaigns?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: CampaignResponse = await response.json();
    
    if (result.success && result.data && typeof result.data === 'object' && 'campaigns' in result.data) {
      return result.data as { campaigns: Campaign[]; pagination: any };
    }
    
    return { campaigns: [], pagination: {} };
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

export async function createCampaign(data: CreateCampaignData, token: string): Promise<Campaign> {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns`, {
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

    const result: CampaignResponse = await response.json();
    
    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data as Campaign;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

export async function activateCampaign(id: number, token: string): Promise<Campaign> {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns/${id}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: CampaignResponse = await response.json();
    
    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data as Campaign;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error activating campaign:', error);
    throw error;
  }
}

export async function deactivateCampaign(id: number, token: string): Promise<Campaign> {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns/${id}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: CampaignResponse = await response.json();
    
    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data as Campaign;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error deactivating campaign:', error);
    throw error;
  }
}

export async function deleteCampaign(id: number, token: string): Promise<void> {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns/${id}`, {
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
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

export async function getCampaignAnalytics(id: number, token: string, timeframe: string = '7d') {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(
      `${BACKEND_URL}/api/v1/admin/campaigns/${id}/analytics?timeframe=${timeframe}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    throw error;
  }
}


// ==================== ХЯМДРАЛ (per-product sales) ====================
//
// A Хямдрал is a plain Campaign: PRODUCT type, PERCENTAGE discount, exactly
// one product, isFlashSale=false. Nothing bespoke — it reuses the campaign
// engine that already prices the cart at checkout.

/** Campaign.endDate is a required column, so "no end date" is a sentinel. */
export const OPEN_ENDED_END_DATE = '2099-12-31T23:59:59.000Z';

/** Below flash sale's 100, so a flash sale always wins if both are running. */
export const SALE_PRIORITY = 50;

export function isOpenEnded(endDate: string): boolean {
  return new Date(endDate).getFullYear() >= 2099;
}

export type SaleStatus = 'live' | 'scheduled' | 'ended';

export async function getProductSales(
  token: string,
  params?: { status?: SaleStatus; search?: string; limit?: number }
): Promise<Campaign[]> {
  const BACKEND_URL = getBackendUrl();
  const q = new URLSearchParams({
    campaignType: 'PRODUCT',
    isFlashSale: 'false',
    limit: String(params?.limit ?? 100),
  });
  if (params?.status) q.append('status', params.status);
  if (params?.search) q.append('search', params.search);

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns?${q}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result?.data?.campaigns ?? [];
}

export interface CreateProductSaleInput {
  productId: number;
  discountPercent: number;
  name?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * createCampaign always starts inactive, so we activate straight after when
 * the sale should already be running. If that second call fails the cron picks
 * it up within 5 minutes anyway.
 */
export async function createProductSale(
  input: CreateProductSaleInput,
  token: string
): Promise<Campaign> {
  const startDate = input.startDate || new Date().toISOString();
  const endDate = input.endDate || OPEN_ENDED_END_DATE;

  const campaign = await createCampaign(
    {
      name: input.name || 'Хямдрал',
      campaignType: 'PRODUCT',
      discountType: 'PERCENTAGE',
      discountValue: input.discountPercent,
      priority: SALE_PRIORITY,
      startDate,
      endDate,
      productIds: [input.productId],
    },
    token
  );

  if (new Date(startDate) <= new Date()) {
    await activateCampaign(campaign.id, token);
  }

  return campaign;
}

async function updateCampaign(
  id: number,
  data: Record<string, unknown>,
  token: string
): Promise<Campaign> {
  const BACKEND_URL = getBackendUrl();
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result: CampaignResponse = await response.json();
  return result.data as Campaign;
}

/**
 * Ending a sale must move endDate into the past as well as clearing `active`.
 * campaignJobs re-activates any inactive campaign still inside its date window,
 * so `active: false` on its own is silently undone within 5 minutes.
 */
export async function endProductSale(id: number, token: string): Promise<Campaign> {
  return updateCampaign(
    id,
    { active: false, endDate: new Date().toISOString() },
    token
  );
}

export async function updateProductSale(
  id: number,
  data: { discountPercent?: number; name?: string; endDate?: string },
  token: string
): Promise<Campaign> {
  return updateCampaign(
    id,
    {
      ...(data.discountPercent !== undefined && { discountValue: data.discountPercent }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
    },
    token
  );
}
