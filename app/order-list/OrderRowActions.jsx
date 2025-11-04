"use client";

import Link from "next/link";
import { useState } from "react";
import { updateOrderStatusClient, cancelOrderClient } from "@/lib/api/orders-client";
import { useRouter } from "next/navigation";
import GetTokenClient from "@/lib/GetTokenClient";
import QuickViewAction from "./QuickViewAction";

export default function OrderRowActions({ order }) {
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
    
    if (!confirm('Are you sure you want to cancel this order?')) {
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

  return (
    <div className="list-icon-function">
      {/* View Order Details - Quick View */}
      <QuickViewAction order={order} />

      {/* Status Update Dropdown */}
      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
        <div className="item edit dropdown">
          <button 
            className="dropdown-toggle"
            disabled={isUpdating}
            title="Update Status"
          >
            <i className="icon-edit-3" />
          </button>
          <div className="dropdown-menu">
            {order.status === 'PENDING' && (
              <button 
                onClick={() => handleStatusUpdate('PROCESSING')}
                disabled={isUpdating}
                className="dropdown-item"
              >
                Mark as Processing
              </button>
            )}
            {order.status === 'PROCESSING' && (
              <button 
                onClick={() => handleStatusUpdate('SHIPPED')}
                disabled={isUpdating}
                className="dropdown-item"
              >
                Mark as Shipped
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <button 
                onClick={() => handleStatusUpdate('DELIVERED')}
                disabled={isUpdating}
                className="dropdown-item"
              >
                Mark as Delivered
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancel Order */}
      {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
        <div className="item trash">
          <button 
            onClick={handleCancelOrder}
            disabled={isUpdating}
            title="Cancel Order"
          >
            <i className="icon-trash-2" />
          </button>
        </div>
      )}

      {isUpdating && (
        <div className="item">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
