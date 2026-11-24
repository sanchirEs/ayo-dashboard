/**
 * Тооллогын тайлан: the row filters and the Excel columns, kept out of the page so
 * they can be tested. The page and the file show the same rows.
 */

import type { CountReportRow } from "@/lib/api/stock";

export type CountReportFilter = "ALL" | "DIFF" | "SHORT" | "OVER";

export const COUNT_REPORT_FILTERS: [CountReportFilter, string][] = [
  ["ALL", "Бүгд"],
  ["DIFF", "Зөрсөн"],
  ["SHORT", "Дутуу"],
  ["OVER", "Илүү"],
];

export function filterCountRows(rows: CountReportRow[], filter: CountReportFilter, search: string): CountReportRow[] {
  const term = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (filter === "DIFF" && r.diff === 0) return false;
    if (filter === "SHORT" && r.diff >= 0) return false;
    if (filter === "OVER" && r.diff <= 0) return false;
    if (!term) return true;
    return [r.name, r.variantLabel, r.sku, r.barcode, r.countNumber].some((v) => v && v.toLowerCase().includes(term));
  });
}

/** "2026-11-13 14:53" on the Ulaanbaatar clock. */
export function ubTime(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/** Today on the Ulaanbaatar clock, YYYY-MM-DD. */
export const ubToday = (now = new Date()) => ubTime(now.toISOString()).slice(0, 10);

export const COUNT_EXPORT_COLUMNS = [
  { key: "countNumber", header: "Тооллого" },
  { key: "countedAtText", header: "Тоолсон огноо" },
  { key: "barcode", header: "Баркод" },
  { key: "sku", header: "SKU" },
  { key: "title", header: "Бараа" },
  { key: "price", header: "Үнэ" },
  { key: "previousCountNumber", header: "Өмнөх тооллого" },
  { key: "previousCountedAtText", header: "Өмнөх тооллогын огноо" },
  { key: "opening", header: "Эхний үлдэгдэл" },
  { key: "received", header: "Орлого" },
  { key: "sold", header: "Зарлага (борлуулалт)" },
  { key: "transferIn", header: "Шилжүүлж ирсэн" },
  { key: "transferOut", header: "Шилжүүлж явуулсан" },
  { key: "other", header: "Бусад (залруулга, сет)" },
  { key: "unexplained", header: "Тайлбаргүй" },
  { key: "expected", header: "Системийн үлдэгдэл" },
  { key: "counted", header: "Тоолсон" },
  { key: "diff", header: "Зөрүү" },
  { key: "diffValue", header: "Зөрүү дүн" },
];

export const rowTitle = (r: Pick<CountReportRow, "name" | "variantLabel">) => (r.variantLabel ? `${r.name} · ${r.variantLabel}` : r.name);

export function exportRows(rows: CountReportRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    ...r,
    title: rowTitle(r),
    countedAtText: ubTime(r.countedAt),
    previousCountedAtText: ubTime(r.previousCountedAt),
  }));
}
