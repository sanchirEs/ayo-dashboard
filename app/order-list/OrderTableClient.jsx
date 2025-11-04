"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import OrderRowClient from "./OrderRowClient";
import BulkActions from "./BulkActions";

export default function OrderTableClient({ orders: initialOrders, pagination: initialPagination }) {
  const [orders] = useState(initialOrders);
  const [pagination] = useState(initialPagination);
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

  const allSelected = orders.length > 0 && orders.every(order => selectedOrders.has(order.id));
  const someSelected = orders.some(order => selectedOrders.has(order.id));

  return (
    <>
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
