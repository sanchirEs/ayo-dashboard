import { describe, expect, it } from "vitest";
import {
  ADJUSTMENT_REASONS,
  adjustmentSign,
  countDiffRows,
  discrepancyLabel,
  formatDateTime,
  movementReasonLabel,
  receiveLinesFor,
  signed,
  STOCK_REASONS,
} from "./labels";

describe("movementReasonLabel", () => {
  it("has a Mongolian word for every reason the ledger can write", () => {
    for (const reason of STOCK_REASONS) {
      const label = movementReasonLabel(reason);
      expect(label, reason).not.toBe(reason);
      expect(label.length).toBeGreaterThan(2);
    }
  });

  it("shows the adjustment's own reason when there is one", () => {
    expect(movementReasonLabel("ADJUSTMENT", "TESTER")).toBe("Залруулга: Тестер");
    expect(movementReasonLabel("SALE")).toBe("Борлуулалт");
  });

  it("falls back to the raw code rather than hiding an unknown reason", () => {
    expect(movementReasonLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});

describe("signed", () => {
  it("puts a plus on gains and keeps the minus on losses", () => {
    expect(signed(5)).toBe("+5");
    expect(signed(-3)).toBe("-3");
    expect(signed(0)).toBe("0");
  });
});

describe("adjustmentSign", () => {
  it("makes FOUND add stock and every other reason take it out", () => {
    expect(adjustmentSign("FOUND")).toBe(1);
    for (const reason of ADJUSTMENT_REASONS.filter((r) => r !== "FOUND")) expect(adjustmentSign(reason)).toBe(-1);
  });
});

describe("receiveLinesFor", () => {
  const lines = [
    { id: "a", variantId: 1, qtySent: 10, qtyReceived: null, discrepancy: null },
    { id: "b", variantId: 2, qtySent: 4, qtyReceived: null, discrepancy: null },
  ];

  it("defaults every line to the quantity that was sent", () => {
    expect(receiveLinesFor(lines, {})).toEqual([
      { lineId: "a", qtyReceived: 10 },
      { lineId: "b", qtyReceived: 4 },
    ]);
  });

  it("asks for a reason only on a short line, and carries the surplus through without one", () => {
    const out = receiveLinesFor(lines, { a: { qty: 7, discrepancy: "LOST" }, b: { qty: 6, discrepancy: "LOST" } });
    expect(out).toEqual([
      { lineId: "a", qtyReceived: 7, discrepancy: "LOST" },
      { lineId: "b", qtyReceived: 6 },
    ]);
  });
});

describe("countDiffRows", () => {
  it("lists only the lines where the count differs from what the system expected", () => {
    const rows = countDiffRows([
      { id: "1", variantId: 1, counted: 5, expectedAtCount: 5 },
      { id: "2", variantId: 2, counted: 3, expectedAtCount: 8 },
      { id: "3", variantId: 3, counted: 9, expectedAtCount: 7 },
    ]);
    expect(rows.map((r) => [r.variantId, r.diff])).toEqual([
      [2, -5],
      [3, 2],
    ]);
  });
});

describe("discrepancyLabel", () => {
  it("names the three ways a transfer can come up short or long", () => {
    expect(discrepancyLabel("LOST")).toBe("Алдагдсан");
    expect(discrepancyLabel("AT_SOURCE")).toBe("Илгээгч салбарт үлдсэн");
    expect(discrepancyLabel("SURPLUS_FOUND")).toBe("Илүү олдсон");
    expect(discrepancyLabel(null)).toBe("");
  });
});

describe("formatDateTime", () => {
  it("writes year-month-day and 24-hour time in the viewer's zone, whatever locale the browser has", () => {
    expect(formatDateTime(new Date(2026, 9, 25, 18, 5).toISOString())).toBe("2026-10-25 18:05");
    expect(formatDateTime(new Date(2026, 0, 3, 0, 0).toISOString())).toBe("2026-01-03 00:00");
  });

  it("shows a dash for a missing or invalid time", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("not a date")).toBe("—");
  });
});
