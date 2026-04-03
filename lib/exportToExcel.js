import * as XLSX from "xlsx";

/**
 * Export an array of row objects to an .xlsx file and trigger download.
 * @param {Array<Record<string, any>>} rows  – flat array of objects (keys = column headers)
 * @param {string} filename – file name without extension
 */
export function exportToExcel(rows, filename = "export") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
