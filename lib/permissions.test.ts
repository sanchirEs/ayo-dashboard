import { describe, it, expect } from "vitest";
import {
  canAccessRoute,
  isNonPagePath,
  shouldRedirectRestrictedRole,
  getLandingRoute,
  BRANCH_ALLOWED_ROUTES,
} from "./permissions";

// 2026-08-11: all staff dashboard access was revoked. These tests now assert
// the revocation — every staff role is confined to the /unauthorized dead end.
// See docs/superpowers/specs/2026-08-11-revoke-staff-dashboard-access-design.md
const STAFF_ROLES = [
  "BRANCH",
  "SHEET_PICKUP",
  "SHEET_DELIVERY",
  "SHEET_REFUND",
] as const;

const REVOKED_PAGES = [
  "/sheet-payments",
  "/order-list",
  "/pickup-orders",
  "/order-detail/2352",
  "/all-user",
  "/setting",
  "/",
];

describe("canAccessRoute", () => {
  it("blocks every staff role from every dashboard page", () => {
    for (const role of STAFF_ROLES) {
      for (const page of REVOKED_PAGES) {
        expect(canAccessRoute(role, page)).toBe(false);
      }
    }
  });

  it("leaves each staff role exactly one reachable page: /unauthorized", () => {
    for (const role of STAFF_ROLES) {
      expect(canAccessRoute(role, "/unauthorized")).toBe(true);
    }
  });

  it("does not restrict admin/vendor roles", () => {
    expect(canAccessRoute("ADMIN", "/all-user")).toBe(true);
    expect(canAccessRoute("SUPERADMIN", "/sheet-payments")).toBe(true);
    expect(canAccessRoute("VENDOR", "/anything")).toBe(true);
  });
});

describe("isNonPagePath", () => {
  it("treats backend-proxied and framework paths as non-pages", () => {
    expect(isNonPagePath("/api/v1/orders/getorder/2352")).toBe(true);
    expect(isNonPagePath("/api/auth/session")).toBe(true);
    expect(isNonPagePath("/trpc/anything")).toBe(true);
  });

  it("treats normal dashboard routes as pages", () => {
    expect(isNonPagePath("/pickup-orders")).toBe(false);
    expect(isNonPagePath("/order-detail/2352")).toBe(false);
  });
});

describe("shouldRedirectRestrictedRole", () => {
  // API paths stay exempt from *page* gating even for a fully revoked role:
  // page-gating an API call turns it into a 302 the client reads as
  // "Authentication failed" instead of the backend's own 403.
  it("never redirects API calls, even for a fully revoked role", () => {
    for (const role of STAFF_ROLES) {
      expect(
        shouldRedirectRestrictedRole(role, "/api/v1/orders/getorder/2352")
      ).toBe(false);
      expect(shouldRedirectRestrictedRole(role, "/api/v1/anything/at/all")).toBe(
        false
      );
    }
  });

  it("redirects every staff role away from every dashboard page", () => {
    for (const role of STAFF_ROLES) {
      for (const page of REVOKED_PAGES) {
        expect(shouldRedirectRestrictedRole(role, page)).toBe(true);
      }
    }
  });

  // Guards against an infinite redirect loop: middleware bounces a blocked role
  // to getLandingRoute(role), so the landing page itself must not be blocked.
  it("does not redirect a staff role away from its own landing page", () => {
    for (const role of STAFF_ROLES) {
      expect(shouldRedirectRestrictedRole(role, getLandingRoute(role))).toBe(
        false
      );
    }
  });

  it("never redirects non-restricted roles", () => {
    expect(shouldRedirectRestrictedRole("ADMIN", "/setting")).toBe(false);
    expect(shouldRedirectRestrictedRole("VENDOR", "/all-user")).toBe(false);
  });
});

describe("getLandingRoute", () => {
  it("sends every staff role to /unauthorized", () => {
    for (const role of STAFF_ROLES) {
      expect(getLandingRoute(role)).toBe("/unauthorized");
    }
  });

  it("leaves admin/vendor landing pages untouched", () => {
    expect(getLandingRoute("ADMIN")).toBe("/order-list");
    expect(getLandingRoute("SUPERADMIN")).toBe("/order-list");
    expect(getLandingRoute("VENDOR")).toBe("/order-list");
  });

  it("falls back to /login when role is undefined", () => {
    expect(getLandingRoute(undefined)).toBe("/login");
  });
});

describe("BRANCH_ALLOWED_ROUTES", () => {
  it("no longer grants BRANCH any working page", () => {
    expect(BRANCH_ALLOWED_ROUTES).toEqual(["/unauthorized"]);
  });
});
