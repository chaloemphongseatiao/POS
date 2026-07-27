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
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">ยอดที่ต้องชำระ</p>
            <p className="text-4xl font-bold text-primary mt-1">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์"}
            </p>
          </div>

          {paymentMethod === "CASH" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">รับเงินมา</label>
                <Input
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
                    onClick={() => setAmountPaid(String(amt))}
                    className="border rounded-lg py-2 text-sm hover:bg-primary hover:text-white transition-colors"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {paid >= total && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-600">เงินทอน</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(change)}</p>
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
