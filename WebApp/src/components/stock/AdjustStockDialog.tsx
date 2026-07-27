"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockItem } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  open: boolean;
  stock: StockItem | null;
  onConfirm: (productId: number, newQuantity: number, note: string) => void;
  onClose: () => void;
  loading: boolean;
}

export default function AdjustStockDialog({ open, stock, onConfirm, onClose, loading }: Props) {
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (stock && open) {
      setQuantity(String(stock.quantity));
      setNote("");
    }
  }, [stock, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stock) return;
    onConfirm(stock.product.id, parseInt(quantity), note);
  }

  const current = stock?.quantity ?? 0;
  const newQty = parseInt(quantity) || 0;
  const diff = newQty - current;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            ปรับยอด Stock
          </DialogTitle>
        </DialogHeader>
        {stock && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-white/40 border border-white/70 p-3 space-y-1">
              <p className="font-medium text-sm">{stock.product.name}</p>
              <p className="text-sm text-gray-500">
                คงเหลือปัจจุบัน: <span className="font-semibold text-gray-700">{current} {stock.product.unit}</span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">จำนวนคงเหลือใหม่ ({stock.product.unit})</label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-lg h-12 text-center font-bold mt-1"
                autoFocus
                required
              />
              {quantity !== "" && !isNaN(diff) && diff !== 0 && (
                <p className={`text-xs mt-1 text-center ${diff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {diff > 0 ? `+${diff}` : diff} {stock.product.unit} จากเดิม
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">หมายเหตุ</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เหตุผลที่ปรับยอด..."
                className="mt-1"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading || quantity === "" || newQty === current} className="flex-1">
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
