import { type UserRole } from "@/types/next-auth";

/**
 * Central role-based access configuration for the dashboard.
 *
 * Restricted roles (currently only BRANCH) may reach ONLY the routes in their
 * allowlist. All other roles keep their existing access; admin/vendor route
 * gating is handled in middleware via adminRoutes/vendorRoutes.
 */

// Routes a BRANCH (store-location) account may access. Everything else is blocked.
export const BRANCH_ALLOWED_ROUTES = ["/pickup-pins"];

// Where each role lands after login, and where it is bounced when it hits a
// route it is not allowed to see.
export const ROLE_LANDING: Record<UserRole, string> = {
  CUSTOMER: "/login",
  VENDOR: "/order-list",
  ADMIN: "/order-list",
  SUPERADMIN: "/order-list",
  BRANCH: "/pickup-pins",
};

export function getLandingRoute(role: UserRole | undefined): string {
  if (!role) return "/login";
  return ROLE_LANDING[role] ?? "/order-list";
}

/** Roles that can only see their explicit allowlist of routes. */
export function isRestrictedRole(role: UserRole | undefined): boolean {
  return role === "BRANCH";
}

/** True if `role` is permitted to view `pathname`. */
export function canAccessRoute(
  role: UserRole | undefined,
  pathname: string
): boolean {
  if (role === "BRANCH") {
    return BRANCH_ALLOWED_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
  }
  // Non-restricted roles: access decided by the admin/vendor checks elsewhere.
  return true;
}
