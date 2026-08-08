import { z } from "zod";
import { passwordSchema } from "../users/users.schema";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้").max(50),
  // Deliberately not length-checked: existing accounts must still be able to log
  // in, and a rejected-too-short response would leak password policy details.
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน").max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน").max(128),
  newPassword: passwordSchema,
});
