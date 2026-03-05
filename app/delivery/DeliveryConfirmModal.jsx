"use client";

import { resolveImageUrl } from "@/lib/api/env";

export default function DeliveryConfirmModal({
  open,
  onClose,
  order,
  item,
  onConfirm,
  sending,
  error,
}) {
  if (!open || !item) return null;

  const imageUrl = item?.product?.ProductImages?.[0]?.imageUrl;
  const customerName = order?.user
    ? `${order.user.firstName} ${order.user.lastName}`
    : "N/A";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        onClick={!sending ? onClose : undefined}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          cursor: sending ? "default" : "pointer",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "28px",
          width: "440px",
          maxWidth: "90vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#111827" }}>
            🚚 Papa руу илгээх
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            Захиалга #{order?.id} · {customerName}
          </div>
        </div>

        {/* Item card */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "10px",
            }}
          >
            Илгээх бараа
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "8px",
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid #e5e7eb",
              }}
            >
              <img
                src={
                  imageUrl
                    ? resolveImageUrl(imageUrl)
                    : "/images/products/1.png"
                }
                alt={item?.product?.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = "/images/products/1.png";
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {item?.product?.name || "Бараа"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "3px",
                }}
              >
                Тоо хэмжээ: {item?.quantity}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#374151",
                }}
              >
                ₮6,000
              </div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>хүргэлт</div>
            </div>
          </div>
        </div>

        {/* Reminder note */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "10px 14px",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "14px" }}>⚠️</span>
          <p
            style={{
              fontSize: "12px",
              color: "#92400e",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            Papa driver дуудахад ₮6,000 төлбөр суутгагдана. Баталгаажуулсны
            дараа цуцлах боломжгүй.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#dc2626",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Actions */}
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            disabled={sending}
            style={{
              padding: "9px 20px",
              borderRadius: "7px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
              fontSize: "13px",
              fontWeight: "500",
              cursor: sending ? "not-allowed" : "pointer",
              color: "#374151",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!sending)
                e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            Болих
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            style={{
              padding: "9px 22px",
              borderRadius: "7px",
              border: "none",
              backgroundColor: sending ? "#86efac" : "#10b981",
              color: "white",
              fontSize: "13px",
              fontWeight: "600",
              cursor: sending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!sending)
                e.currentTarget.style.backgroundColor = "#059669";
            }}
            onMouseLeave={(e) => {
              if (!sending)
                e.currentTarget.style.backgroundColor = "#10b981";
            }}
          >
            {sending ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
                Илгээж байна...
              </>
            ) : (
              "✓ Тийм, илгээх"
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
