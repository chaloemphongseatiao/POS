"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfitLoss } from "@/lib/api/ledger";
import { getSettings } from "@/lib/api/settings";
import { readVatSettings } from "@/lib/utils/vat";
import { bangkokDaysAgo, bangkokToday } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils/cn";
import EntriesTab from "@/components/ledger/EntriesTab";
import ProfitLossTab from "@/components/ledger/ProfitLossTab";
import RecurringTab from "@/components/ledger/RecurringTab";
import VatTab from "@/components/ledger/VatTab";
import { Receipt, Scale, TrendingDown, TrendingUp } from "lucide-react";

type TabId = "entries" | "pl" | "vat" | "recurring";

const TABS: { id: TabId; label: string }[] = [
  { id: "entries", label: "รายรับ-รายจ่าย" },
  { id: "pl", label: "งบกำไรขาดทุน" },
  { id: "vat", label: "ภาษีมูลค่าเพิ่ม" },
  { id: "recurring", label: "รายการประจำ" },
];

export default function LedgerPage() {
  const today = bangkokToday();
  // Derived per render rather than at module load, so a session left open
  // overnight does not keep offering yesterday's shortcuts.
  const quickRanges = [
    { label: "เดือนนี้", from: `${today.slice(0, 7)}-01` },
    { label: "30 วัน", from: bangkokDaysAgo(29) },
    { label: "90 วัน", from: bangkokDaysAgo(89) },
  ];
  const [tab, setTab] = useState<TabId>("entries");
  const [fromDate, setFromDate] = useState(bangkokDaysAgo(30));
  const [toDate, setToDate] = useState(today);

  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const vat = readVatSettings(settings.data);

  // Every tile reads from the P&L, so the headline numbers are the same net-of-VAT
  // figures the statement tab prints — mixing a gross ledger total in here would
  // make the four tiles fail to add up to the profit beside them.
  const pl = useQuery({
    queryKey: ["ledger-profit-loss", fromDate, toDate],
    queryFn: () => getProfitLoss({ from: fromDate, to: toDate }),
  });

  return (
    <div className="page-shell">
      <div className="print:hidden">
        <h1 className="page-title">บัญชี</h1>
        <p className="page-description">Accounting — รายรับ-รายจ่าย, งบกำไรขาดทุน, VAT</p>
      </div>

      <div className="glass flex flex-wrap gap-1.5 rounded-2xl p-2 print:hidden">
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

      {tab !== "recurring" && (
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">จากวันที่</p>
            <DatePicker value={fromDate} max={toDate} onChange={setFromDate} ariaLabel="เลือกวันที่เริ่มต้น" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">ถึงวันที่</p>
            <DatePicker value={toDate} min={fromDate} max={today} onChange={setToDate} ariaLabel="เลือกวันที่สิ้นสุด" />
          </div>
          <div className="flex gap-1.5">
            {quickRanges.map((range) => (
              <Button
                key={range.label}
                size="sm"
                variant="outline"
                onClick={() => {
                  setFromDate(range.from);
                  setToDate(today);
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {tab !== "recurring" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
          <StatTile
            icon={Receipt}
            label={vat.enabled ? "ยอดขายก่อน VAT" : "ยอดขาย"}
            value={pl.data?.sales.net ?? 0}
            tone="text-indigo-600"
          />
          <StatTile icon={TrendingUp} label="รายรับอื่น" value={pl.data?.otherIncome ?? 0} tone="text-emerald-600" />
          <StatTile icon={TrendingDown} label="รายจ่าย" value={pl.data?.expense ?? 0} tone="text-red-500" />
          <StatTile
            icon={Scale}
            label="กำไรสุทธิ"
            value={pl.data?.netProfit ?? 0}
            tone={(pl.data?.netProfit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}
          />
        </div>
      )}

      {tab === "entries" && (
        <EntriesTab from={fromDate} to={toDate} vatEnabled={vat.enabled} vatRate={vat.rate} />
      )}
      {tab === "pl" && (
        <ProfitLossTab from={fromDate} to={toDate} storeName={settings.data?.store_name ?? ""} />
      )}
      {tab === "vat" && <VatTab from={fromDate} to={toDate} />}
      {tab === "recurring" && <RecurringTab vatEnabled={vat.enabled} vatRate={vat.rate} />}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-4">
      <div className={`flex size-10 items-center justify-center rounded-xl bg-white/70 ${tone}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`truncate text-lg font-bold ${tone}`}>{formatCurrency(value)}</p>
      </div>
    </div>
  );
}
