import apiClient from "./client";
import { StockItem, StockMovement } from "@/lib/types";

export interface StockListResponse {
  stocks: StockItem[];
  total: number;
  page: number;
  limit: number;
}

export async function listStock(params?: {
  search?: string;
  categoryId?: number;
  lowOnly?: boolean;
  status?: "normal" | "low" | "out" | "low_out";
  page?: number;
  limit?: number;
}): Promise<StockListResponse> {
  const { data } = await apiClient.get<StockListResponse>("/api/stock", { params });
  return data;
}

export async function getLowStock(): Promise<StockItem[]> {
  const { data } = await apiClient.get<StockItem[]>("/api/stock/low");
  return data;
}

export async function getAllMovements(params?: {
  productId?: number;
  type?: string;
  from?: string;
  to?: string;
}): Promise<StockMovement[]> {
  const { data } = await apiClient.get<StockMovement[]>("/api/stock/movements", { params });
  return data;
}

export async function getProductMovements(productId: number): Promise<StockMovement[]> {
  const { data } = await apiClient.get<StockMovement[]>(`/api/stock/${productId}/movements`);
  return data;
}

export async function stockIn(productId: number, quantity: number, note?: string) {
  const { data } = await apiClient.post(`/api/stock/${productId}/in`, { quantity, note });
  return data;
}

export async function adjustStock(productId: number, quantity: number, note?: string) {
  const { data } = await apiClient.post(`/api/stock/${productId}/adjust`, { quantity, note });
  return data;
}
