import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User & DefaultSession["user"];
  }
  interface User {
    userId: number;
    role: string;
    firstName: string;
    lastName: string;
    email_verified: boolean;
    accessToken: string;
    username: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: number;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    accessToken: string;
    username: string;
  }
}
