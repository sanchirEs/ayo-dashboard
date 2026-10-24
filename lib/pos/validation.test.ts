import { describe, expect, it } from "vitest";
import {
  discountLimitError,
  formatCountdown,
  isValidPin,
  pinFormError,
  rangeError,
  roleLabel,
  secondsLeft,
} from "./validation";

describe("isValidPin", () => {
  it("accepts 4 to 6 digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("12345")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("0042")).toBe(true);
  });

  it("rejects anything else", () => {
    for (const bad of ["123", "1234567", "12a4", "12 34", "", "١٢٣٤"]) expect(isValidPin(bad)).toBe(false);
  });
});

describe("discountLimitError", () => {
  it("is null for whole numbers from 0 to 100", () => {
    for (const ok of [0, 5, 30, 100, "10", "0", "100"]) expect(discountLimitError(ok)).toBeNull();
  });

  it("explains the range for anything else", () => {
    for (const bad of [-1, 101, 5.5, Number.NaN, "", "abc", "10.5", null, undefined]) {
      expect(discountLimitError(bad as never)).toBe("0-100 хооронд бүхэл тоо");
    }
  });
});

describe("rangeError", () => {
  it("names the allowed range in the message", () => {
    expect(rangeError(3, 1, 60, "минут")).toBeNull();
    expect(rangeError(0, 1, 60, "минут")).toBe("1-60 хооронд бүхэл минут");
    expect(rangeError("x", 0, 365, "өдөр")).toBe("0-365 хооронд бүхэл өдөр");
  });
});

describe("pinFormError", () => {
  it("wants a valid PIN typed twice the same", () => {
    expect(pinFormError("4821", "4821")).toBeNull();
    expect(pinFormError("48", "48")).toBe("PIN 4-6 оронтой тоо байна");
    expect(pinFormError("4821", "4822")).toBe("PIN-үүд таарахгүй байна");
  });
});

describe("roleLabel", () => {
  it("names every till role in Mongolian", () => {
    expect(roleLabel("CASHIER")).toBe("Кассчин");
    expect(roleLabel("STOCK_KEEPER")).toBe("Нярав");
    expect(roleLabel("MANAGER")).toBe("Менежер");
    expect(roleLabel("OWNER")).toBe("Эзэмшигч");
  });
});

describe("pairing countdown", () => {
  const expires = "2026-11-08T03:10:00.000Z";

  it("counts whole seconds down to zero and never below", () => {
    expect(secondsLeft(expires, new Date("2026-11-08T03:00:00.000Z").getTime())).toBe(600);
    expect(secondsLeft(expires, new Date("2026-11-08T03:09:59.100Z").getTime())).toBe(1);
    expect(secondsLeft(expires, new Date("2026-11-08T03:10:00.000Z").getTime())).toBe(0);
    expect(secondsLeft(expires, new Date("2026-11-08T03:30:00.000Z").getTime())).toBe(0);
  });

  it("formats as m:ss", () => {
    expect(formatCountdown(600)).toBe("10:00");
    expect(formatCountdown(61)).toBe("1:01");
    expect(formatCountdown(9)).toBe("0:09");
    expect(formatCountdown(0)).toBe("0:00");
  });
});
