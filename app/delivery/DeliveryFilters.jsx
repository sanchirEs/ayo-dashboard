"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DeliveryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [papaStatus, setPapaStatus] = useState(searchParams.get('papaStatus') || '');
  const [datePreset, setDatePreset] = useState('');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  const getPresetDates = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (preset) {
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
      default: return { from: '', to: '' };
    }
  };

  const push = (overrides = {}) => {
    const s = overrides.search  ?? search;
    const ps = overrides.papaStatus ?? papaStatus;
    const df = overrides.dateFrom  ?? dateFrom;
    const dt = overrides.dateTo    ?? dateTo;
    const params = new URLSearchParams();
    if (s)  params.set('search', s);
    if (ps) params.set('papaStatus', ps);
    if (df) params.set('dateFrom', df);
    if (dt) params.set('dateTo', dt);
    params.set('page', '1');
    router.push(`/delivery${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleSearch = (e) => { e.preventDefault(); push(); };

  const handlePapaStatus = (v) => { setPapaStatus(v); push({ papaStatus: v }); };

  const handleDatePreset = (v) => {
    setDatePreset(v);
    if (!v) { setDateFrom(''); setDateTo(''); push({ dateFrom: '', dateTo: '' }); return; }
    const { from, to } = getPresetDates(v);
    setDateFrom(from); setDateTo(to);
    push({ dateFrom: from, dateTo: to });
  };

  const clearFilters = () => {
    setSearch(''); setPapaStatus(''); setDateFrom(''); setDateTo(''); setDatePreset('');
    router.push('/delivery');
  };

  const activeCount = [search, papaStatus, dateFrom, dateTo].filter(Boolean).length;

  const selectStyle = (active) => ({
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    backgroundColor: active ? '#f3f4f6' : 'white',
    cursor: 'pointer',
    minWidth: '110px',
    maxWidth: '160px',
    outline: 'none',
  });

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '4px' }}>

        {/* Search */}
        <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
          <form onSubmit={handleSearch}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Захиалгын дугаар, харилцагчийн нэрээр хайх..."
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
              <button type="submit" style={{
                position: 'absolute', right: '8px', background: 'none',
                border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280',
              }}>
                <i className="icon-search" />
              </button>
            </div>
          </form>
        </div>

        {/* Date Range */}
        <select value={datePreset} onChange={(e) => handleDatePreset(e.target.value)} style={selectStyle(!!datePreset)}>
          <option value="">Date Range</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7days">Last 7 days</option>
          <option value="last30days">Last 30 days</option>
        </select>

        {/* Papa Status */}
        <select value={papaStatus} onChange={(e) => handlePapaStatus(e.target.value)} style={selectStyle(!!papaStatus)}>
          <option value="">Papa статус</option>
          <option value="none">Илгээгдээгүй</option>
          <option value="NEW">Шинэ</option>
          <option value="CONFIRM">Баталгаажсан</option>
          <option value="START">Гарсан</option>
          <option value="END">Ирсэн</option>
          <option value="COMPLETED">Дууссан</option>
          <option value="CANCELLED">Цуцалсан</option>
        </select>

        {/* Clear */}
        {activeCount > 0 && (
          <button onClick={clearFilters} style={{
            padding: '8px 12px', borderRadius: '6px', border: '1px solid #ef4444',
            color: '#ef4444', fontSize: '13px', backgroundColor: 'white',
            cursor: 'pointer', marginLeft: 'auto',
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            ✕ Clear ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
