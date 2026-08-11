import apiClient from "./client";
import { Promotion } from "@/lib/types";

export interface PromotionPayload {
  name: string;
  type: "PERCENT_OFF" | "AMOUNT_OFF";
  value: number;
  minQty: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  productIds: number[];
}

export async function listPromotions(): Promise<Promotion[]> {
  const { data } = await apiClient.get<Promotion[]>("/api/promotions");
  return data;
}

export async function createPromotion(payload: PromotionPayload) {
  const { data } = await apiClient.post("/api/promotions", payload);
  return data;
}

export async function updatePromotion(id: number, payload: PromotionPayload) {
  const { data } = await apiClient.put(`/api/promotions/${id}`, payload);
  return data;
}

export async function deletePromotion(id: number) {
  const { data } = await apiClient.delete(`/api/promotions/${id}`);
  return data;
}
