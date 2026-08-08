import { prisma } from "./prisma";
import { bangkokToday } from "./datetime";

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

  const lastSeq = latest ? Number(latest.orderNumber.slice(prefix.length + 1)) : 0;
  const nextSeq = Number.isFinite(lastSeq) && lastSeq > 0 ? lastSeq + 1 : 1;

  return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
}
