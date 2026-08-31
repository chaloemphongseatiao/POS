"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import MovementsReport from "@/components/reports/MovementsReport";
import { MovementType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { bangkokDaysAgo, bangkokToday } from "@/lib/utils/date";

const QUICK_RANGES = [
  { label: "วันนี้", days: 1 },
  { label: "7 วัน", days: 7 },
  { label: "30 วัน", days: 30 },
];

/**
 * One report with a type filter, rather than a tab per movement type: the
 * table, the totals and the Excel export are identical either way, and the
 * filter keeps "รับเข้าเดือนนี้เท่าไหร่" one click from "แล้วขายออกเท่าไหร่".
 */
const TYPES: { value: MovementType | ""; label: string; title: string; subtitle: string; fileName: string }[] = [
  {
    value: "",
    label: "ทั้งหมด",
    title: "รายการการเคลื่อนไหว",
    subtitle: "ทุกประเภทการเคลื่อนไหวของสต็อกในช่วงที่เลือก",
    fileName: "stock-movements",
  },
  {
    value: "STOCK_IN",
    label: "รับเข้า",
    title: "รายงานรับสินค้า",
    subtitle: "สินค้าที่รับเข้าคลังในช่วงที่เลือก",
    fileName: "stock-receive",
  },
  {
    value: "ADJUST",
    label: "ปรับปรุง",
    title: "รายงานการปรับปรุงสต็อก",
    subtitle: "การปรับยอดจากการตรวจนับหรือแก้ไขด้วยมือ",
    fileName: "stock-adjust",
  },
  {
    value: "SALE",
    label: "ขายออก",
    title: "รายงานสินค้าที่ขายออก",
    subtitle: "สต็อกที่ตัดออกจากการขายหน้าร้านในช่วงที่เลือก",
    fileName: "stock-sale",
  },
  {
    value: "RETURN",
    label: "รับคืน",
    title: "รายงานสินค้ารับคืน",
    subtitle: "สต็อกที่คืนเข้าคลังจากการคืนสินค้าในช่วงที่เลือก",
    fileName: "stock-return",
  },
];

/** The first day of a quick range that ends today — a 1-day range is today alone. */
function rangeStart(days: number): string {
  return bangkokDaysAgo(days - 1);
}

export default function StockHistoryPage() {
  const today = bangkokToday();
  const [type, setType] = useState<MovementType | "">("");
  const [fromDate, setFromDate] = useState(rangeStart(7));
  const [toDate, setToDate] = useState(today);

  const selected = TYPES.find((item) => item.value === type) ?? TYPES[0];

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">ประวัติสต็อก</h1>
        <p className="page-description">Stock Movements</p>
      </div>

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
                onClick={() => {
                  setFromDate(rangeStart(days));
                  setToDate(today);
                }}
                className="h-9 px-3 text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass flex flex-wrap gap-1.5 rounded-2xl p-2">
        {TYPES.map((item) => (
          <Button
            key={item.value || "all"}
            size="sm"
            variant={type === item.value ? "default" : "outline"}
            onClick={() => setType(item.value)}
            className={type !== item.value ? "border-white/60 bg-white/40" : undefined}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <MovementsReport
        from={fromDate}
        to={`${toDate}T23:59:59`}
        type={type || undefined}
        title={selected.title}
        subtitle={selected.subtitle}
        fileName={selected.fileName}
      />
    </div>
  );
}
