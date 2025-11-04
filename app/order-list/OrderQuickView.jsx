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
        // Handle both flat and nested data structures
        const orderData = result.data.order || result.data;
        setOrder(orderData);
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
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-blue-600">🛍️</span>
            <span>Order #{orderId}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Complete order information, payment status, and delivery timeline
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${getStatusBadgeClass(order.status)} text-sm font-medium px-4 py-2 rounded-lg shadow-sm`}>
                    {order.status}
                  </div>
                  <div className="text-sm text-gray-700 bg-white px-3 py-1.5 rounded-lg">
                    💰 {formatPrice(order.total)}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Created:</span>{' '}
                  <span className="text-gray-900">
                    {order.createdAt ? formatOrderDate(order.createdAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-800">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-20">Name:</span>
                    <span className="text-gray-900">
                      {order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-20">Email:</span>
                    <span className="text-gray-900">{order.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-20">Phone:</span>
                    <span className="text-gray-900">{order.user?.telephone || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {order.user?.email && (
                    <a
                      href={`mailto:${order.user.email}`}
                      className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      📧 Email
                    </a>
                  )}
                  {order.user?.telephone && (
                    <a
                      href={`tel:${order.user.telephone}`}
                      className="text-xs px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                      📞 Call
                    </a>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-800">Payment Details</h3>
                {order.payment ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 w-24">Provider:</span>
                      <span className="text-gray-900">{order.payment.provider}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 w-24">Status:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.payment.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.payment.status}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 w-24">Amount:</span>
                      <span className="text-gray-900 font-semibold">{formatPrice(order.payment.amount)}</span>
                    </div>
                    {order.payment.providerTransactionId && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-600 w-24">Transaction:</span>
                        <span className="text-gray-900 text-xs break-all">{order.payment.providerTransactionId}</span>
                      </div>
                    )}
                    {order.payment.createdAt && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-600 w-24">Date:</span>
                        <span className="text-gray-900">{formatOrderDate(order.payment.createdAt)}</span>
                      </div>
                    )}
                    {order.payment.expiresAt && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-600 w-24">Expires:</span>
                        <span className="text-gray-900">{formatOrderDate(order.payment.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No payment information available</div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white">
              <h3 className="font-semibold mb-3 text-gray-800">Order Items</h3>
              <div className="space-y-3">
                {order.orderItems?.map((item, index) => {
                  const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 0);
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                      <img
                        src={item.product?.ProductImages?.[0]?.imageUrl 
                          ? resolveImageUrl(item.product.ProductImages[0].imageUrl)
                          : "/images/products/1.png"}
                        alt={item.product?.name || 'Product'}
                        className="w-20 h-20 object-cover rounded-lg border"
                        onError={(e) => { e.target.src = "/images/products/1.png"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 mb-1">{item.product?.name || 'Product'}</div>
                        {item.variant && (
                          <div className="text-xs text-gray-500 mb-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">SKU: {item.variant.sku}</span>
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{item.quantity}</span> × {formatPrice(item.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">
                          {formatPrice(itemTotal)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t-2 border-gray-200">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice((parseFloat(order.subtotal) || parseFloat(order.total) || 0) - (parseFloat(order.shippingCost) || 0))}
                      </span>
                    </div>
                    {order.shippingCost && parseFloat(order.shippingCost) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium text-gray-900">{formatPrice(order.shippingCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span className="text-gray-800">Total:</span>
                      <span className="text-blue-600">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            {order.shipping && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-800">Shipping Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-32">Method:</span>
                    <span className="text-gray-900 capitalize">
                      {order.shipping.shippingMethod || 'Standard'}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-32">Tracking:</span>
                    {order.shipping.trackingNumber ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded border">
                          {order.shipping.trackingNumber}
                        </span>
                        <button
                          onClick={copyTrackingNumber}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Not available</span>
                    )}
                  </div>
                  {order.shipping.estimatedDelivery && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 w-32">Est. Delivery:</span>
                      <span className="text-gray-900">{formatOrderDate(order.shipping.estimatedDelivery)}</span>
                    </div>
                  )}
                  {order.shipping.shippingCost && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 w-32">Cost:</span>
                      <span className="text-gray-900 font-semibold">{formatPrice(order.shipping.shippingCost)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Saga Info - Show if failed */}
            {order.sagas && order.sagas.length > 0 && order.sagas[0].status === 'FAILED' && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-red-800 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Order Processing Issue</span>
                </h3>
                <div className="text-sm text-red-700 space-y-1">
                  <div>
                    <strong>Error:</strong> {order.sagas[0].errorMessage || 'Unknown error occurred'}
                  </div>
                  <div className="text-xs text-red-600 mt-2">
                    Failed at step {order.sagas[0].currentStep + 1} of {order.sagas[0].totalSteps}
                  </div>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white">
              <h3 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span>📋</span>
                <span>Order Timeline</span>
              </h3>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                  {buildTimeline().map((event, index) => (
                    <div key={index} className="relative flex items-start gap-4 pl-2">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                        event.status === 'completed' ? 'bg-green-500' : 
                        event.status === 'failed' || event.status === 'cancelled' ? 'bg-red-500' : 
                        'bg-yellow-500'
                      }`}>
                        {event.status === 'completed' && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {(event.status === 'failed' || event.status === 'cancelled') && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="text-sm font-semibold text-gray-900">{event.description}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatOrderDate(event.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load order details
          </div>
        )}

        <DialogFooter className="mt-8 pt-4 border-t flex flex-wrap gap-2 justify-end">
          {order && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <>
              {order.status === 'PENDING' && (
                <Button
                  onClick={() => handleStatusUpdate('PROCESSING')}
                  disabled={updating}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? '⏳ Updating...' : '🔄 Mark as Processing'}
                </Button>
              )}
              {order.status === 'PROCESSING' && (
                <Button
                  onClick={() => handleStatusUpdate('SHIPPED')}
                  disabled={updating}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? '⏳ Updating...' : '📦 Mark as Shipped'}
                </Button>
              )}
              {order.status === 'SHIPPED' && (
                <Button
                  onClick={() => handleStatusUpdate('DELIVERED')}
                  disabled={updating}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? '⏳ Updating...' : '✅ Mark as Delivered'}
                </Button>
              )}
              {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                <Button
                  onClick={handleCancelOrder}
                  disabled={updating}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? '⏳ Cancelling...' : '❌ Cancel Order'}
                </Button>
              )}
            </>
          )}
          <Button 
            onClick={() => onOpenChange(false)} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition font-medium"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
