"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/api/orders";
import DeliveryRowActions from "./DeliveryRowActions";
import DeliveryItemRow from "./DeliveryItemRow";
import DeliveryConfirmModal from "./DeliveryConfirmModal";
import { dispatchOrderItemClient } from "@/lib/api/shipping";

const PAPA_STATUS_MAP = {
  NEW: { cls: "block-tracking", label: "Шинэ" },
  CONFIRM: { cls: "block-tracking", label: "Баталгаажсан" },
  START: { cls: "block-pending", label: "Гарсан" },
  END: { cls: "block-pending", label: "Ирсэн" },
  COMPLETED: { cls: "block-available", label: "Дууссан" },
  CANCELLED: { cls: "block-pending", label: "Цуцалсан" },
};

// "Aug 29 · 04:23"
function shortDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const mon = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${mon} ${day} · ${h}:${m}`;
}

export default function DeliveryRowClient({ delivery, isSelected, onSelect }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [expanded, setExpanded] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [confirmItem, setConfirmItem] = useState(null);
  const [sending, setSending] = useState(false);
  const [dispatchError, setDispatchError] = useState(null);

  const itemCount = delivery.orderItems?.length ?? 0;

  const customerName = delivery.user
    ? `${delivery.user.firstName} ${delivery.user.lastName}`
    : "N/A";
  const phone =
    delivery.user?.telephone || delivery.shipping?.mobile || "—";
  const district = delivery.shipping?.district || "—";

  const papaShipment = delivery.papaShipment;
  const papaCode = papaShipment?.papaCode ?? null;
  const papaStatus = papaShipment?.papaStatus ?? null;
  const statusInfo = papaStatus ? PAPA_STATUS_MAP[papaStatus] : null;

  const toggleItem = (id) => {
    const next = new Set(selectedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedItems(next);
  };

  const handleCallDriver = (item) => {
    setDispatchError(null);
    setConfirmItem(item);
  };

  const handleConfirmDispatch = async () => {
    const token = session?.user?.accessToken;
    if (!token || !confirmItem || sending) return;
    setSending(true);
    setDispatchError(null);
    try {
      const res = await dispatchOrderItemClient(delivery.id, confirmItem.id, token);
      if (res.success) {
        setConfirmItem(null);
        router.refresh();
      } else {
        setDispatchError(res.error || res.message || "Алдаа гарлаа");
      }
    } catch (e) {
      setDispatchError(e.message || "Алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <li
        className="product-item gap14"
        onClick={() => setExpanded((v) => !v)}
        style={{
          transition: "background-color 0.2s ease",
          borderBottom: "1px solid #f3f4f6",
          backgroundColor: isSelected ? "#eff6ff" : "transparent",
          flexWrap: "wrap",
          rowGap: 0,
          alignItems: "center",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = "#f9fafb";
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {/* Checkbox — stop row toggle */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            style={{ cursor: "pointer", width: "18px", height: "18px" }}
          />
        </div>

        {/* All columns */}
        <div className="flex items-center justify-between gap20 flex-grow">

          {/* Col 1: Order ID + Customer name + Phone */}
          <div className="name">
            <div className="body-title-2">#{delivery.id} · {customerName}</div>
            <div className="body-text">{phone}</div>
          </div>

          {/* Col 2: District */}
          <div className="body-text">{district}</div>

          {/* Col 3: Papa status */}
          <div>
            {statusInfo ? (
              <div className={statusInfo.cls}>{statusInfo.label}</div>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  backgroundColor: "#f3f4f6",
                  color: "#9ca3af",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Илгээгдээгүй
              </div>
            )}
          </div>

          {/* Col 4: Papa code */}
          <div
            className="body-text"
            style={{ fontFamily: "monospace", fontWeight: "600", letterSpacing: "0.3px" }}
          >
            {papaCode ?? <span style={{ color: "#d1d5db", fontWeight: "400" }}>—</span>}
          </div>

          {/* Col 5: Total */}
          <div className="body-text">{formatPrice(delivery.total)}</div>

          {/* Col 6: Date */}
          <div className="body-text">{shortDate(delivery.createdAt)}</div>

          {/* Col 7: Delivery cost */}
          <div className="body-text" style={{ fontWeight: "600" }}>₮6,000</div>

          {/* Col 8: Actions — stop row toggle */}
          <div
            style={{ width: 150, flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <DeliveryRowActions delivery={delivery} />
          </div>
        </div>

        {/* Expanded item rows — stop row toggle */}
        {expanded && itemCount > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ flex: "0 0 100%", width: "100%", borderTop: "1px solid #e9eaec" }}
          >
            {delivery.orderItems.map((item) => (
              <DeliveryItemRow
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onSelect={() => toggleItem(item.id)}
                onCallDriver={handleCallDriver}
              />
            ))}
          </div>
        )}
      </li>

      {/* Per-item dispatch confirmation modal */}
      <DeliveryConfirmModal
        open={!!confirmItem}
        onClose={() => {
          if (!sending) { setConfirmItem(null); setDispatchError(null); }
        }}
        order={delivery}
        item={confirmItem}
        onConfirm={handleConfirmDispatch}
        sending={sending}
        error={dispatchError}
      />
    </>
  );
}
