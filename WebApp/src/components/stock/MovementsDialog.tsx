"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductMovements } from "@/lib/api/stock";
import { StockItem } from "@/lib/types";
import { movementTypeLabel } from "@/lib/utils/movements";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/formatCurrency";

/** Movement quantities are signed: positive is stock in, negative is stock out. */
type DirectionFilter = "" | "in" | "out";

const DIRECTION_TABS: { value: DirectionFilter; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "in", label: "รับเข้า" },
  { value: "out", label: "จ่ายออก" },
];

export function MovementsDialog({
  item,
  onOpenChange,
}: {
  item: StockItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [direction, setDirection] = useState<DirectionFilter>("");
  const productId = item?.product.id;

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-movements", productId],
    queryFn: () => getProductMovements(productId!),
    enabled: !!productId,
  });

  const filtered = movements.filter((movement) =>
    direction === "in" ? movement.quantity > 0 : direction === "out" ? movement.quantity < 0 : true
  );

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) setDirection("");
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>การเคลื่อนไหวสต็อก</DialogTitle>
          {item && (
            <p className="text-sm text-gray-500">
              {item.product.name} · คงเหลือ {formatNumber(item.quantity)} {item.product.unit}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {DIRECTION_TABS.map((tab) => (
            <Button
              key={tab.value || "all"}
              size="sm"
              variant={direction === tab.value ? "default" : "outline"}
              onClick={() => setDirection(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-white/60 bg-white/40">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-400">กำลังโหลด...</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">ไม่พบการเคลื่อนไหว</p>
          ) : (
            <ul className="divide-y divide-white/60">
              {filtered.map((movement) => {
                const isIn = movement.quantity > 0;
                return (
                  <li key={movement.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            isIn
                              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                              : "border-red-100 bg-red-50 text-red-600"
                          )}
                        >
                          {movementTypeLabel(movement.type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleString("th-TH")}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {[movement.order?.orderNumber, movement.note, movement.user?.displayName]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "whitespace-nowrap font-semibold",
                        isIn ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {isIn ? "+" : "−"}
                      {formatNumber(Math.abs(movement.quantity))} {item?.product.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
