import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      accessToken: string;
      firstName: string;
      lastName: string;
      username: string;
      image: string;
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    role: string;
    image: string;
    emailVerified: boolean;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    accessToken: string;
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    image: string;
    emailVerified: boolean;
  }
}
