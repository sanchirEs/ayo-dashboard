"use client";

import { useState } from "react";

export default function AdvancedSearchModal({ isOpen, onClose, onSearch }) {
  const [searchCriteria, setSearchCriteria] = useState({
    name: '',
    sku: '',
    brand: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    stockStatus: '',
    tags: ''
  });

  const handleSearch = () => {
    onSearch(searchCriteria);
    onClose();
  };

  const handleReset = () => {
    setSearchCriteria({
      name: '',
      sku: '',
      brand: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      stockStatus: '',
      tags: ''
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            Нарийвчилсан хайлт
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Product Name */}
          <div>
            <label style={{ 
              fontSize: '13px', 
              color: '#374151', 
              marginBottom: '6px',
              display: 'block',
              fontWeight: '500'
            }}>
              Бүтээгдэхүүний нэр
            </label>
            <input
              type="text"
              value={searchCriteria.name}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Нэрээр хайх..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>

          {/* SKU */}
          <div>
            <label style={{ 
              fontSize: '13px', 
              color: '#374151', 
              marginBottom: '6px',
              display: 'block',
              fontWeight: '500'
            }}>
              SKU код
            </label>
            <input
              type="text"
              value={searchCriteria.sku}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="SKU код..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Price Range */}
          <div>
            <label style={{ 
              fontSize: '13px', 
              color: '#374151', 
              marginBottom: '6px',
              display: 'block',
              fontWeight: '500'
            }}>
              Үнийн хязгаар
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={searchCriteria.minPrice}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, minPrice: e.target.value }))}
                placeholder="Доод"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
              <span style={{ color: '#9ca3af' }}>-</span>
              <input
                type="number"
                value={searchCriteria.maxPrice}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxPrice: e.target.value }))}
                placeholder="Дээд"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <label style={{ 
              fontSize: '13px', 
              color: '#374151', 
              marginBottom: '6px',
              display: 'block',
              fontWeight: '500'
            }}>
              Нөөцийн төлөв
            </label>
            <select
              value={searchCriteria.stockStatus}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, stockStatus: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">Бүгд</option>
              <option value="inStock">Нөөцөд байгаа</option>
              <option value="lowStock">Нөөц бага</option>
              <option value="outOfStock">Дууссан</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label style={{ 
              fontSize: '13px', 
              color: '#374151', 
              marginBottom: '6px',
              display: 'block',
              fontWeight: '500'
            }}>
              Шошго
            </label>
            <input
              type="text"
              value={searchCriteria.tags}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Шошго нэмэх (таслалаар тусгаарлах)..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
          >
            Цэвэрлэх
          </button>
          <button
            onClick={handleSearch}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3730a3',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#312e81'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3730a3'}
          >
            Хайх
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
