"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import SalesReport from "@/components/reports/SalesReport";
import StockOnHandReport from "@/components/reports/StockOnHandReport";
import MovementsReport from "@/components/reports/MovementsReport";
import AdvancedReports from "@/components/reports/AdvancedReports";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils/cn";
import { bangkokDaysAgo, bangkokToday } from "@/lib/utils/date";

const QUICK_RANGES = [
  { label: "วันนี้", days: 1 },
  { label: "7 วัน", days: 7 },
  { label: "30 วัน", days: 30 },
];

type TabId = "stock" | "movements" | "receive" | "sales" | "adjust" | "advanced";

const TABS: { id: TabId; label: string }[] = [
  { id: "stock", label: "สต็อกคงเหลือ" },
  { id: "movements", label: "การเคลื่อนไหว" },
  { id: "receive", label: "รับสินค้า" },
  { id: "sales", label: "การขาย" },
  { id: "adjust", label: "ปรับปรุงสต็อก" },
  { id: "advanced", label: "วิเคราะห์เพิ่มเติม" },
];

/** The first day of a quick range that ends today — a 1-day range is today alone. */
function rangeStart(days: number): string {
  return bangkokDaysAgo(days - 1);
}

export default function ReportsPage() {
  const today = bangkokToday();
  const [tab, setTab] = useState<TabId>("stock");
  const [fromDate, setFromDate] = useState(rangeStart(7));
  const [toDate, setToDate] = useState(today);

  // Stock on hand is a snapshot of right now — a date range would not change it.
  const usesDateRange = tab !== "stock";
  const to = `${toDate}T23:59:59`;

  function setQuickRange(days: number) {
    setFromDate(rangeStart(days));
    setToDate(today);
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">รายงาน</h1>
        <p className="page-description">Stock & Sales Reports</p>
      </div>

      {/* Report picker */}
      <div className="glass flex flex-wrap gap-1.5 rounded-2xl p-2">
        {TABS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? "default" : "outline"}
            onClick={() => setTab(item.id)}
            className={cn(tab !== item.id && "border-white/60 bg-white/40")}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {usesDateRange && (
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
      )}

      {tab === "stock" && <StockOnHandReport />}

      {tab === "movements" && (
        <MovementsReport
          from={fromDate}
          to={to}
          title="รายการการเคลื่อนไหว"
          subtitle="ทุกประเภทการเคลื่อนไหวของสต็อกในช่วงที่เลือก"
          fileName="stock-movements"
        />
      )}

      {tab === "receive" && (
        <MovementsReport
          from={fromDate}
          to={to}
          type="STOCK_IN"
          title="รายงานรับสินค้า"
          subtitle="สินค้าที่รับเข้าคลังในช่วงที่เลือก"
          fileName="stock-receive"
        />
      )}

      {tab === "sales" && <SalesReport fromDate={fromDate} toDate={toDate} />}

      {tab === "advanced" && <AdvancedReports from={fromDate} to={to} />}

      {tab === "adjust" && (
        <MovementsReport
          from={fromDate}
          to={to}
          type="ADJUST"
          title="รายงานการปรับปรุงสต็อก"
          subtitle="การปรับยอดจากการตรวจนับหรือแก้ไขด้วยมือ"
          fileName="stock-adjust"
        />
      )}
    </div>
  );
}
