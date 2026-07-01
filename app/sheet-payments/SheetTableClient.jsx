"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSheetRows, refreshSheet } from "@/lib/api/sheetPayments";
import PinModal from "./PinModal";
import PhoneInlineEdit from "./PhoneInlineEdit";

const TH = {
  padding: "10px 12px", fontSize: "13px", fontWeight: 600,
  background: "#f9fafb", color: "#374151", borderBottom: "2px solid #e5e7eb",
  whiteSpace: "nowrap",
};
const TD = { padding: "10px 12px", fontSize: "13px", verticalAlign: "middle" };

// Google Sheets stores dates as serial numbers (days since Dec 30, 1899)
const SHEETS_EPOCH_MS = Date.UTC(1899, 11, 30);

function formatTimestamp(ts) {
  if (ts === null || ts === undefined || ts === "") return "—";
  let d;
  if (typeof ts === "number") {
    // Google Sheets serial → JS Date
    d = new Date(SHEETS_EPOCH_MS + ts * 86400000);
  } else {
    d = new Date(ts);
  }
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleString("mn-MN", {
    year: "2-digit", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function Paginator({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(2, page - delta);
  const right = Math.min(totalPages - 1, page + delta);

  pages.push(1);
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  const btnBase = {
    padding: "5px 10px", borderRadius: "5px", fontSize: "13px",
    border: "1px solid #e5e7eb", background: "white",
    color: "#374151", cursor: "pointer", minWidth: "34px",
  };

  return (
    <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginTop: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "default" : "pointer" }}>‹</button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} style={{ padding: "5px 4px", color: "#9ca3af", fontSize: "13px" }}>…</span>
        ) : (
          <button key={p} onClick={() => p !== page && onChange(p)}
            style={{ ...btnBase, background: p === page ? "#3730a3" : "white", color: p === page ? "white" : "#374151", border: p === page ? "1px solid #3730a3" : "1px solid #e5e7eb", cursor: p === page ? "default" : "pointer" }}>
            {p}
          </button>
        )
      )}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ ...btnBase, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "default" : "pointer" }}>›</button>
    </div>
  );
}

export default function SheetTableClient({ initialData, initialToken }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || initialToken;

  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pinRow, setPinRow] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const debounceRef = useRef(null);

  const fetchRows = useCallback(async (q, page = 1) => {
    setLoading(true);
    setError("");
    try {
      const result = await getSheetRows({ q, page, limit: 50 }, token);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRows(q, 1), 300);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      await refreshSheet(token);
      await fetchRows(query, 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePhoneUpdate = (rowIndex, phone) => {
    setData((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.rowIndex === rowIndex ? { ...r, phone } : r)),
    }));
  };

  const handleVerified = (rowIndex) => {
    setData((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => r.rowIndex === rowIndex ? { ...r, pickupChecked: true } : r),
    }));
    setPinRow(null);
    setSuccessMsg("✅ Амжилттай баталгаажлаа!");
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const { rows = [], total = 0, page = 1, totalPages = 1 } = data || {};

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px", position: "relative" }}>
          <input
            type="text"
            placeholder="Дансны дугаар, гүйлгээний тайлбар, утасаар хайх..."
            value={query}
            onChange={handleSearch}
            style={{
              width: "100%", padding: "8px 36px 8px 12px",
              borderRadius: "6px", border: "1px solid #e5e7eb",
              fontSize: "13px", outline: "none", boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3730a3")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
          <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
            <i className="icon-search" />
          </span>
        </div>

        <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
          {loading ? "Хайж байна..." : `${total} мөр`}
        </span>

        <button onClick={handleRefresh} disabled={refreshing} style={{
          padding: "8px 14px", borderRadius: "6px", border: "1px solid #e5e7eb",
          background: "white", fontSize: "13px", cursor: refreshing ? "not-allowed" : "pointer",
          color: refreshing ? "#9ca3af" : "#374151", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
        }}>
          <span style={{ display: "inline-block", animation: refreshing ? "spin 1s linear infinite" : "none" }}>↻</span>
          {refreshing ? "Шинэчилж байна..." : "Шинэчлэх"}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: "6px", background: "#fef2f2", color: "#dc2626", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="wg-table table-all-category" style={{ width: "100%", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "34%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={TH}>Огноо</th>
              <th style={TH}>Дансны дугаар</th>
              <th style={TH}>Гүйлгээний тайлбар</th>
              <th style={TH}>Утас</th>
              <th style={{ ...TH, textAlign: "center" }}>Pick up</th>
              <th style={{ ...TH, textAlign: "center" }}>Хүргэлт</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...TD, textAlign: "center", color: "#9ca3af", padding: "32px" }}>
                  {loading ? "Ачаалж байна..." : query ? "Хайлтад тохирох мөр олдсонгүй" : "Баталгаажуулах гүйлгээ байхгүй байна"}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.rowIndex}
                style={{ borderBottom: "1px solid #f3f4f6", opacity: row.pickupChecked ? 0.5 : 1 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ ...TD, color: "#6b7280", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {formatTimestamp(row.timestamp)}
                </td>
                <td style={{ ...TD, fontFamily: "monospace", fontSize: "12px", color: "#374151" }}>
                  {row.accountNumber || "—"}
                </td>
                <td style={{ ...TD, overflow: "hidden" }}>
                  <span title={row.description} style={{
                    display: "block", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontSize: "12px", color: "#374151",
                  }}>
                    {row.description || "—"}
                  </span>
                </td>
                <td style={TD}>
                  <PhoneInlineEdit
                    rowIndex={row.rowIndex}
                    phone={row.phone}
                    token={token}
                    onUpdate={(phone) => handlePhoneUpdate(row.rowIndex, phone)}
                  />
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {row.pickupChecked ? (
                    <span title="Баталгаажсан" style={{
                      width: "24px", height: "24px", borderRadius: "4px",
                      border: "2px solid #059669", background: "#d1fae5",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px",
                    }}>✓</span>
                  ) : (
                    <button
                      onClick={() => setPinRow(row)}
                      title="Pick up баталгаажуулах"
                      style={{
                        width: "24px", height: "24px", borderRadius: "4px",
                        border: "2px solid #d1d5db", background: "white",
                        cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3730a3")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                    />
                  )}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  <span title="Хүргэлт баталгаажуулах боломжгүй" style={{
                    width: "24px", height: "24px", borderRadius: "4px",
                    border: "2px solid #e5e7eb", background: "#f3f4f6",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: "not-allowed", opacity: 0.4,
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onChange={(p) => fetchRows(query, p)} />

      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 2000,
          background: "#059669", color: "white",
          padding: "14px 20px", borderRadius: "8px",
          fontSize: "14px", fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          animation: "slideIn 0.25s ease",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          {successMsg}
        </div>
      )}

      {pinRow && (
        <PinModal
          row={pinRow}
          token={token}
          onSuccess={() => handleVerified(pinRow.rowIndex)}
          onClose={() => setPinRow(null)}
          onPhoneUpdate={(phone) => handlePhoneUpdate(pinRow.rowIndex, phone)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
