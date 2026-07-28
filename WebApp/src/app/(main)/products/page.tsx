"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProducts, createProduct, updateProduct, deleteProduct, importProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { Product } from "@/lib/types";
import { exportProductsExcel, readProductsExcel } from "@/lib/productsExcel";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ProductFormDialog, { ProductFormData } from "@/components/products/ProductFormDialog";
import CategoryPanel from "@/components/products/CategoryPanel";
import { useCategoryCounts } from "@/lib/hooks/useCategoryCounts";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Download, Upload } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const qc = useQueryClient();
  const addToast = useToast((state) => state.addToast);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [savedInfo, setSavedInfo] = useState<{ name: string; isNew: boolean } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const { counts: categoryCounts, grandTotal } = useCategoryCounts();

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

  const importMutation = useMutation({
    mutationFn: importProducts,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["products-all"] });
      addToast(`Import สำเร็จ ${result.total} รายการ (เพิ่ม ${result.created}, อัปเดต ${result.updated})`, "success");
    },
  });

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await listProducts({ search, categoryId, all: true, page: 1, limit: 100000 });
      exportProductsExcel(result.products);
      addToast(`Export สำเร็จ ${result.products.length} รายการ`, "success");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const rows = await readProductsExcel(file);
      if (rows.length === 0) throw new Error("ไม่พบข้อมูลสินค้าในไฟล์");
      importMutation.mutate(rows);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "อ่านไฟล์ Excel ไม่สำเร็จ", "error");
    }
  }

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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">สินค้าและหมวดหมู่</h1>
          <p className="page-description">Products & Categories</p>
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
          <Button className="w-full sm:w-auto" variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "กำลัง Export..." : "ส่งออก Excel"}
          </Button>
          <Button className="col-span-2 w-full sm:w-auto" onClick={() => { setEditProduct(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มสินค้า
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <CategoryPanel
          categories={categories}
          counts={categoryCounts}
          grandTotal={grandTotal}
          selectedId={categoryId}
          onSelect={(id) => handleCategory(id ? String(id) : "")}
        />

        <div className="min-w-0 flex-1 space-y-4">
          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหาสินค้า..."
              className="pl-9"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
            <thead className="glass-header border-b border-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Barcode</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาขาย</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบสินค้า</td></tr>
              ) : (
                products.map((p) => {
                  const qty = p.stock?.quantity ?? 0;
                  const isLow = qty > 0 && qty <= p.lowStockAt;
                  const isOut = qty <= 0;
                  return (
                    <tr key={p.id} className="glass-row-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded flex-shrink-0" />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.barcode || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category.name}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.sellPrice)}</td>
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
                          <Button aria-label={`แก้ไขสินค้า ${p.name}`} size="icon" variant="ghost" onClick={() => { setEditProduct(p); setShowForm(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            aria-label={`ลบสินค้า ${p.name}`}
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
          <div className="flex flex-col gap-3 border-t border-white/40 px-3 py-3 glass-header sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-sm text-gray-500">
              แสดง {startItem}–{endItem} จาก {total} รายการ
            </p>
            <div className="flex items-center justify-center gap-1">
              <Button
                aria-label="หน้าก่อนหน้า"
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
                      aria-label={`หน้า ${p}`}
                      aria-current={page === p ? "page" : undefined}
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
                aria-label="หน้าถัดไป"
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
        </div>
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
