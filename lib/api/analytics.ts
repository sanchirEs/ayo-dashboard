import { getBackendUrl } from "@/lib/api/env";
const BACKEND_URL = getBackendUrl();

// Analytics interfaces based on backend API
export interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }>;
  salesByDate: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  message?: string;
}

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  type?: 'sales' | 'orders' | 'products' | 'users';
}

export async function getAnalytics(
  params: AnalyticsParams = {},
  token: string
): Promise<AnalyticsData> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.type) searchParams.append('type', params.type);

    const url = `${BACKEND_URL}/api/v1/analytics/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data for analytics
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: AnalyticsResponse = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// Helper functions for date formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

