"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSheetLogs } from "@/lib/api/sheetPayments";
import { getRoleDisplayName } from "@/lib/auth-utils";

const ACTION_LABELS = {
  SEND_PIN:     { label: "PIN илгээсэн",   color: "#2563eb", bg: "#eff6ff" },
  VERIFY_PIN:   { label: "PIN баталгаажсан", color: "#059669", bg: "#f0fdf4" },
  UPDATE_PHONE: { label: "Утас шинэчилсэн", color: "#d97706", bg: "#fffbeb" },
  REFRESH:      { label: "Хуудас шинэчилсэн", color: "#7c3aed", bg: "#f5f3ff" },
};

function ActionBadge({ action, success }) {
  const meta = ACTION_LABELS[action] || { label: action, color: "#6b7280", bg: "#f9fafb" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "99px", fontSize: "12px", fontWeight: 600,
      color: success ? meta.color : "#dc2626",
      background: success ? meta.bg : "#fef2f2",
    }}>
      {success ? "✓" : "✗"} {meta.label}
    </span>
  );
}

function LogRow({ entry }) {
  const d = new Date(entry.createdAt);
  const timeStr = d.toLocaleString("mn-MN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>
      <td style={{ padding: "8px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>{timeStr}</td>
      <td style={{ padding: "8px 12px", color: "#374151" }}>
        {entry.userDisplay || "—"}
        {entry.userRole && (
          <span style={{ display: "block", fontSize: "10px", color: "#9ca3af" }}>
            {getRoleDisplayName(entry.userRole)}
          </span>
        )}
      </td>
      <td style={{ padding: "8px 12px" }}><ActionBadge action={entry.action} success={entry.success} /></td>
      <td style={{ padding: "8px 12px", color: "#6b7280", textAlign: "center" }}>
        {entry.rowIndex ? `#${entry.rowIndex}` : "—"}
      </td>
      <td style={{ padding: "8px 12px", color: "#374151" }}>{entry.phone || "—"}</td>
      <td style={{ padding: "8px 12px", color: "#dc2626", fontSize: "11px", maxWidth: "220px" }}>
        {!entry.success && entry.errorMsg ? (
          <span title={entry.errorMsg} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.errorMsg}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

const TH = {
  padding: "8px 12px", fontSize: "12px", fontWeight: 600,
  background: "#f9fafb", color: "#6b7280", borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const ACTIONS = ["", "SEND_PIN", "VERIFY_PIN", "UPDATE_PHONE", "REFRESH"];
const ACTION_FILTER_LABELS = {
  "": "Бүгд", SEND_PIN: "PIN илгээсэн", VERIFY_PIN: "Баталгаажсан",
  UPDATE_PHONE: "Утас", REFRESH: "Шинэчлэл",
};

export default function SheetLogPanel({ initialToken }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || initialToken;

  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (p = 1, a = action) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await getSheetLogs({ page: p, limit: 50, action: a }, token);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, action]);

  useEffect(() => {
    if (open && !data) load(1);
  }, [open, data, load]);

  const handleAction = (a) => {
    setAction(a);
    setPage(1);
    load(1, a);
  };

  const handlePage = (p) => {
    setPage(p);
    load(p);
  };

  const { rows = [], total = 0, totalPages = 1 } = data || {};

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderRadius: "8px",
          border: "1px solid #e5e7eb", background: open ? "#f9fafb" : "white",
          cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#374151",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          📋 Үйл ажиллагааны лог
          {total > 0 && (
            <span style={{
              background: "#3730a3", color: "white",
              borderRadius: "99px", padding: "1px 8px", fontSize: "11px", fontWeight: 700,
            }}>{total}</span>
          )}
        </span>
        <span style={{ color: "#9ca3af", fontSize: "16px" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ marginTop: "8px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
            {ACTIONS.map((a) => (
              <button key={a} onClick={() => handleAction(a)} style={{
                padding: "4px 10px", borderRadius: "5px", fontSize: "12px",
                border: "1px solid " + (action === a ? "#3730a3" : "#e5e7eb"),
                background: action === a ? "#3730a3" : "white",
                color: action === a ? "white" : "#374151",
                cursor: "pointer", fontWeight: action === a ? 600 : 400,
              }}>{ACTION_FILTER_LABELS[a]}</button>
            ))}
            <button onClick={() => load(page)} disabled={loading} style={{
              marginLeft: "auto", padding: "4px 10px", borderRadius: "5px", fontSize: "12px",
              border: "1px solid #e5e7eb", background: "white", cursor: loading ? "not-allowed" : "pointer",
              color: loading ? "#9ca3af" : "#374151",
            }}>
              {loading ? "..." : "↻ Шинэчлэх"}
            </button>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", background: "#fef2f2", color: "#dc2626", fontSize: "12px" }}>{error}</div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
              <thead>
                <tr>
                  <th style={TH}>Огноо</th>
                  <th style={TH}>Хэрэглэгч</th>
                  <th style={TH}>Үйлдэл</th>
                  <th style={{ ...TH, textAlign: "center" }}>Мөр</th>
                  <th style={TH}>Утас</th>
                  <th style={TH}>Алдаа</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "13px" }}>
                      {loading ? "Ачаалж байна..." : "Лог байхгүй байна"}
                    </td>
                  </tr>
                )}
                {rows.map((entry) => <LogRow key={entry.id} entry={entry} />)}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "4px", justifyContent: "center", padding: "10px", borderTop: "1px solid #f3f4f6" }}>
              <button onClick={() => handlePage(page - 1)} disabled={page === 1}
                style={{ padding: "4px 10px", borderRadius: "5px", border: "1px solid #e5e7eb", background: "white", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: "12px" }}>‹</button>
              <span style={{ padding: "4px 10px", fontSize: "12px", color: "#6b7280" }}>{page} / {totalPages}</span>
              <button onClick={() => handlePage(page + 1)} disabled={page === totalPages}
                style={{ padding: "4px 10px", borderRadius: "5px", border: "1px solid #e5e7eb", background: "white", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontSize: "12px" }}>›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
