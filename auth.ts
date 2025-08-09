import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required when deployed behind proxies/load balancers (Railway, Fly, Nginx, etc.)
  trustHost: true,
  // Explicit secret for production; must be set in env as AUTH_SECRET
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  ...authConfig,
});
