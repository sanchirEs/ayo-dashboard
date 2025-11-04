"use client";

import Link from "next/link";
import { getStatusBadgeClass, formatOrderDate, formatPrice } from "@/lib/api/orders";
import OrderRowActions from "./OrderRowActions";
import OrderImage from "./OrderImage";

export default function OrderRowClient({ order, isSelected, onSelect }) {
  // Get the first product image for display
  const firstItem = order.orderItems?.[0];
  const productImage = firstItem?.product?.ProductImages?.[0]?.imageUrl;
  const productName = firstItem?.product?.name || 'Multiple Products';
  const customerName = order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A';
  
  return (
    <li 
      className="product-item gap14"
      style={{ 
        transition: 'background-color 0.2s ease',
        borderBottom: '1px solid #f3f4f6',
        backgroundColor: isSelected ? '#eff6ff' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Checkbox Column */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
        />
      </div>

      <OrderImage 
        imageUrl={productImage}
        productName={productName}
      />
      <div className="flex items-center justify-between gap20 flex-grow">
        <div className="name">
          <Link href={`/order-detail/${order.id}`} className="body-title-2">
            {order.orderItems.length > 1 
              ? `${productName} + ${order.orderItems.length - 1} more`
              : productName
            }
          </Link>
        </div>
        <div className="body-text">#{order.id}</div>
        <div className="body-text">{customerName}</div>
        <div className="body-text">{formatPrice(order.total)}</div>
        <div className="body-text">{order.orderItems.length}</div>
        <div className="body-text">
          {order.payment ? order.payment.provider : 'N/A'}
        </div>
        <div>
          <div className={getStatusBadgeClass(order.status)}>
            {order.status}
          </div>
        </div>
        <div className="body-text text-sm">
          {formatOrderDate(order.createdAt)}
        </div>
        <OrderRowActions order={order} />
      </div>
    </li>
  );
}
