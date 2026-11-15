import { describe, expect, it } from "vitest";
import { applyColumnFilters, branchSummary, SUMMARY_COLUMNS, searchRows, sortRows } from "./ledgerTable";
import { tabOf } from "./ledgerColumns";

const cols = tabOf("receipts").columns;
const rows = [
  { saleNumber: "A-1", total: 84000, status: "COMPLETED", cashierName: "Болор", customerPhone: null, occurredAt: "2026-11-01T02:00:00Z" },
  { saleNumber: "A-2", total: 12000, status: "VOIDED", cashierName: "Сараа", customerPhone: "99112233", occurredAt: "2026-11-01T01:00:00Z" },
  { saleNumber: "A-3", total: null, status: "COMPLETED", cashierName: "болор", customerPhone: "88000000", occurredAt: "2026-11-01T03:00:00Z" },
];

describe("column filters", () => {
  it("number comparisons", () => {
    expect(applyColumnFilters(rows, cols, { total: ">50000" }).map((r) => r.saleNumber)).toEqual(["A-1"]);
    expect(applyColumnFilters(rows, cols, { total: "<= 12000" }).map((r) => r.saleNumber)).toEqual(["A-2"]);
    expect(applyColumnFilters(rows, cols, { total: "=84000" }).map((r) => r.saleNumber)).toEqual(["A-1"]);
    expect(applyColumnFilters(rows, cols, { total: "12" }).map((r) => r.saleNumber)).toEqual(["A-2"]);
  });

  it("a text filter on a column with nulls does not throw", () => {
    expect(applyColumnFilters(rows, cols, { customerPhone: "9911" }).map((r) => r.saleNumber)).toEqual(["A-2"]);
  });

  it("enum filters match the value exactly", () => {
    expect(applyColumnFilters(rows, cols, { status: "VOIDED" }).map((r) => r.saleNumber)).toEqual(["A-2"]);
  });

  it("a method filter matches receipts paid several ways", () => {
    const paid = [{ saleNumber: "B-1", paymentMethods: "CARD + CASH" }, { saleNumber: "B-2", paymentMethods: "QPAY" }];
    expect(applyColumnFilters(paid, cols, { paymentMethods: "CASH" }).map((r) => r.saleNumber)).toEqual(["B-1"]);
  });

  it("empty filters keep everything", () => {
    expect(applyColumnFilters(rows, cols, { total: "", status: "" })).toHaveLength(3);
  });
});

describe("search", () => {
  it("matches any text column, ignoring case", () => {
    expect(searchRows(rows, cols, "болор").map((r) => r.saleNumber)).toEqual(["A-1", "A-3"]);
    expect(searchRows(rows, cols, "8800").map((r) => r.saleNumber)).toEqual(["A-3"]);
    expect(searchRows(rows, cols, "хүчингүй").map((r) => r.saleNumber)).toEqual(["A-2"]);
  });
});

describe("sort", () => {
  const total = cols.find((c) => c.key === "total")!;
  const when = cols.find((c) => c.key === "occurredAt")!;
  it("puts nulls last both ways", () => {
    expect(sortRows(rows, total, "asc").map((r) => r.saleNumber)).toEqual(["A-2", "A-1", "A-3"]);
    expect(sortRows(rows, total, "desc").map((r) => r.saleNumber)).toEqual(["A-1", "A-2", "A-3"]);
  });
  it("sorts times as times and does not mutate", () => {
    const copy = [...rows];
    expect(sortRows(rows, when, "asc").map((r) => r.saleNumber)).toEqual(["A-2", "A-1", "A-3"]);
    expect(rows).toEqual(copy);
  });
});

describe("branch summary", () => {
  it("one row per branch plus a total that sums them", () => {
    const out = branchSummary({
      receipts: [
        { locationName: "Төв", status: "COMPLETED", total: 20000, allDiscount: 1000, cargo: 0, refunded: 5000, netAfterReturns: 15000, vatCharged: 0, vatCalculated: 1818.18, cost: 12000, profit: 8000 },
        { locationName: "Төв", status: "VOIDED", total: 9000, allDiscount: 0, cargo: 0, refunded: 0, netAfterReturns: 0, vatCharged: 0, vatCalculated: 818.18, cost: null, profit: null },
        { locationName: "Соёолж", status: "COMPLETED", total: 30000, allDiscount: 0, cargo: 2000, refunded: 0, netAfterReturns: 30000, vatCharged: 2727.27, vatCalculated: 2727.27, cost: null, profit: null },
      ],
      lines: [],
      payments: [
        { locationName: "Төв", method: "CASH", amount: 20000, counted: true },
        { locationName: "Төв", method: "CASH", amount: -5000, counted: true },
        { locationName: "Соёолж", method: "QPAY", amount: 30000, counted: true },
        { locationName: "Соёолж", method: "QPAY", amount: 7000, counted: false },
      ],
      returns: [],
      shifts: [{ locationName: "Төв", variance: -2000 }],
      cash: [{ locationName: "Соёолж", type: "OUT", amount: 3000 }],
      handovers: [{ locationName: "Соёолж", orderTotal: 45000 }],
    });
    const by = Object.fromEntries(out.map((r) => [r.locationName, r]));
    expect(by["Төв"]).toMatchObject({ receipts: 1, voided: 1, total: 20000, refunded: 5000, netAfterReturns: 15000, payCASH: 15000, variance: -2000, profit: 8000 });
    expect(by["Соёолж"]).toMatchObject({ receipts: 1, total: 30000, payQPAY: 30000, cashOut: 3000, handovers: 1, handoverTotal: 45000, cargo: 2000 });
    expect(out[out.length - 1]).toMatchObject({ locationName: "Нийт", receipts: 2, total: 50000, netAfterReturns: 45000, payCASH: 15000, payQPAY: 30000 });
    // Receipts with no cost are counted, so a profit figure never looks complete when it is not.
    expect(by["Соёолж"]).toMatchObject({ noCost: 1, profit: 0 });
    expect(by["Төв"]).toMatchObject({ noCost: 0 });
    for (const key of Object.keys(out[0])) expect(SUMMARY_COLUMNS.some((c) => c.key === key), key).toBe(true);
  });
});
