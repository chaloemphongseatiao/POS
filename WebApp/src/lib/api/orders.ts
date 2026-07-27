import apiClient from "./client";
import { Order, PaymentMethod } from "@/lib/types";

export async function listOrders(params?: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: Order[]; total: number; page: number }> {
  const { data } = await apiClient.get("/api/orders", { params });
  return data;
}

export async function getOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/api/orders/${id}`);
  return data;
}

export async function createOrder(body: {
  items: { productId: number; quantity: number }[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
  discountAmt?: number;
  note?: string;
}): Promise<Order> {
  const { data } = await apiClient.post<Order>("/api/orders", body);
  return data;
}

export async function voidOrder(id: number): Promise<{ id: number; orderNumber: string; status: string }> {
  const { data } = await apiClient.patch(`/api/orders/${id}/void`);
  return data;
}
