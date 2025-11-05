"use client";

import { useState } from "react";

export default function ProductFilters({ filters, setFilters, uniqueBrands, uniqueCategories }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      category: '',
      stockStatus: '',
      minPrice: '',
      maxPrice: '',
      deliveryType: ''
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Basic Filter Row */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'nowrap',
        alignItems: 'center',
        marginBottom: '1rem',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {/* Brand Filter */}
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

        {/* Category Filter */}
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

        {/* Stock Status Filter */}
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

        {/* Delivery Type Filter */}
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

        {/* Advanced Filters Toggle */}
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
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
          <span style={{ fontSize: '16px' }}>⚙</span>
          Үнийн дүнгээр
          <span style={{ 
            transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}>
            ▼
          </span>
        </button>

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
            ✕ Цэвэрлэх ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Advanced Filters */}
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
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
