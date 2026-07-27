"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { listStock, stockIn, adjustStock } from "@/lib/api/stock";
import { listCategories } from "@/lib/api/categories";
import { StockItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import StockInDialog from "@/components/stock/StockInDialog";
import AdjustStockDialog from "@/components/stock/AdjustStockDialog";
import { Search, PackagePlus, SlidersHorizontal, AlertTriangle, History, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "normal", label: "ปกติ" },
  { value: "low",    label: "ใกล้หมด" },
  { value: "out",    label: "หมด" },
];

const PAGE_SIZE = 10;

export default function StockPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [status, setStatus] = useState<"" | "normal" | "low" | "out">("");
  const [page, setPage] = useState(1);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [showStockIn, setShowStockIn] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["stock", search, categoryId, status, page],
    queryFn: () => listStock({ search, categoryId, status: status || undefined, page, limit: PAGE_SIZE }),
  });

  const stocks = data?.stocks ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  // นับ low stock แยก (ไม่ขึ้นกับ filter)
  const { data: lowData } = useQuery({
    queryKey: ["stock-low-count"],
    queryFn: () => listStock({ lowOnly: true, limit: 999 }),
  });
  const lowCount = lowData?.total ?? 0;

  const stockInMutation = useMutation({
    mutationFn: ({ productId, quantity, note }: { productId: number; quantity: number; note: string }) =>
      stockIn(productId, quantity, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["stock-low-count"] });
      setShowStockIn(false);
      setSelectedStock(null);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ productId, quantity, note }: { productId: number; quantity: number; note: string }) =>
      adjustStock(productId, quantity, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["stock-low-count"] });
      setShowAdjust(false);
      setSelectedStock(null);
    },
  });

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategory(value: string) {
    setCategoryId(value ? Number(value) : undefined);
    setPage(1);
  }

  function handleStatus(value: string) {
    setStatus(value as "" | "normal" | "low" | "out");
    setPage(1);
  }

  function getStatus(s: StockItem) {
    if (s.quantity <= 0) return { label: "หมด", variant: "destructive" as const };
    if (s.quantity <= s.product.lowStockAt) return { label: "ใกล้หมด", variant: "warning" as const };
    return { label: "ปกติ", variant: "success" as const };
  }

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">คลังสินค้า</h1>
          <p className="text-sm text-gray-500">{total} รายการ</p>
        </div>
        <Link href="/stock/movements">
          <Button variant="outline">
            <History className="w-4 h-4 mr-2" />
            ประวัติการเคลื่อนไหว
          </Button>
        </Link>
      </div>

      {/* Low stock alert */}
      {lowCount > 0 && (
        <button
          onClick={() => handleStatus(status === "low" || status === "out" ? "" : "low")}
          className={`w-full flex items-center gap-3 rounded-lg p-3 text-sm border transition-colors ${
            status === "low" || status === "out"
              ? "bg-yellow-100 border-yellow-400 text-yellow-900"
              : "bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            มีสินค้า <strong>{lowCount} รายการ</strong> ที่ stock ใกล้หมดหรือหมดแล้ว
          </span>
          <span className="ml-auto text-xs underline">
            {status === "low" || status === "out" ? "ดูทั้งหมด" : "คลิกดูรายการ"}
          </span>
        </button>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ค้นหาสินค้า หรือ barcode..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Combobox
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          value={categoryId ? String(categoryId) : ""}
          onChange={(v) => handleCategory(v)}
          placeholder="ทุกหมวดหมู่"
          searchPlaceholder="ค้นหาหมวดหมู่..."
          className="min-w-[180px]"
        />
        <Combobox
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => handleStatus(v)}
          placeholder="ทุกสถานะ"
          searchPlaceholder="ค้นหาสถานะ..."
          className="min-w-[150px]"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">คงเหลือ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">แจ้งเตือนเมื่อ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบสินค้า</td></tr>
              ) : (
                stocks.map((s) => {
                  const status = getStatus(s);
                  return (
                    <tr key={s.id} className="glass-row-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.product.imageUrl ? (
                            <img
                              src={s.product.imageUrl}
                              alt={s.product.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300 text-xs">
                              img
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{s.product.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{s.product.barcode || "ไม่มี barcode"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.product.category.name}</td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        s.quantity <= 0 ? "text-red-600" : s.quantity <= s.product.lowStockAt ? "text-yellow-600" : ""
                      }`}>
                        {s.quantity} {s.product.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {s.product.lowStockAt} {s.product.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="sm" variant="outline"
                            onClick={() => { setSelectedStock(s); setShowStockIn(true); }}
                          >
                            <PackagePlus className="w-3.5 h-3.5 mr-1" />
                            รับเข้า
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            onClick={() => { setSelectedStock(s); setShowAdjust(true); }}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
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

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 glass-header">
            <p className="text-sm text-gray-500">
              แสดง {startItem}–{endItem} จาก {total} รายการ
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
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
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="icon"
                      onClick={() => setPage(p as number)}
                      className="w-9 h-9 text-sm"
                    >
                      {p}
                    </Button>
                  )
                )}

              <Button
                variant="outline" size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <StockInDialog
        open={showStockIn}
        stock={selectedStock}
        onConfirm={(productId, quantity, note) =>
          stockInMutation.mutate({ productId, quantity, note })
        }
        onClose={() => { setShowStockIn(false); setSelectedStock(null); }}
        loading={stockInMutation.isPending}
      />

      <AdjustStockDialog
        open={showAdjust}
        stock={selectedStock}
        onConfirm={(productId, newQuantity, note) =>
          adjustMutation.mutate({ productId, quantity: newQuantity, note })
        }
        onClose={() => { setShowAdjust(false); setSelectedStock(null); }}
        loading={adjustMutation.isPending}
      />
    </div>
  );
}
