"use client";

import { resolveImageUrl } from "@/lib/api/env";

export default function DeliveryItemRow({
  item,
  isSelected,
  onSelect,
  onCallDriver,
}) {
  const imageUrl = item?.product?.ProductImages?.[0]?.imageUrl;
  const productName = item?.product?.name || "Бараа";
  const sku = item?.product?.sku;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "9px 16px 9px 56px",
        backgroundColor: isSelected ? "#f0fdf4" : "#fafafa",
        borderBottom: "1px solid #f3f4f6",
        transition: "background-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#f0fdf4";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#fafafa";
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: "pointer", width: "15px", height: "15px", flexShrink: 0 }}
      />

      {/* Thumbnail */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "5px",
          overflow: "hidden",
          flexShrink: 0,
          border: "1px solid #e5e7eb",
        }}
      >
        <img
          src={imageUrl ? resolveImageUrl(imageUrl) : "/images/products/1.png"}
          alt={productName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.target.src = "/images/products/1.png";
          }}
        />
      </div>

      {/* Product info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {productName}
        </div>
        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
          {sku ? `${sku} · ` : ""}Тоо: {item?.quantity}
        </div>
      </div>

      {/* Call Driver button */}
      <button
        onClick={() => onCallDriver(item)}
        style={{
          padding: "5px 12px",
          fontSize: "12px",
          fontWeight: "600",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
          backgroundColor: "#dcfce7",
          color: "#15803d",
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = "brightness(0.94)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "none";
        }}
      >
        🚚 Илгээх
      </button>
    </div>
  );
}
