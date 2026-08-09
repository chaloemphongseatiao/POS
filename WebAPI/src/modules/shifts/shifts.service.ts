import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import type { CloseShiftInput, OpenShiftInput } from "./shifts.schema";

/** A shift is open exactly while it has no `closedAt`. */
const OPEN = { closedAt: null };

export type ShiftTotals = {
  orderCount: number;
  /** Sales that still count — voided bills are excluded entirely. */
  salesTotal: number;
  cashSales: number;
  qrSales: number;
  refundTotal: number;
  cashRefunds: number;
  qrRefunds: number;
  voidedCount: number;
  /** openingCash + cashSales - cashRefunds. */
  expectedCash: number;
};

/**
 * Money that passed through one shift's drawer. Refunds follow the payment
 * method of the bill they undo, so a QR sale refunded in the same shift never
 * moves the cash figure.
 */
async function computeTotals(shiftId: number, openingCash: number): Promise<ShiftTotals> {
  const [orders, refunds] = await Promise.all([
    prisma.order.findMany({
      where: { shiftId },
      select: { status: true, paymentMethod: true, totalAmt: true },
    }),
    prisma.refund.findMany({
      where: { shiftId },
      select: { totalAmt: true, order: { select: { paymentMethod: true } } },
    }),
  ]);

  let salesTotal = 0;
  let cashSales = 0;
  let qrSales = 0;
  let orderCount = 0;
  let voidedCount = 0;

  for (const order of orders) {
    if (order.status === "VOIDED") {
      voidedCount += 1;
      continue;
    }
    const amount = Number(order.totalAmt);
    orderCount += 1;
    salesTotal += amount;
    if (order.paymentMethod === "CASH") cashSales += amount;
    else qrSales += amount;
  }

  let refundTotal = 0;
  let cashRefunds = 0;
  let qrRefunds = 0;

  for (const refund of refunds) {
    const amount = Number(refund.totalAmt);
    refundTotal += amount;
    if (refund.order.paymentMethod === "CASH") cashRefunds += amount;
    else qrRefunds += amount;
  }

  return {
    orderCount,
    salesTotal,
    cashSales,
    qrSales,
    refundTotal,
    cashRefunds,
    qrRefunds,
    voidedCount,
    expectedCash: openingCash + cashSales - cashRefunds,
  };
}

const shiftInclude = {
  openedBy: { select: { id: true, displayName: true } },
  closedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.ShiftInclude;

/** The open shift with its running totals, or null when the register is closed. */
export async function getCurrentShift() {
  const shift = await prisma.shift.findFirst({ where: OPEN, include: shiftInclude });
  if (!shift) return null;
  return { ...shift, totals: await computeTotals(shift.id, Number(shift.openingCash)) };
}

/**
 * The id of the shift a sale or refund belongs to, or null when the store is
 * running without shifts. Sales are never blocked on an open shift: a register
 * that forgot to open one must still be able to serve customers.
 */
export async function getOpenShiftId(): Promise<number | null> {
  const shift = await prisma.shift.findFirst({ where: OPEN, select: { id: true } });
  return shift?.id ?? null;
}

/** True when the write failed on the partial unique index guarding one open shift. */
function isDuplicateOpenShift(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    JSON.stringify(err.meta?.target ?? "").includes("Shift_single_open")
  );
}

export async function openShift(userId: number, input: OpenShiftInput) {
  try {
    const shift = await prisma.shift.create({
      data: {
        openingCash: input.openingCash,
        note: input.note,
        openedById: userId,
      },
      include: shiftInclude,
    });
    return { ...shift, totals: await computeTotals(shift.id, Number(shift.openingCash)) };
  } catch (err) {
    // The database, not a prior read, decides this — two registers pressing
    // "open" at once still end up with a single shift.
    if (isDuplicateOpenShift(err)) throw createError("มีกะที่เปิดอยู่แล้ว", 409);
    throw err;
  }
}

export async function closeShift(userId: number, input: CloseShiftInput) {
  const shift = await prisma.shift.findFirst({ where: OPEN });
  if (!shift) throw createError("ไม่มีกะที่เปิดอยู่", 400);

  const totals = await computeTotals(shift.id, Number(shift.openingCash));

  const closed = await prisma.shift.update({
    where: { id: shift.id },
    data: {
      closingCash: input.closingCash,
      expectedCash: totals.expectedCash,
      diffCash: input.closingCash - totals.expectedCash,
      closedAt: new Date(),
      closedById: userId,
      // Keep the opening note when closing without one.
      note: input.note ?? shift.note,
    },
    include: shiftInclude,
  });

  return { ...closed, totals };
}

export async function listShifts(params: { from?: Date; to?: Date; page?: number; limit?: number }) {
  const { from, to } = params;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 30));
  const where = from || to ? { openedAt: { gte: from, lte: to } } : {};

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      include: shiftInclude,
      orderBy: { openedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shift.count({ where }),
  ]);

  // Every row carries its own totals so the history table can show the money
  // without a follow-up request per shift.
  const withTotals = await Promise.all(
    shifts.map(async (shift) => ({
      ...shift,
      totals: await computeTotals(shift.id, Number(shift.openingCash)),
    }))
  );

  return { shifts: withTotals, total, page, limit };
}

export async function getShift(id: number) {
  const shift = await prisma.shift.findUnique({ where: { id }, include: shiftInclude });
  if (!shift) throw createError("ไม่พบกะนี้", 404);
  return { ...shift, totals: await computeTotals(shift.id, Number(shift.openingCash)) };
}
