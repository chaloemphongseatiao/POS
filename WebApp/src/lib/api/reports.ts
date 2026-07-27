import apiClient from "./client";
import { ReportSummary, DailyData, TopProduct } from "@/lib/types";

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
