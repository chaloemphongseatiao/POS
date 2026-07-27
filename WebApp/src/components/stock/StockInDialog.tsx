"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockItem } from "@/lib/types";

interface Props {
  open: boolean;
  stock: StockItem | null;
  onConfirm: (productId: number, quantity: number, note: string) => void;
  onClose: () => void;
  loading: boolean;
}

export default function StockInDialog({ open, stock, onConfirm, onClose, loading }: Props) {
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stock) return;
    onConfirm(stock.product.id, parseInt(quantity), note);
    setQuantity("1");
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>รับสินค้าเข้าคลัง</DialogTitle>
        </DialogHeader>
        {stock && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium">{stock.product.name}</p>
              <p className="text-sm text-gray-500">คงเหลือปัจจุบัน: {stock.quantity} {stock.product.unit}</p>
            </div>
            <div>
              <label className="text-sm font-medium">จำนวนที่รับเข้า ({stock.product.unit})</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-lg h-12 text-center font-bold mt-1"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">หมายเหตุ (เช่น เลขบิล)</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุหมายเหตุ..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "กำลังบันทึก..." : "บันทึกรับเข้า"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
