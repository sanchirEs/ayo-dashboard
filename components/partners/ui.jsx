"use client";

/**
 * Small shared pieces for the partner pages. Inline px styles on purpose: the
 * Remos template sets html{font-size:62.5%}, which shrinks every rem-based
 * Tailwind size to two thirds.
 */

import { useEffect } from "react";
import { deliveryStatusLabel } from "@/lib/partners/format";

export const C = {
  text: "#111827",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#e5e7eb",
  blue: "#2563eb",
  red: "#dc2626",
  redBg: "#fee2e2",
  green: "#15803d",
  greenBg: "#dcfce7",
  amber: "#b45309",
  amberBg: "#fef3c7",
  grayBg: "#f3f4f6",
};

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 15,
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  outline: "none",
  color: C.text,
  backgroundColor: "#fff",
};

export const labelStyle = { display: "block", fontSize: 13, color: C.muted, marginBottom: 6 };

const STATUS_COLORS = {
  DRAFT: [C.grayBg, C.muted],
  SENT: ["#dbeafe", "#1d4ed8"],
  CONFIRMED: [C.greenBg, C.green],
  DISPUTED: [C.amberBg, C.amber],
};

export function StatusBadge({ status }) {
  const [bg, fg] = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 999, backgroundColor: bg, color: fg, fontSize: 13, whiteSpace: "nowrap" }}>
      {deliveryStatusLabel(status)}
    </span>
  );
}

export function Button({ kind = "primary", style, ...props }) {
  const look = {
    primary: { backgroundColor: C.blue, color: "#fff" },
    secondary: { backgroundColor: C.grayBg, color: "#374151" },
    danger: { backgroundColor: C.redBg, color: "#b91c1c" },
  }[kind];
  return (
    <button
      type="button"
      className="tf-button"
      style={{ padding: "9px 18px", fontSize: 15, opacity: props.disabled ? 0.5 : 1, ...look, ...style }}
      {...props}
    />
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div style={{ backgroundColor: "#fff", borderRadius: 12, width: "100%", maxWidth: width, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
          <div className="body-title">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, color: C.muted, overflow: "hidden" }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <div style={{ color: C.red, fontSize: 14, marginTop: 10 }}>{children}</div>;
}

/** Plain table with px sizing; `cols` = [{ key, label, align?, width? }]. */
export function Table({ cols, rows, empty, onRowClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, border: "none" }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: c.align || "left",
                  padding: "10px 12px",
                  color: C.muted,
                  fontWeight: 600,
                  // The template borders every cell; keep only the row rules.
                  border: "none",
                  borderBottom: `1px solid ${C.line}`,
                  whiteSpace: "nowrap",
                  width: c.width,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} style={{ padding: "22px 12px", textAlign: "center", color: C.faint, border: "none" }}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.key ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {cols.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: "10px 12px",
                      textAlign: c.align || "left",
                      color: C.text,
                      verticalAlign: "middle",
                      // Amounts stay on one line so the name column takes the slack.
                      whiteSpace: c.align === "right" ? "nowrap" : undefined,
                      border: "none",
                      borderBottom: `1px solid ${C.grayBg}`,
                    }}
                  >
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
