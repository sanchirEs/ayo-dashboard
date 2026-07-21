import { type UserRole } from "@/types/next-auth";

/**
 * Central role-based access configuration for the dashboard.
 *
 * Restricted roles (BRANCH, SHEET_PICKUP, SHEET_DELIVERY, SHEET_REFUND) may
 * reach ONLY the routes in their allowlist. All other roles keep their
 * existing access; admin/vendor route gating is handled in middleware via
 * adminRoutes/vendorRoutes.
 */

const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  BRANCH: ["/sheet-payments", "/order-list", "/pickup-orders", "/order-detail"],
  SHEET_PICKUP: ["/sheet-payments"],
  SHEET_DELIVERY: ["/sheet-payments"],
  SHEET_REFUND: ["/sheet-payments"],
};

// Kept as a named export for backward compatibility — lib/permissions.test.ts
// imports this directly.
export const BRANCH_ALLOWED_ROUTES = ROLE_ALLOWED_ROUTES.BRANCH!;

// Where each role lands after login, and where it is bounced when it hits a
// route it is not allowed to see.
export const ROLE_LANDING: Record<UserRole, string> = {
  CUSTOMER: "/login",
  VENDOR: "/order-list",
  ADMIN: "/order-list",
  SUPERADMIN: "/order-list",
  BRANCH: "/pickup-orders",
  SHEET_PICKUP: "/sheet-payments",
  SHEET_DELIVERY: "/sheet-payments",
  SHEET_REFUND: "/sheet-payments",
};

export function getLandingRoute(role: UserRole | undefined): string {
  if (!role) return "/login";
  return ROLE_LANDING[role] ?? "/order-list";
}

/** Roles that can only see their explicit allowlist of routes. */
export function isRestrictedRole(role: UserRole | undefined): boolean {
  return role !== undefined && role in ROLE_ALLOWED_ROUTES;
}

/** True if `role` is permitted to view `pathname`. */
export function canAccessRoute(
  role: UserRole | undefined,
  pathname: string
): boolean {
  const allowed = role ? ROLE_ALLOWED_ROUTES[role] : undefined;
  if (!allowed) {
    // Non-restricted roles: access decided by the admin/vendor checks elsewhere.
    return true;
  }
  return allowed.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

/**
 * Path prefixes that are NOT dashboard pages. These are proxied to the backend
 * (or framework internals) which enforce their own authorization. They must
 * NEVER be page-gated by role: doing so turns an otherwise-allowed request into
 * a 302 redirect that a client `fetch` reads as "Authentication failed".
 */
const NON_PAGE_PREFIXES = ["/api/", "/trpc/"];

export function isNonPagePath(pathname: string): boolean {
  return NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Middleware gate decision: should a restricted role (e.g. BRANCH,
 * SHEET_PICKUP) be bounced away from `pathname`? Only real *pages* are gated
 * — non-page paths (API/proxy) are exempt because the backend does its own
 * role authorization.
 *
 * Use this in middleware instead of calling `canAccessRoute` directly, so the
 * API exemption can't be accidentally dropped.
 */
export function shouldRedirectRestrictedRole(
  role: UserRole | undefined,
  pathname: string
): boolean {
  if (isNonPagePath(pathname)) return false;
  return !canAccessRoute(role, pathname);
}
