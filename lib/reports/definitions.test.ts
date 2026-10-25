import { describe, expect, it } from "vitest";
import { REPORTS, displayRow, exportRows, totalsRow } from "./definitions";

describe("report definitions", () => {
  it("every report has a title, an endpoint and columns with unique keys", () => {
    for (const [name, report] of Object.entries(REPORTS)) {
      expect(report.title, name).toBeTruthy();
      expect(report.endpoint, name).toBeTruthy();
      const keys = report.columns.map((c) => c.key);
      expect(new Set(keys).size, name).toBe(keys.length);
    }
  });

  it("a grouped report defaults to one of its own groupings", () => {
    for (const report of Object.values(REPORTS)) {
      if (report.groups.length > 0) expect(report.groups).toContain(report.defaultGroup);
    }
  });

  it("on screen money reads as ₮ and the channel as a word; the Excel rows keep the number", () => {
    const row = { label: "Төв", channel: "STORE", count: 3, gross: 50000, discounts: 0, returns: 5000, net: 45000, vat: 4090.9 };
    const shown = displayRow(REPORTS.sales, row);
    expect(shown.net).toBe("45,000₮");
    expect(shown.channel).toBe("Дэлгүүр");
    const [exported] = exportRows(REPORTS.sales, [row]);
    expect(exported.net).toBe(45000);
    expect(exported.channel).toBe("Дэлгүүр");
  });

  it("the totals row says Нийт in the first column and leaves a column with no total blank", () => {
    const totals = totalsRow(REPORTS.sales, { count: 3, net: 45000 });
    expect(totals.label).toBe("Нийт");
    expect(totals.net).toBe(45000);
    expect(totals.channel).toBe("");
  });

  it("a missing percentage reads as a dash, not null", () => {
    expect(displayRow(REPORTS.margin, { label: "x", net: 0, cost: 0, margin: 0, marginPct: null, linesMissingCost: 0 }).marginPct).toBe("—");
  });

  it("adjustment reasons read in Mongolian", () => {
    expect(displayRow(REPORTS.adjustments, { label: "TESTER", units: -2, value: -12000 }).label).toBe("Тестер");
  });
});
