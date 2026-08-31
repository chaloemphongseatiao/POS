"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getDailyBreakdown } from "@/lib/api/reports";
import { bangkokDaysAgo } from "@/lib/utils/date";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { buildSalesForecast, FORECAST_DAYS, MIN_HISTORY_DAYS, weekdayOf } from "@/lib/utils/forecast";

/** Two months of history: enough for eight of each weekday plus a readable trend. */
const HISTORY_DAYS = 60;
/** How much of the past the chart shows next to the forecast. */
const CHART_HISTORY_DAYS = 14;

const WEEKDAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.7)",
  background: "rgba(255,255,255,0.92)",
  fontSize: 12,
};

function shortLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${WEEKDAY_LABELS[weekdayOf(date)]} ${day}/${month}`;
}

export default function SalesForecast({ today }: { today: string }) {
  const { data: daily, isLoading } = useQuery({
    queryKey: ["dashboard-forecast", today],
    // The forecast fits on finished days only, so the range stops yesterday.
    queryFn: () => getDailyBreakdown({ from: bangkokDaysAgo(HISTORY_DAYS), to: `${bangkokDaysAgo(1)}T23:59:59` }),
  });

  const forecast = useMemo(
    () => (daily ? buildSalesForecast(daily, today) : null),
    [daily, today],
  );

  const chart = useMemo(() => {
    if (!forecast) return [];

    const history = forecast.history.slice(-CHART_HISTORY_DAYS).map((day) => ({
      label: shortLabel(day.date),
      actual: day.revenue,
      forecast: undefined as number | undefined,
      band: undefined as [number, number] | undefined,
    }));

    // Repeat the last actual value as the forecast's first point, otherwise the
    // dashed line starts detached from the history it grew out of.
    const last = history[history.length - 1];
    if (last) {
      last.forecast = last.actual;
      last.band = [last.actual, last.actual];
    }

    return [
      ...history,
      ...forecast.days.map((day) => ({
        label: shortLabel(day.date),
        actual: undefined,
        forecast: day.revenue,
        band: [day.low, day.high] as [number, number],
      })),
    ];
  }, [forecast]);

  if (isLoading) {
    return (
      <section className="glass rounded-[20px] p-5 md:p-6">
        <p className="py-10 text-center text-sm text-slate-400">กำลังคำนวณพยากรณ์...</p>
      </section>
    );
  }

  if (!forecast) {
    return (
      <section className="glass rounded-[20px] p-5 md:p-6">
        <h2 className="text-[15px] font-extrabold text-slate-900">พยากรณ์ยอดขาย</h2>
        <p className="py-10 text-center text-sm text-slate-400">
          ต้องมีประวัติการขายอย่างน้อย {MIN_HISTORY_DAYS} วันจึงจะพยากรณ์ได้
        </p>
      </section>
    );
  }

  const rising = (forecast.changePct ?? 0) >= 0;
  const TrendIcon = rising ? TrendingUp : TrendingDown;

  return (
    <section className="glass rounded-[20px] p-5 md:p-6">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-900">พยากรณ์ยอดขาย {FORECAST_DAYS} วันข้างหน้า</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            คำนวณจากยอดขายจริง {forecast.history.length} วันล่าสุด แยกตามวันในสัปดาห์และแนวโน้ม
          </p>
        </div>
        {forecast.accuracyPct !== null && (
          <span className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-bold text-slate-600">
            ความแม่นย้อนหลัง {formatPercent(forecast.accuracyPct)}
          </span>
        )}
      </header>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <ForecastStat label={`คาดการณ์รวม ${FORECAST_DAYS} วัน`} value={formatCurrency(forecast.total)} />
        <ForecastStat label="เฉลี่ยต่อวัน" value={formatCurrency(forecast.dailyAverage)} />
        <ForecastStat
          label={`เทียบ ${FORECAST_DAYS} วันที่ผ่านมา`}
          value={forecast.changePct === null ? "—" : `${rising ? "+" : ""}${formatPercent(forecast.changePct)}`}
          hint={`ยอดจริง ${formatCurrency(forecast.previousTotal)}`}
          tone={forecast.changePct === null ? "" : rising ? "text-emerald-600" : "text-rose-600"}
          icon={forecast.changePct === null ? undefined : TrendIcon}
        />
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => {
                if (name === "band") {
                  const [low, high] = value as [number, number];
                  return [`${formatCurrency(low)} – ${formatCurrency(high)}`, "ช่วงที่เป็นไปได้"];
                }
                return [formatCurrency(Number(value) || 0), name === "actual" ? "ยอดขายจริง" : "คาดการณ์"];
              }}
            />
            {/* Where measured history ends and the projection begins. */}
            <ReferenceLine
              x={chart[Math.max(0, chart.length - FORECAST_DAYS - 1)]?.label}
              stroke="rgba(100,116,139,0.5)"
              strokeDasharray="4 4"
            />
            <Area dataKey="band" stroke="none" fill="#8b5cf6" fillOpacity={0.12} connectNulls />
            <Line dataKey="actual" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            <Line
              dataKey="forecast"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 2.5, fill: "#8b5cf6" }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {forecast.days.map((day, index) => (
          <li
            key={day.date}
            className="flex items-baseline justify-between gap-3 border-b border-slate-900/5 py-1.5 text-sm last:border-0"
          >
            <span className="text-slate-600">
              {index === 0 ? "วันนี้" : shortLabel(day.date)}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{formatCurrency(day.revenue)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ForecastStat({
  label,
  value,
  hint,
  tone = "text-slate-900",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[16px] bg-white/40 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={`mt-1.5 flex items-center gap-1.5 text-xl font-extrabold tabular-nums md:text-2xl ${tone}`}>
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
