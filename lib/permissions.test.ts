import { describe, it, expect } from "vitest";
import {
  canAccessRoute,
  isNonPagePath,
  shouldRedirectRestrictedRole,
  getLandingRoute,
  BRANCH_ALLOWED_ROUTES,
} from "./permissions";

// 2026-09-09: staff read every operational page and change nothing. These tests
// assert that model, replacing the ones that asserted the 2026-08-11 revocation.
// See docs/superpowers/specs/2026-09-09-staff-read-only-access-design.md
const STAFF_ROLES = [
  "BRANCH",
  "SHEET_PICKUP",
  "SHEET_DELIVERY",
  "SHEET_REFUND",
] as const;

/** Pages every staff role must be able to open. */
const VISIBLE_PAGES = [
  "/order-list",
  "/order-detail/2352",
  "/delivery",
  "/import-orders",
  "/pickup-orders",
  "/pickup-logs",
  "/sheet-payments",
  "/product-list",
  "/category-list",
  "/campaigns",
  "/retailers",
  "/all-user",
];

/** Pages no staff role may open: the owner's exclusions, then write-only pages. */
const HIDDEN_PAGES = [
  "/report",
  "/sales",
  "/setting",
  "/store-settings",
  "/sms-broadcast",
  "/add-new-user",
  "/create-role",
  "/add-product",
  "/new-campaign",
  "/edit-product/12",
  "/barcodes",
];

describe("canAccessRoute", () => {
  it("lets every staff role open every operational page", () => {
    for (const role of STAFF_ROLES) {
      for (const page of VISIBLE_PAGES) {
        expect(canAccessRoute(role, page), `${role} → ${page}`).toBe(true);
      }
    }
  });

  it("keeps every staff role out of the excluded and write-only pages", () => {
    for (const role of STAFF_ROLES) {
      for (const page of HIDDEN_PAGES) {
        expect(canAccessRoute(role, page), `${role} → ${page}`).toBe(false);
      }
    }
  });

  it("matches nested paths under an allowed page", () => {
    expect(canAccessRoute("BRANCH", "/order-detail/2352")).toBe(true);
    expect(canAccessRoute("BRANCH", "/sheet-payments/tabs/storepay")).toBe(true);
  });

  it("does not let an allowed prefix leak into a similarly named page", () => {
    // "/products" is allowed; "/product-orders" is allowed on its own merits,
    // but "/setting" must not be reachable via any prefix trick.
    expect(canAccessRoute("BRANCH", "/settings-export")).toBe(false);
    expect(canAccessRoute("BRANCH", "/all-users-export")).toBe(false);
  });

  it("gives all four roles the same view", () => {
    for (const page of [...VISIBLE_PAGES, ...HIDDEN_PAGES]) {
      const [first, ...rest] = STAFF_ROLES.map((r) => canAccessRoute(r, page));
      for (const other of rest) expect(other).toBe(first);
    }
  });

  it("does not restrict admin/vendor roles", () => {
    expect(canAccessRoute("ADMIN", "/all-user")).toBe(true);
    expect(canAccessRoute("SUPERADMIN", "/sheet-payments")).toBe(true);
    expect(canAccessRoute("VENDOR", "/anything")).toBe(true);
    expect(canAccessRoute("ADMIN", "/sms-broadcast")).toBe(true);
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
  // API paths stay exempt from *page* gating: page-gating an API call turns it
  // into a 302 the client reads as "Authentication failed" instead of the
  // backend's own 403. The backend enforces staff limits itself.
  it("never redirects API calls", () => {
    for (const role of STAFF_ROLES) {
      expect(
        shouldRedirectRestrictedRole(role, "/api/v1/orders/getorder/2352")
      ).toBe(false);
      expect(shouldRedirectRestrictedRole(role, "/api/v1/anything/at/all")).toBe(
        false
      );
      // Even a path the page gate hides must not be redirected as an API call —
      // the backend answers it, with a 403 if it must.
      expect(shouldRedirectRestrictedRole(role, "/api/v1/analytics/overview")).toBe(
        false
      );
    }
  });

  it("lets staff through to their operational pages", () => {
    for (const role of STAFF_ROLES) {
      for (const page of VISIBLE_PAGES) {
        expect(shouldRedirectRestrictedRole(role, page), `${role} → ${page}`).toBe(
          false
        );
      }
    }
  });

  it("bounces staff away from the excluded pages", () => {
    for (const role of STAFF_ROLES) {
      for (const page of HIDDEN_PAGES) {
        expect(shouldRedirectRestrictedRole(role, page), `${role} → ${page}`).toBe(
          true
        );
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
  it("lands every staff role on the order list", () => {
    for (const role of STAFF_ROLES) {
      expect(getLandingRoute(role)).toBe("/order-list");
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
  it("is the shared staff page list, including the /unauthorized dead end", () => {
    expect(BRANCH_ALLOWED_ROUTES).toContain("/order-list");
    expect(BRANCH_ALLOWED_ROUTES).toContain("/all-user");
    expect(BRANCH_ALLOWED_ROUTES).toContain("/unauthorized");
    expect(BRANCH_ALLOWED_ROUTES).not.toContain("/sms-broadcast");
  });
});
