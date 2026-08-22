import apiClient from "./client";
import { LedgerCategory, LedgerEntry, LedgerSummary, LedgerType } from "@/lib/types";

export interface LedgerCategoryPayload {
  name: string;
  type: LedgerType;
  isActive: boolean;
}

export interface LedgerEntryPayload {
  categoryId: number;
  amount: number;
  note?: string;
  entryDate: string;
}

export async function listLedgerCategories(type?: LedgerType): Promise<LedgerCategory[]> {
  const { data } = await apiClient.get<LedgerCategory[]>("/api/ledger/categories", { params: { type } });
  return data;
}

export async function createLedgerCategory(payload: LedgerCategoryPayload) {
  const { data } = await apiClient.post("/api/ledger/categories", payload);
  return data;
}

export async function updateLedgerCategory(id: number, payload: LedgerCategoryPayload) {
  const { data } = await apiClient.put(`/api/ledger/categories/${id}`, payload);
  return data;
}

export async function deleteLedgerCategory(id: number) {
  const { data } = await apiClient.delete(`/api/ledger/categories/${id}`);
  return data;
}

export async function listLedgerEntries(params: {
  from?: string;
  to?: string;
  type?: LedgerType;
  categoryId?: number;
}): Promise<LedgerEntry[]> {
  const { data } = await apiClient.get<LedgerEntry[]>("/api/ledger/entries", { params });
  return data;
}

export async function createLedgerEntry(payload: LedgerEntryPayload) {
  const { data } = await apiClient.post("/api/ledger/entries", payload);
  return data;
}

export async function updateLedgerEntry(id: number, payload: LedgerEntryPayload) {
  const { data } = await apiClient.put(`/api/ledger/entries/${id}`, payload);
  return data;
}

export async function deleteLedgerEntry(id: number) {
  const { data } = await apiClient.delete(`/api/ledger/entries/${id}`);
  return data;
}

export async function getLedgerSummary(params: { from?: string; to?: string }): Promise<LedgerSummary> {
  const { data } = await apiClient.get<LedgerSummary>("/api/ledger/summary", { params });
  return data;
}
