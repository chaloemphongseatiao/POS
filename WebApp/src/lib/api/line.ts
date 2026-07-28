import apiClient from "./client";
import { LineFollower } from "@/lib/types";

export async function listLineFollowers(): Promise<LineFollower[]> {
  const { data } = await apiClient.get<LineFollower[]>("/api/line/followers");
  return data;
}
