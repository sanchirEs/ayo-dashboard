import { z } from "zod";
const requiredString = z.string().trim().min(1, "Required");

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: "Нэвтрэх нэр эсвэл и-мэйл оруулна уу" })
    .min(1, "Нэвтрэх нэр эсвэл и-мэйл оруулна уу"),
  password: z
    .string({ required_error: "Нууц үгээ оруулна уу" })
    .min(1, "Нууц үг оруулна уу"),

  // query: z.object({
  //   role: z.string().optional(),
  // }),
  // params: z.object({
  //   userId: z.string().uuid("Invalid user ID"),
  // }),
});
export type LoginValues = z.infer<typeof loginSchema>;
export const createUserSchema = z.object({
  email: z
    .string({ required_error: "И-мэйлээ оруулна уу" })
    .email("И-мэйл буруу форматтай байна"),
  firstName: z.string({ required_error: "Нэрээ оруулна уу" }),
  lastName: z.string({ required_error: "Овгоо оруулна уу" }),
  username: z.string({ required_error: "Нэвтрэх нэрээ оруулна уу" }),
  password: z
    .string({ required_error: "Нууц үгээ оруулна уу" })
    .min(8, { message: "Нууц үг дор хаяж 8 тэмдэгтийн урттай байна" })
    .max(100, { message: "Нууц үг 100 тэмдэгтээс их байж болохгүй" })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    }) // Lowercase letter
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    }) // Uppercase letter
    .regex(/\d/, { message: "Password must contain at least one number" }) // Number
    .regex(/[@$!%*;?&#]/, {
      message: "Password must contain at least one special character",
    }), // Special character
});
export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string()
      .min(8, { message: "Нууц үг дор хаяж 8 тэмдэгтийн урттай байна" }),
    password: z
      .string()
      .min(8, { message: "Нууц үг дор хаяж 8 тэмдэгтийн урттай байна" })
      .max(100, { message: "Нууц үг 100 тэмдэгтээс их байж болохгүй" })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      }) // Lowercase letter
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      }) // Uppercase letter
      .regex(/\d/, { message: "Password must contain at least one number" }) // Number
      .regex(/[@$!%*;?&#]/, {
        message: "Password must contain at least one special character",
      }), // Special character
  }),
});
export const editUserDetailsSchema = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    password: z
      .string()
      .min(8, { message: "Нууц үг дор хаяж 8 тэмдэгтийн урттай байна" }),
  }),
});
