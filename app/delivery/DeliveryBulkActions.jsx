"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { bulkDeliverOrdersClient } from "@/lib/api/shipping";

export default function DeliveryBulkActions({ selectedOrders, selectedDeliveries = [], onUpdateComplete }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [result, setResult] = useState(null);

  const handleBulkDeliver = async () => {
    const token = session?.user?.accessToken;
    if (!token || isDelivering || selectedOrders.size === 0) return;

    const orderIds = Array.from(selectedOrders);
    setIsDelivering(true);
    setResult(null);

    try {
      const res = await bulkDeliverOrdersClient(orderIds, token);
      const { succeeded = 0, failed: failedCount = 0 } = res.summary || {};
      const failedList = res.data?.failed || [];

      if (succeeded === 0 && failedCount > 0) {
        // All failed — stay in modal, show Papa's error message
        const papaError = failedList.length === 1
          ? failedList[0].error
          : failedList.map(f => `#${f.orderId}: ${f.error}`).join(" · ");
        setResult({ type: "error", message: papaError || res.message || "Алдаа гарлаа" });
      } else if (succeeded > 0) {
        // At least some succeeded — close modal
        const failNote = failedCount > 0
          ? `, ${failedCount} амжилтгүй: ${failedList[0]?.error || ""}`
          : "";
        setResult({
          type: failedCount > 0 ? "warning" : "success",
          message: `✓ ${succeeded} захиалга Papa руу илгээгдлээ${failNote}`,
        });
        setShowConfirm(false);
        onUpdateComplete?.();
        router.refresh();
      } else {
        setResult({ type: "error", message: res.message || "Алдаа гарлаа" });
      }
    } catch (e) {
      setResult({ type: "error", message: e.message || "Алдаа гарлаа" });
    } finally {
      setIsDelivering(false);
    }
  };

  const closeConfirm = () => {
    if (!isDelivering) { setShowConfirm(false); }
  };

  if (selectedOrders.size === 0) return null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={() => { setResult(null); setShowConfirm(true); }}
          disabled={isDelivering}
          style={{
            padding: "6px 16px", fontSize: "13px", fontWeight: "600",
            backgroundColor: "#10b981", color: "white",
            border: "none", borderRadius: "6px",
            cursor: isDelivering ? "not-allowed" : "pointer",
            opacity: isDelivering ? 0.65 : 1,
            display: "flex", alignItems: "center", gap: "6px",
          }}
          onMouseEnter={(e) => { if (!isDelivering) e.currentTarget.style.backgroundColor = "#059669"; }}
          onMouseLeave={(e) => { if (!isDelivering) e.currentTarget.style.backgroundColor = "#10b981"; }}
        >
          🚚 Papa руу илгээх ({selectedOrders.size})
        </button>

        {result && (
          <span
            style={{
              fontSize: "13px", fontWeight: "500",
              color: result.type === "success" ? "#16a34a" : result.type === "warning" ? "#92400e" : "#dc2626",
              padding: "4px 10px", borderRadius: "5px",
              backgroundColor: result.type === "success" ? "#dcfce7" : result.type === "warning" ? "#fffbeb" : "#fee2e2",
              maxWidth: "500px",
            }}
          >
            {result.message}
          </span>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
          {/* Backdrop */}
          <div
            onClick={closeConfirm}
            style={{
              position: "absolute", inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              cursor: isDelivering ? "default" : "pointer",
            }}
          />
          {/* Modal */}
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              backgroundColor: "white", borderRadius: "12px",
              padding: "28px", width: "480px", maxWidth: "90vw",
              maxHeight: "85vh", display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "20px", flexShrink: 0 }}>
              <div style={{ fontSize: "17px", fontWeight: "700", color: "#111827" }}>
                🚚 Papa руу илгээх
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                {selectedOrders.size} захиалга Papa driver-т дуудна
              </div>
            </div>

            {/* Order list */}
            <div
              style={{
                flex: 1, overflowY: "auto", marginBottom: "16px",
                border: "1px solid #e5e7eb", borderRadius: "8px",
              }}
            >
              {selectedDeliveries.map((d, i) => {
                const name = d.user
                  ? `${d.user.firstName} ${d.user.lastName}`
                  : "N/A";
                const phone = d.user?.telephone || d.shipping?.mobile || "—";
                const district = d.shipping?.district || "—";
                return (
                  <div
                    key={d.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: "4px 14px",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: i < selectedDeliveries.length - 1 ? "1px solid #f3f4f6" : "none",
                      backgroundColor: i % 2 === 0 ? "white" : "#fafafa",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}>
                      #{d.id}
                    </span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>
                        {name}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        {phone} · {district}
                      </div>
                    </div>
                    <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {d.orderItems?.length ?? 0} бараа
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cost note */}
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: "8px",
                padding: "10px 14px", backgroundColor: "#fffbeb",
                border: "1px solid #fde68a", borderRadius: "8px",
                marginBottom: "20px", flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "14px" }}>⚠️</span>
              <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: "1.5" }}>
                Нийт <strong>{selectedOrders.size} захиалга</strong> Papa руу илгээгдэнэ.
              </p>
            </div>

            {/* Error */}
            {result?.type === "error" && (
              <div
                style={{
                  backgroundColor: "#fee2e2", border: "1px solid #fca5a5",
                  borderRadius: "6px", padding: "10px 14px", marginBottom: "16px",
                  fontSize: "13px", color: "#dc2626", flexShrink: 0,
                }}
              >
                ⚠ {result.message}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexShrink: 0 }}>
              <button
                onClick={closeConfirm}
                disabled={isDelivering}
                style={{
                  padding: "9px 20px", borderRadius: "7px",
                  border: "1px solid #e5e7eb", backgroundColor: "white",
                  fontSize: "13px", fontWeight: "500",
                  cursor: isDelivering ? "not-allowed" : "pointer", color: "#374151",
                }}
                onMouseEnter={(e) => { if (!isDelivering) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
              >
                Болих
              </button>
              <button
                onClick={handleBulkDeliver}
                disabled={isDelivering}
                style={{
                  padding: "9px 22px", borderRadius: "7px", border: "none",
                  backgroundColor: isDelivering ? "#86efac" : "#10b981",
                  color: "white", fontSize: "13px", fontWeight: "600",
                  cursor: isDelivering ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
                onMouseEnter={(e) => { if (!isDelivering) e.currentTarget.style.backgroundColor = "#059669"; }}
                onMouseLeave={(e) => { if (!isDelivering) e.currentTarget.style.backgroundColor = "#10b981"; }}
              >
                {isDelivering ? (
                  <>
                    <span style={{
                      display: "inline-block", width: "12px", height: "12px",
                      border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white",
                      borderRadius: "50%", animation: "spin 0.6s linear infinite",
                    }} />
                    Илгээж байна...
                  </>
                ) : `✓ Тийм, ${selectedOrders.size} захиалга илгээх`}
              </button>
            </div>
          </div>
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  );
}
