import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { exportXlsx, safeSheetName } from "./exportXlsx";

async function read(blob: Blob) {
  const book = XLSX.read(new Uint8Array(await blob.arrayBuffer()), { type: "array" });
  const name = book.SheetNames[0];
  return { name, sheet: book.Sheets[name] };
}

describe("exportXlsx", () => {
  const columns = [
    { key: "label", header: "Салбар" },
    { key: "net", header: "Цэвэр борлуулалт" },
    { key: "marginPct", header: "Ашгийн хувь" },
  ];
  const rows = [
    { label: "Төв", net: 1250000, marginPct: 42.5 },
    { label: "Хан-Уул", net: 850000, marginPct: null },
  ];

  it("Excel keeps money as numbers and uses Mongolian headers", async () => {
    const { sheet } = await read(exportXlsx({ sheetName: "Борлуулалт", columns, rows }));
    expect(sheet.A1.v).toBe("Салбар");
    expect(sheet.B1.v).toBe("Цэвэр борлуулалт");
    expect(sheet.B2).toMatchObject({ t: "n", v: 1250000 }); // a number a person can sum, not "1,250,000₮"
    expect(sheet.C2).toMatchObject({ t: "n", v: 42.5 });
    expect(sheet.A3.v).toBe("Хан-Уул");
  });

  it("leaves an empty cell for a missing value instead of the word null", async () => {
    const { sheet } = await read(exportXlsx({ sheetName: "Тайлан", columns, rows }));
    expect(sheet.C3 === undefined || sheet.C3.v === "" || sheet.C3.v === undefined).toBe(true);
  });

  it("is a real xlsx file", () => {
    const blob = exportXlsx({ sheetName: "Тайлан", columns, rows });
    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(blob.size).toBeGreaterThan(500);
  });

  it("exports a header row alone when there is nothing to list", async () => {
    const { sheet } = await read(exportXlsx({ sheetName: "Тайлан", columns, rows: [] }));
    expect(sheet.A1.v).toBe("Салбар");
    expect(sheet.A2).toBeUndefined();
  });
});

describe("safeSheetName", () => {
  it("drops the characters Excel refuses and keeps within 31 characters", () => {
    expect(safeSheetName("Борлуулалт/Ашиг: [өдөр]?*")).toBe("Борлуулалт Ашиг өдөр");
    expect(safeSheetName("а".repeat(40))).toHaveLength(31);
    expect(safeSheetName("")).toBe("Тайлан");
  });
});
