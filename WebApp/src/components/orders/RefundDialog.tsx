"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRefund } from "@/lib/api/refunds";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Undo2, Minus, Plus } from "lucide-react";

/**
 * Picks which lines of a bill come back and how many of each. Quantities are
 * capped at what is still refundable, so a line can never be returned twice.
 */
export function RefundDialog({
  order,
  open,
  onClose,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [qtyByItem, setQtyByItem] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);

  const refundable = useMemo(
    () => order.items.filter((item) => item.quantity - (item.refundedQty ?? 0) > 0),
    [order.items]
  );

  // The bill discount is spread over every line, so the refund pays back the
  // discounted share — the same proration the API applies.
  const paidRatio = Number(order.subtotal) > 0 ? Number(order.totalAmt) / Number(order.subtotal) : 0;

  const lines = refundable
    .map((item) => ({ item, quantity: qtyByItem[item.id] ?? 0 }))
    .filter(({ quantity }) => quantity > 0);

  const refundTotal = lines.reduce(
    (sum, { item, quantity }) => sum + Number(item.unitPrice) * quantity * paidRatio,
    0
  );

  const mutation = useMutation({
    mutationFn: () =>
      createRefund({
        orderId: order.id,
        items: lines.map(({ item, quantity }) => ({ orderItemId: item.id, quantity })),
        reason: reason.trim() || undefined,
        restock,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["refunds", order.id] });
      qc.invalidateQueries({ queryKey: ["shift", "current"] });
      handleClose();
    },
  });

  function handleClose() {
    setQtyByItem({});
    setReason("");
    setRestock(true);
    onClose();
  }

  function setQty(itemId: number, value: number, max: number) {
    setQtyByItem((prev) => ({ ...prev, [itemId]: Math.max(0, Math.min(max, value)) }));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="w-5 h-5 text-amber-600" />
            คืนสินค้า — {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        {refundable.length === 0 ? (
          <p className="py-8 text-center text-gray-400">บิลนี้ถูกคืนครบทุกรายการแล้ว</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              {refundable.map((item) => {
                const max = item.quantity - (item.refundedQty ?? 0);
                const qty = qtyByItem[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{item.product.name}</p>
                      <p className="text-xs text-gray-400">
                        ซื้อ {item.quantity} {item.product.unit}
                        {(item.refundedQty ?? 0) > 0 && ` · คืนแล้ว ${item.refundedQty}`}
                        {" · "}คืนได้อีก {max}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        aria-label={`ลดจำนวนคืน ${item.product.name}`}
                        onClick={() => setQty(item.id, qty - 1, max)}
                        disabled={qty <= 0}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={max}
                        value={qty}
                        aria-label={`จำนวนคืน ${item.product.name}`}
                        onChange={(e) => setQty(item.id, parseInt(e.target.value, 10) || 0, max)}
                        className="h-8 w-14 text-center"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        aria-label={`เพิ่มจำนวนคืน ${item.product.name}`}
                        onClick={() => setQty(item.id, qty + 1, max)}
                        disabled={qty >= max}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label htmlFor="refund-reason" className="mb-1 block text-xs text-gray-500">
                เหตุผล (ถ้ามี)
              </label>
              <Input
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="เช่น สินค้าชำรุด, ลูกค้าเปลี่ยนใจ"
                maxLength={500}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={restock}
                onChange={(e) => setRestock(e.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              คืนสินค้าเข้าสต็อก (ไม่ติ๊กถ้าของเสียหาย)
            </label>

            <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
              <span>ยอดคืนรวม</span>
              <span className="text-amber-600">{formatCurrency(refundTotal)}</span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={lines.length === 0 || mutation.isPending}
          >
            {mutation.isPending ? "กำลังคืน..." : "ยืนยันคืนสินค้า"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
