import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`)
  .max(128);

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, . _ -"),
  password: passwordSchema,
  displayName: z.string().trim().min(1, "ต้องระบุชื่อที่แสดง").max(100),
  role: z.enum(["ADMIN", "CASHIER"]),
});

export const updateUserSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100),
    role: z.enum(["ADMIN", "CASHIER"]),
    password: passwordSchema,
  })
  .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
