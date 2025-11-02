"use client";

export default function ProductSkeleton({ gridTemplate, rows = 5 }) {
  return (
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
        <li><div className="body-title">Product</div></li>
        <li><div className="body-title">SKU</div></li>
        <li><div className="body-title">Price</div></li>
        <li><div className="body-title">Stock</div></li>
        <li><div className="body-title">Tags</div></li>
        <li><div className="body-title">Brand</div></li>
        <li><div className="body-title">Category</div></li>
        <li><div className="body-title">Action</div></li>
      </ul>
      <ul className="flex flex-column">
        {[...Array(rows)].map((_, index) => (
          <li
            key={index}
            className="product-item"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: gridTemplate, 
              alignItems: 'center', 
              columnGap: 12, 
              minHeight: 72,
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid #f3f4f6'
            }}
          >
            {/* Product Image & Name */}
            <div className="flex items-center" style={{ gap: 16 }}>
              <div className="skeleton-box" style={{ width: 56, height: 56, borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-box" style={{ width: '80%', height: 16, marginBottom: 4 }} />
                <div className="skeleton-box" style={{ width: '60%', height: 14 }} />
              </div>
            </div>
            
            {/* SKU */}
            <div className="skeleton-box" style={{ width: 60, height: 14 }} />
            
            {/* Price */}
            <div className="skeleton-box" style={{ width: 70, height: 14 }} />
            
            {/* Stock */}
            <div className="skeleton-box" style={{ width: 40, height: 14 }} />
            
            {/* Tags */}
            <div style={{ display: 'flex', gap: 4 }}>
              <div className="skeleton-box" style={{ width: 50, height: 20, borderRadius: 12 }} />
              <div className="skeleton-box" style={{ width: 50, height: 20, borderRadius: 12 }} />
            </div>
            
            {/* Brand */}
            <div className="skeleton-box" style={{ width: 80, height: 14 }} />
            
            {/* Category */}
            <div style={{ display: 'flex', gap: 4 }}>
              <div className="skeleton-box" style={{ width: 60, height: 20, borderRadius: 12 }} />
              <div className="skeleton-box" style={{ width: 60, height: 20, borderRadius: 12 }} />
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: 4 }}>
              <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
              <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
              <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
            </div>
          </li>
        ))}
      </ul>
      
      <style jsx>{`
        .skeleton-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
