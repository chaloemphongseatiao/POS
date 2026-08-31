"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRecurringEntry,
  deleteRecurringEntry,
  getRecurringDue,
  listLedgerCategories,
  listRecurringEntries,
  runRecurringEntries,
  updateRecurringEntry,
} from "@/lib/api/ledger";
import { RecurringEntry, RecurringFrequency } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { bangkokDateKey, bangkokToday } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Pencil, Play, Trash2, X } from "lucide-react";

const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

interface Props {
  vatEnabled: boolean;
  vatRate: number;
}

interface FormState {
  name: string;
  categoryId: string;
  amount: string;
  hasVat: boolean;
  note: string;
  frequency: RecurringFrequency;
  dayOf: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

function emptyForm(today: string): FormState {
  return {
    name: "",
    categoryId: "",
    amount: "",
    hasVat: false,
    note: "",
    frequency: "MONTHLY",
    dayOf: "1",
    startDate: today,
    endDate: "",
    isActive: true,
  };
}

function scheduleLabel(template: RecurringEntry): string {
  return template.frequency === "WEEKLY"
    ? `ทุกวัน${WEEKDAYS[template.dayOf] ?? template.dayOf}`
    : `ทุกวันที่ ${template.dayOf} ของเดือน`;
}

export default function RecurringTab({ vatEnabled, vatRate }: Props) {
  const qc = useQueryClient();
  const today = bangkokToday();
  const [form, setForm] = useState<FormState>(() => emptyForm(today));
  const [editId, setEditId] = useState<number | null>(null);

  const categories = useQuery({ queryKey: ["ledger-categories"], queryFn: () => listLedgerCategories() });
  const templates = useQuery({ queryKey: ["ledger-recurring"], queryFn: listRecurringEntries });
  const due = useQuery({ queryKey: ["ledger-recurring-due"], queryFn: getRecurringDue });

  const refresh = () => {
    for (const key of [
      "ledger-recurring",
      "ledger-recurring-due",
      "ledger-entries",
      "ledger-profit-loss",
      "ledger-vat",
    ]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  };

  function resetForm() {
    setForm(emptyForm(today));
    setEditId(null);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createRecurringEntry>[0]) =>
      editId ? updateRecurringEntry(editId, payload) : createRecurringEntry(payload),
    onSuccess: () => {
      refresh();
      resetForm();
    },
  });
  const deleteMutation = useMutation({ mutationFn: deleteRecurringEntry, onSuccess: refresh });
  const runMutation = useMutation({ mutationFn: runRecurringEntries, onSuccess: refresh });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.categoryId) return;
    saveMutation.mutate({
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      amount: Number(form.amount),
      hasVat: vatEnabled && form.hasVat,
      note: form.note || undefined,
      frequency: form.frequency,
      dayOf: Number(form.dayOf),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
    });
  }

  function startEdit(template: RecurringEntry) {
    setEditId(template.id);
    setForm({
      name: template.name,
      categoryId: String(template.category.id),
      amount: String(Number(template.amount)),
      hasVat: template.hasVat,
      note: template.note ?? "",
      frequency: template.frequency,
      dayOf: String(template.dayOf),
      // Same reason as the entries table: the UTC slice of a Bangkok midnight
      // names the day before, which would silently walk the schedule backwards
      // every time the owner opened and re-saved a template.
      startDate: bangkokDateKey(new Date(template.startDate)),
      endDate: template.endDate ? bangkokDateKey(new Date(template.endDate)) : "",
      isActive: template.isActive,
    });
  }

  const dueCount = due.data?.count ?? 0;

  return (
    <div className="space-y-5">
      {dueCount > 0 && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 text-amber-500" />
            <div className="text-sm">
              <p className="font-semibold text-slate-800">มี {dueCount} รายการครบกำหนดแต่ยังไม่ได้ลงบัญชี</p>
              <p className="text-slate-500">
                {(due.data?.templates ?? [])
                  .map((item) => `${item.name} (${item.dates.length} ครั้ง)`)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            <Play className="size-4" />
            ลงบัญชีทั้งหมด
          </Button>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-4">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>{editId ? "แก้ไขรายการประจำ" : "เพิ่มรายการประจำ"}</span>
            {editId && (
              <Button type="button" size="icon" variant="ghost" aria-label="ยกเลิกการแก้ไข" onClick={resetForm}>
                <X className="size-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="ชื่อรายการ เช่น ค่าเช่าร้าน"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            <option value="">เลือกหมวดหมู่</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "INCOME" ? "รายรับ" : "รายจ่าย"})
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="จำนวนเงิน (รวม VAT)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          {vatEnabled && (
            <label className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="size-4 accent-indigo-600"
                checked={form.hasVat}
                onChange={(e) => setForm({ ...form, hasVat: e.target.checked })}
              />
              มีใบกำกับภาษี ({vatRate}%)
            </label>
          )}
          <div className="flex gap-2">
            <select
              className="h-10 flex-1 rounded-md border border-input bg-white px-2 text-sm"
              value={form.frequency}
              onChange={(e) =>
                setForm({
                  ...form,
                  frequency: e.target.value as RecurringFrequency,
                  // The day field means different things per frequency, so reset it.
                  dayOf: e.target.value === "WEEKLY" ? "1" : "1",
                })
              }
            >
              <option value="MONTHLY">ทุกเดือน</option>
              <option value="WEEKLY">ทุกสัปดาห์</option>
            </select>
            {form.frequency === "MONTHLY" ? (
              <Input
                className="flex-1"
                type="number"
                min={1}
                max={31}
                aria-label="วันที่ของเดือน"
                value={form.dayOf}
                onChange={(e) => setForm({ ...form, dayOf: e.target.value })}
                required
              />
            ) : (
              <select
                className="h-10 flex-1 rounded-md border border-input bg-white px-2 text-sm"
                aria-label="วันในสัปดาห์"
                value={form.dayOf}
                onChange={(e) => setForm({ ...form, dayOf: e.target.value })}
              >
                {WEEKDAYS.map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-slate-500">
              เริ่ม
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </label>
            <label className="flex-1 text-xs text-slate-500">
              สิ้นสุด (ถ้ามี)
              <Input
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>
          </div>
          <Input
            placeholder="หมายเหตุ (ถ้ามี)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="size-4 accent-indigo-600"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            เปิดใช้งาน
          </label>
          <Button className="w-full" disabled={saveMutation.isPending}>
            {editId ? "บันทึกการแก้ไข" : "เพิ่มรายการประจำ"}
          </Button>
          <p className="text-xs leading-relaxed text-slate-500">
            รายการประจำยังไม่ถูกลงบัญชีจนกว่าจะกด &quot;ลงบัญชีทั้งหมด&quot; — งบจึงมีแต่เงินที่จ่ายจริง
            และกดซ้ำก็ไม่ลงซ้ำ
          </p>
        </form>

        <section className="glass overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="glass-header">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">ชื่อ</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">หมวดหมู่</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">รอบ</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">จำนวนเงิน</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {(templates.data ?? []).map((template) => (
                  <tr key={template.id} className={template.isActive ? "" : "opacity-55"}>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {template.name}
                      {!template.isActive && (
                        <Badge variant="secondary" className="ml-2">ปิดอยู่</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{template.category.name}</td>
                    <td className="px-4 py-3 text-slate-500">{scheduleLabel(template)}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        template.type === "INCOME" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatCurrency(template.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`แก้ไข ${template.name}`}
                          onClick={() => startEdit(template)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`ลบ ${template.name}`}
                          onClick={() => deleteMutation.mutate(template.id)}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      ยังไม่มีรายการประจำ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
