"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getAllMovements } from "@/lib/api/stock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { MovementType } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

const MOVEMENT_LABELS: Record<MovementType, string> = {
  STOCK_IN: "รับสินค้าเข้า",
  STOCK_OUT: "นำสินค้าออก",
  SALE: "ขาย",
  ADJUST: "ปรับยอด",
};

const MOVEMENT_VARIANTS: Record<MovementType, "success" | "destructive" | "default" | "warning"> = {
  STOCK_IN: "success",
  STOCK_OUT: "destructive",
  SALE: "default",
  ADJUST: "warning",
};

export default function MovementsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "">("");

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["movements", typeFilter],
    queryFn: () => getAllMovements({ type: typeFilter || undefined }),
  });

  const filtered = movements.filter((m) =>
    m.product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/stock">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">ประวัติการเคลื่อนไหว Stock</h1>
          <p className="text-sm text-gray-500">{filtered.length} รายการล่าสุด</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Input
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Combobox
          options={(Object.keys(MOVEMENT_LABELS) as MovementType[]).map((t) => ({ value: t, label: MOVEMENT_LABELS[t] }))}
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as MovementType | "")}
          placeholder="ทุกประเภท"
          searchPlaceholder="ค้นหาประเภท..."
          className="min-w-[160px]"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่/เวลา</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">จำนวน</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมายเหตุ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ผู้ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่มีข้อมูล</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.product.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{m.product.barcode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={MOVEMENT_VARIANTS[m.type]}>{MOVEMENT_LABELS[m.type]}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.note || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{m.user.displayName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
