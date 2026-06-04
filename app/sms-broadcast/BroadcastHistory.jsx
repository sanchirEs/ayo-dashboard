"use client";
import { useState, useEffect, Fragment } from "react";
import { getBroadcastDetail, testSmsSend } from "@/lib/api/smsBroadcast";

function StatusBadge({ stats = {} }) {
  const pending = stats.PENDING || 0;
  const sent = stats.SENT || 0;
  const failed = stats.FAILED || 0;

  if (pending > 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
      Дарагдаж байна
    </span>
  );
  if (failed > 0 && sent === 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
      Амжилтгүй
    </span>
  );
  if (failed > 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fff7ed", color: "#c2410c", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
      Хэсэгчилсэн
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
      Дууссан
    </span>
  );
}

function TestSmsPanel({ token }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Ayo test мессеж");
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleTest() {
    if (!phone || !message) return;
    setState("sending");
    setError(null);
    setResult(null);
    const res = await testSmsSend({ phone, message }, token);
    if (res.success) {
      setState("done");
      setResult(res.data);
    } else {
      setState("error");
      setError(res.error || "Алдаа гарлаа");
    }
  }

  return (
    <div style={{ border: "1px solid #fef3c7", borderRadius: "10px", background: "#fffbeb", padding: "16px 20px", marginBottom: "20px" }}>
      <div style={{ fontWeight: 700, fontSize: "13px", color: "#92400e", marginBottom: "12px" }}>
        🔧 SMS тест илгээх (алдааг оношлох)
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>Утасны дугаар</div>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="94000000"
            style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", width: "140px" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>Мессеж</div>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", width: "100%" }}
          />
        </div>
        <button
          onClick={handleTest}
          disabled={state === "sending" || !phone}
          style={{ padding: "7px 16px", borderRadius: "6px", background: state === "sending" ? "#9ca3af" : "#d97706", color: "#fff", fontWeight: 600, fontSize: "13px", border: "none", cursor: state === "sending" ? "not-allowed" : "pointer" }}
        >
          {state === "sending" ? "Илгээж байна…" : "Тест илгээх"}
        </button>
      </div>
      {state === "done" && (
        <div style={{ marginTop: "10px", padding: "8px 12px", background: "#dcfce7", borderRadius: "6px", fontSize: "12px", color: "#166534" }}>
          ✅ Амжилттай илгээгдлээ — {JSON.stringify(result)}
        </div>
      )}
      {state === "error" && (
        <div style={{ marginTop: "10px", padding: "8px 12px", background: "#fee2e2", borderRadius: "6px", fontSize: "12px", color: "#991b1b" }}>
          ❌ Алдаа: {error}
        </div>
      )}
    </div>
  );
}

function BroadcastDetail({ broadcastId, token }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBroadcastDetail(broadcastId, token).then(res => {
      if (res.success) setDetail(res.data);
      setLoading(false);
    });
  }, [broadcastId, token]);

  if (loading) return <div style={{ padding: "12px", fontSize: "13px", color: "#9ca3af" }}>Уншиж байна…</div>;
  if (!detail) return null;

  const errorLogs = (detail.logs || []).filter(l => l.errorMessage);
  const uniqueErrors = [...new Set(errorLogs.map(l => l.errorMessage))];

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
        {[
          { label: "Нийт", value: detail.targetCount, color: "#374151", bg: "#f3f4f6" },
          { label: "Явсан", value: detail.stats?.SENT || 0, color: "#15803d", bg: "#dcfce7" },
          { label: "Хүлээгдэж байна", value: detail.stats?.PENDING || 0, color: "#92400e", bg: "#fef3c7" },
          { label: "Хязгаарлагдсан", value: detail.stats?.RATE_LIMITED || 0, color: "#c2410c", bg: "#fff7ed" },
          { label: "Амжилтгүй", value: detail.stats?.FAILED || 0, color: "#991b1b", bg: "#fee2e2" },
          { label: "Орхигдсон", value: detail.skippedCount || 0, color: "#6b7280", bg: "#f9fafb" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ padding: "8px 14px", background: bg, borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px", fontSize: "13px", color: "#374151", lineHeight: "1.6", marginBottom: uniqueErrors.length > 0 ? "12px" : 0 }}>
        {detail.message}
      </div>

      {uniqueErrors.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontWeight: 700, fontSize: "12px", color: "#991b1b", marginBottom: "8px" }}>
            ⚠️ Алдааны мэдээлэл (CallPro хариу)
          </div>
          {uniqueErrors.map((err, i) => (
            <div key={i} style={{ fontFamily: "monospace", fontSize: "12px", color: "#7f1d1d", background: "#fff", border: "1px solid #fecaca", borderRadius: "4px", padding: "6px 10px", marginBottom: i < uniqueErrors.length - 1 ? "6px" : 0 }}>
              {err}
            </div>
          ))}
          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>
            Нийт {errorLogs.length} мессеж амжилтгүй болсон • CallPro API тохиргоог шалгана уу
          </div>
        </div>
      )}
    </div>
  );
}

export default function BroadcastHistory({ broadcasts, onRefresh, token }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="wg-box" style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "13px" }}>📊</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>Илгээлтийн түүх</div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>{broadcasts.length} кампани</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
        >
          <span>↻</span> Шинэчлэх
        </button>
      </div>

      <TestSmsPanel token={token} />

      {broadcasts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <div style={{ fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Илгээсэн мессеж байхгүй байна</div>
          <div style={{ fontSize: "13px", color: "#9ca3af" }}>Эхний кампаниа илгээсний дараа энд харагдана</div>
        </div>
      ) : (
        <div style={{ border: "1px solid #f0f0f0", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Кампани", "Огноо", "Мессеж", "Хүлээн авагч", "Явсан", "Амжилтгүй", "Төлөв"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b, i) => (
                <Fragment key={b.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    style={{ cursor: "pointer", background: expandedId === b.id ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { if (expandedId !== b.id) e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={(e) => { if (expandedId !== b.id) e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"; }}
                  >
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ fontWeight: 700, color: "#111827" }}>{b.title}</div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {new Date(b.createdAt).toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5", maxWidth: "200px" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>{b.message}</div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5", textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: "#374151" }}>{b.targetCount}</span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "#15803d" }}>{b.stats?.SENT || 0}</span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5", textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: (b.stats?.FAILED || 0) > 0 ? "#dc2626" : "#9ca3af" }}>
                        {b.stats?.FAILED || 0}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      <StatusBadge stats={b.stats} />
                    </td>
                  </tr>
                  {expandedId === b.id && (
                    <tr>
                      <td colSpan={7} style={{ background: "#f0f7ff", padding: "0" }}>
                        <div style={{ padding: "16px 20px", borderTop: "2px solid #bfdbfe" }}>
                          <BroadcastDetail broadcastId={b.id} token={token} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
