import { prisma } from "../../lib/prisma";
import { comparePassword, hashPassword } from "../../lib/password";
import { signToken } from "../../lib/jwt";
import { createError } from "../../middleware/errorHandler";

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    throw createError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw createError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, role: true, createdAt: true },
  });
  if (!user) throw createError("User not found", 404);
  return user;
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError("User not found", 404);

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw createError("รหัสผ่านปัจจุบันไม่ถูกต้อง", 400);

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
