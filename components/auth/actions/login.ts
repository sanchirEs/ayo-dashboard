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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await signIn("credentials", {
      identifier: values.identifier,
      password: values.password,
      redirectTo: "/",
      // redirectTo: callbackUrl || "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          if ((error as any)?.code === "credentials")
            return { error: "Ямар нэгэн алдаа гарлаа" };
          return { error: (error as any)?.code || "Нэвтрэх алдаа" };
        default:
          return { error: "Ямар нэгэн зүйл буруудлаа!" };
      }
    }
    throw error;
  }
};
