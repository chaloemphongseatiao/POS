import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/password";
import { createError } from "../../middleware/errorHandler";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

/**
 * Losing the last enabled admin means nobody can manage users, products or
 * settings again without direct database access — so the operations that could
 * cause it are refused.
 */
async function countOtherActiveAdmins(excludeUserId: number): Promise<number> {
  return prisma.user.count({
    where: { role: "ADMIN", isActive: true, id: { not: excludeUserId } },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
    orderBy: { id: "asc" },
  });
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) throw createError("ชื่อผู้ใช้นี้มีอยู่แล้ว", 409);

  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: { username: data.username, passwordHash, displayName: data.displayName, role: data.role },
    select: { id: true, username: true, displayName: true, role: true, isActive: true },
  });
}

export async function updateUser(id: number, data: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError("ไม่พบผู้ใช้", 404);

  if (data.role === "CASHIER" && user.role === "ADMIN" && (await countOtherActiveAdmins(id)) === 0) {
    throw createError("ต้องมีผู้ดูแล (Admin) ที่ใช้งานอยู่อย่างน้อย 1 คน", 400);
  }

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

export async function toggleUser(id: number, actingUserId: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError("ไม่พบผู้ใช้", 404);

  if (user.isActive) {
    if (user.id === actingUserId) throw createError("ปิดใช้งานบัญชีตัวเองไม่ได้", 400);
    if (user.role === "ADMIN" && (await countOtherActiveAdmins(id)) === 0) {
      throw createError("ต้องมีผู้ดูแล (Admin) ที่ใช้งานอยู่อย่างน้อย 1 คน", 400);
    }
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, username: true, isActive: true },
  });
}
