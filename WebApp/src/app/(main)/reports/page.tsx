"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSummary, getDailyBreakdown, getTopProducts } from "@/lib/api/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/utils/formatCurrency";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, Calendar, CalendarRange } from "lucide-react";

type Mode = "month" | "range";

function toEndOfDay(dateStr: string) {
  return `${dateStr}T23:59:59`;
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState(thisMonth);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // คำนวณ from/to ตาม mode
  const from = mode === "month"
    ? `${month}-01`
    : fromDate;
  const to = mode === "month"
    ? new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10)
    : toDate;

  const { data: summary, isFetching: loadingSummary } = useQuery({
    queryKey: ["report-summary", from, to],
    queryFn: () => getSummary(from, toEndOfDay(to)),
  });

  const { data: daily = [], isFetching: loadingDaily } = useQuery({
    queryKey: ["report-daily", mode, month, fromDate, toDate],
    queryFn: () =>
      mode === "month"
        ? getDailyBreakdown({ month })
        : getDailyBreakdown({ from, to: toEndOfDay(to) }),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["report-top", from, to],
    queryFn: () => getTopProducts(from, toEndOfDay(to), 10),
  });

  const chartData = daily.map((d) => ({
    date: d.date.slice(5),
    ยอดขาย: d.revenue,
    ต้นทุน: d.cost,
    กำไร: d.revenue - d.cost,
  }));

  const isLoading = loadingSummary || loadingDaily;

  const rangeLabel = mode === "month"
    ? `เดือน ${month}`
    : fromDate === toDate
    ? fromDate
    : `${fromDate} — ${toDate}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">รายงานยอดขาย</h1>
          <p className="text-sm text-gray-400 mt-0.5">{rangeLabel}</p>
        </div>

        {/* Date filter */}
        <div className="bg-white border rounded-xl p-3 flex flex-col gap-3 min-w-[320px]">
          {/* Mode toggle */}
          <div className="flex rounded-lg border overflow-hidden text-sm">
            <button
              onClick={() => setMode("month")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${
                mode === "month" ? "bg-primary text-white" : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              รายเดือน
            </button>
            <button
              onClick={() => setMode("range")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${
                mode === "range" ? "bg-primary text-white" : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              ช่วงวันที่
            </button>
          </div>

          {mode === "month" ? (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">วันที่เริ่มต้น</p>
                <Input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <span className="text-gray-400 mt-5">—</span>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">วันที่สิ้นสุด</p>
                <Input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={today}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Shortcut buttons (range mode) */}
          {mode === "range" && (
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: "วันนี้", fn: () => { setFromDate(today); setToDate(today); } },
                {
                  label: "7 วัน", fn: () => {
                    const d = new Date(); d.setDate(d.getDate() - 6);
                    setFromDate(d.toISOString().slice(0, 10)); setToDate(today);
                  },
                },
                {
                  label: "30 วัน", fn: () => {
                    const d = new Date(); d.setDate(d.getDate() - 29);
                    setFromDate(d.toISOString().slice(0, 10)); setToDate(today);
                  },
                },
                {
                  label: "เดือนนี้", fn: () => {
                    setFromDate(`${thisMonth}-01`); setToDate(today);
                  },
                },
              ].map(({ label, fn }) => (
                <Button key={label} variant="outline" size="sm" onClick={fn} className="h-7 text-xs px-2.5">
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ยอดขาย", value: summary?.revenue ?? 0, icon: <DollarSign className="w-5 h-5 text-primary" />, sub: null },
          { label: "ต้นทุน", value: summary?.cost ?? 0, icon: <TrendingDown className="w-5 h-5 text-red-500" />, sub: null },
          {
            label: "กำไรขั้นต้น", value: summary?.profit ?? 0,
            icon: <TrendingUp className="w-5 h-5 text-green-500" />,
            sub: `Margin ${(summary?.margin ?? 0).toFixed(1)}%`, green: true,
          },
          {
            label: "จำนวนออเดอร์", value: summary?.orderCount ?? 0,
            icon: <ShoppingBag className="w-5 h-5 text-brand-500" />,
            sub: "ออเดอร์", count: true,
          },
        ].map(({ label, value, icon, sub, green, count }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{label}</span>
                {icon}
              </div>
              <p className={`text-2xl font-bold ${green ? "text-green-600" : ""} ${isLoading ? "opacity-40" : ""}`}>
                {count ? formatNumber(value) : formatCurrency(value)}
              </p>
              {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle>ยอดขายรายวัน</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              ยังไม่มีข้อมูลในช่วงนี้
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="ยอดขาย" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="กำไร" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>สินค้าขายดี Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-500 font-medium">#</th>
                    <th className="text-left py-2 text-gray-500 font-medium">สินค้า</th>
                    <th className="text-right py-2 text-gray-500 font-medium">จำนวน</th>
                    <th className="text-right py-2 text-gray-500 font-medium">ยอดขาย</th>
                    <th className="text-right py-2 text-gray-500 font-medium">กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={p.productId} className="border-b last:border-0">
                      <td className="py-2.5 text-gray-400">{i + 1}</td>
                      <td className="py-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5 text-right text-gray-500">{p.qty} {p.unit}</td>
                      <td className="py-2.5 text-right">{formatCurrency(p.revenue)}</td>
                      <td className="py-2.5 text-right text-green-600 font-medium">{formatCurrency(p.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
