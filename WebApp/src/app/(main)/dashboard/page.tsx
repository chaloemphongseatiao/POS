"use client";

import { useQuery } from "@tanstack/react-query";
import { getSummary, getTopProducts } from "@/lib/api/reports";
import { listOrders } from "@/lib/api/orders";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { Loader2 } from "lucide-react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const showCost = isAdmin();
  const today = todayStr();
  const endOfDay = `${today}T23:59:59`;

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboard-summary", today],
    queryFn: () => getSummary(today, endOfDay),
  });
  const { data: topProducts = [], isLoading: isTopProductsLoading } = useQuery({
    queryKey: ["dashboard-top-products", today],
    queryFn: () => getTopProducts(today, endOfDay, 5),
  });
  const { data: recentOrders, isLoading: isRecentOrdersLoading } = useQuery({
    queryKey: ["dashboard-recent-orders", today],
    queryFn: () => listOrders({ from: today, to: endOfDay, page: 1, limit: 5 }),
  });

  const orderCount = summary?.orderCount ?? 0;
  const averageTicket = orderCount ? (summary?.revenue ?? 0) / orderCount : 0;
  const maxQuantity = Math.max(...topProducts.map((product) => product.qty), 1);

  if (isSummaryLoading && isTopProductsLoading && isRecentOrdersLoading) {
    return (
      <div className="page-shell">
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header>
        <h1 className="page-title">ภาพรวมยอดขาย</h1>
        <p className="page-description">
          Dashboard · วันนี้ {new Date().toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="ยอดขายวันนี้" value={formatCurrency(summary?.revenue ?? 0)} />
        <MetricCard label="จำนวนบิล" value={`${orderCount} บิล`} />
        <MetricCard label="ค่าเฉลี่ยต่อบิล" value={formatCurrency(averageTicket)} />
      </section>

      {showCost && (
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="ต้นทุนขายวันนี้" value={formatCurrency(summary?.cost ?? 0)} />
          <MetricCard
            label="กำไรวันนี้"
            value={formatCurrency(summary?.profit ?? 0)}
            hint={`กำไร ${formatPercent(summary?.margin ?? 0)} ของยอดขาย`}
          />
          <MetricCard
            label="กำไรต่อทุน"
            value={formatPercent(summary?.markup ?? 0)}
            hint="กำไรคิดเป็น % ของต้นทุน"
          />
        </section>
      )}

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass rounded-[20px] p-5 md:p-6">
          <h2 className="mb-5 text-[15px] font-extrabold text-slate-900">สินค้าขายดี</h2>
          {topProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">ยังไม่มีการขายวันนี้</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div key={product.productId}>
                  <div className="mb-1.5 flex justify-between gap-4 text-sm">
                    <span className="truncate font-bold text-slate-800">{product.name}</span>
                    <span className="shrink-0 text-slate-500">
                      {showCost && product.profit !== undefined
                        ? `กำไร ${formatCurrency(product.profit)} · `
                        : ""}
                      {product.qty} {product.unit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${Math.max((product.qty / maxQuantity) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-[20px] p-5 md:p-6">
          <h2 className="mb-4 text-[15px] font-extrabold text-slate-900">รายการล่าสุด</h2>
          {recentOrders?.orders.length ? (
            <div>
              {recentOrders.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 border-b border-slate-900/10 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-bold text-slate-800">{order.orderNumber}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {new Date(order.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {order.paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900">
                    {formatCurrency(order.totalAmt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">ยังไม่มีรายการวันนี้</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-[18px] p-5">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900 md:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
