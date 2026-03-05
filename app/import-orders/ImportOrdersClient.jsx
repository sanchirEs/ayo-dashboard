"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  getImportProducts,
  getImportOrders,
  markProductArrived,
  dispatchArrivedItems,
} from "@/lib/api/importOrders";

const STATUS_COLORS = {
  WAITING:    { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", label: "Хүлээж байна" },
  ARRIVED:    { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", label: "Ирсэн"        },
  DISPATCHED: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "Хүргэгдсэн"  },
};

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid #e5e7eb`, borderRadius: 12,
      padding: "20px 24px", minWidth: 160, flex: 1,
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: "#374151", marginTop: 4, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.WAITING;
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

// ==================== BY PRODUCT TAB ====================

function ProductsTab({ onRefresh, token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState({}); // productId → { loading, done, error }
  const [confirmId, setConfirmId] = useState(null);
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getImportProducts(token);
    setProducts(res.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleMarkArrived = async (productId, productName) => {
    setActionState((s) => ({ ...s, [productId]: { loading: true } }));
    const res = await markProductArrived(productId, noteText, token);
    if (res.success) {
      setActionState((s) => ({ ...s, [productId]: { loading: false, done: true, message: res.message } }));
      setConfirmId(null);
      setNoteText("");
      setTimeout(() => {
        setActionState((s) => ({ ...s, [productId]: undefined }));
        load();
        onRefresh();
      }, 2000);
    } else {
      setActionState((s) => ({ ...s, [productId]: { loading: false, error: res.error } }));
    }
  };

  if (loading) return (
    <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
      Бараа ачааллаж байна...
    </div>
  );

  if (products.length === 0) return (
    <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
      Импорт бараа байхгүй байна.
    </div>
  );

  return (
    <div>
      {products.map((product) => {
        const state = actionState[product.id] || {};
        const isConfirming = confirmId === product.id;

        return (
          <div key={product.id} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
            padding: "16px 20px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            {/* Image */}
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name}
                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, background: "#f3f4f6", borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                📦
              </div>
            )}

            {/* Product info */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{product.name}</div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>SKU: {product.sku}</div>
              {product.deliveryNote && (
                <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>{product.deliveryNote}</div>
              )}
            </div>

            {/* Count badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#c2410c" }}>{product.counts.waiting}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>Хүлээж байна</div>
              </div>
              <div style={{ width: 1, background: "#e5e7eb" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#15803d" }}>{product.counts.arrived}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>Ирсэн</div>
              </div>
              <div style={{ width: 1, background: "#e5e7eb" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>{product.counts.dispatched}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>Хүргэгдсэн</div>
              </div>
            </div>

            {/* Action */}
            <div style={{ minWidth: 200 }}>
              {state.done ? (
                <div style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>
                  ✅ {state.message}
                </div>
              ) : state.error ? (
                <div style={{ color: "#dc2626", fontSize: 12 }}>❌ {state.error}</div>
              ) : product.counts.waiting === 0 ? (
                <span style={{ color: "#9ca3af", fontSize: 12 }}>Хүлээж буй захиалга байхгүй</span>
              ) : isConfirming ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    <strong>{product.counts.waiting}</strong> хэрэглэгчид SMS явуулах уу?
                  </div>
                  <input
                    placeholder="Нэмэлт тэмдэглэл (заавал биш)"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={{
                      border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
                      fontSize: 12, width: "100%",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleMarkArrived(product.id, product.name)}
                      disabled={state.loading}
                      style={{
                        background: state.loading ? "#d1d5db" : "#15803d", color: "#fff",
                        border: "none", borderRadius: 6, padding: "7px 14px",
                        fontSize: 12, fontWeight: 600, cursor: state.loading ? "not-allowed" : "pointer",
                        flex: 1,
                      }}
                    >
                      {state.loading ? "Явуулж байна..." : "✅ Тийм, SMS явуул"}
                    </button>
                    <button
                      onClick={() => { setConfirmId(null); setNoteText(""); }}
                      style={{
                        background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db",
                        borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer",
                      }}
                    >
                      Болих
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(product.id)}
                  style={{
                    background: "#166534", color: "#fff", border: "none",
                    borderRadius: 8, padding: "8px 16px", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  📦 Монголд ирсэн ({product.counts.waiting})
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== BY ORDER TAB ====================

function OrdersTab({ filterStatus, onRefresh, token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionState, setActionState] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getImportOrders({ importStatus: filterStatus, search, limit: 100 }, token);
    setOrders(res.data || []);
    setLoading(false);
  }, [filterStatus, search, token]);

  useEffect(() => { load(); }, [load]);

  const handleDispatch = async (orderId) => {
    setActionState((s) => ({ ...s, [orderId]: { loading: true } }));
    const res = await dispatchArrivedItems(orderId, undefined, token);
    if (res.success) {
      setActionState((s) => ({ ...s, [orderId]: { loading: false, done: true, message: res.message } }));
      setTimeout(() => {
        setActionState((s) => ({ ...s, [orderId]: undefined }));
        load();
        onRefresh();
      }, 2500);
    } else {
      setActionState((s) => ({ ...s, [orderId]: { loading: false, error: res.error } }));
    }
  };

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Хайх: захиалга #, нэр, утас..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 14px",
            fontSize: 13, width: "100%", maxWidth: 400,
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Уншиж байна...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Захиалга байхгүй байна</div>
      ) : (
        orders.map((order) => {
          const state = actionState[order.id] || {};
          const isExpanded = expandedId === order.id;
          const s = order.importSummary;
          const customerName = `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim();
          const importItems = order.orderItems.filter((i) => i.product?.isImportedProduct);
          const localItems  = order.orderItems.filter((i) => !i.product?.isImportedProduct);
          const papaShipments = order.papaShipments || [];

          return (
            <div key={order.id} style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
              marginBottom: 10, overflow: "hidden",
            }}>
              {/* Row header */}
              <div
                style={{ padding: "14px 20px", display: "flex", gap: 16, alignItems: "center",
                  cursor: "pointer", flexWrap: "wrap" }}
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                {/* Order ID */}
                <div style={{ fontWeight: 700, color: "#1d4ed8", minWidth: 70, fontSize: 14 }}>
                  #{order.id}
                </div>

                {/* Customer */}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{customerName}</div>
                  {order.user?.telephone && (
                    <div style={{ fontSize: 11, color: "#6b7280" }}>📞 {order.user.telephone}</div>
                  )}
                </div>

                {/* Import summary badges */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.waiting > 0 && (
                    <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa",
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      ⏳ {s.waiting} хүлээж байна
                    </span>
                  )}
                  {s.arrived > 0 && (
                    <span style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0",
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      ✅ {s.arrived} ирсэн
                    </span>
                  )}
                  {s.dispatched > 0 && (
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      🚚 {s.dispatched} хүргэгдсэн
                    </span>
                  )}
                  {s.localItems > 0 && (
                    <span style={{ background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb",
                      borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>
                      {s.localItems} орон нутгийн
                    </span>
                  )}
                </div>

                {/* Dispatch action */}
                {s.arrived > 0 && !s.allDispatched && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {state.done ? (
                      <span style={{ color: "#15803d", fontSize: 12, fontWeight: 600 }}>✅ {state.message}</span>
                    ) : state.error ? (
                      <span style={{ color: "#dc2626", fontSize: 11 }}>❌ {state.error}</span>
                    ) : (
                      <button
                        onClick={() => handleDispatch(order.id)}
                        disabled={state.loading}
                        style={{
                          background: state.loading ? "#d1d5db" : "#1d4ed8", color: "#fff",
                          border: "none", borderRadius: 8, padding: "8px 14px",
                          fontSize: 12, fontWeight: 600, cursor: state.loading ? "not-allowed" : "pointer",
                        }}
                      >
                        {state.loading ? "Явуулж байна..." : `🚀 Papa руу явуул (${s.arrived})`}
                      </button>
                    )}
                  </div>
                )}

                {/* Expand icon */}
                <div style={{ color: "#9ca3af", fontSize: 12, marginLeft: "auto" }}>
                  {isExpanded ? "▲" : "▼"}
                </div>
              </div>

              {/* Expanded: item breakdown */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px", background: "#fafafa" }}>
                  {/* Import items */}
                  {importItems.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6,
                        textTransform: "uppercase", letterSpacing: 1 }}>
                        📦 Импорт бараа
                      </div>
                      {importItems.map((item) => (
                        <div key={item.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "6px 0", borderBottom: "1px solid #f3f4f6",
                        }}>
                          <div style={{ flex: 1, fontSize: 13 }}>
                            <span style={{ fontWeight: 600 }}>{item.product?.name}</span>
                            {item.variant && <span style={{ color: "#9ca3af" }}> · {item.variant.sku}</span>}
                            <span style={{ color: "#6b7280" }}> × {item.quantity}</span>
                          </div>
                          <Badge status={item.importStatus} />
                          {item.importArrivedAt && (
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>
                              Ирсэн: {new Date(item.importArrivedAt).toLocaleDateString("mn-MN")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Local items */}
                  {localItems.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6,
                        textTransform: "uppercase", letterSpacing: 1 }}>
                        🏪 Орон нутгийн бараа
                      </div>
                      {localItems.map((item) => (
                        <div key={item.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "6px 0", borderBottom: "1px solid #f3f4f6",
                          fontSize: 13,
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600 }}>{item.product?.name}</span>
                            <span style={{ color: "#6b7280" }}> × {item.quantity}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>Орон нутаг</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Papa shipments */}
                  {papaShipments.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6,
                        textTransform: "uppercase", letterSpacing: 1 }}>
                        🚚 Papa хүргэлтүүд
                      </div>
                      {papaShipments.map((ps) => (
                        <div key={ps.id} style={{
                          fontSize: 12, padding: "4px 0",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <span style={{ fontWeight: 600, color: "#1d4ed8" }}>{ps.papaCode || "—"}</span>
                          <span style={{ color: "#6b7280" }}>{ps.papaStatus}</span>
                          {ps.isCargoShipment && (
                            <span style={{ background: "#fef9c3", color: "#854d0e",
                              borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>
                              CARGO
                            </span>
                          )}
                          {ps.shipmentNote && (
                            <span style={{ color: "#9ca3af" }}>{ps.shipmentNote}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ==================== MAIN CLIENT COMPONENT ====================

const TABS = [
  { key: "products", label: "📦 Бараагаар" },
  { key: "orders",   label: "📋 Захиалгаар" },
];

const ORDER_FILTERS = [
  { key: "",           label: "Бүгд"         },
  { key: "waiting",    label: "⏳ Хүлээж байна" },
  { key: "arrived",    label: "✅ Ирсэн"      },
  { key: "dispatched", label: "🚚 Хүргэгдсэн" },
];

export default function ImportOrdersClient({ initialStats }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken ?? null;

  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState("products");
  const [orderFilter, setOrderFilter] = useState("");

  const refreshStats = useCallback(async () => {
    const { getImportStats } = await import("@/lib/api/importOrders");
    const res = await getImportStats(token);
    if (res.success) setStats(res.data);
  }, [token]);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Хүлээж байна" value={stats.waiting} color="#c2410c"
          sub="Монголд ирээгүй" />
        <StatCard label="Монголд ирсэн" value={stats.arrived} color="#15803d"
          sub="Papa руу явуулахад бэлэн" />
        <StatCard label="Хүргэгдсэн" value={stats.dispatched} color="#1d4ed8"
          sub="Papa руу явуулсан" />
        <StatCard label="Нийт" value={stats.total} color="#6b7280" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: "none", border: "none", padding: "10px 18px",
              fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? "#1d4ed8" : "#6b7280",
              borderBottom: activeTab === tab.key ? "2px solid #1d4ed8" : "2px solid transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "products" && (
        <div className="wg-box">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
              Импорт бараанууд
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              Бараа Монголд ирсэн үед "Монголд ирсэн" товч дарна уу.
              Систем автоматаар хэрэглэгчдэд SMS явуулна.
            </div>
          </div>
          <ProductsTab onRefresh={refreshStats} token={token} />
        </div>
      )}

      {activeTab === "orders" && (
        <div className="wg-box">
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {ORDER_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setOrderFilter(f.key)}
                style={{
                  background: orderFilter === f.key ? "#1d4ed8" : "#f3f4f6",
                  color: orderFilter === f.key ? "#fff" : "#374151",
                  border: "none", borderRadius: 20, padding: "6px 14px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <OrdersTab filterStatus={orderFilter} onRefresh={refreshStats} token={token} />
        </div>
      )}
    </div>
  );
}
