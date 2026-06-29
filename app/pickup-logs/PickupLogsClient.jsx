"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getBackendUrl } from "@/lib/api/env";

const ACTION_CONFIG = {
  SEND_PIN:     { label: "PIN илгээв",   bg: "#eef2ff", color: "#4338ca" },
  VERIFY_PIN:   { label: "Баталгаажуулав", bg: "#ecfeff", color: "#0e7490" },
  UPDATE_PHONE: { label: "Утас засав",   bg: "#fffbeb", color: "#92400e" },
  CANCEL:       { label: "Цуцлав",       bg: "#fef2f2", color: "#991b1b" },
};

const ACTIONS = ["", "SEND_PIN", "VERIFY_PIN", "UPDATE_PHONE", "CANCEL"];

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { label: action, bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600,
      backgroundColor: cfg.bg, color: cfg.color, whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function actorName(user) {
  if (!user) return "Систем";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.username || `#${user.id}`;
}

export default function PickupLogsClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (action) params.append("action", action);
      const res = await fetch(`${getBackendUrl()}/api/v1/pickup-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Алдаа гарлаа");
      setLogs(data.data || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const th = { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };
  const td = { padding: "12px 14px", fontSize: 13, color: "#374151", borderTop: "1px solid #f3f4f6", verticalAlign: "middle" };

  return (
    <div className="wg-box" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Pickup лог</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            Хэн, хэзээ, ямар үйлдэл хийсэн ({pagination.total})
          </div>
        </div>
        <select
          value={action}
          onChange={(e) => { setPage(1); setAction(e.target.value); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#111827", backgroundColor: "#fff" }}
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a ? (ACTION_CONFIG[a]?.label || a) : "Бүх үйлдэл"}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ padding: "12px 18px", color: "#dc2626", fontSize: 13, backgroundColor: "#fef2f2" }}>{error}</div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Огноо</th>
              <th style={th}>Хэрэглэгч</th>
              <th style={th}>Үйлдэл</th>
              <th style={th}>Төлөв</th>
              <th style={th}>Захиалга / Бичлэг</th>
              <th style={th}>Тэмдэглэл</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "40px" }} colSpan={6}>Уншиж байна...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "40px" }} colSpan={6}>Бичлэг алга</td></tr>
            ) : logs.map((l) => (
              <tr key={l.id}>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{actorName(l.user)}</div>
                  {l.user?.role && <div style={{ fontSize: 11, color: "#9ca3af" }}>{l.user.role}</div>}
                </td>
                <td style={td}><ActionBadge action={l.action} /></td>
                <td style={{ ...td, color: "#6b7280", whiteSpace: "nowrap" }}>
                  {l.fromStatus || l.toStatus ? `${l.fromStatus || "—"} → ${l.toStatus || "—"}` : "—"}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {l.orderId ? `Захиалга #${l.orderId}` : l.recordId ? `Бичлэг #${l.recordId}` : "—"}
                </td>
                <td style={{ ...td, color: "#6b7280" }}>{l.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, padding: "12px 18px", borderTop: "1px solid #f3f4f6" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: 13, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
          >
            Өмнөх
          </button>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{page} / {pagination.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: 13, cursor: page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: page >= pagination.totalPages ? 0.5 : 1 }}
          >
            Дараах
          </button>
        </div>
      )}
    </div>
  );
}
