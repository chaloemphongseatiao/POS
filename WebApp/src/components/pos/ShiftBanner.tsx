"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCurrentShift } from "@/lib/api/shifts";
import { Wallet } from "lucide-react";

/**
 * Warns when the register is selling without an open shift. Sales still go
 * through — the point is that they will not be attached to any drawer count,
 * so the cashier can fix it before the money is impossible to reconcile.
 */
export function ShiftBanner() {
  const { data: shift, isLoading } = useQuery({
    queryKey: ["shift", "current"],
    queryFn: getCurrentShift,
  });

  if (isLoading || shift) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-100/80 bg-amber-50/70 px-4 py-2.5 text-sm text-amber-700 backdrop-blur-sm">
      <span className="flex items-center gap-2">
        <Wallet className="h-4 w-4 flex-shrink-0" />
        ยังไม่ได้เปิดกะ — ยอดขายจะไม่ถูกนับเข้าลิ้นชักเงินสด
      </span>
      <Link
        href="/shift"
        className="rounded-lg border border-amber-200/80 bg-white/60 px-3 py-1 text-xs font-medium transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        เปิดกะ
      </Link>
    </div>
  );
}
