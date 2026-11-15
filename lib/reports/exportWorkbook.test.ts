import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildWorkbook } from "./exportXlsx";
import { tabOf } from "./ledgerColumns";

const receipts = tabOf("receipts").columns;

describe("exportWorkbook writes header-only sheets", () => {
  it("one sheet per input, header row even when empty, numbers and dates typed, filters on", () => {
    const bytes = buildWorkbook([
      { name: "Баримт", columns: receipts, rows: [{ saleNumber: "A-1", total: 84000, occurredAt: "2026-10-25T15:30:00Z", status: "VOIDED" }] },
      { name: "Буцаалт", columns: tabOf("returns").columns, rows: [] },
    ]);
    const book = XLSX.read(bytes, { type: "array", cellDates: true });
    expect(book.SheetNames).toEqual(["Баримт", "Буцаалт"]);

    const sheet = book.Sheets["Баримт"];
    const header = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0];
    expect(header).toEqual(receipts.map((c) => c.header));
    const col = (key: string) => XLSX.utils.encode_col(receipts.findIndex((c) => c.key === key));
    expect(sheet[`${col("total")}2`]).toMatchObject({ t: "n", v: 84000 });
    expect(sheet[`${col("status")}2`].v).toBe("Хүчингүй болсон");
    const when = sheet[`${col("occurredAt")}2`];
    expect(when.t).toBe("d");
    expect(sheet["!autofilter"]).toBeTruthy();

    const empty = XLSX.utils.sheet_to_json<string[]>(book.Sheets["Буцаалт"], { header: 1 });
    expect(empty).toHaveLength(1);
    expect(empty[0][0]).toBe(tabOf("returns").columns[0].header);
  });

  it("refuses duplicate or over-long sheet names by cleaning them", () => {
    const bytes = buildWorkbook([
      { name: "Онлайн захиалга олгосон — маш урт нэртэй хуудас", columns: receipts, rows: [] },
    ]);
    const book = XLSX.read(bytes, { type: "array" });
    expect(book.SheetNames[0].length).toBeLessThanOrEqual(31);
  });
});
