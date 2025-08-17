"use server";
import { signIn } from "@/auth";
import { InvalidLoginError } from "@/auth.errors";
import { AuthError } from "next-auth";
import * as z from "zod";
import { createUserSchema } from "@/schemas/userSchema";
export const register = async (values) => {
  const validatedFields = createUserSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Буруу утга оруулав" };
  }
  const { firstName, lastName, email, username, password } =
    validatedFields.data;
  try {
    const res = await fetch(
      `${require("@/lib/api/env").getBackendUrl()}/api/v1/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          email,
          username,
          firstName,
          lastName,
        }),
      }
    );
    if (!res.ok) {
      const errorMessage = await res.json();
      return { error: errorMessage.message };
    }
    
    const signInResult = await signIn("credentials", {
      identifier: values.email,
      password: values.password,
      redirect: false,
    });
    
    if (signInResult?.error) {
      return { error: "Бүртгэл амжилттай боловч нэвтрэх үед алдаа гарлаа" };
    }
    
    return { success: true, redirectTo: "/" };
    
  } catch (error) {
    if (error instanceof AuthError) {
        // console.log("aldaanii torol", error.type);
      // console.log("aldaanii message", error.code);
      switch (error.type) {
        case "CredentialsSignin":
          if((error as any)?.code==="credentials")  return { error:  "Ямар нэгэн алдаа гарлаа" };
          return { error: (error as any)?.code || "Нэвтрэх алдаа" };
        default:
          return { error: "Ямар нэгэн зүйл буруудлаа!" };
      }
    }
    throw error;
  }
};
