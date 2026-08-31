"use client";

import { useQuery } from "@tanstack/react-query";
import { downloadLedgerCsv, getVatReport } from "@/lib/api/ledger";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";

interface Props {
  from: string;
  to: string;
}

export default function VatTab({ from, to }: Props) {
  const report = useQuery({
    queryKey: ["ledger-vat", from, to],
    queryFn: () => getVatReport({ from, to }),
  });

  if (report.isLoading) {
    return <div className="glass rounded-2xl p-8 text-center text-slate-400">กำลังโหลด...</div>;
  }
  if (!report.data) return null;

  if (!report.data.enabled) {
    return (
      <div className="glass flex items-start gap-3 rounded-2xl p-5 text-sm text-slate-600">
        <Info className="mt-0.5 size-5 shrink-0 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-800">ยังไม่ได้เปิดใช้งาน VAT</p>
          <p className="mt-1">
            เปิดได้ที่ ตั้งค่าร้านค้า → ภาพรวม → ภาษีมูลค่าเพิ่ม แล้วระบบจะแยก VAT ออกจากราคาขาย
            (ราคาขายถือว่ารวม VAT แล้ว) ให้อัตโนมัติ
          </p>
        </div>
      </div>
    );
  }

  const { months, total, rate, taxId } = report.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-600">
          อัตรา {rate}% {taxId && <span className="text-slate-400">· เลขประจำตัวผู้เสียภาษี {taxId}</span>}
        </div>
        <Button size="sm" variant="outline" onClick={() => downloadLedgerCsv("vat", { from, to })}>
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      <section className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="glass-header">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">เดือน</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">ยอดขายก่อน VAT</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">ภาษีขาย</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">ยอดซื้อก่อน VAT</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">ภาษีซื้อ</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">ต้องชำระ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {months.map((month) => (
                <tr key={month.month}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{month.month}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCurrency(month.salesNet)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatCurrency(month.outputVat)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCurrency(month.purchaseNet)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatCurrency(month.inputVat)}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      month.payable >= 0 ? "text-slate-900" : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(month.payable)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="glass-header">
              <tr className="font-bold text-slate-900">
                <td className="px-4 py-3">รวม</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(total.salesNet)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(total.outputVat)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(total.purchaseNet)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(total.inputVat)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(total.payable)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <p className="text-xs leading-relaxed text-slate-500">
        ภาษีขายคำนวณจากยอดขายจริงที่หน้าร้าน โดยถือว่าราคาขายรวม VAT แล้ว ({rate}%)
        ภาษีซื้อมาจากต้นทุนสินค้าที่ขาย (เมื่อเปิด &quot;ต้นทุนรวม VAT&quot; ในการตั้งค่า) และรายจ่ายที่ติ๊กว่ามีใบกำกับภาษี
        ตัวเลขชุดนี้ใช้เป็นตัวตั้งต้นในการยื่น ภ.พ.30 — ตรวจกับใบกำกับภาษีจริงก่อนยื่นทุกครั้ง
      </p>
    </div>
  );
}
