"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProductOrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
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
    const current = { search, status, dateFrom, dateTo };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    if (merged.search) params.set('search', merged.search);
    if (merged.status) params.set('status', merged.status);
    if (merged.dateFrom) params.set('dateFrom', merged.dateFrom);
    if (merged.dateTo) params.set('dateTo', merged.dateTo);
    return params;
  };

  const push = (overrides = {}) => {
    const qs = buildParams(overrides).toString();
    router.push(`/product-orders${qs ? '?' + qs : ''}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    push();
  };

  const handleDatePreset = (val) => {
    setDatePreset(val);
    if (!val) { setDateFrom(''); setDateTo(''); push({ dateFrom: '', dateTo: '' }); }
    else { const d = getPresetDates(val); setDateFrom(d.from); setDateTo(d.to); push({ dateFrom: d.from, dateTo: d.to }); }
  };

  const handleStatus = (val) => { setStatus(val); push({ status: val }); };

  const clearFilters = () => {
    setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setDatePreset('');
    router.push('/product-orders');
  };

  const activeFiltersCount = [search, status, dateFrom, dateTo].filter(v => v).length;

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
        {/* Phone / name search */}
        <div style={{ flex: '1 1 260px', minWidth: '220px' }}>
          <form onSubmit={handleSearch} style={{ width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Нэр, утас, и-мэйл, захиалгын дугаараар хайх..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 40px 8px 12px',
                  borderRadius: '6px', border: '1px solid #e5e7eb',
                  fontSize: '13px', backgroundColor: 'white', outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3730a3'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button type="submit" style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}>
                <i className="icon-search" />
              </button>
            </div>
          </form>
        </div>

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
        </select>

        <button
          onClick={() => window.dispatchEvent(new Event('export-product-orders-excel'))}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'white',
            color: '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            marginLeft: 'auto',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Excel
        </button>

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
