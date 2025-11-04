"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [preset, setPreset] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

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

  const handlePresetChange = (presetValue) => {
    setPreset(presetValue);
    
    if (presetValue === 'custom') {
      setShowCustomRange(true);
      return;
    }
    
    setShowCustomRange(false);
    const dates = getPresetDates(presetValue);
    setDateFrom(dates.from);
    setDateTo(dates.to);
    updateFilters(dates.from, dates.to);
  };

  const handleCustomDateChange = () => {
    if (dateFrom && dateTo) {
      updateFilters(dateFrom, dateTo);
    }
  };

  const updateFilters = (from, to) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (from) {
      params.set('dateFrom', from);
    } else {
      params.delete('dateFrom');
    }
    
    if (to) {
      params.set('dateTo', to);
    } else {
      params.delete('dateTo');
    }
    
    params.set('page', '1'); // Reset to first page when filtering
    
    router.push(`/order-list?${params.toString()}`);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setPreset('');
    setShowCustomRange(false);
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('dateFrom');
    params.delete('dateTo');
    params.set('page', '1');
    
    router.push(`/order-list?${params.toString()}`);
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Preset Dropdown */}
      <select
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          fontSize: '13px',
          backgroundColor: preset ? '#f3f4f6' : 'white',
          cursor: 'pointer',
          minWidth: '140px'
        }}
      >
        <option value="">Date Range</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last7days">Last 7 days</option>
        <option value="last30days">Last 30 days</option>
        <option value="last90days">Last 90 days</option>
        <option value="custom">Custom Range</option>
      </select>

      {/* Custom Date Range Inputs */}
      {showCustomRange && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              if (e.target.value && dateTo) {
                updateFilters(e.target.value, dateTo);
              }
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              fontSize: '13px'
            }}
          />
          <span style={{ color: '#9ca3af' }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              if (dateFrom && e.target.value) {
                updateFilters(dateFrom, e.target.value);
              }
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              fontSize: '13px'
            }}
          />
        </div>
      )}

      {/* Clear Date Filter Button */}
      {hasDateFilter && (
        <button
          onClick={clearDateFilter}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #ef4444',
            color: '#ef4444',
            fontSize: '12px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
          Clear Date
        </button>
      )}
    </div>
  );
}
