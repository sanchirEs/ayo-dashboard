"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getOrderDetailsClient,
  formatOrderDate,
  formatPrice,
  translateStatus,
} from "@/lib/api/orders";
import { resolveImageUrl } from "@/lib/api/env";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:    { label: "Хүлээгдэж байна", dot: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  PROCESSING: { label: "Баталгаажсан",     dot: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
  SHIPPED:    { label: "Илгээгдсэн",       dot: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  DELIVERED:  { label: "Хүргэгдсэн",       dot: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  CANCELLED:  { label: "Цуцлагдсан",       dot: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  RETURNED:   { label: "Буцаагдсан",       dot: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  PICKED_UP:  { label: "Ирж авсан",        dot: "#06b6d4", bg: "#ecfeff", text: "#0e7490" },
};

const PAYMENT_STATUS_CONFIG = {
  COMPLETED: { label: "Төлөгдсөн", color: "#10b981", bg: "#ecfdf5" },
  PENDING:   { label: "Хүлээгдэж байна", color: "#f59e0b", bg: "#fffbeb" },
  FAILED:    { label: "Амжилтгүй", color: "#ef4444", bg: "#fef2f2" },
  EXPIRED:   { label: "Хугацаа дууссан", color: "#6b7280", bg: "#f9fafb" },
  CANCELLED: { label: "Цуцлагдсан", color: "#ef4444", bg: "#fef2f2" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, dot: "#6b7280", bg: "#f9fafb", text: "#374151" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 20,
      backgroundColor: cfg.bg, color: cfg.text,
      fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f9fafb" };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 10,
      backgroundColor: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
}

function MetaItem({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#9ca3af", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

function Divider({ dashed }) {
  return (
    <div style={{
      height: 0, margin: "0",
      borderTop: dashed ? "1.5px dashed #e5e7eb" : "1px solid #f3f4f6",
    }} />
  );
}

function LoadingSkeleton() {
  const bar = (w, h = 12, mt = 0) => (
    <div style={{
      width: w, height: h, borderRadius: 6, marginTop: mt,
      background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>{bar(100, 20)}{bar(140, 13, 8)}</div>
          {bar(80, 26, 0)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[1,2,3].map(i => <div key={i}>{bar("60%", 10)}{bar("80%", 14, 6)}</div>)}
        </div>
        <Divider dashed />
        {[1,2].map(i => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: "#f3f4f6", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{bar("70%", 13)}{bar("50%", 11, 6)}</div>
            {bar(60, 13)}
          </div>
        ))}
        <Divider dashed />
        {[1,2,3].map(i => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            {bar(80, 12)}{bar(60, 12)}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OrderQuickView({ open, onOpenChange, orderId }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch when modal opens OR when token becomes available
  useEffect(() => {
    if (open && orderId && token) {
      fetchOrder();
    }
    if (!open) {
      setOrder(null);
      setError(null);
    }
  }, [open, orderId, token]);

  async function fetchOrder() {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderDetailsClient(orderId, token);
      if (result.success && result.data) {
        setOrder(result.data.order || result.data);
      } else {
        setError(result.message || "Захиалга олдсонгүй");
      }
    } catch (e) {
      setError(e.message || "Захиалга ачааллахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  // ── Computed values ──────────────────────────────────────────────────────────
  const customerName = order?.user
    ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
    : null;
  // Prefer the order's own shipping snapshot (captured at checkout) over the
  // customer's saved address — user.addresses[0] can be edited or deleted after
  // the order, which would make old orders show the wrong address. Normalize the
  // two shapes (snapshot uses district/recipientPhone; saved address uses
  // country/mobile) into one so the render below stays simple.
  const shippingSnap = order?.shipping;
  const savedAddr = order?.user?.addresses?.[0];
  const rawAddr =
    shippingSnap && (shippingSnap.addressLine1 || shippingSnap.district)
      ? shippingSnap
      : savedAddr || shippingSnap || null;
  const address = rawAddr && {
    addressLine1: rawAddr.addressLine1,
    addressLine2: rawAddr.addressLine2,
    // snapshot stores the district in `district`; saved address stores it in `country`
    district: rawAddr.district || rawAddr.country || null,
    // only the saved address carries a separate city (e.g. "Улаанбаатар")
    city: rawAddr.city || null,
    mobile: rawAddr.mobile || rawAddr.recipientPhone || null,
  };
  const subtotal = order
    ? order.orderItems?.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0) ?? parseFloat(order.total) - parseFloat(order.shippingCost || 0)
    : 0;
  const shipping = parseFloat(order?.shippingCost || 0);
  const total = parseFloat(order?.total || 0);

  // Who the order is for — phone-registered users have no name, so never show a bare "—"
  const customerDisplay = customerName || order?.user?.email || "Зочин";
  // Primary contact number, with fallback for guest / phone-only orders
  const contactPhone = order?.user?.telephone || address?.mobile || address?.recipientPhone || null;
  // Address often stores line1 and line2 identically — collapse the stutter
  const addrLine1 = address?.addressLine1?.trim() || "";
  const addrLine2 = address?.addressLine2?.trim() || "";
  const showAddrLine2 = addrLine2 && addrLine2.toLowerCase() !== addrLine1.toLowerCase();
  // Recipient phone on the address; hide when it's the same number already shown in the header
  const addrPhone = address?.mobile || address?.recipientPhone || null;
  const showAddrPhone = addrPhone && addrPhone !== contactPhone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0"
        hideCloseButton
        style={{
          maxWidth: 720,
          width: "95vw",
          maxHeight: "92vh",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          border: "none",
          overflow: "hidden",
        }}
      >
        <DialogTitle className="sr-only">Order #{orderId}</DialogTitle>
        <style>{`.oqv-body::-webkit-scrollbar{width:0;height:0;} .oqv-body{scrollbar-width:none;-ms-overflow-style:none;}`}</style>

        {/* ── Scrollable body (scrollbar hidden, wheel/trackpad still scrolls) ── */}
        <div className="oqv-body" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", backgroundColor: "#fff" }}>

          {loading && !order ? (
            <LoadingSkeleton />
          ) : error ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>{error}</div>
              <button
                onClick={fetchOrder}
                style={{
                  marginTop: 16, padding: "8px 20px",
                  borderRadius: 8, border: "1px solid #e5e7eb",
                  fontSize: 13, cursor: "pointer", backgroundColor: "#fff",
                  color: "#374151",
                }}
              >
                Дахин оролдох
              </button>
            </div>
          ) : order ? (
            <>
              {/* ── Header ────────────────────────────────────────────────── */}
              <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                      Захиалга
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                      #{orderId}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                      {order.createdAt ? formatOrderDate(order.createdAt) : "—"}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Meta row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  marginTop: 20,
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: 10,
                }}>
                  <MetaItem label="Хэрэглэгч" value={customerDisplay} />
                  <MetaItem label="Утас" value={contactPhone} />
                  <MetaItem
                    label="Төлбөр"
                    value={
                      order.payment ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, color: "#111827" }}>{order.payment.provider}</span>
                          {order.payment.status !== "COMPLETED" && (
                            <PaymentBadge status={order.payment.status} />
                          )}
                        </span>
                      ) : "—"
                    }
                  />
                </div>
              </div>

              {/* ── Order Items ───────────────────────────────────────────── */}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                  Бүтээгдэхүүн
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {order.orderItems?.map((item, idx) => {
                    const imgUrl = item.product?.ProductImages?.[0]?.imageUrl
                      ? resolveImageUrl(item.product.ProductImages[0].imageUrl)
                      : "/images/products/1.png";
                    const lineTotal = parseFloat(item.price) * item.quantity;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex", gap: 12, alignItems: "center",
                          padding: "10px 12px", borderRadius: 10,
                          backgroundColor: "#f9fafb",
                          border: "1px solid #f3f4f6",
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={item.product?.name || "Product"}
                          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0, backgroundColor: "#e5e7eb" }}
                          onError={e => { e.target.src = "/images/products/1.png"; }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.product?.name || "Бүтээгдэхүүн"}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                            {item.quantity} ширхэг × {formatPrice(item.price)}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                          {formatPrice(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Divider dashed />

              {/* ── Totals ────────────────────────────────────────────────── */}
              <div style={{ padding: "16px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                    <span>Нийт бүтээгдэхүүн</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatPrice(subtotal)}</span>
                  </div>
                  {shipping > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                      <span>Хүргэлтийн төлбөр</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatPrice(shipping)}</span>
                    </div>
                  )}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    paddingTop: 12, marginTop: 6,
                    borderTop: "1.5px solid #111827",
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Нийт дүн</span>
                    <span style={{ fontSize: 21, fontWeight: 800, color: "#111827", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* ── Delivery & Address ────────────────────────────────────── */}
              <Divider />
              <div style={{ padding: "16px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {order.deliveryType === "PICKUP" ? "Авах дэлгүүр" : "Хүргэлтийн хаяг"}
                  </div>
                  {order.deliveryType === "PICKUP" && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 9999,
                      fontSize: 11, fontWeight: 600,
                      backgroundColor: "#fef3c7", color: "#92400e",
                    }}>
                      Ирж авах
                    </span>
                  )}
                </div>
                {order.deliveryType === "PICKUP" ? (
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                    {order.shipping?.pickupStoreName && (
                      <div style={{ fontWeight: 600 }}>{order.shipping.pickupStoreName}</div>
                    )}
                    {order.shipping?.addressLine1 && <div>{order.shipping.addressLine1}</div>}
                    {order.shipping?.district && <div style={{ color: "#6b7280" }}>{order.shipping.district}</div>}
                    {order.shipping?.recipientPhone && (
                      <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 12 }}>📞 {order.shipping.recipientPhone}</div>
                    )}
                  </div>
                ) : address && (
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                    {addrLine1 && <div>{addrLine1}</div>}
                    {showAddrLine2 && <div>{addrLine2}</div>}
                    {address.district && <div style={{ color: "#6b7280" }}>{address.district}</div>}
                    {address.city && <div style={{ color: "#6b7280" }}>{address.city}</div>}
                    {showAddrPhone && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ color: "#9ca3af", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 10 }}>Хүлээн авагч</span>
                        <span style={{ color: "#374151", fontWeight: 500 }}>{addrPhone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Shipping tracking ─────────────────────────────────────── */}
              {order.shipping?.trackingNumber && (
                <>
                  <Divider />
                  <div style={{ padding: "14px 24px" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                      Хүргэлт
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#6b7280" }}>Tracking</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>{order.shipping.trackingNumber}</span>
                    </div>
                    {order.shipping.shippingMethod && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                        <span style={{ color: "#6b7280" }}>Арга</span>
                        <span style={{ color: "#374151", textTransform: "capitalize" }}>{order.shipping.shippingMethod}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Saga error ────────────────────────────────────────────── */}
              {order.sagas?.length > 0 && order.sagas[0].status === "FAILED" && (
                <>
                  <Divider />
                  <div style={{ padding: "12px 24px", backgroundColor: "#fef2f2" }}>
                    <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                      Алдаа
                    </div>
                    <div style={{ fontSize: 13, color: "#7f1d1d" }}>{order.sagas[0].errorMessage || "Тодорхойгүй алдаа"}</div>
                  </div>
                </>
              )}
            </>
          ) : (
            // Token not yet available
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              Ачаалж байна...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
