import apiClient from "./client";
import { StockItem, StockMovement } from "@/lib/types";

export interface StockListResponse {
  stocks: StockItem[];
  total: number;
  page: number;
  limit: number;
  /** Value of every row matching the current filter, not just this page. */
  valuation: StockValuation;
}

export interface StockValuation {
  quantity: number;
  cost: number;
  retail: number;
  profit: number;
  /** Profit as a percentage of the selling price. */
  margin: number;
  /** Profit as a percentage of what the goods cost. */
  markup: number;
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
  /** Server caps this at 2000; the default is 200. */
  limit?: number;
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

export interface StockImportRow {
  row: number;
  barcode?: string;
  name?: string;
  /** The counted quantity — import replaces the stock level, it doesn't add. */
  quantity: number;
}

export interface StockImportResult {
  total: number;
  updated: number;
  unchanged: number;
}

export async function importStock(rows: StockImportRow[]): Promise<StockImportResult> {
  const { data } = await apiClient.post<StockImportResult>("/api/stock/import", { rows });
  return data;
}

export interface ReceiveStockItem {
  productId: number;
  quantity: number;
  costPrice?: number;
}

export interface ReceiveStockResult {
  itemCount: number;
  totalQuantity: number;
  items: {
    productId: number;
    name: string;
    quantity: number;
    stockAfter: number;
    /** Cost prices are weighted averages, recalculated on every receipt. */
    costBefore: string;
    costAfter: string;
  }[];
}

export async function receiveStock(body: {
  items: ReceiveStockItem[];
  note?: string;
  reference?: string;
}): Promise<ReceiveStockResult> {
  const { data } = await apiClient.post<ReceiveStockResult>("/api/stock/receive", body);
  return data;
}

export async function adjustStock(productId: number, quantity: number, note?: string) {
  const { data } = await apiClient.post(`/api/stock/${productId}/adjust`, { quantity, note });
  return data;
}
