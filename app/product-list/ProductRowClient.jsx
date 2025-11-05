"use client";

import Link from "next/link";
import { useState } from "react";
import ProductImage from "./ProductImage";
import QuickViewAction from "./QuickViewActionClient";
import DeleteProductButton from "./DeleteProductButton.jsx";

export default function ProductRowClient({ product, gridTemplate }) {
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  // Helper function to render limited tags with overflow indicator
  const renderLimitedTags = (tags, maxVisible = 3) => {
    if (!tags || tags.length === 0) return '-';
    
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenCount = tags.length - maxVisible;
    
    const getTagDisplay = (tag) => {
      if (typeof tag === 'string') return tag;
      if (tag.group && tag.value) return `${tag.group}: ${tag.value}`;
      if (tag.value) return tag.value;
      return tag.toString();
    };
    
    return (
      <div className="flex flex-wrap gap-1">
        {visibleTags.map((tag, index) => (
          <span key={index} className="tag-pill" style={{
            backgroundColor: '#e0e7ff',
            color: '#3730a3',
            padding: '2px 6px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            {getTagDisplay(tag)}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="tag-overflow" style={{
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            padding: '2px 6px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            +{hiddenCount}
          </span>
        )}
      </div>
    );
  };

  // Helper function to render limited categories with overflow indicator (inline)
  const renderLimitedCategories = (categories, maxVisible = 4) => {
    if (!categories || categories.length === 0) return 'N/A';
    
    const visibleCategories = categories.slice(0, maxVisible);
    const hiddenCount = categories.length - maxVisible;
    
    return (
      <div className="flex flex-wrap gap-1 items-center" style={{ lineHeight: '1.2' }}>
        {visibleCategories.map((category, index) => (
          <span key={category.id} className="category-badge" style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            whiteSpace: 'nowrap'
          }}>
            {category.name}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="category-badge" style={{
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '10px'
          }}>
            +{hiddenCount}
          </span>
        )}
      </div>
    );
  };

  return (
     <li
       className="product-item"
       style={{ 
         display: 'grid', 
         gridTemplateColumns: gridTemplate, 
         alignItems: 'center', 
         columnGap: 12, 
         minHeight: 72,
         padding: '0.75rem 1.25rem',
         transition: 'background-color 0.2s ease',
         borderBottom: '1px solid #f3f4f6'
       }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="flex items-center" style={{ gap: 16, minWidth: 0 }}>
        <ProductImage product={product} size={56} />
        <div className="name" style={{ minWidth: 0, flex: 1 }}>
          <Link href={`/edit-product/${product.id}`} className="body-title-2" style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4',
            maxHeight: '2.8em'
          }}>
            {product.name}
          </Link>
        </div>
      </div>
       <div className="body-text" style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>#{product.sku}</div>
       <div className="body-text" style={{ fontWeight: '600', textAlign: 'right', fontSize: '14px' }}>{product.price.toLocaleString()}₮</div>
       <div className="body-text" style={{ fontWeight: '500', textAlign: 'center' }}>
         {product.variants && product.variants.length > 0 
           ? product.variants.reduce((total, variant) => total + (variant.inventory?.quantity || 0), 0)
           : (product.stock || 0)
         }ш
       </div>
       <div className="body-text" style={{ overflow: 'hidden' }}>
         {product.hierarchicalTags && product.hierarchicalTags.length > 0 
           ? renderLimitedTags(product.hierarchicalTags, 2)
           : renderLimitedTags(product.tags || [], 2)
         }
       </div>
      <div className="body-text" style={{ fontSize: '13px', color: '#6b7280' }}>
        {product.brand ? (
          <span>{product.brand.name}</span>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        )}
      </div>
      
      {/* Delivery Information Column */}
      <div className="body-text" style={{ fontSize: '12px', color: '#6b7280' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Delivery Type Badge */}
          <div>
            {product.delivery?.isImported || product.isImportedProduct ? (
              <span style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '500'
              }}>
                Захиалгын
              </span>
            ) : (
              <span style={{
                backgroundColor: '#d1fae5',
                color: '#166534',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '500'
              }}>
                Энгийн
              </span>
            )}
          </div>
          
          {/* Delivery Days */}
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            {product.delivery?.estimatedDays || product.estimatedDeliveryDays || 7} days
          </div>
        </div>
      </div>
      
       <div className="body-text" style={{ fontSize: '13px', color: '#6b7280' }}>
         {product.allCategories && product.allCategories.length > 0 
           ? renderLimitedCategories(product.allCategories, 4)
           : product.category 
             ? renderLimitedCategories([product.category], 4)
             : 'N/A'
         }
       </div>
      <div className="list-icon-function" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <QuickViewAction product={product} />
        <Link href={`/edit-product/${product.id}`} className="item edit">
          <i className="icon-edit-3" />
        </Link>
        <DeleteProductButton productId={product.id} onDeleted={() => setRemoved(true)} />
      </div>
    </li>
  );
}
