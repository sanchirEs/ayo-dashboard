"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getOrderDetailsClient, formatOrderDate, formatPrice, getStatusBadgeClass } from "@/lib/api/orders";
import { updateOrderStatusClient, cancelOrderClient } from "@/lib/api/orders-client";
import GetTokenClient from "@/lib/GetTokenClient";
import { resolveImageUrl } from "@/lib/api/env";
import { useRouter } from "next/navigation";

export default function OrderQuickView({ open, onOpenChange, orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const token = GetTokenClient();

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const result = await getOrderDetailsClient(orderId, token);
      if (result.success && result.data) {
        setOrder(result.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!token || updating) return;
    
    setUpdating(true);
    try {
      const result = await updateOrderStatusClient(orderId, newStatus, token);
      if (result.success) {
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
        router.refresh();
      } else {
        alert(`Failed to update order status: ${result.message}`);
      }
    } catch (error) {
      alert(`Error updating order status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!token || updating) return;
    
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setUpdating(true);
    try {
      const result = await cancelOrderClient(orderId, token);
      if (result.success) {
        setOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
        router.refresh();
      } else {
        alert(`Failed to cancel order: ${result.message}`);
      }
    } catch (error) {
      alert(`Error cancelling order: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const copyTrackingNumber = () => {
    if (order?.shipping?.trackingNumber) {
      navigator.clipboard.writeText(order.shipping.trackingNumber);
      alert('Tracking number copied to clipboard');
    }
  };

  const buildTimeline = () => {
    if (!order) return [];
    
    const timeline = [];
    
    // Order created
    timeline.push({
      event: 'ORDER_CREATED',
      timestamp: order.createdAt,
      description: 'Order created',
      status: 'completed'
    });
    
    // Payment
    if (order.payment) {
      timeline.push({
        event: 'PAYMENT_INITIATED',
        timestamp: order.payment.createdAt || order.createdAt,
        description: `Payment initiated with ${order.payment.provider}`,
        status: order.payment.status === 'COMPLETED' ? 'completed' : 'pending'
      });
      
      if (order.payment.status === 'COMPLETED') {
        timeline.push({
          event: 'PAYMENT_COMPLETED',
          timestamp: order.payment.modifiedAt || order.payment.createdAt,
          description: 'Payment completed',
          status: 'completed'
        });
      }
    }
    
    // Order status progression
    if (order.status === 'PROCESSING') {
      timeline.push({
        event: 'ORDER_PROCESSING',
        timestamp: order.modifiedAt,
        description: 'Order processing',
        status: 'completed'
      });
    }
    
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      timeline.push({
        event: 'ORDER_SHIPPED',
        timestamp: order.shipping?.modifiedAt || order.modifiedAt,
        description: order.shipping?.trackingNumber 
          ? `Shipped with tracking: ${order.shipping.trackingNumber}`
          : 'Order shipped',
        status: 'completed'
      });
    }
    
    if (order.status === 'DELIVERED') {
      timeline.push({
        event: 'ORDER_DELIVERED',
        timestamp: order.modifiedAt,
        description: 'Order delivered',
        status: 'completed'
      });
    }
    
    if (order.status === 'CANCELLED') {
      timeline.push({
        event: 'ORDER_CANCELLED',
        timestamp: order.modifiedAt,
        description: 'Order cancelled',
        status: 'failed'
      });
    }
    
    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[94vw] md:w-[85vw] lg:w-[75vw] xl:w-[65vw] p-6 md:p-8 rounded-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="body-title mb-2">
            Order #{orderId}
          </DialogTitle>
          <DialogDescription className="text-tiny">
            Order details and timeline
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className={getStatusBadgeClass(order.status)}>
                  {order.status}
                </div>
                <div className="text-sm text-gray-600">
                  Created: {formatOrderDate(order.createdAt)}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A'}</div>
                  <div><strong>Email:</strong> {order.user?.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {order.user?.telephone || 'N/A'}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  {order.user?.email && (
                    <a
                      href={`mailto:${order.user.email}`}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded"
                    >
                      Email Customer
                    </a>
                  )}
                  {order.user?.telephone && (
                    <a
                      href={`tel:${order.user.telephone}`}
                      className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded"
                    >
                      Call Customer
                    </a>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold mb-2">Payment Details</h3>
                {order.payment ? (
                  <div className="space-y-1 text-sm">
                    <div><strong>Provider:</strong> {order.payment.provider}</div>
                    <div><strong>Status:</strong> {order.payment.status}</div>
                    <div><strong>Amount:</strong> {formatPrice(order.payment.amount)}</div>
                    {order.payment.providerTransactionId && (
                      <div><strong>Transaction ID:</strong> {order.payment.providerTransactionId}</div>
                    )}
                    {order.payment.createdAt && (
                      <div><strong>Date:</strong> {formatOrderDate(order.payment.createdAt)}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No payment information</div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.orderItems?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded">
                    <img
                      src={item.product?.ProductImages?.[0]?.imageUrl 
                        ? resolveImageUrl(item.product.ProductImages[0].imageUrl)
                        : "/images/products/1.png"}
                      alt={item.product?.name || 'Product'}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.product?.name || 'Product'}</div>
                      {item.variant && (
                        <div className="text-sm text-gray-600">Variant: {item.variant.sku}</div>
                      )}
                      <div className="text-sm text-gray-600">
                        Quantity: {item.quantity} × {formatPrice(item.price)}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-end">
                <div className="text-right space-y-1">
                  <div className="text-sm">
                    <strong>Subtotal:</strong> {formatPrice(order.total)}
                  </div>
                  {order.shippingCost && (
                    <div className="text-sm">
                      <strong>Shipping:</strong> {formatPrice(order.shippingCost)}
                    </div>
                  )}
                  <div className="text-lg font-bold">
                    <strong>Total:</strong> {formatPrice(order.total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            {order.shipping && (
              <div>
                <h3 className="font-semibold mb-2">Shipping Details</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Tracking Number:</strong> 
                    {order.shipping.trackingNumber ? (
                      <span className="ml-2">
                        {order.shipping.trackingNumber}
                        <button
                          onClick={copyTrackingNumber}
                          className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded"
                        >
                          Copy
                        </button>
                      </span>
                    ) : 'N/A'}
                  </div>
                  {order.shipping.estimatedDelivery && (
                    <div><strong>Estimated Delivery:</strong> {formatOrderDate(order.shipping.estimatedDelivery)}</div>
                  )}
                  <div><strong>Shipping Method:</strong> {order.shipping.shippingMethod || 'Standard'}</div>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div>
              <h3 className="font-semibold mb-3">Order Timeline</h3>
              <div className="space-y-2">
                {buildTimeline().map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.status === 'completed' ? 'bg-green-500' : 
                      event.status === 'failed' ? 'bg-red-500' : 
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{event.description}</div>
                      <div className="text-xs text-gray-500">{formatOrderDate(event.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load order details
          </div>
        )}

        <DialogFooter className="mt-6 gap-2">
          {order && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <>
              {order.status === 'PENDING' && (
                <Button
                  onClick={() => handleStatusUpdate('PROCESSING')}
                  disabled={updating}
                  className="tf-button style-1"
                >
                  Mark as Processing
                </Button>
              )}
              {order.status === 'PROCESSING' && (
                <Button
                  onClick={() => handleStatusUpdate('SHIPPED')}
                  disabled={updating}
                  className="tf-button style-1"
                >
                  Mark as Shipped
                </Button>
              )}
              {order.status === 'SHIPPED' && (
                <Button
                  onClick={() => handleStatusUpdate('DELIVERED')}
                  disabled={updating}
                  className="tf-button style-1"
                >
                  Mark as Delivered
                </Button>
              )}
              {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                <Button
                  onClick={handleCancelOrder}
                  disabled={updating}
                  className="tf-button style-3"
                >
                  Cancel Order
                </Button>
              )}
            </>
          )}
          <Button onClick={() => onOpenChange(false)} className="tf-button">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
