import { prisma } from "./prisma";
import { bangkokToday } from "./datetime";

/** Next sequence for a daily prefix, given the highest number already issued. */
function nextNumber(prefix: string, latest: string | undefined): string {
  const lastSeq = latest ? Number(latest.slice(prefix.length + 1)) : 0;
  const nextSeq = Number.isFinite(lastSeq) && lastSeq > 0 ? lastSeq + 1 : 1;
  return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
}

/**
 * Order numbers run ORD-YYYYMMDD-0001 within a Bangkok calendar day. The
 * sequence comes from the highest number already issued today rather than a
 * row count, so deleted rows can't hand out a number twice. This is still not
 * atomic — concurrent registers can read the same maximum — so callers must
 * retry on the unique-constraint violation.
 */
export async function generateOrderNumber(): Promise<string> {
  const prefix = `ORD-${bangkokToday().replace(/-/g, "")}`;

  const latest = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  return nextNumber(prefix, latest?.orderNumber);
}

/** RFN-YYYYMMDD-0001, with the same non-atomic caveat as `generateOrderNumber`. */
export async function generateRefundNumber(): Promise<string> {
  const prefix = `RFN-${bangkokToday().replace(/-/g, "")}`;

  const latest = await prisma.refund.findFirst({
    where: { refundNumber: { startsWith: prefix } },
    orderBy: { refundNumber: "desc" },
    select: { refundNumber: true },
  });

  return nextNumber(prefix, latest?.refundNumber);
}
