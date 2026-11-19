import { describe, it, expect } from "vitest";
import { basketProblem, differenceLabel, money, parseMoney, shortLines, suggestedShipping, totals, transferKey, type OrderLine } from "./totals";

const line = (over: Partial<OrderLine> = {}): OrderLine => ({
  variantId: 11,
  name: "Шар маск",
  variantLabel: "",
  sku: "MASK-1",
  quantity: 1,
  unitPrice: 22500,
  isImported: false,
  cargoOnTop: 0,
  available: 10,
  imageUrl: null,
  ...over,
});

describe("totals", () => {
  it("adds goods, cargo on top and delivery, and compares with what was paid", () => {
    const lines = [line({ quantity: 2 }), line({ variantId: 21, unitPrice: 20000, quantity: 2, isImported: true, cargoOnTop: 3000, available: null })];
    expect(totals(lines, 7500, 100000)).toEqual({ subtotal: 85000, cargo: 6000, shipping: 7500, total: 98500, paid: 100000, difference: 1500 });
  });

  it("is zero for an empty order", () => {
    expect(totals([], 0, 0)).toEqual({ subtotal: 0, cargo: 0, shipping: 0, total: 0, paid: 0, difference: 0 });
  });

  it("reports a short transfer as a negative difference", () => {
    expect(totals([line({ quantity: 2 })], 7500, 45000).difference).toBe(-7500);
  });
});

describe("suggestedShipping", () => {
  it("is the district rate below the free-delivery threshold", () => {
    expect(suggestedShipping(199999, 7500, 200000)).toBe(7500);
  });
  it("is free at the threshold", () => {
    expect(suggestedShipping(200000, 7500, 200000)).toBe(0);
  });
  it("ignores a threshold of 0, which means the rule is off", () => {
    expect(suggestedShipping(5000000, 7500, 0)).toBe(7500);
  });
});

describe("differenceLabel", () => {
  it("names the three cases", () => {
    expect(differenceLabel(0)).toEqual({ tone: "even", text: "Зөрүүгүй" });
    expect(differenceLabel(-7500)).toEqual({ tone: "short", text: "7,500₮ дутуу" });
    expect(differenceLabel(1500)).toEqual({ tone: "over", text: "1,500₮ илүү" });
  });
});

describe("basketProblem", () => {
  it("allows shelf goods alone and imports alone", () => {
    expect(basketProblem([line(), line({ variantId: 12 })])).toBeNull();
    expect(basketProblem([line({ isImported: true })])).toBeNull();
    expect(basketProblem([])).toBeNull();
  });
  it("refuses the two together", () => {
    expect(basketProblem([line(), line({ variantId: 21, isImported: true })])).toMatch(/нэг захиалгад/);
  });
});

describe("shortLines", () => {
  it("flags a line asking for more than Төв has free", () => {
    expect(shortLines([line({ quantity: 11 })]).map((l) => l.variantId)).toEqual([11]);
    expect(shortLines([line({ quantity: 10 })])).toEqual([]);
  });
  it("adds up the same product on two lines, and flags it once", () => {
    expect(shortLines([line({ quantity: 6 }), line({ quantity: 6, unitPrice: 20000 })])).toHaveLength(1);
  });
  it("never flags an import", () => {
    expect(shortLines([line({ isImported: true, available: null, quantity: 99 })])).toEqual([]);
  });
});

describe("money", () => {
  it("formats and parses what staff type", () => {
    expect(money(52500)).toBe("52,500₮");
    expect(parseMoney("52,500")).toBe(52500);
    expect(parseMoney("52 500₮")).toBe(52500);
    expect(parseMoney("0")).toBe(0);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("үнэгүй")).toBeNull();
  });
});

describe("transferKey", () => {
  it("tells two rows apart by tab, line and content", () => {
    const a = transferKey({ tabId: "bank", rowIndex: 5, fingerprint: "x" });
    expect(a).toBe("bank:5:x");
    expect(transferKey({ tabId: "bank", rowIndex: 6, fingerprint: "x" })).not.toBe(a);
  });
});
