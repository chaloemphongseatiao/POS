"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getSummary, getTopProducts, getDailyBreakdown } from "@/lib/api/reports";
import { listStock } from "@/lib/api/stock";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  DollarSign, ReceiptText, Warehouse, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function DashboardPage() {
  const today = todayStr();

  const { data: todaySummary } = useQuery({
    queryKey: ["dashboard-summary-today", today],
    queryFn: () => getSummary(today, `${today}T23:59:59`),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["dashboard-top", today],
    queryFn: () => getTopProducts(today, `${today}T23:59:59`, 5),
  });

  const { data: weeklyData = [] } = useQuery({
    queryKey: ["dashboard-weekly"],
    queryFn: () => getDailyBreakdown({ from: last7Days()[0], to: `${today}T23:59:59` }),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: () => listStock({ status: "low_out", limit: 5 }),
  });

  const lowStocks = lowStockData?.stocks ?? [];
  const lowTotal = lowStockData?.total ?? 0;

  const chartData = last7Days().map((d) => {
    const found = weeklyData.find((w) => w.date.slice(0, 10) === d);
    const label = new Date(d + "T00:00:00").toLocaleDateString("th-TH", { weekday: "short", day: "numeric" });
    return { label, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          bg="bg-green-50"
          label="ยอดขายวันนี้"
          value={formatCurrency(todaySummary?.revenue ?? 0)}
        />
        <SummaryCard
          icon={<ReceiptText className="w-5 h-5 text-brand-600" />}
          bg="bg-brand-50"
          label="จำนวนบิล"
          value={`${todaySummary?.orderCount ?? 0} บิล`}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          bg="bg-purple-50"
          label="กำไรวันนี้"
          value={formatCurrency(todaySummary?.profit ?? 0)}
        />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
          bg="bg-yellow-50"
          label="Stock ใกล้หมด"
          value={`${lowTotal} รายการ`}
          href="/stock"
          warn={lowTotal > 0}
        />
      </div>

      {/* Chart + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <p className="font-semibold text-sm mb-4">ยอดขาย 7 วันย้อนหลัง</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "ยอดขาย"]}
                labelStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#0A3D91" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm">สินค้าขายดีวันนี้</p>
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีการขายวันนี้</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty} {p.unit}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600 flex-shrink-0">
                    {formatCurrency(p.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low stock */}
      {lowTotal > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <p className="font-semibold text-sm">Stock ใกล้หมด / หมด ({lowTotal} รายการ)</p>
            </div>
            <Link href="/stock">
              <Button variant="outline" size="sm">
                จัดการ <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-white/40">
            {lowStocks.map((s) => {
              const isOut = s.quantity <= 0;
              return (
                <div key={s.id} className="flex items-center gap-3 py-2.5">
                  <Warehouse className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="flex-1 text-sm">{s.product.name}</p>
                  <Badge variant={isOut ? "destructive" : "warning"}>
                    {isOut ? "หมด" : "ใกล้หมด"}
                  </Badge>
                  <p className={`text-sm font-bold w-16 text-right ${isOut ? "text-red-600" : "text-yellow-600"}`}>
                    {s.quantity} {s.product.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon, bg, label, value, href, warn,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  href?: string;
  warn?: boolean;
}) {
  const inner = (
    <div className={`glass rounded-2xl p-4 space-y-3 ${warn ? "ring-1 ring-yellow-300" : ""}`}>
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
