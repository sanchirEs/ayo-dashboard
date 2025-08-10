import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

type BackendLoginResponse = {
  data: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    role?: string;
    image?: string;
    emailVerified?: boolean;
    accessToken: string;
  };
};

async function backendLogin(identifier: string, password: string): Promise<BackendLoginResponse> {
  const baseUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error("BACKEND_URL is not configured");
  }

  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Login failed");
  }

  return await res.json();
}

const config: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { 
        identifier: { label: "Email/Username", type: "text" }, 
        password: { label: "Password", type: "password" } 
      },
      async authorize(credentials) {
        const identifierStr = typeof (credentials as any)?.identifier === "string" ? (credentials as any).identifier : "";
        const passwordStr = typeof (credentials as any)?.password === "string" ? (credentials as any).password : "";
        if (!identifierStr || !passwordStr) return null;

        try {
          const { data } = await backendLogin(identifierStr, passwordStr);
          return {
            id: String(data.id),
            email: data.email,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            username: data.username || "",
            role: data.role || "CUSTOMER",
            image: data.image || "",
            emailVerified: data.emailVerified || false,
            accessToken: data.accessToken,
          } as any;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          role: (user as any).role,
          accessToken: (user as any).accessToken,
          userId: (user as any).id,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          username: (user as any).username,
          image: (user as any).image,
          emailVerified: (user as any).emailVerified,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user = {
          ...session.user,
          id: token.userId as string,
          role: token.role as string,
          accessToken: token.accessToken as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          username: token.username as string,
          image: token.image as string,
          emailVerified: token.emailVerified as boolean,
        } as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
