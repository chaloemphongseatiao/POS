"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSummary, getDailyBreakdown, getTopProducts, getHourly } from "@/lib/api/reports";
import { exportReportExcel } from "@/lib/reportsExcel";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatCurrency";
import { markupOf } from "@/lib/utils/profit";
import { CalendarRange, Download, TrendingUp, Undo2, Receipt, Percent } from "lucide-react";

const QUICK_RANGES = [
  { label: "วันนี้", days: 1 },
  { label: "7 วัน", days: 7 },
  { label: "30 วัน", days: 30 },
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function shortDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "text-slate-800",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: string;
}) {
  return (
    <div className="glass rounded-2xl px-4 py-4">
      <div className="flex items-center gap-2 text-xs text-violet-500/70">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

/** Recharts hands the formatter a loose value type; narrow it before formatting. */
function money(value: unknown): string {
  return formatCurrency(Number(value) || 0);
}

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.7)",
  background: "rgba(255,255,255,0.92)",
  fontSize: 12,
};

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(daysAgo(7));
  const [toDate, setToDate] = useState(today);

  // The API treats `to` as inclusive, so the range must run to the last second
  // of the closing day or that day's sales fall outside every figure.
  const to = `${toDate}T23:59:59`;

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["report-summary", fromDate, toDate],
    queryFn: () => getSummary(fromDate, to),
  });

  const { data: daily = [] } = useQuery({
    queryKey: ["report-daily", fromDate, toDate],
    queryFn: () => getDailyBreakdown({ from: fromDate, to }),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["report-top", fromDate, toDate],
    queryFn: () => getTopProducts(fromDate, to, 10),
  });

  // The hourly view only makes sense for a single day; it follows the end date.
  const { data: hourly = [] } = useQuery({
    queryKey: ["report-hourly", toDate],
    queryFn: () => getHourly(toDate),
  });

  function setQuickRange(days: number) {
    setFromDate(daysAgo(days));
    setToDate(today);
  }

  const revenue = summary?.revenue ?? 0;
  const orderCount = summary?.orderCount ?? 0;
  const averageTicket = orderCount ? revenue / orderCount : 0;
  const showProfit = summary?.profit !== undefined;

  const dailyChart = daily.map((day) => ({ ...day, label: shortDate(day.date) }));
  const hourlyChart = hourly.map((row) => ({ ...row, label: `${String(row.hour).padStart(2, "0")}:00` }));
  const maxRevenue = Math.max(...topProducts.map((p) => Math.abs(p.revenue)), 1);

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">รายงานยอดขาย</h1>
          <p className="page-description">Sales Reports & Analytics</p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            summary && exportReportExcel({ summary, daily, topProducts, from: fromDate, to: toDate })
          }
          disabled={!summary}
        >
          <Download className="mr-2 h-4 w-4" />
          ส่งออก Excel
        </Button>
      </div>

      {/* Date filter */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <CalendarRange className="h-4 w-4" />
          เลือกช่วงวันที่
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-auto">
            <p className="mb-1 text-xs text-gray-500">วันที่เริ่มต้น</p>
            <DatePicker value={fromDate} max={toDate} onChange={setFromDate} ariaLabel="เลือกวันที่เริ่มต้น" />
          </div>
          <span className="mb-1.5 hidden text-gray-400 sm:inline">—</span>
          <div className="w-full sm:w-auto">
            <p className="mb-1 text-xs text-gray-500">วันที่สิ้นสุด</p>
            <DatePicker value={toDate} min={fromDate} max={today} onChange={setToDate} ariaLabel="เลือกวันที่สิ้นสุด" />
          </div>
          <div className="mb-0.5 flex gap-1.5">
            {QUICK_RANGES.map(({ label, days }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                onClick={() => setQuickRange(days)}
                className="h-9 px-3 text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loadingSummary ? (
        <div className="glass rounded-2xl p-10 text-center text-gray-400">กำลังโหลด...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="ยอดขายสุทธิ" value={formatCurrency(revenue)} icon={TrendingUp} tone="text-primary" />
            <MetricCard label="จำนวนบิล" value={`${formatNumber(orderCount)} บิล`} icon={Receipt} />
            <MetricCard label="เฉลี่ยต่อบิล" value={formatCurrency(averageTicket)} icon={Percent} />
            <MetricCard
              label={`คืนสินค้า ${summary?.refundCount ?? 0} ครั้ง`}
              value={formatCurrency(summary?.refundTotal ?? 0)}
              icon={Undo2}
              tone="text-amber-600"
            />
          </div>

          {showProfit && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="ต้นทุน" value={formatCurrency(summary?.cost ?? 0)} icon={Receipt} />
              <MetricCard
                label="กำไร"
                value={formatCurrency(summary?.profit ?? 0)}
                icon={TrendingUp}
                tone="text-emerald-600"
              />
              <MetricCard
                label="อัตรากำไร (ของยอดขาย)"
                value={`${(summary?.margin ?? 0).toFixed(1)}%`}
                icon={Percent}
                tone="text-emerald-600"
              />
              <MetricCard
                label="กำไรต่อทุน (ของต้นทุน)"
                value={`${(summary?.markup ?? 0).toFixed(1)}%`}
                icon={Percent}
                tone="text-emerald-600"
              />
            </div>
          )}

          {/* Daily */}
          <ChartCard title="ยอดขายรายวัน" subtitle="แท่งสีเหลืองคือยอดคืนสินค้าของวันนั้น">
            {dailyChart.length === 0 ? (
              <p className="flex h-full items-center justify-center text-gray-400">ไม่มีข้อมูลในช่วงนี้</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, name) => [money(value), name === "revenue" ? "ยอดขาย" : "ยอดคืน"]}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="refunds" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Hourly */}
          <ChartCard title="ยอดขายรายชั่วโมง" subtitle={`วันที่ ${toDate}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [money(value), "ยอดขาย"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top products */}
          <div className="glass overflow-hidden rounded-2xl">
            <div className="glass-header border-b border-white/40 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">สินค้าขายดี 10 อันดับ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="glass-header border-b border-white/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">สินค้า</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">ขายได้</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">ยอดขาย</th>
                    {showProfit && (
                      <th className="px-4 py-3 text-right font-medium text-gray-600">กำไร</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={showProfit ? 5 : 4} className="py-10 text-center text-gray-400">
                        ไม่มีข้อมูลในช่วงนี้
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((product, index) => (
                      <tr key={product.productId}>
                        <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{product.name}</p>
                          <div className="mt-1 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-violet-100/60">
                            <div
                              className="h-full rounded-full bg-violet-400"
                              style={{ width: `${(Math.abs(product.revenue) / maxRevenue) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatNumber(product.qty)} {product.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(product.revenue)}
                        </td>
                        {showProfit && (
                          <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-600">
                            {formatCurrency(product.profit ?? 0)}
                            <span className="ml-1 text-xs text-slate-400">
                              {formatPercent(markupOf(product.cost ?? 0, product.profit ?? 0))}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
