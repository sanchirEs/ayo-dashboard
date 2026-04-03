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
import { updateOrderStatusClient, cancelOrderClient } from "@/lib/api/orders-client";
import { resolveImageUrl } from "@/lib/api/env";
import { useRouter } from "next/navigation";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:    { label: "Хүлээгдэж байна", dot: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  PROCESSING: { label: "Баталгаажсан",     dot: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
  SHIPPED:    { label: "Илгээгдсэн",       dot: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  DELIVERED:  { label: "Хүргэгдсэн",       dot: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  CANCELLED:  { label: "Цуцлагдсан",       dot: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
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
      height: 0, margin: "0 -24px",
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
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState(null);
  const router = useRouter();

  // Fetch when modal opens OR when token becomes available
  useEffect(() => {
    if (open && orderId && token) {
      fetchOrder();
    }
    if (!open) {
      setOrder(null);
      setError(null);
      setActionError(null);
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

  async function handleStatusUpdate(newStatus) {
    if (!token || updating) return;
    setUpdating(true);
    setActionError(null);
    try {
      const result = await updateOrderStatusClient(orderId, newStatus, token);
      if (result.success) {
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
        router.refresh();
      } else {
        setActionError(result.message || "Статус шинэчлэхэд алдаа гарлаа");
      }
    } catch (e) {
      setActionError(e.message || "Алдаа гарлаа");
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel() {
    if (!token || updating) return;
    if (!window.confirm("Захиалгыг цуцлах уу?")) return;
    setUpdating(true);
    setActionError(null);
    try {
      const result = await cancelOrderClient(orderId, token);
      if (result.success) {
        setOrder(prev => prev ? { ...prev, status: "CANCELLED" } : null);
        router.refresh();
      } else {
        setActionError(result.message || "Цуцлахад алдаа гарлаа");
      }
    } catch (e) {
      setActionError(e.message || "Алдаа гарлаа");
    } finally {
      setUpdating(false);
    }
  }

  if (!open) return null;

  // ── Computed values ──────────────────────────────────────────────────────────
  const customerName = order?.user
    ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
    : null;
  const address = order?.user?.addresses?.[0] || order?.shipping || null;
  const subtotal = order
    ? order.orderItems?.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0) ?? parseFloat(order.total) - parseFloat(order.shippingCost || 0)
    : 0;
  const shipping = parseFloat(order?.shippingCost || 0);
  const total = parseFloat(order?.total || 0);
  const canAct = order && order.status !== "CANCELLED" && order.status !== "DELIVERED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden"
        style={{
          maxWidth: 620,
          width: "95vw",
          maxHeight: "92vh",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          border: "none",
        }}
      >
        <DialogTitle className="sr-only">Order #{orderId}</DialogTitle>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#fff" }}>

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
                  <MetaItem label="Хэрэглэгч" value={customerName || order.user?.email} />
                  <MetaItem label="Утас" value={order.user?.telephone} />
                  <MetaItem
                    label="Төлбөр"
                    value={
                      order.payment ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, color: "#111827" }}>{order.payment.provider}</span>
                          <PaymentBadge status={order.payment.status} />
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
                          {item.variant && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                              SKU: {item.variant.sku}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                            {item.quantity} ширхэг × {formatPrice(item.price)}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", flexShrink: 0 }}>
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
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {shipping > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                      <span>Хүргэлтийн төлбөр</span>
                      <span>{formatPrice(shipping)}</span>
                    </div>
                  )}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 16, fontWeight: 700, color: "#111827",
                    paddingTop: 10, marginTop: 4,
                    borderTop: "1.5px solid #111827",
                  }}>
                    <span>Нийт дүн</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* ── Address ───────────────────────────────────────────────── */}
              {address && (
                <>
                  <Divider />
                  <div style={{ padding: "16px 24px" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                      Хүргэлтийн хаяг
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                      {address.addressLine1 && <div>{address.addressLine1}</div>}
                      {address.addressLine2 && <div>{address.addressLine2}</div>}
                      {address.city && <div>{address.city}</div>}
                      {address.country && <div>{address.country}</div>}
                      {address.mobile && (
                        <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 12 }}>📞 {address.mobile}</div>
                      )}
                    </div>
                  </div>
                </>
              )}

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

        {/* ── Footer / Actions ─────────────────────────────────────────────── */}
        {order && (
          <div style={{
            padding: "14px 24px",
            borderTop: "1px solid #f3f4f6",
            backgroundColor: "#fafafa",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}>
            {/* Error message */}
            <div style={{ flex: 1 }}>
              {actionError && (
                <div style={{ fontSize: 12, color: "#dc2626" }}>{actionError}</div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => onOpenChange(false)}
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: "1px solid #e5e7eb", backgroundColor: "#fff", color: "#374151",
                  cursor: "pointer",
                }}
              >
                Хаах
              </button>

              {canAct && (
                <>
                  {(order.status === "PENDING" || order.status === "PROCESSING") && (
                    <button
                      onClick={handleCancel}
                      disabled={updating}
                      style={{
                        padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                        border: "1px solid #fee2e2", backgroundColor: "#fff", color: "#dc2626",
                        cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.6 : 1,
                      }}
                    >
                      Цуцлах
                    </button>
                  )}
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => handleStatusUpdate("PROCESSING")}
                      disabled={updating}
                      style={{
                        padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: "none", backgroundColor: "#3b82f6", color: "#fff",
                        cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.6 : 1,
                      }}
                    >
                      {updating ? "..." : "Баталгаажуулах"}
                    </button>
                  )}
                  {order.status === "PROCESSING" && (
                    <button
                      onClick={() => handleStatusUpdate("SHIPPED")}
                      disabled={updating}
                      style={{
                        padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: "none", backgroundColor: "#8b5cf6", color: "#fff",
                        cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.6 : 1,
                      }}
                    >
                      {updating ? "..." : "Илгээх"}
                    </button>
                  )}
                  {order.status === "SHIPPED" && (
                    <button
                      onClick={() => handleStatusUpdate("DELIVERED")}
                      disabled={updating}
                      style={{
                        padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: "none", backgroundColor: "#10b981", color: "#fff",
                        cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.6 : 1,
                      }}
                    >
                      {updating ? "..." : "Хүргэсэн"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
