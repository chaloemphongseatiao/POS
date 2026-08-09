"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentShift, listShifts, openShift, closeShift } from "@/lib/api/shifts";
import { Shift } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DoorOpen, DoorClosed, Wallet, History, AlertTriangle } from "lucide-react";

const PAGE_SIZE = 20;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Signed money: a shortfall reads red, a surplus green, an exact match neutral. */
function DiffAmount({ value }: { value: number }) {
  const tone =
    value === 0 ? "text-gray-500" : value < 0 ? "text-red-600" : "text-emerald-600";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`font-semibold ${tone}`}>
      {sign}
      {formatCurrency(value)}
    </span>
  );
}

// ─── Open Shift ────────────────────────────────────────────────────────────────

function OpenShiftCard() {
  const qc = useQueryClient();
  const [openingCash, setOpeningCash] = useState("");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      openShift({ openingCash: parseFloat(openingCash) || 0, note: note.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift", "current"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setOpeningCash("");
      setNote("");
    },
  });

  return (
    <div className="glass space-y-4 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-gray-700">
        <DoorOpen className="h-5 w-5 text-violet-500" />
        <h2 className="font-semibold">ยังไม่ได้เปิดกะ</h2>
      </div>
      <p className="text-sm text-gray-500">
        นับเงินสดในลิ้นชักก่อนเริ่มขาย แล้วกรอกยอดเงินต้น — ตอนปิดกะระบบจะเทียบให้ว่าเงินขาดหรือเกิน
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="opening-cash" className="mb-1 block text-xs text-gray-500">
            เงินสดตั้งต้น (บาท)
          </label>
          <Input
            id="opening-cash"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label htmlFor="opening-note" className="mb-1 block text-xs text-gray-500">
            หมายเหตุ (ถ้ามี)
          </label>
          <Input
            id="opening-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น กะเช้า"
            maxLength={500}
          />
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={openingCash === "" || mutation.isPending}
        className="w-full sm:w-auto"
      >
        <DoorOpen className="mr-2 h-4 w-4" />
        {mutation.isPending ? "กำลังเปิดกะ..." : "เปิดกะ"}
      </Button>
    </div>
  );
}

// ─── Current Shift ─────────────────────────────────────────────────────────────

