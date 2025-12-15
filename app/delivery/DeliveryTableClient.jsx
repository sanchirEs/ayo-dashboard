"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DeliveryRowClient from "./DeliveryRowClient";

export default function DeliveryTableClient({ deliveries: initialDeliveries, pagination: initialPagination }) {
  const [deliveries] = useState(initialDeliveries);
  const [pagination] = useState(initialPagination);
  const [selectedDeliveries, setSelectedDeliveries] = useState(new Set());
  
  // Load selected deliveries from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('selectedDeliveries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedDeliveries(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse saved selected deliveries', e);
      }
    }
  }, []);
  
  // Save selected deliveries to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedDeliveries.size > 0) {
      sessionStorage.setItem('selectedDeliveries', JSON.stringify([...selectedDeliveries]));
    } else {
      sessionStorage.removeItem('selectedDeliveries');
    }
  }, [selectedDeliveries]);
  
  // Grid template for delivery table columns
  // Columns: Order ID | Customer | Papa Code | Status | Driver | Items | Created
  const gridTemplate = '70px minmax(150px, 1.5fr) minmax(120px, 1.2fr) minmax(100px, 1fr) minmax(120px, 1.2fr) minmax(80px, 0.8fr) minmax(150px, 1.5fr)';

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allDeliveryIds = new Set(deliveries.map(delivery => delivery.id));
      setSelectedDeliveries(allDeliveryIds);
    } else {
      setSelectedDeliveries(new Set());
    }
  };

  const handleSelectDelivery = (deliveryId) => {
    const newSelected = new Set(selectedDeliveries);
    if (newSelected.has(deliveryId)) {
      newSelected.delete(deliveryId);
    } else {
      newSelected.add(deliveryId);
    }
    setSelectedDeliveries(newSelected);
  };

  // const allSelected = deliveries.length > 0 && deliveries.every(delivery => selectedDeliveries.has(delivery.id));
  // const someSelected = deliveries.some(delivery => selectedDeliveries.has(delivery.id));

  return (
    <>
      <div className="wg-table table-all-category">
        <ul className="table-title flex gap20 mb-14">
          {/* <li>
            <div className="body-title">Order ID</div>
          </li> */}
          <li>
            <div className="body-title">Customer</div>
          </li>
          <li>
            <div className="body-title">Papa Code</div>
          </li>
          <li>
            <div className="body-title">Status</div>
          </li>
          <li>
            <div className="body-title">Driver</div>
          </li>
          <li>
            <div className="body-title">Items</div>
          </li>
          <li>
            <div className="body-title">Created</div>
          </li>
 
        </ul>
        <ul className="flex flex-column">
          {deliveries.length === 0 ? (
            <li className="product-item gap14">
              <div className="text-center py-8 text-gray-500">
                No deliveries found
              </div>
            </li>
          ) : (
            deliveries.map((delivery) => (
              <DeliveryRowClient 
                key={delivery.id} 
                delivery={delivery}
                isSelected={selectedDeliveries.has(delivery.id)}
                onSelect={() => handleSelectDelivery(delivery.id)}
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
                Showing {deliveries.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
                {pagination.total} deliveries
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

