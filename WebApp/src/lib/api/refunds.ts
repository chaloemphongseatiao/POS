import apiClient from "./client";
import { Refund } from "@/lib/types";

export async function listRefunds(params?: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ refunds: Refund[]; total: number; page: number }> {
  const { data } = await apiClient.get("/api/refunds", { params });
  return data;
}

export async function getRefundsForOrder(orderId: number): Promise<Refund[]> {
  const { data } = await apiClient.get<Refund[]>(`/api/refunds/order/${orderId}`);
  return data;
}

export async function createRefund(body: {
  orderId: number;
  items: { orderItemId: number; quantity: number }[];
  reason?: string;
  restock?: boolean;
}): Promise<Refund> {
  const { data } = await apiClient.post<Refund>("/api/refunds", body);
  return data;
}
