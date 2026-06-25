"use client";

import { useState } from "react";
import { getStatusBlockClass, formatOrderDate, formatPrice, translateStatus } from "@/lib/api/orders";
import OrderImage from "./OrderImage";
import OrderQuickView from "./OrderQuickView";

function DeliveryBadge({ order }) {
  const isPickup = order.deliveryType === "PICKUP";
  const papa = order.papaShipment?.papaStatus;

  // If no papa shipment, just show delivery type
  if (!papa) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 9999,
        fontSize: 11, fontWeight: 600,
        backgroundColor: isPickup ? "#fef3c7" : "#dbeafe",
        color: isPickup ? "#92400e" : "#1e40af",
      }}>
        {isPickup ? "Ирж авах" : "Хүргэлт"}
      </span>
    );
  }

  // Papa shipment exists — show combined badge
  const PAPA_CFG = {
    NEW:              { label: "Жолооч дуудсан",    bg: "#fffbeb", color: "#92400e", dot: "#f59e0b" },
    CONFIRM:          { label: "Жолооч дуудсан",    bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6" },
    CREATING_SHIPPING:{ label: "Хүргэлтэнд",        bg: "#fff7ed", color: "#9a3412", dot: "#f97316" },
    START:            { label: "Хүргэлтэнд",        bg: "#fff7ed", color: "#9a3412", dot: "#f97316" },
    END:              { label: "Хүргэгдсэн",        bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
    COMPLETED:        { label: "Хүргэгдсэн",        bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
    CANCELLED:        { label: "Цуцалсан",           bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
  };
  const cfg = PAPA_CFG[papa] || { label: papa, bg: "#f9fafb", color: "#374151", dot: "#6b7280" };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 9999,
      fontSize: 11, fontWeight: 600,
      backgroundColor: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

export default function OrderRowClient({ order, isSelected, onSelect }) {
  const [modalOpen, setModalOpen] = useState(false);

  const firstItem = order.orderItems?.[0];
  const productImage = firstItem?.product?.ProductImages?.[0]?.imageUrl;
  const productName = firstItem?.product?.name || "Бүтээгдэхүүн";
  const customerPhone = order.shipping?.recipientPhone || order.user?.telephone || "—";
  const district = order.shipping?.district || "—";

  return (
    <li
      className="product-item gap14"
      style={{
        transition: 'background-color 0.2s ease',
        borderBottom: '1px solid #f3f4f6',
        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
        cursor: 'pointer',
      }}
      onClick={() => setModalOpen(true)}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Checkbox Column */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
        />
      </div>

      <OrderImage
        imageUrl={productImage}
        productName={productName}
      />
      <div className="flex items-center justify-between gap20 flex-grow">
        <div className="name">
          <span className="body-title-2">
            {order.orderItems.length > 1
              ? `${productName} + ${order.orderItems.length - 1}`
              : productName
            }
          </span>
        </div>
        <div className="body-text">#{order.id}</div>
        <div className="body-text">{customerPhone}</div>
        <div className="body-text">{formatPrice(order.total)}</div>
        <div className="body-text">{order.orderItems.length}</div>
        <div className="body-text">
          {order.payment ? order.payment.provider : '—'}
        </div>
        <div className="body-text">{district}</div>
        <div>
          <DeliveryBadge order={order} />
        </div>
        <div>
          <div className={getStatusBlockClass(order.status)}>
            {translateStatus(order.status)}
          </div>
        </div>
        <div className="body-text text-sm">
          {formatOrderDate(order.createdAt)}
        </div>
      </div>

      {/* Modal */}
      <OrderQuickView open={modalOpen} onOpenChange={setModalOpen} orderId={order.id} />
    </li>
  );
}
