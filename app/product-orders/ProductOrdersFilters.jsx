"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Server-side filters: date range + order status only.
// Product/user name search is handled client-side inside the table component.
export default function ProductOrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [datePreset, setDatePreset] = useState('');

  const getPresetDates = (presetValue) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (presetValue) {
      case 'today':
        return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      case 'yesterday': {
        const d = new Date(today); d.setDate(d.getDate() - 1);
        return { from: d.toISOString().split('T')[0], to: d.toISOString().split('T')[0] };
      }
      case 'last7days': {
        const d = new Date(today); d.setDate(d.getDate() - 7);
        return { from: d.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      }
      case 'last30days': {
        const d = new Date(today); d.setDate(d.getDate() - 30);
        return { from: d.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      }
      case 'last90days': {
        const d = new Date(today); d.setDate(d.getDate() - 90);
        return { from: d.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      }
      default: return { from: '', to: '' };
    }
  };

  const buildParams = (overrides = {}) => {
    const current = { status, dateFrom, dateTo };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    if (merged.status) params.set('status', merged.status);
    if (merged.dateFrom) params.set('dateFrom', merged.dateFrom);
    if (merged.dateTo) params.set('dateTo', merged.dateTo);
    return params;
  };

  const push = (overrides = {}) => {
    const qs = buildParams(overrides).toString();
    router.push(`/product-orders${qs ? '?' + qs : ''}`);
  };

  const handleDatePreset = (val) => {
    setDatePreset(val);
    if (!val) { setDateFrom(''); setDateTo(''); push({ dateFrom: '', dateTo: '' }); }
    else { const d = getPresetDates(val); setDateFrom(d.from); setDateTo(d.to); push({ dateFrom: d.from, dateTo: d.to }); }
  };

  const handleStatus = (val) => { setStatus(val); push({ status: val }); };

  const clearFilters = () => {
    setStatus(''); setDateFrom(''); setDateTo(''); setDatePreset('');
    router.push('/product-orders');
  };

  const activeFiltersCount = [status, dateFrom, dateTo].filter(v => v).length;

  const selectStyle = (active) => ({
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    backgroundColor: active ? '#f3f4f6' : 'white',
    cursor: 'pointer',
    minWidth: '110px',
    maxWidth: '160px',
  });

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Date preset */}
        <select value={datePreset} onChange={(e) => handleDatePreset(e.target.value)} style={selectStyle(!!datePreset)}>
          <option value="">Огноо</option>
          <option value="today">Өнөөдөр</option>
          <option value="yesterday">Өчигдөр</option>
          <option value="last7days">Сүүлийн 7 хоног</option>
          <option value="last30days">Сүүлийн 30 хоног</option>
          <option value="last90days">Сүүлийн 90 хоног</option>
        </select>

        {/* Order status */}
        <select value={status} onChange={(e) => handleStatus(e.target.value)} style={selectStyle(!!status)}>
          <option value="">Бүх статус</option>
          <option value="PENDING">Төлбөр төлөөгүй</option>
          <option value="PROCESSING">Төлбөр төлсөн</option>
          <option value="SHIPPED">Хүргэлтэнд гарсан</option>
          <option value="DELIVERED">Хүргэгдсэн</option>
          <option value="CANCELLED">Цуцлагдсан</option>
        </select>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 12px', borderRadius: '6px', border: '1px solid #ef4444',
              color: '#ef4444', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            ✕ Арилгах ({activeFiltersCount})
          </button>
        )}
      </div>
    </div>
  );
}
