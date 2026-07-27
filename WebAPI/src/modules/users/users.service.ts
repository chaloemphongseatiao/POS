import { UserRole } from "../../types/enums";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/password";
import { createError } from "../../middleware/errorHandler";

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
    orderBy: { id: "asc" },
  });
}

export async function createUser(data: {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}) {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) throw createError("ชื่อผู้ใช้นี้มีอยู่แล้ว", 409);

  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: { username: data.username, passwordHash, displayName: data.displayName, role: data.role },
    select: { id: true, username: true, displayName: true, role: true, isActive: true },
  });
}

export async function updateUser(
  id: number,
  data: { displayName?: string; role?: UserRole; password?: string }
) {
  const updateData: Record<string, unknown> = {};
  if (data.displayName) updateData.displayName = data.displayName;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, displayName: true, role: true, isActive: true },
  });
}

export async function toggleUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError("User not found", 404);
  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, username: true, isActive: true },
  });
}
