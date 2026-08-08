import apiClient from "./client";
import { LineFollower } from "@/lib/types";

export async function listLineFollowers(): Promise<LineFollower[]> {
  const { data } = await apiClient.get<LineFollower[]>("/api/line/followers");
  return data;
}

export interface LineBotInfo {
  basicId: string;
  displayName: string;
  chatMode?: string;
  addFriendUrl: string;
}

export async function getLineBotInfo(): Promise<LineBotInfo> {
  const { data } = await apiClient.get<LineBotInfo>("/api/line/bot-info");
  return data;
}

export async function syncLineFollowers(): Promise<{ total: number; added: number }> {
  const { data } = await apiClient.post<{ total: number; added: number }>("/api/line/followers/sync");
  return data;
}
