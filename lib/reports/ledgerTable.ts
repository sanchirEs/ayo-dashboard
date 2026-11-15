/**
 * Browser-side logic for the "Бүх гүйлгээ" tables: search, per-column filters, sort, and
 * the per-branch summary sheet. Pure functions over the rows the ledger endpoints return.
 */

import { cellText, LedgerColumn, METHOD_LABELS, METHODS, sortKey, TabKey } from "./ledgerColumns";

type Row = Record<string, unknown>;

const SEARCHABLE = new Set(["text", "enum", "int"]);

/** Rows where any text-like column contains `q` (case-insensitive, on what the table shows). */
export function searchRows<T extends Row>(rows: T[], columns: LedgerColumn[], q: string): T[] {
  const needle = q.trim().toLocaleLowerCase();
  if (!needle) return rows;
  const cols = columns.filter((c) => SEARCHABLE.has(c.type));
  return rows.filter((row) => cols.some((c) => cellText(c, row[c.key]).toLocaleLowerCase().includes(needle)));
}

const COMPARE = /^\s*(>=|<=|>|<|=)\s*(-?[\d,.\s]+)\s*$/;
const NUMERIC = new Set(["money", "int", "vat", "pct"]);

function matches(col: LedgerColumn, value: unknown, filter: string): boolean {
  // "CARD + CASH" (several methods) matches either method.
  if (col.type === "enum" && col.pick && col.labels && filter in col.labels) return String(value ?? "").split(" + ").includes(filter);
  if (col.pick && col.type !== "enum") return cellText(col, value) === filter;
  if (NUMERIC.has(col.type)) {
    const m = COMPARE.exec(filter);
    if (m) {
      if (value === null || value === undefined || value === "") return false;
      const n = Number(value);
      const target = Number(m[2].replace(/[,\s]/g, ""));
      if (m[1] === ">") return n > target;
      if (m[1] === "<") return n < target;
      if (m[1] === ">=") return n >= target;
      if (m[1] === "<=") return n <= target;
      return n === target;
    }
    return String(value ?? "").includes(filter.replace(/[,\s]/g, ""));
  }
  return cellText(col, value).toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase());
}

/**
 * Keeps rows passing every non-empty filter. Numbers take >, <, >=, <=, = or a substring;
 * dropdown (pick) columns match exactly; text matches as a substring.
 */
export function applyColumnFilters<T extends Row>(rows: T[], columns: LedgerColumn[], filters: Record<string, string>): T[] {
  const active = columns.filter((c) => (filters[c.key] ?? "").trim() !== "");
  if (active.length === 0) return rows;
  return rows.filter((row) => active.every((c) => matches(c, row[c.key], filters[c.key])));
}

/** A sorted copy; empty values always last. */
export function sortRows<T extends Row>(rows: T[], col: LedgerColumn, dir: "asc" | "desc"): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, k: sortKey(col, row[col.key]) }))
    .sort((a, b) => {
      if (a.k === null && b.k === null) return a.i - b.i;
      if (a.k === null) return 1;
      if (b.k === null) return -1;
      if (a.k < b.k) return -sign;
      if (a.k > b.k) return sign;
      return a.i - b.i;
    })
    .map((x) => x.row);
}

// --- Салбараар (per-branch summary) ---------------------------------------------------

const m = (key: string, header: string, explain: string): LedgerColumn => ({ key, header, type: "money", explain });
const n = (key: string, header: string, explain: string): LedgerColumn => ({ key, header, type: "int", explain });

