"use client";

/**
 * One "Бүх гүйлгээ" tab: sortable headers (asc → desc → off), a filter row under them,
 * 100 rows a page, and a column picker remembered per tab in this browser. Inline px
 * styles on purpose: the Remos template's html{font-size:62.5%} shrinks rem utilities.
 */

import { useEffect, useMemo, useState } from "react";
import { C } from "@/components/pos/ui";
import { cellText } from "@/lib/reports/ledgerColumns";
import { sortRows } from "@/lib/reports/ledgerTable";

const PAGE = 100;
const NUMERIC = new Set(["money", "int", "vat", "pct"]);
const SIGNED = new Set(["money", "vat"]);

const readHidden = (tab, columns) => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(`ledgerCols:${tab}`) || "null");
    if (Array.isArray(saved)) return new Set(saved);
  } catch {
    /* private window or blocked storage: fall back to the defaults */
  }
  return new Set(columns.filter((c) => c.hidden).map((c) => c.key));
};

const filterInput = {
  width: "100%",
  minWidth: 70,
  padding: "5px 7px",
  fontSize: 13,
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  backgroundColor: "#fff",
  color: C.text,
  height: 30,
};

function ColumnPicker({ columns, hidden, onChange }) {
  const [open, setOpen] = useState(false);
  const shown = columns.length - hidden.size;
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ height: 32, padding: "0 12px", fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 6, backgroundColor: "#fff", color: C.text, cursor: "pointer" }}
      >
        Багана ({shown}/{columns.length})
      </button>
      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: 36, zIndex: 30, width: 280, maxHeight: 420, overflowY: "auto",
            backgroundColor: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(17,24,39,.12)", padding: 8,
          }}
        >
          <div style={{ display: "flex", gap: 8, padding: "4px 6px 8px", borderBottom: `1px solid ${C.line}`, marginBottom: 6 }}>
            <button type="button" onClick={() => onChange(new Set())} style={linkButton}>Бүгдийг харуулах</button>
            <button type="button" onClick={() => onChange(new Set(columns.filter((c) => c.hidden).map((c) => c.key)))} style={linkButton}>Анхны байдал</button>
          </div>
          {columns.map((c) => (
            <label key={c.key} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 6px", fontSize: 13, color: C.text, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!hidden.has(c.key)}
                onChange={(e) => {
                  const next = new Set(hidden);
                  if (e.target.checked) next.delete(c.key);
                  else next.add(c.key);
                  onChange(next);
                }}
              />
              {c.header}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const linkButton = { border: "none", background: "none", color: C.blue, fontSize: 13, cursor: "pointer", padding: 0 };

/** Dropdown choices for a pick column: its labels, or the distinct values in the rows. */
function choicesOf(col, rows) {
  if (col.type === "enum" && col.labels) {
    const present = new Set(rows.flatMap((r) => String(r[col.key] ?? "").split(" + ")));
    return Object.entries(col.labels).filter(([value]) => present.has(value));
  }
  const values = [...new Set(rows.map((r) => cellText(col, r[col.key])).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return values.map((v) => [v, v]);
}

export default function LedgerTable({ tab, columns, rows, allRows, filters, onFilters, onOpenSale, loading, empty }) {
  const [hidden, setHidden] = useState(() => new Set(columns.filter((c) => c.hidden).map((c) => c.key)));
  const [sort, setSort] = useState(null); // { key, dir }
  const [page, setPage] = useState(0);

  // Read the saved picker after mount (localStorage is not there during server render).
  useEffect(() => setHidden(readHidden(tab, columns)), [tab, columns]);
  useEffect(() => setPage(0), [rows, sort]);

  const saveHidden = (next) => {
    setHidden(next);
    try {
      window.localStorage.setItem(`ledgerCols:${tab}`, JSON.stringify([...next]));
    } catch {
      /* storage blocked: the choice lasts until reload */
    }
  };

  const visible = columns.filter((c) => !hidden.has(c.key));
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    return col ? sortRows(rows, col, sort.dir) : rows;
  }, [rows, sort, columns]);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const shown = sorted.slice(page * PAGE, page * PAGE + PAGE);
  const choices = useMemo(
    () => Object.fromEntries(columns.filter((c) => c.pick).map((c) => [c.key, choicesOf(c, allRows)])),
    [columns, allRows],
  );

  const cycleSort = (key) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  const activeFilters = Object.values(filters).filter((v) => v && v.trim()).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: C.muted }}>
          {sorted.length === 0 ? "0 мөр" : `${(page * PAGE + 1).toLocaleString("en-US")}–${Math.min(sorted.length, (page + 1) * PAGE).toLocaleString("en-US")} / ${sorted.length.toLocaleString("en-US")} мөр`}
        </span>
        {activeFilters > 0 && (
          <button type="button" onClick={() => onFilters({})} style={linkButton}>
            Баганын шүүлтүүр арилгах ({activeFilters})
          </button>
        )}
        <div style={{ flex: 1 }} />
        <ColumnPicker columns={columns} hidden={hidden} onChange={saveHidden} />
      </div>

      <div style={{ overflow: "auto", maxHeight: "70vh", border: `1px solid ${C.line}`, borderRadius: 8 }}>
        {/* As wide as its content (the box scrolls sideways): amounts and times are never cut. */}
        <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13, border: "none", fontVariantNumeric: "tabular-nums", tableLayout: "auto" }}>
          <thead>
            <tr>
              {visible.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    style={{ ...th, top: 0, textAlign: NUMERIC.has(c.type) ? "right" : "left" }}
                  >
                    <button
                      type="button"
                      onClick={() => cycleSort(c.key)}
                      title={c.explain}
                      style={{ border: "none", background: "none", padding: 0, font: "inherit", color: active ? C.text : C.muted, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {c.header}
                      <span aria-hidden style={{ display: "inline-block", width: 14, color: C.blue }}>{active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
            <tr>
              {visible.map((c) => (
                <th key={c.key} style={{ ...th, top: 41, padding: "6px 8px", backgroundColor: "#fafafa" }}>
                  {c.pick ? (
                    <select
                      value={filters[c.key] ?? ""}
                      onChange={(e) => onFilters({ ...filters, [c.key]: e.target.value })}
                      aria-label={`${c.header} шүүх`}
                      style={filterInput}
                    >
                      <option value="">Бүгд</option>
                      {(choices[c.key] || []).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={filters[c.key] ?? ""}
                      onChange={(e) => onFilters({ ...filters, [c.key]: e.target.value })}
                      placeholder={NUMERIC.has(c.type) ? ">0" : c.type === "datetime" ? "" : "…"}
                      aria-label={`${c.header} шүүх`}
                      disabled={c.type === "datetime"}
                      style={{ ...filterInput, textAlign: NUMERIC.has(c.type) ? "right" : "left", visibility: c.type === "datetime" ? "hidden" : "visible" }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={visible.length} style={{ padding: "28px 12px", textAlign: "center", color: C.faint, border: "none" }}>
                  {loading ? "Ачаалж байна…" : empty}
                </td>
              </tr>
            ) : (
              shown.map((row, i) => {
                const saleId = row.saleId;
                const dim = row.status === "VOIDED" || row.saleStatus === "VOIDED";
                const warn = row.kind === "QPAY_UNMATCHED";
                return (
                  <tr
                    key={`${page}-${i}`}
                    onClick={saleId && onOpenSale ? () => onOpenSale(saleId) : undefined}
                    style={{ cursor: saleId && onOpenSale ? "pointer" : "default", backgroundColor: warn ? C.amberBg : undefined }}
                    className="ledger-row"
                  >
                    {visible.map((c) => {
                      const v = row[c.key];
                      const negative = SIGNED.has(c.type) && Number(v) < 0;
                      const variance = c.key === "variance" && Number(v) !== 0 && v != null;
                      return (
                        <td
                          key={c.key}
                          style={{
                            padding: "8px 12px",
                            textAlign: NUMERIC.has(c.type) ? "right" : "left",
                            whiteSpace: "nowrap",
                            // Only long free text is shortened; the full text is in the tooltip.
                            maxWidth: c.type === "text" ? 280 : undefined,
                            overflow: c.type === "text" ? "hidden" : undefined,
                            textOverflow: c.type === "text" ? "ellipsis" : undefined,
                            color: negative ? C.red : variance && Number(v) > 0 ? C.green : dim ? C.faint : C.text,
                            textDecoration: dim && c.key === "total" ? "line-through" : undefined,
                            border: "none",
                            borderBottom: `1px solid ${C.grayBg}`,
                          }}
                          title={c.type === "text" ? cellText(c, v) : undefined}
                        >
                          {c.key === "saleNumber" && saleId ? <span style={{ color: C.blue }}>{cellText(c, v)}</span> : cellText(c, v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Хуудас" style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end", marginTop: 10, fontSize: 13 }}>
          <PageButton disabled={page === 0} onClick={() => setPage(0)}>Эхнийх</PageButton>
          <PageButton disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Өмнөх</PageButton>
          <span style={{ color: C.muted, padding: "0 6px" }}>{page + 1} / {pages}</span>
          <PageButton disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Дараах</PageButton>
          <PageButton disabled={page >= pages - 1} onClick={() => setPage(pages - 1)}>Сүүлийнх</PageButton>
        </nav>
      )}
      <style>{`.ledger-row:hover td { background-color: #f8fafc; }`}</style>
    </div>
  );
}

const th = {
  position: "sticky",
  zIndex: 2,
  backgroundColor: "#fff",
  padding: "11px 12px",
  fontSize: 13,
  border: "none",
  borderBottom: `1px solid ${C.line}`,
  whiteSpace: "nowrap",
  height: 41,
  boxSizing: "border-box",
};

function PageButton({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      style={{ height: 30, padding: "0 10px", fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 6, backgroundColor: "#fff", color: props.disabled ? C.faint : C.text, cursor: props.disabled ? "default" : "pointer" }}
    >
      {children}
    </button>
  );
}
