"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { getAllMovements } from "@/lib/api/stock";
import { exportMovementsExcel } from "@/lib/reportSheets";
import { MovementType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/formatCurrency";
import { movementTypeLabel } from "@/lib/utils/movements";

/** The report pulls a whole period in one go rather than paging. */
const MAX_ROWS = 2000;

interface Props {
  from: string;
  to: string;
  /** Left out for the all-movements report, which shows every type. */
  type?: MovementType;
  title: string;
  subtitle: string;
  fileName: string;
}

export default function MovementsReport({ from, to, type, title, subtitle, fileName }: Props) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["report-movements", type ?? "all", from, to],
    queryFn: () => getAllMovements({ from, to, type, limit: MAX_ROWS }),
  });

  const totalIn = movements.reduce((sum, m) => (m.quantity > 0 ? sum + m.quantity : sum), 0);
  const totalOut = movements.reduce((sum, m) => (m.quantity < 0 ? sum - m.quantity : sum), 0);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="จำนวนรายการ" value={`${formatNumber(movements.length)} รายการ`} />
        <SummaryCard label="รวมรับเข้า" value={`+${formatNumber(totalIn)}`} tone="text-emerald-600" />
        <SummaryCard label="รวมจ่ายออก" value={`−${formatNumber(totalOut)}`} tone="text-rose-600" />
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="glass-header flex flex-wrap items-center justify-between gap-2 border-b border-white/40 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={movements.length === 0}
            // `to` carries a time so the range is inclusive; a colon is not a
            // legal filename character, so the date part alone goes in the name.
            onClick={() =>
              exportMovementsExcel(movements, title, `${fileName}-${from}-${to.slice(0, 10)}.xlsx`)
            }
          >
            <Download className="mr-2 h-4 w-4" />
            ส่งออก Excel
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">วันที่</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">สินค้า</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ประเภท</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">จำนวน</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">อ้างอิง / หมายเหตุ</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ผู้ทำรายการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">กำลังโหลด...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">ไม่มีข้อมูลในช่วงนี้</td></tr>
              ) : (
                movements.map((movement) => {
                  const isIn = movement.quantity > 0;
                  return (
                    <tr key={movement.id} className="glass-row-hover transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {new Date(movement.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{movement.product?.name ?? "—"}</p>
                        <p className="font-mono text-xs text-gray-400">
                          {movement.product?.barcode || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            isIn
                              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                              : "border-red-100 bg-red-50 text-red-600"
                          )}
                        >
                          {movementTypeLabel(movement.type)}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-right font-semibold",
                          isIn ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {isIn ? "+" : "−"}
                        {formatNumber(Math.abs(movement.quantity))} {movement.product?.unit ?? ""}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {[movement.order?.orderNumber, movement.note].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{movement.user?.displayName ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {movements.length === MAX_ROWS && (
          <p className="border-t border-white/40 px-4 py-2 text-xs text-amber-600">
            แสดงได้สูงสุด {formatNumber(MAX_ROWS)} รายการ — ช่วงวันที่นี้อาจมีมากกว่านี้ ลองแคบช่วงลง
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = "text-slate-800" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <p className="text-xs text-violet-500/70">{label}</p>
      <p className={cn("mt-0.5 text-xl font-bold", tone)}>{value}</p>
    </div>
  );
}
