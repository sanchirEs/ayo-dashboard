import { describe, it, expect } from "vitest";
import {
  canAccessRoute,
  isNonPagePath,
  shouldRedirectRestrictedRole,
  getLandingRoute,
  BRANCH_ALLOWED_ROUTES,
} from "./permissions";

describe("canAccessRoute", () => {
  it("allows BRANCH to reach its allowlisted pages (and nested paths)", () => {
    expect(canAccessRoute("BRANCH", "/pickup-pins")).toBe(true);
    expect(canAccessRoute("BRANCH", "/pickup-orders")).toBe(true);
    expect(canAccessRoute("BRANCH", "/order-detail/2352")).toBe(true);
  });

  it("blocks BRANCH from non-allowlisted pages", () => {
    expect(canAccessRoute("BRANCH", "/all-user")).toBe(false);
    expect(canAccessRoute("BRANCH", "/setting")).toBe(false);
  });

  it("does not restrict non-BRANCH roles", () => {
    expect(canAccessRoute("ADMIN", "/all-user")).toBe(true);
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
  // Regression: a BRANCH client fetch to /api/v1/orders/getorder/:id was being
  // page-gated by middleware, producing a 302 the client read as
  // "Authentication failed. Please log in again." API paths must be exempt so
  // the backend (which authorizes BRANCH on this route) can answer.
  it("never redirects API calls, even for a restricted role on a non-allowlisted path", () => {
    expect(
      shouldRedirectRestrictedRole("BRANCH", "/api/v1/orders/getorder/2352")
    ).toBe(false);
    expect(
      shouldRedirectRestrictedRole("BRANCH", "/api/v1/anything/at/all")
    ).toBe(false);
  });

  it("redirects a restricted role away from non-allowlisted pages", () => {
    expect(shouldRedirectRestrictedRole("BRANCH", "/all-user")).toBe(true);
    expect(shouldRedirectRestrictedRole("BRANCH", "/setting")).toBe(true);
  });

  it("allows a restricted role to stay on its allowlisted pages", () => {
    for (const route of BRANCH_ALLOWED_ROUTES) {
      expect(shouldRedirectRestrictedRole("BRANCH", route)).toBe(false);
    }
  });

  it("never redirects non-restricted roles", () => {
    expect(shouldRedirectRestrictedRole("ADMIN", "/setting")).toBe(false);
    expect(shouldRedirectRestrictedRole("VENDOR", "/all-user")).toBe(false);
  });
});

describe("getLandingRoute", () => {
  it("sends BRANCH to its pickup-orders landing page", () => {
    expect(getLandingRoute("BRANCH")).toBe("/pickup-orders");
  });

  it("falls back to /login when role is undefined", () => {
    expect(getLandingRoute(undefined)).toBe("/login");
  });
});
