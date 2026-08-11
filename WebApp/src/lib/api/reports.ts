import apiClient from "./client";
import {
  ReportSummary,
  DailyData,
  TopProduct,
  SalesOverviewReport,
  CashierPerformanceReport,
  LowStockReorderReport,
  ExpiryLossReport,
  ProfitByCategoryReport,
  PaymentBreakdownReport,
} from "@/lib/types";

export async function getSummary(from?: string, to?: string): Promise<ReportSummary> {
  const { data } = await apiClient.get<ReportSummary>("/api/reports/summary", {
    params: { from, to },
  });
  return data;
}

export async function getDailyBreakdown(params: { month?: string; from?: string; to?: string }): Promise<DailyData[]> {
  const { data } = await apiClient.get<DailyData[]>("/api/reports/daily", { params });
  return data;
}

export async function getTopProducts(from?: string, to?: string, limit = 10): Promise<TopProduct[]> {
  const { data } = await apiClient.get<TopProduct[]>("/api/reports/top-products", {
    params: { from, to, limit },
  });
  return data;
}

export async function getHourly(date?: string): Promise<{ hour: number; revenue: number; orders: number }[]> {
  const { data } = await apiClient.get("/api/reports/hourly", { params: { date } });
  return data;
}

export async function getSalesOverview(from?: string, to?: string): Promise<SalesOverviewReport> {
  const { data } = await apiClient.get<SalesOverviewReport>("/api/reports/sales-overview", { params: { from, to } });
  return data;
}

export async function getRefundVoid(from?: string, to?: string) {
  const { data } = await apiClient.get("/api/reports/refund-void", { params: { from, to } });
  return data;
}

export async function getCashierPerformance(from?: string, to?: string): Promise<CashierPerformanceReport[]> {
  const { data } = await apiClient.get<CashierPerformanceReport[]>("/api/reports/cashier-performance", { params: { from, to } });
  return data;
}

export async function getLowStockReorder(): Promise<LowStockReorderReport[]> {
  const { data } = await apiClient.get<LowStockReorderReport[]>("/api/reports/low-stock-reorder");
  return data;
}

export async function getExpiryLoss(asOf?: string): Promise<ExpiryLossReport[]> {
  const { data } = await apiClient.get<ExpiryLossReport[]>("/api/reports/expiry-loss", { params: { asOf } });
  return data;
}

export async function getProfitByCategory(from?: string, to?: string): Promise<ProfitByCategoryReport[]> {
  const { data } = await apiClient.get<ProfitByCategoryReport[]>("/api/reports/profit-by-category", { params: { from, to } });
  return data;
}

export async function getPaymentBreakdown(from?: string, to?: string): Promise<PaymentBreakdownReport[]> {
  const { data } = await apiClient.get<PaymentBreakdownReport[]>("/api/reports/payment-breakdown", { params: { from, to } });
  return data;
}
