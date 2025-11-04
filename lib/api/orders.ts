import { getBackendUrl } from './env';
import getToken from '../GetTokenServer';

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
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
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

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data for orders
    });

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
    
    // ✅ Return only the current page data
    return {
      success: true,
      data: result.data || [],
      pagination: result.pagination || {
        total: 0,
        totalPages: 0,
        currentPage: page,
        limit: limit
      }
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function getOrderDetails(orderId: number): Promise<OrderDetailsResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${getBackendUrl()}/api/v1/orders/getorder/${orderId}`;

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

// Get order details for client components
export async function getOrderDetailsClient(orderId: number, token: string): Promise<OrderDetailsResponse> {
  try {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${getBackendUrl()}/api/v1/orders/getorder/${orderId}`;

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
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${getBackendUrl()}/api/v1/orders/updateorder/${orderId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

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
    console.error('Error updating order status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update order status'
    };
  }
}

export async function cancelOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${getBackendUrl()}/api/v1/orders/cancelorder/${orderId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

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
    console.error('Error cancelling order:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel order'
    };
  }
}

// Helper functions
export function getStatusBadgeClass(status: string): string {
  const statusClasses: Record<string, string> = {
    'PENDING': 'block-pending',
    'PROCESSING': 'block-processing',
    'SHIPPED': 'block-shipped',
    'DELIVERED': 'block-available',
    'CANCELLED': 'block-not-available'
  };
  return statusClasses[status] || 'block-pending';
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
