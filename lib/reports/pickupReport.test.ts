import { describe, expect, it } from "vitest";
import { ageTone, daysBetween, itemsText, perDay, ubDate } from "./pickupReport";

describe("pickup report helpers", () => {
  it("dates are Ulaanbaatar days: 16:00Z is already tomorrow", () => {
    expect(ubDate("2026-11-25T15:59:00Z")).toBe("2026-11-25");
    expect(ubDate("2026-11-25T16:00:00Z")).toBe("2026-11-26");
    expect(ubDate(null)).toBeNull();
  });

  it("lists every day of the range, and nothing for a very long one", () => {
    expect(daysBetween("2026-11-24", "2026-11-26")).toEqual(["2026-11-24", "2026-11-25", "2026-11-26"]);
    expect(daysBetween("2026-01-01", "2026-12-31")).toEqual([]);
    expect(daysBetween("2026-11-26", "2026-11-24")).toEqual([]);
  });

  it("counts handovers and completed prepaid pickups per day", () => {
    const bars = perDay(
      "2026-11-24",
      "2026-11-25",
      [{ handedAt: "2026-11-24T03:00:00Z" }, { handedAt: "2026-11-24T17:00:00Z" }, { handedAt: "2026-11-01T03:00:00Z" }],
      [{ occurredAt: "2026-11-25T03:00:00Z", status: "COMPLETED" }, { occurredAt: "2026-11-25T04:00:00Z", status: "VOIDED" }],
    );
    expect(bars).toEqual([
      { date: "2026-11-24", handedOver: 1, prepaid: 0 },
      { date: "2026-11-25", handedOver: 1, prepaid: 1 },
    ]);
  });

  it("an order turns amber at 3 days and red at 7", () => {
    expect([0, 2, 3, 6, 7, 30].map(ageTone)).toEqual(["fresh", "fresh", "aging", "aging", "overdue", "overdue"]);
  });

  it("items read as one line, quantity only when more than one", () => {
    expect(itemsText([{ name: "Тос", qty: 1 }, { name: "Маск", qty: 3 }])).toBe("Тос, Маск ×3");
  });
});
