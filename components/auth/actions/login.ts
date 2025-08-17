"use server";
import { signIn } from "@/auth";
import { InvalidLoginError } from "@/auth.errors";
import { AuthError } from "next-auth";
import * as z from "zod";
import { loginSchema } from "@/schemas/userSchema";

export const login = async (values) => {
  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Буруу утга оруулав" };
  }
  
  const { identifier, password } = validatedFields.data;
  
  try {
    // Remove the artificial delay that was causing race conditions
    const result = await signIn("credentials", {
      identifier: values.identifier,
      password: values.password,
      redirect: false, // Don't redirect immediately, let us handle it
    });

    // Check if signIn was successful
    if (result?.error) {
      return { error: "Нэвтрэх нэр эсвэл нууц үг буруу байна" };
    }

    // If successful, redirect to home page
    return { success: true, redirectTo: "/" };
    
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          if ((error as any)?.code === "credentials") {
            return { error: "Нэвтрэх нэр эсвэл нууц үг буруу байна" };
          }
          return { error: (error as any)?.code || "Нэвтрэх алдаа" };
        default:
          return { error: "Нэвтрэх үед алдаа гарлаа" };
      }
    }
    
    // For any other unexpected error, return a generic message
    return { error: "Системийн алдаа гарлаа" };
  }
};
