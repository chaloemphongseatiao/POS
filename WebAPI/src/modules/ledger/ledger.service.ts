import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { compareByName } from "../../lib/thaiSort";
import type { LedgerCategoryInput, LedgerEntryInput } from "./ledger.schema";

export async function listCategories(type?: "INCOME" | "EXPENSE") {
  const categories = await prisma.ledgerCategory.findMany({ where: type ? { type } : undefined });
  return categories.sort(compareByName);
}

export async function createCategory(data: LedgerCategoryInput) {
  const existing = await prisma.ledgerCategory.findUnique({
    where: { name_type: { name: data.name, type: data.type } },
  });
  if (existing) throw createError("หมวดหมู่นี้มีอยู่แล้ว", 409);
  return prisma.ledgerCategory.create({ data });
}

export async function updateCategory(id: number, data: LedgerCategoryInput) {
  return prisma.ledgerCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  const count = await prisma.ledgerEntry.count({ where: { categoryId: id } });
  if (count > 0) throw createError("ไม่สามารถลบหมวดหมู่ที่มีรายการอยู่ได้", 400);
  await prisma.ledgerCategory.delete({ where: { id } });
  return { id, deleted: true };
}

export async function listEntries(params: {
  from?: Date;
  to?: Date;
  type?: "INCOME" | "EXPENSE";
  categoryId?: number;
}) {
  return prisma.ledgerEntry.findMany({
    where: {
      type: params.type,
      categoryId: params.categoryId,
      entryDate: params.from || params.to ? { gte: params.from, lte: params.to } : undefined,
    },
    include: { category: { select: { id: true, name: true } }, user: { select: { id: true, displayName: true } } },
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
  });
}

export async function createEntry(userId: number, data: LedgerEntryInput) {
  const category = await prisma.ledgerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw createError("ไม่พบหมวดหมู่", 404);
  if (!category.isActive) throw createError("หมวดหมู่นี้ถูกปิดใช้งานแล้ว", 400);

  return prisma.ledgerEntry.create({
    data: {
      categoryId: category.id,
      type: category.type,
      amount: data.amount,
      note: data.note,
      entryDate: data.entryDate,
      userId,
    },
  });
}

export async function updateEntry(id: number, data: LedgerEntryInput) {
  const category = await prisma.ledgerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw createError("ไม่พบหมวดหมู่", 404);

  return prisma.ledgerEntry.update({
    where: { id },
    data: {
      categoryId: category.id,
      type: category.type,
      amount: data.amount,
      note: data.note,
      entryDate: data.entryDate,
    },
  });
}

export async function deleteEntry(id: number) {
  await prisma.ledgerEntry.delete({ where: { id } });
  return { id, deleted: true };
}

export async function getSummary(from: Date, to: Date) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { entryDate: { gte: from, lte: to } },
    include: { category: { select: { id: true, name: true } } },
  });

  let income = 0;
  let expense = 0;
  const byCategory = new Map<number, { categoryId: number; category: string; type: string; total: number }>();

  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === "INCOME") income += amount;
    else expense += amount;

    const bucket = byCategory.get(entry.categoryId) ?? {
      categoryId: entry.categoryId,
      category: entry.category.name,
      type: entry.type,
      total: 0,
    };
    bucket.total += amount;
    byCategory.set(entry.categoryId, bucket);
  }

  return {
    income,
    expense,
    net: income - expense,
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
    from,
    to,
  };
}
