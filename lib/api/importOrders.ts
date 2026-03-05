/**
 * Import Orders API
 * Manages the lifecycle of cargo/import products (sourced from China/Korea).
 *
 * Works both server-side (no token arg → uses tokenService) and
 * client-side (pass token from useSession()).
 */

import { getBackendUrl } from './env';
import { tokenService } from './token-service';
import { handleApiError, logApiError } from './error-handler';
import { fetchWithAuthHandling } from './fetch-with-auth';

// ==================== TYPES ====================

export interface ImportProduct {
  id: number;
  name: string;
  sku: string;
  price: string;
  estimatedDeliveryDays: number;
  deliveryNote: string | null;
  imageUrl: string | null;
  counts: {
    waiting: number;
    arrived: number;
    dispatched: number;
    total: number;
  };
}

export interface ImportOrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  importStatus: 'WAITING' | 'ARRIVED' | 'DISPATCHED';
  importArrivedAt: string | null;
  importNote: string | null;
  product: {
    id: number;
    name: string;
    sku: string;
    isImportedProduct: boolean;
    estimatedDeliveryDays: number;
    ProductImages?: Array<{ imageUrl: string }>;
  };
}

export interface ImportOrder {
  id: number;
  userId: number;
  total: string;
  status: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    telephone: string | null;
    email: string;
  };
  orderItems: ImportOrderItem[];
  payment: { id: number; status: string; provider: string; amount: string } | null;
  papaShipments: Array<{
    id: number;
    papaCode: string | null;
    papaStatus: string;
    isCargoShipment: boolean;
    shipmentNote: string | null;
    createdAt: string;
  }>;
  importSummary: {
    totalImportItems: number;
    localItems: number;
    waiting: number;
    arrived: number;
    dispatched: number;
    allArrived: boolean;
    allDispatched: boolean;
  };
}

export interface ImportStats {
  waiting: number;
  arrived: number;
  dispatched: number;
  total: number;
}

// ==================== HELPERS ====================

/**
 * Build auth headers.
 * - Server-side (page.js): call with no args → tokenService reads NextAuth session via headers()
 * - Client-side (useClient component): pass accessToken from useSession()
 */
async function authHeaders(token?: string | null): Promise<Record<string, string>> {
  const t = token ?? (await tokenService.getTokenWithRetry());
  return {
    Authorization: `Bearer ${t}`,
    'Content-Type': 'application/json',
  };
}

function base() {
  return `${getBackendUrl()}/api/v1/import-orders`;
}

// ==================== API FUNCTIONS ====================

export async function getImportStats(
  token?: string | null
): Promise<{ success: boolean; data: ImportStats; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(`${base()}/stats`, { method: 'GET', headers, cache: 'no-store' }, 'getImportStats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('getImportStats', e, {});
    return { success: false, data: { waiting: 0, arrived: 0, dispatched: 0, total: 0 }, error: e.message };
  }
}

export async function getImportProducts(
  token?: string | null
): Promise<{ success: boolean; data: ImportProduct[]; meta?: any; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(`${base()}/products`, { method: 'GET', headers, cache: 'no-store' }, 'getImportProducts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('getImportProducts', e, {});
    return { success: false, data: [], error: e.message };
  }
}

export async function markProductArrived(
  productId: number,
  note?: string,
  token?: string | null
): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(
      `${base()}/products/${productId}/mark-arrived`,
      { method: 'POST', headers, body: JSON.stringify({ note: note || '' }) },
      'markProductArrived'
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('markProductArrived', e, { productId });
    return { success: false, error: e.message };
  }
}

export async function getImportOrders(
  params: {
    page?: number;
    limit?: number;
    importStatus?: 'waiting' | 'arrived' | 'dispatched' | 'mixed' | '';
    search?: string;
  } = {},
  token?: string | null
): Promise<{ success: boolean; data: ImportOrder[]; pagination?: any; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.importStatus) qs.set('importStatus', params.importStatus);
    if (params.search) qs.set('search', params.search);

    const res = await fetchWithAuthHandling(
      `${base()}/orders?${qs}`,
      { method: 'GET', headers, cache: 'no-store' },
      'getImportOrders'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('getImportOrders', e, params);
    return { success: false, data: [], error: e.message };
  }
}

export async function dispatchArrivedItems(
  orderId: number,
  note?: string,
  token?: string | null
): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(
      `${base()}/orders/${orderId}/dispatch`,
      { method: 'POST', headers, body: JSON.stringify({ note: note || '' }) },
      'dispatchArrivedItems'
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('dispatchArrivedItems', e, { orderId });
    return { success: false, error: e.message };
  }
}
