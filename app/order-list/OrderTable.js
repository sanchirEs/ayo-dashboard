import Link from "next/link";
import { getOrders, getStatusBadgeClass, formatOrderDate, formatPrice } from "@/lib/api/orders";
import OrderRowActions from "./OrderRowActions";
import OrderImage from "./OrderImage";

export default async function OrderTable({ searchParams }) {
  // In Next.js 15, searchParams might be a Promise - await if needed
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  
  const page = parseInt(params.page) || 1;
  // Increase default limit for dashboard - will fetch all pages anyway
  const limit = parseInt(params.limit) || 100;
  const status = params.status || '';
  const search = params.search || '';

  try {
    const { data: orders, pagination } = await getOrders({
      page,
      limit,
      status,
      search,
      sortField: 'createdAt', // Sort by creation date to show recent orders first
      sortOrder: 'desc'
    });

    return (
      <div className="wg-table table-all-category">
        <ul className="table-title flex gap20 mb-14">
          <li>
            <div className="body-title">Product</div>
          </li>
          <li>
            <div className="body-title">Order ID</div>
          </li>
          <li>
            <div className="body-title">Customer</div>
          </li>
          <li>
            <div className="body-title">Total</div>
          </li>
          <li>
            <div className="body-title">Items</div>
          </li>
          <li>
            <div className="body-title">Payment</div>
          </li>
          <li>
            <div className="body-title">Status</div>
          </li>
          <li>
            <div className="body-title">Date</div>
          </li>
          <li>
            <div className="body-title">Action</div>
          </li>
        </ul>
        <ul className="flex flex-column">
          {orders.length === 0 ? (
            <li className="product-item gap14">
              <div className="text-center py-8 text-gray-500">
                No orders found
              </div>
            </li>
          ) : (
            orders.map((order) => {
              // Get the first product image for display
              const firstItem = order.orderItems[0];
              const productImage = firstItem?.product?.ProductImages?.[0]?.imageUrl;
              const productName = firstItem?.product?.name || 'Multiple Products';
              const customerName = order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A';
              
              return (
                <li key={order.id} className="product-item gap14">
                  <OrderImage 
                    imageUrl={productImage}
                    productName={productName}
                  />
                  <div className="flex items-center justify-between gap20 flex-grow">
                    <div className="name">
                      <Link href={`/order-detail/${order.id}`} className="body-title-2">
                        {order.orderItems.length > 1 
                          ? `${productName} + ${order.orderItems.length - 1} more`
                          : productName
                        }
                      </Link>
                    </div>
                    <div className="body-text">#{order.id}</div>
                    <div className="body-text">{customerName}</div>
                    <div className="body-text">{formatPrice(order.total)}</div>
                    <div className="body-text">{order.orderItems.length}</div>
                    <div className="body-text">
                      {order.payment ? order.payment.provider : 'N/A'}
                    </div>
                    <div>
                      <div className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </div>
                    </div>
                    <div className="body-text text-sm">
                      {formatOrderDate(order.createdAt)}
                    </div>
                    <OrderRowActions order={order} />
                  </div>
                </li>
              );
            })
          )}
        </ul>
        
        {/* Pagination */}
        <div className="divider" />
        <div className="flex items-center justify-between flex-wrap gap10">
          <div className="text-tiny">
            Showing {orders.length > 0 ? 1 : 0} to {orders.length} of{" "}
            {pagination.total} entries
          </div>
          <ul className="wg-pagination">
            <li>
              <Link 
                href={`?page=${Math.max(1, pagination.currentPage - 1)}&limit=${pagination.limit}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                className={pagination.currentPage <= 1 ? 'disabled' : ''}
              >
                <i className="icon-chevron-left" />
              </Link>
            </li>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.currentPage - 2) + i;
              if (pageNum > pagination.totalPages) return null;
              
              return (
                <li key={pageNum} className={pagination.currentPage === pageNum ? 'active' : ''}>
                  <Link href={`?page=${pageNum}&limit=${pagination.limit}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}>
                    {pageNum}
                  </Link>
                </li>
              );
            })}
            
            <li>
              <Link 
                href={`?page=${Math.min(pagination.totalPages, pagination.currentPage + 1)}&limit=${pagination.limit}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                className={pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}
              >
                <i className="icon-chevron-right" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading orders:', error);
    return (
      <div className="wg-table table-all-category">
        <div className="text-center py-8 text-red-500">
          Error loading orders: {error.message}
        </div>
      </div>
    );
  }
}
