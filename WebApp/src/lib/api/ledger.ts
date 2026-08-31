import apiClient from "./client";
import {
  LedgerCategory,
  LedgerEntry,
  LedgerSummary,
  LedgerType,
  ProfitLoss,
  RecurringDue,
  RecurringEntry,
  RecurringFrequency,
  VatReport,
} from "@/lib/types";

export interface LedgerCategoryPayload {
  name: string;
  type: LedgerType;
  isActive: boolean;
}

export interface LedgerEntryPayload {
  categoryId: number;
  /** VAT-inclusive — the amount actually paid or received. */
  amount: number;
  hasVat: boolean;
  note?: string;
  entryDate: string;
}

export interface RecurringEntryPayload {
  name: string;
  categoryId: number;
  amount: number;
  hasVat: boolean;
  note?: string;
  frequency: RecurringFrequency;
  dayOf: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface LedgerRange {
  from?: string;
  to?: string;
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

export async function listLedgerEntries(params: LedgerRange & {
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

export async function getLedgerSummary(params: LedgerRange): Promise<LedgerSummary> {
  const { data } = await apiClient.get<LedgerSummary>("/api/ledger/summary", { params });
  return data;
}

export async function getProfitLoss(params: LedgerRange): Promise<ProfitLoss> {
  const { data } = await apiClient.get<ProfitLoss>("/api/ledger/profit-loss", { params });
  return data;
}

export async function getVatReport(params: LedgerRange): Promise<VatReport> {
  const { data } = await apiClient.get<VatReport>("/api/ledger/vat", { params });
  return data;
}

export async function listRecurringEntries(): Promise<RecurringEntry[]> {
  const { data } = await apiClient.get<RecurringEntry[]>("/api/ledger/recurring");
  return data;
}

export async function getRecurringDue(): Promise<RecurringDue> {
  const { data } = await apiClient.get<RecurringDue>("/api/ledger/recurring/due");
  return data;
}

export async function runRecurringEntries(): Promise<{ posted: number }> {
  const { data } = await apiClient.post<{ posted: number }>("/api/ledger/recurring/run");
  return data;
}

export async function createRecurringEntry(payload: RecurringEntryPayload) {
  const { data } = await apiClient.post("/api/ledger/recurring", payload);
  return data;
}

export async function updateRecurringEntry(id: number, payload: RecurringEntryPayload) {
  const { data } = await apiClient.put(`/api/ledger/recurring/${id}`, payload);
  return data;
}

export async function deleteRecurringEntry(id: number) {
  const { data } = await apiClient.delete(`/api/ledger/recurring/${id}`);
  return data;
}

export type LedgerExport = "entries" | "profit-loss" | "vat";

/**
 * The CSV endpoints answer with a file, not JSON, so the response is pulled as
 * a blob and handed to a throwaway anchor — the shared axios instance still
 * attaches the bearer token, which a plain `window.open` on the URL would not.
 */
export async function downloadLedgerCsv(kind: LedgerExport, params: LedgerRange): Promise<void> {
  const response = await apiClient.get(`/api/ledger/export/${kind}`, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${kind}-${params.from ?? ""}-${params.to ?? ""}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
