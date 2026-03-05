"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/api/orders";

const PAPA_STATUS_LABEL = {
  NEW: "Шинэ",
  CONFIRM: "Баталгаажсан",
  START: "Гарсан",
  END: "Ирсэн",
  COMPLETED: "Дууссан",
  CANCELLED: "Цуцалсан",
};

const PAPA_STATUS_COLOR = {
  NEW: "#6b7280",
  CONFIRM: "#2563eb",
  START: "#d97706",
  END: "#7c3aed",
  COMPLETED: "#16a34a",
  CANCELLED: "#dc2626",
};

function shortDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("mn-MN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DeliveryQuickView({ open, onOpenChange, delivery }) {
  if (!open || !delivery) return null;

  const papaShipment = delivery.papaShipment ?? delivery.papaShipments?.[0] ?? null;
  const endPincode = papaShipment?.cargoShipments?.[0]?.endPincode ?? null;
  const user = delivery.user;
  const shipping = delivery.shipping;

  const customerName = user ? `${user.firstName} ${user.lastName}` : "N/A";
  const phone = shipping?.recipientPhone || user?.telephone || "—";
  const district = shipping?.district || "—";
  const address = [shipping?.addressLine1, shipping?.addressLine2]
    .filter(Boolean).join(" ") || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto p-0">
        <DialogTitle className="sr-only">Delivery #{delivery.id}</DialogTitle>

        <div style={{ fontFamily: "sans-serif", fontSize: "13px", color: "#111827" }}>
          {/* Header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700" }}>Захиалга #{delivery.id}</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                {shortDate(delivery.createdAt)}
              </div>
            </div>
            {papaShipment && (
              <div style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                backgroundColor: PAPA_STATUS_COLOR[papaShipment.papaStatus] + "1a",
                color: PAPA_STATUS_COLOR[papaShipment.papaStatus],
                border: `1px solid ${PAPA_STATUS_COLOR[papaShipment.papaStatus]}40`,
              }}>
                {PAPA_STATUS_LABEL[papaShipment.papaStatus] ?? papaShipment.papaStatus}
              </div>
            )}
          </div>

          {/* Papa shipment info */}
          {papaShipment && (
            <div style={{
              margin: "16px 24px", padding: "12px 16px",
              backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px",
            }}>
              <div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "3px" }}>Papa код</div>
                <div style={{ fontWeight: "700", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                  {papaShipment.papaCode ?? "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "3px" }}>Pincode</div>
                <div style={{ fontWeight: "700", fontSize: "16px" }}>
                  {papaShipment.papaPincode ?? "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "3px" }}>End code</div>
                <div style={{ fontWeight: "700", fontSize: "16px", color: endPincode ? "#15803d" : "#9ca3af" }}>
                  {endPincode ?? "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "3px" }}>Жолоочийн төлбөр</div>
                <div style={{ fontWeight: "600" }}>
                  ₮{(papaShipment.shippingAmount ?? 6000).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Customer & address */}
          <div style={{ padding: "0 24px 16px" }}>
            <div style={{
              padding: "14px 16px", backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb", borderRadius: "8px",
            }}>
              <div style={{ fontWeight: "600", marginBottom: "10px" }}>{customerName}</div>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "5px 8px", color: "#374151" }}>
                <span style={{ color: "#9ca3af" }}>Утас</span><span>{phone}</span>
                <span style={{ color: "#9ca3af" }}>Дүүрэг</span><span>{district}</span>
                {address !== "—" && <><span style={{ color: "#9ca3af" }}>Хаяг</span><span>{address}</span></>}
              </div>
            </div>
          </div>

          {/* Order items */}
          {delivery.orderItems?.length > 0 && (
            <div style={{ padding: "0 24px 16px" }}>
              <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Бараанууд ({delivery.orderItems.length})
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                {delivery.orderItems.map((item, i) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 14px",
                    borderBottom: i < delivery.orderItems.length - 1 ? "1px solid #f3f4f6" : "none",
                    backgroundColor: i % 2 === 0 ? "white" : "#fafafa",
                  }}>
                    {item.product?.ProductImages?.[0]?.imageUrl && (
                      <img
                        src={item.product.ProductImages[0].imageUrl}
                        alt=""
                        style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.product?.name ?? "Бараа"}
                      </div>
                      {item.variant?.sku && (
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.variant.sku}</div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: "600" }}>{formatPrice(item.price)}</div>
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>× {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div style={{
            margin: "0 24px 20px",
            padding: "12px 16px",
            backgroundColor: "#f9fafb", borderRadius: "8px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: "#6b7280" }}>Нийт дүн</span>
            <span style={{ fontWeight: "700", fontSize: "15px" }}>{formatPrice(delivery.total)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
