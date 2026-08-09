"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { listStock } from "@/lib/api/stock";
import { exportStockOnHandExcel } from "@/lib/reportSheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { bangkokToday } from "@/lib/utils/date";
import { formatCurrency, formatNumber } from "@/lib/utils/formatCurrency";

type StockStatus = "" | "normal" | "low" | "out";

const STATUS_TABS: { value: StockStatus; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "normal", label: "ปกติ" },
  { value: "low", label: "ใกล้หมด" },
  { value: "out", label: "หมด" },
];

const PAGE_SIZE = 50;
/** The API's per-page ceiling, used to page through the whole set for Excel. */
const EXPORT_CHUNK = 200;

export default function StockOnHandReport() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StockStatus>("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const filters = { search: search.trim() || undefined, status: status || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ["report-stock", search.trim(), status, page],
    queryFn: () => listStock({ ...filters, page, limit: PAGE_SIZE }),
  });

  const stocks = data?.stocks ?? [];
  const total = data?.total ?? 0;
  // An API deployed before the valuation totals existed still answers this
  // endpoint, just without them. Reading straight through would throw and take
  // the whole reports page down with it, so treat the block as optional.
  const valuation = data?.valuation;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function changeFilters(next: () => void) {
    next();
    setPage(1);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      // Export everything the filters match, not just the page on screen.
      const first = await listStock({ ...filters, page: 1, limit: EXPORT_CHUNK });
      const pages = Math.ceil(first.total / EXPORT_CHUNK);
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
          listStock({ ...filters, page: i + 2, limit: EXPORT_CHUNK })
        )
      );
      const all = [first, ...rest].flatMap((chunk) => chunk.stocks);
      exportStockOnHandExcel(all, `stock-on-hand-${bangkokToday()}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="จำนวนสินค้า" value={`${formatNumber(total)} รายการ`} />
        <SummaryCard label="จำนวนคงเหลือรวม" value={formatNumber(valuation?.quantity ?? 0)} />
        <SummaryCard label="มูลค่าต้นทุนคงเหลือ" value={formatCurrency(valuation?.cost ?? 0)} />
      </div>

      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <Input
          value={search}
          onChange={(e) => changeFilters(() => setSearch(e.target.value))}
          placeholder="ค้นหาชื่อสินค้า / Barcode..."
          className="w-full sm:w-72"
          aria-label="ค้นหาสินค้า"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value || "all"}
              size="sm"
              variant={status === tab.value ? "default" : "outline"}
              onClick={() => changeFilters(() => setStatus(tab.value))}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={isExporting || total === 0}
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "กำลังส่งออก..." : "ส่งออก Excel"}
        </Button>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">สินค้า</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">หมวดหมู่</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">คงเหลือ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">ต้นทุน/หน่วย</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">มูลค่าต้นทุน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">กำลังโหลด...</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">ไม่พบสินค้า</td></tr>
              ) : (
                stocks.map((stock) => {
                  const cost = Number(stock.product.costPrice);
                  const isOut = stock.quantity <= 0;
                  const isLow = !isOut && stock.quantity <= stock.product.lowStockAt;
                  return (
                    <tr key={stock.id} className="glass-row-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{stock.product.name}</p>
                        <p className="font-mono text-xs text-gray-400">{stock.product.barcode || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{stock.product.category.name}</td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-right font-semibold",
                          isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-800"
                        )}
                      >
                        {formatNumber(stock.quantity)} {stock.product.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(cost)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(cost * stock.quantity)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-white/40 px-4 py-3 text-sm">
            <span className="text-gray-500">
              หน้า {page} จาก {pageCount}
            </span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ก่อนหน้า
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <p className="text-xs text-violet-500/70">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
