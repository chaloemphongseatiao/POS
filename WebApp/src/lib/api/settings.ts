import apiClient from "./client";

export async function getSettings(): Promise<Record<string, string>> {
  const { data } = await apiClient.get<Record<string, string>>("/api/settings");
  return data;
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  const { data } = await apiClient.get<Record<string, string>>("/api/settings/public");
  return data;
}

export async function upsertSetting(key: string, value: string) {
  const { data } = await apiClient.post("/api/settings", { key, value });
  return data;
}

export async function getBackup(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get("/api/settings/backup");
  return data;
}
