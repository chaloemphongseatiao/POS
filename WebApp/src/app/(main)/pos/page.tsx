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
import { Badge } from "@/components/ui/badge";
import PaymentModal from "@/components/pos/PaymentModal";
import ReceiptModal from "@/components/pos/ReceiptModal";
import { Product, PaymentMethod, Order } from "@/lib/types";
import { Search, Trash2, Plus, Minus, ShoppingCart, CheckCircle2, XCircle } from "lucide-react";

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
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col overflow-hidden md:h-dvh md:min-h-0 lg:flex-row">
      {/* Toast notification */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          toast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        }`}
      >
        {toast && (
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-white min-w-[240px] max-w-xs ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              {toast.message.split("\n").map((line, i) => (
                <p key={i} className={i === 0 ? "font-semibold text-sm" : "text-xs opacity-90 mt-0.5"}>
                  {line}
                </p>
              ))}
            </div>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 ml-1">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Left: Product Browser */}
      <div className="flex min-h-[65dvh] flex-1 flex-col overflow-hidden lg:min-h-0">
        {/* Search */}
        <div className="p-4 bg-white border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหาสินค้า หรือสแกน Barcode..."
              className="pl-9"
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
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const qty = product.stock?.quantity ?? 0;
              const isLow = qty > 0 && qty <= product.lowStockAt;
              const isOut = qty <= 0;
              return (
                <button
                  key={product.id}
                  onClick={() => addProductToCart(product)}
                  className="bg-white rounded-xl p-3 border text-left transition-all hover:shadow-md active:scale-95 hover:border-primary"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ShoppingCart className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-2 text-gray-800">{product.name}</p>
                  <p className="text-sm font-bold text-primary mt-1">{formatCurrency(product.sellPrice)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">คงเหลือ {qty} {product.unit}</span>
                    {isLow && <Badge variant="warning" className="text-xs px-1">น้อย</Badge>}
                    {isOut && <Badge variant="destructive" className="text-xs px-1">หมด</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex max-h-[70dvh] w-full flex-col border-t bg-white lg:max-h-none lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-800">รายการสินค้า</h2>
          <p className="text-xs text-gray-400">{cart.items.length} รายการ</p>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart className="w-16 h-16 mb-3" />
              <p className="text-sm">ยังไม่มีรายการสินค้า</p>
              <p className="text-xs mt-1">คลิกสินค้าหรือสแกน Barcode</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 text-xs">
                    img
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-primary">{formatCurrency(item.sellPrice)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cart.updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => cart.updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(item.sellPrice * item.quantity)}</p>
                  <button onClick={() => cart.removeItem(item.productId)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals + Payment */}
        <div className="p-4 border-t space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 w-16 flex-shrink-0">ส่วนลด</label>
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
            <div className="flex justify-between text-gray-500">
              <span>รวม</span>
              <span>{formatCurrency(cart.subtotal())}</span>
            </div>
            {cart.discountAmt > 0 && (
              <div className="flex justify-between text-red-500">
                <span>ส่วนลด</span>
                <span>-{formatCurrency(cart.discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1 border-t">
              <span>ยอดรวม</span>
              <span className="text-primary">{formatCurrency(cart.total())}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-2 gap-1.5">
            {(["CASH", "QR_PROMPT_PAY"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-2 text-xs rounded-lg border transition-colors ${
                  paymentMethod === m ? "bg-primary text-white border-primary" : "border-gray-200 hover:bg-gray-50"
                }`}
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
              onClick={() => cart.clearCart()}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors"
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
