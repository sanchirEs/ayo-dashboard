"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusClient, cancelOrderClient } from "@/lib/api/orders-client";
import GetTokenClient from "@/lib/GetTokenClient";

export default function OrderStatusActions({ order }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const token = GetTokenClient();

  const handleStatusUpdate = async (newStatus) => {
    if (isUpdating || !token) return;
    
    setIsUpdating(true);
    try {
      const result = await updateOrderStatusClient(order.id, newStatus, token);
      if (result.success) {
        router.refresh(); // Refresh the page to show updated data
      } else {
        alert(`Failed to update order status: ${result.message}`);
      }
    } catch (error) {
      alert(`Error updating order status: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (isUpdating || !token) return;
    
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await cancelOrderClient(order.id, token);
      if (result.success) {
        router.refresh(); // Refresh the page to show updated data
      } else {
        alert(`Failed to cancel order: ${result.message}`);
      }
    } catch (error) {
      alert(`Error cancelling order: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't show actions if order is already completed or cancelled
  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    return (
      <div className="text-center py-4 text-gray-500">
        No actions available for {order.status.toLowerCase()} orders
      </div>
    );
  }

  return (
    <div className="flex flex-column gap10">
      {isUpdating && (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="sr-only">Updating...</span>
          </div>
          <span className="ml-2">Updating order...</span>
        </div>
      )}

      {/* Status Update Buttons */}
      <div className="flex flex-column gap8">
        {order.status === 'PENDING' && (
          <button 
            onClick={() => handleStatusUpdate('PROCESSING')}
            disabled={isUpdating || !token}
            className="tf-button style-1 w-full"
          >
            <i className="icon-play-circle" />
            Mark as Processing
          </button>
        )}

        {order.status === 'PROCESSING' && (
          <button 
            onClick={() => handleStatusUpdate('SHIPPED')}
            disabled={isUpdating || !token}
            className="tf-button style-1 w-full"
          >
            <i className="icon-truck" />
            Mark as Shipped
          </button>
        )}

        {order.status === 'SHIPPED' && (
          <button 
            onClick={() => handleStatusUpdate('DELIVERED')}
            disabled={isUpdating || !token}
            className="tf-button style-1 w-full"
          >
            <i className="icon-check-circle" />
            Mark as Delivered
          </button>
        )}

        {/* Cancel Order Button */}
        {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
          <button 
            onClick={handleCancelOrder}
            disabled={isUpdating || !token}
            className="tf-button style-2 w-full"
          >
            <i className="icon-x-circle" />
            Cancel Order
          </button>
        )}
      </div>

      {/* Status Information */}
      <div className="mt-3 p-3 bg-gray-50 rounded">
        <div className="text-tiny text-gray-600 mb-1">Current Status:</div>
        <div className="body-text">
          {order.status === 'PENDING' && 'Order received and awaiting processing'}
          {order.status === 'PROCESSING' && 'Order is being prepared for shipment'}
          {order.status === 'SHIPPED' && 'Order has been shipped and is on its way'}
          {order.status === 'DELIVERED' && 'Order has been successfully delivered'}
          {order.status === 'CANCELLED' && 'Order has been cancelled'}
        </div>
      </div>
    </div>
  );
}
