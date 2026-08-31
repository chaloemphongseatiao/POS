"use client";

import { useQuery } from "@tanstack/react-query";
import { downloadLedgerCsv, getProfitLoss } from "@/lib/api/ledger";
import { ProfitLoss } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface Props {
  from: string;
  to: string;
  storeName: string;
}

/** A statement line. `emphasis` marks the three subtotals the eye should land on. */
function Line({
  label,
  value,
  hint,
  emphasis,
  negative,
}: {
  label: string;
  value: number;
  hint?: string;
  emphasis?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2 ${
        emphasis ? "border-t border-slate-300 font-bold text-slate-900" : "text-slate-600"
      }`}
    >
      <span>
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
      </span>
      <span
        className={`tabular-nums ${
          emphasis ? (value < 0 ? "text-red-600" : "text-emerald-700") : negative ? "text-red-500" : "text-slate-800"
        }`}
      >
        {negative && value > 0 ? "-" : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function Statement({ pl, storeName, from, to }: { pl: ProfitLoss; storeName: string; from: string; to: string }) {
  const expenses = pl.byCategory.filter((row) => row.type === "EXPENSE");
  const incomes = pl.byCategory.filter((row) => row.type === "INCOME");

  return (
    <div id="print-area" className="glass rounded-2xl p-5">
      <div className="mb-4 border-b border-dashed border-slate-300 pb-3 text-center">
        <p className="text-base font-bold text-slate-900">{storeName || "งบกำไรขาดทุน"}</p>
        <p className="text-sm text-slate-500">งบกำไรขาดทุน</p>
        <p className="text-xs text-slate-400">
          {from} ถึง {to}
        </p>
      </div>

      <Line label="ยอดขาย (รวม VAT)" value={pl.sales.gross} hint={`${pl.sales.orderCount} บิล`} />
      {pl.vat.enabled && <Line label={`หัก VAT ขาย ${pl.vat.rate}%`} value={pl.sales.vat} negative />}
      <Line label="ยอดขายสุทธิ" value={pl.sales.net} emphasis />
      <Line label="ต้นทุนสินค้าที่ขาย" value={pl.cogs.net} negative />
      <Line label="กำไรขั้นต้น" value={pl.grossProfit} hint={formatPercent(pl.grossMargin)} emphasis />

      {incomes.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">รายรับอื่น</p>
          {incomes.map((row) => (
            <Line key={row.categoryId} label={row.category} value={row.net} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">รายจ่าย</p>
        {expenses.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">ไม่มีรายจ่ายในช่วงนี้</p>
        ) : (
          expenses.map((row) => <Line key={row.categoryId} label={row.category} value={row.net} negative />)
        )}
      </div>

      <div className="mt-3">
        <Line label="กำไรสุทธิ" value={pl.netProfit} emphasis />
      </div>

      {pl.vat.enabled && (
        <div className="mt-5 rounded-xl bg-white/60 p-3 text-sm">
          <p className="mb-1 font-semibold text-slate-700">ภาษีมูลค่าเพิ่ม</p>
          <Line label="ภาษีขาย" value={pl.vat.outputVat} />
          <Line label="ภาษีซื้อ" value={pl.vat.inputVat} negative />
          <Line
            label={pl.vat.payable >= 0 ? "ภาษีที่ต้องชำระ" : "ภาษีที่ขอคืนได้"}
            value={Math.abs(pl.vat.payable)}
            emphasis
          />
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        ราคาขายทุกรายการรวม VAT แล้ว · ทุกบรรทัดในงบนี้แสดงยอดก่อน VAT
      </p>
    </div>
  );
}

export default function ProfitLossTab({ from, to, storeName }: Props) {
  const pl = useQuery({
    queryKey: ["ledger-profit-loss", from, to],
    queryFn: () => getProfitLoss({ from, to }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Button size="sm" variant="outline" onClick={() => downloadLedgerCsv("profit-loss", { from, to })}>
          <Download className="size-4" />
          CSV
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          พิมพ์ / บันทึก PDF
        </Button>
      </div>

      {pl.isLoading && <div className="glass rounded-2xl p-8 text-center text-slate-400">กำลังโหลด...</div>}
      {pl.data && <Statement pl={pl.data} storeName={storeName} from={from} to={to} />}
    </div>
  );
}
