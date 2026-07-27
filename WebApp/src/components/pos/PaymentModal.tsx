"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { PaymentMethod } from "@/lib/types";

interface Props {
  open: boolean;
  total: number;
  paymentMethod: PaymentMethod;
  onConfirm: (amountPaid: number) => void;
  onClose: () => void;
  loading: boolean;
}

export default function PaymentModal({ open, total, paymentMethod, onConfirm, onClose, loading }: Props) {
  const [amountPaid, setAmountPaid] = useState<string>("");
  const paid = parseFloat(amountPaid) || 0;
  const change = paid - total;

  const quickAmounts = [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000];
  const uniqueAmounts = [...new Set(quickAmounts)].filter((a) => a >= total).slice(0, 4);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>รับชำระเงิน</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/50 border border-white/70 p-4 text-center">
            <p className="text-sm text-slate-500">ยอดที่ต้องชำระ</p>
            <p className="text-4xl font-extrabold text-primary mt-1 tabular-nums">{formatCurrency(total)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์"}
            </p>
          </div>

          {paymentMethod === "CASH" && (
            <>
              <div>
                <label htmlFor="pm-amountPaid" className="block text-sm font-medium mb-1">รับเงินมา</label>
                <Input
                  id="pm-amountPaid"
                  type="number"
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="text-xl h-14 text-center font-bold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {uniqueAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPaid(String(amt))}
                    className="rounded-xl bg-white/50 border border-white/80 py-2 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-primary hover:text-white hover:border-primary hover:shadow-md hover:shadow-primary/20 active:scale-95"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {paid >= total && (
                <div
                  className="rounded-2xl bg-emerald-50/80 border border-emerald-100/80 p-3 text-center [animation:fade-up-in_200ms_ease-out]"
                >
                  <p className="text-sm text-emerald-600">เงินทอน</p>
                  <p className="text-3xl font-bold text-emerald-600 tabular-nums">{formatCurrency(change)}</p>
                </div>
              )}
            </>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={() => onConfirm(paymentMethod === "CASH" ? paid : total)}
            disabled={loading || (paymentMethod === "CASH" && paid < total)}
          >
            {loading ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
