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

const { auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  
  // Skip API auth routes
  if (nextUrl.pathname.startsWith(apiAuthPrefix)) {
    return null;
  }
  
  // Handle auth routes (login, signup)
  if (authRoutes.includes(nextUrl.pathname)) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }
  
  // Require login for all other routes
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
  
  // Role-based access control
  if (adminRoutes.includes(nextUrl.pathname) && !isAdmin(userRole)) {
    return Response.redirect(new URL("/unauthorized", nextUrl));
  }
  
  if (vendorRoutes.includes(nextUrl.pathname) && !isVendor(userRole)) {
    return Response.redirect(new URL("/unauthorized", nextUrl));
  }
  
  return null;
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
