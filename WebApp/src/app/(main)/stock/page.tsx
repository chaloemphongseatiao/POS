"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listStock, stockIn, adjustStock, importStock } from "@/lib/api/stock";
import { exportStockExcel, readStockExcel } from "@/lib/stockExcel";
import { listCategories } from "@/lib/api/categories";
import { StockItem } from "@/lib/types";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProductImage } from "@/components/ui/product-image";
import { MovementsDialog } from "@/components/stock/MovementsDialog";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatCurrency";
import { markupOf } from "@/lib/utils/profit";
import { cn } from "@/lib/utils/cn";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Download, Plus, Search, SlidersHorizontal, Truck, Upload } from "lucide-react";

const PAGE_SIZE = 20;

type StatusFilter = "" | "low_out" | "low" | "out" | "normal";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "low_out", label: "ใกล้หมด/หมด" },
  { value: "out", label: "หมด" },
  { value: "normal", label: "ปกติ" },
];

function stockTone(item: StockItem) {
  if (item.quantity <= 0) return { label: "หมด", className: "bg-red-50 text-red-600 border-red-100" };
  if (item.quantity <= item.product.lowStockAt)
    return { label: "ใกล้หมด", className: "bg-amber-50 text-amber-600 border-amber-100" };
  return { label: "ปกติ", className: "bg-emerald-50 text-emerald-600 border-emerald-100" };
}

