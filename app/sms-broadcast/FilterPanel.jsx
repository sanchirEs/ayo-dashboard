"use client";

const seg = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
  cursor: "pointer", border: "1px solid transparent", transition: "all 0.15s",
  userSelect: "none",
};
const segActive = { ...seg, background: "#1e40af", color: "#fff", borderColor: "#1e40af" };
const segInactive = { ...seg, background: "#fff", color: "#374151", borderColor: "#e5e7eb" };

function SegGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          style={value === o.value ? segActive : segInactive}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function FilterPanel({
  filters, onFiltersChange, users, excludedNoPhone,
  loading, selectedIds, onSelectionChange,
}) {
  const allIds = users.map((u) => u.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    onSelectionChange(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  }

  function setFilter(key, value) {
    const next = { ...filters, [key]: value };
    if (key === "neverOrdered" && value) { next.hasOrdered = false; next.lastOrderedDays = ""; }
    if ((key === "hasOrdered" || key === "lastOrderedDays") && value) next.neverOrdered = false;
    onFiltersChange(next);
  }

  // Order filter state: "all" | "ordered" | "never"
  const orderState = filters.neverOrdered ? "never" : filters.hasOrdered ? "ordered" : "all";
  function setOrderState(v) {
    if (v === "never") { onFiltersChange({ ...filters, hasOrdered: false, lastOrderedDays: "", neverOrdered: true }); }
    else if (v === "ordered") { onFiltersChange({ ...filters, hasOrdered: true, neverOrdered: false }); }
    else { onFiltersChange({ ...filters, hasOrdered: false, lastOrderedDays: "", neverOrdered: false }); }
  }

  const inputStyle = {
    padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: "8px",
    fontSize: "13px", color: "#111827", outline: "none", background: "#fff",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <div className="wg-box" style={{ flex: 1, minWidth: 0, padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "13px" }}>👥</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>Хэрэглэгч сонгох</div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>Мессеж хүлээн авах хүмүүсийг шүүнэ үү</div>
          </div>
        </div>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280" }}>
            <svg style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Шүүж байна...
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

        {/* User type */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Хэрэглэгчийн төрөл</label>
          <SegGroup
            options={[
              { value: "CUSTOMER", label: "Худалдан авагч" },
              { value: "VENDOR", label: "Борлуулагч" },
              { value: "ALL", label: "Бүгд" },
            ]}
            value={filters.role || "CUSTOMER"}
            onChange={(v) => setFilter("role", v)}
          />
        </div>

        {/* Order status */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Захиалгын байдал</label>
          <SegGroup
            options={[
              { value: "all", label: "Бүгд" },
              { value: "ordered", label: "Захиалсан" },
              { value: "never", label: "Захиалаагүй" },
            ]}
            value={orderState}
            onChange={setOrderState}
          />
        </div>

        {/* Last ordered (only when ordered selected) */}
        {orderState === "ordered" && (
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Сүүлд захиалсан хугацаа</label>
            <select
              value={filters.lastOrderedDays || ""}
              onChange={(e) => setFilter("lastOrderedDays", e.target.value)}
              style={inputStyle}
            >
              <option value="">Бүх хугацаа</option>
              <option value="30">Сүүлийн 30 хоног</option>
              <option value="60">Сүүлийн 60 хоног</option>
              <option value="90">Сүүлийн 90 хоног</option>
            </select>
          </div>
        )}

        {/* Registered after */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Бүртгэлийн огноо (хойш)</label>
          <input
            type="date"
            value={filters.registeredAfter || ""}
            onChange={(e) => setFilter("registeredAfter", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Excluded warning */}
      {excludedNoPhone > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#92400e" }}>
          <span>⚠️</span>
          <span>{excludedNoPhone} хэрэглэгч утасгүй тул автоматаар орхигдоно</span>
        </div>
      )}

      {/* Recipient count + select all */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: selectedIds.size > 0 ? "#eff6ff" : "#f9fafb", borderRadius: "10px", border: `1px solid ${selectedIds.size > 0 ? "#bfdbfe" : "#e5e7eb"}`, marginBottom: "16px", transition: "all 0.2s" }}>
        <div>
          <span style={{ fontSize: "22px", fontWeight: 800, color: selectedIds.size > 0 ? "#1d4ed8" : "#9ca3af", lineHeight: 1 }}>
            {selectedIds.size}
          </span>
          <span style={{ fontSize: "13px", color: selectedIds.size > 0 ? "#3b82f6" : "#9ca3af", marginLeft: "6px" }}>
            хэрэглэгч сонгогдсон
          </span>
          {users.length > 0 && selectedIds.size < users.length && (
            <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "8px" }}>/ {users.length}</span>
          )}
        </div>
        <button
          type="button"
          onClick={toggleAll}
          disabled={loading || users.length === 0}
          style={{
            padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            cursor: users.length === 0 ? "not-allowed" : "pointer",
            border: "1px solid #e5e7eb", background: allSelected ? "#fee2e2" : "#fff",
            color: allSelected ? "#dc2626" : "#374151", transition: "all 0.15s",
            opacity: users.length === 0 ? 0.5 : 1,
          }}
        >
          {allSelected ? "Бүгдийг болиулах" : "Бүгдийг сонгох"}
        </button>
      </div>

      {/* Recipients table */}
      <div style={{ border: "1px solid #f0f0f0", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ maxHeight: "340px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#374151", width: "40px", borderBottom: "1px solid #f0f0f0" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={users.length === 0}
                    style={{ cursor: "pointer", width: "15px", height: "15px" }} />
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #f0f0f0" }}>Нэр</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #f0f0f0" }}>Утас</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #f0f0f0" }}>Сүүлд захиалсан</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ fontSize: "13px" }}>Уншиж байна...</div>
                </td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>Шүүлтүүрт тохирох хэрэглэгч олдсонгүй</div>
                </td></tr>
              )}
              {!loading && users.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => toggleOne(u.id)}
                  style={{
                    cursor: "pointer",
                    background: selectedIds.has(u.id) ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa",
                    transition: "background 0.1s",
                  }}
                >
                  <td style={{ padding: "9px 12px", borderBottom: "1px solid #f5f5f5" }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleOne(u.id)}
                      style={{ cursor: "pointer", width: "15px", height: "15px" }} />
                  </td>
                  <td style={{ padding: "9px 12px", borderBottom: "1px solid #f5f5f5", fontWeight: selectedIds.has(u.id) ? 600 : 400, color: "#111827" }}>
                    {u.firstName || ""} {u.lastName || ""}
                  </td>
                  <td style={{ padding: "9px 12px", borderBottom: "1px solid #f5f5f5", color: "#374151", fontFamily: "monospace" }}>
                    {u.telephone}
                  </td>
                  <td style={{ padding: "9px 12px", borderBottom: "1px solid #f5f5f5", color: u.lastOrderDate ? "#059669" : "#d1d5db", fontSize: "12px" }}>
                    {u.lastOrderDate ? new Date(u.lastOrderDate).toLocaleDateString("mn-MN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tr:hover td { background: #f0f7ff !important; }
      `}</style>
    </div>
  );
}
