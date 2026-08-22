"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLedgerCategory,
  createLedgerEntry,
  deleteLedgerCategory,
  deleteLedgerEntry,
  getLedgerSummary,
  listLedgerCategories,
  listLedgerEntries,
} from "@/lib/api/ledger";
import { LedgerType } from "@/lib/types";
import { bangkokDaysAgo, bangkokToday } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Trash2, Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react";

const TYPE_LABEL: Record<LedgerType, string> = { INCOME: "รายรับ", EXPENSE: "รายจ่าย" };

export default function LedgerPage() {
  const qc = useQueryClient();
  const today = bangkokToday();
  const [fromDate, setFromDate] = useState(bangkokDaysAgo(30));
  const [toDate, setToDate] = useState(today);

  const [entryForm, setEntryForm] = useState({ categoryId: "", amount: "", note: "", entryDate: today });
  const [categoryForm, setCategoryForm] = useState<{ name: string; type: LedgerType }>({ name: "", type: "EXPENSE" });

  const categories = useQuery({ queryKey: ["ledger-categories"], queryFn: () => listLedgerCategories() });
  const entries = useQuery({
    queryKey: ["ledger-entries", fromDate, toDate],
    queryFn: () => listLedgerEntries({ from: fromDate, to: toDate }),
  });
  const summary = useQuery({
    queryKey: ["ledger-summary", fromDate, toDate],
    queryFn: () => getLedgerSummary({ from: fromDate, to: toDate }),
  });

  const incomeCategories = useMemo(() => (categories.data ?? []).filter((c) => c.type === "INCOME"), [categories.data]);
  const expenseCategories = useMemo(() => (categories.data ?? []).filter((c) => c.type === "EXPENSE"), [categories.data]);

  const createEntryMutation = useMutation({
    mutationFn: createLedgerEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger-entries"] });
      qc.invalidateQueries({ queryKey: ["ledger-summary"] });
      setEntryForm({ categoryId: "", amount: "", note: "", entryDate: today });
    },
  });
  const deleteEntryMutation = useMutation({
    mutationFn: deleteLedgerEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger-entries"] });
      qc.invalidateQueries({ queryKey: ["ledger-summary"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: createLedgerCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger-categories"] });
      setCategoryForm({ name: "", type: categoryForm.type });
    },
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteLedgerCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ledger-categories"] }),
  });

  function submitEntry(e: FormEvent) {
    e.preventDefault();
    if (!entryForm.categoryId) return;
    createEntryMutation.mutate({
      categoryId: Number(entryForm.categoryId),
      amount: Number(entryForm.amount),
      note: entryForm.note || undefined,
      entryDate: entryForm.entryDate,
    });
  }

  function submitCategory(e: FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    createCategoryMutation.mutate({ name: categoryForm.name.trim(), type: categoryForm.type, isActive: true });
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">บัญชีรายรับ-รายจ่าย</h1>
        <p className="page-description">Income / Expense Ledger</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">จากวันที่</p>
          <DatePicker value={fromDate} max={toDate} onChange={setFromDate} ariaLabel="เลือกวันที่เริ่มต้น" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">ถึงวันที่</p>
          <DatePicker value={toDate} min={fromDate} max={today} onChange={setToDate} ariaLabel="เลือกวันที่สิ้นสุด" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={TrendingUp} label="รายรับ" value={summary.data?.income ?? 0} tone="text-emerald-600" />
        <StatTile icon={TrendingDown} label="รายจ่าย" value={summary.data?.expense ?? 0} tone="text-red-500" />
        <StatTile icon={Scale} label="สุทธิ" value={summary.data?.net ?? 0} tone={(summary.data?.net ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
          <form onSubmit={submitEntry} className="glass space-y-3 rounded-2xl p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Wallet className="size-5" />
              บันทึกรายการ
            </div>
            <select
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              value={entryForm.categoryId}
              onChange={(e) => setEntryForm({ ...entryForm, categoryId: e.target.value })}
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {incomeCategories.length > 0 && (
                <optgroup label="รายรับ">
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
              {expenseCategories.length > 0 && (
                <optgroup label="รายจ่าย">
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="จำนวนเงิน"
              value={entryForm.amount}
              onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
              required
            />
            <Input
              type="date"
              max={today}
              value={entryForm.entryDate}
              onChange={(e) => setEntryForm({ ...entryForm, entryDate: e.target.value })}
              required
            />
            <Input
              placeholder="หมายเหตุ (ถ้ามี)"
              value={entryForm.note}
              onChange={(e) => setEntryForm({ ...entryForm, note: e.target.value })}
            />
            <Button className="w-full" disabled={createEntryMutation.isPending}>บันทึก</Button>
          </form>

          <form onSubmit={submitCategory} className="glass space-y-3 rounded-2xl p-4">
            <div className="font-bold text-slate-900">หมวดหมู่</div>
            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border border-input bg-white px-2 text-sm"
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as LedgerType })}
              >
                <option value="EXPENSE">รายจ่าย</option>
                <option value="INCOME">รายรับ</option>
              </select>
              <Input
                className="flex-1"
                placeholder="ชื่อหมวดหมู่"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <Button type="submit" disabled={createCategoryMutation.isPending}>เพิ่ม</Button>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {(categories.data ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/70">
                  <span>{c.name} <span className="text-xs text-slate-400">({TYPE_LABEL[c.type]})</span></span>
                  <Button
                    aria-label={`ลบหมวดหมู่ ${c.name}`}
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCategoryMutation.mutate(c.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </form>
        </div>

        <section className="glass overflow-hidden rounded-2xl">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="glass-header">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">วันที่</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">หมวดหมู่</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">หมายเหตุ</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">จำนวนเงิน</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {(entries.data ?? []).map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-slate-600">{entry.entryDate.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{entry.category.name}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-500">{entry.note || "-"}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${entry.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                    {entry.type === "INCOME" ? "+" : "-"}{Number(entry.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      aria-label={`ลบรายการ ${entry.category.name}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEntryMutation.mutate(entry.id)}
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {entries.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">ไม่มีรายการในช่วงวันที่นี้</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
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
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`text-lg font-bold ${tone}`}>{value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
  );
}
