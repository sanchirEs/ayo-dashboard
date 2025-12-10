// Papa Logistics Shipping API for Admin Dashboard
import { getBackendUrl } from './env';
import { tokenService } from './token-service';
import { createSafeApiResponse, handleApiError, logApiError } from './error-handler';

// ==================== TYPES ====================

export interface PapaShipment {
  id: number;
  orderId: number;
  papaCode: string | null;
  papaPincode: string | null;
  papaStatus: string;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  createdAt: string;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
}

export interface DeliverableOrder {
  id: number;
  userId: number;
  total: string;
  status: string;
  createdAt: string;
  readyToShip: boolean;
  packedAt: string | null;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    telephone: string | null;
  };
  orderItems: Array<{
    id: number;
    quantity: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
  payment: {
    status: string;
    modifiedAt: string;
  };
  shipping: {
    addressLine1: string;
    city: string;
    mobile: string;
  } | null;
  papaShipment: PapaShipment | null;
}

export interface DeliverResult {
  orderId: number;
  shipmentId: number;
  papaCode: string;
  status: string;
  message: string;
}

export interface BulkDeliverResponse {
  success: boolean;
  message: string;
  data: {
    success: DeliverResult[];
    failed: Array<{ orderId: number; error: string }>;
  };
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

export interface ShipmentStats {
  period: string;
  startDate: string;
  totalShipments: number;
  statusBreakdown: Array<{
    papaStatus: string;
    _count: number;
  }>;
  queues: {
    awaitingPacking: number;
    readyToShip: number;
    unconfirmed: number;
  };
  failures: number;
}

// ==================== API FUNCTIONS ====================

/**
 * Get all deliverable orders (PROCESSING with payment completed)
 * This is for the main order list page
 */
export async function getDeliverableOrders(
  page: number = 1,
  limit: number = 50
): Promise<{ success: boolean; data: DeliverableOrder[]; pagination: any; error?: any }> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getDeliverableOrders', apiError, { page, limit });
      return createSafeApiResponse({ data: [], pagination: { total: 0, totalPages: 0, currentPage: page, limit } }, apiError) as any;
    }

    const url = `${getBackendUrl()}/api/v1/admin/shipping/orders/deliverable?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('getDeliverableOrders', apiError, { page, limit });
    return createSafeApiResponse({ data: [], pagination: { total: 0, totalPages: 0, currentPage: page, limit } }, apiError) as any;
  }
}

/**
 * Bulk deliver orders - One-click create and confirm shipments
 * This is the main "Deliver" button action
 */
export async function bulkDeliverOrders(orderIds: number[]): Promise<BulkDeliverResponse> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('bulkDeliverOrders', apiError, { orderCount: orderIds.length });
      return {
        success: false,
        message: 'Authentication required',
        data: { success: [], failed: orderIds.map(id => ({ orderId: id, error: 'Authentication failed' })) },
        summary: { total: orderIds.length, succeeded: 0, failed: orderIds.length }
      };
    }

    const url = `${getBackendUrl()}/api/v1/admin/shipping/orders/bulk-deliver`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('bulkDeliverOrders', apiError, { orderCount: orderIds.length });
    return {
      success: false,
      message: apiError.message,
      data: { success: [], failed: orderIds.map(id => ({ orderId: id, error: apiError.message })) },
      summary: { total: orderIds.length, succeeded: 0, failed: orderIds.length }
    };
  }
}

/**
 * Get shipment statistics
 */
export async function getShipmentStats(
  period: 'today' | 'week' | 'month' = 'today'
): Promise<{ success: boolean; data: ShipmentStats; error?: any }> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getShipmentStats', apiError, { period });
      return createSafeApiResponse({ 
        data: {
          period,
          startDate: new Date().toISOString(),
          totalShipments: 0,
          statusBreakdown: [],
          queues: { awaitingPacking: 0, readyToShip: 0, unconfirmed: 0 },
          failures: 0
        }
      }, apiError) as any;
    }

    const url = `${getBackendUrl()}/api/v1/admin/shipping/stats?period=${period}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('getShipmentStats', apiError, { period });
    return createSafeApiResponse({ 
      data: {
        period,
        startDate: new Date().toISOString(),
        totalShipments: 0,
        statusBreakdown: [],
        queues: { awaitingPacking: 0, readyToShip: 0, unconfirmed: 0 },
        failures: 0
      }
    }, apiError) as any;
  }
}

/**
 * Get failed shipments
 */
export async function getFailedShipments(
  page: number = 1,
  limit: number = 50
): Promise<{ success: boolean; data: any[]; pagination: any; error?: any }> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getFailedShipments', apiError, { page, limit });
      return createSafeApiResponse({ data: [], pagination: { total: 0, totalPages: 0, currentPage: page, limit } }, apiError) as any;
    }

    const url = `${getBackendUrl()}/api/v1/admin/shipping/failures?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('getFailedShipments', apiError, { page, limit });
    return createSafeApiResponse({ data: [], pagination: { total: 0, totalPages: 0, currentPage: page, limit } }, apiError) as any;
  }
}

/**
 * Retry failed shipments
 */
export async function retryFailedShipments(
  failureIds: number[]
): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('retryFailedShipments', apiError, { failureCount: failureIds.length });
      return {
        success: false,
        message: 'Authentication required',
        data: null
      };
    }

    const url = `${getBackendUrl()}/api/v1/admin/shipping/failures/retry`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ failureIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('retryFailedShipments', apiError, { failureCount: failureIds.length });
    return {
      success: false,
      message: apiError.message,
      data: null
    };
  }
}

// ==================== CLIENT-SIDE FUNCTIONS ====================

/**
 * Bulk deliver orders (client-side version)
 */
export async function bulkDeliverOrdersClient(
  orderIds: number[],
  token: string
): Promise<BulkDeliverResponse> {
  try {
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('bulkDeliverOrdersClient', apiError, { orderCount: orderIds.length });
      return {
        success: false,
        message: 'Authentication required',
        data: { success: [], failed: orderIds.map(id => ({ orderId: id, error: 'Authentication failed' })) },
        summary: { total: orderIds.length, succeeded: 0, failed: orderIds.length }
      };
    }

    const url = `${getBackendUrl()}/api/v1/admin/shipping/orders/bulk-deliver`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('bulkDeliverOrdersClient', apiError, { orderCount: orderIds.length });
    return {
      success: false,
      message: apiError.message,
      data: { success: [], failed: orderIds.map(id => ({ orderId: id, error: apiError.message })) },
      summary: { total: orderIds.length, succeeded: 0, failed: orderIds.length }
    };
  }
}
