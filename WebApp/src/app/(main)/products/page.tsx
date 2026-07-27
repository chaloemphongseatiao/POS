"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ProductFormDialog, { ProductFormData } from "@/components/products/ProductFormDialog";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [savedInfo, setSavedInfo] = useState<{ name: string; isNew: boolean } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["products-all", search, categoryId, page],
    queryFn: () => listProducts({ search, categoryId, all: true, page, limit: PAGE_SIZE }),
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["products-all"] });
      closeForm();
      setSavedInfo({ name: (vars as { name: string }).name, isNew: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) => updateProduct(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["products-all"] });
      closeForm();
      setSavedInfo({ name: (vars.data as { name?: string }).name ?? editProduct?.name ?? "", isNew: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products-all"] });
      setDeleteTarget(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "เกิดข้อผิดพลาด ไม่สามารถลบได้";
      setDeleteError(msg);
    },
  });

  function closeForm() {
    setShowForm(false);
    setEditProduct(null);
  }

  function handleSave(data: ProductFormData) {
    if (editProduct) {
      console.log("[updateProduct]", { id: editProduct.id, data });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateMutation.mutate({ id: editProduct.id, data: data as any });
    } else {
      console.log("[createProduct]", data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createMutation.mutate(data as any);
    }
  }

  function handleDelete(product: Product) {
    setDeleteTarget(product);
    setDeleteError(null);
  }

  function confirmDelete() {
    if (deleteTarget) {
      setDeleteError(null);
      deleteMutation.mutate(deleteTarget.id);
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategory(value: string) {
    setCategoryId(value ? Number(value) : undefined);
    setPage(1);
  }

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">จัดการสินค้า</h1>
          <p className="text-sm text-gray-500">{total} รายการ</p>
        </div>
        <Button onClick={() => { setEditProduct(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มสินค้า
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ค้นหาสินค้า..."
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
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Barcode</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาทุน</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาขาย</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">ไม่พบสินค้า</td></tr>
              ) : (
                products.map((p) => {
                  const qty = p.stock?.quantity ?? 0;
                  const isLow = qty > 0 && qty <= p.lowStockAt;
                  const isOut = qty <= 0;
                  return (
                    <tr key={p.id} className="glass-row-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">img</div>
                          )}
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.barcode || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(p.costPrice) > 0 ? formatCurrency(p.costPrice) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.sellPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={isOut ? "text-red-600 font-bold" : isLow ? "text-yellow-600 font-medium" : ""}>
                          {qty} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!p.isActive ? (
                          <Badge variant="secondary">ปิดใช้งาน</Badge>
                        ) : isOut ? (
                          <Badge variant="destructive">หมด</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">ใกล้หมด</Badge>
                        ) : (
                          <Badge variant="success">ปกติ</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => { setEditProduct(p); setShowForm(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="text-red-400 hover:text-red-600"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      <ProductFormDialog
        open={showForm}
        product={editProduct}
        categories={categories}
        onSave={handleSave}
        onClose={closeForm}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการลบสินค้า
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            <p>ต้องการลบสินค้า</p>
            <p className="mt-1 font-semibold text-gray-900">"{deleteTarget?.name}"</p>
            <p className="mt-3 text-xs text-red-400">ข้อมูลจะถูกลบออกจากฐานข้อมูลถาวร ไม่สามารถกู้คืนได้</p>
            {deleteError && (
              <p className="mt-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(null); }} disabled={deleteMutation.isPending}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "กำลังลบ..." : "ยืนยันลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Success Dialog */}
      <Dialog open={!!savedInfo} onOpenChange={(open) => { if (!open) setSavedInfo(null); }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="sr-only">
            <DialogTitle>{savedInfo?.isNew ? "เพิ่มสินค้าสำเร็จ" : "บันทึกสำเร็จ"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {savedInfo?.isNew ? "เพิ่มสินค้าสำเร็จ" : "บันทึกสำเร็จ"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium text-gray-700">"{savedInfo?.name}"</span>
                {savedInfo?.isNew ? " ถูกเพิ่มเข้าระบบแล้ว" : " ได้รับการอัปเดตแล้ว"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setSavedInfo(null)}>ตกลง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
