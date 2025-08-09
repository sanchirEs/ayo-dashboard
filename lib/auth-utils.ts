import { type UserRole } from "@/types/next-auth";

/**
 * Check if a user has any of the required roles
 */
export function hasRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Check if a user has admin privileges
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, ["ADMIN", "SUPERADMIN"]);
}

/**
 * Check if a user has vendor privileges (includes admin roles)
 */
export function isVendor(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, ["VENDOR", "ADMIN", "SUPERADMIN"]);
}

/**
 * Check if a user has super admin privileges
 */
export function isSuperAdmin(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, ["SUPERADMIN"]);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    CUSTOMER: "Customer",
    VENDOR: "Vendor",
    ADMIN: "Administrator",
    SUPERADMIN: "Super Administrator"
  };
  
  return roleNames[role] || "Unknown";
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    CUSTOMER: "bg-blue-100 text-blue-800",
    VENDOR: "bg-green-100 text-green-800", 
    ADMIN: "bg-purple-100 text-purple-800",
    SUPERADMIN: "bg-red-100 text-red-800"
  };
  
  return colors[role] || "bg-gray-100 text-gray-800";
}