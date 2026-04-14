import { getBackendUrl } from './env';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyPoint {
  date: string;  // "YYYY-MM-DD"
  value: number;
}

export interface OverviewData {
  revenue: {
    total: number;
    thisWeek: number;
    today: number;
    weekTrend: number;       // % change vs prev week (positive = up)
    totalTransactions: number;
    sparkline: DailyPoint[]; // 7 days
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    weekTrend: number;
    pending: number;
    byStatus: {
      PENDING: number;
      PROCESSING: number;
      SHIPPED: number;
      DELIVERED: number;
      CANCELLED: number;
    };
    sparkline: DailyPoint[]; // 7 days
  };
  customers: {
    total: number;
    newToday: number;
  };
  products: {
    total: number;
    active: number;
  };
  generatedAt: string;
}

export interface RevenueSeriesData {
  period: number;
  series: DailyPoint[];
  transactionsSeries: DailyPoint[];
  totalRevenue: number;
  totalTransactions: number;
  generatedAt: string;
}

export interface TopProduct {
  rank: number;
  id: number;
  name: string;
  sku: string;
  imageUrl: string | null;
  revenue: number;
  quantity: number;
  orders: number;
  revenuePercent: number;
}

export interface TopProductsData {
  products: TopProduct[];
  generatedAt: string;
}

export interface RecentOrder {
  id: number;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  deliveryType: 'DELIVERY' | 'PICKUP';
  createdAt: string;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  paymentStatus: string | null;
  paymentProvider: string | null;
}

export interface RecentOrdersData {
  orders: RecentOrder[];
  generatedAt: string;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchAnalytics<T>(path: string, token: string): Promise<T | null> {
  try {
    const url = `${getBackendUrl()}/api/v1/analytics/${path}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Next.js caches this at the network layer too; backend Redis handles
      // the heavy lifting — we just want Next.js not to double-cache stale data.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as T) : null;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getOverview(token: string): Promise<OverviewData | null> {
  return fetchAnalytics<OverviewData>('overview', token);
}

export async function getRevenueSeries(
  period: 7 | 30 | 90,
  token: string,
): Promise<RevenueSeriesData | null> {
  return fetchAnalytics<RevenueSeriesData>(`revenue?period=${period}`, token);
}

export async function getTopProducts(token: string, limit = 5): Promise<TopProductsData | null> {
  return fetchAnalytics<TopProductsData>(`top-products?limit=${limit}`, token);
}

export async function getRecentOrders(token: string, limit = 8): Promise<RecentOrdersData | null> {
  return fetchAnalytics<RecentOrdersData>(`recent-orders?limit=${limit}`, token);
}

// ─── Formatting helpers (shared between server + client components) ───────────

export function formatMNT(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₮—';
  const n = Math.round(Number(amount));
  if (n >= 1_000_000) return `₮${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000)   return `₮${(n / 1_000).toFixed(0)}K`;
  return `₮${n.toLocaleString('en-US')}`;
}

export function formatMNTFull(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₮—';
  return '₮' + Math.round(Number(amount)).toLocaleString('en-US');
}
