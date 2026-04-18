"use client";

import { useState } from "react";

const STATUS_TABS = [
  { value: 'all',      label: 'Бүгд',      color: '#374151' },
  { value: 'active',   label: 'Идэвхтэй',  color: '#059669' },
  { value: 'inactive', label: 'Идэвхгүй',  color: '#dc2626' },
];

export default function ProductFilters({ filters, setFilters, uniqueBrands, uniqueCategories, totalActive, totalInactive }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      activeStatus: filters.activeStatus, // preserve status tab
      brand: '',
      category: '',
      stockStatus: '',
      minPrice: '',
      maxPrice: '',
      deliveryType: ''
    });
  };

  const activeFiltersCount = Object.entries(filters)
    .filter(([k, v]) => k !== 'activeStatus' && v)
    .length;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Status Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '1rem',
        padding: '4px',
        backgroundColor: '#f3f4f6',
        borderRadius: '10px',
        width: 'fit-content',
      }}>
        {STATUS_TABS.map(tab => {
          const isSelected = filters.activeStatus === tab.value;
          const count = tab.value === 'all'
            ? (totalActive ?? 0) + (totalInactive ?? 0)
            : tab.value === 'active' ? (totalActive ?? 0) : (totalInactive ?? 0);

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleFilterChange('activeStatus', tab.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '13px',
                fontWeight: isSelected ? '600' : '400',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'white' : 'transparent',
                color: isSelected ? tab.color : '#6b7280',
                boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 18,
                padding: '0 5px',
                borderRadius: 9,
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: isSelected
                  ? tab.value === 'active' ? '#d1fae5' : tab.value === 'inactive' ? '#fee2e2' : '#e5e7eb'
                  : '#e5e7eb',
                color: isSelected ? tab.color : '#9ca3af',
                transition: 'all 0.18s',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Row */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'nowrap',
        alignItems: 'center',
        marginBottom: '1rem',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        <select
          value={filters.brand}
          onChange={(e) => handleFilterChange('brand', e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: filters.brand ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '120px',
            maxWidth: '160px'
          }}
        >
          <option value="">Бүх брэнд</option>
          {uniqueBrands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: filters.category ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '120px',
            maxWidth: '160px'
          }}
        >
          <option value="">Бүх ангилал</option>
          {uniqueCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={filters.stockStatus}
          onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: filters.stockStatus ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '120px',
            maxWidth: '160px'
          }}
        >
          <option value="">Бүх төлөв</option>
          <option value="inStock">Нөөцөд байгаа (10+)</option>
          <option value="lowStock">Нөөц бага (1-10)</option>
          <option value="outOfStock">Дууссан (0)</option>
        </select>

        <select
          value={filters.deliveryType}
          onChange={(e) => handleFilterChange('deliveryType', e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: filters.deliveryType ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            minWidth: '120px',
            maxWidth: '160px'
          }}
        >
          <option value="">Хүргэлтийн төрөл</option>
          <option value="fast">Шуурхай (1-3 хоног)</option>
          <option value="standard">Ердийн (4-14 хоног)</option>
          <option value="imported">Захиалгын бараа</option>
        </select>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <span style={{ fontSize: '16px' }}>⚙</span>
          Үнийн дүнгээр
          <span style={{
            transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>▼</span>
        </button>

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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            ✕ Цэвэрлэх ({activeFiltersCount})
          </button>
        )}
      </div>

      {showAdvanced && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          animation: 'slideDown 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
                display: 'block'
              }}>
                Үнийн хязгаар
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Доод"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                    width: '100px'
                  }}
                />
                <span style={{ color: '#9ca3af' }}>-</span>
                <input
                  type="number"
                  placeholder="Дээд"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                    width: '100px'
                  }}
                />
                <span style={{ fontSize: '13px', color: '#6b7280' }}>₮</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
