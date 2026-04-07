"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') || '');
  const [paymentProvider, setPaymentProvider] = useState(searchParams.get('paymentProvider') || '');
  const [deliveryType, setDeliveryType] = useState(searchParams.get('deliveryType') || '');
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

  const buildParams = (overrides = {}) => {
    const current = { search, status, dateFrom, dateTo, paymentStatus, paymentProvider, deliveryType };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    if (merged.search) params.set('search', merged.search);
    if (merged.status) params.set('status', merged.status);
    if (merged.dateFrom) params.set('dateFrom', merged.dateFrom);
    if (merged.dateTo) params.set('dateTo', merged.dateTo);
    if (merged.paymentStatus) params.set('paymentStatus', merged.paymentStatus);
    if (merged.paymentProvider) params.set('paymentProvider', merged.paymentProvider);
    if (merged.deliveryType) params.set('deliveryType', merged.deliveryType);
    params.set('page', '1');
    return params;
  };

  const updateAllFilters = (newDateFrom = dateFrom, newDateTo = dateTo) => {
    const params = buildParams({ dateFrom: newDateFrom, dateTo: newDateTo });
    const queryString = params.toString();
    router.push(`/order-list${queryString ? '?' + queryString : ''}`);
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    router.push(`/order-list?${buildParams({ status: newStatus }).toString()}`);
  };

  const handlePaymentStatusChange = (newPaymentStatus) => {
    setPaymentStatus(newPaymentStatus);
    router.push(`/order-list?${buildParams({ paymentStatus: newPaymentStatus }).toString()}`);
  };

  const handlePaymentProviderChange = (newPaymentProvider) => {
    setPaymentProvider(newPaymentProvider);
    router.push(`/order-list?${buildParams({ paymentProvider: newPaymentProvider }).toString()}`);
  };

  const handleDeliveryTypeChange = (newDeliveryType) => {
    setDeliveryType(newDeliveryType);
    router.push(`/order-list?${buildParams({ deliveryType: newDeliveryType }).toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/order-list?${buildParams().toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPaymentStatus('');
    setPaymentProvider('');
    setDeliveryType('');
    setDateFrom('');
    setDateTo('');
    setDatePreset('');
    router.push('/order-list');
  };

  const activeFiltersCount = [search, status, paymentStatus, paymentProvider, deliveryType, dateFrom, dateTo].filter(v => v).length;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Compact Filter Row */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap',
        alignItems: 'center',
        paddingBottom: '4px'
      }}>
        {/* Search Input */}
        <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
          <form onSubmit={handleSearch} style={{ width: '100%' }}>
            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search orders by customer name, order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 40px 8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3730a3'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6b7280'
                }}
              >
                <i className="icon-search" />
              </button>
            </div>
          </form>
        </div>

        {/* Date Range Preset */}
        <select
          value={datePreset}
          onChange={(e) => handleDatePresetChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: datePreset ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '110px',
            maxWidth: '140px'
          }}
        >
          <option value="">Date Range</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7days">Last 7 days</option>
          <option value="last30days">Last 30 days</option>
          <option value="last90days">Last 90 days</option>
        </select>

        {/* Order Status Filter */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: status ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '110px',
            maxWidth: '140px'
          }}
        >
          <option value="">All Status</option>
          <option value="PENDING">Төлбөр төлөөгүй</option>
          <option value="PROCESSING">Төлбөр төлсөн</option>
          <option value="SHIPPED">Хүргэлтэнд гарсан</option>
          <option value="DELIVERED">Хүргэгдсэн</option>
          <option value="CANCELLED">Цуцлагдсан</option>
        </select>

        {/* Payment Status Filter */}
        <select
          value={paymentStatus}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: paymentStatus ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '120px',
            maxWidth: '160px'
          }}
        >
          <option value="">Payment Status</option>
          <option value="PENDING">Төлбөр Хүлээгдэж байна</option>
          <option value="COMPLETED">Төлбөр төлсөн</option>
          <option value="FAILED">Төлбөр амжилтгүй</option>
          <option value="PROCESSING">Processing</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Төлбөр цуцалсан</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        {/* Payment Provider Filter */}
        <select
          value={paymentProvider}
          onChange={(e) => handlePaymentProviderChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: paymentProvider ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '100px',
            maxWidth: '130px'
          }}
        >
          <option value="">Provider</option>
          <option value="QPAY">QPAY</option>
          <option value="POCKET">POCKET</option>
          <option value="STOREPAY">STOREPAY</option>
        </select>

        {/* Delivery Type Filter */}
        <select
          value={deliveryType}
          onChange={(e) => handleDeliveryTypeChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: deliveryType ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '100px',
            maxWidth: '130px'
          }}
        >
          <option value="">Хүргэлт</option>
          <option value="DELIVERY">Хүргэлт</option>
          <option value="PICKUP">Ирж авах</option>
        </select>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontSize: '13px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            ✕ Clear ({activeFiltersCount})
          </button>
        )}
      </div>
    </div>
  );
}
