/**
 * Excel export for the report pages (POS Plan 6). Runs in the browser, from the same
 * rows the table shows, so what is on screen is what lands in the file. Money stays a
 * number (a person can sum it); a missing value is an empty cell, never the word "null".
 */

import * as XLSX from "xlsx";
import { cellValue, type LedgerColumn } from "./ledgerColumns";

export interface ExportColumn {
  key: string;
  header: string;
}

export interface ExportOptions {
  sheetName: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Excel refuses [ ] : * ? / \ in a sheet name and anything over 31 characters. */
export function safeSheetName(name: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || "Тайлан").slice(0, 31);
}

export function exportXlsx({ sheetName, columns, rows }: ExportOptions): Blob {
  const headers = columns.map((c) => c.header);
  const data = rows.map((row) =>
    Object.fromEntries(
      columns.map((c) => {
        const value = row[c.key];
        return [c.header, value === null || value === undefined ? "" : value];
      }),
    ),
  );
  const sheet = XLSX.utils.json_to_sheet(data, { header: headers });
  // A header-only sheet when there are no rows: json_to_sheet drops the header row for empty data.
  if (data.length === 0) XLSX.utils.sheet_add_aoa(sheet, [headers], { origin: "A1" });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, safeSheetName(sheetName));
  const bytes: ArrayBuffer = XLSX.write(book, { type: "array", bookType: "xlsx" });
  return new Blob([bytes], { type: XLSX_MIME });
}

/** Hands a Blob to the browser as a file download. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Multi-sheet workbook (Бүх гүйлгээ) ------------------------------------------------


export interface WorkbookSheet {
  name: string;
  columns: LedgerColumn[];
  rows: Record<string, unknown>[];
}

const FORMATS: Partial<Record<LedgerColumn["type"], string>> = {
  money: "#,##0",
  int: "0",
  vat: "#,##0.00",
  pct: "0.0",
  datetime: "yyyy-mm-dd hh:mm",
};

/**
 * The workbook's bytes: one sheet per entry, a header row even when there are no rows,
 * numbers as numbers, times as dates on the Ulaanbaatar clock, an autofilter on every sheet.
 */
export function buildWorkbook(sheets: WorkbookSheet[]): ArrayBuffer {
  const book = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const s of sheets) {
    const aoa = [s.columns.map((c) => c.header), ...s.rows.map((row) => s.columns.map((c) => cellValue(c, row[c.key])))];
    const sheet = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
    s.columns.forEach((col, ci) => {
      const z = FORMATS[col.type];
      if (!z) return;
      for (let ri = 1; ri <= s.rows.length; ri += 1) {
        const cell = sheet[XLSX.utils.encode_cell({ r: ri, c: ci })];
        if (cell && cell.v !== "") cell.z = z;
      }
    });
    sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(s.rows.length, 1), c: Math.max(s.columns.length - 1, 0) } }) };
    sheet["!cols"] = s.columns.map((c) => ({ wch: Math.min(40, Math.max(10, c.header.length + 2, c.type === "datetime" ? 17 : 0)) }));
    let name = safeSheetName(s.name);
    for (let i = 2; used.has(name); i += 1) name = safeSheetName(`${s.name.slice(0, 27)} ${i}`);
    used.add(name);
    XLSX.utils.book_append_sheet(book, sheet, name);
  }
  return XLSX.write(book, { type: "array", bookType: "xlsx", cellDates: true });
}

export function exportWorkbook(sheets: WorkbookSheet[]): Blob {
  return new Blob([buildWorkbook(sheets)], { type: XLSX_MIME });
}
