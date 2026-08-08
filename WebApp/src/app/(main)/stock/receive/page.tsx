"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProducts, getProductByBarcode } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { receiveStock, ReceiveStockResult } from "@/lib/api/stock";
import { Product } from "@/lib/types";
import { useToast } from "@/lib/hooks/useToast";
import { createBarcodeListener, useScannerSafeDigitKeyDown } from "@/lib/utils/barcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProductImage } from "@/components/ui/product-image";
import { formatCurrency, formatNumber } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, CheckCircle2, Minus, Plus, Search, Trash2, Truck } from "lucide-react";

interface ReceiveLine {
  productId: number;
  name: string;
  unit: string;
  imageUrl: string | null;
  currentStock: number;
  /** Kept as typed text so the field can be cleared while entering a number. */
  quantity: string;
  /** Empty means "leave the product's cost price untouched". */
  costPrice: string;
}

function qtyOf(line: ReceiveLine): number {
  const parsed = Number(line.quantity);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export default function ReceiveStockPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const addToast = useToast((state) => state.addToast);

  const [search, setSearch] = useState("");
  const handleDigitKeyDown = useScannerSafeDigitKeyDown(search, setSearch);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [lines, setLines] = useState<ReceiveLine[]>([]);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ReceiveStockResult | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const { data: productData } = useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: () => listProducts({ search, categoryId: categoryId ?? undefined, limit: 100 }),
    placeholderData: (prev) => prev,
  });
  const products = productData?.products ?? [];

  const addProduct = useCallback((product: Product) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id ? { ...line, quantity: String(qtyOf(line) + 1) } : line
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          imageUrl: product.imageUrl,
          currentStock: product.stock?.quantity ?? 0,
          quantity: "1",
          costPrice: "",
        },
      ];
    });
  }, []);

  const lookupByBarcode = useCallback(
    async (barcode: string) => {
      setSearch("");
      try {
        addProduct(await getProductByBarcode(barcode));
      } catch {
        addToast(`ไม่พบสินค้า barcode: ${barcode}`, "error");
      }
    },
    [addProduct, addToast]
  );

  // Same scanner handling as the POS screen: Enter-suffixed scanners fire the
  // listener, suffix-less ones fall through to the quiet-buffer timeout below.
  useEffect(() => {
    const listener = createBarcodeListener(lookupByBarcode);
    listener.attach();
    return () => listener.detach();
  }, [lookupByBarcode]);

  useEffect(() => {
    const barcode = search.trim();
    if (!/^\d{4,}$/.test(barcode)) return;
    const timer = setTimeout(() => lookupByBarcode(barcode), 400);
    return () => clearTimeout(timer);
  }, [search, lookupByBarcode]);

  function updateLine(productId: number, patch: Partial<ReceiveLine>) {
    setLines((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, ...patch } : line))
    );
  }

  function removeLine(productId: number) {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }

  const totalQty = lines.reduce((sum, line) => sum + qtyOf(line), 0);
  const totalCost = lines.reduce(
    (sum, line) => sum + (parseFloat(line.costPrice) || 0) * qtyOf(line),
    0
  );

  const canSubmit = useMemo(
    () => lines.length > 0 && lines.every((line) => qtyOf(line) > 0),
    [lines]
  );

  const mutation = useMutation({
    mutationFn: receiveStock,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-all"] });
      setResult(data);
      setLines([]);
      setReference("");
      setNote("");
    },
  });

  function submit() {
    if (!canSubmit) return;
    mutation.mutate({
      reference: reference.trim(),
      note: note.trim(),
      items: lines.map((line) => {
        const cost = parseFloat(line.costPrice);
        return {
          productId: line.productId,
          quantity: qtyOf(line),
          ...(line.costPrice.trim() !== "" && !Number.isNaN(cost) && cost >= 0
            ? { costPrice: cost }
            : {}),
        };
      }),
    });
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button aria-label="กลับไปหน้าสต็อก" variant="outline" size="icon" asChild>
            <Link href="/stock"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="page-title">รับสต็อกเข้าร้าน</h1>
            <p className="page-description">Goods receipt</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Product picker */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหาสินค้า หรือยิงบาร์โค้ด..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleDigitKeyDown}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={categoryId === null ? "default" : "outline"}
              onClick={() => setCategoryId(null)}
            >
              ทั้งหมด
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={categoryId === c.id ? "default" : "outline"}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {products.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-gray-400">ไม่พบสินค้า</p>
            ) : (
              products.map((product) => {
                const inReceipt = lines.find((line) => line.productId === product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className={cn(
                      "glass flex items-center gap-2 rounded-2xl p-2.5 text-left transition-colors hover:bg-white/70",
                      inReceipt && "ring-2 ring-primary/50"
                    )}
                  >
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-gray-400">
                        คงเหลือ {formatNumber(product.stock?.quantity ?? 0)} {product.unit}
                        {inReceipt && qtyOf(inReceipt) > 0 && (
                          <span className="ml-1 text-primary">+{qtyOf(inReceipt)}</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Receipt */}
        <div className="glass w-full shrink-0 rounded-2xl p-4 lg:sticky lg:top-4 lg:w-[420px]">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Truck className="w-4 h-4" />
            รายการรับเข้า ({lines.length})
          </h2>

          <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {lines.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                เลือกสินค้าทางซ้าย หรือยิงบาร์โค้ดเพื่อเพิ่มรายการ
              </p>
            ) : (
              lines.map((line) => {
                const qty = qtyOf(line);
                return (
                <div key={line.productId} className="rounded-xl border border-white/60 bg-white/50 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-gray-400">
                        คงเหลือ {formatNumber(line.currentStock)} → {formatNumber(line.currentStock + qty)} {line.unit}
                      </p>
                    </div>
                    <Button
                      aria-label={`ลบ ${line.name} ออกจากรายการ`}
                      size="icon"
                      variant="ghost"
                      className="size-8 text-red-400 hover:text-red-600"
                      onClick={() => removeLine(line.productId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        aria-label={`ลดจำนวน ${line.name}`}
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() =>
                          updateLine(line.productId, { quantity: String(Math.max(1, qty - 1)) })
                        }
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <Input
                        aria-label={`จำนวนรับเข้า ${line.name}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        className={cn("h-8 w-16 text-center", qty === 0 && "border-red-300 bg-red-50/60")}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.productId, { quantity: e.target.value })}
                      />
                      <Button
                        aria-label={`เพิ่มจำนวน ${line.name}`}
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => updateLine(line.productId, { quantity: String(qty + 1) })}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Input
                      aria-label={`ราคาทุนต่อหน่วย ${line.name}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="ทุน/หน่วย"
                      className="h-8 flex-1"
                      value={line.costPrice}
                      onChange={(e) => updateLine(line.productId, { costPrice: e.target.value })}
                    />
                  </div>
                </div>
                );
              })
            )}
          </div>

          <div className="mt-3 space-y-2 border-t border-white/50 pt-3">
            <Input
              placeholder="เลขที่บิล / ใบส่งของ (ถ้ามี)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <Input
              placeholder="หมายเหตุ เช่น ชื่อซัพพลายเออร์"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex justify-between text-sm text-gray-600">
              <span>จำนวนรวม</span>
              <span className="font-semibold text-gray-900">{formatNumber(totalQty)} ชิ้น</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>มูลค่าทุนรวม</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalCost)}</span>
            </div>

            <Button className="w-full" disabled={!canSubmit || mutation.isPending} onClick={submit}>
              {mutation.isPending ? "กำลังบันทึก..." : "บันทึกรับเข้า"}
            </Button>
            <p className="text-center text-[11px] text-gray-400">
              ใส่ราคาทุนเฉพาะเมื่อต้องการอัปเดตราคาทุนของสินค้า
            </p>
          </div>
        </div>
      </div>

      {/* Success */}
      <Dialog open={!!result} onOpenChange={(open) => { if (!open) setResult(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>รับสต็อกสำเร็จ</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">รับสต็อกสำเร็จ</h3>
              <p className="mt-1 text-sm text-gray-500">
                {result?.itemCount} รายการ รวม {formatNumber(result?.totalQuantity ?? 0)} ชิ้น
              </p>
            </div>
          </div>
          <div className="max-h-52 space-y-1 overflow-y-auto text-sm">
            {result?.items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-2 rounded-lg bg-white/50 px-3 py-1.5">
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-gray-500">
                  +{formatNumber(item.quantity)} → {formatNumber(item.stockAfter)}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResult(null)}>รับเข้าต่อ</Button>
            <Button onClick={() => { setResult(null); router.push("/stock"); }}>ดูสต็อก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
