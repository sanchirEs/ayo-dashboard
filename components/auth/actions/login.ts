"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import * as z from "zod";
import { loginSchema } from "@/schemas/userSchema";

export const login = async (values: z.infer<typeof loginSchema>) => {
  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid input data" };
  }

  const { identifier, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Authentication failed" };
      }
    }
    
    // Allow Next.js redirect signals to bubble up (successful login)
    if ((error as any)?.digest === 'NEXT_REDIRECT') throw error;
    
    return { error: "Something went wrong" };
  }
};
