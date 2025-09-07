"use client";

import { useState } from "react";
import AdvancedSearchModal from "./AdvancedSearchModal";
import { useRouter } from "next/navigation";

export default function AdvancedSearchButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleAdvancedSearch = (criteria) => {
    // Build query string from criteria
    const params = new URLSearchParams();
    
    if (criteria.name) params.set('search', criteria.name);
    if (criteria.sku) params.set('sku', criteria.sku);
    if (criteria.minPrice) params.set('minPrice', criteria.minPrice);
    if (criteria.maxPrice) params.set('maxPrice', criteria.maxPrice);
    if (criteria.stockStatus) params.set('stockStatus', criteria.stockStatus);
    if (criteria.tags) params.set('tags', criteria.tags);
    
    // Navigate with new search params
    router.push(`/product-list?${params.toString()}`);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#e5e7eb';
        }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <path d="M11 8v6M8 11h6" />
        </svg>
        Нарийвчилсан
      </button>
      
      <AdvancedSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearch={handleAdvancedSearch}
      />
    </>
  );
}
