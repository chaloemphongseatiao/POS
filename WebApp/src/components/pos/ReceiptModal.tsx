"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/api/settings";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { readVatSettings, splitVat } from "@/lib/utils/vat";
import { Order } from "@/lib/types";
import { Printer, X } from "lucide-react";

interface Props {
  open: boolean;
  order: Order | null;
  onClose: () => void;
}

export default function ReceiptModal({ open, order, onClose }: Props) {
  // Public settings, so a cashier's till can print a complete receipt without
  // the admin-only endpoint.
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: getPublicSettings,
    staleTime: 5 * 60 * 1000,
  });

  if (!order) return null;

  const vat = readVatSettings(settings);
  // The bill total already includes the tax — it is broken out for the customer,
  // never added on top.
  const split = splitVat(order.totalAmt, vat.rate);
  const paymentLabel = order.paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{vat.enabled ? "ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ" : "ใบเสร็จรับเงิน"}</DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="space-y-3 text-sm font-mono rounded-2xl bg-white/50 border border-white/70 p-4">
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <p className="font-bold text-base">{settings?.store_name || "ร้านค้า POS"}</p>
            {settings?.store_address && <p className="text-slate-500 text-xs">{settings.store_address}</p>}
            {vat.enabled && vat.taxId && (
              <p className="text-slate-500 text-xs">เลขประจำตัวผู้เสียภาษี {vat.taxId}</p>
            )}
            <p className="text-slate-500 text-xs">{order.orderNumber}</p>
            <p className="text-slate-400 text-xs">
              {new Date(order.createdAt).toLocaleString("th-TH")}
            </p>
          </div>

          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span>{item.product.name}</span>
                  <span className="text-slate-400 ml-1 text-xs">x{item.quantity} {item.product.unit}</span>
                </div>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>ราคารวม</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discountAmt) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>ส่วนลด</span>
                <span>-{formatCurrency(order.discountAmt)}</span>
              </div>
            )}
            {vat.enabled && (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>มูลค่าก่อน VAT</span>
                  <span>{formatCurrency(split.net)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>VAT {vat.rate}%</span>
                  <span>{formatCurrency(split.vat)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>ยอดรวม{vat.enabled ? " (รวม VAT)" : ""}</span>
              <span>{formatCurrency(order.totalAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>ชำระ ({paymentLabel})</span>
              <span>{formatCurrency(order.amountPaid)}</span>
            </div>
            {Number(order.changeAmt) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>เงินทอน</span>
                <span>{formatCurrency(order.changeAmt)}</span>
              </div>
            )}
          </div>

          <p className="text-center text-slate-400 text-xs pt-2 border-t border-dashed border-slate-300">
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
