"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLedgerCategory,
  createLedgerEntry,
  deleteLedgerCategory,
  deleteLedgerEntry,
  downloadLedgerCsv,
  listLedgerCategories,
  listLedgerEntries,
} from "@/lib/api/ledger";
import { LedgerType } from "@/lib/types";
import { splitVat } from "@/lib/utils/vat";
import { bangkokDateKey, bangkokToday } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Repeat, Trash2, Wallet } from "lucide-react";

const TYPE_LABEL: Record<LedgerType, string> = { INCOME: "รายรับ", EXPENSE: "รายจ่าย" };

interface Props {
  from: string;
  to: string;
  vatEnabled: boolean;
  vatRate: number;
}

export default function EntriesTab({ from, to, vatEnabled, vatRate }: Props) {
  const qc = useQueryClient();
  const today = bangkokToday();
  const [entryForm, setEntryForm] = useState({
    categoryId: "",
    amount: "",
    note: "",
    entryDate: today,
    hasVat: false,
  });
  const [categoryForm, setCategoryForm] = useState<{ name: string; type: LedgerType }>({
    name: "",
    type: "EXPENSE",
  });

  const categories = useQuery({ queryKey: ["ledger-categories"], queryFn: () => listLedgerCategories() });
  const entries = useQuery({
    queryKey: ["ledger-entries", from, to],
    queryFn: () => listLedgerEntries({ from, to }),
  });

  const incomeCategories = useMemo(
    () => (categories.data ?? []).filter((c) => c.type === "INCOME"),
    [categories.data],
  );
  const expenseCategories = useMemo(
    () => (categories.data ?? []).filter((c) => c.type === "EXPENSE"),
    [categories.data],
  );

  const invalidateLedger = () => {
    // Every accounting screen reads the same postings, so one write refreshes all of them.
    for (const key of ["ledger-entries", "ledger-profit-loss", "ledger-vat", "ledger-recurring-due"]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  };

  const createEntryMutation = useMutation({
    mutationFn: createLedgerEntry,
    onSuccess: () => {
      invalidateLedger();
      setEntryForm({ categoryId: "", amount: "", note: "", entryDate: today, hasVat: false });
    },
  });
  const deleteEntryMutation = useMutation({ mutationFn: deleteLedgerEntry, onSuccess: invalidateLedger });

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
      hasVat: vatEnabled && entryForm.hasVat,
      note: entryForm.note || undefined,
      entryDate: entryForm.entryDate,
    });
  }

  function submitCategory(e: FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    createCategoryMutation.mutate({ name: categoryForm.name.trim(), type: categoryForm.type, isActive: true });
  }

  const preview = splitVat(Number(entryForm.amount) || 0, entryForm.hasVat ? vatRate : 0);

  return (
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
            placeholder="จำนวนเงิน (รวม VAT)"
            value={entryForm.amount}
            onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
            required
          />
          {vatEnabled && (
            <label className="flex items-start gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-indigo-600"
                checked={entryForm.hasVat}
                onChange={(e) => setEntryForm({ ...entryForm, hasVat: e.target.checked })}
              />
              <span>
                มีใบกำกับภาษี ({vatRate}%)
                {entryForm.hasVat && Number(entryForm.amount) > 0 && (
                  <span className="mt-0.5 block text-xs text-slate-500">
                    ก่อน VAT {preview.net.toLocaleString("th-TH", { minimumFractionDigits: 2 })} · VAT{" "}
                    {preview.vat.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </span>
            </label>
          )}
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
          <p className="text-xs leading-relaxed text-slate-500">
            ต้นทุนสินค้าที่ขายดึงจากระบบขายอัตโนมัติแล้ว — ไม่ต้องบันทึกซ้ำที่นี่ ไม่งั้นกำไรจะถูกหักสองรอบ
          </p>
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
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">รายการทั้งหมด</span>
          <Button size="sm" variant="outline" onClick={() => downloadLedgerCsv("entries", { from, to })}>
            <Download className="size-4" />
            ดาวน์โหลด CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="glass-header">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">วันที่</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">หมวดหมู่</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">หมายเหตุ</th>
                {vatEnabled && <th className="px-4 py-3 text-right font-medium text-slate-600">VAT</th>}
                <th className="px-4 py-3 text-right font-medium text-slate-600">จำนวนเงิน</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {(entries.data ?? []).map((entry) => {
                const split = splitVat(entry.amount, entry.hasVat ? Number(entry.vatRate) : 0);
                return (
                  <tr key={entry.id}>
                    {/* The API sends an instant; slicing its UTC ISO string would
                        name the previous day for every entry booked in Bangkok. */}
                    <td className="px-4 py-3 text-slate-600">{bangkokDateKey(new Date(entry.entryDate))}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        {entry.category.name}
                        {entry.recurring && (
                          <Repeat className="size-3.5 text-slate-400" aria-label={`รายการประจำ: ${entry.recurring.name}`} />
                        )}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500">{entry.note || "-"}</td>
                    {vatEnabled && (
                      <td className="px-4 py-3 text-right text-slate-500">
                        {entry.hasVat ? split.vat.toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "-"}
                      </td>
                    )}
                    <td className={`px-4 py-3 text-right font-semibold ${entry.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                      {entry.type === "INCOME" ? "+" : "-"}
                      {Number(entry.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
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
                );
              })}
              {entries.data?.length === 0 && (
                <tr>
                  <td colSpan={vatEnabled ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                    ไม่มีรายการในช่วงวันที่นี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {vatEnabled && (
          <div className="px-4 py-3">
            <Badge variant="secondary">จำนวนเงินทุกช่องรวม VAT แล้ว</Badge>
          </div>
        )}
      </section>
    </div>
  );
}
