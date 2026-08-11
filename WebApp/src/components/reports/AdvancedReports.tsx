"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCashierPerformance,
  getExpiryLoss,
  getLowStockReorder,
  getPaymentBreakdown,
  getProfitByCategory,
  getRefundVoid,
  getSalesOverview,
} from "@/lib/api/reports";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";

export default function AdvancedReports({ from, to }: { from: string; to: string }) {
  const showCost = useAuth((s) => s.user?.role === "ADMIN");
  const overview = useQuery({ queryKey: ["report-sales-overview", from, to], queryFn: () => getSalesOverview(from, to) });
  const refundVoid = useQuery({ queryKey: ["report-refund-void", from, to], queryFn: () => getRefundVoid(from, to) });
  const cashiers = useQuery({ queryKey: ["report-cashiers", from, to], queryFn: () => getCashierPerformance(from, to) });
  const lowStock = useQuery({ queryKey: ["report-low-stock-reorder"], queryFn: getLowStockReorder });
  const expiry = useQuery({ queryKey: ["report-expiry-loss", to], queryFn: () => getExpiryLoss(to) });
  const categories = useQuery({ queryKey: ["report-profit-category", from, to], queryFn: () => getProfitByCategory(from, to) });
  const payments = useQuery({ queryKey: ["report-payment-breakdown", from, to], queryFn: () => getPaymentBreakdown(from, to) });

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="Gross sales" value={formatCurrency(overview.data?.grossSales ?? 0)} />
        <Metric label="Net sales" value={formatCurrency(overview.data?.netSales ?? 0)} />
        <Metric label="Refunds" value={formatCurrency(overview.data?.refundTotal ?? 0)} />
        <Metric label="Voids" value={formatCurrency(overview.data?.voidTotal ?? 0)} />
      </section>

      <ReportBlock title="Payment method breakdown">
        <SimpleTable
          headers={["Payment", "Orders", "Revenue"]}
          rows={(payments.data ?? []).map((row) => [row.paymentMethod === "CASH" ? "เงินสด" : "QR PromptPay", row.orders, formatCurrency(row.revenue)])}
        />
      </ReportBlock>

      <ReportBlock title="Cashier performance">
        <SimpleTable
          headers={showCost ? ["Cashier", "Orders", "Revenue", "Profit", "Voids"] : ["Cashier", "Orders", "Revenue", "Voids"]}
          rows={(cashiers.data ?? []).map((row) =>
            showCost
              ? [row.cashier, row.orders, formatCurrency(row.revenue), formatCurrency(row.profit ?? 0), row.voids]
              : [row.cashier, row.orders, formatCurrency(row.revenue), row.voids]
          )}
        />
      </ReportBlock>

      <ReportBlock title="Profit by category">
        <SimpleTable
          headers={showCost ? ["Category", "Qty", "Revenue", "Profit", "Margin"] : ["Category", "Qty", "Revenue"]}
          rows={(categories.data ?? []).map((row) =>
            showCost
              ? [row.category, row.qty, formatCurrency(row.revenue), formatCurrency(row.profit ?? 0), formatPercent(row.margin ?? 0)]
              : [row.category, row.qty, formatCurrency(row.revenue)]
          )}
        />
      </ReportBlock>

      <ReportBlock title="Low stock + reorder list">
        <SimpleTable
          headers={["Product", "Category", "On hand", "Reorder point", "Order qty"]}
          rows={(lowStock.data ?? []).map((row) => [row.name, row.category, `${row.quantity} ${row.unit}`, row.reorderPoint, row.reorderQty])}
        />
      </ReportBlock>

      <ReportBlock title="Expiry loss">
        <SimpleTable
          headers={showCost ? ["Product", "Expiry", "Qty", "Cost loss", "Retail loss"] : ["Product", "Expiry", "Qty", "Retail loss"]}
          rows={(expiry.data ?? []).map((row) =>
            showCost
              ? [row.name, row.expiryDate ? new Date(row.expiryDate).toLocaleDateString("th-TH") : "-", `${row.quantity} ${row.unit}`, formatCurrency(row.costLoss ?? 0), formatCurrency(row.retailLoss)]
              : [row.name, row.expiryDate ? new Date(row.expiryDate).toLocaleDateString("th-TH") : "-", `${row.quantity} ${row.unit}`, formatCurrency(row.retailLoss)]
          )}
        />
      </ReportBlock>

      <ReportBlock title="Refund / void report">
        <SimpleTable
          headers={["Type", "Number", "Staff", "Amount"]}
          rows={[
            ...((refundVoid.data?.refunds ?? []).map((row: any) => ["Refund", row.refundNumber, row.user.displayName, formatCurrency(row.totalAmt)])),
            ...((refundVoid.data?.voided ?? []).map((row: any) => ["Void", row.orderNumber, row.cashier.displayName, formatCurrency(row.totalAmt)])),
          ]}
        />
      </ReportBlock>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function ReportBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass overflow-hidden rounded-2xl">
      <div className="border-b border-white/50 px-4 py-3">
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="glass-header">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left font-medium text-slate-600">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/50">
          {rows.length === 0 ? (
            <tr><td className="px-4 py-6 text-center text-slate-400" colSpan={headers.length}>ไม่มีข้อมูล</td></tr>
          ) : rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 tabular-nums text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
