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

