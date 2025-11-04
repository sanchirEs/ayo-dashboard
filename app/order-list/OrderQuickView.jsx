"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto p-0">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-3 text-gray-600">Loading order...</p>
          </div>
        ) : order ? (
          <div className="bg-white">
            {/* Receipt Header */}
            <div className="text-center py-8 px-6 border-b-2 border-dashed">
              <div className="text-3xl font-bold text-gray-900 mb-2">Order Receipt</div>
              <div className="text-sm text-gray-500">Order #{orderId}</div>
              <div className="text-xs text-gray-400 mt-1">
                {order.createdAt ? formatOrderDate(order.createdAt) : 'N/A'}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center py-4 border-b">
              <span className={`inline-block px-4 py-1.5 text-sm font-medium rounded-full ${
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
            </div>

            {/* Customer Info */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Customer</div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'N/A'}
                </div>
                <div className="text-gray-600">{order.user?.email || 'N/A'}</div>
                {order.user?.telephone && (
                  <div className="text-gray-600">{order.user.telephone}</div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {order.user?.addresses && order.user.addresses.length > 0 && (
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Shipping Address</div>
                <div className="text-sm text-gray-900">
                  {order.user.addresses[0].addressLine1}<br />
                  {order.user.addresses[0].addressLine2 && <>{order.user.addresses[0].addressLine2}<br /></>}
                  {order.user.addresses[0].city}, {order.user.addresses[0].postalCode}<br />
                  {order.user.addresses[0].country}
                  {order.user.addresses[0].mobile && (
                    <>
                      <br />
                      <span className="text-gray-600">Mobile: {order.user.addresses[0].mobile}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="px-6 py-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Items</div>
              <div className="space-y-3">
                {order.orderItems?.map((item, index) => {
                  const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 0);
                  return (
                    <div key={index} className="flex gap-3">
                      <img
                        src={item.product?.ProductImages?.[0]?.imageUrl 
                          ? resolveImageUrl(item.product.ProductImages[0].imageUrl)
                          : "/images/products/1.png"}
                        alt={item.product?.name || 'Product'}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => { e.target.src = "/images/products/1.png"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.product?.name || 'Product'}
                        </div>
                        {item.variant && (
                          <div className="text-xs text-gray-500">SKU: {item.variant.sku}</div>
                        )}
                        <div className="text-xs text-gray-600">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(itemTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="px-6 py-4 border-t-2 border-dashed">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice((parseFloat(order.subtotal) || parseFloat(order.total) || 0) - (parseFloat(order.shippingCost) || 0))}</span>
                </div>
                {order.shippingCost && parseFloat(order.shippingCost) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{formatPrice(order.shippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {order.payment && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Payment</div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <div className="text-gray-900">{order.payment.provider}</div>
                    <div className="text-xs text-gray-500">
                      {order.payment.createdAt && formatOrderDate(order.payment.createdAt)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    order.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.payment.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.payment.status}
                  </span>
                </div>
              </div>
            )}

            {/* Shipping Details */}
            {order.shipping && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Shipping</div>
                <div className="text-sm space-y-1">
                  {order.shipping.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking</span>
                      <span className="text-gray-900 font-mono text-xs">{order.shipping.trackingNumber}</span>
                    </div>
                  )}
                  {order.shipping.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Delivery</span>
                      <span className="text-gray-900">{formatOrderDate(order.shipping.estimatedDelivery)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method</span>
                    <span className="text-gray-900 capitalize">{order.shipping.shippingMethod || 'Standard'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Saga Error */}
            {order.sagas && order.sagas.length > 0 && order.sagas[0].status === 'FAILED' && (
              <div className="px-6 py-4 border-t bg-red-50">
                <div className="text-xs text-red-600 uppercase tracking-wide mb-1">Processing Error</div>
                <div className="text-sm text-red-700">{order.sagas[0].errorMessage || 'Unknown error'}</div>
              </div>
            )}

            {/* Action Buttons */}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <div className="px-6 py-4 border-t bg-gray-50 flex gap-2 justify-end">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusUpdate('PROCESSING')}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Mark Processing'}
                  </button>
                )}
                {order.status === 'PROCESSING' && (
                  <button
                    onClick={() => handleStatusUpdate('SHIPPED')}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Mark Shipped'}
                  </button>
                )}
                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleStatusUpdate('DELIVERED')}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Mark Delivered'}
                  </button>
                )}
                {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {updating ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-6 border-t-2 border-dashed text-center">
              <button 
                onClick={() => onOpenChange(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="text-gray-400 mb-3">❌</div>
            <div className="text-gray-600">Failed to load order details</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
