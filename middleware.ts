import NextAuth from "next-auth";
import authConfig from "@/auth.config";
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
});

export const config = {
  //Matcher таарвал дээд талын middleware код ажиллана.
  matcher: ["/auth/login", "/login_register"],
};