function CurrentShiftCard({ shift }: { shift: Shift }) {
  const qc = useQueryClient();
  const [showClose, setShowClose] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      closeShift({ closingCash: parseFloat(closingCash) || 0, note: note.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift", "current"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setShowClose(false);
      setClosingCash("");
      setNote("");
    },
  });

  const { totals } = shift;
  // Previewed live so the cashier sees the gap before committing the close.
  const counted = parseFloat(closingCash);
  const diffPreview = Number.isFinite(counted) ? counted - totals.expectedCash : null;

  const rows: { label: string; value: string; tone?: string }[] = [
    { label: "เงินสดตั้งต้น", value: formatCurrency(shift.openingCash) },
    { label: "ขายเงินสด", value: formatCurrency(totals.cashSales) },
    { label: "ขาย QR", value: formatCurrency(totals.qrSales) },
    { label: "คืนเงินสด", value: `-${formatCurrency(totals.cashRefunds)}`, tone: "text-amber-600" },
    { label: "คืนผ่าน QR", value: `-${formatCurrency(totals.qrRefunds)}`, tone: "text-amber-600" },
  ];

  return (
    <>
      <div className="glass space-y-5 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold text-gray-700">กะที่เปิดอยู่</h2>
            <Badge variant="success">เปิด</Badge>
          </div>
          <p className="text-sm text-gray-500">
            เปิดโดย {shift.openedBy.displayName} · {formatDateTime(shift.openedAt)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/50 px-4 py-3">
            <p className="text-xs text-violet-500/70">บิลในกะนี้</p>
            <p className="mt-0.5 text-xl font-bold">{totals.orderCount} บิล</p>
          </div>
          <div className="rounded-2xl bg-white/50 px-4 py-3">
            <p className="text-xs text-violet-500/70">ยอดขายรวม</p>
            <p className="mt-0.5 text-xl font-bold text-primary">
              {formatCurrency(totals.salesTotal - totals.refundTotal)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/50 px-4 py-3">
            <p className="text-xs text-violet-500/70">เงินสดที่ควรมี</p>
            <p className="mt-0.5 text-xl font-bold text-emerald-600">
              {formatCurrency(totals.expectedCash)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 rounded-2xl border border-white/70 bg-white/40 p-4 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-gray-500">{row.label}</span>
              <span className={row.tone ?? "font-medium"}>{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>เงินสดที่ควรมีในลิ้นชัก</span>
            <span>{formatCurrency(totals.expectedCash)}</span>
          </div>
          {totals.voidedCount > 0 && (
            <p className="pt-1 text-xs text-gray-400">
              มีบิลที่ถูกยกเลิกในกะนี้ {totals.voidedCount} บิล (ไม่นับเป็นยอดขาย)
            </p>
          )}
        </div>

        <Button variant="destructive" onClick={() => setShowClose(true)} className="w-full sm:w-auto">
          <DoorClosed className="mr-2 h-4 w-4" />
          ปิดกะ
        </Button>
      </div>

      <Dialog open={showClose} onOpenChange={(open) => { if (!open) setShowClose(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorClosed className="h-5 w-5 text-violet-500" />
              ปิดกะ — นับเงินในลิ้นชัก
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between rounded-xl bg-white/50 p-3">
              <span className="text-gray-500">เงินสดที่ควรมี</span>
              <span className="font-semibold">{formatCurrency(totals.expectedCash)}</span>
            </div>

            <div>
              <label htmlFor="closing-cash" className="mb-1 block text-xs text-gray-500">
                เงินสดที่นับได้จริง (บาท)
              </label>
              <Input
                id="closing-cash"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>

            {diffPreview !== null && (
              <div className="flex items-center justify-between rounded-xl border border-white/70 bg-white/40 p-3">
                <span className="text-gray-500">
                  {diffPreview < 0 ? "เงินขาด" : diffPreview > 0 ? "เงินเกิน" : "ตรงพอดี"}
                </span>
                <DiffAmount value={diffPreview} />
              </div>
            )}

            <div>
              <label htmlFor="closing-note" className="mb-1 block text-xs text-gray-500">
                หมายเหตุ (ถ้ามี)
              </label>
              <Input
                id="closing-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น จ่ายค่าน้ำแข็ง 100"
                maxLength={500}
              />
            </div>

            <p className="flex items-start gap-2 text-xs text-gray-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              ปิดกะแล้วแก้ไม่ได้ ต้องเปิดกะใหม่เพื่อขายต่อ
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClose(false)} disabled={mutation.isPending}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={closingCash === "" || mutation.isPending}
            >
              {mutation.isPending ? "กำลังปิดกะ..." : "ยืนยันปิดกะ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ShiftPage() {
  const [page, setPage] = useState(1);

  const { data: current, isLoading } = useQuery({
    queryKey: ["shift", "current"],
    queryFn: getCurrentShift,
  });

  const { data: history } = useQuery({
    queryKey: ["shifts", page],
    queryFn: () => listShifts({ page, limit: PAGE_SIZE }),
  });

  const shifts = history?.shifts ?? [];
  const total = history?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">รอบกะ / ลิ้นชักเงินสด</h1>
        <p className="page-description">Shift & Cash Drawer</p>
      </div>

      {isLoading ? (
        <div className="glass rounded-2xl p-10 text-center text-gray-400">กำลังโหลด...</div>
      ) : current ? (
        <CurrentShiftCard shift={current} />
      ) : (
        <OpenShiftCard />
      )}

      {/* History */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-white/40 px-4 py-3 glass-header">
          <History className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-600">ประวัติกะ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">เปิด</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ปิด</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ผู้เปิด / ผู้ปิด</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">ยอดขายสุทธิ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">ควรมี</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">นับได้</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">ขาด/เกิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    ยังไม่มีประวัติกะ
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatDateTime(shift.openedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {shift.closedAt ? (
                        formatDateTime(shift.closedAt)
                      ) : (
                        <Badge variant="success">เปิดอยู่</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {shift.openedBy.displayName}
                      {shift.closedBy && ` / ${shift.closedBy.displayName}`}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(shift.totals.salesTotal - shift.totals.refundTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(shift.expectedCash ?? shift.totals.expectedCash)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {shift.closingCash === null ? "—" : formatCurrency(shift.closingCash)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {shift.diffCash === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <DiffAmount value={Number(shift.diffCash)} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/40 px-4 py-3 glass-header">
            <p className="text-sm text-gray-500">
              หน้า {page} จาก {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ก่อนหน้า
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
