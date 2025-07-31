import Credentials from "next-auth/providers/credentials";

import type { NextAuthConfig } from "next-auth";
import { InvalidLoginError } from "@/auth.errors";
export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          if (credentials?.credentialsMethod === "oauth") {
            const user = {
              accessToken: credentials.accessToken,
              userId: credentials.id,
              email: credentials.email,
              firstName: credentials.firstName,
              lastName: credentials.lastName,
              username: credentials.username,
              image: credentials.image,
              email_verified: credentials.email_verified,
              role: credentials.role,
            };

            return user;
          }
          return null;
        }
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: credentials?.identifier,
              password: credentials?.password,
            }),
          }
        );
        if (!res.ok) {
          const errorMessage = await res.json();
          throw new InvalidLoginError(errorMessage.message);
        }
        const data = await res.json();
        if (data.data) {
          return data.data;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.userId = user.userId;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.accessToken = token.accessToken;
        session.user.userId = token.userId;
        session.user.email = token.email;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.username = token.username;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
