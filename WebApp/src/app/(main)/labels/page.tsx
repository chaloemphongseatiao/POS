"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import JsBarcode from "jsbarcode";
import { listProducts } from "@/lib/api/products";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Search } from "lucide-react";

/** Renders a real, scannable Code128 barcode — the shelf-printed label has to
 *  work with the same scanner the POS uses to look products up by barcode. */
function BarcodeSvg({ value }: { value: string }) {
  const setRef = useCallback(
    (svg: SVGSVGElement | null) => {
      if (!svg || !value) return;
      try {
        JsBarcode(svg, value, { format: "CODE128", displayValue: false, margin: 0, height: 40 });
      } catch {
        // Barcode text has characters CODE128 can't encode — leave the area
        // blank rather than break the rest of the label.
      }
    },
    [value]
  );
  return <svg ref={setRef} className="w-full" />;
}

export default function LabelsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, number>>({});
  const { data } = useQuery({
    queryKey: ["label-products", search],
    queryFn: () => listProducts({ search, all: true, limit: 200 }),
  });
  const products = data?.products ?? [];
  const labels = useMemo(
    () => products.flatMap((product) => Array.from({ length: selected[product.id] ?? 0 }, () => product)),
    [products, selected]
  );

  function setQty(product: Product, qty: number) {
    setSelected((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[product.id];
      else next[product.id] = Math.min(200, qty);
      return next;
    });
  }

  return (
    <div className="page-shell">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #label-print, #label-print * { visibility: visible; }
          #label-print { position: absolute; inset: 0; padding: 8mm; }
          .label-card { break-inside: avoid; box-shadow: none !important; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">พิมพ์ฉลาก Barcode</h1>
          <p className="page-description">Barcode Label Printing</p>
        </div>
        <Button onClick={() => window.print()} disabled={labels.length === 0}>
          <Printer className="mr-2 size-4" />
          พิมพ์ {labels.length} ใบ
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาสินค้า หรือ barcode" />
          </div>
          <div className="glass overflow-hidden rounded-2xl">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="glass-header">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">สินค้า</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Barcode</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">ราคา</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">จำนวนฉลาก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{product.barcode ?? "-"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(product.sellPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        className="ml-auto h-9 w-24 text-right tabular-nums"
                        type="number"
                        min={0}
                        max={200}
                        value={selected[product.id] ?? ""}
                        onChange={(e) => setQty(product, Number(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="label-print" className="grid content-start gap-2 sm:grid-cols-2 print:grid-cols-3">
          {labels.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400">เลือกจำนวนฉลากก่อนพิมพ์</div>
          ) : labels.map((product, idx) => (
            <div key={`${product.id}-${idx}`} className="label-card rounded-lg border border-slate-300 bg-white p-3 text-slate-950">
              <p className="truncate text-sm font-bold">{product.name}</p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">{formatCurrency(product.sellPrice)}</p>
              <div className="mt-2">
                <BarcodeSvg value={product.barcode ?? String(product.id)} />
              </div>
              <p className="mt-1 text-center font-mono text-[11px]">{product.barcode ?? product.id}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
