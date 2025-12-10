"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DeliveryFilters() {
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
        return {
          from: today.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: yesterday.toISOString().split('T')[0],
          to: yesterday.toISOString().split('T')[0]
        };
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return {
          from: last7.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return {
          from: last30.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      case 'last90days':
        const last90 = new Date(today);
        last90.setDate(last90.getDate() - 90);
        return {
          from: last90.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      default:
        return { from: '', to: '' };
    }
  };

  const handleDatePresetChange = (presetValue) => {
    setDatePreset(presetValue);
    
    if (presetValue === '') {
      setDateFrom('');
      setDateTo('');
      updateAllFilters('', '');
    } else {
      const dates = getPresetDates(presetValue);
      setDateFrom(dates.from);
      setDateTo(dates.to);
      updateAllFilters(dates.from, dates.to);
    }
  };

  const updateAllFilters = (newDateFrom = dateFrom, newDateTo = dateTo) => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (newDateFrom) params.set('dateFrom', newDateFrom);
    if (newDateTo) params.set('dateTo', newDateTo);
    params.set('page', '1');

    const queryString = params.toString();
    router.push(`/delivery${queryString ? '?' + queryString : ''}`);
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (newStatus) params.set('status', newStatus);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', '1');
    router.push(`/delivery?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', '1');
    router.push(`/delivery?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setDatePreset('');
    router.push('/delivery');
  };

  const activeFiltersCount = [search, status, dateFrom, dateTo].filter(v => v).length;

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Minimal Single Row Filters */}
      <form onSubmit={handleSearch} style={{ 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        flexWrap: 'nowrap',
        width: '100%'
      }}>
        {/* Search Input */}
        <div style={{ 
          position: 'relative',
          flex: '1 1 auto',
          minWidth: '200px'
        }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              backgroundColor: 'white',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3730a3'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: 'white',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s',
            flex: '0 1 auto',
            minWidth: '110px'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3730a3'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        >
          <option value="">All Status</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PENDING">Pending</option>
        </select>

        {/* Date Preset */}
        <select
          value={datePreset}
          onChange={(e) => handleDatePresetChange(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: 'white',
            cursor: 'pointer',
            outline: 'none',
            flex: '0 1 auto',
            minWidth: '100px'
          }}
        >
          <option value="">Date</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7days">Last 7D</option>
          <option value="last30days">Last 30D</option>
          <option value="last90days">Last 90D</option>
        </select>

        {/* Manual Date From */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setDatePreset('');
          }}
          style={{
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: 'white',
            outline: 'none',
            flex: '0 1 auto'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3730a3'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />

        {/* Manual Date To */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setDatePreset('');
          }}
          style={{
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: 'white',
            outline: 'none',
            flex: '0 1 auto'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3730a3'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />

        {/* Search Button */}
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#3730a3',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: '0 0 auto'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2d25a0'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3730a3'}
        >
          Search
        </button>

        {/* Clear Button */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            type="button"
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              color: '#6b7280',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flex: '0 0 auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.color = '#6b7280';
            }}
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}

