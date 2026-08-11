"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPromotion, deletePromotion, listPromotions, PromotionPayload } from "@/lib/api/promotions";
import { listProducts } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Tags } from "lucide-react";

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<PromotionPayload>({
    name: "",
    type: "PERCENT_OFF",
    value: 10,
    minQty: 1,
    startsAt: null,
    endsAt: null,
    isActive: true,
    productIds: [],
  });
  const promotions = useQuery({ queryKey: ["promotions"], queryFn: listPromotions });
  const products = useQuery({ queryKey: ["promotion-products"], queryFn: () => listProducts({ all: true, limit: 500 }) });
  const productList = products.data?.products ?? [];
  const selectedNames = useMemo(
    () => productList.filter((p) => form.productIds.includes(p.id)).map((p) => p.name).join(", "),
    [form.productIds, productList]
  );

  const createMutation = useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
      setForm({ name: "", type: "PERCENT_OFF", value: 10, minQty: 1, startsAt: null, endsAt: null, isActive: true, productIds: [] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  function toggleProduct(id: number) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id) ? prev.productIds.filter((value) => value !== id) : [...prev.productIds, id],
    }));
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">โปรโมชันและส่วนลด</h1>
        <p className="page-description">Promotion / Discount Rules</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Tags className="size-5" />
            เพิ่มโปรโมชัน
          </div>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อโปรโมชัน" required />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PromotionPayload["type"] })}
            >
              <option value="PERCENT_OFF">ลดเป็น %</option>
              <option value="AMOUNT_OFF">ลดเป็นบาท</option>
            </select>
            <Input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={1} value={form.minQty} onChange={(e) => setForm({ ...form, minQty: Number(e.target.value) })} placeholder="จำนวนขั้นต่ำ" />
            <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              เปิดใช้งาน
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.startsAt?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, startsAt: e.target.value || null })} />
            <Input type="date" value={form.endsAt?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, endsAt: e.target.value || null })} />
          </div>
          <div className="rounded-xl border border-white/70 bg-white/50 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-500">สินค้า</p>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {productList.map((product) => (
                <label key={product.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/70">
                  <input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />
                  <span className="truncate">{product.name}</span>
                </label>
              ))}
            </div>
            {selectedNames && <p className="mt-2 truncate text-xs text-slate-500">{selectedNames}</p>}
          </div>
          <Button className="w-full" disabled={createMutation.isPending || form.productIds.length === 0}>
            บันทึกโปรโมชัน
          </Button>
        </form>

        <section className="glass overflow-hidden rounded-2xl">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="glass-header">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">โปรโมชัน</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">เงื่อนไข</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">สินค้า</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {(promotions.data ?? []).map((promotion) => (
                <tr key={promotion.id}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{promotion.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {promotion.type === "PERCENT_OFF" ? `ลด ${Number(promotion.value)}%` : `ลด ${Number(promotion.value)} บาท`} เมื่อซื้อ {promotion.minQty}+
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                    {promotion.products.map((item) => item.product.name).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-center">{promotion.isActive ? "เปิด" : "ปิด"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button aria-label={`ลบ ${promotion.name}`} variant="ghost" size="icon" onClick={() => deleteMutation.mutate(promotion.id)}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
