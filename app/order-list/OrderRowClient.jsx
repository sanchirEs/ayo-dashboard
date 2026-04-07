"use client";

import Link from "next/link";
import { getStatusBlockClass, formatOrderDate, formatPrice, translateStatus } from "@/lib/api/orders";
import OrderRowActions from "./OrderRowActions";
import OrderImage from "./OrderImage";

const PAPA_LABELS = {
  NEW: "Жолооч дуудсан",
  CONFIRM: "Жолооч дуудсан",
  CREATING_SHIPPING: "Хүргэлтэнд",
  START: "Хүргэлтэнд",
  END: "Хүргэгдсэн",
  COMPLETED: "Хүргэгдсэн",
  CANCELLED: "Цуцалсан",
};

const PAPA_COLORS = {
  NEW: { bg: "#fffbeb", color: "#92400e" },
  CONFIRM: { bg: "#eff6ff", color: "#1e40af" },
  CREATING_SHIPPING: { bg: "#fff7ed", color: "#9a3412" },
  START: { bg: "#fff7ed", color: "#9a3412" },
  END: { bg: "#ecfdf5", color: "#065f46" },
  COMPLETED: { bg: "#ecfdf5", color: "#065f46" },
  CANCELLED: { bg: "#fef2f2", color: "#991b1b" },
};

function PapaStatusMini({ status }) {
  const label = PAPA_LABELS[status] || status;
  const colors = PAPA_COLORS[status] || { bg: "#f9fafb", color: "#374151" };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '1px 7px', borderRadius: 9999,
      fontSize: '10px', fontWeight: 600,
      backgroundColor: colors.bg, color: colors.color,
    }}>
      {label}
    </span>
  );
}

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: order.deliveryType === 'PICKUP' ? '#fef3c7' : '#dbeafe',
            color: order.deliveryType === 'PICKUP' ? '#92400e' : '#1e40af',
          }}>
            {order.deliveryType === 'PICKUP' ? 'Ирж авах' : 'Хүргэлт'}
          </span>
          {order.papaShipment && (
            <PapaStatusMini status={order.papaShipment.papaStatus} />
          )}
        </div>
        <div>
          <div className={getStatusBlockClass(order.status)}>
            {translateStatus(order.status)}
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
