import getToken from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  totalRevenue?: number;
}

export interface BrandsResponse {
  brands: Brand[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getBrands(searchParams: Record<string, string> = {}): Promise<BrandsResponse> {
  try {
    const token = await getToken();
    const params = new URLSearchParams(searchParams);
    
    const response = await fetch(`${getBackendUrl()}/api/v1/brands?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch brands: ${response.status}`);
    }

    const data = await response.json();
    return {
      brands: data.data || [],
      pagination: data.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
    };
  } catch (error) {
    console.error('Error fetching brands:', error);
    return { brands: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  }
}

export async function getAllBrands(): Promise<Brand[]> {
  try {
    const response = await fetch(`${getBackendUrl()}/api/v1/brands/all`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all brands: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching all brands:', error);
    return [];
  }
}

export async function getBrandsClient(token: string): Promise<Brand[]> {
  try {
    const response = await fetch(`${getBackendUrl()}/api/v1/brands/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch brands: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

export async function getBrandById(id: number, tokenOverride?: string | null): Promise<Brand | null> {
  try {
    const token = tokenOverride || await getToken();
    
    const response = await fetch(`${getBackendUrl()}/api/v1/brands/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch brand: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching brand:', error);
    return null;
  }
}

export type CreateBrandPayload = {
  name: string;
  description?: string;
  websiteUrl?: string;
  logo?: File;
};

export async function createBrand(
  payload: CreateBrandPayload,
  tokenOverride?: string | null
): Promise<{ success: boolean; message?: string; data?: Brand }> {
  try {
    const token = tokenOverride || await getToken();
    
    const formData = new FormData();
    formData.append('name', payload.name);
    
    if (payload.description) {
      formData.append('description', payload.description);
    }
    
    if (payload.websiteUrl) {
      formData.append('websiteUrl', payload.websiteUrl);
    }
    
    if (payload.logo) {
      formData.append('logo', payload.logo);
    }

    const response = await fetch(`${getBackendUrl()}/api/v1/brands`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to create brand' };
    }

    return { success: true, data: data.data, message: data.message };
  } catch (error) {
    console.error('Error creating brand:', error);
    return { success: false, message: 'Network error occurred' };
  }
}

export type UpdateBrandPayload = Partial<CreateBrandPayload>;

export async function updateBrand(
  id: number,
  payload: UpdateBrandPayload,
  tokenOverride?: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = tokenOverride || await getToken();
    
    const formData = new FormData();
    
    if (payload.name) {
      formData.append('name', payload.name);
    }
    
    if (payload.description !== undefined) {
      formData.append('description', payload.description);
    }
    
    if (payload.websiteUrl !== undefined) {
      formData.append('websiteUrl', payload.websiteUrl);
    }
    
    if (payload.logo) {
      formData.append('logo', payload.logo);
    }

    const response = await fetch(`${getBackendUrl()}/api/v1/brands/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to update brand' };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error updating brand:', error);
    return { success: false, message: 'Network error occurred' };
  }
}

export async function deleteBrand(
  id: number,
  force: boolean = false,
  tokenOverride?: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = tokenOverride || await getToken();
    
    const url = force 
      ? `${getBackendUrl()}/api/v1/brands/${id}?force=true`
      : `${getBackendUrl()}/api/v1/brands/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to delete brand' };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error deleting brand:', error);
    return { success: false, message: 'Network error occurred' };
  }
}

export async function getBrandsWithStats(tokenOverride?: string | null): Promise<Brand[]> {
  try {
    const token = tokenOverride || await getToken();
    
    const response = await fetch(`${getBackendUrl()}/api/v1/brands/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch brand stats: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching brand stats:', error);
    return [];
  }
}
