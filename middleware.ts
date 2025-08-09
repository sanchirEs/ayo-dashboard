import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  vendorRoutes,
  adminRoutes,
  authRoutes,
  apiAuthPrefix,
} from "@/routes";
import { isAdmin, isVendor } from "@/lib/auth-utils";
// Ensure middleware also trusts the host and uses the same secret in production
const { auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute = adminRoutes.includes(nextUrl.pathname);
  const isVendorRoute = vendorRoutes.includes(nextUrl.pathname);
  
  // Allow API auth routes to pass through
  if (isApiAuthRoute) return null;
  
  // Handle authentication routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }
  
  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
  
  // Role-based access control
  if (isAdminRoute) {
    if (!isAdmin(userRole)) {
      return Response.redirect(new URL("/unauthorized", nextUrl));
    }
  }
  
  if (isVendorRoute) {
    if (!isVendor(userRole)) {
      return Response.redirect(new URL("/unauthorized", nextUrl));
    }
  }
  
  return null;
});

export const config = {
  //Matcher таарвал дээд талын middleware код ажиллана.
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
