"use client";

import { getBackendUrl } from './env';

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

export async function cancelOrderClient(
  orderId: number,
  token: string
): Promise<{ success: boolean; message?: string }> {
  try {
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

export async function bulkUpdateOrderStatusClient(
  orderIds: number[],
  status: string,
  token: string
): Promise<{ success: boolean; message?: string; updatedCount?: number }> {
  try {
    if (!token) {
      throw new Error('No authentication token available');
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
    console.error('Error updating orders:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update orders'
    };
  }
}