import Link from "next/link";
import { getOrders, getStatusBadgeClass, formatOrderDate, formatPrice } from "@/lib/api/orders";
import OrderRowActions from "./OrderRowActions";
import OrderImage from "./OrderImage";

export default async function OrderTable({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const limit = parseInt(searchParams.limit) || 10;
  const status = searchParams.status || '';
  const search = searchParams.search || '';

  try {
    const { data: orders, pagination } = await getOrders({
      page,
      limit,
      status,
      search,
      sortField: 'createdAt',
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
            Showing {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.total)} to{" "}
            {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
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
