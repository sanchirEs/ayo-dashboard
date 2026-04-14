"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getBackendUrl } from "@/lib/api/env";
import { formatOrderDate, formatPrice } from "@/lib/api/orders";
import { exportToExcel } from "@/lib/exportToExcel";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const PAPA_STATUS = {
  NEW:              { label: "Жолооч дуудсан",    dot: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  CONFIRM:          { label: "Жолооч дуудсан",    dot: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
  CREATING_SHIPPING:{ label: "Хүргэлтэнд гарсан", dot: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  START:            { label: "Хүргэлтэнд гарсан", dot: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  END:              { label: "Хүргэгдсэн",        dot: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  COMPLETED:        { label: "Хүргэгдсэн",        dot: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  CANCELLED:        { label: "Цуцалсан",           dot: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
};

function PapaStatusBadge({ status }) {
  const cfg = PAPA_STATUS[status] || { label: status, dot: "#6b7280", bg: "#f9fafb", text: "#374151" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      backgroundColor: cfg.bg, color: cfg.text,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.01em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function ActionBtn({ onClick, disabled, loading, variant = "default", children }) {
  const variants = {
    green:  { bg: "#10b981", hover: "#059669", color: "#fff", border: "none" },
    blue:   { bg: "#3b82f6", hover: "#2563eb", color: "#fff", border: "none" },
    gray:   { bg: "#fff",    hover: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb" },
    red:    { bg: "#fff",    hover: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
    default:{ bg: "#fff",    hover: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb" },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
        backgroundColor: v.bg, color: v.color, border: v.border,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        opacity: (disabled || loading) ? 0.55 : 1,
        transition: "all 0.15s", whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.backgroundColor = v.hover; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = v.bg; }}
    >
      {loading ? "..." : children}
    </button>
  );
}

function CopyBtn({ code }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={handleCopy}
      title="Papa Code хуулах"
      style={{
        padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
        backgroundColor: copied ? "#ecfdf5" : "#f3f4f6",
        color: copied ? "#065f46" : "#6b7280",
        border: `1px solid ${copied ? "#a7f3d0" : "#e5e7eb"}`,
        cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ Хуулсан" : code}
    </button>
  );
}

function EmptyState({ tab }) {
  const msgs = {
    dispatch:  { icon: "📦", title: "Хүргэх захиалга байхгүй", sub: "Бүх захиалга Papa руу илгээгдсэн байна." },
    transit:   { icon: "🚚", title: "Идэвхтэй хүргэлт байхгүй", sub: "Одоогоор хүргэлтэнд гарсан захиалга алга." },
    delivered: { icon: "✅", title: "Хүргэгдсэн захиалга байхгүй", sub: "Хүргэлт дууссан захиалгууд энд харагдана." },
    cancelled: { icon: "🚫", title: "Цуцалсан хүргэлт байхгүй", sub: "Цуцалсан хүргэлтүүд энд харагдана." },
  };
  const m = msgs[tab];
  return (
    <tr>
      <td colSpan={10} style={{ textAlign: "center", padding: "48px 24px", color: "#9ca3af" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
        <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>{m.title}</div>
        <div style={{ fontSize: 12 }}>{m.sub}</div>
      </td>
    </tr>
  );
}

function SkeletonRow({ cols }) {
  const bar = (w) => (
    <div style={{
      height: 12, borderRadius: 6, width: w,
      background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} style={{ padding: "14px 12px" }}>{bar(j === 0 ? "60%" : j === cols - 1 ? "70px" : "80%")}</td>
      ))}
    </tr>
  ));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function DeliveryClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dispatch");
  const [search, setSearch] = useState("");

  // Per-row action states: { [orderId]: { creating, confirming, error } }
  const [rowState, setRowState] = useState({});

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchDeliveries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${getBackendUrl()}/api/v1/admin/shipping/orders/deliverable?page=1&limit=200&sortField=createdAt&sortOrder=desc`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Алдаа гарлаа");
      setDeliveries(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  // ── Tab split ─────────────────────────────────────────────────────────────

  const { dispatch, transit, delivered, cancelled } = useMemo(() => {
    const dispatch = [], transit = [], delivered = [], cancelled = [];
    for (const d of deliveries) {
      // Get the latest (most recent) non-cargo shipment
      const ps = d.papaShipment?.papaStatus;
      if (!d.papaShipment) {
        // No shipment yet — ready to dispatch
        dispatch.push(d);
      } else if (ps === "CANCELLED") {
        // Cancelled shipment — can re-call driver
        cancelled.push(d);
      } else if (ps === "END" || ps === "COMPLETED") {
        // Delivered by Papa
        delivered.push(d);
      } else {
        // NEW, CONFIRM, CREATING_SHIPPING, START — active/in transit
        transit.push(d);
      }
    }
    return { dispatch, transit, delivered, cancelled };
  }, [deliveries]);

  const tabData = { dispatch, transit, delivered, cancelled };

  // ── Filtered rows ─────────────────────────────────────────────────────────

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabData[activeTab];
    return tabData[activeTab].filter(d => {
      const name = `${d.user?.firstName || ""} ${d.user?.lastName || ""}`.toLowerCase();
      const phone = d.user?.telephone || "";
      const id = String(d.id);
      const code = d.papaShipment?.papaCode || "";
      return name.includes(q) || phone.includes(q) || id.includes(q) || code.toLowerCase().includes(q);
    });
  }, [activeTab, deliveries, search]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function setRow(orderId, patch) {
    setRowState(prev => ({ ...prev, [orderId]: { ...prev[orderId], ...patch } }));
  }

  async function handleSendToPapa(orderId) {
    if (!token) return;
    setRow(orderId, { creating: true, error: null });
    try {
      const res = await fetch(`${getBackendUrl()}/api/v1/admin/shipping/orders/bulk-deliver`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [orderId] }),
      });
      const json = await res.json();
      if (json.summary?.succeeded > 0) {
        setRow(orderId, { creating: false });
        await fetchDeliveries();
      } else {
        const msg = json.data?.failed?.[0]?.error || json.message || "Алдаа гарлаа";
        setRow(orderId, { creating: false, error: msg });
      }
    } catch (e) {
      setRow(orderId, { creating: false, error: e.message });
    }
  }

  async function handleConfirm(shipmentId, orderId) {
    if (!token) return;
    setRow(orderId, { confirming: true, error: null });
    try {
      const res = await fetch(`${getBackendUrl()}/api/v1/admin/shipping/shipments/${shipmentId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        setRow(orderId, { confirming: false });
        await fetchDeliveries();
      } else {
        setRow(orderId, { confirming: false, error: json.message || "Баталгаажуулж чадсангүй" });
      }
    } catch (e) {
      setRow(orderId, { confirming: false, error: e.message });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  async function handleExportExcel() {
    const exportRows = rows.map(d => {
      const papa = d.papaShipment;
      return {
        "Order ID": d.id,
        "Customer": d.user ? `${d.user.firstName} ${d.user.lastName}` : "—",
        "Phone": d.user?.telephone || "",
        "Product": d.orderItems?.[0]?.product?.name || "—",
        "Items": d.orderItems?.length || 0,
        "Total": d.total,
        "Papa Code": papa?.papaCode || "",
        "Papa Status": papa?.papaStatus || "Not sent",
        "Driver": papa?.driverName || "",
        "Driver Phone": papa?.driverPhone || "",
        "Date": d.createdAt ? new Date(d.createdAt).toLocaleString() : "",
      };
    });
    const date = new Date().toISOString().slice(0, 10);
    await exportToExcel(exportRows, `delivery-${activeTab}-${date}`);
  }

  const TABS = [
    { id: "dispatch",  label: "Хүргэх",        count: dispatch.length,  dot: "#f59e0b", sub: "Papa руу илгээгдэх хүлээж байна" },
    { id: "transit",   label: "Хүргэлтэнд",    count: transit.length,   dot: "#3b82f6", sub: "Жолооч дуудсан / хүргэлтэнд" },
    { id: "delivered", label: "Хүргэгдсэн",    count: delivered.length, dot: "#10b981", sub: "Амжилттай хүргэсэн" },
    { id: "cancelled", label: "Цуцалсан",      count: cancelled.length, dot: "#ef4444", sub: "Цуцалсан хүргэлтүүд" },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .del-row:hover { background-color: #f9fafb !important; }
      `}</style>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "18px 20px", borderRadius: 10, textAlign: "left", cursor: "pointer",
              backgroundColor: activeTab === tab.id ? "#fff" : "#fafafa",
              border: `1.5px solid ${activeTab === tab.id ? tab.dot : "#f3f4f6"}`,
              boxShadow: activeTab === tab.id ? `0 2px 12px rgba(0,0,0,0.07)` : "none",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              {tab.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
              {loading ? "—" : tab.count}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: tab.dot }} />
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                {tab.sub}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Main table card ─────────────────────────────────────────────────── */}
      <div className="wg-box" style={{ padding: 0, overflow: "hidden" }}>

        {/* Tab bar + search */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0 20px", borderBottom: "1px solid #f3f4f6", gap: 16,
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 18px", fontSize: 13, fontWeight: 600,
                  border: "none", backgroundColor: "transparent", cursor: "pointer",
                  color: activeTab === tab.id ? tab.dot : "#9ca3af",
                  borderBottom: `2px solid ${activeTab === tab.id ? tab.dot : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
                <span style={{
                  marginLeft: 6, padding: "1px 7px", borderRadius: 20, fontSize: 11,
                  backgroundColor: activeTab === tab.id ? tab.dot : "#f3f4f6",
                  color: activeTab === tab.id ? "#fff" : "#6b7280",
                  fontWeight: 700,
                }}>
                  {loading ? "…" : tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + refresh */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 0" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Хайх..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: "7px 12px 7px 32px", borderRadius: 7, fontSize: 13,
                  border: "1px solid #e5e7eb", outline: "none", width: 220,
                  backgroundColor: "#fafafa",
                }}
                onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.backgroundColor = "#fff"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.backgroundColor = "#fafafa"; }}
              />
              <svg style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#9ca3af", pointerEvents: "none" }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  border: "none", background: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14,
                }}>×</button>
              )}
            </div>
            <button
              onClick={handleExportExcel}
              disabled={loading || rows.length === 0}
              title="Excel-рүү экспортлох"
              style={{
                padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                border: "1px solid #e5e7eb", backgroundColor: "#fff", color: "#374151",
                cursor: (loading || rows.length === 0) ? "not-allowed" : "pointer",
                opacity: (loading || rows.length === 0) ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!loading && rows.length > 0) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#fff"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Excel
            </button>
            <button
              onClick={fetchDeliveries}
              disabled={loading}
              title="Дахин ачаалах"
              style={{
                width: 33, height: 33, borderRadius: 7, border: "1px solid #e5e7eb",
                backgroundColor: "#fff", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <svg style={{ width: 14, height: 14, color: "#6b7280", ...(loading ? { animation: "spin 1s linear infinite" } : {}) }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 20px", backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
            <span style={{ fontSize: 13, color: "#dc2626" }}>⚠ {error}</span>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>

            {/* ── Needs Dispatch ──────────────────────────────────────────── */}
            {activeTab === "dispatch" && (
              <>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    {["Захиалга", "Хэрэглэгч", "Бараа", "Нийт дүн", "Огноо", "Үйлдэл"].map(h => (
                      <th key={h} style={{ padding: "11px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? <SkeletonRow cols={6} /> : rows.length === 0 ? <EmptyState tab="dispatch" /> : rows.map(d => {
                    const rs = rowState[d.id] || {};
                    const first = d.orderItems?.[0];
                    const extra = (d.orderItems?.length || 1) - 1;
                    return (
                      <tr key={d.id} className="del-row" style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "transparent", transition: "background 0.12s" }}>
                        <td style={{ padding: "13px 12px" }}>
                          <Link href={`/order-detail/${d.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#111827", textDecoration: "none" }}>
                            #{d.id}
                          </Link>
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {d.user ? `${d.user.firstName} ${d.user.lastName}` : "—"}
                          </div>
                          {d.user?.telephone && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{d.user.telephone}</div>
                          )}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ fontSize: 13, color: "#374151" }}>
                            {first?.product?.name || "—"}
                          </div>
                          {extra > 0 && (
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>+ {extra} бараа</div>
                          )}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{formatPrice(d.total)}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{d.orderItems?.length || 0} ширхэг</div>
                        </td>
                        <td style={{ padding: "13px 12px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                          {formatOrderDate(d.createdAt)}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {rs.error && (
                              <span style={{ fontSize: 11, color: "#dc2626", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rs.error}>
                                ⚠ {rs.error}
                              </span>
                            )}
                            <ActionBtn
                              onClick={() => handleSendToPapa(d.id)}
                              loading={rs.creating}
                              variant="green"
                            >
                              Papa руу илгээх
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

            {/* ── In Transit ──────────────────────────────────────────────── */}
            {activeTab === "transit" && (
              <>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    {["Захиалга", "Хэрэглэгч", "Papa Код", "Статус", "Жолооч", "Огноо", "Үйлдэл"].map(h => (
                      <th key={h} style={{ padding: "11px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? <SkeletonRow cols={7} /> : rows.length === 0 ? <EmptyState tab="transit" /> : rows.map(d => {
                    const rs = rowState[d.id] || {};
                    const papa = d.papaShipment;
                    const isNew = papa?.papaStatus === "NEW";
                    return (
                      <tr key={d.id} className="del-row" style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "transparent", transition: "background 0.12s" }}>
                        <td style={{ padding: "13px 12px" }}>
                          <Link href={`/order-detail/${d.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#111827", textDecoration: "none" }}>
                            #{d.id}
                          </Link>
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {d.user ? `${d.user.firstName} ${d.user.lastName}` : "—"}
                          </div>
                          {d.user?.telephone && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{d.user.telephone}</div>
                          )}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          {papa?.papaCode
                            ? <CopyBtn code={papa.papaCode} />
                            : <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
                          }
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <PapaStatusBadge status={papa?.papaStatus} />
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          {papa?.driverName ? (
                            <>
                              <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{papa.driverName}</div>
                              {papa.driverPhone && (
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{papa.driverPhone}</div>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>Хүлээгдэж байна</span>
                          )}
                        </td>
                        <td style={{ padding: "13px 12px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                          {formatOrderDate(d.createdAt)}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {rs.error && (
                              <span style={{ fontSize: 11, color: "#dc2626", maxWidth: 100 }} title={rs.error}>⚠</span>
                            )}
                            {isNew && (
                              <ActionBtn
                                onClick={() => handleConfirm(papa.id, d.id)}
                                loading={rs.confirming}
                                variant="blue"
                              >
                                Баталгаажуулах
                              </ActionBtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

            {/* ── Delivered ───────────────────────────────────────────────── */}
            {activeTab === "delivered" && (
              <>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    {["Захиалга", "Хэрэглэгч", "Papa Код", "Жолооч", "Нийт дүн", "Хүргэгдсэн огноо"].map(h => (
                      <th key={h} style={{ padding: "11px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? <SkeletonRow cols={6} /> : rows.length === 0 ? <EmptyState tab="delivered" /> : rows.map(d => {
                    const papa = d.papaShipment;
                    return (
                      <tr key={d.id} className="del-row" style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "transparent", transition: "background 0.12s" }}>
                        <td style={{ padding: "13px 12px" }}>
                          <Link href={`/order-detail/${d.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#111827", textDecoration: "none" }}>
                            #{d.id}
                          </Link>
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {d.user ? `${d.user.firstName} ${d.user.lastName}` : "—"}
                          </div>
                          {d.user?.telephone && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{d.user.telephone}</div>
                          )}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          {papa?.papaCode
                            ? <CopyBtn code={papa.papaCode} />
                            : <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
                          }
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          {papa?.driverName ? (
                            <>
                              <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{papa.driverName}</div>
                              {papa.driverPhone && (
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{papa.driverPhone}</div>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "13px 12px", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                          {formatPrice(d.total)}
                        </td>
                        <td style={{ padding: "13px 12px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                          {papa?.deliveredAt ? formatOrderDate(papa.deliveredAt) : formatOrderDate(d.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

            {/* ── Cancelled ──────────────────────────────────────────────── */}
            {activeTab === "cancelled" && (
              <>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    {["Захиалга", "Хэрэглэгч", "Papa Код", "Нийт дүн", "Огноо", "Үйлдэл"].map(h => (
                      <th key={h} style={{ padding: "11px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? <SkeletonRow cols={6} /> : rows.length === 0 ? <EmptyState tab="cancelled" /> : rows.map(d => {
                    const rs = rowState[d.id] || {};
                    const papa = d.papaShipment;
                    return (
                      <tr key={d.id} className="del-row" style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "transparent", transition: "background 0.12s" }}>
                        <td style={{ padding: "13px 12px" }}>
                          <Link href={`/order-detail/${d.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#111827", textDecoration: "none" }}>
                            #{d.id}
                          </Link>
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {d.user ? `${d.user.firstName} ${d.user.lastName}` : "—"}
                          </div>
                          {d.user?.telephone && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{d.user.telephone}</div>
                          )}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          {papa?.papaCode
                            ? <CopyBtn code={papa.papaCode} />
                            : <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
                          }
                        </td>
                        <td style={{ padding: "13px 12px", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                          {formatPrice(d.total)}
                        </td>
                        <td style={{ padding: "13px 12px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                          {formatOrderDate(d.createdAt)}
                        </td>
                        <td style={{ padding: "13px 12px" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {rs.error && (
                              <span style={{ fontSize: 11, color: "#dc2626", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rs.error}>
                                ⚠ {rs.error}
                              </span>
                            )}
                            <ActionBtn
                              onClick={() => handleSendToPapa(d.id)}
                              loading={rs.creating}
                              variant="blue"
                            >
                              Дахин жолооч дуудах
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

          </table>
        </div>

        {/* Footer info */}
        {!loading && rows.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", fontSize: 12, color: "#9ca3af" }}>
            {search
              ? `"${search}" хайлтаар ${rows.length} үр дүн`
              : `Нийт ${rows.length} захиалга`
            }
          </div>
        )}
      </div>
    </>
  );
}
