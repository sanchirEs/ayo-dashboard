import Layout from "@/components/layout/Layout";
import { getOrderDetails, formatOrderDate, formatPrice, getStatusBadgeClass } from "@/lib/api/orders";
import { resolveImageUrl } from "@/lib/api/env";
import Link from "next/link";
import { Suspense } from "react";
import OrderStatusActions from "./OrderStatusActions";
import OrderItemImage from "./OrderItemImage";

export default async function OrderDetail({ params }) {
  const { id } = await params;
  const orderId = parseInt(id);
  
  if (!orderId) {
    return (
      <Layout breadcrumbTitleParent="Orders" breadcrumbTitle="Order Detail">
        <div className="wg-box">
          <div className="text-center py-8 text-red-500">
            Invalid order ID
          </div>
        </div>
      </Layout>
    );
  }

  try {
    const { data: order } = await getOrderDetails(orderId);

    if (!order) {
      return (
        <Layout breadcrumbTitleParent="Orders" breadcrumbTitle="Order Detail">
          <div className="wg-box">
            <div className="text-center py-8 text-red-500">
              Order not found
            </div>
          </div>
        </Layout>
      );
    }

    const customerName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'N/A';
    const subtotal = parseFloat(order.total || 0);
    const shippingCost = order.shipping ? parseFloat(order.shipping.shippingCost || 0) : 0;
    const tax = subtotal * 0.1; // Assuming 10% tax
    const totalWithTax = subtotal + shippingCost + tax;

    return (
      <Layout breadcrumbTitleParent="Orders" breadcrumbTitle={`Order #${order.id}`}>
        <div className="wg-order-detail">
          <div className="left flex-grow">
            {/* Order Items */}
            <div className="wg-box mb-20">
              <div className="wg-table table-order-detail">
                <ul className="table-title flex items-center justify-between gap20 mb-24">
                  <li>
                    <div className="body-title">Order Items ({order.orderItems?.length || 0})</div>
                  </li>
                  <li>
                    <div className={`${getStatusBadgeClass(order.status)} inline-block`}>
                      {order.status}
                    </div>
                  </li>
                </ul>
                <ul className="flex flex-column">
                  {order.orderItems && order.orderItems.length > 0 ? order.orderItems.map((item) => (
                    <li key={item.id} className="product-item gap14">
                      <OrderItemImage 
                        imageUrl={item.product?.ProductImages?.[0]?.imageUrl}
                        productName={item.product?.name || 'Unknown Product'}
                      />
                      <div className="flex items-center justify-between gap40 flex-grow">
                        <div className="name">
                          <div className="text-tiny mb-1">Product name</div>
                          <Link href={`/product-list`} className="body-title-2">
                            {item.product?.name || 'Unknown Product'}
                          </Link>
                          {item.variant && (
                            <div className="text-tiny text-gray-500 mt-1">
                              Variant: {item.variant.sku}
                            </div>
                          )}
                        </div>
                        <div className="name">
                          <div className="text-tiny mb-1">Quantity</div>
                          <div className="body-title-2">{item.quantity || 0}</div>
                        </div>
                        <div className="name">
                          <div className="text-tiny mb-1">Unit Price</div>
                          <div className="body-title-2">{formatPrice(item.price || 0)}</div>
                        </div>
                        <div className="name">
                          <div className="text-tiny mb-1">Total</div>
                          <div className="body-title-2 tf-color-1">
                            {formatPrice((parseFloat(item.price || 0)) * (item.quantity || 0))}
                          </div>
                        </div>
                      </div>
                    </li>
                  )) : (
                    <li className="product-item gap14">
                      <div className="text-center py-8 text-gray-500 w-full">
                        No items found in this order
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Order Totals */}
            <div className="wg-box">
              <div className="wg-table table-cart-totals">
                <ul className="table-title flex mb-24">
                  <li>
                    <div className="body-title">Order Totals</div>
                  </li>
                  <li>
                    <div className="body-title">Amount</div>
                  </li>
                </ul>
                <ul className="flex flex-column gap14">
                  <li className="cart-totals-item">
                    <span className="body-text">Subtotal:</span>
                    <span className="body-title-2">{formatPrice(subtotal)}</span>
                  </li>
                  <li className="divider" />
                  {shippingCost > 0 && (
                    <>
                      <li className="cart-totals-item">
                        <span className="body-text">Shipping ({order.shipping?.shippingMethod}):</span>
                        <span className="body-title-2">{formatPrice(shippingCost)}</span>
                      </li>
                      <li className="divider" />
                    </>
                  )}
                  <li className="cart-totals-item">
                    <span className="body-text">Tax (10%):</span>
                    <span className="body-title-2">{formatPrice(tax)}</span>
                  </li>
                  <li className="divider" />
                  <li className="cart-totals-item">
                    <span className="body-title">Total Amount:</span>
                    <span className="body-title tf-color-1">{formatPrice(totalWithTax)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="right">
            {/* Order Summary */}
            <div className="wg-box mb-20 gap10">
              <div className="body-title">Order Summary</div>
              <div className="summary-item">
                <div className="body-text">Order ID</div>
                <div className="body-title-2">#{order.id}</div>
              </div>
              <div className="summary-item">
                <div className="body-text">Customer</div>
                <div className="body-title-2">{customerName}</div>
              </div>
              <div className="summary-item">
                <div className="body-text">Order Date</div>
                <div className="body-title-2">{formatOrderDate(order.createdAt)}</div>
              </div>
              <div className="summary-item">
                <div className="body-text">Status</div>
                <div className={`${getStatusBadgeClass(order.status)} inline-block`}>
                  {order.status}
                </div>
              </div>
              <div className="summary-item">
                <div className="body-text">Total</div>
                <div className="body-title-2 tf-color-1">{formatPrice(order.total)}</div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="wg-box mb-20 gap10">
              <div className="body-title">Customer Information</div>
              <div className="body-text">
                <strong>Name:</strong> {customerName}<br/>
                <strong>Email:</strong> {order.user?.email || 'N/A'}<br/>
                {order.user?.telephone && (
                  <>
                    <strong>Phone:</strong> {order.user.telephone}<br/>
                  </>
                )}
              </div>
            </div>

            {/* Payment Information */}
            {order.payment && (
              <div className="wg-box mb-20 gap10">
                <div className="body-title">Payment Information</div>
                <div className="summary-item">
                  <div className="body-text">Provider</div>
                  <div className="body-title-2">{order.payment.provider}</div>
                </div>
                <div className="summary-item">
                  <div className="body-text">Status</div>
                  <div className={`${getStatusBadgeClass(order.payment.status)} inline-block`}>
                    {order.payment.status}
                  </div>
                </div>
                <div className="summary-item">
                  <div className="body-text">Amount</div>
                  <div className="body-title-2">{formatPrice(order.payment.amount)}</div>
                </div>
              </div>
            )}

            {/* Shipping Information */}
            {order.shipping && (
              <div className="wg-box mb-20 gap10">
                <div className="body-title">Shipping Information</div>
                <div className="summary-item">
                  <div className="body-text">Method</div>
                  <div className="body-title-2">{order.shipping.shippingMethod}</div>
                </div>
                {order.shipping.trackingNumber && (
                  <div className="summary-item">
                    <div className="body-text">Tracking</div>
                    <div className="body-title-2">{order.shipping.trackingNumber}</div>
                  </div>
                )}
                <div className="summary-item">
                  <div className="body-text">Estimated Delivery</div>
                  <div className="body-title-2 tf-color-2">
                    {formatOrderDate(order.shipping.estimatedDelivery)}
                  </div>
                </div>
                <div className="summary-item">
                  <div className="body-text">Shipping Cost</div>
                  <div className="body-title-2">{formatPrice(order.shipping.shippingCost)}</div>
                </div>
              </div>
            )}

            {/* Order Actions */}
            <div className="wg-box gap10">
              <div className="body-title">Order Actions</div>
              <Suspense fallback={<div>Loading actions...</div>}>
                <OrderStatusActions order={order} />
              </Suspense>
              
              {order.shipping?.trackingNumber && (
                <Link 
                  className="tf-button style-1 w-full mt-2" 
                  href={`/order-tracking/${order.id}`}
                >
                  <i className="icon-truck" />
                  Track Order
                </Link>
              )}
              
              <Link 
                className="tf-button style-3 w-full mt-2" 
                href="/order-list"
              >
                <i className="icon-arrow-left" />
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  } catch (error) {
    console.error('Error loading order details:', error);
    return (
      <Layout breadcrumbTitleParent="Orders" breadcrumbTitle="Order Detail">
        <div className="wg-box">
          <div className="text-center py-8 text-red-500">
            Error loading order: {error.message}
          </div>
        </div>
      </Layout>
    );
  }
}
