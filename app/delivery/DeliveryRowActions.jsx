"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DeliveryQuickView from "./DeliveryQuickView";
import { bulkDeliverOrdersClient } from "@/lib/api/shipping";

export default function DeliveryRowActions({ delivery }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const papaStatus = delivery.papaShipment?.papaStatus ?? null;
  const canSend = !delivery.papaShipment || papaStatus === "CANCELLED";
  const isResend = papaStatus === "CANCELLED";

  const customerName = delivery.user
    ? `${delivery.user.firstName} ${delivery.user.lastName}`
    : "N/A";
  const phone = delivery.user?.telephone || delivery.shipping?.mobile || "—";
  const district = delivery.shipping?.district || "—";
  const itemCount = delivery.orderItems?.length ?? 0;

  const handleSend = async () => {
    const token = session?.user?.accessToken;
    if (!token || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await bulkDeliverOrdersClient([delivery.id], token);
      if (res.success && (res.summary?.succeeded ?? 0) > 0) {
        setShowConfirm(false);
        setSuccess(true);
        router.refresh();
      } else {
        const failed = res.data?.failed?.[0];
        setError(failed?.error || res.message || "Алдаа гарлаа");
      }
    } catch (e) {
      setError(e.message || "Алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  const closeConfirm = () => {
    if (!sending) { setShowConfirm(false); setError(null); }
  };

  return (
    <>
      <div className="list-icon-function" style={{ gap: "6px" }}>
        {/* Eye */}
        <button
          className="item eye"
          onClick={() => setOpen(true)}
          title="Дэлгэрэнгүй"
        >
          <i className="icon-eye" />
        </button>

        {/* Success badge */}
        {success && (
          <span
            style={{
              fontSize: "13px", fontWeight: "600",
              color: "#16a34a", padding: "4px 8px",
              backgroundColor: "#dcfce7", borderRadius: "5px",
              whiteSpace: "nowrap",
            }}
          >
            ✓ Илгээгдлээ
          </span>
        )}

        {/* Send / Re-send button */}
        {canSend && !success && (
          <button
            onClick={() => { setError(null); setShowConfirm(true); }}
            style={{
              padding: "5px 10px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
              backgroundColor: error ? "#fee2e2" : isResend ? "#fef3c7" : "#dcfce7",
              color: error ? "#dc2626" : isResend ? "#92400e" : "#15803d",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.94)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            {error ? "⚠ Дахин" : isResend ? "🔄 Дахин" : "🚚 Илгээх"}
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div
            onClick={closeConfirm}
            style={{
              position: "absolute", inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              cursor: sending ? "default" : "pointer",
            }}
          />
          {/* Modal */}
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              backgroundColor: "white", borderRadius: "12px",
              padding: "28px", width: "420px", maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "17px", fontWeight: "700", color: "#111827" }}>
                🚚 Papa руу илгээх
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                {isResend ? "Дахин илгээлт хийх" : "Шинэ захиалга илгээх"}
              </div>
            </div>

            {/* Order summary card */}
            <div
              style={{
                backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: "8px", padding: "16px", marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827", marginBottom: "10px" }}>
                Захиалга #{delivery.id}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: "13px" }}>
                <span style={{ color: "#9ca3af" }}>Хүлээн авагч</span>
                <span style={{ color: "#374151", fontWeight: "500" }}>{customerName}</span>
                <span style={{ color: "#9ca3af" }}>Утас</span>
                <span style={{ color: "#374151", fontWeight: "500" }}>{phone}</span>
                <span style={{ color: "#9ca3af" }}>Дүүрэг</span>
                <span style={{ color: "#374151", fontWeight: "500" }}>{district}</span>
                <span style={{ color: "#9ca3af" }}>Барааны тоо</span>
                <span style={{ color: "#374151", fontWeight: "500" }}>{itemCount} ширхэг</span>
              </div>
            </div>

            {/* Cost note */}
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: "8px",
                padding: "10px 14px", backgroundColor: "#fffbeb",
                border: "1px solid #fde68a", borderRadius: "8px", marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "14px" }}>⚠️</span>
              <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: "1.5" }}>
                Papa driver дуудахад <strong>₮6,000</strong> суутгагдана. Баталгаажуулсны дараа цуцлах боломжгүй.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  backgroundColor: "#fee2e2", border: "1px solid #fca5a5",
                  borderRadius: "6px", padding: "10px 14px", marginBottom: "16px",
                  fontSize: "13px", color: "#dc2626",
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={closeConfirm}
                disabled={sending}
                style={{
                  padding: "9px 20px", borderRadius: "7px",
                  border: "1px solid #e5e7eb", backgroundColor: "white",
                  fontSize: "13px", fontWeight: "500",
                  cursor: sending ? "not-allowed" : "pointer", color: "#374151",
                }}
                onMouseEnter={(e) => { if (!sending) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
              >
                Болих
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  padding: "9px 22px", borderRadius: "7px", border: "none",
                  backgroundColor: sending ? "#86efac" : "#10b981",
                  color: "white", fontSize: "13px", fontWeight: "600",
                  cursor: sending ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
                onMouseEnter={(e) => { if (!sending) e.currentTarget.style.backgroundColor = "#059669"; }}
                onMouseLeave={(e) => { if (!sending) e.currentTarget.style.backgroundColor = "#10b981"; }}
              >
                {sending ? (
                  <>
                    <span style={{
                      display: "inline-block", width: "12px", height: "12px",
                      border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white",
                      borderRadius: "50%", animation: "spin 0.6s linear infinite",
                    }} />
                    Илгээж байна...
                  </>
                ) : "✓ Тийм, илгээх"}
              </button>
            </div>
          </div>
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <DeliveryQuickView open={open} onOpenChange={setOpen} delivery={delivery} />
    </>
  );
}
