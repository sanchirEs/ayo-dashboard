import { describe, expect, it } from "vitest";
import { agingLabel, deliveryStatusLabel, formatMnt, paymentMethodLabel } from "./format";

describe("formatMnt", () => {
  it("groups thousands and appends ₮", () => {
    expect(formatMnt(8121000)).toBe("8,121,000₮");
    expect(formatMnt(0)).toBe("0₮");
  });

  it("keeps the sign of a credit balance", () => {
    expect(formatMnt(-50000)).toBe("-50,000₮");
  });

  it("shows a dash for a missing amount", () => {
    expect(formatMnt(null)).toBe("—");
  });
});

describe("labels", () => {
  it("names every падаан status in Mongolian", () => {
    expect(deliveryStatusLabel("DRAFT")).toBe("Ноорог");
    expect(deliveryStatusLabel("SENT")).toBe("Илгээсэн");
    expect(deliveryStatusLabel("CONFIRMED")).toBe("Баталгаажсан");
    expect(deliveryStatusLabel("DISPUTED")).toBe("Маргаантай");
  });

  it("names the aging buckets", () => {
    expect(agingLabel("current")).toBe("0–30 хоног");
    expect(agingLabel("d31_60")).toBe("31–60 хоног");
    expect(agingLabel("d61_90")).toBe("61–90 хоног");
    expect(agingLabel("d90plus")).toBe("90+ хоног");
  });

  it("names payment methods", () => {
    expect(paymentMethodLabel("CASH")).toBe("Бэлэн");
    expect(paymentMethodLabel("BANK_TRANSFER")).toBe("Дансаар");
  });
});
