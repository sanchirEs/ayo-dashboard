import { describe, expect, it } from "vitest";
import { repairRisk } from "./repair";

const NOW = Date.parse("2026-11-03T05:31:00Z");
const register = {
  name: "Dell",
  locationName: "Соёолж төв",
  active: true,
  pairedAt: "2026-10-29T03:00:00Z",
  lastSeenAt: "2026-11-03T05:30:41Z",
};

describe("repairRisk: what a new code for an already-paired till would do", () => {
  it("a till that has never been paired has nothing to lose", () => {
    expect(repairRisk({ ...register, pairedAt: null, lastSeenAt: null }, NOW)).toBeNull();
  });

  it("a closed till gets no code at all", () => {
    expect(repairRisk({ ...register, active: false }, NOW)).toBeNull();
  });

  // 2026-11-03: a code for Соёолж's "Dell" was used on an office Mac and the shop till went dark for hours.
  it("a till seen minutes ago is in use right now", () => {
    expect(repairRisk(register, NOW)).toEqual({ live: true });
  });

  it("a till not seen for a while still has a computer that will stop working", () => {
    expect(repairRisk({ ...register, lastSeenAt: "2026-11-01T05:30:00Z" }, NOW)).toEqual({ live: false });
  });

  it("a paired till that has never pinged is not called live", () => {
    expect(repairRisk({ ...register, lastSeenAt: null }, NOW)).toEqual({ live: false });
  });
});
