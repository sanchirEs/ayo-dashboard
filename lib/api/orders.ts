import { getBackendUrl } from './env';
import { tokenService } from './token-service';
import { createSafeApiResponse, handleApiError, logApiError } from './error-handler';
import { coerceOrdersArray } from './orders-shape';
import { fetchWithAuthHandling } from './fetch-with-auth';

export interface OrderItem {
  id: number;
  productId: number;
  variantId?: number;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
    ProductImages?: Array<{
      imageUrl: string;
    }>;
  };
  variant?: {
    id: number;
    sku: string;
    price: string;
  };
}

export interface PaymentDetails {
  id: number;
  status: string;
  amount: string;
  provider: string;
}

export interface ShippingDetails {
  id: number;
  orderId: number;
  shippingMethod: string;
  trackingNumber: string;
  shippingCost: string;
  estimatedDelivery: string;
  createdAt: string;
  modifiedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  total: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  modifiedAt: string;
  couponId?: number;
  orderItems: OrderItem[];
  payment?: PaymentDetails;
  shipping?: ShippingDetails;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    telephone?: string;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  message?: string;
}

export interface OrderDetailsResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface OrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
  paymentProvider?: string;
}

export async function getOrders(params: OrdersParams = {}): Promise<OrdersResponse> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getOrders', apiError, params);
      const page = params.page || 1;
      const limit = params.limit || 20;
      return createSafeApiResponse({
        data: [],
        pagination: { total: 0, totalPages: 0, currentPage: page, limit }
      }, apiError) as any;
    }

    const searchParams = new URLSearchParams();
    
    // Set default page if not provided
    const page = params.page || 1;
    const limit = params.limit || 20;
    
    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());
    
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params.paymentStatus) searchParams.append('paymentStatus', params.paymentStatus);
    if (params.paymentProvider) searchParams.append('paymentProvider', params.paymentProvider);
    // Ensure createdAt sorting is used for recent orders
    searchParams.append('sortField', params.sortField || 'createdAt');
    searchParams.append('sortOrder', params.sortOrder || 'desc');

    // Fetch first page to get pagination info
    const url = `${getBackendUrl()}/api/v1/orders?${searchParams.toString()}`;
    
    console.log('🔍 Frontend: Fetching orders from:', url.replace(/Bearer\s+\w+/, 'Bearer ***'));

    const response = await fetchWithAuthHandling(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data for orders
    }, 'getOrders');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('📥 Frontend: First page response:', {
      success: result.success,
      ordersCount: result.data?.length || 0,
      pagination: result.pagination
    });
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch orders');
    }
    
    const ordersArray = coerceOrdersArray<Order>(result);
    if (!Array.isArray(result?.data) && ordersArray.length === 0) {
      // Don’t crash the UI if backend shape changes in production.
      console.warn('[getOrders] Unexpected response shape for orders; coercing to empty list', {
        hasData: typeof (result as any)?.data !== 'undefined',
        dataType: typeof (result as any)?.data,
      });
    }

    // ✅ Return only the current page data
    return {
      success: true,
      data: ordersArray,
      pagination: result.pagination || {
        total: 0,
        totalPages: 0,
        currentPage: page,
        limit: limit
      }
    };
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('getOrders', apiError, params);
    const page = params.page || 1;
    const limit = params.limit || 20;
    return createSafeApiResponse({
      data: [],
      pagination: { total: 0, totalPages: 0, currentPage: page, limit }
    }, apiError) as any;
  }
}

export async function getOrderDetails(orderId: number): Promise<OrderDetailsResponse> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getOrderDetails', apiError, { orderId });
      return createSafeApiResponse({ data: null as any }, apiError) as any;
    }

    const url = `${getBackendUrl()}/api/v1/orders/getorder/${orderId}`;

    const response = await fetchWithAuthHandling(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }, 'getOrderDetails');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result;
    }
    
    throw new Error(result.message || 'Failed to fetch order details');
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('getOrderDetails', apiError, { orderId });
    return createSafeApiResponse({ data: null as any }, apiError) as any;
  }
}

// Get order details for client components
export async function getOrderDetailsClient(orderId: number, token: string): Promise<OrderDetailsResponse> {
  try {
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getOrderDetailsClient', apiError, { orderId });
      return createSafeApiResponse({ data: null as any }, apiError) as any;
    }

    const url = `${getBackendUrl()}/api/v1/orders/getorder/${orderId}`;

    const response = await fetchWithAuthHandling(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }, 'getOrderDetailsClient');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result;
    }
    
    throw new Error(result.message || 'Failed to fetch order details');
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
}

export async function updateOrderStatus(
  orderId: number, 
  status: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('updateOrderStatus', apiError, { orderId, status });
      return { success: false, message: 'Authentication required' };
    }

    const url = `${getBackendUrl()}/api/v1/orders/updateorder/${orderId}`;

    const response = await fetchWithAuthHandling(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }, 'updateOrderStatus');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message || 'Order status updated successfully'
    };
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('updateOrderStatus', apiError, { orderId, status });
    return {
      success: false,
      message: apiError.message
    };
  }
}

export async function cancelOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('cancelOrder', apiError, { orderId });
      return { success: false, message: 'Authentication required' };
    }

    const url = `${getBackendUrl()}/api/v1/orders/cancelorder/${orderId}`;

    const response = await fetchWithAuthHandling(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }, 'cancelOrder');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message || 'Order cancelled successfully'
    };
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('cancelOrder', apiError, { orderId });
    return {
      success: false,
      message: apiError.message
    };
  }
}

// Helper functions
export function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    'PENDING': 'Хүлээгдэж буй',
    'PROCESSING': 'Баталгаажсан',
    'SHIPPED': 'Илгээсэн',
    'DELIVERED': 'Хүргэгдсэн',
    'CANCELLED': 'Цуцалсан'
  };
  return translations[status] || status;
}

export function getStatusBadgeClass(status: string): string {
  const statusClasses: Record<string, string> = {
    'PENDING': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    'PROCESSING': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    'SHIPPED': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
    'DELIVERED': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
    'CANCELLED': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'
  };
  return statusClasses[status] || statusClasses['PENDING'];
}

export function getStatusBlockClass(status: string): string {
  const statusBlockClasses: Record<string, string> = {
    'PENDING': 'block-pending',
    'PROCESSING': 'block-tracking',
    'SHIPPED': 'block-tracking',
    'DELIVERED': 'block-available',
    'CANCELLED': 'block-not-available'
  };
  return statusBlockClasses[status] || statusBlockClasses['PENDING'];
}

export function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MNT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice).replace('MNT', '₮');
}
