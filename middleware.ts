import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { 
  apiAuthPrefix, 
  authRoutes, 
  publicRoutes, 
  DEFAULT_LOGIN_REDIRECT,
  adminRoutes,
  vendorRoutes 
} from "./routes";

function isRoute(pathname: string, routes: string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Always allow NextAuth internals
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // Always allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  const session = await auth();

  const isAuthPage = isRoute(pathname, authRoutes);
  const isPublic = isRoute(pathname, publicRoutes);

  // If on login and already authenticated, send away
  if (isAuthPage && session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = DEFAULT_LOGIN_REDIRECT;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // If not authenticated and not public, require login
  if (!session?.user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = search ? `?next=${encodeURIComponent(pathname + search)}` : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Role-based access control for authenticated users
  if (session?.user) {
    const userRole = session.user.role;
    
    // Check admin routes
    if (isRoute(pathname, adminRoutes)) {
      if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    }

    // Check vendor routes
    if (isRoute(pathname, vendorRoutes)) {
      if (userRole !== "VENDOR" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next|assets|favicon.ico|.*\\.(?:css|js|png|jpg|svg)).*)"],
};
