import { describe, expect, it } from "vitest";
import type { CountReportRow } from "@/lib/api/stock";
import { exportRows, filterCountRows, ubTime, ubToday } from "./countReport";

const row = (over: Partial<CountReportRow>): CountReportRow => ({
  countId: "c", countNumber: "ТО-000026", countStatus: "APPROVED", countedAt: "2026-11-13T06:53:00.000Z", variantId: 1,
  name: "Anua pad", variantLabel: "", sku: "A1", barcode: "880123", price: 1000, previousCountNumber: null, previousCountedAt: null,
  opening: 0, received: 0, sold: 0, transferIn: 0, transferOut: 0, other: 0, unexplained: 0, expected: 5, counted: 5, diff: 0, diffValue: 0, ...over,
});

describe("filterCountRows", () => {
  const rows = [row({ variantId: 1 }), row({ variantId: 2, name: "Medicube mask", diff: -2 }), row({ variantId: 3, diff: 4, barcode: "999" })];
  it("filters by difference", () => {
    expect(filterCountRows(rows, "ALL", "").map((r) => r.variantId)).toEqual([1, 2, 3]);
    expect(filterCountRows(rows, "DIFF", "").map((r) => r.variantId)).toEqual([2, 3]);
    expect(filterCountRows(rows, "SHORT", "").map((r) => r.variantId)).toEqual([2]);
    expect(filterCountRows(rows, "OVER", "").map((r) => r.variantId)).toEqual([3]);
  });
  it("searches name and barcode, ignoring case", () => {
    expect(filterCountRows(rows, "ALL", "medicube").map((r) => r.variantId)).toEqual([2]);
    expect(filterCountRows(rows, "ALL", "999").map((r) => r.variantId)).toEqual([3]);
  });
});

describe("times", () => {
  it("shows Ulaanbaatar time (UTC+8)", () => {
    expect(ubTime("2026-11-13T06:53:00.000Z")).toBe("2026-11-13 14:53");
    expect(ubTime(null)).toBe("");
    expect(ubToday(new Date("2026-11-23T17:00:00.000Z"))).toBe("2026-11-24");
  });
  it("export rows carry the title and readable dates", () => {
    const [r] = exportRows([row({ variantLabel: "70ш", previousCountedAt: "2026-10-30T02:00:00.000Z" })]);
    expect(r).toMatchObject({ title: "Anua pad · 70ш", countedAtText: "2026-11-13 14:53", previousCountedAtText: "2026-10-30 10:00" });
  });
});
