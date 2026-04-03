"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import OrderRowClient from "./OrderRowClient";
import BulkActions from "./BulkActions";
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
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  
  // Load selected orders from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('selectedOrders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedOrders(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse saved selected orders', e);
      }
    }
  }, []);
  
  // Save selected orders to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedOrders.size > 0) {
      sessionStorage.setItem('selectedOrders', JSON.stringify([...selectedOrders]));
    } else {
      sessionStorage.removeItem('selectedOrders');
    }
  }, [selectedOrders]);
  
  // Grid template for order table columns
  const gridTemplate = '40px minmax(150px, 2fr) 90px 120px 100px 70px 90px 100px 140px 120px';

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allOrderIds = new Set(orders.map(order => order.id));
      setSelectedOrders(allOrderIds);
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkUpdateComplete = () => {
    // Clear selection after successful bulk update
    setSelectedOrders(new Set());
  };

  const handleExportExcel = () => {
    const rows = orders.map(order => ({
      "Order ID": order.id,
      "Customer": order.user ? `${order.user.firstName} ${order.user.lastName}` : "—",
      "Email": order.user?.email || "",
      "Phone": order.user?.telephone || "",
      "Status": order.status,
      "Total": order.total,
      "Items": order.orderItems?.length || 0,
      "Payment Provider": order.payment?.provider || "",
      "Payment Status": order.payment?.status || "",
      "Date": order.createdAt ? new Date(order.createdAt).toLocaleString() : "",
    }));
    const date = new Date().toISOString().slice(0, 10);
    exportToExcel(rows, `orders-${date}`);
  };

  const allSelected = orders.length > 0 && orders.every((order) => selectedOrders.has(order?.id));
  const someSelected = orders.some((order) => selectedOrders.has(order?.id));

  return (
    <>
      {/* Export Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <button
          onClick={handleExportExcel}
          disabled={orders.length === 0}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            fontSize: "13px",
            fontWeight: 600,
            backgroundColor: "#fff",
            color: "#374151",
            cursor: orders.length === 0 ? "not-allowed" : "pointer",
            opacity: orders.length === 0 ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (orders.length > 0) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Compact Selection Bar - Combines selection info and bulk actions */}
      {selectedOrders.size > 0 && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '500' }}>
              {selectedOrders.size} selected
            </span>
            <BulkActions 
              selectedOrders={selectedOrders}
              onUpdateComplete={handleBulkUpdateComplete}
            />
          </div>
          
          <button
            onClick={() => setSelectedOrders(new Set())}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#1e40af';
              e.target.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#6b7280';
              e.target.style.textDecoration = 'none';
            }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      <div className="wg-table table-all-category">
        <ul className="table-title flex gap20 mb-14">
          <li>
            <div className="body-title"  style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={handleSelectAll}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              Product
            </div>
            {/* <div className="body-title">Product</div> */}
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
            orders.map((order) => (
              <OrderRowClient 
                key={order.id} 
                order={order}
                isSelected={selectedOrders.has(order.id)}
                onSelect={() => handleSelectOrder(order.id)}
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
