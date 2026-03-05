"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DeliveryRowClient from "./DeliveryRowClient";
import DeliveryBulkActions from "./DeliveryBulkActions";

export default function DeliveryTableClient({ deliveries: initialDeliveries, pagination: initialPagination }) {
  const [deliveries] = useState(() => (Array.isArray(initialDeliveries) ? initialDeliveries : []));
  const [pagination] = useState(() => ({
    total: initialPagination?.total ?? 0,
    totalPages: initialPagination?.totalPages ?? 0,
    currentPage: initialPagination?.currentPage ?? 1,
    limit: initialPagination?.limit ?? 100,
  }));
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('selectedDeliveries');
      if (saved) setSelected(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  useEffect(() => {
    if (selected.size > 0) sessionStorage.setItem('selectedDeliveries', JSON.stringify([...selected]));
    else sessionStorage.removeItem('selectedDeliveries');
  }, [selected]);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const allSelected = deliveries.length > 0 && deliveries.every(d => selected.has(d.id));
  const someSelected = deliveries.some(d => selected.has(d.id));
  const selectedDeliveries = deliveries.filter(d => selected.has(d.id));

  return (
    <>
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div style={{
          padding: '8px 12px', backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe', borderRadius: '6px', marginBottom: '1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '500' }}>
              {selected.size} сонгогдсон
            </span>
            <DeliveryBulkActions
              selectedOrders={selected}
              selectedDeliveries={selectedDeliveries}
              onUpdateComplete={() => setSelected(new Set())}
            />
          </div>
          <button
            onClick={() => setSelected(new Set())}
            style={{ padding: '4px 10px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => e.target.style.color = '#1e40af'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}
          >
            ✕ Цэвэрлэх
          </button>
        </div>
      )}

      <div className="wg-table table-all-category">
        {/* Table header */}
        <ul className="table-title flex gap20 mb-14">
          <li>
            <div className="body-title" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                onChange={(e) => setSelected(e.target.checked ? new Set(deliveries.map(d => d.id)) : new Set())}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              Захиалга
            </div>
          </li>
          <li><div className="body-title">Дүүрэг</div></li>
          <li><div className="body-title">Papa статус</div></li>
          <li><div className="body-title">Papa код</div></li>
          <li><div className="body-title">Нийт</div></li>
          <li><div className="body-title">Огноо</div></li>
          <li><div className="body-title">Хүргэлт</div></li>
          <li style={{ width: 150, flexShrink: 0 }}><div className="body-title">Үйлдэл</div></li>
        </ul>

        {/* Rows */}
        <ul className="flex flex-column">
          {deliveries.length === 0 ? (
            <li className="product-item gap14">
              <div className="text-center py-8" style={{ color: '#6b7280', width: '100%' }}>
                Захиалга олдсонгүй
              </div>
            </li>
          ) : (
            deliveries.map((delivery) => (
              <DeliveryRowClient
                key={delivery.id}
                delivery={delivery}
                isSelected={selected.has(delivery.id)}
                onSelect={() => toggle(delivery.id)}
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
                Showing {deliveries.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
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
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const p = Math.max(1, pagination.currentPage - 2) + i;
                  if (p > pagination.totalPages) return null;
                  return (
                    <li key={p} className={pagination.currentPage === p ? 'active' : ''}>
                      <Link href={`?page=${p}&limit=${pagination.limit}`}>{p}</Link>
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
