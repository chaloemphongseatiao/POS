import apiClient from "./client";
import { LineFollower } from "@/lib/types";

export async function listLineFollowers(): Promise<LineFollower[]> {
  const { data } = await apiClient.get<LineFollower[]>("/api/line/followers");
  return data;
}

export async function syncLineFollowers(): Promise<{ total: number; added: number }> {
  const { data } = await apiClient.post<{ total: number; added: number }>("/api/line/followers/sync");
  return data;
}
