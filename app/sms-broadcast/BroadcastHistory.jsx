"use client";
import { useState, Fragment } from "react";

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

export default function BroadcastHistory({ broadcasts, onRefresh }) {
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
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                            {[
                              { label: "Нийт", value: b.targetCount, color: "#374151", bg: "#f3f4f6" },
                              { label: "Явсан", value: b.stats?.SENT || 0, color: "#15803d", bg: "#dcfce7" },
                              { label: "Хүлээгдэж байна", value: b.stats?.PENDING || 0, color: "#92400e", bg: "#fef3c7" },
                              { label: "Хязгаарлагдсан", value: b.stats?.RATE_LIMITED || 0, color: "#c2410c", bg: "#fff7ed" },
                              { label: "Амжилтгүй", value: b.stats?.FAILED || 0, color: "#991b1b", bg: "#fee2e2" },
                              { label: "Орхигдсон", value: b.skippedCount || 0, color: "#6b7280", bg: "#f9fafb" },
                            ].map(({ label, value, color, bg }) => (
                              <div key={label} style={{ padding: "8px 14px", background: bg, borderRadius: "8px", textAlign: "center" }}>
                                <div style={{ fontSize: "18px", fontWeight: 800, color }}>{value}</div>
                                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{label}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px", fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>
                            {b.message}
                          </div>
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
