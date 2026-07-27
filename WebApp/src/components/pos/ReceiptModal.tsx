"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Order } from "@/lib/types";
import { Printer, X } from "lucide-react";

interface Props {
  open: boolean;
  order: Order | null;
  onClose: () => void;
}

export default function ReceiptModal({ open, order, onClose }: Props) {
  if (!order) return null;

  const paymentLabel = order.paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>ใบเสร็จรับเงิน</DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="space-y-3 text-sm">
          <div className="text-center border-b pb-3">
            <p className="font-bold text-base">ร้านค้า POS</p>
            <p className="text-gray-500 text-xs">{order.orderNumber}</p>
            <p className="text-gray-400 text-xs">
              {new Date(order.createdAt).toLocaleString("th-TH")}
            </p>
          </div>

          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span>{item.product.name}</span>
                  <span className="text-gray-400 ml-1 text-xs">x{item.quantity} {item.product.unit}</span>
                </div>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>ราคารวม</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discountAmt) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>ส่วนลด</span>
                <span>-{formatCurrency(order.discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>ยอดรวม</span>
              <span>{formatCurrency(order.totalAmt)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>ชำระ ({paymentLabel})</span>
              <span>{formatCurrency(order.amountPaid)}</span>
            </div>
            {Number(order.changeAmt) > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>เงินทอน</span>
                <span>{formatCurrency(order.changeAmt)}</span>
              </div>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs pt-2 border-t">
            ขอบคุณที่ใช้บริการ
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์
          </Button>
          <Button className="flex-1" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