export default function StockPage() {
  const qc = useQueryClient();
  const addToast = useToast((state) => state.addToast);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  const importInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [movementTarget, setMovementTarget] = useState<StockItem | null>(null);
  const [inTarget, setInTarget] = useState<StockItem | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<StockItem | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stock", search, categoryId, status, page],
    queryFn: () =>
      listStock({
        search: search || undefined,
        categoryId,
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const stocks = data?.stocks ?? [];
  const valuation = data?.valuation;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function closeDialogs() {
    setMovementTarget(null);
    setInTarget(null);
    setAdjustTarget(null);
    setQuantity("");
    setNote("");
  }

  function refreshStock(message: string) {
    qc.invalidateQueries({ queryKey: ["stock"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["products-all"] });
    qc.invalidateQueries({ queryKey: ["stock-movements"] });
    addToast(message, "success");
    closeDialogs();
  }

  const inMutation = useMutation({
    mutationFn: (vars: { productId: number; quantity: number; note: string }) =>
      stockIn(vars.productId, vars.quantity, vars.note),
    onSuccess: (_, vars) => refreshStock(`เพิ่มสต็อก ${formatNumber(vars.quantity)} สำเร็จ`),
  });

  const adjustMutation = useMutation({
    mutationFn: (vars: { productId: number; quantity: number; note: string }) =>
      adjustStock(vars.productId, vars.quantity, vars.note),
    onSuccess: (_, vars) => refreshStock(`ปรับยอดเป็น ${formatNumber(vars.quantity)} สำเร็จ`),
  });

  const importMutation = useMutation({
    mutationFn: importStock,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-all"] });
    qc.invalidateQueries({ queryKey: ["stock-movements"] });
      addToast(
        `Import สำเร็จ ${result.total} รายการ (ปรับยอด ${result.updated}, เท่าเดิม ${result.unchanged})`,
        "success"
      );
    },
  });

  async function handleExport() {
    setIsExporting(true);
    try {
      // Export what the filters currently show, not just the visible page.
      const filters = { search: search || undefined, categoryId, status: status || undefined };
      const EXPORT_CHUNK = 200; // the API's per-page ceiling
      const result = await listStock({ ...filters, page: 1, limit: EXPORT_CHUNK });
      const pages = Math.ceil(result.total / EXPORT_CHUNK);
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
          listStock({ ...filters, page: i + 2, limit: EXPORT_CHUNK })
        )
      );
      const stocks = [result, ...rest].flatMap((chunk) => chunk.stocks);
      exportStockExcel(stocks);
      addToast(`Export สำเร็จ ${stocks.length} รายการ`, "success");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const rows = await readStockExcel(file);
      if (rows.length === 0) throw new Error("ไม่พบข้อมูลสต็อกในไฟล์");
      importMutation.mutate(rows);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "อ่านไฟล์ Excel ไม่สำเร็จ", "error");
    }
  }

  const target = inTarget ?? adjustTarget;
  const isAdjust = !!adjustTarget;
  const parsedQty = Number(quantity);
  const qtyValid =
    quantity.trim() !== "" &&
    Number.isInteger(parsedQty) &&
    (isAdjust ? parsedQty >= 0 : parsedQty > 0);
  const saving = inMutation.isPending || adjustMutation.isPending;

  function submitDialog() {
    if (!target || !qtyValid) return;
    const vars = { productId: target.product.id, quantity: parsedQty, note: note.trim() };
    if (isAdjust) adjustMutation.mutate(vars);
    else inMutation.mutate(vars);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategory(value: string) {
    setCategoryId(value ? Number(value) : undefined);
    setPage(1);
  }

  function handleStatus(value: StatusFilter) {
    setStatus(value);
    setPage(1);
  }

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">สต็อกสินค้า</h1>
          <p className="page-description">Stock on hand</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => importInputRef.current?.click()}
            disabled={importMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {importMutation.isPending ? "กำลัง Import..." : "นำเข้า Excel"}
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "กำลัง Export..." : "ส่งออก Excel"}
          </Button>
          <Button asChild className="col-span-2 w-full sm:w-auto">
            <Link href="/stock/receive">
              <Truck className="w-4 h-4 mr-2" />
              รับสต็อกเข้าร้าน
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ค้นหาสินค้า / barcode..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <select
          aria-label="กรองตามหมวดหมู่"
          className="h-10 rounded-xl border border-white/75 bg-white/55 px-3 text-sm text-slate-700 backdrop-blur-sm"
          value={categoryId ?? ""}
          onChange={(e) => handleCategory(e.target.value)}
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value || "all"}
              size="sm"
              variant={status === tab.value ? "default" : "outline"}
              onClick={() => handleStatus(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Valuation — the whole filtered set, not just this page */}
      {valuation && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-500">มูลค่าต้นทุนคงคลัง</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{formatCurrency(valuation.cost)}</p>
            <p className="text-xs text-slate-400">{formatNumber(valuation.quantity)} ชิ้น</p>
          </div>
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-500">มูลค่าตามราคาขาย</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{formatCurrency(valuation.retail)}</p>
          </div>
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-500">กำไรถ้าขายหมด</p>
            <p className="mt-0.5 text-xl font-bold text-emerald-600">{formatCurrency(valuation.profit)}</p>
          </div>
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-500">กำไรต่อทุน</p>
            <p className="mt-0.5 text-xl font-bold text-emerald-600">{formatPercent(valuation.markup)}</p>
            <p className="text-xs text-slate-400">{formatPercent(valuation.margin)} ของราคาขาย</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ราคา</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ต้นทุน</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">กำไร/ชิ้น</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">มูลค่าคงเหลือ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">รับเข้า</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">จ่ายออก</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">คงเหลือ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">ไม่พบสินค้า</td></tr>
              ) : (
                stocks.map((item) => {
                  const tone = stockTone(item);
                  const cost = Number(item.product.costPrice);
                  const unitProfit = Number(item.product.sellPrice) - cost;
                  return (
                    <tr key={item.id} className="glass-row-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-8 h-8 rounded flex-shrink-0"
                          />
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{item.product.barcode || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.product.category.name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.product.sellPrice)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(item.product.costPrice)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span className={cn("font-medium", unitProfit < 0 ? "text-rose-600" : "text-emerald-600")}>
                          {formatCurrency(unitProfit)}
                        </span>
                        <span className="ml-1 text-xs text-slate-400">
                          {formatPercent(markupOf(cost, unitProfit))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(cost * item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatNumber(item.totalIn)}</td>
                      <td className="px-4 py-3 text-right text-rose-600">{formatNumber(item.totalOut)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">
                            {formatNumber(item.quantity)} {item.product.unit}
                          </span>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", tone.className)}>
                            {tone.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`ดูการเคลื่อนไหวของ ${item.product.name}`}
                            onClick={() => { closeDialogs(); setMovementTarget(item); }}
                          >
                            <ArrowLeftRight className="w-4 h-4 mr-1" />
                            การเคลื่อนไหว
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => { closeDialogs(); setInTarget(item); }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            เพิ่มจำนวน
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { closeDialogs(); setAdjustTarget(item); setQuantity(String(item.quantity)); }}
                          >
                            <SlidersHorizontal className="w-4 h-4 mr-1" />
                            ปรับยอด
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/40 px-3 py-3 glass-header sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-sm text-gray-500">แสดง {startItem}–{endItem} จาก {total} รายการ</p>
            <div className="flex items-center justify-center gap-1">
              <Button
                aria-label="หน้าก่อนหน้า"
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm text-gray-600">{page} / {totalPages}</span>
              <Button
                aria-label="หน้าถัดไป"
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <MovementsDialog
        item={movementTarget}
        onOpenChange={(open) => { if (!open) setMovementTarget(null); }}
      />

      {/* Stock in / adjust dialog */}
      <Dialog open={!!target} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAdjust ? "ปรับยอดสต็อก" : "เพิ่มจำนวนสต็อก"}</DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-3 py-1 text-sm">
              <div>
                <p className="font-semibold text-gray-900">{target.product.name}</p>
                <p className="text-xs text-gray-500">
                  คงเหลือปัจจุบัน {formatNumber(target.quantity)} {target.product.unit}
                </p>
              </div>
              <div className="space-y-1">
                <label htmlFor="stock-qty" className="text-xs font-medium text-gray-600">
                  {isAdjust ? "จำนวนคงเหลือใหม่" : "จำนวนที่เพิ่ม"}
                </label>
                <Input
                  id="stock-qty"
                  type="number"
                  inputMode="numeric"
                  min={isAdjust ? 0 : 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitDialog(); }}
                  autoFocus
                />
                {!isAdjust && qtyValid && (
                  <p className="text-xs text-gray-500">
                    หลังเพิ่มจะเป็น {formatNumber(target.quantity + parsedQty)} {target.product.unit}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="stock-note" className="text-xs font-medium text-gray-600">หมายเหตุ</label>
                <Input
                  id="stock-note"
                  placeholder={isAdjust ? "เช่น นับสต็อกประจำเดือน" : "เช่น รับของจากซัพพลายเออร์"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitDialog(); }}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialogs} disabled={saving}>ยกเลิก</Button>
            <Button onClick={submitDialog} disabled={!qtyValid || saving}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
