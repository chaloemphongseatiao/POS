"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listOrders, getOrder, voidOrder } from "@/lib/api/orders";
import { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye, XCircle, Printer, Search, CalendarRange, AlertTriangle } from "lucide-react";

const PAGE_SIZE = 20;

// ─── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({ orderId, onClose }: { orderId: number | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
  });

  const voidMutation = useMutation({
    mutationFn: () => voidOrder(orderId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      setShowVoidConfirm(false);
    },
  });

  const payLabel = order?.paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์";

  return (
    <>
    <Dialog open={!!orderId} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            รายละเอียดออเดอร์
            {order && (
              <Badge variant={order.status === "VOIDED" ? "destructive" : "success"}>
                {order.status === "VOIDED" ? "ยกเลิกแล้ว" : "สำเร็จ"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !order ? (
          <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
        ) : (
          <div className="space-y-4 text-sm">
            {/* Info */}
            <div className="grid grid-cols-2 gap-y-2 bg-gray-50 rounded-lg p-4">
              <span className="text-gray-500">เลขออเดอร์</span>
              <span className="font-mono font-medium">{order.orderNumber}</span>
              <span className="text-gray-500">วันที่</span>
              <span>{new Date(order.createdAt).toLocaleString("th-TH")}</span>
              <span className="text-gray-500">แคชเชียร์</span>
              <span>{order.cashier.displayName}</span>
              <span className="text-gray-500">ช่องทางชำระ</span>
              <span>{payLabel}</span>
            </div>

            {/* Items */}
            <div>
              <p className="font-semibold text-gray-700 mb-2">รายการสินค้า</p>
              <div className="space-y-1.5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <span>{item.product.name}</span>
                      <span className="text-gray-400 ml-1 text-xs">
                        x{item.quantity} {item.product.unit}
                      </span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-1">
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
                <span>รับมา ({payLabel})</span>
                <span>{formatCurrency(order.amountPaid)}</span>
              </div>
              {Number(order.changeAmt) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>เงินทอน</span>
                  <span>{formatCurrency(order.changeAmt)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                พิมพ์ใบเสร็จ
              </Button>
              {order.status === "COMPLETED" && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowVoidConfirm(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  ยกเลิกออเดอร์
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Void Confirmation Dialog */}

    <Dialog open={showVoidConfirm} onOpenChange={(open) => { if (!open) setShowVoidConfirm(false); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            ยืนยันการยกเลิกออเดอร์
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-gray-600">
          <p>ต้องการยกเลิกออเดอร์</p>
          <p className="mt-1 font-semibold text-gray-900 font-mono">{order?.orderNumber}</p>
          <p className="mt-3 text-xs text-gray-400">ยอดขายจะถูกยกเลิกและ Stock จะถูกคืนกลับ</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowVoidConfirm(false)} disabled={voidMutation.isPending}>
            ยกเลิก
          </Button>
          <Button variant="destructive" onClick={() => voidMutation.mutate()} disabled={voidMutation.isPending}>
            {voidMutation.isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", fromDate, toDate, page],
    queryFn: () =>
      listOrders({
        from: fromDate,
        to: `${toDate}T23:59:59`,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFromDate(value: string) {
    setFromDate(value);
    setPage(1);
  }

  function handleToDate(value: string) {
    setToDate(value);
    setPage(1);
  }

  function setQuickRange(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    setFromDate(d.toISOString().slice(0, 10));
    setToDate(today);
    setPage(1);
  }

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.totalAmt), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">รายการขาย</h1>
        <p className="text-sm text-gray-500">ประวัติการขายและออเดอร์ทั้งหมด</p>
      </div>

      {/* Date filter */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <CalendarRange className="w-4 h-4" />
          เลือกช่วงวันที่
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">วันที่เริ่มต้น</p>
            <Input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => handleFromDate(e.target.value)}
              className="h-9 text-sm w-40"
            />
          </div>
          <span className="text-gray-400 mb-1.5">—</span>
          <div>
            <p className="text-xs text-gray-500 mb-1">วันที่สิ้นสุด</p>
            <Input
              type="date"
              value={toDate}
              min={fromDate}
              max={today}
              onChange={(e) => handleToDate(e.target.value)}
              className="h-9 text-sm w-40"
            />
          </div>
          <div className="flex gap-1.5 mb-0.5">
            {[
              { label: "วันนี้", days: 1 },
              { label: "7 วัน", days: 7 },
              { label: "30 วัน", days: 30 },
            ].map(({ label, days }) => (
              <Button key={label} variant="outline" size="sm" onClick={() => setQuickRange(days)}
                className="h-9 text-xs px-3">
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {!isLoading && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-xs text-violet-500/70">ออเดอร์ทั้งหมด</p>
            <p className="text-xl font-bold mt-0.5">{total} รายการ</p>
          </div>
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-xs text-violet-500/70">สำเร็จ</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{completedOrders.length} รายการ</p>
          </div>
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-xs text-violet-500/70">ยอดขายรวม (หน้านี้)</p>
            <p className="text-xl font-bold text-primary mt-0.5">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เลขออเดอร์</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่-เวลา</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">แคชเชียร์</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">รายการ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชำระ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">กำลังโหลด...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">ไม่พบรายการขายในช่วงวันที่นี้</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="glass-row-hover cursor-pointer transition-colors" onClick={() => setSelectedOrderId(o.id)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString("th-TH", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.cashier.displayName}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{o.items.length}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {o.status === "VOIDED"
                        ? <span className="line-through text-gray-400">{formatCurrency(o.totalAmt)}</span>
                        : formatCurrency(o.totalAmt)
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {o.paymentMethod === "CASH" ? "เงินสด" : "QR"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={o.status === "VOIDED" ? "destructive" : "success"}>
                        {o.status === "VOIDED" ? "ยกเลิก" : "สำเร็จ"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(o.id); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 glass-header">
            <p className="text-sm text-gray-500">แสดง {startItem}–{endItem} จาก {total} รายการ</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <Button key={p} variant={page === p ? "default" : "outline"} size="icon"
                      onClick={() => setPage(p as number)} className="w-9 h-9 text-sm">
                      {p}
                    </Button>
                  )
                )}
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  );
}
