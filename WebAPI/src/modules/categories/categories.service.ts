import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { compareByName } from "../../lib/thaiSort";

export async function listCategories() {
  const categories = await prisma.category.findMany();
  return categories.sort(compareByName);
}

export async function createCategory(name: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw createError("หมวดหมู่นี้มีอยู่แล้ว", 409);
  return prisma.category.create({ data: { name } });
}

export async function updateCategory(id: number, name: string) {
  return prisma.category.update({ where: { id }, data: { name } });
}

export async function deleteCategory(id: number) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw createError("ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้", 400);
  return prisma.category.delete({ where: { id } });
}
