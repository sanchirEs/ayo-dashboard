"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search, status });
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    updateFilters({ search, status: newStatus });
  };

  const updateFilters = (filters) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    params.set('page', '1'); // Reset to first page when filtering

    const queryString = params.toString();
    router.push(`/order-list${queryString ? '?' + queryString : ''}`);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    router.push('/order-list');
  };

  return (
    <div className="flex items-center justify-between gap10 flex-wrap mb-4">
      <div className="wg-filter flex-grow">
        <form className="form-search" onSubmit={handleSearch}>
          <fieldset className="name">
            <input 
              type="text" 
              placeholder="Search orders by customer name, order ID..." 
              name="search" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              tabIndex={2} 
            />
          </fieldset>
          <div className="button-submit">
            <button type="submit">
              <i className="icon-search" />
            </button>
          </div>
        </form>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap10">
        <select 
          className="form-select"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {(search || status) && (
          <button 
            onClick={clearFilters}
            className="tf-button style-3"
            title="Clear Filters"
          >
            Clear
          </button>
        )}

        <button 
          onClick={() => window.location.reload()}
          className="tf-button style-1 w208"
          title="Refresh Orders"
        >
          <i className="icon-refresh-cw" />
          Refresh
        </button>
      </div>
    </div>
  );
}
