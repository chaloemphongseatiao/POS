"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCart } from "@/lib/hooks/useCart";
import { useAuth } from "@/lib/hooks/useAuth";
import { listProducts, getProductByBarcode } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { createOrder } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { createBarcodeListener, digitFromCode } from "@/lib/utils/barcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaymentModal from "@/components/pos/PaymentModal";
import ReceiptModal from "@/components/pos/ReceiptModal";
import { Product, PaymentMethod, Order } from "@/lib/types";
import { Search, Trash2, Plus, Minus, ShoppingCart, CheckCircle2, XCircle, Barcode } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function PosPage() {
  const { user } = useAuth();
  const cart = useCart();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [showPayment, setShowPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const { data: productData } = useQuery({
    queryKey: ["products", search, selectedCategory],
    queryFn: () => listProducts({ search, categoryId: selectedCategory ?? undefined, limit: 200 }),
    placeholderData: (prev) => prev,
  });
  const products = productData?.products ?? [];

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      setShowPayment(false);
      setCompletedOrder(order);
      cart.clearCart();
      setToast({
        message: `ชำระเงินสำเร็จ ${order.orderNumber}\nยอด ${formatCurrency(order.totalAmt)}`,
        type: "success",
      });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "เกิดข้อผิดพลาด";
      setToast({ message: msg, type: "error" });
      setShowPayment(false);
    },
  });

  const addProductToCart = useCallback(
    (product: Product) => {
      cart.addItem({
        productId: product.id,
        name: product.name,
        sellPrice: parseFloat(product.sellPrice),
        unit: product.unit,
        imageUrl: product.imageUrl,
      });
    },
    [cart]
  );

  const lookupByBarcode = useCallback(
    async (barcode: string) => {
      setSearch("");
      try {
        const product = await getProductByBarcode(barcode);
        addProductToCart(product);
      } catch {
        setToast({ message: `ไม่พบสินค้า barcode: ${barcode}`, type: "error" });
      }
    },
    [addProductToCart]
  );

  // Barcode scanner (Enter/NumpadEnter suffix)
  useEffect(() => {
    const listener = createBarcodeListener(lookupByBarcode);
    listener.attach();
    return () => listener.detach();
  }, [lookupByBarcode]);

  // Fallback for scanners configured without an Enter/Tab suffix key: once
  // the digit buffer goes quiet, treat it as a finished barcode. Enter-based
  // scanners never hit this — their keydown handler clears `search` first,
  // which cancels the pending timeout via this effect's cleanup.
  useEffect(() => {
    const barcode = search.trim();
    if (!/^\d{4,}$/.test(barcode)) return;
    const t = setTimeout(() => lookupByBarcode(barcode), 400);
    return () => clearTimeout(t);
  }, [search, lookupByBarcode]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), toast.type === "success" ? 4000 : 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function handleConfirmPayment(amountPaid: number) {
    if (!user) return;
    orderMutation.mutate({
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      paymentMethod,
      amountPaid,
      discountAmt: cart.discountAmt,
    });
  }

  const filteredProducts = products.filter((p) =>
    selectedCategory ? p.category.id === selectedCategory : true
  );

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-5 p-4 md:h-dvh md:min-h-0 md:p-6 lg:flex-row lg:overflow-hidden">
      {/* Toast notification */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          toast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        }`}
      >
        {toast && (
          <div
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
            className={cn(
              "flex items-start gap-3 rounded-2xl px-4 py-3 min-w-[240px] max-w-xs backdrop-blur-xl border shadow-xl",
              toast.type === "success"
                ? "bg-emerald-50/90 border-emerald-100/80 text-emerald-700"
                : "bg-red-50/90 border-red-100/80 text-red-700"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              {toast.message.split("\n").map((line, i) => (
                <p key={i} className={i === 0 ? "font-semibold text-sm" : "text-xs opacity-80 mt-0.5"}>
                  {line}
                </p>
              ))}
            </div>
            <button
              type="button"
              aria-label="ปิดการแจ้งเตือน"
              onClick={() => setToast(null)}
              className="ml-1 rounded opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Left: Product Browser */}
      <div className="flex min-h-[65dvh] min-w-0 flex-1 flex-col gap-4 overflow-hidden lg:min-h-0">
        <div>
          <h1 className="text-xl font-bold text-slate-950 md:text-2xl tracking-tight">หน้าขายสินค้า</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Point of Sale ·{" "}
            {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Search */}
        <div className="glass mx-auto flex w-[calc(100%-2rem)] items-center gap-2.5 rounded-2xl px-4 py-2.5 transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Barcode className="w-[18px] h-[18px] text-primary flex-shrink-0" />
          <input
            aria-label="ค้นหาสินค้าหรือสแกน Barcode"
            placeholder="ค้นหาสินค้า หรือสแกน Barcode แล้วกด Enter..."
            className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (/^\d{4,}$/.test(search.trim())) {
                  e.preventDefault();
                  e.stopPropagation();
                  lookupByBarcode(search.trim());
                }
                return;
              }

              // Thai (and other non-Latin) keyboard layouts remap the digit
              // row to language-specific glyphs, so scanner/manual digit
              // input gets garbled. Force digit keys to real digits
              // regardless of the active OS layout.
              if (e.ctrlKey || e.metaKey || e.altKey) return;
              const digit = digitFromCode(e.code);
              if (digit === null) return;
              e.preventDefault();
              const input = e.currentTarget;
              const start = input.selectionStart ?? search.length;
              const end = input.selectionEnd ?? search.length;
              setSearch(search.slice(0, start) + digit + search.slice(end));
              requestAnimationFrame(() => {
                input.setSelectionRange(start + 1, start + 1);
              });
            }}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all",
              selectedCategory === null
                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                : "glass text-slate-600 hover:bg-white/75"
            )}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all",
                selectedCategory === cat.id
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                  : "glass text-slate-600 hover:bg-white/75"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                aria-label={`${product.name} ราคา ${formatCurrency(product.sellPrice)}`}
                onClick={() => addProductToCart(product)}
                className="glass group rounded-[18px] p-3.5 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="aspect-square bg-slate-100/70 rounded-xl mb-2.5 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <p className="text-xs font-semibold line-clamp-2 text-slate-800">{product.name}</p>
                <p className="text-sm font-extrabold text-primary mt-1">{formatCurrency(product.sellPrice)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="glass flex max-h-[70dvh] w-full flex-col rounded-3xl lg:max-h-none lg:w-[380px] lg:flex-shrink-0 xl:w-[400px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/50">
          <h2 className="font-extrabold text-slate-900">รายการสั่งซื้อ</h2>
          <p className="text-xs font-semibold text-slate-500">{cart.items.length} รายการ</p>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 text-center px-6">
              <ShoppingCart className="w-14 h-14 mb-3" />
              <p className="text-sm text-slate-400">ยังไม่มีสินค้าในรายการ</p>
              <p className="text-xs mt-1 text-slate-300">แตะสินค้าหรือสแกน Barcode เพื่อเพิ่ม</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-2.5">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-300 text-xs">
                    img
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(item.sellPrice)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`ลดจำนวน ${item.name}`}
                    onClick={() => cart.updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-slate-900/10 flex items-center justify-center hover:bg-slate-900/15 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`เพิ่มจำนวน ${item.name}`}
                    onClick={() => cart.updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center hover:bg-indigo-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right w-16 flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(item.sellPrice * item.quantity)}</p>
                  <button
                    type="button"
                    aria-label={`ลบ ${item.name} ออกจากรายการ`}
                    onClick={() => cart.removeItem(item.productId)}
                    className="rounded text-red-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals + Payment */}
        <div className="p-4 border-t border-white/50 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 w-16 flex-shrink-0">ส่วนลด</label>
            <Input
              type="number"
              className="h-8 text-sm"
              placeholder="0"
              value={cart.discountAmt || ""}
              onChange={(e) => cart.setDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Summary */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>ยอดรวม</span>
              <span>{formatCurrency(cart.subtotal())}</span>
            </div>
            {cart.discountAmt > 0 && (
              <div className="flex justify-between text-red-500">
                <span>ส่วนลด</span>
                <span>-{formatCurrency(cart.discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-lg pt-1.5 border-t border-white/60 text-slate-900">
              <span>รวมทั้งสิ้น</span>
              <span className="text-primary">{formatCurrency(cart.total())}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-2 gap-2">
            {(["CASH", "QR_PROMPT_PAY"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={paymentMethod === m}
                onClick={() => setPaymentMethod(m)}
                className={cn(
                  "py-2.5 text-xs font-semibold rounded-xl transition-colors",
                  paymentMethod === m
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                    : "bg-white/60 border border-white/80 text-slate-600 hover:bg-white/80"
                )}
              >
                {m === "CASH" ? "เงินสด" : "QR พร้อมเพย์"}
              </button>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={cart.items.length === 0}
            onClick={() => setShowPayment(true)}
          >
            รับชำระเงิน {cart.items.length > 0 && formatCurrency(cart.total())}
          </Button>

          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={() => cart.clearCart()}
              className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              ล้างรายการ
            </button>
          )}
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        total={cart.total()}
        paymentMethod={paymentMethod}
        onConfirm={handleConfirmPayment}
        onClose={() => setShowPayment(false)}
        loading={orderMutation.isPending}
      />
      <ReceiptModal
        open={!!completedOrder}
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
}
