import { describe, expect, it } from "vitest";
import { LEDGER_TABS, cellText, cellValue, columnOf, ubParts } from "./ledgerColumns";

describe("ledger columns", () => {
  it("has the seven tabs in the spec's order", () => {
    expect(LEDGER_TABS.map((t) => t.key)).toEqual(["receipts", "lines", "payments", "returns", "shifts", "cash", "handovers"]);
  });

  it("every tab has unique keys and an explanation for every column", () => {
    for (const tab of LEDGER_TABS) {
      const keys = tab.columns.map((c) => c.key);
      expect(new Set(keys).size, tab.key).toBe(keys.length);
      for (const c of tab.columns) expect(c.explain.length, `${tab.key}.${c.key}`).toBeGreaterThan(0);
      expect(tab.sheet.length).toBeLessThanOrEqual(31);
    }
  });

  it("money exports as a number and shows grouped", () => {
    const col = columnOf("receipts", "total");
    expect(cellValue(col, 84000)).toBe(84000);
    expect(cellText(col, 84000)).toBe("84,000");
  });

  it("times are Ulaanbaatar time", () => {
    const col = columnOf("receipts", "occurredAt");
    expect(cellText(col, "2026-10-25T15:30:00.000Z")).toBe("2026-10-25 23:30");
    expect(ubParts("2026-10-25T16:30:00.000Z")).toMatchObject({ y: 2026, m: 10, d: 26, hh: 0, mi: 30 });
    const d = cellValue(col, "2026-10-25T15:30:00.000Z") as Date;
    // Local clock of the Date equals the UB clock, whatever the browser's zone.
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 10, 25, 23, 30]);
  });

  it("missing values are empty, never 'null'", () => {
    expect(cellText(columnOf("receipts", "customerPhone"), null)).toBe("");
    expect(cellValue(columnOf("receipts", "profit"), null)).toBe("");
  });

  it("enums show Mongolian labels, joined methods too", () => {
    expect(cellText(columnOf("receipts", "status"), "VOIDED")).toBe("Хүчингүй болсон");
    expect(cellValue(columnOf("receipts", "paymentMethods"), "CARD + CASH")).toBe("Карт + Бэлэн");
    expect(cellText(columnOf("payments", "kind"), "QPAY_UNMATCHED")).toBe("Баримтгүй QPay");
    expect(cellText(columnOf("receipts", "status"), "SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });

  it("booleans read Тийм / Үгүй", () => {
    expect(cellText(columnOf("returns", "restock"), true)).toBe("Тийм");
    expect(cellValue(columnOf("returns", "restock"), false)).toBe("Үгүй");
  });
});
