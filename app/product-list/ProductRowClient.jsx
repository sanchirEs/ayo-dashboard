"use client";

import Link from "next/link";
import { useState } from "react";
import ProductImage from "./ProductImage";
import QuickViewAction from "./QuickViewActionClient";
import DeleteProductButton from "./DeleteProductButton.jsx";

export default function ProductRowClient({ product, gridTemplate }) {
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return (
    <li
      className="product-item"
      style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center', columnGap: 20, minHeight: 72 }}
    >
      <div className="flex items-center" style={{ gap: 16, minWidth: 0 }}>
        <ProductImage product={product} size={56} />
        <div className="name" style={{ minWidth: 0 }}>
          <Link href={`/edit-product/${product.id}`} className="body-title-2" style={{ display: 'inline-block', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.name}
          </Link>
        </div>
      </div>
      <div className="body-text">{product.sku}</div>
      <div className="body-text">{product.price}₮</div>
      <div className="body-text">{product.stock || 0}</div>
      <div className="body-text">
        {product.allCategories && product.allCategories.length > 0 ? (
          <div className="categories-display">
            {product.allCategories.map((category, index) => (
              <span key={category.id} className="category-badge">
                {category.name}
                {index < product.allCategories.length - 1 && ', '}
              </span>
            ))}
          </div>
        ) : product.category ? (
          product.category.name
        ) : (
          'N/A'
        )}
      </div>
      <div className="body-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {(product.tags || []).join(', ') || '-'}
      </div>
      <div className="body-text">{new Date(product.createdAt).toLocaleDateString()}</div>
      <div className="list-icon-function">
        <QuickViewAction product={product} />
        <Link href={`/edit-product/${product.id}`} className="item edit">
          <i className="icon-edit-3" />
        </Link>
        <DeleteProductButton productId={product.id} onDeleted={() => setRemoved(true)} />
      </div>
    </li>
  );
}
