/**
 * Excel export for the report pages (POS Plan 6). Runs in the browser, from the same
 * rows the table shows, so what is on screen is what lands in the file. Money stays a
 * number (a person can sum it); a missing value is an empty cell, never the word "null".
 */

import * as XLSX from "xlsx";

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
