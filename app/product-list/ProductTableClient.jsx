"use client";

import { useState, useEffect, useMemo } from "react";
import ProductRowClient from "./ProductRowClient";
import ProductFilters from "./ProductFilters";
import ProductSkeleton from "./ProductSkeleton";

export default function ProductTableClient({ products: initialProducts, gridTemplate, initialPagination }) {
  const [products, setProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    stockStatus: '',
    minPrice: '',
    maxPrice: '',
    deliveryType: ''
  });

  // Extract unique brands and categories for filter dropdowns
  const uniqueBrands = useMemo(() => {
    const brands = [...new Set(initialProducts
      .filter(p => p.brand)
      .map(p => p.brand.name))];
    return brands.sort();
  }, [initialProducts]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    initialProducts.forEach(product => {
      if (product.allCategories?.length > 0) {
        product.allCategories.forEach(cat => categories.add(cat.name));
      } else if (product.category) {
        categories.add(product.category.name);
      }
    });
    return [...categories].sort();
  }, [initialProducts]);

  // Sort function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...initialProducts];

    // Apply filters
    if (filters.brand) {
      filtered = filtered.filter(p => p.brand?.name === filters.brand);
    }

    if (filters.category) {
      filtered = filtered.filter(p => {
        if (p.allCategories?.length > 0) {
          return p.allCategories.some(cat => cat.name === filters.category);
        }
        return p.category?.name === filters.category;
      });
    }

    if (filters.stockStatus) {
      const getStock = (p) => {
        if (p.variants?.length > 0) {
          return p.variants.reduce((total, variant) => total + (variant.inventory?.quantity || 0), 0);
        }
        return p.stock || 0;
      };

      filtered = filtered.filter(p => {
        const stock = getStock(p);
        switch (filters.stockStatus) {
          case 'inStock':
            return stock > 10;
          case 'lowStock':
            return stock > 0 && stock <= 10;
          case 'outOfStock':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(p => {
        const price = p.price || 0;
        const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    if (filters.deliveryType) {
      filtered = filtered.filter(p => {
        const isImported = p.delivery?.isImported || p.isImportedProduct;
        const deliveryDays = p.delivery?.estimatedDays || p.estimatedDeliveryDays || 7;
        
        switch (filters.deliveryType) {
          case 'fast':
            return deliveryDays <= 3;
          case 'standard':
            return !isImported && deliveryDays > 3 && deliveryDays <= 14;
          case 'imported':
            return isImported;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'stock':
            aValue = a.variants?.length > 0 
              ? a.variants.reduce((total, variant) => total + (variant.inventory?.quantity || 0), 0)
              : (a.stock || 0);
            bValue = b.variants?.length > 0
              ? b.variants.reduce((total, variant) => total + (variant.inventory?.quantity || 0), 0)
              : (b.stock || 0);
            break;
          case 'sku':
            aValue = a.sku;
            bValue = b.sku;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [initialProducts, sortConfig, filters]);

  // Calculate pagination
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sort indicator component
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span style={{ opacity: 0.3, marginLeft: '4px' }}>⇅</span>;
    }
    return (
      <span style={{ marginLeft: '4px' }}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (isLoading) {
    return <ProductSkeleton gridTemplate={gridTemplate} />;
  }

  return (
    <>
      <ProductFilters 
        filters={filters}
        setFilters={setFilters}
        uniqueBrands={uniqueBrands}
        uniqueCategories={uniqueCategories}
      />
      
      <div className="wg-table table-product-list">
        <ul className="table-title mb-14" style={{ 
          display: 'grid', 
          gridTemplateColumns: gridTemplate, 
          alignItems: 'center', 
          columnGap: 12,
          padding: '0.75rem 1.25rem',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 10,
          borderBottom: '1px solid #e5e7eb'
        }}>
          <li>
            <div 
              className="body-title" 
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('name')}
            >
              Product <SortIndicator column="name" />
            </div>
          </li>
          <li>
            <div 
              className="body-title"
              style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
              onClick={() => handleSort('sku')}
            >
              SKU <SortIndicator column="sku" />
            </div>
          </li>
          <li>
            <div 
              className="body-title"
              style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
              onClick={() => handleSort('price')}
            >
              Price <SortIndicator column="price" />
            </div>
          </li>
          <li>
            <div 
              className="body-title"
              style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
              onClick={() => handleSort('stock')}
            >
              Stock <SortIndicator column="stock" />
            </div>
          </li>
          <li><div className="body-title">Tags</div></li>
          <li><div className="body-title">Brand</div></li>
          <li><div className="body-title">Delivery</div></li>
          <li><div className="body-title">Category</div></li>
          <li><div className="body-title">Action</div></li>
        </ul>
        <ul className="flex flex-column">
          {paginatedProducts.map((product) => (
            <ProductRowClient key={product.id} product={product} gridTemplate={gridTemplate} />
          ))}
        </ul>
      </div>
      
      {filteredAndSortedProducts.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Бүтээгдэхүүн олдсонгүй
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '2rem',
          padding: '1rem 0',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {totalItems}-ээс {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} харуулж байна
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              ← Өмнөх
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === currentPage;
              
              // Show first page, last page, current page, and pages around current
              const showPage = page === 1 || 
                              page === totalPages || 
                              (page >= currentPage - 1 && page <= currentPage + 1);
              
              if (!showPage) {
                // Show ellipsis
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} style={{ padding: '8px 4px', color: '#9ca3af' }}>
                      ...
                    </span>
                  );
                }
                return null;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: isCurrentPage ? '#3730a3' : 'white',
                    color: isCurrentPage ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isCurrentPage ? '600' : '400'
                  }}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Дараах →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
