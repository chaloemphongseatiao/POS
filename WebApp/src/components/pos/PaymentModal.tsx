"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
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

  // This component stays mounted between sales, so clear the previous sale's
  // amount whenever the modal reopens.
  useEffect(() => {
    if (open) setAmountPaid("");
  }, [open]);

  const paid = parseFloat(amountPaid) || 0;
  const change = paid - total;

  const quickAmounts = [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000];
  const uniqueAmounts = [...new Set(quickAmounts)].filter((a) => a >= total).slice(0, 4);

  const canConfirm = !loading && !(paymentMethod === "CASH" && paid < total);

  // Shortcuts: Enter confirms payment; digit keys 1-4 pick a quick cash amount
  // (skipped while typing in a text field so manual amount entry still works).
  // stopPropagation keeps these keys from reaching the page's global barcode
  // listener on `document` — otherwise a fast-typed amount + Enter could be
  // misread as a scanned barcode mid-payment.
  function handleModalKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (canConfirm) onConfirm(paymentMethod === "CASH" ? paid : total);
      return;
    }
    const target = e.target as HTMLElement;
    const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
    if (!isTyping && paymentMethod === "CASH" && /^[1-4]$/.test(e.key)) {
      e.stopPropagation();
      const amt = uniqueAmounts[Number(e.key) - 1];
      if (amt !== undefined) setAmountPaid(String(amt));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" onKeyDown={handleModalKeyDown}>
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
                  name="amountPaid"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="text-xl h-14 text-center font-bold tabular-nums"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {uniqueAmounts.map((amt, i) => (
                  <button
                    key={amt}
                    type="button"
                    aria-label={`รับเงิน ${amt.toLocaleString()} บาท (คีย์ลัด ${i + 1})`}
                    onClick={() => setAmountPaid(String(amt))}
                    className="relative rounded-xl bg-white/50 border border-white/80 py-2 text-sm font-medium tabular-nums text-slate-600 touch-manipulation transition-[background-color,border-color,box-shadow,color,transform] duration-150 hover:bg-primary hover:text-white hover:border-primary hover:shadow-md hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
                  >
                    <Kbd className="absolute left-1.5 top-1">{i + 1}</Kbd>
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
            disabled={!canConfirm}
          >
            {loading ? "กำลังบันทึก…" : (
              <>ยืนยันการชำระเงิน <Kbd variant="dark">Enter</Kbd></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
