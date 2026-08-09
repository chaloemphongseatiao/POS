import apiClient from "./client";
import { Shift } from "@/lib/types";

/** The open shift, or null when the register is closed. */
export async function getCurrentShift(): Promise<Shift | null> {
  const { data } = await apiClient.get<Shift | null>("/api/shifts/current");
  return data;
}

export async function openShift(body: { openingCash: number; note?: string }): Promise<Shift> {
  const { data } = await apiClient.post<Shift>("/api/shifts/open", body);
  return data;
}

export async function closeShift(body: { closingCash: number; note?: string }): Promise<Shift> {
  const { data } = await apiClient.post<Shift>("/api/shifts/close", body);
  return data;
}

export async function listShifts(params?: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ shifts: Shift[]; total: number; page: number }> {
  const { data } = await apiClient.get("/api/shifts", { params });
  return data;
}

export async function getShift(id: number): Promise<Shift> {
  const { data } = await apiClient.get<Shift>(`/api/shifts/${id}`);
  return data;
}
