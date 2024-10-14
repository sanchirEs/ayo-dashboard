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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/register`,
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
      // throw new InvalidLoginError(errorMessage.message);
      return { error: errorMessage.message };
    }
    await signIn("credentials", {
      identifier: values.email,
      password: values.password,
      redirectTo: "/",
      // redirectTo: callbackUrl || "/",
    });
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
