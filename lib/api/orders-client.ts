"use client";

import { getBackendUrl } from './env';
import { handleApiError, logApiError } from './error-handler';

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

export interface Order {
  id: number;
  userId: number;
  total: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  modifiedAt: string;
  orderItems: OrderItem[];
  payment?: PaymentDetails;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export async function updateOrderStatusClient(
  orderId: number, 
  status: string,
  token: string
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('updateOrderStatusClient', apiError, { orderId, status });
      return { success: false, message: 'Authentication required' };
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
    const apiError = handleApiError(error);
    logApiError('updateOrderStatusClient', apiError, { orderId, status });
    return {
      success: false,
      message: apiError.message
    };
  }
}

export async function cancelOrderClient(
  orderId: number,
  token: string
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('cancelOrderClient', apiError, { orderId });
      return { success: false, message: 'Authentication required' };
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
    const apiError = handleApiError(error);
    logApiError('cancelOrderClient', apiError, { orderId });
    return {
      success: false,
      message: apiError.message
    };
  }
}

export async function bulkUpdateOrderStatusClient(
  orderIds: number[],
  status: string,
  token: string
): Promise<{ success: boolean; message?: string; updatedCount?: number }> {
  try {
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('bulkUpdateOrderStatusClient', apiError, { orderCount: orderIds.length, status });
      return { success: false, message: 'Authentication required' };
    }

    const url = `${getBackendUrl()}/api/v1/orders/bulk-status`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds, status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message || 'Orders updated successfully',
      updatedCount: result.data?.updatedCount || orderIds.length
    };
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('bulkUpdateOrderStatusClient', apiError, { orderCount: orderIds.length, status });
    return {
      success: false,
      message: apiError.message
    };
  }
}