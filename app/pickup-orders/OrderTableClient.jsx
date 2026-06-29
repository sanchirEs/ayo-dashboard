"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import OrderRowClient from "./OrderRowClient";
import { exportToExcel } from "@/lib/exportToExcel";

export default function OrderTableClient({ orders: initialOrders, pagination: initialPagination }) {
  // Defensive defaults: production data may differ from dev, and RSC boundaries can deliver
  // unexpected shapes. Ensure we always operate on arrays/objects we control.
  const [orders] = useState(() => (Array.isArray(initialOrders) ? initialOrders : []));
  const [pagination] = useState(() => ({
    total: typeof initialPagination?.total === 'number' ? initialPagination.total : 0,
    totalPages: typeof initialPagination?.totalPages === 'number' ? initialPagination.totalPages : 0,
    currentPage: typeof initialPagination?.currentPage === 'number' ? initialPagination.currentPage : 1,
    limit: typeof initialPagination?.limit === 'number' ? initialPagination.limit : 100,
  }));
  const handleExportExcel = async () => {
    const rows = orders.map(order => ({
      "Order ID": order.id,
      "Customer": order.user ? `${order.user.firstName} ${order.user.lastName}` : "—",
      "Email": order.user?.email || "",
      "Phone": order.shipping?.recipientPhone || order.user?.telephone || "",
      "Status": order.status,
      "Total": order.total,
      "Items": order.orderItems?.length || 0,
      "Бүтээгдэхүүн": order.orderItems?.map(item => {
        const name = item.product?.name || "Бүтээгдэхүүн";
        return item.quantity > 1 ? `${name} x${item.quantity}` : name;
      }).join(", ") || "",
      "Payment Provider": order.payment?.provider || "",
      "Payment Status": order.payment?.status || "",
      "Хүргэлтийн төрөл": order.deliveryType === "PICKUP" ? "Ирж авах" : "Хүргэлт",
      "Хаяг": order.deliveryType === "PICKUP"
        ? (order.shipping?.pickupStoreName || "")
        : [order.shipping?.addressLine1, order.shipping?.addressLine2].filter(Boolean).join(", "),
      "Дүүрэг": order.shipping?.district || "",
      "Date": order.createdAt ? new Date(order.createdAt).toLocaleString() : "",
    }));
    const date = new Date().toISOString().slice(0, 10);
    await exportToExcel(rows, `orders-${date}`);
  };

  // Register export handler so OrderFilters can trigger it
  useEffect(() => {
    const handler = () => handleExportExcel();
    window.addEventListener('export-orders-excel', handler);
    return () => window.removeEventListener('export-orders-excel', handler);
  }, [orders]);

  return (
    <>
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
            <div className="body-title">Дүүрэг</div>
          </li>
          <li>
            <div className="body-title">Хүргэлт</div>
          </li>
          <li>
            <div className="body-title">Status</div>
          </li>
          <li>
            <div className="body-title">Date</div>
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
            orders.map((order) => (
              <OrderRowClient
                key={order.id}
                order={order}
              />
            ))
          )}
        </ul>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <>
            <div className="divider" />
            <div className="flex items-center justify-between flex-wrap gap10">
              <div className="text-tiny">
                Showing {orders.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
                {pagination.total} entries
              </div>
              <ul className="wg-pagination">
                <li>
                  <Link 
                    href={`?page=${Math.max(1, pagination.currentPage - 1)}&limit=${pagination.limit}`}
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
                      <Link href={`?page=${pageNum}&limit=${pagination.limit}`}>
                        {pageNum}
                      </Link>
                    </li>
                  );
                })}
                
                <li>
                  <Link 
                    href={`?page=${Math.min(pagination.totalPages, pagination.currentPage + 1)}&limit=${pagination.limit}`}
                    className={pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}
                  >
                    <i className="icon-chevron-right" />
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}
