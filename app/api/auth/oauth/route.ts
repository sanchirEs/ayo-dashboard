"use server";
import { signIn } from "@/auth";
import jwt from "jsonwebtoken";
import { AuthError } from "next-auth";
export async function GET(req) {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const cookie = req.cookies.get("auth_token");
  const myCookie = cookie?.value;
  let decodedToken;
  try {
    decodedToken = jwt.verify(myCookie, process.env.AUTH_SECRET);
  } catch (error) {
    console.error("Token verification failed", error);
    return Response.redirect(`${baseUrl}/login?err_msg=${"oauthlogin"}`, 302);
  }
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await signIn("credentials", {
      decodedToken: {
        accessToken: myCookie,
      },
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role,
      image: decodedToken.image,
      username: decodedToken.username,
      firstName: decodedToken.firstName,
      lastName: decodedToken.lastName,
      email_verified: decodedToken.email_verified,
      accessToken: myCookie,
      credentialsMethod: "oauth",
      //   redirect:false
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          // console.log("credentials aldaa");
          if ((error as any)?.code === "credentials")
            return Response.redirect(
              `${baseUrl}/login?err_msg=${"oauthlogin"}`,
              302
            ); // 302 is the default redirect status
          return Response.redirect(
            `${baseUrl}/login?err_msg=${"oauthlogin"}`,
            302
          ); // 302 is the default redirect status
        default:
          return Response.redirect(
            `${baseUrl}/login?err_msg=${"oauthlogin"}`,
            302
          ); // 302 is the default redirect status
      }
    }
    throw error;
  }
  // console.log(decodedToken);
  return new Response(
    JSON.stringify({ myCookie, decodedToken, token: decodedToken.accessToken }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