export const SUMMARY_COLUMNS: LedgerColumn[] = [
  { key: "locationName", header: "Салбар", type: "text", explain: "Салбар. Сүүлийн мөр нь бүх салбарын нийт." },
  n("receipts", "Баримт", "Гүйцэтгэсэн баримтын тоо."),
  n("voided", "Хүчингүй баримт", "Хүчингүй болсон баримтын тоо (дүнд ороогүй)."),
  m("total", "Борлуулалт", "Гүйцэтгэсэн баримтын нийт дүн."),
  m("allDiscount", "Хөнгөлөлт", "Хямдрал болон гар хөнгөлөлт."),
  m("cargo", "Карго", "Кассаар авсан карго."),
  m("refunded", "Буцаалт", "Эдгээр баримтаас хугацааны төгсгөл хүртэл буцаасан."),
  m("netAfterReturns", "Цэвэр борлуулалт", "Борлуулалт минус буцаалт."),
  { key: "vatCharged", header: "НӨАТ (баримтад)", type: "vat", explain: "И-баримт гарсан баримтын НӨАТ." },
  { key: "vatCalculated", header: "НӨАТ (тооцоолсон 1/11)", type: "vat", explain: "Систем бодсон НӨАТ." },
  m("cost", "Өртөг", "Өртөг нь тодорхой баримтуудын өртөг."),
  m("profit", "Ашиг", "Өртөг нь тодорхой баримтуудын ашиг."),
  n("noCost", "Өртөггүй баримт", "Өртөг тодорхойгүй тул өртөг, ашигт ороогүй баримтын тоо."),
  ...METHODS.map((k) => m(`pay${k}`, METHOD_LABELS[k], `${METHOD_LABELS[k]}-аар авсан мөнгө, буцаалт хасагдсан.`)),
  m("variance", "Ээлжийн зөрүү", "Ээлжүүдийн тоолсон минус байх ёстой бэлэн."),
  m("cashIn", "Кассанд нэмсэн", "Ээлжийн дунд нэмсэн бэлэн."),
  m("cashOut", "Кассаас гаргасан", "Ээлжийн дунд гаргасан бэлэн."),
  n("handovers", "Онлайн захиалга олгосон", "Касс дээр олгосон вэбсайтын захиалга."),
  m("handoverTotal", "Олгосон захиалгын дүн", "Вэбсайтаар аль хэдийн төлөгдсөн."),
];

const num = (v: unknown) => (v === null || v === undefined || v === "" ? 0 : Number(v));

/** One row per branch (by name), then a "Нийт" row. Input rows are already filtered. */
export function branchSummary(tabs: Record<TabKey, Row[]>): Row[] {
  const by = new Map<string, Row>();
  const row = (name: unknown) => {
    const key = String(name ?? "—");
    if (!by.has(key)) by.set(key, Object.fromEntries(SUMMARY_COLUMNS.map((c) => [c.key, c.key === "locationName" ? key : 0])));
    return by.get(key)!;
  };
  const add = (r: Row, key: string, v: unknown) => {
    r[key] = num(r[key]) + num(v);
  };

  for (const s of tabs.receipts ?? []) {
    const r = row(s.locationName);
    if (s.status !== "COMPLETED") {
      add(r, "voided", 1);
      continue;
    }
    add(r, "receipts", 1);
    for (const k of ["total", "allDiscount", "cargo", "refunded", "netAfterReturns", "vatCharged", "vatCalculated"]) add(r, k, s[k]);
    if (s.cost !== null && s.cost !== undefined) {
      add(r, "cost", s.cost);
      add(r, "profit", s.profit);
    } else add(r, "noCost", 1);
  }
  for (const p of tabs.payments ?? []) if (p.counted) add(row(p.locationName), `pay${p.method}`, p.amount);
  for (const s of tabs.shifts ?? []) add(row(s.locationName), "variance", s.variance);
  for (const c of tabs.cash ?? []) {
    if (c.type === "IN") add(row(c.locationName), "cashIn", c.amount);
    if (c.type === "OUT") add(row(c.locationName), "cashOut", c.amount);
  }
  for (const h of tabs.handovers ?? []) {
    const r = row(h.locationName);
    add(r, "handovers", 1);
    add(r, "handoverTotal", h.orderTotal);
  }

  const rows = [...by.values()].sort((a, b) => String(a.locationName).localeCompare(String(b.locationName)));
  const total: Row = { locationName: "Нийт" };
  for (const c of SUMMARY_COLUMNS) if (c.key !== "locationName") total[c.key] = rows.reduce((a, r) => a + num(r[c.key]), 0);
  for (const k of ["vatCharged", "vatCalculated"]) {
    for (const r of [...rows, total]) r[k] = Math.round(num(r[k]) * 100) / 100;
  }
  return [...rows, total];
}
